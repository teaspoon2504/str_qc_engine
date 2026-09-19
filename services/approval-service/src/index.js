import express from 'express';
import cors from 'cors';
import { query } from '../../shared/db.js';

const app = express();
const PORT = process.env.PORT || 5003;

app.use(cors());
app.use(express.json());

// --- Comment Endpoints ---
app.post('/api/comments', async (req, res) => {
  try {
    const { document_id, admin_id, admin_name, section_id, item_id, comment_text } = req.body;
    if (!document_id || !comment_text || !comment_text.trim()) {
      return res.status(400).json({ success: false, message: 'document_id dan isi komentar wajib diisi' });
    }

    const reviewerName = admin_name || 'Budi Santoso (Senior AML QC Specialist)';
    const reviewerId = admin_id || 2;

    const result = await query(
      `INSERT INTO admin_comments (document_id, admin_id, admin_name, section_id, item_id, comment_text)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [document_id, reviewerId, reviewerName, section_id || null, item_id || null, comment_text.trim()]
    );
    const comment = result.rows[0];

    // Audit log
    await query(
      `INSERT INTO audit_logs (document_id, actor_name, action, details)
       VALUES ($1, $2, $3, $4)`,
      [document_id, reviewerName, 'COMMENT_ADDED', JSON.stringify({ item_id, section_id, preview: comment_text.substring(0, 50) })]
    );

    res.json({
      success: true,
      message: 'Komentar penelaahan berhasil disimpan',
      comment
    });
  } catch (err) {
    console.error('Error adding comment:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/comments/:documentId', async (req, res) => {
  try {
    const documentId = parseInt(req.params.documentId, 10);
    const result = await query(
      'SELECT * FROM admin_comments WHERE document_id = $1 ORDER BY created_at ASC',
      [documentId]
    );
    res.json({ success: true, comments: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// --- Approval & Decision Endpoints ---
app.post('/api/approval', async (req, res) => {
  try {
    const { document_id, admin_id, admin_name, status, decision_notes } = req.body;
    if (!document_id || !status) {
      return res.status(400).json({ success: false, message: 'document_id dan status approval diperlukan' });
    }

    const validStatuses = ['APPROVED', 'REJECTED', 'RETURN_FOR_REWORK'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: `Status tidak valid. Pilihan: ${validStatuses.join(', ')}` });
    }

    const reviewerName = admin_name || 'Budi Santoso (Senior AML QC Specialist)';
    const reviewerId = admin_id || 2;
    const notes = decision_notes || (status === 'APPROVED' ? 'Dokumen STR disetujui untuk dilaporkan ke regulator.' : 'Dokumen memerlukan perbaikan.');

    // 1. Insert or update approvals table
    const approvalRes = await query(
      `INSERT INTO approvals (document_id, admin_id, admin_name, status, decision_notes, decision_date)
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
       ON CONFLICT (document_id) DO UPDATE
       SET status = $4, admin_id = $2, admin_name = $3, decision_notes = $5, decision_date = CURRENT_TIMESTAMP
       RETURNING *`,
      [document_id, reviewerId, reviewerName, status, notes]
    );
    const approval = approvalRes.rows[0];

    // 2. Update documents table status
    await query('UPDATE documents SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [status, document_id]);

    // 3. Trigger digital PDF stamping via Document Service
    let stampedPdfPath = null;
    try {
      const stampRes = await fetch(`http://localhost:5001/api/documents/${document_id}/stamp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          adminName: reviewerName,
          decisionNotes: notes
        })
      });
      if (stampRes.ok) {
        const stampData = await stampRes.json();
        stampedPdfPath = stampData.stampedPath;
        await query('UPDATE approvals SET stamped_pdf_path = $1 WHERE id = $2', [stampedPdfPath, approval.id]);
        approval.stamped_pdf_path = stampedPdfPath;
      }
    } catch (err) {
      console.warn('PDF Stamping call notice:', err.message);
    }

    // 4. Audit log
    await query(
      `INSERT INTO audit_logs (document_id, actor_name, action, details)
       VALUES ($1, $2, $3, $4)`,
      [document_id, reviewerName, 'APPROVAL_MARKED', JSON.stringify({ status, notes })]
    );

    res.json({
      success: true,
      message: `Keputusan dokumen STR berhasil ditetapkan sebagai: ${status}`,
      approval,
      stampedDownloadUrl: `/api/documents/${document_id}/stamped-pdf`
    });
  } catch (err) {
    console.error('Error recording approval decision:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/approval/:documentId', async (req, res) => {
  try {
    const documentId = parseInt(req.params.documentId, 10);
    const result = await query('SELECT * FROM approvals WHERE document_id = $1', [documentId]);
    if (result.rows.length === 0) {
      return res.json({ success: true, approval: null });
    }
    res.json({ success: true, approval: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// --- Audit Trail Endpoints ---
app.get('/api/audit-trail/:documentId', async (req, res) => {
  try {
    const documentId = parseInt(req.params.documentId, 10);
    const result = await query(
      'SELECT * FROM audit_logs WHERE document_id = $1 ORDER BY created_at ASC',
      [documentId]
    );
    res.json({ success: true, auditLogs: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Approval & Review Service running on http://localhost:${PORT}`);
});
