import express from 'express';
import cors from 'cors';
import { evaluateDocument } from './engine/scorer.js';
import { QC_RULES } from './engine/rules.js';
import { query } from '../../shared/db.js';

const app = express();
const PORT = process.env.PORT || 5002;

app.use(cors());
app.use(express.json());

app.post('/api/qc/evaluate', async (req, res) => {
  try {
    const { document_id } = req.body;
    if (!document_id) {
      return res.status(400).json({ success: false, message: 'document_id diperlukan' });
    }

    const result = await evaluateDocument(parseInt(document_id, 10));
    res.json({
      success: true,
      message: 'Evaluasi dokumen STR berhasil dilakukan',
      data: result
    });
  } catch (err) {
    console.error('Error evaluating document:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/qc/evaluations/:documentId', async (req, res) => {
  try {
    const documentId = parseInt(req.params.documentId, 10);
    const evalRes = await query('SELECT * FROM evaluations WHERE document_id = $1', [documentId]);
    if (evalRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Evaluasi belum dilakukan untuk dokumen ini' });
    }

    const evaluation = evalRes.rows[0];
    const itemsRes = await query(
      'SELECT * FROM evaluation_items WHERE evaluation_id = $1 ORDER BY section_id, id',
      [evaluation.id]
    );

    res.json({
      success: true,
      evaluation,
      items: itemsRes.rows
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/qc/rules', (req, res) => {
  res.json({
    success: true,
    totalRules: QC_RULES.length,
    rules: QC_RULES
  });
});

app.post('/api/qc/override-score', async (req, res) => {
  try {
    const { document_id, item_id, evaluation_item_id, score, actor_name } = req.body || {};
    if (!document_id || (!item_id && !evaluation_item_id) || score === undefined) {
      return res.status(400).json({ success: false, message: 'document_id, item_id, dan score diperlukan' });
    }

    const docId = parseInt(document_id, 10);
    const newScore = parseFloat(score);

    const evalRes = await query('SELECT * FROM evaluations WHERE document_id = $1', [docId]);
    if (evalRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Evaluasi dokumen tidak ditemukan' });
    }
    const evaluation = evalRes.rows[0];

    const isFlagged = newScore < 3.0;
    const comment = isFlagged 
      ? `Skor disunting admin (${newScore.toFixed(1)}). Parameter dinilai perlu perhatian.` 
      : `Skor disesuaikan admin (${newScore.toFixed(1)}). Parameter telah diverifikasi valid.`;

    if (evaluation_item_id) {
      await query(
        'UPDATE evaluation_items SET score = $1, is_flagged = $2, comment = $3 WHERE id = $4 AND evaluation_id = $5',
        [newScore, isFlagged, comment, evaluation_item_id, evaluation.id]
      );
    } else {
      await query(
        'UPDATE evaluation_items SET score = $1, is_flagged = $2, comment = $3 WHERE item_id = $4 AND evaluation_id = $5',
        [newScore, isFlagged, comment, item_id, evaluation.id]
      );
    }

    const allItemsRes = await query(
      'SELECT * FROM evaluation_items WHERE evaluation_id = $1 ORDER BY section_id, id',
      [evaluation.id]
    );
    const allItems = allItemsRes.rows;

    let totalWeightedScore = 0;
    let totalWeight = 0;
    let flaggedCount = 0;

    allItems.forEach(i => {
      const s = Number(i.score);
      const w = Number(i.weight);
      totalWeightedScore += (w / 100) * s;
      totalWeight += w;
      if (i.is_flagged || s < 3.0) flaggedCount++;
    });

    const finalScore = parseFloat(totalWeightedScore.toFixed(2));
    let category = 'TIDAK BAIK (TB)';
    if (finalScore >= 3.51) category = 'SANGAT BAIK (SB)';
    else if (finalScore >= 2.76) category = 'BAIK (B)';
    else if (finalScore >= 2.00) category = 'CUKUP BAIK (CB)';

    const sectionSummaries = [1, 2, 3, 4, 5].map(secId => {
      const secItems = allItems.filter(i => i.section_id === secId);
      const secTotalWeight = secItems.reduce((acc, curr) => acc + Number(curr.weight), 0);
      const secAchievedScore = secItems.reduce((acc, curr) => acc + ((Number(curr.weight) / 100) * Number(curr.score)), 0);
      const secMaxPossible = (secTotalWeight / 100) * 4.0;
      const secPercentage = secMaxPossible > 0 ? (secAchievedScore / secMaxPossible) * 100 : 0;

      return {
        sectionId: secId,
        sectionName: secItems[0]?.section_name || `Seksi ${secId}`,
        secTotalWeight: parseFloat(secTotalWeight.toFixed(2)),
        secAchievedScore: parseFloat(secAchievedScore.toFixed(2)),
        secMaxPossible: parseFloat(secMaxPossible.toFixed(2)),
        secPercentage: parseFloat(secPercentage.toFixed(1))
      };
    });

    const summaryJson = {
      totalWeight: parseFloat(totalWeight.toFixed(2)),
      finalScore,
      category,
      flaggedCount,
      sectionSummaries
    };

    await query(
      `UPDATE evaluations 
       SET final_score = $1, category = $2, flagged_count = $3, summary_json = $4 
       WHERE id = $5`,
      [finalScore, category, flaggedCount, JSON.stringify(summaryJson), evaluation.id]
    );

    try {
      await query(
        `INSERT INTO audit_logs (document_id, actor_name, action, details)
         VALUES ($1, $2, $3, $4)`,
        [docId, actor_name || 'Admin (Reviewer)', 'OVERRIDE_SCORE', JSON.stringify({ item_id, newScore, previousScore: evaluation.final_score, newFinalScore: finalScore })]
      );
    } catch (auditErr) {
      console.warn('Could not record audit log:', auditErr.message);
    }

    res.json({
      success: true,
      message: `Skor parameter ${item_id || evaluation_item_id} berhasil diperbarui menjadi ${newScore}`,
      evaluation: {
        ...evaluation,
        final_score: finalScore,
        category,
        flagged_count: flaggedCount,
        summary_json: summaryJson
      },
      items: allItems
    });
  } catch (err) {
    console.error('Error overriding score:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`QC Scoring Service running on http://localhost:${PORT}`);
});
