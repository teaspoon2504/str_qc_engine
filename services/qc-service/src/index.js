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

app.listen(PORT, () => {
  console.log(`QC Scoring Service running on http://localhost:${PORT}`);
});
