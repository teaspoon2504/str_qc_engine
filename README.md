# STR Quality Check System (QC Engine STR)

Sistem Kendali Mutu dan Verifikasi Lembar Hasil Analisis (LHA) Laporan Transaksi Keuangan Mencurigakan (STR / LTKM) PPATK berbasis arsitektur microservices.

---

## 📌 Fitur Utama

- **Otomasi Evaluasi 22 Parameter Mutu**:
  - **Seksi 1**: Kesesuaian Data Profil Nasabah (5%)
  - **Seksi 2**: Hasil Analisis Kelengkapan Struktur 5W2H (50%)
  - **Seksi 3**: Kelengkapan Dokumen Audit Trail (10%)
  - **Seksi 4**: Format & Kerapian Tata Naskah LHA (5%)
  - **Seksi 5**: Kekuatan Hasil Analisis Kualitatif & Rekomendasi PPATK (30%)
- **Deteksi Placeholder & Anomali**: Mendeteksi otomatis parameter yang belum lengkap atau masih berupa draft placeholder.
- **Microservices Architecture**:
  - `API Gateway` (Port 8000)
  - `Document Service` (Port 5001)
  - `QC Engine Service` (Port 5002)
  - `Approval Service` (Port 5003)
- **Reviewer Audit Trail & Stempel Pengesahan**:
  - Form feedback & catatan per seksi oleh analis/admin.
  - Pengesahan approval dan ekspor PDF resmi dengan sertifikat stempel audit kepatuhan.
- **Web Interface Modern**: Dibangun dengan Tailwind CSS (dark mode support) dan React 18 CDN.

---

## 🚀 Panduan Menjalankan Aplikasi

### 1. Prasyarat
- **Node.js**: v18+
- **PostgreSQL**: v14+ (database lokal `aml_str_qc`)

### 2. Konfigurasi Database
Buat database dan inisialisasi skema serta user awal:
```bash
# 1. Buat database PostgreSQL
createdb aml_str_qc

# 2. Migrasi skema tabel
psql -d aml_str_qc -f services/shared/schema.sql

# 3. Seed data pengguna awal
psql -d aml_str_qc -f services/shared/seed.sql

# 4. Daftarkan akun superadmin
node scripts/seed-superadmin.js
```

### 3. Menjalankan Seluruh Microservices
```bash
npm run start:all
```
Layanan akan berjalan dan dapat diakses di browser melalui:
👉 **`http://localhost:8000`**

### 4. Kredensial Login Bawaan
- **Username**: `superadmin`
- **Password**: `password`

---

## 🧪 Dokumen Pengujian (Test Files)
Tersedia berkas sampel STR DOCX untuk pengujian:
- `DOKUMEN_STR_CONTOH_LENGKAP.docx`: Pengujian dokumen STR lengkap (Kategori: SANGAT BAIK).
- `DOKUMEN_STR_CONTOH_DRAFT_FLAGGED.docx`: Pengujian deteksi anomali/placeholder (Kategori: BAIK / Anomali terdeteksi).

Generate ulang dokumen uji kapan saja dengan:
```bash
node scripts/generate-test-documents.js
```

---

## 🛠️ Perintah Skrip Tambahan
- `npm run stop:all` : Mematikan seluruh proses microservices pada port 8000, 5001, 5002, dan 5003.
- `npm run test:services` : Menjalankan pengujian integrasi end-to-end antar microservices.
