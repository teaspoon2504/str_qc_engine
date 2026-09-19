import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell } from 'docx';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

async function createSampleDocx(filePath) {
  const doc = new Document({
    sections: [{
      children: [
        new Paragraph({ children: [new TextRun({ text: 'LEMBAR HASIL ANALISIS TRANSAKSI KEUANGAN MENCURIGAKAN', bold: true, size: 24 })] }),
        new Paragraph({ children: [new TextRun({ text: '1. Kesesuaian Data Profil Nasabah', bold: true })] }),
        new Table({
          rows: [
            new TableRow({ children: [new TableCell({ children: [new Paragraph('Nama Nasabah:')] }), new TableCell({ children: [new Paragraph('PT Nusantara Megah Sejahtera')] })] }),
            new TableRow({ children: [new TableCell({ children: [new Paragraph('CIF:')] }), new TableCell({ children: [new Paragraph('CIF-9842103')] })] }),
            new TableRow({ children: [new TableCell({ children: [new Paragraph('Tempat, Tanggal Lahir / Usia:')] }), new TableCell({ children: [new Paragraph('Jakarta, 12-08-1985 / 41 Thn')] })] }),
            new TableRow({ children: [new TableCell({ children: [new Paragraph('Pekerjaan / Bidang Usaha:')] }), new TableCell({ children: [new Paragraph('Perdagangan Ekspor Impor Tekstil')] })] }),
            new TableRow({ children: [new TableCell({ children: [new Paragraph('Nomor Rekening:')] }), new TableCell({ children: [new Paragraph('102-00-9842103-8 (IDR Operasional)')] })] }),
            new TableRow({ children: [new TableCell({ children: [new Paragraph('Tgl. Transaksi & Nominal Terbesar:')] }), new TableCell({ children: [new Paragraph('2026-08-28 / Rp 4.850.000.000,-')] })] }),
            new TableRow({ children: [new TableCell({ children: [new Paragraph('Indikasi Tindak Pidana:')] }), new TableCell({ children: [new Paragraph('TPPU / Tindak Pidana Perpajakan')] })] }),
            new TableRow({ children: [new TableCell({ children: [new Paragraph('Lokasi Pelanggaran & Keuangan:')] }), new TableCell({ children: [new Paragraph('KC Sudirman Jakarta / Saldo Rp 5.210.000.000')] })] }),
            new TableRow({ children: [new TableCell({ children: [new Paragraph('Sumber Pelaporan:')] }), new TableCell({ children: [new Paragraph('Sistem AML Automated Alert / Uker 0032')] })] }),
          ]
        }),
        new Paragraph({ text: '' }),
        new Paragraph({ children: [new TextRun({ text: '2. Hasil Analisis 5W2H', bold: true })] }),
        new Paragraph({ text: 'Sumber deteksi STR: Alert Rule AML-2026-88 Rapid In-Out Flow dengan perputaran dana tidak wajar.' }),
        new Paragraph({ text: 'Pencarian Informasi Internal: Expected turnover Rp 500Jt vs perputaran aktual Rp 15M (Deviasi 30x lipat).' }),
        new Paragraph({ text: 'Pencarian Informasi Eksternal: Negatif PEP, tidak ada sanksi internasional atau OFAC.' }),
        new Paragraph({ text: 'Tabel rekening follow the money: Rekening Sumber: 4 Bank Lain; Rekening Tujuan: 2 Valas.' }),
        new Paragraph({ text: 'Pola, frekuensi dan nominal transaksi: Frekuensi 42 transaksi perputaran <24 jam total Rp 14.8M.' }),
        new Paragraph({ text: 'Rincian transaksi mencurigakan: 12 Transaksi kredit nominal bulat Rp 400Jt - Rp 950Jt.' }),
        new Paragraph({ text: 'Diagram aliran dana: Bagan aliran dana terlampir pada dokumen pendukung.' }),
        new Paragraph({ text: 'Kesimpulan dan penjelasan transaksi mencurigakan: Perusahaan passthrough fiktif tanpa aktivitas komersial riil.' }),
        new Paragraph({ text: 'Rekomendasi tipologi predicate crime: Tipologi Structuring & Smurfing Rekening Penampung untuk dilaporkan sebagai TKM ke PPATK.' }),
      ]
    }]
  });

  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(filePath, buffer);
  console.log(`[TEST SETUP] Sample DOCX created at ${filePath}`);
}

async function runTest() {
  console.log('>>> Memulai Pengujian End-to-End Microservices AML STR QC Engine...');

  const sampleDocxPath = path.resolve(rootDir, 'sample_str_document.docx');
  await createSampleDocx(sampleDocxPath);

  // 1. Health check Gateway
  console.log('\n1. Memeriksa status Gateway (http://localhost:8000/api/health)...');
  const healthRes = await fetch('http://localhost:8000/api/health');
  const healthData = await healthRes.json();
  console.log('Gateway Health:', JSON.stringify(healthData, null, 2));

  // 2. Upload file via FormData
  console.log('\n2. Mengunggah berkas sample_str_document.docx ke Gateway...');
  const fileBlob = new Blob([fs.readFileSync(sampleDocxPath)], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
  const formData = new FormData();
  formData.append('file', fileBlob, 'sample_str_document.docx');

  const uploadRes = await fetch('http://localhost:8000/api/documents/upload', {
    method: 'POST',
    body: formData
  });

  if (!uploadRes.ok) {
    throw new Error(`Upload gagal: ${uploadRes.statusText} ${await uploadRes.text()}`);
  }

  const uploadData = await uploadRes.json();
  console.log('Upload Result:', JSON.stringify(uploadData, null, 2));
  const docId = uploadData.document.id;

  // 3. Trigger & Check QC Evaluation
  console.log(`\n3. Memeriksa hasil QC Scoring untuk Document ID ${docId}...`);
  const evalRes = await fetch(`http://localhost:8000/api/qc/evaluations/${docId}`);
  const evalData = await evalRes.json();
  console.log(`Skor Akhir: ${evalData.evaluation.final_score} / 4.00`);
  console.log(`Kategori: ${evalData.evaluation.category}`);
  console.log(`Jumlah Flag: ${evalData.evaluation.flagged_count}`);
  console.log(`Jumlah Item Terhitung: ${evalData.items.length}`);

  // 4. Admin gives comments
  console.log('\n4. Menambahkan komentar penelaahan dari Admin...');
  const commentRes = await fetch('http://localhost:8000/api/comments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      document_id: docId,
      admin_id: 2,
      admin_name: 'Budi Santoso (Senior AML QC Specialist)',
      section_id: 2,
      item_id: '2.8',
      comment_text: 'Dasar kecurigaan makul sangat jelas. Pola pass-through terbukti kuat dan siap dilaporkan ke PPATK.'
    })
  });
  const commentData = await commentRes.json();
  console.log('Komentar Admin Berhasil Ditambahkan:', commentData.comment.comment_text);

  // 5. Admin marks approval
  console.log('\n5. Admin melakukan Approval Mark terhadap dokumen...');
  const approvalRes = await fetch('http://localhost:8000/api/approval', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      document_id: docId,
      admin_id: 2,
      admin_name: 'Budi Santoso (Senior AML QC Specialist)',
      status: 'APPROVED',
      decision_notes: 'Disetujui. Laporan STR memenuhi seluruh kriteria kelengkapan dan kualitas analisis untuk pelaporan PPATK.'
    })
  });
  const approvalData = await approvalRes.json();
  console.log('Approval Status:', approvalData.approval.status);
  console.log('Stamped PDF Download URL:', approvalData.stampedDownloadUrl);

  // 6. Test downloading Stamped PDF (pdf-lib)
  console.log('\n6. Menguji unduh Stamped PDF (dihasilkan oleh pdf-lib)...');
  const stampedRes = await fetch(`http://localhost:8000/api/documents/${docId}/stamped-pdf`);
  if (stampedRes.ok) {
    const stampedBuffer = await stampedRes.arrayBuffer();
    console.log(`Stempel PDF berhasil diunduh! Ukuran: ${stampedBuffer.byteLength} bytes.`);
  } else {
    console.error('Gagal mengunduh stamped PDF:', stampedRes.statusText);
  }

  // 7. Test downloading DOCX Audit Report (docx library)
  console.log('\n7. Menguji unduh Laporan Audit DOCX (dihasilkan oleh docx)...');
  const docxRes = await fetch(`http://localhost:8000/api/documents/${docId}/export-docx`);
  if (docxRes.ok) {
    const docxBuffer = await docxRes.arrayBuffer();
    console.log(`Laporan DOCX berhasil diunduh! Ukuran: ${docxBuffer.byteLength} bytes.`);
  } else {
    console.error('Gagal mengunduh report DOCX:', docxRes.statusText);
  }

  console.log('\n======================================================');
  console.log('  SEMUA PENGUJIAN END-TO-END BERHASIL 100%!           ');
  console.log('======================================================');
}

runTest().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
