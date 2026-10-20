# RENCANA PENGEMBANGAN MODUL STAGE 2: ACCOUNTING (AKUNTANSI TERPADU)
## VICTORY CORE MANAGEMENT SYSTEM
**Dokumen Desain Sistem & Rencana Kerja Modul Akuntansi Garment Manufacturing**

---

## 1. PENDAHULUAN & TUJUAN
Sistem operasional **Victory Core** saat ini (Stage 1) telah berhasil mencakup alur fisik dan administrasi operasional:
- *Order Entry & Job Ticket*
- *BOM & Product Master Data*
- *Costing & Quotation*
- *Purchasing & Material Receiving*
- *Worker Board, QC Board, Defect History, Packing, & Delivery*
- *Invoicing (DP 50% & Pelunasan) & Payment Verification dasar*
- *Laporan Profit & Loss Gross (GOP) berbasis estimasi BOM vs invoice*

**Tujuan Stage 2 (Accounting)**:
Mentransformasikan data operasional di atas menjadi sistem akuntansi keuangan (*financial accounting*) dan akuntansi biaya pabrikasi (*job order cost accounting*) berbasis **double-entry bookkeeping** (debit/kredit) yang otomatis, terintegrasi, dan mematuhi Standar Akuntansi Keuangan (SAK/ETAP/EMKM).

---

## 2. PEMETAAN SUMBER FINANSIAL SISTEM SAAT INI (AS-IS TO TO-BE)

Untuk merancang modul akuntansi yang presisi, seluruh pos keuangan harus dipetakan langsung dari tabel dan proses yang sudah ada di Victory Core:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                          PEMETAAN SUMBER FINANSIAL VICTORY CORE                        │
├─────────────────────┬────────────────────────────────┬─────────────────────────────────┤
│ Pos Finansial       │ Sumber Data Saat Ini (Stage 1) │ Integrasi Akuntansi (Stage 2)   │
├─────────────────────┼────────────────────────────────┼─────────────────────────────────┤
│ 1. Modal / Ekuitas  │ - `company_profiles`           │ Akun Modal Disetor (3-1000)     │
│                     │ - Belum ada pencatatan modal   │ Saldo Awal Kas/Bank (1-1100)    │
│                     │   kerja atau kas awal          │ Laba Ditahan / P&L (3-2000)     │
├─────────────────────┼────────────────────────────────┼─────────────────────────────────┤
│ 2. Pendapatan       │ - `invoices.total_tagihan`     │ Piutang Usaha (AR) (1-1200)     │
│    (Revenue)        │   (kategori: sample, produksi) │ Pendapatan Produksi (4-1000)    │
│                     │ - `invoices.delivery_cost`     │ Pendapatan Sample (4-2000)      │
│                     │ - `quotation_items` snapshot   │ Pendapatan Ongkir (4-3000)      │
├─────────────────────┼────────────────────────────────┼─────────────────────────────────┤
│ 3. Kas Masuk        │ - `payments.jumlah_bayar`      │ Kas/Bank Tujuan (1-1100)        │
│    (Cash Inflow)    │ - Status `verified`            │ Pengurang Piutang (AR) (1-1200) │
│                     │ - `payment_method`             │ Uang Muka Pelanggan (2-1200)    │
├─────────────────────┼────────────────────────────────┼─────────────────────────────────┤
│ 4. HPP: Bahan Baku  │ - `purchasings.total_harga`    │ Persediaan Bahan (1-1300)       │
│    (Direct Material)│ - `pesanan_material_specs`     │ Hutang Usaha (AP) (2-1100)      │
│                     │ - `material_receivings`        │ HPP - Bahan Baku Riil (5-1000)  │
├─────────────────────┼────────────────────────────────┼─────────────────────────────────┤
│ 5. HPP: Tenaga Kerja│ - `pesanan_manufacturing_specs`│ Biaya Tenaga Kerja (5-2000)     │
│    Langsung (BTKL)  │   (vendor_id IS NULL)          │ Hutang Gaji Borongan (2-1300)   │
│                     │ - `production_run_processes`   │ Kas/Bank saat dibayar (1-1100)  │
│                     │   (worker_qty * cost_per_pcs)  │                                 │
├─────────────────────┼────────────────────────────────┼─────────────────────────────────┤
│ 6. HPP: Makloon/Sub-│ - `pesanan_manufacturing_specs`│ Biaya Makloon/Subcon (5-3000)   │
│    kontrak (Vendor) │   (vendor_id IS NOT NULL)      │ Hutang Vendor Makloon (2-1110)  │
│                     │ - `production_run_processes`   │                                 │
├─────────────────────┼────────────────────────────────┼─────────────────────────────────┤
│ 7. HPP: Defect/Scrap│ - `production_qc_logs`         │ Beban Kerusakan/Scrap (5-4000)  │
│    & Rework Cost    │ - `production_defect_histories`│ Persediaan Bahan / BTKL Rework  │
├─────────────────────┼────────────────────────────────┼─────────────────────────────────┤
│ 8. Beban Operasional│ - Belum ada pencatatan         │ Beban Operasional (OPEX) (6-xxx)│
│    (OPEX)           │   (gaji staf, listrik, sewa)   │ Kasbon & Petty Cash (1-1120)    │
└─────────────────────┴────────────────────────────────┴─────────────────────────────────┘
```

---

## 3. STRUKTUR CHART OF ACCOUNTS (COA) KHUSUS GARMENT
Struktur rekening standar 5 digit yang dirancang spesifik untuk alur manufaktur Victory Core:

### Aset (1-0000)
- **1-1000 Aset Lancar**
  - `1-1100` Kas & Bank
    - `1-1110` Kas Operasional (Petty Cash Pabrik)
    - `1-1120` Bank Central Asia (BCA Operasional)
    - `1-1130` Bank Mandiri (Rekening Penerimaan)
  - `1-1200` Piutang Usaha (Accounts Receivable)
    - `1-1210` Piutang Pelanggan Produksi
    - `1-1220` Piutang Pelanggan Sample
    - `1-1290` Cadangan Kerugian Piutang
  - `1-1300` Persediaan (Inventory)
    - `1-1310` Persediaan Bahan Baku (Kain/Fabric)
    - `1-1320` Persediaan Aksesoris (Kancing, Resleting, Label, Benang)
    - `1-1330` Barang Dalam Proses (Work In Progress / WIP)
    - `1-1340` Persediaan Barang Jadi (Finished Goods)
  - `1-1400` Biaya Dibayar Dimuka & Uang Muka
    - `1-1410` Uang Muka Pembelian Bahan (DP ke Supplier)
    - `1-1420` Uang Muka Vendor Makloon (DP Sablon/Bordir)
- **1-2000 Aset Tetap**
  - `1-2100` Peralatan & Mesin Pabrik (Mesin Jahit, Obras, Cutting)
  - `1-2190` Akumulasi Penyusutan Mesin Pabrik
  - `1-2200` Peralatan Kantor & Komputer
  - `1-2290` Akumulasi Penyusutan Peralatan Kantor

### Kewajiban / Liabilitas (2-0000)
- **2-1000 Kewajiban Jangka Pendek**
  - `2-1100` Hutang Usaha (Accounts Payable)
    - `2-1110` Hutang Supplier Bahan Baku
    - `2-1120` Hutang Supplier Aksesoris
    - `2-1130` Hutang Vendor Makloon (Sablon, Bordir, Wash)
  - `2-1200` Uang Muka Penjualan (Customer Deposits)
    - `2-1210` Uang Muka Pesanan Produksi (DP 50% Pelanggan)
    - `2-1220` Uang Muka Sample
  - `2-1300` Hutang Biaya & Tenaga Kerja
    - `2-1310` Hutang Gaji Borongan Worker (Upah Jahit/Potong Belum Dibayar)
    - `2-1320` Hutang Gaji Staf & Manajemen
    - `2-1330` Hutang Ekspedisi / Ongkir

### Ekuitas / Modal (3-0000)
- `3-1000` Modal Disetor Pemilik (Owner Capital)
- `3-2000` Laba Ditahan (Retained Earnings)
- `3-3000` Laba/Rugi Periode Berjalan (Current Year Earnings)
- `3-4000` Prive Pemilik (Owner Drawings)

### Pendapatan (Revenue) (4-0000)
- `4-1000` Pendapatan Penjualan Produksi (Pakaian Jadi)
- `4-2000` Pendapatan Penjualan Sample (Prototyping)
- `4-3000` Pendapatan Jasa Pengiriman (Ongkos Kirim Reimbursable)
- `4-9000` Diskon Penjualan & Retur

### Harga Pokok Penjualan (HPP / COGS) (5-0000)
- `5-1000` Biaya Bahan Baku Langsung (Direct Materials)
  - `5-1100` Biaya Kain / Fabric Utama
  - `5-1200` Biaya Aksesoris & Trims
- `5-2000` Biaya Tenaga Kerja Langsung (Direct Labor)
  - `5-2100` Upah Operator Potong (Cutting)
  - `5-2200` Upah Operator Jahit (Sewing)
  - `5-2300` Upah Finishing & Buang Benang
- `5-3000` Biaya Makloon / Subkontrak (Subcontracting)
  - `5-3100` Biaya Sablon (Screen Printing / DTF)
  - `5-3200` Biaya Bordir Komputer (Embroidery)
  - `5-3300` Biaya Washing / Treatment Garment
- `5-4000` Biaya Kerusakan & Rework (Scrap & Defect Cost)
- `5-5000` Biaya Overhead Pabrik Langsung (FOH)
  - `5-5100` Biaya Packing (Plastik, Polybag, Kardus)
  - `5-5200` Pemeliharaan & Jarum Mesin

### Beban Operasional (OPEX) (6-0000)
- `6-1000` Beban Gaji & Karyawan Tetap (Admin, Desain, QC, Supervisor)
- `6-2000` Beban Sewa Tempat & Pabrik
- `6-3000` Beban Utilitas Pabrik (Listrik Industri, Air, Internet)
- `6-4000` Beban Pemasaran & Representasi
- `6-5000` Beban Transportasi & Pengiriman Internal
- `6-6000` Beban Penyusutan Aset Tetap
- `6-7000` Beban Perlengkapan Kantor & Konsumsi Pabrik

---

## 4. ATURAN JURNAL OTOMATIS BERBASIS EVENT (EVENT-DRIVEN AUTO-JOURNAL)

Sistem Victory Core akan mencatat jurnal otomatis tanpa operator harus mengerti debet/kredit:

```
                  ┌─────────────────────────────────────────────────────────┐
                  │                 OPERASIONAL VICTORY CORE                │
                  └──────────────────────────┬──────────────────────────────┘
                                             │ Trigger Event
                                             ▼
 ┌────────────────────────────────────────────────────────────────────────────────────────┐
 │ 1. INVOICE TERBIT (DP / SAMPLE / PELUNASAN)                                            │
 │    Debit  : 1-1210 Piutang Usaha                                          Rp X.XXX.XXX │
 │    Kredit : 2-1210 Uang Muka Pesanan (Jika DP)                            Rp X.XXX.XXX │
 │    (Atau Kredit: 4-1000 Pendapatan Produksi saat barang dikirim)                       │
 ├────────────────────────────────────────────────────────────────────────────────────────┤
 │ 2. VERIFIKASI PEMBAYARAN CUSTOMER (Payment Verified by Finance)                        │
 │    Debit  : 1-1120 Kas/Bank (BCA/Mandiri)                                 Rp X.XXX.XXX │
 │    Kredit : 1-1210 Piutang Usaha Pelanggan                                Rp X.XXX.XXX │
 ├────────────────────────────────────────────────────────────────────────────────────────┤
 │ 3. PENERIMAAN MATERIAL DARI PURCHASING (Material Receiving "Good")                     │
 │    Debit  : 1-1310 Persediaan Bahan Baku                                  Rp X.XXX.XXX │
 │    Kredit : 2-1110 Hutang Usaha Supplier                                  Rp X.XXX.XXX │
 ├────────────────────────────────────────────────────────────────────────────────────────┤
 │ 4. PELEPASAN BAHAN KE PRODUKSI (Bahan Mulai Dipotong / Cutting)                        │
 │    Debit  : 1-1330 Barang Dalam Proses (WIP - Material)                   Rp X.XXX.XXX │
 │    Kredit : 1-1310 Persediaan Bahan Baku                                  Rp X.XXX.XXX │
 ├────────────────────────────────────────────────────────────────────────────────────────┤
 │ 5. PEKERJAAN INTERNAL SELESAI (Worker Board Completed Process)                         │
 │    Debit  : 1-1330 Barang Dalam Proses (WIP - Labor)                      Rp X.XXX.XXX │
 │    Kredit : 2-1310 Hutang Upah Borongan Worker                            Rp X.XXX.XXX │
 ├────────────────────────────────────────────────────────────────────────────────────────┤
 │ 6. PEKERJAAN MAKLOON SELESAI (Vendor Subcon Completed)                                 │
 │    Debit  : 1-1330 Barang Dalam Proses (WIP - Makloon)                    Rp X.XXX.XXX │
 │    Kredit : 2-1130 Hutang Vendor Makloon                                  Rp X.XXX.XXX │
 ├────────────────────────────────────────────────────────────────────────────────────────┤
 │ 7. QC & REWORK / DEFECT (Barang Rusak / Gagal QC)                                      │
 │    Debit  : 5-4000 Biaya Defect & Rework (Biaya Periode)                  Rp X.XXX.XXX │
 │    Kredit : 1-1330 Barang Dalam Proses (WIP)                              Rp X.XXX.XXX │
 ├────────────────────────────────────────────────────────────────────────────────────────┤
 │ 8. PACKING & DELIVERY SELESAI (Produksi Lolos & Dikirim ke Customer)                   │
 │    Debit  : 5-1000 HPP - Bahan Baku                                       Rp X.XXX.XXX │
 │    Debit  : 5-2000 HPP - Tenaga Kerja                                     Rp X.XXX.XXX │
 │    Debit  : 5-3000 HPP - Makloon                                          Rp X.XXX.XXX │
 │    Kredit : 1-1330 Barang Dalam Proses (WIP)                              Rp X.XXX.XXX │
 │    ----------------------------------------------------------------------------------- │
 │    Pengakuan Pendapatan dari Uang Muka:                                                │
 │    Debit  : 2-1210 Uang Muka Pesanan                                      Rp X.XXX.XXX │
 │    Kredit : 4-1000 Pendapatan Produksi                                    Rp X.XXX.XXX │
 ├────────────────────────────────────────────────────────────────────────────────────────┤
 │ 9. PEMBAYARAN HUTANG SUPPLIER / VENDOR / UPAH WORKER                                   │
 │    Debit  : 2-1110 Hutang Usaha Supplier / 2-1310 Hutang Upah             Rp X.XXX.XXX │
 │    Kredit : 1-1120 Kas/Bank                                               Rp X.XXX.XXX │
 └────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. MODUL-MODUL RINCI YANG AKAN DIKERJAKAN

### MODUL AC-01: Master Rekening (Chart of Accounts & General Ledger)
- **Tujuan**: Mengelola daftar akun, kodefikasi hierarki (Header, Sub-header, Detail), saldo awal, dan buku besar.
- **Fitur**:
  - CRUD Akun Akuntansi dengan validasi tipe akun (`asset`, `liability`, `equity`, `revenue`, `cogs`, `expense`).
  - Fitur Import/Export COA standar konveksi.
  - Setting akun default sistem (Default Cash, Default AR, Default AP, Default WIP, Default Retained Earnings).
  - Tampilan General Ledger (Buku Besar) per akun dengan filter rentang tanggal, pencarian nomor referensi, dan running balance.

### MODUL AC-02: Mesin Auto-Journal & Jurnal Manual
- **Tujuan**: Mencatat setiap transaksi debit-kredit secara seimbang (*balanced double-entry*) dengan audit trail.
- **Fitur**:
  - `AccountingJournalService` untuk mencatat jurnal otomatis dari trigger event sistem.
  - Form Jurnal Penyesuaian (Manual Journal Entry) untuk transaksi non-otomatis (misal: setoran modal awal, penyusutan aset, koreksi pembukuan).
  - Validasi ketat: Total Debit = Total Credit sebelum transaksi di-*commit*.
  - Lock Period: Penguncian buku bulanan/tahunan untuk mencegah manipulasi data historis.

### MODUL AC-03: Job Order Costing (HPP Riil per PO & Artikel)
- **Tujuan**: Menghitung secara akurat biaya pokok pembuatan setiap baju/artikel, membandingkan HPP Estimasi (BOM) dengan HPP Riil (Actual).
- **Fitur**:
  - **Material Cost Real**: Diambil dari harga aktual pembelian bahan pada `purchasings` yang diserap oleh pesanan.
  - **Labor Cost Real**: Dihitung dari output `production_run_processes` dikali tarif upah per proses.
  - **Subcontract Cost Real**: Dihitung dari tagihan vendor makloon (sablon/bordir) terkait Job Ticket.
  - **Scrap/Defect Cost**: Alokasi biaya bahan yang terbuang dari `production_qc_logs` & `production_defect_histories`.
  - **Cost Variance Analysis**: Analisis selisih (Untung/Rugi) antara penawaran di Quotation vs biaya sesungguhnya di lapangan per artikel.

### MODUL AC-04: Accounts Receivable (AR / Piutang Usaha)
- **Tujuan**: Monitoring tagihan pelanggan yang belum dibayar, jatuh tempo, dan riwayat penerimaan kas.
- **Fitur**:
  - Integrasi dengan `invoices` & `payments`.
  - Buku Pembantu Piutang (Sub-ledger AR) per Customer.
  - **Aging Schedule AR**: Pengelompokan umur piutang (Current, 1-30 hari, 31-60 hari, 61-90 hari, >90 hari).
  - Reminder notifikasi otomatis untuk tagihan mendekati jatuh tempo atau lewat tempo.
  - Statement of Account (Laporan Rekening Koran Tagihan Customer).

### MODUL AC-05: Accounts Payable (AP / Hutang Usaha & Vendor)
- **Tujuan**: Pengelolaan kewajiban pembayaran kepada Supplier Bahan/Aksesoris dan Vendor Makloon.
- **Fitur**:
  - Pembuatan Tagihan Pembelian (Vendor Bills) yang di-*generate* otomatis saat `material_receivings` diverifikasi berstatus `good`.
  - Buku Pembantu Hutang (Sub-ledger AP) per Supplier dan per Vendor.
  - **Aging Schedule AP**: Monitoring jadwal pembayaran ke supplier untuk menjaga arus kas.
  - Form Pembayaran Hutang Supplier dengan pilihan rekening bank pengirim dan bukti pembayaran.

### MODUL AC-06: Manajemen Kas, Bank & Kas Kecil (Petty Cash)
- **Tujuan**: Mengontrol saldo riil seluruh rekening bank dan kas kecil di kantor/pabrik.
- **Fitur**:
  - Pengelolaan multi-rekening bank (sinkronisasi dengan `company_profiles`).
  - Mutasi Kas & Bank harian.
  - Kasbon & Reimbursement Karyawan Pabrik dengan sistem Kas Kecil Imprest (*Imprest Petty Cash System*).
  - Rekonsiliasi Bank: Mencocokkan mutasi sistem dengan rekening koran bank (*bank statement reconciliation*).

### MODUL AC-07: Penggajian Borongan Worker & Beban Operasional (OPEX)
- **Tujuan**: Menghitung hak bayar upah pekerja borongan pabrik dan pencatatan biaya rutin non-produksi.
- **Fitur**:
  - **Payroll Borongan Operator**: Menghitung rekap pcs yang diselesaikan oleh setiap pekerja dari Worker Board (`production_run_processes`) dikalikan tarif upah, menghasilkan slip gaji borongan mingguan/bulanan.
  - **Expense Tracker (OPEX)**: Form pencatatan beban operasional (Listrik pabrik, sewa gedung, internet, perbaikan mesin jahit, ATK, konsumsi lembur).
  - Integrasi otomatis pembayaran beban ke jurnal dan arus kas keluar.

### MODUL AC-08: Laporan Keuangan Standar (Financial Statements)
- **Tujuan**: Menghasilkan laporan keuangan resmi untuk Owner dan manajemen.
- **Laporan yang dihasilkan**:
  1. **Laporan Laba Rugi Komprehensif (Profit & Loss Statement - Multi-Step)**:
     - Pendapatan Bersih
     - Harga Pokok Penjualan (Bahan + Tenaga Kerja + Makloon + Defect)
     - Laba Kotor (Gross Profit)
     - Beban Operasional (Beban Umum & Administrasi, Pemasaran)
     - Laba Operasional (Operating Profit / EBIT)
     - Laba Bersih (Net Profit)
  2. **Neraca (Balance Sheet)**:
     - Total Aset = Total Kewajiban + Total Ekuitas
  3. **Laporan Arus Kas (Cash Flow Statement)**:
     - Arus Kas dari Aktivitas Operasi
     - Arus Kas dari Aktivitas Investasi
     - Arus Kas dari Aktivitas Pendanaan
  4. **Neraca Saldo (Trial Balance)** & Buku Besar Pembantu.
  5. Fitur Export Laporan ke format Excel (.xlsx) dan PDF resmi bertanda tangan.

---

## 6. RANCANGAN SKEMA DATABASE BARU

```sql
-- 1. Chart of Accounts (COA)
CREATE TABLE chart_of_accounts (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    account_code VARCHAR(20) NOT NULL UNIQUE,
    account_name VARCHAR(150) NOT NULL,
    category ENUM('asset', 'liability', 'equity', 'revenue', 'cogs', 'expense') NOT NULL,
    sub_category VARCHAR(100) NULL,
    normal_balance ENUM('debit', 'credit') NOT NULL,
    parent_id BIGINT UNSIGNED NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    FOREIGN KEY (parent_id) REFERENCES chart_of_accounts(id) ON DELETE SET NULL
);

-- 2. Journal Headers
CREATE TABLE journal_entries (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    entry_number VARCHAR(50) NOT NULL UNIQUE,
    entry_date DATE NOT NULL,
    reference_type VARCHAR(100) NULL, -- 'invoice', 'payment', 'purchasing', 'receiving', 'production_run', 'payroll', 'expense'
    reference_id BIGINT UNSIGNED NULL,
    job_ticket_id BIGINT UNSIGNED NULL,
    description TEXT NOT NULL,
    total_debit DECIMAL(15, 2) DEFAULT 0,
    total_credit DECIMAL(15, 2) DEFAULT 0,
    is_auto_generated BOOLEAN DEFAULT FALSE,
    status ENUM('draft', 'posted', 'void') DEFAULT 'posted',
    created_by BIGINT UNSIGNED NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    FOREIGN KEY (job_ticket_id) REFERENCES job_tickets(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 3. Journal Lines (Debet & Kredit)
CREATE TABLE journal_entry_lines (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    journal_entry_id BIGINT UNSIGNED NOT NULL,
    account_id BIGINT UNSIGNED NOT NULL,
    debit DECIMAL(15, 2) DEFAULT 0,
    credit DECIMAL(15, 2) DEFAULT 0,
    memo VARCHAR(255) NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    FOREIGN KEY (journal_entry_id) REFERENCES journal_entries(id) ON DELETE CASCADE,
    FOREIGN KEY (account_id) REFERENCES chart_of_accounts(id)
);

-- 4. Vendor Bills (Tagihan Supplier Bahan & Vendor Makloon)
CREATE TABLE vendor_bills (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    bill_number VARCHAR(50) NOT NULL UNIQUE,
    supplier_id BIGINT UNSIGNED NOT NULL,
    job_ticket_id BIGINT UNSIGNED NULL,
    purchasing_id BIGINT UNSIGNED NULL,
    bill_date DATE NOT NULL,
    due_date DATE NOT NULL,
    total_amount DECIMAL(15, 2) NOT NULL,
    paid_amount DECIMAL(15, 2) DEFAULT 0,
    status ENUM('draft', 'unpaid', 'partially_paid', 'paid', 'cancelled') DEFAULT 'unpaid',
    notes TEXT NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
    FOREIGN KEY (job_ticket_id) REFERENCES job_tickets(id) ON DELETE SET NULL,
    FOREIGN KEY (purchasing_id) REFERENCES purchasings(id) ON DELETE SET NULL
);

-- 5. Vendor Bill Payments (Pembayaran ke Supplier/Vendor)
CREATE TABLE vendor_bill_payments (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    vendor_bill_id BIGINT UNSIGNED NOT NULL,
    payment_date DATE NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    account_id BIGINT UNSIGNED NOT NULL, -- Rekening Bank/Kas pengirim
    proof_path VARCHAR(255) NULL,
    notes TEXT NULL,
    paid_by BIGINT UNSIGNED NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    FOREIGN KEY (vendor_bill_id) REFERENCES vendor_bills(id) ON DELETE CASCADE,
    FOREIGN KEY (account_id) REFERENCES chart_of_accounts(id),
    FOREIGN KEY (paid_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 6. Operational Expenses (Beban Operasional Rutin)
CREATE TABLE operational_expenses (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    expense_number VARCHAR(50) NOT NULL UNIQUE,
    account_id BIGINT UNSIGNED NOT NULL, -- Akun Beban (6-xxxx)
    payment_account_id BIGINT UNSIGNED NOT NULL, -- Akun Kas/Bank (1-11xx)
    expense_date DATE NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    category VARCHAR(100) NOT NULL,
    recipient VARCHAR(150) NULL,
    description TEXT NOT NULL,
    proof_path VARCHAR(255) NULL,
    created_by BIGINT UNSIGNED NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    FOREIGN KEY (account_id) REFERENCES chart_of_accounts(id),
    FOREIGN KEY (payment_account_id) REFERENCES chart_of_accounts(id),
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 7. Job Order Costing Snapshots
CREATE TABLE job_order_costs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    pesanan_id BIGINT UNSIGNED NOT NULL UNIQUE,
    job_ticket_id BIGINT UNSIGNED NOT NULL,
    estimated_material_cost DECIMAL(15, 2) DEFAULT 0,
    actual_material_cost DECIMAL(15, 2) DEFAULT 0,
    estimated_labor_cost DECIMAL(15, 2) DEFAULT 0,
    actual_labor_cost DECIMAL(15, 2) DEFAULT 0,
    estimated_subcon_cost DECIMAL(15, 2) DEFAULT 0,
    actual_subcon_cost DECIMAL(15, 2) DEFAULT 0,
    defect_scrap_cost DECIMAL(15, 2) DEFAULT 0,
    total_estimated_cogs DECIMAL(15, 2) DEFAULT 0,
    total_actual_cogs DECIMAL(15, 2) DEFAULT 0,
    revenue_billed DECIMAL(15, 2) DEFAULT 0,
    gross_profit DECIMAL(15, 2) DEFAULT 0,
    gross_margin_pct DECIMAL(5, 2) DEFAULT 0,
    status ENUM('in_progress', 'completed', 'settled') DEFAULT 'in_progress',
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    FOREIGN KEY (pesanan_id) REFERENCES pesanan(id) ON DELETE CASCADE,
    FOREIGN KEY (job_ticket_id) REFERENCES job_tickets(id) ON DELETE CASCADE
);
```

---

## 7. ROADMAP TAHAPAN PENGERJAAN MODUL ACCOUNTING

| Tahap | Modul & Komponen | Output & Deliverables | Estimasi |
| :--- | :--- | :--- | :--- |
| **Tahap 1** | **Foundational Accounting**<br>- Migrasi Database COA & Journal<br>- Master COA Seeder standar konveksi<br>- Service `AccountingJournalService` | Database siap, COA CRUD di UI Admin, Journal engine siap menerima posting. | Sprint 1 |
| **Tahap 2** | **Automated Invoicing & AR Integration**<br>- Auto-journal Invoice & Verified Payment<br>- Sub-ledger Piutang Pelanggan<br>- AR Aging Schedule UI | Setiap verifikasi pembayaran invoice otomatis membentuk jurnal & update kartu piutang. | Sprint 2 |
| **Tahap 3** | **Purchasing, Receiving & AP Integration**<br>- Vendor Bills dari Receiving Material<br>- Pembayaran Tagihan Supplier<br>- AP Aging Schedule UI | Hutang supplier dan vendor makloon tercatat rapi dan otomatis saat bahan datang. | Sprint 3 |
| **Tahap 4** | **Job Order Costing & Shopfloor Integration**<br>- Akumulasi biaya riil bahan dari PO<br>- Akumulasi upah tenaga kerja dari Worker Board<br>- Pembebanan defect & scrap cost | HPP riil per artikel terhitung otomatis saat produksi selesai. | Sprint 4 |
| **Tahap 5** | **Expense Management & Cash/Bank**<br>- Modul Pencatatan Beban OPEX<br>- Kas Kecil (Petty Cash) & Kasbon<br>- Rekonsiliasi Bank | Pengeluaran harian dan saldo seluruh rekening kas/bank tercatat akurat. | Sprint 5 |
| **Tahap 6** | **Financial Reporting & Polish**<br>- Laporan Laba Rugi (P&L)<br>- Neraca (Balance Sheet)<br>- Laporan Arus Kas (Cash Flow)<br>- Export Excel & PDF resmi | Laporan keuangan eksekutif lengkap dan dapat diunduh oleh Owner & Finance. | Sprint 6 |

---
*Dokumen ini dirancang sebagai acuan kerja implementasi Stage 2 - Modul Accounting pada sistem Victory Core.*
