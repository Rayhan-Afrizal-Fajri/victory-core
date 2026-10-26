# PROGRESS & TODO LIST: STAGE 2 (ACCOUNTING & KPI MODULE)
**Victory Core Management System**
*Terakhir Diperbarui: 26 Oktober 2026*

---

## 1. RINGKASAN STATUS PENGERJAAN

Semua fondasi database, model, seeder, service kalkulasi, sinkronisasi data riil produksi, dan controller untuk **Modul Akuntansi** dan **Modul KPI** telah berhasil dibangun dan teruji. Data riil dari database production (29 Invoice, 12 Pembayaran Verified, 286 Purchasing, 113 Pesanan/Costing) telah disinkronkan ke dalam sistem pembukuan double-entry dan metrik KPI.

---

## 2. KOMPONEN YANG TELAH SELESAI DIKERJAKAN (COMPLETED)

### A. Database Migrations (Stage 2)
1. `database/migrations/2026_10_26_100001_create_chart_of_accounts_table.php`
   - Tabel `chart_of_accounts`: kode akun, nama akun, kategori (`asset`, `liability`, `equity`, `revenue`, `cogs`, `expense`), sub-kategori, saldo normal (`debit`/`credit`), hierarki induk.
2. `database/migrations/2026_10_26_100002_create_journal_entries_and_lines_tables.php`
   - Tabel `journal_entries`: header jurnal double-entry, referensi transaksi, status, audit trail pembuat.
   - Tabel `journal_entry_lines`: baris debit dan kredit terikat ke akun COA.
3. `database/migrations/2026_10_26_100003_create_vendor_bills_and_payments_tables.php`
   - Tabel `vendor_bills`: tagihan hutang supplier bahan baku & vendor makloon dari purchasing.
   - Tabel `vendor_bill_payments`: pencatatan pembayaran hutang via kas/bank.
4. `database/migrations/2026_10_26_100004_create_operational_expenses_table.php`
   - Tabel `operational_expenses`: pencatatan beban operasional (OPEX) dan kas kecil.
5. `database/migrations/2026_10_26_100005_create_job_order_costs_table.php`
   - Tabel `job_order_costs`: kalkulasi HPP riil per artikel & PO (material, labor, makloon, defect) vs estimasi BOM.
6. `database/migrations/2026_10_26_100006_create_kpi_tables.php`
   - Tabel `kpi_definitions`, `kpi_metric_snapshots`, `kpi_targets`, `kpi_alerts`.

### B. Seeders & Master Data Standar Konveksi
1. `database/seeders/ChartOfAccountSeeder.php`
   - Men-seed **43 akun standar garment** (Kas & Bank BCA/Mandiri/Petty Cash, AR, Persediaan Kain & Aksesoris, WIP, Hutang Supplier, Modal, Pendapatan Produksi & Sample, HPP Bahan/Tenaga Kerja/Makloon/Scrap, dan Beban OPEX).
2. `database/seeders/KpiDefinitionSeeder.php`
   - Men-seed **13 metrik KPI inti** (OTD, Cycle Time, Throughput, Defect Rate, FTPR, GPM, Cost Variance, DSO, Win Rate, AOV, Material Reject Rate, Supplier Lead Time, Worker Output).

### C. Eloquent Models
- **Accounting**:
  - `App\Models\Accounting\ChartOfAccount.php` (dengan kalkulasi dinamis atribut `$balance`)
  - `App\Models\Accounting\JournalEntry.php`
  - `App\Models\Accounting\JournalEntryLine.php`
  - `App\Models\Accounting\VendorBill.php`
  - `App\Models\Accounting\VendorBillPayment.php`
  - `App\Models\Accounting\OperationalExpense.php`
  - `App\Models\Accounting\JobOrderCost.php`
- **KPI**:
  - `App\Models\Kpi\KpiDefinition.php`
  - `App\Models\Kpi\KpiMetricSnapshot.php`
  - `App\Models\Kpi\KpiTarget.php`
  - `App\Models\Kpi\KpiAlert.php`
- Relasi `purchasings()` ditambahkan pada `App\Models\Pesanan.php`.

### D. Backend Engine & Services
1. `App\Services\Accounting\AccountingJournalService.php`
   - Pembuatan entri jurnal otomatis dengan validasi ketat keseimbangan `Total Debit == Total Kredit`.
2. `App\Services\Accounting\AccountingSyncService.php`
   - Mensinkronkan data operasional riil yang sudah ada di database ke sistem akuntansi:
     - 29 Invoice -> Jurnal Pengakuan Piutang (AR) & Pendapatan.
     - 12 Verified Payments -> Jurnal Penerimaan Kas/Bank & Pelunasan AR.
     - 286 Purchasing -> Vendor Bills & Jurnal Hutang Usaha (AP) & Persediaan.
     - 113 Pesanan -> Job Order Costing riil (Bahan Aktual dari PO + Tenaga Kerja dari Run Processes + Makloon + Defect Scrap).
3. `App\Services\Kpi\KpiCalculationService.php`
   - Menghitung metrik performa riil:
     - Executive metrics (Revenue riil, GPM %, OTD %, Defect %, Active Orders, Monthly trend, Funnel, Anomaly alerts).
     - Production & QC metrics (OTD, Defect Rate, First Time Pass Rate, Pareto Defect breakdown, Work center throughput).
     - Commercial & Financial metrics (Quotation Win Rate, Average Order Value, Days Sales Outstanding, Customer Repeat Rate, Cost variance heatmap).
     - Supplier Scorecard (Peringkat supplier, total spend, lead time, reject rate).
     - Worker Productivity (Leaderboard output pcs per operator).

### E. Artisan Console Command
- `App\Console\Commands\SyncAccountingCommand.php`:
  - Perintah CLI: `php artisan victory:sync-accounting`
  - Berhasil dieksekusi dan menghasilkan **327 Journal Entries**, **286 Vendor Bills**, dan **113 Job Order Costs** dari database klien.

### F. Backend Controllers & Routing
- Terdaftar resmi di `routes/web.php` (baik grup authenticated `/admin/...` maupun direct `/prototype/...`):
  - `Admin\Accounting\AccountingOverviewController` (`/admin/accounting`, POST `/admin/accounting/sync`)
  - `Admin\Accounting\ChartOfAccountController` (`/admin/accounting/coa`, POST, PUT, DELETE)
  - `Admin\Accounting\JournalController` (`/admin/accounting/journals`, POST)
  - `Admin\Accounting\JobCostingController` (`/admin/accounting/costing`)
  - `Admin\Accounting\ReceivableController` (`/admin/accounting/receivables`)
  - `Admin\Accounting\PayableController` (`/admin/accounting/payables`, POST `/payables/{id}/payment`)
  - `Admin\Accounting\ExpenseController` (`/admin/accounting/expenses`, POST)
  - `Admin\Accounting\FinancialReportController` (`/admin/accounting/reports`)
  - `Admin\Kpi\KpiExecutiveController` (`/admin/kpi`, `/admin/kpi/executive`)
  - `Admin\Kpi\KpiProductionQcController` (`/admin/kpi/production-qc`)
  - `Admin\Kpi\KpiCommercialFinancialController` (`/admin/kpi/commercial-financial`)
  - `Admin\Kpi\KpiSupplierController` (`/admin/kpi/suppliers`)
  - `Admin\Kpi\KpiWorkerController` (`/admin/kpi/workers`)
  - `Admin\Kpi\KpiAlertController` (POST `/alerts/{id}/acknowledge`, POST `/targets`)

### G. Integrasi Frontend yang Sudah Diupdate (Props & Aksi Riil)
1. `resources/js/pages/admin/accounting/index.tsx`
   - Terhubung dengan props `overview` & `recentJournals` dari controller.
   - Tombol **Sinkronisasi** sekarang menjalankan real POST request ke `/admin/accounting/sync` dengan animasi loading & feedback toaster.
2. `resources/js/pages/admin/accounting/coa.tsx`
   - Terhubung dengan props `accounts` riil dari controller.
   - Form penambahan akun baru melakukan real POST request ke `/admin/accounting/coa`.
3. `resources/js/pages/admin/accounting/journals.tsx`
   - Terhubung dengan entri jurnal riil dari controller.
   - Form pembuatan jurnal manual mengirim data double-entry seimbang ke `/admin/accounting/journals`.
4. `resources/js/pages/admin/accounting/costing.tsx`
   - Terhubung dengan 113 data Job Order Costing riil dari database.
   - Varians biaya (BOM vs Aktual) dan margin keuntungan kotor tampil akurat.
5. `resources/js/pages/admin/accounting/receivables.tsx`
   - Menampilkan daftar tagihan piutang riil dan jadwal aging schedule (Current, 1-30, 31-60, 61-90, >90 hari).
6. `resources/js/pages/admin/accounting/payables.tsx`
   - Menampilkan 286 tagihan supplier riil dari purchasing.
   - Modal pembayaran hutang vendor terhubung ke real POST endpoint `/admin/accounting/payables/{id}/payment` dan otomatis memposting jurnal kas keluar.

---

## 3. CATATAN PEKERJAAN YANG BELUM DILAKUKAN (TODO UNTUK SESI BERIKUTNYA)

Berikut rincian pekerjaan yang belum sempat di-binding secara penuh pada sesi ini:

### 1. Polish Frontend Accounting:
- [ ] **`resources/js/pages/admin/accounting/expenses.tsx`**:
  - Hubungkan form tambah beban operasional (OPEX) dan kas kecil ke endpoint `POST /admin/accounting/expenses`.
  - Bind daftar transaksi beban ke props `expenses` dan `summary` dari `ExpenseController`.
- [ ] **`resources/js/pages/admin/accounting/reports.tsx`**:
  - Bind laporan Laba Rugi (P&L), Neraca (Balance Sheet), dan Neraca Saldo (Trial Balance) ke props riil `incomeStatement`, `balanceSheet`, dan `trialBalance` dari `FinancialReportController`.
  - Sesuaikan baris akun agar menampilkan saldo debit/kredit dinamis dari buku besar.

### 2. Polish Frontend KPI Dashboards:
- [ ] **`resources/js/pages/admin/kpi/executive.tsx`**:
  - Bind props `metrics`, `monthlyTrend`, `salesFunnel`, dan `alerts` dari `KpiExecutiveController`.
  - Hubungkan aksi penutupan alert ke `POST /admin/kpi/alerts/{id}/acknowledge` dan modal edit target ke `POST /admin/kpi/targets`.
- [ ] **`resources/js/pages/admin/kpi/production-qc.tsx`**:
  - Bind props `otdRate`, `defectRate`, `ftprRate`, `paretoDefects` (cacat riil seperti "jahitan miring", "kerah kerut"), dan `workCenterThroughput`.
- [ ] **`resources/js/pages/admin/kpi/commercial-financial.tsx`**:
  - Bind props `winRate`, `aov`, `dso`, `repeatOrderRate`, dan `costVarianceList`.
- [ ] **`resources/js/pages/admin/kpi/suppliers.tsx`**:
  - Bind props `suppliers` (peringkat supplier berdasarkan total belanja & reject rate) dan `urgentIssues`.
- [ ] **`resources/js/pages/admin/kpi/workers.tsx`**:
  - Bind props `workers` leaderboard output pcs operator.

### 3. Background Daily Snapshot Cron:
- [ ] Buat Artisan command `php artisan victory:calculate-kpi` untuk membuat snapshot harian ke tabel `kpi_metric_snapshots`.
- [ ] Daftarkan command ke Laravel Scheduler (`routes/console.php`) agar berjalan otomatis setiap tengah malam.

### 4. Fitur Ekspor Dokumen Resmi (Tahap Lanjutan):
- [ ] Ekspor Laporan Keuangan (Laba Rugi & Neraca) ke format PDF / Excel (.xlsx).
- [ ] Ekspor Statement of Account (Kartu Piutang Customer) untuk penagihan invoice.

---

## 4. CARA MELANJUTKAN DI SESI BERIKUTNYA

Ketika Anda siap melanjutkan, cukup sampaikan:
> *"Lanjutkan integrasi frontend accounting (expenses & reports) dan modul KPI dashboard sesuai TODO di STAGE_2_BACKEND_PROGRESS_AND_TODO.md"*

Sistem akan langsung melanjutkan dari checklist nomor 3 di atas tanpa perlu mengulang setup database atau controller.
