import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs';
import path from 'path';

export async function createOrStampPdf({
  originalFilePath,
  outputPath,
  mimeType,
  documentRef,
  customerName,
  cif,
  status, // 'APPROVED' | 'REJECTED' | 'RETURN_FOR_REWORK'
  adminName,
  decisionNotes,
  finalScore,
  category
}) {
  let pdfDoc;

  if (mimeType === 'application/pdf' && fs.existsSync(originalFilePath)) {
    try {
      const existingPdfBytes = fs.readFileSync(originalFilePath);
      pdfDoc = await PDFDocument.load(existingPdfBytes, { ignoreEncryption: true });
    } catch {
      pdfDoc = await PDFDocument.create();
    }
  } else {
    pdfDoc = await PDFDocument.create();
  }

  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const isApproved = status === 'APPROVED';
  const isRejected = status === 'REJECTED';
  
  const statusColor = isApproved 
    ? rgb(0.08, 0.64, 0.29) // Emerald Green
    : isRejected 
      ? rgb(0.86, 0.15, 0.15) // Red
      : rgb(0.85, 0.47, 0.02); // Amber

  const statusBg = isApproved 
    ? rgb(0.93, 0.98, 0.94) 
    : isRejected 
      ? rgb(0.99, 0.93, 0.93) 
      : rgb(0.99, 0.96, 0.89);

  // If new document or empty, add a certificate page
  if (pdfDoc.getPageCount() === 0) {
    const page = pdfDoc.addPage([595.28, 841.89]); // A4
    const { width, height } = page.getSize();

    // Top Header
    page.drawRectangle({
      x: 36,
      y: height - 90,
      width: width - 72,
      height: 60,
      color: rgb(0.03, 0.34, 0.76), // Pantone 2132 C
    });

    page.drawText('BANK COMPLIANCE & AML QUALITY CONTROL CERTIFICATE', {
      x: 52,
      y: height - 55,
      size: 14,
      font: helveticaBold,
      color: rgb(1, 1, 1),
    });

    page.drawText('LEMBAR HASIL PENELITIAN & PERSETUJUAN DOKUMEN STR', {
      x: 52,
      y: height - 74,
      size: 10,
      font: helveticaFont,
      color: rgb(0.85, 0.92, 1),
    });

    // Metadata Card
    page.drawRectangle({
      x: 36,
      y: height - 260,
      width: width - 72,
      height: 155,
      color: rgb(0.97, 0.98, 0.99),
      borderColor: rgb(0.85, 0.88, 0.92),
      borderWidth: 1,
    });

    const metaY = height - 125;
    page.drawText('INFORMASI DOKUMEN STR', {
      x: 52,
      y: metaY,
      size: 11,
      font: helveticaBold,
      color: rgb(0.1, 0.15, 0.2),
    });

    const metaRows = [
      ['Nomor Referensi STR', documentRef || 'STR/2026/09/REF-001'],
      ['Nama Nasabah', customerName || 'PT Nusantara Megah Sejahtera'],
      ['Nomor CIF', cif || 'CIF-9842103'],
      ['Tanggal Evaluasi', new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })],
      ['Skor Mutu QC', `${finalScore || '3.50'} / 4.00 (${category || 'BAIK'})`]
    ];

    metaRows.forEach(([lbl, val], idx) => {
      const y = metaY - 22 - (idx * 20);
      page.drawText(lbl + ':', {
        x: 52,
        y,
        size: 9.5,
        font: helveticaBold,
        color: rgb(0.3, 0.35, 0.4),
      });
      page.drawText(String(val), {
        x: 200,
        y,
        size: 9.5,
        font: helveticaFont,
        color: rgb(0.05, 0.05, 0.05),
      });
    });

    // Decision Stamp Box
    const stampY = height - 420;
    page.drawRectangle({
      x: 36,
      y: stampY,
      width: width - 72,
      height: 140,
      color: statusBg,
      borderColor: statusColor,
      borderWidth: 2,
    });

    page.drawText(`STATUS: ${status.replace(/_/g, ' ')}`, {
      x: 52,
      y: stampY + 105,
      size: 16,
      font: helveticaBold,
      color: statusColor,
    });

    page.drawText(`Penelaah / QC Admin: ${adminName || 'Budi Santoso (Senior AML QC Specialist)'}`, {
      x: 52,
      y: stampY + 80,
      size: 10,
      font: helveticaBold,
      color: rgb(0.1, 0.15, 0.2),
    });

    page.drawText(`Waktu Keputusan: ${new Date().toLocaleString('id-ID')}`, {
      x: 52,
      y: stampY + 62,
      size: 9.5,
      font: helveticaFont,
      color: rgb(0.25, 0.3, 0.35),
    });

    page.drawText('Catatan / Rekomendasi Admin:', {
      x: 52,
      y: stampY + 42,
      size: 9.5,
      font: helveticaBold,
      color: rgb(0.2, 0.25, 0.3),
    });

    const noteText = (decisionNotes || 'Dokumen memenuhi standar kelengkapan STR PPATK. Disetujui untuk diteruskan.').substring(0, 110);
    page.drawText(`"${noteText}"`, {
      x: 52,
      y: stampY + 24,
      size: 9,
      font: helveticaFont,
      color: rgb(0.15, 0.2, 0.25),
    });

    // Footer
    page.drawText('Dokumen ini dihasilkan secara otomatis oleh AML STR Quality Control Engine.', {
      x: 52,
      y: 40,
      size: 8,
      font: helveticaFont,
      color: rgb(0.5, 0.55, 0.6),
    });

  } else {
    // Stamp the first page of the existing PDF
    const firstPage = pdfDoc.getPages()[0];
    const { width, height } = firstPage.getSize();

    // Semi-transparent / Solid Stamp Box in the top right or bottom
    const boxW = 260;
    const boxH = 80;
    const boxX = width - boxW - 20;
    const boxY = height - boxH - 20;

    firstPage.drawRectangle({
      x: boxX,
      y: boxY,
      width: boxW,
      height: boxH,
      color: statusBg,
      borderColor: statusColor,
      borderWidth: 2,
    });

    firstPage.drawText(`AML QC: ${status.replace(/_/g, ' ')}`, {
      x: boxX + 12,
      y: boxY + boxH - 24,
      size: 12,
      font: helveticaBold,
      color: statusColor,
    });

    firstPage.drawText(`By: ${adminName || 'Admin QC'} | ${new Date().toLocaleDateString('id-ID')}`, {
      x: boxX + 12,
      y: boxY + boxH - 42,
      size: 8.5,
      font: helveticaFont,
      color: rgb(0.1, 0.15, 0.2),
    });

    firstPage.drawText(`Score: ${finalScore || '3.50'} (${category || 'BAIK'})`, {
      x: boxX + 12,
      y: boxY + boxH - 58,
      size: 8.5,
      font: helveticaBold,
      color: rgb(0.1, 0.15, 0.2),
    });

    const note = (decisionNotes || 'Verified').substring(0, 36);
    firstPage.drawText(`"${note}"`, {
      x: boxX + 12,
      y: boxY + boxH - 72,
      size: 7.5,
      font: helveticaFont,
      color: rgb(0.3, 0.35, 0.4),
    });
  }

  const pdfBytes = await pdfDoc.save();
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(outputPath, pdfBytes);

  return outputPath;
}
