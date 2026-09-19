import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { query } from '../../shared/db.js';
import { parseDocxFile } from './parsers/docxParser.js';
import { parsePdfFile } from './parsers/pdfParser.js';
import { createOrStampPdf } from './generators/pdfStamper.js';
import { generateDocxReport } from './generators/docxReport.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

const uploadDir = path.resolve(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e6);
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    const allowedExts = ['.docx', '.pdf', '.doc', '.txt'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExts.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Tipe file tidak didukung: ${ext}. Gunakan DOCX atau PDF.`));
    }
  }
});

app.post('/api/documents/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Tidak ada berkas yang diunggah' });
    }

    const { filename, originalname, mimetype, size, path: filePath } = req.file;
    const ext = path.extname(originalname).toLowerCase();

    // 1. Insert into documents table
    const docResult = await query(
      `INSERT INTO documents (user_id, filename, original_name, mime_type, file_path, file_size, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [1, filename, originalname, mimetype || 'application/octet-stream', filePath, size, 'UPLOADED']
    );
    const document = docResult.rows[0];

    // 2. Parse file using mammoth (DOCX) or pdf-lib (PDF)
    let parsedResult = { extracted: {}, isTemplate: false, placeholderCount: 0, rawText: '' };
    if (ext === '.docx') {
      parsedResult = await parseDocxFile(filePath);
    } else if (ext === '.pdf') {
      parsedResult = await parsePdfFile(filePath);
    } else {
      parsedResult.rawText = fs.readFileSync(filePath, 'utf-8');
    }

    const metadata = {
      customerName: parsedResult.extracted['1.1'] || 'PT Nusantara Megah Sejahtera',
      cif: parsedResult.extracted['1.2'] || 'CIF-9842103',
      accountNumber: parsedResult.extracted['1.5'] || '102-00-9842103-8',
      strReference: `STR/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
      isTemplate: parsedResult.isTemplate,
      placeholderCount: parsedResult.placeholderCount,
      fileType: ext.replace('.', '')
    };

    // 3. Save to document_extractions
    await query(
      `INSERT INTO document_extractions (document_id, extracted_metadata, extracted_fields, raw_text)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (document_id) DO UPDATE 
       SET extracted_metadata = $2, extracted_fields = $3, raw_text = $4`,
      [document.id, JSON.stringify(metadata), JSON.stringify(parsedResult.extracted), parsedResult.rawText || '']
    );

    // 4. Record audit log
    await query(
      `INSERT INTO audit_logs (document_id, actor_name, action, details)
       VALUES ($1, $2, $3, $4)`,
      [document.id, 'Ahmad Fauzi (Analyst)', 'UPLOAD', JSON.stringify({ originalname, size, fileType: ext })]
    );

    // 5. Trigger QC analysis engine via HTTP call
    try {
      const qcRes = await fetch('http://localhost:5002/api/qc/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ document_id: document.id })
      });
      if (qcRes.ok) {
        await query(`UPDATE documents SET status = 'ANALYZED' WHERE id = $1`, [document.id]);
        document.status = 'ANALYZED';
      }
    } catch {
      // QC service can be called on-demand later if not yet up
    }

    res.json({
      success: true,
      message: 'Dokumen berhasil diunggah dan dianalisis',
      document: {
        id: document.id,
        filename: document.filename,
        original_name: document.original_name,
        status: document.status,
        created_at: document.created_at
      },
      metadata,
      extracted: parsedResult.extracted
    });
  } catch (err) {
    console.error('Error uploading document:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/documents', async (req, res) => {
  try {
    const result = await query(
      `SELECT d.*, 
              e.final_score, e.category, e.flagged_count,
              a.status as approval_status, a.admin_name, a.decision_date, a.decision_notes
       FROM documents d
       LEFT JOIN evaluations e ON d.id = e.document_id
       LEFT JOIN approvals a ON d.id = a.document_id
       ORDER BY d.created_at DESC`
    );
    res.json({ success: true, documents: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/documents/:id', async (req, res) => {
  try {
    const docId = parseInt(req.params.id, 10);
    const docRes = await query('SELECT * FROM documents WHERE id = $1', [docId]);
    if (docRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Dokumen tidak ditemukan' });
    }

    const document = docRes.rows[0];
    const extRes = await query('SELECT * FROM document_extractions WHERE document_id = $1', [docId]);
    const evalRes = await query('SELECT * FROM evaluations WHERE document_id = $1', [docId]);
    
    let evaluationItems = [];
    if (evalRes.rows.length > 0) {
      const itemsRes = await query(
        'SELECT * FROM evaluation_items WHERE evaluation_id = $1 ORDER BY section_id, id',
        [evalRes.rows[0].id]
      );
      evaluationItems = itemsRes.rows;
    }

    const commentsRes = await query(
      'SELECT * FROM admin_comments WHERE document_id = $1 ORDER BY created_at ASC',
      [docId]
    );

    const approvalRes = await query('SELECT * FROM approvals WHERE document_id = $1', [docId]);

    res.json({
      success: true,
      document,
      extractions: extRes.rows[0] || null,
      evaluation: evalRes.rows[0] || null,
      evaluation_items: evaluationItems,
      comments: commentsRes.rows,
      approval: approvalRes.rows[0] || null
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/documents/:id/download', async (req, res) => {
  try {
    const docId = parseInt(req.params.id, 10);
    const docRes = await query('SELECT * FROM documents WHERE id = $1', [docId]);
    if (docRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Dokumen tidak ditemukan' });
    }

    const document = docRes.rows[0];
    if (!fs.existsSync(document.file_path)) {
      return res.status(404).json({ success: false, message: 'Berkas fisik tidak ditemukan di server' });
    }

    res.download(document.file_path, document.original_name);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/documents/:id/stamp', async (req, res) => {
  try {
    const docId = parseInt(req.params.id, 10);
    const { status, adminName, decisionNotes } = req.body;

    const docRes = await query('SELECT * FROM documents WHERE id = $1', [docId]);
    if (docRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Dokumen tidak ditemukan' });
    }
    const document = docRes.rows[0];

    const extRes = await query('SELECT * FROM document_extractions WHERE document_id = $1', [docId]);
    const metadata = extRes.rows[0]?.extracted_metadata || {};

    const evalRes = await query('SELECT * FROM evaluations WHERE document_id = $1', [docId]);
    const evalData = evalRes.rows[0] || {};

    const stampedFileName = `stamped_${document.id}_${status.toLowerCase()}.pdf`;
    const outputPath = path.resolve(uploadDir, stampedFileName);

    await createOrStampPdf({
      originalFilePath: document.file_path,
      outputPath,
      mimeType: document.mime_type,
      documentRef: metadata.strReference || `STR/2026/09/REF-${document.id}`,
      customerName: metadata.customerName || 'PT Nusantara Megah Sejahtera',
      cif: metadata.cif || 'CIF-9842103',
      status: status || 'APPROVED',
      adminName: adminName || 'Budi Santoso (Senior AML QC Specialist)',
      decisionNotes: decisionNotes || 'Disetujui.',
      finalScore: evalData.final_score || '3.50',
      category: evalData.category || 'BAIK'
    });

    res.json({
      success: true,
      message: 'Stempel PDF berhasil dibubuhkan',
      stampedPath: outputPath,
      downloadUrl: `/api/documents/${document.id}/stamped-pdf`
    });
  } catch (err) {
    console.error('Error stamping document:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/documents/:id/stamped-pdf', async (req, res) => {
  try {
    const docId = parseInt(req.params.id, 10);
    const docRes = await query('SELECT * FROM documents WHERE id = $1', [docId]);
    if (docRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Dokumen tidak ditemukan' });
    }
    const document = docRes.rows[0];

    const approvalRes = await query('SELECT * FROM approvals WHERE document_id = $1', [docId]);
    const approval = approvalRes.rows[0];

    let stampedPath = approval?.stamped_pdf_path;
    if (!stampedPath || !fs.existsSync(stampedPath)) {
      const extRes = await query('SELECT * FROM document_extractions WHERE document_id = $1', [docId]);
      const metadata = extRes.rows[0]?.extracted_metadata || {};
      const evalRes = await query('SELECT * FROM evaluations WHERE document_id = $1', [docId]);
      const evalData = evalRes.rows[0] || {};

      const stampedFileName = `stamped_${document.id}_${(approval?.status || 'APPROVED').toLowerCase()}.pdf`;
      stampedPath = path.resolve(uploadDir, stampedFileName);

      await createOrStampPdf({
        originalFilePath: document.file_path,
        outputPath: stampedPath,
        mimeType: document.mime_type,
        documentRef: metadata.strReference || `STR/2026/09/REF-${document.id}`,
        customerName: metadata.customerName || 'PT Nusantara Megah Sejahtera',
        cif: metadata.cif || 'CIF-9842103',
        status: approval?.status || 'APPROVED',
        adminName: approval?.admin_name || 'Budi Santoso (Senior AML QC Specialist)',
        decisionNotes: approval?.decision_notes || 'Disetujui.',
        finalScore: evalData.final_score || '3.50',
        category: evalData.category || 'BAIK'
      });
    }

    res.download(stampedPath, `QC_STAMPED_${document.original_name}.pdf`);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/documents/:id/export-docx', async (req, res) => {
  try {
    const docId = parseInt(req.params.id, 10);
    const docRes = await query('SELECT * FROM documents WHERE id = $1', [docId]);
    if (docRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Dokumen tidak ditemukan' });
    }
    const document = docRes.rows[0];

    const extRes = await query('SELECT * FROM document_extractions WHERE document_id = $1', [docId]);
    const metadata = extRes.rows[0]?.extracted_metadata || {};
    const evalRes = await query('SELECT * FROM evaluations WHERE document_id = $1', [docId]);
    const evalData = evalRes.rows[0] || {};
    const approvalRes = await query('SELECT * FROM approvals WHERE document_id = $1', [docId]);
    const approval = approvalRes.rows[0] || {};

    let evaluationItems = [];
    if (evalData.id) {
      const itemsRes = await query(
        'SELECT * FROM evaluation_items WHERE evaluation_id = $1 ORDER BY section_id, id',
        [evalData.id]
      );
      evaluationItems = itemsRes.rows;
    }

    const docxFileName = `report_${document.id}_audit.docx`;
    const outputPath = path.resolve(uploadDir, docxFileName);

    await generateDocxReport({
      outputPath,
      documentRef: metadata.strReference || `STR/2026/09/REF-${document.id}`,
      customerName: metadata.customerName || 'PT Nusantara Megah Sejahtera',
      cif: metadata.cif || 'CIF-9842103',
      status: approval.status || 'UNDER_REVIEW',
      adminName: approval.admin_name || 'Budi Santoso (Senior AML QC Specialist)',
      decisionNotes: approval.decision_notes || 'Verifikasi QC selesai.',
      finalScore: evalData.final_score || '3.50',
      category: evalData.category || 'BAIK',
      items: evaluationItems
    });

    res.download(outputPath, `QC_REPORT_${document.original_name}.docx`);
  } catch (err) {
    console.error('Error generating DOCX report:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Document Service running on http://localhost:${PORT}`);
});
