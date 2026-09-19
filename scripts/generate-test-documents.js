import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
  HeadingLevel,
  ShadingType
} from 'docx';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Helper to create styled table cell
function createCell(text, bold = false, widthPercent = 50, bgColor = undefined) {
  return new TableCell({
    width: { size: widthPercent, type: WidthType.PERCENTAGE },
    shading: bgColor ? { fill: bgColor, type: ShadingType.CLEAR } : undefined,
    margins: { top: 120, bottom: 120, left: 180, right: 180 },
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text,
            bold,
            font: 'Calibri',
            size: 20 // 10pt
          })
        ]
      })
    ]
  });
}

function createSectionHeading(title) {
  return new Paragraph({
    spacing: { before: 240, after: 120 },
    children: [
      new TextRun({
        text: title,
        bold: true,
        font: 'Calibri',
        size: 24, // 12pt
        color: '0857C3'
      })
    ]
  });
}

function createParagraph(label, value, isFlagged = false) {
  return new Paragraph({
    spacing: { before: 80, after: 80 },
    children: [
      new TextRun({
        text: `${label}: `,
        bold: true,
        font: 'Calibri',
        size: 21,
        color: isFlagged ? 'C00000' : '1F2937'
      }),
      new TextRun({
        text: value,
        font: 'Calibri',
        size: 21,
        color: isFlagged ? 'C00000' : '374151'
      })
    ]
  });
}

// 1. DOKUMEN STR LENGKAP & VALID (Rating SANGAT BAIK)
async function generateFullDocument(outputPath) {
  const doc = new Document({
    title: 'Lembar Hasil Analisis STR - PT Nusantara Megah Sejahtera',
    description: 'Dokumen Uji Lengkap Sistem Kendali Mutu STR PPATK',
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 }
          }
        },
        children: [
          // Header Banner
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 60 },
            children: [
              new TextRun({
                text: 'BANK ARTHA SENTOSA TBK - UNIT COMPLIANCE & AML/CFT',
                bold: true,
                font: 'Calibri',
                size: 20,
                color: '6B7280'
              })
            ]
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 120 },
            children: [
              new TextRun({
                text: 'LEMBAR HASIL ANALISIS TRANSAKSI KEUANGAN MENCURIGAKAN',
                bold: true,
                font: 'Calibri',
                size: 28,
                color: '0857C3'
              })
            ]
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 240 },
            children: [
              new TextRun({
                text: 'Nomor Registrasi: STR/2026/09/JKT-00429 | Klasifikasi: SANGAT RAHASIA (CONFIDENTIAL)',
                italics: true,
                font: 'Calibri',
                size: 18,
                color: '4B5563'
              })
            ]
          }),

          // SEKSI 1
          createSectionHeading('1. Kesesuaian Data Profil Nasabah'),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  createCell('Nama Nasabah:', true, 35, 'F3F4F6'),
                  createCell('PT Nusantara Megah Sejahtera', false, 65)
                ]
              }),
              new TableRow({
                children: [
                  createCell('CIF Nasabah:', true, 35, 'F3F4F6'),
                  createCell('CIF-9842103 (Akun Korporasi Aktif)', false, 65)
                ]
              }),
              new TableRow({
                children: [
                  createCell('Tempat, Tanggal Lahir / Usia:', true, 35, 'F3F4F6'),
                  createCell('Jakarta, 12-08-1985 / 41 Thn (Direktur Utama: Hendra Wijaya)', false, 65)
                ]
              }),
              new TableRow({
                children: [
                  createCell('Pekerjaan / Bidang Usaha:', true, 35, 'F3F4F6'),
                  createCell('Perdagangan Ekspor Impor Tekstil dan Komoditas Kain', false, 65)
                ]
              }),
              new TableRow({
                children: [
                  createCell('Nomor Rekening:', true, 35, 'F3F4F6'),
                  createCell('102-00-9842103-8 (IDR Operasional Bisnis)', false, 65)
                ]
              }),
              new TableRow({
                children: [
                  createCell('Tgl. Transaksi & Nominal Terbesar:', true, 35, 'F3F4F6'),
                  createCell('2026-08-28 / Rp 4.850.000.000,- (Transfer Masuk RTGS)', false, 65)
                ]
              }),
              new TableRow({
                children: [
                  createCell('Indikasi Tindak Pidana:', true, 35, 'F3F4F6'),
                  createCell('TPPU (Tindak Pidana Pencucian Uang) / Tindak Pidana Perpajakan', false, 65)
                ]
              }),
              new TableRow({
                children: [
                  createCell('Lokasi Pelanggaran & Keuangan:', true, 35, 'F3F4F6'),
                  createCell('KC Sudirman Jakarta / Saldo Rp 5.210.000.000,-', false, 65)
                ]
              }),
              new TableRow({
                children: [
                  createCell('Sumber Pelaporan:', true, 35, 'F3F4F6'),
                  createCell('Sistem AML Automated Alert / Uker 0032 (Anti Money Laundering Division)', false, 65)
                ]
              })
            ]
          }),

          // SEKSI 2
          createSectionHeading('2. Hasil Analisis 5W2H (Uraian Kronologis & Modus Operandi)'),
          createParagraph('Sumber deteksi STR', 'Alert Rule AML-2026-88 Rapid In-Out Pass-Through Flow dengan volume mutasi tidak proporsional terhadap profil perputaran dana usaha yang dideklarasikan saat CDD.'),
          createParagraph('Pencarian Informasi Internal', 'Expected turnover historis pada form KYC sebesar Rp 500.000.000/bulan vs perputaran transaksi aktual mencapai Rp 15.200.000.000 dalam kurun 14 hari kerja (Deviasi anomali 30x lipat tanpa underlying kontrak bisnis).'),
          createParagraph('Pencarian Informasi Eksternal', 'Pemeriksaan basis data AHU Kemenkumham, adverse media OSINT, serta penapisan daftar PEP dan sanksi internasional/OFAC berstatus negatif sanksi, namun nama pengurus terhubung dengan penyelidikan perkara kepabeanan.'),
          createParagraph('Tabel rekening follow the money', 'Rekening Sumber: 4 Bank Domestik (Bank Mandiri, BCA, BRI, BNI); Rekening Tujuan: 2 Rekening Valas USD/SGD dan 3 rekening giro perorangan pihak terafiliasi.'),
          createParagraph('Pola, frekuensi dan nominal transaksi', 'Frekuensi 42 transaksi perputaran dana masuk dan langsung ditransfer keluar dalam waktu kurang dari 24 jam dengan total akumulasi mencapai Rp 14.850.000.000,-.'),
          createParagraph('Rincian transaksi mencurigakan', '12 Transaksi kredit berulang dengan nominal bulat berkisar Rp 400.000.000,- hingga Rp 950.000.000,- yang diindikasikan sebagai pemecahan nominal transaksi (Structuring/Smurfing) untuk menghindari ambang batas pelaporan transaksi tunai.'),
          createParagraph('Diagram aliran dana', 'Diagram alur perputaran dana (Fund Flow Chart) terlampir lengkap pada Lampiran Dokumen Hal 4, memetakan rantai aliran dana dari entitas pengirim asal hingga penampung akhir.'),
          createParagraph('Kesimpulan dan penjelasan transaksi mencurigakan', 'Entitas patut diduga kuat merupakan perusahaan passthrough fiktif (shell company) tanpa kegiatan operasional riil yang difungsikan sebagai sarana penampung dan pengaburan asal-usul kekayaan hasil tindak pidana perpajakan.'),
          createParagraph('Rekomendasi tipologi predicate crime', 'Tipologi Structuring, Smurfing, dan Pass-Through Layering Account untuk segera dilaporkan secara prioritas sebagai Laporan Transaksi Keuangan Mencurigakan (LTKM/STR) ke PPATK.'),

          // SEKSI 3
          createSectionHeading('3. Kelengkapan Dokumen Audit Trail'),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  createCell('a. Profil Dokumen KYC & CIF Nasabah', true, 60, 'F9FAFB'),
                  createCell('✅ Terlampir Lengkap (Form CIF, NPWP, Akta PT, SIUP)', false, 40)
                ]
              }),
              new TableRow({
                children: [
                  createCell('b. Mutasi Rekening Koran Bank Terotorisasi', true, 60, 'F9FAFB'),
                  createCell('✅ Terlampir Resmi Periode Jun - Aug 2026', false, 40)
                ]
              }),
              new TableRow({
                children: [
                  createCell('c. Ekstrak Worksheet Excel List Transaksi', true, 60, 'F9FAFB'),
                  createCell('✅ Extract_Transaksi_Rekening_1020098421038.xlsx', false, 40)
                ]
              }),
              new TableRow({
                children: [
                  createCell('d. Lembar Hasil Analisis (LHA) STR Sah', true, 60, 'F9FAFB'),
                  createCell('✅ Dokumen LHA Lengkap Tertandatangani (PDF)', false, 40)
                ]
              })
            ]
          }),

          // SEKSI 4
          createSectionHeading('4. Format Tata Naskah & Kerapian Dokumen LHA'),
          createParagraph('Standar Format Dokumen', 'Disusun mengacu pada Format Standar Lembar Hasil Analisis RAC Individu/Korporasi PPATK Revisi 2025 dengan tata letak baku, nomor registrasi berurutan, dan tabel terstruktur.'),

          // SEKSI 5
          createSectionHeading('5. Kekuatan Hasil Analisis Kualitatif'),
          createParagraph('Rasionalitas & Link Analisis', 'Hubungan kausal antara latar belakang profil usaha nasabah dengan anomali perputaran dana bernilai miliaran terbukti tidak memiliki dasar pembenaran ekonomi yang rasional (Lack of economic rationale).'),
          createParagraph('Ketepatan Identifikasi Red Flags', 'Indikator Red Flag No. 14 (U-Turn / Pass-Through Transactions) dan Red Flag No. 8 (Significant turnover deviation from declared customer income) teridentifikasi secara sahih.'),
          createParagraph('Actionability for FIU / PPATK', 'Dokumen memuat informasi intelijen keuangan yang presisi, rincian nomor rekening lengkap, identitas pihak terkait, serta usulan pembekuan sementara untuk ditindaklanjuti investigator PPATK.'),

          // Tanda Tangan Pemeriksa
          new Paragraph({ spacing: { before: 360 } }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  createCell('Dianalisis Oleh:\n\n\n\n( Ahmad Fauzi )\nJunior AML Analyst\nNPP: 98421', false, 50),
                  createCell('Ditinjau & Disetujui Oleh:\n\n\n\n( Budi Santoso )\nSenior AML QC Specialist / Compliance Officer\nNPP: 41209', false, 50)
                ]
              })
            ]
          })
        ]
      }
    ]
  });

  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(outputPath, buffer);
  console.log(`✅ Dokumen Lengkap Berhasil Dibuat: ${outputPath}`);
}

// 2. DOKUMEN STR DRAFT DENGAN PLACEHOLDER (Rating DRAFT / BUTUH PERHATIAN)
async function generateDraftDocument(outputPath) {
  const doc = new Document({
    title: 'DRAFT Lembar Hasil Analisis STR - Belum Lengkap',
    description: 'Dokumen Uji Pengujian Deteksi Anomali / Placeholder QC Engine',
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 }
          }
        },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 60 },
            children: [
              new TextRun({
                text: 'BANK ARTHA SENTOSA TBK - DRAFT LEMBAR ANALISIS',
                bold: true,
                font: 'Calibri',
                size: 20,
                color: 'C00000'
              })
            ]
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 120 },
            children: [
              new TextRun({
                text: 'LEMBAR HASIL ANALISIS TRANSAKSI KEUANGAN MENCURIGAKAN (DRAFT)',
                bold: true,
                font: 'Calibri',
                size: 26,
                color: 'C00000'
              })
            ]
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 240 },
            children: [
              new TextRun({
                text: 'Status: [DRAFT / DATA BELUM LENGKAP - PERLU VERIFIKASI ANALIS]',
                italics: true,
                bold: true,
                font: 'Calibri',
                size: 18,
                color: 'DC2626'
              })
            ]
          }),

          // SEKSI 1
          createSectionHeading('1. Kesesuaian Data Profil Nasabah'),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  createCell('Nama Nasabah:', true, 35, 'FEE2E2'),
                  createCell('[NAMA PERUSAHAAN/NASABAH BELUM DIPASTIKAN]', false, 65)
                ]
              }),
              new TableRow({
                children: [
                  createCell('CIF Nasabah:', true, 35, 'FEE2E2'),
                  createCell('CIF-...............', false, 65)
                ]
              }),
              new TableRow({
                children: [
                  createCell('Tempat, Tanggal Lahir / Usia:', true, 35, 'FEE2E2'),
                  createCell('[DATA TTL BELUM TERVERIFIKASI]', false, 65)
                ]
              }),
              new TableRow({
                children: [
                  createCell('Pekerjaan / Bidang Usaha:', true, 35, 'FEE2E2'),
                  createCell('[TIDAK DIKETAHUI / BELUM TERDAFTAR DI SISTEM]', false, 65)
                ]
              }),
              new TableRow({
                children: [
                  createCell('Nomor Rekening:', true, 35, 'FEE2E2'),
                  createCell('102-00-XXXXXXXX-X', false, 65)
                ]
              }),
              new TableRow({
                children: [
                  createCell('Tgl. Transaksi & Nominal Terbesar:', true, 35, 'FEE2E2'),
                  createCell('2026-08-.. / Rp ................', false, 65)
                ]
              }),
              new TableRow({
                children: [
                  createCell('Indikasi Tindak Pidana:', true, 35, 'FEE2E2'),
                  createCell('[BELUM DITENTUKAN]', false, 65)
                ]
              }),
              new TableRow({
                children: [
                  createCell('Lokasi Pelanggaran & Keuangan:', true, 35, 'FEE2E2'),
                  createCell('[LOKASI CABANG BELUM TERDATA]', false, 65)
                ]
              }),
              new TableRow({
                children: [
                  createCell('Sumber Pelaporan:', true, 35, 'FEE2E2'),
                  createCell('Manual Alert / Uker .........', false, 65)
                ]
              })
            ]
          }),

          // SEKSI 2
          createSectionHeading('2. Hasil Analisis 5W2H (Belum Lengkap)'),
          createParagraph('Sumber deteksi STR', '[BELUM DIISI: Sebutkan scenario alert atau manual escalation yang mendasari alert ini]', true),
          createParagraph('Pencarian Informasi Internal', '[BELUM DIISI: Uraikan perbandingan omset KYC dengan mutasi rekening riil]', true),
          createParagraph('Pencarian Informasi Eksternal', 'Pemeriksaan eksternal sedang dalam proses penelusuran....................', true),
          createParagraph('Tabel rekening follow the money', '[BELUM TERSEDIA: Lampirkan tabel rekening sumber dan penerima dana]', true),
          createParagraph('Pola, frekuensi dan nominal transaksi', '[BELUM DIISI: Hitung frekuensi dan perputaran nominal mutasi yang mencurigakan]', true),
          createParagraph('Rincian transaksi mencurigakan', 'Daftar rincian transaksi: .................................................', true),
          createParagraph('Diagram aliran dana', '[DIAGRAM ALIRAN DANA BELUM DILAMPIRKAN]', true),
          createParagraph('Kesimpulan dan penjelasan transaksi mencurigakan', 'Kesimpulan sementara: .....................................................', true),
          createParagraph('Rekomendasi tipologi predicate crime', '[TIPOLOGI BELUM DITENTUKAN: Perlu konsultasi dengan supervisor AML]', true)
        ]
      }
    ]
  });

  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(outputPath, buffer);
  console.log(`⚠️ Dokumen Draft Berhasil Dibuat: ${outputPath}`);
}

async function run() {
  const fullPath = path.join(rootDir, 'DOKUMEN_STR_CONTOH_LENGKAP.docx');
  const draftPath = path.join(rootDir, 'DOKUMEN_STR_CONTOH_DRAFT_FLAGGED.docx');

  await generateFullDocument(fullPath);
  await generateDraftDocument(draftPath);
}

run().catch(console.error);
