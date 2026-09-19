export const QC_RULES = [
  // Section 1: Kesesuaian Data Profil (5.00%)
  { 
    id: '1.1', sectionId: 1, sectionName: '1. Kesesuaian Data Profil', sectionWeight: 5.0, 
    item: 'Nama Nasabah', desc: 'Exact match with core banking & KYC database', weight: 0.35, defaultScore: 4.0 
  },
  { 
    id: '1.2', sectionId: 1, sectionName: '1. Kesesuaian Data Profil', sectionWeight: 5.0, 
    item: 'CIF', desc: 'Correct Customer Information File number format', weight: 0.35, defaultScore: 4.0 
  },
  { 
    id: '1.3', sectionId: 1, sectionName: '1. Kesesuaian Data Profil', sectionWeight: 5.0, 
    item: 'TTL / Usia', desc: 'Place/Date of birth & current age verification', weight: 0.60, defaultScore: 4.0 
  },
  { 
    id: '1.4', sectionId: 1, sectionName: '1. Kesesuaian Data Profil', sectionWeight: 5.0, 
    item: 'Pekerjaan / Bidang Usaha', desc: 'Profile occupation & line of business consistency', weight: 0.35, defaultScore: 3.5 
  },
  { 
    id: '1.5', sectionId: 1, sectionName: '1. Kesesuaian Data Profil', sectionWeight: 5.0, 
    item: 'Nomor Rekening', desc: 'Active audited account number(s) list', weight: 0.35, defaultScore: 4.0 
  },
  { 
    id: '1.6', sectionId: 1, sectionName: '1. Kesesuaian Data Profil', sectionWeight: 5.0, 
    item: 'Tgl. Transaksi & Nominal Kredit Terbesar', desc: 'Correct alert timeline & peak single transaction value', weight: 0.70, defaultScore: 4.0 
  },
  { 
    id: '1.7', sectionId: 1, sectionName: '1. Kesesuaian Data Profil', sectionWeight: 5.0, 
    item: 'Indikasi & Sub Indikasi Tindak Pidana', desc: 'Accurate PPATK crime categorization mapping', weight: 1.00, defaultScore: 3.8 
  },
  { 
    id: '1.8', sectionId: 1, sectionName: '1. Kesesuaian Data Profil', sectionWeight: 5.0, 
    item: 'Lokasi Pelanggaran & Data Keuangan', desc: 'Branch location & financial profile details updated', weight: 0.80, defaultScore: 4.0 
  },
  { 
    id: '1.9', sectionId: 1, sectionName: '1. Kesesuaian Data Profil', sectionWeight: 5.0, 
    item: 'Sumber Pelaporan & Kode Uker', desc: 'Reporting origin code & branch identifier accuracy', weight: 0.50, defaultScore: 4.0 
  },

  // Section 2: Hasil Analisis - Kelengkapan Struktur 5W2H (50.00%)
  { 
    id: '2.1', sectionId: 2, sectionName: '2. Hasil Analisis (Kelengkapan Struktur 5W2H)', sectionWeight: 50.0, 
    item: 'a. Sumber Deteksi STR', desc: 'Alert trigger source (Scenario ID, System Alert, or Manual Escalation)', weight: 3.00, defaultScore: 3.8 
  },
  { 
    id: '2.2', sectionId: 2, sectionName: '2. Hasil Analisis (Kelengkapan Struktur 5W2H)', sectionWeight: 50.0, 
    item: 'b1. Profiling - Informasi Internal', desc: 'KYC records, expected turnover, account purpose & historical trends', weight: 5.00, defaultScore: 3.5 
  },
  { 
    id: '2.3', sectionId: 2, sectionName: '2. Hasil Analisis (Kelengkapan Struktur 5W2H)', sectionWeight: 50.0, 
    item: 'b2. Profiling - Informasi Eksternal', desc: 'OSINT, adverse media, PEP screening & sanctions checks', weight: 5.00, defaultScore: 3.2 
  },
  { 
    id: '2.4', sectionId: 2, sectionName: '2. Hasil Analisis (Kelengkapan Struktur 5W2H)', sectionWeight: 50.0, 
    item: 'c1. Follow the Money - Tabel Rekening', desc: 'Structured tabular view of source/destination accounts', weight: 4.00, defaultScore: 4.0 
  },
  { 
    id: '2.5', sectionId: 2, sectionName: '2. Hasil Analisis (Kelengkapan Struktur 5W2H)', sectionWeight: 50.0, 
    item: 'c2. Follow the Money - Pola, Frekuensi, Nominal Trx', desc: 'Overall pattern, velocity, aggregation, and anomaly baseline comparison', weight: 6.00, defaultScore: 3.5 
  },
  { 
    id: '2.6', sectionId: 2, sectionName: '2. Hasil Analisis (Kelengkapan Struktur 5W2H)', sectionWeight: 50.0, 
    item: 'c3. Follow the Money - Rincian Transaksi Mencurigakan', desc: 'Itemized list of specific suspicious transactions under review', weight: 6.00, defaultScore: 3.6 
  },
  { 
    id: '2.7', sectionId: 2, sectionName: '2. Hasil Analisis (Kelengkapan Struktur 5W2H)', sectionWeight: 50.0, 
    item: 'c4. Follow the Money - Diagram Aliran Dana', desc: 'Visual fund flow diagram mapping funds from origin to ultimate beneficiary', weight: 6.00, defaultScore: 3.5 
  },
  { 
    id: '2.8', sectionId: 2, sectionName: '2. Hasil Analisis (Kelengkapan Struktur 5W2H)', sectionWeight: 50.0, 
    item: 'd1. Kesimpulan - Penjelasan Transaksi Mencurigakan', desc: 'Clear grounds for suspicion narrative (Penjelasan Makul)', weight: 10.00, defaultScore: 3.5 
  },
  { 
    id: '2.9', sectionId: 2, sectionName: '2. Hasil Analisis (Kelengkapan Struktur 5W2H)', sectionWeight: 50.0, 
    item: 'd2. Kesimpulan - Tipologi & Indikasi Predicate Crime', desc: 'Alignment with ML/TF typologies & PPATK predicate crime standard', weight: 5.00, defaultScore: 3.4 
  },

  // Section 3: Kelengkapan Dokumen Audit Trail (10.00%)
  { 
    id: '3.1', sectionId: 3, sectionName: '3. Kelengkapan Dokumen Audit Trail', sectionWeight: 10.0, 
    item: 'a. Profil Customer Portofolio', desc: 'Complete CIF portfolio and account summary document attached', weight: 2.50, defaultScore: 4.0 
  },
  { 
    id: '3.2', sectionId: 3, sectionName: '3. Kelengkapan Dokumen Audit Trail', sectionWeight: 10.0, 
    item: 'b. Mutasi Rekening Regulator', desc: 'Official bank account statements covering alert window attached', weight: 2.50, defaultScore: 4.0 
  },
  { 
    id: '3.3', sectionId: 3, sectionName: '3. Kelengkapan Dokumen Audit Trail', sectionWeight: 10.0, 
    item: 'c. Excel List Transaksi', desc: 'Raw transactional extract spreadsheet provided', weight: 2.50, defaultScore: 3.8 
  },
  { 
    id: '3.4', sectionId: 3, sectionName: '3. Kelengkapan Dokumen Audit Trail', sectionWeight: 10.0, 
    item: 'd. Lembar Hasil Analisis (LHA)', desc: 'Complete signed/approved analysis report form included', weight: 2.50, defaultScore: 4.0 
  },

  // Section 4: Kerapian & Formatting LHA (5.00%)
  { 
    id: '4.1', sectionId: 4, sectionName: '4. Kerapian & Formatting LHA', sectionWeight: 5.0, 
    item: 'Kerapian, Formatting & Structural Legibility', desc: 'Professional formatting, structured layout, correct terminology & readability', weight: 5.00, defaultScore: 3.8 
  },

  // Section 5: Kekuatan Hasil Analisis (Qualitative) (30.00%)
  { 
    id: '5.1', sectionId: 5, sectionName: '5. Kekuatan Hasil Analisis (Qualitative)', sectionWeight: 30.0, 
    item: 'Rasionalitas & Link Analisis (Logic & Reason)', desc: 'Coherent narrative linking customer profile anomaly to transaction behavior', weight: 12.00, defaultScore: 3.2 
  },
  { 
    id: '5.2', sectionId: 5, sectionName: '5. Kekuatan Hasil Analisis (Qualitative)', sectionWeight: 30.0, 
    item: 'Ketepatan Identifikasi Red Flags', desc: 'Valid justification ruling out normal legitimate commercial activity', weight: 10.00, defaultScore: 3.0 
  },
  { 
    id: '5.3', sectionId: 5, sectionName: '5. Kekuatan Hasil Analisis (Qualitative)', sectionWeight: 30.0, 
    item: 'Actionability for FIU (PPATK) / Decision Quality', desc: 'Definitive recommendation with clear actionable intelligence for regulators', weight: 8.00, defaultScore: 3.5 
  }
];
