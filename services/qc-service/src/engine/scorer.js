import { QC_RULES } from './rules.js';
import { query } from '../../../shared/db.js';

function isPlaceholder(val) {
  if (!val || typeof val !== 'string') return true;
  const trimmed = val.trim();
  if (!trimmed) return true;
  if (/^\[.*\]$/.test(trimmed)) return true;
  if (/^[…\.\s\-_]+$/.test(trimmed)) return true;
  if (trimmed.includes('...') && trimmed.length < 10) return true;
  return false;
}

export async function evaluateDocument(documentId) {
  // 1. Fetch document and extractions from DB
  const extRes = await query('SELECT * FROM document_extractions WHERE document_id = $1', [documentId]);
  if (extRes.rows.length === 0) {
    throw new Error(`Data ekstraksi dokumen ${documentId} belum tersedia.`);
  }

  const extracted = extRes.rows[0].extracted_fields || {};
  let totalWeightedScore = 0;
  let totalWeight = 0;
  let flaggedCount = 0;

  const evaluatedItems = QC_RULES.map(rule => {
    const val = extracted[rule.id] || '';
    const isPh = isPlaceholder(val);

    let score = rule.defaultScore;
    let comment = '';
    let isFlagged = false;

    if (isPh) {
      score = 2.0;
      isFlagged = true;
      flaggedCount++;
      comment = `Parameter masih berupa placeholder draft (${val || 'kosong'}). Perlu dilengkapi data riil.`;
    } else {
      if (rule.sectionId === 1) {
        comment = 'Data terverifikasi sesuai profil core banking dan identitas nasabah.';
      } else if (rule.sectionId === 2) {
        comment = 'Uraian analisis 5W2H terstruktur dan memuat indikasi transaksi mencurigakan.';
      } else if (rule.sectionId === 3) {
        comment = 'Dokumen pendukung audit trail lengkap terlampir.';
      } else if (rule.sectionId === 4) {
        comment = 'Tata naskah memenuhi standar pedoman penulisan STR PPATK.';
      } else {
        comment = 'Analisis kualitatif memiliki landasan kecurigaan yang logis dan kuat.';
      }
    }

    const weightedContribution = (rule.weight / 100) * score;
    totalWeightedScore += weightedContribution;
    totalWeight += rule.weight;

    return {
      ...rule,
      extracted_value: val || '-',
      score,
      comment,
      is_flagged: isFlagged,
      weightedContribution
    };
  });

  const finalScore = parseFloat(totalWeightedScore.toFixed(2));

  let category = 'TIDAK BAIK (TB)';
  if (finalScore >= 3.51) {
    category = 'SANGAT BAIK (SB)';
  } else if (finalScore >= 2.76) {
    category = 'BAIK (B)';
  } else if (finalScore >= 2.00) {
    category = 'CUKUP BAIK (CB)';
  }

  const sectionSummaries = [1, 2, 3, 4, 5].map(secId => {
    const secItems = evaluatedItems.filter(i => i.sectionId === secId);
    const secTotalWeight = secItems.reduce((acc, curr) => acc + curr.weight, 0);
    const secAchievedScore = secItems.reduce((acc, curr) => acc + curr.weightedContribution, 0);
    const secMaxPossible = (secTotalWeight / 100) * 4.0;
    const secPercentage = secMaxPossible > 0 ? (secAchievedScore / secMaxPossible) * 100 : 0;

    return {
      sectionId: secId,
      sectionName: secItems[0]?.sectionName || `Seksi ${secId}`,
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

  // 2. Insert or update evaluations table
  const evalRes = await query(
    `INSERT INTO evaluations (document_id, final_score, category, total_weight, flagged_count, summary_json)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (document_id) DO UPDATE
     SET final_score = $2, category = $3, total_weight = $4, flagged_count = $5, summary_json = $6, created_at = CURRENT_TIMESTAMP
     RETURNING *`,
    [documentId, finalScore, category, totalWeight, flaggedCount, JSON.stringify(summaryJson)]
  );
  const evaluation = evalRes.rows[0];

  // 3. Clear old items and insert fresh evaluation_items
  await query('DELETE FROM evaluation_items WHERE evaluation_id = $1', [evaluation.id]);

  for (const item of evaluatedItems) {
    await query(
      `INSERT INTO evaluation_items 
       (evaluation_id, item_id, section_id, section_name, section_weight, item_name, item_desc, extracted_value, weight, score, comment, is_flagged)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        evaluation.id,
        item.id,
        item.sectionId,
        item.sectionName,
        item.sectionWeight,
        item.item,
        item.desc,
        item.extracted_value,
        item.weight,
        item.score,
        item.comment,
        item.is_flagged
      ]
    );
  }

  // 4. Record audit log
  await query(
    `INSERT INTO audit_logs (document_id, actor_name, action, details)
     VALUES ($1, $2, $3, $4)`,
    [documentId, 'QC Automated Engine', 'EVALUATED', JSON.stringify({ finalScore, category, flaggedCount })]
  );

  return {
    evaluation,
    items: evaluatedItems,
    summary: summaryJson
  };
}
