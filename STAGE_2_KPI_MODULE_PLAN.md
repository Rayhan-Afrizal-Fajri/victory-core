# RENCANA PENGEMBANGAN MODUL STAGE 2: KEY PERFORMANCE INDICATORS (KPI)
## VICTORY CORE MANAGEMENT SYSTEM
**Dokumen Desain Sistem & Rencana Kerja Modul Analitik & Pengukuran Kinerja Garment**

---

## 1. PENDAHULUAN & TUJUAN

Pada sistem operasional **Victory Core** saat ini (Stage 1), seluruh tahapan kerja konveksi telah menghasilkan jejak data (*data footprint*) yang kaya dan tersimpan secara real-time:
- Tanggal & waktu mulai/selesai pekerjaan operator di *Worker Board* (`started_at`, `completed_at`).
- Data inspeksi Quality Control dan log kegagalan di *QC Board* (`checked_qty`, `passed_qty`, `defect_qty`, `defect_reason`, `qc_type`).
- Catatan kondisi bahan saat penerimaan di *Purchasing* (`received_qty`, `item_condition`: *good*, *damaged*, *expired*).
- Status penawaran harga pelanggan di *Quotation* (`draft`, `approved`, `rejected`).
- Target tenggat waktu pengerjaan di *Job Ticket* (`deadline`, `date`, status siklus workflow).
- Waktu penerbitan tagihan dan verifikasi pembayaran di *Invoices & Payments*.

**Tujuan Stage 2 (KPI)**:
Mengolah jejak data operasional di atas menjadi **sistem pengukuran performa (KPI Engine & Analytics Dashboard)** yang terukur, obyektif, dan otomatis. Sistem ini memberikan visibilitas penuh (*operational visibility*) kepada Owner, Manager Produksi, Finance, dan Tim Operasional guna mengoptimalkan produktivitas, memangkas *waste/defect*, dan memastikan ketepatan waktu pengiriman (*On-Time Delivery*).

---

## 2. KERANGKA KERJA BALANCED SCORECARD KHUSUS VICTORY CORE

Sistem KPI Victory Core dibagi ke dalam **5 Dimensi Kinerja Inti**:

```
                              ┌──────────────────────────────────┐
                              │  SISTEM KPI TERPADU VICTORY CORE │
                              └─────────────────┬────────────────┘
                                                │
         ┌──────────────────┬───────────────────┼───────────────────┬──────────────────┐
         ▼                  ▼                   ▼                   ▼                  ▼
┌─────────────────┐┌─────────────────┐┌──────────────────┐┌──────────────────┐┌─────────────────┐
│ 1. PRODUKSI &   ││ 2. KUALITAS &   ││ 3. FINANSIAL &   ││ 4. KOMERSIAL &   ││ 5. SUPPLY CHAIN │
│    OPERASIONAL  ││    QC (DEFECT)  ││    PROFITABILITAS││    PELANGGAN     ││    & PURCHASING │
└─────────────────┘└─────────────────┘└──────────────────┘└──────────────────┘└─────────────────┘
```

---

## 3. DEFINISI METRIK KPI, FORMULA MATEMATIS & PEMETAAN TABEL DATABASE

Setiap KPI dirancang langsung bersumber dari entitas database Victory Core yang sudah ada:

### DIMENSI 1: KINERJA PRODUKSI & OPERASIONAL (MANUFACTURING EFFICIENCY)

#### 1. On-Time Delivery Rate (OTD %)
- **Definisi**: Persentase Purchase Order / Job Ticket yang berhasil dikirim ke pelanggan tepat waktu sesuai tenggat (`deadline`).
- **Formula**:
  $$\text{OTD Rate (\%)} = \left( \frac{\text{Jumlah PO Selesai \& Dikirim Sebelum atau Tepat Deadline}}{\text{Total PO Selesai dalam Periode}} \right) \times 100\%$$
- **Sumber Data Database**:
  - `job_tickets.deadline`
  - `production_runs.status = 'shipped'` dan `production_runs.updated_at` (atau `samples.delivered_at`)
  - Standar Industri: $\ge 95\%$ (Sangat Baik), $90\% - 94\%$ (Waspada), $<90\%$ (Kritis).

#### 2. Average Production Cycle Time (Hari)
- **Definisi**: Rata-rata durasi waktu dari saat Order Entry / DP dibayar hingga barang siap dikirim (*packed/shipped*).
- **Formula**:
  $$\text{Cycle Time} = \frac{\sum (\text{Tanggal Shipped} - \text{Tanggal DP Verified})}{\text{Jumlah PO Selesai}}$$
- **Sumber Data Database**:
  - `workflow_histories` (`action = 'production_dp_verified'`)
  - `production_runs.packed_at` / `production_runs.updated_at`

#### 3. Output Throughput per Work Center (Pcs/Hari)
- **Definisi**: Kapasitas riil barang yang diselesaikan per proses kerja (Potong, Jahit, Finishing, Packing).
- **Formula**:
  $$\text{Throughput} = \sum \text{quantity pada proses } X \text{ yang berstatus 'completed' dalam 1 hari/minggu}$$
- **Sumber Data Database**:
  - `production_run_processes.completed_at`
  - `production_run_processes.quantity`
  - `pesanan_manufacturing_specs.work_name_snapshot`

---

### DIMENSI 2: KUALITAS, QUALITY CONTROL & PENGURANGAN WASTE

#### 4. Defect Rate / Scrap Rate (%)
- **Definisi**: Persentase produk gagal atau cacat produksi dibanding total produk yang diperiksa QC.
- **Formula**:
  $$\text{Defect Rate (\%)} = \left( \frac{\sum \text{defect\_qty}}{\sum \text{checked\_qty}} \right) \times 100\%$$
- **Sumber Data Database**:
  - `production_qc_logs.defect_qty`
  - `production_qc_logs.checked_qty`
  - `production_qc_logs.qc_type = 'initial_check'`
  - Target Standar Garment: $\le 2.5\%$

#### 5. First Time Pass Rate (FTPR / RFT - Right First Time %)
- **Definisi**: Persentase barang yang lolos inspeksi QC pada pemeriksaan pertama tanpa memerlukan perbaikan (*rework*).
- **Formula**:
  $$\text{FTPR (\%)} = \left( \frac{\sum \text{passed\_qty pada 'initial\_check'}}{\sum \text{checked\_qty pada 'initial\_check'}} \right) \times 100\%$$
- **Sumber Data Database**:
  - `production_qc_logs` dengan filter `qc_type = 'initial_check'`

#### 6. Defect Pareto Breakdown (Analisis Akar Masalah)
- **Definisi**: Distribusi frekuensi penyebab cacat (Jahitan loncat, noda kain, sablon pecah, ukuran tidak sesuai, kancing lepas).
- **Sumber Data Database**:
  - `production_qc_logs.defect_reason`
  - `production_defect_histories.defect_reason` & `corrective_action`

---

### DIMENSI 3: FINANSIAL & PROFITABILITAS PABRIK

#### 7. Gross Profit Margin per PO & Artikel (GPM %)
- **Definisi**: Persentase laba kotor yang dihasilkan per artikel atau per PO setelah dikurangi seluruh HPP riil.
- **Formula**:
  $$\text{GPM (\%)} = \left( \frac{\text{Pendapatan Terverifikasi} - \text{HPP Riil}}{\text{Pendapatan Terverifikasi}} \right) \times 100\%$$
- **Sumber Data Database**:
  - Revenue: `payments` status `verified` pada invoice terkait.
  - HPP Riil: Bahan (`purchasings`), Tenaga Kerja (`production_run_processes`), Makloon (`pesanan_manufacturing_specs`).
  - Target: $\ge 35\%$ untuk pakaian custom/konveksi.

#### 8. Cost Variance Rate (Selisih Biaya Estimasi BOM vs Riil)
- **Definisi**: Mengukur deviasi antara estimasi biaya yang ditawarkan ke pelanggan (Quotation/BOM) dengan pengeluaran sesungguhnya di lantai pabrik.
- **Formula**:
  $$\text{Cost Variance (\%)} = \left( \frac{\text{HPP Riil} - \text{Estimasi HPP BOM}}{\text{Estimasi HPP BOM}} \right) \times 100\%$$
- **Interpretasi**:
  - Bernilai negatif (< 0%): Efisiensi (Pabrik beroperasi lebih hemat dari estimasi).
  - Bernilai positif (> 0%): Pembengkakan biaya (*over budget* / bocor).
- **Sumber Data Database**:
  - `pesanan.estimasi_hpp_per_pcs` vs Akumulasi biaya riil.

#### 9. Days Sales Outstanding (DSO / Rata-rata Umur Piutang)
- **Definisi**: Mengukur seberapa cepat piutang dari pelanggan berhasil ditagih menjadi uang tunai.
- **Formula**:
  $$\text{DSO} = \left( \frac{\text{Total Sisa Piutang Belum Lunas}}{\text{Total Penjualan Periode}} \right) \times \text{Jumlah Hari Periode}$$
- **Sumber Data Database**:
  - `invoices.total_tagihan` - `payments.jumlah_bayar (verified)`
  - Target: $\le 14$ hari (Konveksi make-to-order sehat umumnya memiliki DP 50% dan pelunasan sebelum pengiriman).

---

### DIMENSI 4: KOMERSIAL & PENJUALAN (SALES PERFORMANCE)

#### 10. Quotation Win Rate (%)
- **Definisi**: Rasio keberhasilan tim sales/komersial dalam mengonversi draf penawaran harga menjadi pesanan produksi aktif.
- **Formula**:
  $$\text{Win Rate (\%)} = \left( \frac{\text{Jumlah Quotation Berstatus 'approved'}}{\text{Total Quotation Diterbitkan ('approved' + 'rejected')}} \right) \times 100\%$$
- **Sumber Data Database**:
  - `quotations.status` (`approved` vs `rejected`)

#### 11. Average Order Value (AOV)
- **Definisi**: Rata-rata nilai rupiah nominal per Purchase Order / Job Ticket.
- **Formula**:
  $$\text{AOV} = \frac{\sum \text{invoices.total\_tagihan}}{\text{Jumlah Job Ticket Aktif}}$$

#### 12. Customer Repeat Order Rate (%)
- **Definisi**: Persentase pelanggan yang melakukan pemesanan ulang (repeat order) lebih dari 1 kali.
- **Sumber Data Database**:
  - `job_tickets.customer_id` di-grouping dan dihitung frekuensinya.

---

### DIMENSI 5: SUPPLY CHAIN & PENGADAAN BAHAN (PURCHASING)

#### 13. Material Receiving Reject Rate (%)
- **Definisi**: Persentase material kain dan aksesoris yang datang dalam kondisi rusak atau tidak sesuai spek saat diterima di gudang.
- **Formula**:
  $$\text{Material Reject Rate (\%)} = \left( \frac{\sum \text{received\_qty dengan condition in ('damaged', 'expired')}}{\sum \text{received\_qty total}} \right) \times 100\%$$
- **Sumber Data Database**:
  - `material_receivings.item_condition` & `material_receivings.received_qty`
  - Target: $\le 1.0\%$

#### 14. Supplier Lead Time & Performance Scorecard
- **Definisi**: Mengukur kecepatan respon dan ketepatan supplier kain/aksesoris dalam mengirim pesanan dari tanggal order ke tanggal terima barang.
- **Sumber Data Database**:
  - `purchasings.tgl_pembelian` vs `material_receivings.received_at`
  - Pengelompokan performa per `suppliers.id`

---

## 4. MODUL-MODUL RINCI YANG AKAN DIKERJAKAN

### MODUL KPI-01: KPI Snapshot Engine & Automated Daily Job
- **Tujuan**: Mesin agregasi otomatis di backend yang menghitung dan menyimpan rekap metrik harian/mingguan/bulanan agar dashboard cepat dan tidak membebani database operasional.
- **Fitur**:
  - Laravel Console Command: `php artisan victory:calculate-kpi {--period=daily}`.
  - Scheduled Job yang berjalan otomatis setiap tengah malam (cron job).
  - Snapshotting data ke tabel `kpi_metric_snapshots`.
  - Mekanisme backfill data historis dari data Job Ticket yang sudah ada sebelumnya.

### MODUL KPI-02: Executive Owner Dashboard (Ringkasan Strategis)
- **Tujuan**: Memberikan pandangan helikopter (*helicopter view*) kepada Owner mengenai kesehatan bisnis, profitabilitas, dan resiko operasional.
- **Fitur**:
  - KPI Cards Utama: Total Revenue, Gross Margin (%), On-Time Delivery (%), Defect Rate (%), Active Orders.
  - Grafik Trend Bulanan: Revenue vs Actual Cost vs GOP.
  - Grafik Win Rate Penawaran & Status Corong Pesanan (*Sales Funnel*).
  - **Early Warning System (Anomaly Alert)**: Notifikasi kartu merah jika ada PO yang telat dari deadline atau artikel dengan defect rate $\ge 5\%$.

### MODUL KPI-03: Production & QC Dashboard (Untuk Kepala Produksi & QC)
- **Tujuan**: Memantau ritme kerja pabrik, antrean stasiun kerja, dan pencegahan cacat produk.
- **Fitur**:
  - Real-time Output Tracker: Pcs selesai hari ini per stasiun (Cutting, Sewing, Finishing).
  - Pareto Diagram Cacat (Top 5 penyebab defect dan aksi perbaikan yang diambil).
  - First Time Pass Rate (FTPR) gauge meter.
  - Deadline Watchlist: Daftar Job Ticket yang mendekati jatuh tempo ($\le 3$ hari) beserta progres fisiknya.

### MODUL KPI-04: Purchasing & Supplier Performance Board
- **Tujuan**: Evaluasi kinerja supplier bahan kain dan vendor makloon eksternal.
- **Fitur**:
  - Ranking Supplier berdasarkan: Kualitas bahan (rendahnya reject), Kecepatan pengiriman, dan Konsistensi harga.
  - Daftar komplain material bermasalah (`urgentMaterialIssues`) yang belum tertangani.

### MODUL KPI-05: Worker Productivity & QC Operator Leaderboard
- **Tujuan**: Evaluasi kinerja operator jahit/potong untuk pembinaan dan dasar pemberian insentif/bonus.
- **Fitur**:
  - Rekap kuantitas output kerja per operator per periode.
  - Rasio kontribusi defect per pekerja.
  - Skor disiplin waktu mulai vs selesai kerja di Worker Board.

---

## 5. RANCANGAN SKEMA DATABASE BARU

```sql
-- 1. Master Definisi Metrik KPI
CREATE TABLE kpi_definitions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,       -- 'OTD_RATE', 'DEFECT_RATE', 'GPM_PCT', 'FTPR_PCT', 'AOV'
    name VARCHAR(150) NOT NULL,
    category ENUM('production', 'quality', 'financial', 'commercial', 'purchasing', 'worker') NOT NULL,
    unit VARCHAR(20) NOT NULL,               -- '%', 'hari', 'pcs', 'IDR'
    calculation_method VARCHAR(100) NOT NULL,
    target_value DECIMAL(12, 2) NOT NULL,    -- Misal 95.00 (%)
    warning_threshold DECIMAL(12, 2) NULL,   -- Misal 90.00 (%)
    danger_threshold DECIMAL(12, 2) NULL,    -- Misal 85.00 (%)
    description TEXT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL
);

-- 2. Snapshot Nilai KPI Berkala (Harian / Mingguan / Bulanan)
CREATE TABLE kpi_metric_snapshots (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    kpi_definition_id BIGINT UNSIGNED NOT NULL,
    period_type ENUM('daily', 'weekly', 'monthly', 'yearly') NOT NULL,
    period_date DATE NOT NULL,               -- Tanggal periode (misal 2026-10-20)
    actual_value DECIMAL(15, 2) NOT NULL,
    target_value DECIMAL(15, 2) NOT NULL,
    variance DECIMAL(15, 2) DEFAULT 0,       -- Selisih actual vs target
    status ENUM('success', 'warning', 'danger') NOT NULL,
    metadata JSON NULL,                      -- Rincian data pendukung (misal ID PO yang terlambat)
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    FOREIGN KEY (kpi_definition_id) REFERENCES kpi_definitions(id) ON DELETE CASCADE,
    UNIQUE KEY unique_metric_period (kpi_definition_id, period_type, period_date)
);

-- 3. Target KPI Kustom per Periode (Opsional jika target berubah tiap kuartal)
CREATE TABLE kpi_targets (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    kpi_definition_id BIGINT UNSIGNED NOT NULL,
    period_type ENUM('monthly', 'quarterly', 'yearly') NOT NULL,
    year INT NOT NULL,
    period_number INT NOT NULL,             -- Bulan (1-12) atau Kuartal (1-4)
    target_value DECIMAL(12, 2) NOT NULL,
    set_by BIGINT UNSIGNED NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    FOREIGN KEY (kpi_definition_id) REFERENCES kpi_definitions(id) ON DELETE CASCADE,
    FOREIGN KEY (set_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 4. Log Alert / Notifikasi Kinerja Kritis
CREATE TABLE kpi_alerts (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    kpi_definition_id BIGINT UNSIGNED NOT NULL,
    alert_date DATE NOT NULL,
    alert_level ENUM('warning', 'critical') NOT NULL,
    message TEXT NOT NULL,
    context_data JSON NULL,                 -- Menyimpan JobTicket ID atau Supplier ID penyebab
    is_acknowledged BOOLEAN DEFAULT FALSE,
    acknowledged_by BIGINT UNSIGNED NULL,
    acknowledged_at TIMESTAMP NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    FOREIGN KEY (kpi_definition_id) REFERENCES kpi_definitions(id) ON DELETE CASCADE,
    FOREIGN KEY (acknowledged_by) REFERENCES users(id) ON DELETE SET NULL
);
```

---

## 6. ARSITEKTUR KOMPONEN FRONTEND & UI/UX

Menggunakan stack modern Victory Core: **Inertia.js + React + Tailwind CSS + Lucide Icons + Recharts / Chart.js**:

1. **Komponen Visualisasi Utama**:
   - `MetricStatCard`: Kartu metrik dengan angka utama, *trend indicator* (hijau naik / merah turun), target pill, dan sparkline chart kecil.
   - `ParetoDefectChart`: Diagram batang frekuensi defect dikombinasikan dengan garis persentase kumulatif 80/20.
   - `OTDGaugeMeter`: Visualisasi speedometer performa ketepatan pengiriman pabrik.
   - `CostVarianceHeatmap`: Tabel heatmap warna artikel mana yang over-budget dan artikel mana yang efisien.
   - `ThroughputTrendBar`: Grafik batang perbandingan target output harian vs realisasi per stasiun kerja.

2. **Halaman Antarmuka Baru**:
   - `resources/js/pages/admin/kpi/ExecutiveDashboard.tsx`
   - `resources/js/pages/admin/kpi/ProductionQcKpi.tsx`
   - `resources/js/pages/admin/kpi/CommercialFinancialKpi.tsx`
   - `resources/js/pages/admin/kpi/SupplierPurchasingKpi.tsx`
   - `resources/js/pages/admin/kpi/Settings.tsx` (Setting target metrik & threshold warna)

---

## 7. ROADMAP TAHAPAN PENGERJAAN MODUL KPI

| Tahap | Modul & Komponen | Output & Deliverables | Estimasi |
| :--- | :--- | :--- | :--- |
| **Tahap 1** | **Foundational Schema & Aggregation Engine**<br>- Migrasi Database KPI<br>- Seeder Definisi Metrik Standar<br>- Service `KpiCalculationService` & Artisan Command | Backend kalkulasi metrik siap mengeksekusi perhitungan dari data transaksi riil. | Sprint 1 |
| **Tahap 2** | **Production & Quality (QC) KPI Module**<br>- Perhitungan OTD, FTPR, Defect Rate<br>- Halaman `ProductionQcKpi.tsx`<br>- Pareto Chart Kerusakan Kain & Jahitan | Kepala Produksi dan QC memiliki papan pantau kualitas dan efisiensi lantai pabrik. | Sprint 2 |
| **Tahap 3** | **Financial & Cost Variance KPI Module**<br>- Perhitungan GPM, Cost Variance (BOM vs Actual)<br>- Integrasi dengan modul Accounting Stage 2<br>- Analisis DSO & Piutang | Owner & Finance dapat melihat profit margin riil dan mendeteksi kebocoran HPP seketika. | Sprint 3 |
| **Tahap 4** | **Commercial, Sales & Purchasing KPI**<br>- Win Rate Quotation & Sales Lead Time<br>- Supplier Quality & Lead Time Scorecard<br>- Halaman analitik vendor/supplier | Pimpinan dapat mengevaluasi efektivitas tim sales dan keandalan supplier bahan. | Sprint 4 |
| **Tahap 5** | **Executive Owner Dashboard & Alerting System**<br>- Executive Dashboard terpadu<br>- Notifikasi Anomali / Peringatan Dini (Kritis)<br>- Export Laporan KPI berkala (PDF/Excel) | Sistem KPI aktif penuh, siap menyajikan insight cerdas bagi kemajuan Victory Core. | Sprint 5 |

---
*Dokumen ini dirancang sebagai acuan kerja implementasi Stage 2 - Modul KPI pada sistem Victory Core.*
