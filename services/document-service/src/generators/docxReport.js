import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, BorderStyle, HeadingLevel, AlignmentType } from 'docx';
import fs from 'fs';
import path from 'path';

export async function generateDocxReport({
  outputPath,
  documentRef,
  customerName,
  cif,
  status,
  adminName,
  decisionNotes,
  finalScore,
  category,
  items = []
}) {
  const tableBorder = {
    top: { style: BorderStyle.SINGLE, size: 1, color: 'D0D7DE' },
    bottom: { style: BorderStyle.SINGLE, size: 1, color: 'D0D7DE' },
    left: { style: BorderStyle.SINGLE, size: 1, color: 'D0D7DE' },
    right: { style: BorderStyle.SINGLE, size: 1, color: 'D0D7DE' },
  };

  const metaRows = [
    ['Nomor Referensi STR', documentRef || 'STR/2026/09/REF-001'],
    ['Nama Nasabah', customerName || 'PT Nusantara Megah Sejahtera'],
    ['Nomor CIF', cif || 'CIF-9842103'],
    ['Status Approval', status ? status.replace(/_/g, ' ') : 'PENDING'],
    ['QC Reviewer / Admin', adminName || 'Budi Santoso (Senior AML QC Specialist)'],
    ['Skor Mutu & Predikat', `${finalScore || '3.50'} / 4.00 (${category || 'BAIK'})`],
    ['Catatan Admin', decisionNotes || 'Dokumen memenuhi standar tata naskah STR PPATK.']
  ];

  const metaTableRows = metaRows.map(([label, val]) => {
    return new TableRow({
      children: [
        new TableCell({
          width: { size: 30, type: WidthType.PERCENTAGE },
          borders: tableBorder,
          children: [new Paragraph({ children: [new TextRun({ text: label, bold: true, size: 20 })] })],
        }),
        new TableCell({
          width: { size: 70, type: WidthType.PERCENTAGE },
          borders: tableBorder,
          children: [new Paragraph({ children: [new TextRun({ text: String(val), size: 20 })] })],
        })
      ]
    });
  });

  const itemHeaderRow = new TableRow({
    children: [
      new TableCell({
        width: { size: 10, type: WidthType.PERCENTAGE },
        borders: tableBorder,
        children: [new Paragraph({ children: [new TextRun({ text: 'ID', bold: true, size: 18 })] })],
      }),
      new TableCell({
        width: { size: 35, type: WidthType.PERCENTAGE },
        borders: tableBorder,
        children: [new Paragraph({ children: [new TextRun({ text: 'Parameter Evaluasi', bold: true, size: 18 })] })],
      }),
      new TableCell({
        width: { size: 12, type: WidthType.PERCENTAGE },
        borders: tableBorder,
        children: [new Paragraph({ children: [new TextRun({ text: 'Bobot', bold: true, size: 18 })] })],
      }),
      new TableCell({
        width: { size: 13, type: WidthType.PERCENTAGE },
        borders: tableBorder,
        children: [new Paragraph({ children: [new TextRun({ text: 'Skor', bold: true, size: 18 })] })],
      }),
      new TableCell({
        width: { size: 30, type: WidthType.PERCENTAGE },
        borders: tableBorder,
        children: [new Paragraph({ children: [new TextRun({ text: 'Temuan / Catatan', bold: true, size: 18 })] })],
      })
    ]
  });

  const itemRows = items.map(item => {
    return new TableRow({
      children: [
        new TableCell({
          borders: tableBorder,
          children: [new Paragraph({ children: [new TextRun({ text: item.item_id || item.id || '-', size: 18 })] })],
        }),
        new TableCell({
          borders: tableBorder,
          children: [new Paragraph({ children: [new TextRun({ text: item.item_name || item.item || '-', size: 18 })] })],
        }),
        new TableCell({
          borders: tableBorder,
          children: [new Paragraph({ children: [new TextRun({ text: `${item.weight}%`, size: 18 })] })],
        }),
        new TableCell({
          borders: tableBorder,
          children: [new Paragraph({ children: [new TextRun({ text: `${item.score} / 4.0`, bold: true, size: 18 })] })],
        }),
        new TableCell({
          borders: tableBorder,
          children: [new Paragraph({ children: [new TextRun({ text: item.comment || '-', size: 18 })] })],
        })
      ]
    });
  });

  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          text: 'LEMBAR HASIL AUDIT QUALITY CONTROL STR',
          heading: HeadingLevel.TITLE,
          alignment: AlignmentType.CENTER,
        }),
        new Paragraph({
          text: 'Laporan Verifikasi Kelayakan Dokumen Transaksi Keuangan Mencurigakan',
          alignment: AlignmentType.CENTER,
        }),
        new Paragraph({ text: '' }),
        new Paragraph({
          text: 'Ringkasan Metadata Dokumen',
          heading: HeadingLevel.HEADING_2,
        }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: metaTableRows,
        }),
        new Paragraph({ text: '' }),
        new Paragraph({
          text: 'Hasil Penilaian 22 Parameter Mutu STR',
          heading: HeadingLevel.HEADING_2,
        }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [itemHeaderRow, ...itemRows],
        }),
      ],
    }],
  });

  const buffer = await Packer.toBuffer(doc);
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(outputPath, buffer);

  return outputPath;
}
