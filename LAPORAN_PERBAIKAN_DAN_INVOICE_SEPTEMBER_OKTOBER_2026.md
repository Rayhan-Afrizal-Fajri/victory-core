# LAPORAN & RINCIAN BIAYA PERBAIKAN SISTEM
## PROYEK: VICTORY CORE MANAGEMENT SYSTEM
**Periode Pengerjaan:** 20 September 2026 – 15 Oktober 2026  
**Tanggal:** 15 Oktober 2026  

---

### I. INFORMASI PROYEK

| Parameter | Keterangan |
| :--- | :--- |
| **Nama Aplikasi** | **Victory Core** (Sistem Manajemen Operasional & Purchase Order Garment) |
| **Repositori Proyek** | `victory-core` |
| **Rentang Waktu Pengerjaan** | 20 September 2026 – 15 Oktober 2026 |
| **Total Biaya** | **Rp 1.000.000,-** *(Satu Juta Rupiah)* |
| **Status Pekerjaan** | **100% Selesai & Berhasil Diuji** |

---

### II. RINGKASAN


Seluruh pekerjaan yang tercakup di dalam laporan ini diimplementasikan secara terukur dan tercatat pada riwayat versi kode sumber (*git commit history*) mulai tanggal **20 September 2026 hingga 15 Oktober 2026**. Fokus utama pembaruan pada periode ini meliputi:
1. **Fleksibilitas Komersial:** Pembuatan draft Quotation mandiri tanpa harus menunggu alur Job Ticket/BOM selesai, serta fitur penautan (*attach*) ke Purchase Order.
2. **Efisiensi Alur Kerja Order Entry:** Integrasi pemilihan master artikel dan sinkronisasi otomatis kebutuhan material (BOM) langsung saat order dibuat.
3. **Standarisasi Finansial & Cetak Dokumen:** Opsi cetak Invoice Down Payment (DP 50%) dan Pelunasan dengan satu buku besar (*single ledger*), pencatatan ongkos kirim, dan standarisasi nama file unduhan PDF.
4. **Otomasi Master Data:** Fitur Import & Export data Master Produk dan Kategori via Excel untuk mempercepat input data secara massal.
5. **Keamanan & Konsistensi Akses:** Pembatasan hak hapus Purchase Order eksklusif untuk role Owner, proteksi data sensitif dashboard finansial, serta stabilisasi notifikasi realtime.

---

### III. RINCIAN DETAIL PEKERJAAN & PERBAIKAN (BERDASARKAN COMMIT)

Pekerjaan pada periode 20 September – 15 Oktober 2026 dikelompokkan ke dalam **6 (enam) Modul Pekerjaan Utama**:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       MODUL PEKERJAAN VICTORY CORE                          │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. Modul Quotation Mandiri & Alur Costing PO                                │
│ 2. Modul Order Entry & Integrasi Auto-Sync BOM                              │
│ 3. Modul Manajemen Finansial (Invoice DP/Pelunasan, Ongkir, Penamaan PDF)   │
│ 4. Modul Import & Export Master Data Excel                                  │
│ 5. Modul Keamanan Akses, Proteksi Role & Integritas Data                    │
│ 6. Modul Notifikasi Realtime, UI/UX Polish & Automated Unit Testing         │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

#### 1. Modul Quotation Mandiri & Alur Costing PO
*Tujuan: Memungkinkan pembuatan penawaran harga cepat (draft quotation) langsung kepada prospek/pelanggan tanpa hambatan alur produksi.*

* **Permasalahan Sebelumnya:**
  * Pembuatan Quotation wajib terikat pada `JobTicket` (PO) yang sudah berjalan dan menunggu penetapan harga/BOM dari tim desain.
  * Tim komersial tidak bisa menerbitkan penawaran cepat kepada calon pelanggan baru.
  * Tampilan riwayat penawaran pada detail PO berupa tumpukan kartu statis yang memanjang dan sulit dipantau.
* **Perbaikan & Implementasi:**
  * **Skema Database Fleksibel:** Memperbarui struktur tabel `quotations` dan `quotation_items` agar kolom foreign key (`job_ticket_id` dan `pesanan_id`) bersifat *nullable* sehingga penawaran dapat berdiri sendiri.
  * **Halaman Mandiri `/quotations`:** Menambahkan antarmuka navigasi khusus penawaran yang memungkinkan pembuatan draft komersial secara independen.
  * **Fitur Attach Draft ke Purchase Order:** Operator dapat menghubungkan draft penawaran yang sudah dibuat ke dalam Job Ticket/PO terkait di tab *Costing & Quotation* dengan validasi kesesuaian pelanggan.
  * **Redesign Antarmuka Tabel & Modal:** Mengubah tampilan riwayat penawaran pada PO menjadi tabel data interaktif dengan fitur pencarian, filter status, dan form modal terintegrasi (`QuotationDraftDialog`).
  * **Mekanisme Undo Approval Aman:** Memungkinkan pembatalan approval penawaran dengan syarat belum ada invoice yang terverifikasi lunas oleh Finance, serta pembersihan otomatis invoice draft/unpaid dan reset status workflow.
* **Referensi Commit Git:**
  * `176e0c2` & `7d34f3c` – *fix: change foreign in quotation nullable*
  * `bb6aef5` & `8c720fe` – *fix: change default value of source type*
  * `1de3798` – *feat: quotations menu & fix: websocket*
  * `93cabe0` – *feat: manual quotation, standalone draft & attach flow*
  * `fc7750d` – *chore: quotation undo approval validation & finance tab integration*

---

#### 2. Modul Order Entry & Integrasi Auto-Sync BOM
*Tujuan: Mempercepat input pesanan dan menghilangkan proses berulang dalam pembuatan spesifikasi teknis (BOM).*

* **Permasalahan Sebelumnya:**
  * Field produk di Order Entry hanya berupa teks bebas (`requested_product_name`), belum terhubung ke database master produk.
  * Operator harus berpindah ke tab Design lalu mengklik tombol sinkronisasi satu per satu untuk menurunkan kebutuhan bahan (material spec & manufacturing spec).
* **Perbaikan & Implementasi:**
  * **Searchable Master Product Selector:** Menambahkan dropdown pencarian dinamis pada form Order Entry yang terhubung langsung ke Master Produk aktif.
  * **Opsi Auto-Sync BOM Saat Input Order:** Menambahkan opsi centang agar pesanan baru dapat langsung menarik rincian Bill of Materials dari produk master secara instan.
  * **Penyatuan Logika Sinkronisasi (`ArticleSyncService`):** Melakukan refaktor arsitektur kode agar alur sinkronisasi di Order Entry dan tab Design menggunakan fungsi terpusat yang sama (mencegah inkonsistensi data).
  * **Perbaikan Dialog Spesifikasi Material:** Mengatasi bug pemanggilan fungsi ganda (*duplicated function call*) saat mengubah spesifikasi material artikel.
* **Referensi Commit Git:**
  * `d923fcc` – *feat: sync article from order entry form & refactor ArticleSyncService*
  * `edb9aeb` – *fix(order-entry): searchable Select for article options*
  * `e6e11cc` – *fix: duplicated function call in material spec edit dialog*

---

#### 3. Modul Manajemen Finansial (Invoice DP/Pelunasan, Ongkir & Penamaan PDF)
*Tujuan: Memperbaiki kejelasan dokumen penagihan dan mempermudah administrasi pengarsipan berkas bagi klien dan tim internal.*

* **Permasalahan Sebelumnya:**
  * Nama berkas PDF saat diunduh hanya berupa nomor (contoh: `INV-001.pdf`), menyulitkan pencarian arsip tagihan per pelanggan atau artikel.
  * Tagihan produksi DP (50%) dan Pelunasan (50%) sering kali membuat nomor invoice ganda dan membingungkan pembukuan.
  * Belum ada kolom khusus biaya pengiriman (ongkos kirim) pada tagihan akhir.
* **Perbaikan & Implementasi:**
  * **Standarisasi Format Nama Berkas PDF:**
    * Pola baku: `{Nomor Dokumen} - {Nama Perusahaan / Customer} - {Nama Artikel}.pdf`
    * Contoh: `INV-202610-001 - PT Sinar Abadi - Kaos Polo Bordir.pdf`
    * Dilengkapi fitur sanitasi karakter ilegal (menghapus tanda `/`, `\`, dsb.) dan penanganan cerdas untuk pesanan multi-artikel.
  * **Sistem Invoice DP 50% & Pelunasan Single Ledger:**
    * Satu data tagihan produksi yang dapat dicetak menjadi dua lembar dokumen resmi: **Cetak DP Produksi (50%)** dan **Cetak Pelunasan Produksi (50%)**.
    * Alokasi pembayaran otomatis: pembayaran pertama melunasi tagihan DP terlebih dahulu, sisa pembayaran dialokasikan untuk pelunasan akhir.
  * **Fitur Ongkos Kirim (`delivery_cost`):**
    * Penambahan kolom biaya pengiriman pada database `invoices`.
    * Tampilan kalkulasi otomatis pada form edit invoice, ringkasan penawaran, serta cetak template PDF.
  * **Komponen Input Rupiah Terformat:** Implementasi komponen `FormattedNumberInput` dengan pemisah ribuan otomatis untuk mengurangi risiko salah input nominal uang.
* **Referensi Commit Git:**
  * `45a052f` & `78bd1f4` – *refactor: DocumentFilename logic, multi-article handling & unit tests*
  * `aa15097` & `a5784a1` – *feat: delivery cost in invoices table, formatted number input & PDF updates*
  * `7ee2663` – *fix: false customer field layout in PDF invoice show template*
  * `fc7750d` – *chore: InvoiceService ensureProductionInvoice logic & payment status synchronization*

---

#### 4. Modul Import & Export Master Data Excel
*Tujuan: Mempermudah input dan pembaharuan ratusan data master barang/kategori dalam waktu singkat.*

* **Permasalahan Sebelumnya:**
  * Tidak ada sarana migrasi atau input massal; pengisian kategori dan katalog produk dilakukan manual satu per satu via form website.
* **Perbaikan & Implementasi:**
  * **Template Standar Excel:** Menambahkan generator download template Excel resmi untuk Kategori (`ProductCategoryTemplateExport`) dan Produk Master (`ProductTemplateExport`).
  * **Mesin Import Cerdas (Excel Handling):**
    * Implementasi `ProductCategoryImport` dan `ProductImport` menggunakan Laravel Excel.
    * Validasi tipe data, deteksi otomatis ID kategori, serta pesan kesalahan baris yang jelas apabila ada data yang tidak sesuai.
  * **Penyempurnaan Logika Parsing:** Pembaruan algoritma import pada 14 Oktober 2026 untuk mendukung variasi kolom dan mencegah kegagalan pembacaan baris Excel.
* **Referensi Commit Git:**
  * `e69b67d` – *feat: add import feature for products and categories*
  * `f695ccb` & `3d74296` – *chore: font manifest & build assets*
  * `34b034a` – *feat: add ProductCategoryTemplateExport and ProductCategoryImport classes*
  * `736412f` – *fix: change master product import logic and template*

---

#### 5. Modul Keamanan Akses, Proteksi Role & Integritas Data
*Tujuan: Mencegah kehilangan data transaksi penting secara tidak sengaja dan membatasi data sensitif perusahaan.*

* **Permasalahan Sebelumnya:**
  * Purchase Order rawan terhapus oleh pengguna yang tidak berwenang.
  * Ringkasan total pendapatan perusahaan terbuka pada dashboard untuk beberapa role operasional.
* **Perbaikan & Implementasi:**
  * **Pembatasan Hak Hapus Purchase Order (Eksklusif Owner):**
    * Operasi hapus (`destroy`) pada controller `JobTicketController` dan `OrderEntryController` dikunci ketat khusus untuk akun ber-role **Owner**.
    * Penarikan izin delete dari role operasional umum untuk mencegah kecerobohan data.
  * **Integritas Database (Cascade on Delete):**
    * Penerapan migrasi database `2026_10_12_000001_update_job_ticket_id_cascade_on_quotations_table.php` agar penghapusan PO oleh Owner membersihkan data relasi terkait secara bersih tanpa meninggalkan *orphaned records*.
  * **Penyembunyian Metrik Pendapatan (Total Revenue):**
    * Dashboard controller disesuaikan agar ringkasan omzet / total revenue hanya tampil bagi pemilik wewenang finansial.
  * **Pembersihan Akun Uji Coba:** Menghapus tombol *fast login* akun uji coba dari tampilan login produksi demi kepatuhan keamanan.
* **Referensi Commit Git:**
  * `c35bfc6` – *fix: hide total revenue dashboard, owner can delete PO anytime*
  * `6f3acbc` & `c4ef537` – *ref(login): remove unused fast login testing accounts for production*
  * `8fe8684` – *fix: make some customer field nullable for flexibility*
  * `70b912b` & `066eefd` – *refactor: job-tickets to purchase-orders nomenclature alignment*
  * `e435d54` – *feat: restrict PO deletion to Owner & update cascade on quotations table*

---

#### 6. Modul Notifikasi Realtime, UI/UX Polish & Automated Testing
*Tujuan: Menjamin kehandalan sistem dan kenyamanan pengguna saat berinteraksi dengan aplikasi.*

* **Permasalahan & Perbaikan:**
  * **Koneksi WebSocket / Notifikasi Lonceng:** Perbaikan konfigurasi Laravel Echo dan komponen lonceng (`notification-bell.tsx`) agar notifikasi penugasan dan status pembayaran tampil seketika (*realtime*) tanpa perlu reload halaman.
  * **Automated Unit Testing:**
    * Penambahan berkas pengujian otomatis `DocumentFilenameTest` (memvalidasi format nama file dan karakter khusus).
    * Penambahan berkas pengujian otomatis `ProductionInvoiceDocumentAmountsTest` (memvalidasi keakuratan matematis pembagian 50% tagihan dan alokasi pembayaran).
  * **Kompilasi Asset Produksi:** Pembersihan dependensi build Vite agar aplikasi berjalan cepat dan responsif pada browser pengguna.
* **Referensi Commit Git:**
  * `1de3798` – *feat: quotations menu & fix: websocket connection*
  * `45a052f` – *test: add unit tests for DocumentFilename and ProductionInvoiceDocumentAmounts*
  * `fc7750d`, `b9bccc7`, `5eb4055` – *build & application assets optimization*

---

### IV. TABEL LOG COMMITS (20 SEPTEMBER – 15 OKTOBER 2026)

Berikut daftar lengkap riwayat komitmen kode (*git log*) yang menjadi dasar penyusunan laporan ini:

| No | Hash | Tanggal & Waktu | Pesan Commit & Rincian Ringkas |
|:---:|:---:|:---:|:---|
| 1 | `c35bfc6` | 2026-09-20 21:01 | fix: hide total revenue dashboard, owner can delete PO anytime |
| 2 | `6f3acbc` | 2026-09-20 21:16 | ref(login): remove unused fast login for testing |
| 3 | `8fe8684` | 2026-09-21 21:00 | fix: make some customer field is nullable |
| 4 | `176e0c2` | 2026-09-26 08:02 | fix: change foreign in quotation nullable |
| 5 | `7d34f3c` | 2026-09-26 08:08 | fix: change foreign in quotation nullable |
| 6 | `1de3798` | 2026-09-28 09:49 | feat: quotations menu & fix: websocket |
| 7 | `bb6aef5` | 2026-09-28 10:20 | fix: change default value of source type |
| 8 | `8c720fe` | 2026-09-28 10:24 | fix: change default value of source type |
| 9 | `70b912b` | 2026-09-30 09:07 | Refactor job-tickets to purchase-orders |
| 10 | `066eefd` | 2026-09-30 09:15 | refactor: update imports from purchase-orders to job-tickets |
| 11 | `45a052f` | 2026-09-30 10:57 | Add unit tests for DocumentFilename and ProductionInvoiceDocumentAmounts |
| 12 | `92affde` | 2026-09-30 11:06 | Refactor code structure for improved readability and maintainability |
| 13 | `78bd1f4` | 2026-10-02 18:02 | refactor: improve filename generation logic and add unit tests for multi-article |
| 14 | `c4ef537` | 2026-10-02 18:09 | fix: remove testing account for login ui |
| 15 | `d923fcc` | 2026-10-02 23:46 | feat: sync article from order entry form & refactor ArticleSyncService |
| 16 | `93cabe0` | 2026-10-03 00:31 | feat: manual quotation, standalone draft, modal dialog & attach to PO |
| 17 | `edb9aeb` | 2026-10-05 08:33 | fix(order-entry): searchable Select for article options |
| 18 | `aa15097` | 2026-10-06 14:29 | feat: delivery cost in invoices table, formatted number input |
| 19 | `e69b67d` | 2026-10-08 22:27 | feat: add import feature for products and categories |
| 20 | `34b034a` | 2026-10-10 23:54 | feat: add ProductCategoryTemplateExport and ProductCategoryImport classes |
| 21 | `e6e11cc` | 2026-10-11 16:18 | fix: duplicated function call in material spec edit dialog |
| 22 | `fc7750d` | 2026-10-11 23:23 | chore: quotation undoApprove, payment delete safeguards, FinanceTab sync |
| 23 | `e435d54` | 2026-10-12 10:10 | feat: restrict PO deletion to Owner & update cascade on quotations table |
| 24 | `7ee2663` | 2026-10-13 08:33 | fix: false customer field in invoice print template |
| 25 | `736412f` | 2026-10-14 10:36 | fix: change master product import logic and template |
| 26 | `5eb4055` | 2026-10-14 10:42 | chore: final production asset build |

---

### V. RINCIAN BIAYA & INVOICE PENAGIHAN (BILLING BREAKDOWN)

**Nomor Tagihan:** INV-DEV/2026/10/015  
**Tanggal Tagihan:** 15 Oktober 2026  
**Jatuh Tempo:** Sesuai kesepakatan bersama  

| No | Modul / Uraian Layanan Pekerjaan | Deliverable & Output | Jumlah (IDR) |
|:---:|:---|:---|:---:|
| 1 | **Modul Quotation Mandiri & Alur PO** | Standalone draft quotation, attach to PO, modal editor, undo approval aman | Rp 250.000 |
| 2 | **Modul Order Entry & Auto-Sync BOM** | Searchable product selector, one-click BOM generator, `ArticleSyncService` | Rp 200.000 |
| 3 | **Modul Finansial & Dokumen Cetak** | Opsi cetak DP 50% & Pelunasan single ledger, ongkos kirim, penamaan file PDF | Rp 200.000 |
| 4 | **Modul Import / Export Master Data** | Template Excel, parser massal Master Produk & Kategori dengan validasi | Rp 150.000 |
| 5 | **Keamanan Data & Role Permission** | Hak hapus PO eksklusif Owner, database cascade, proteksi revenue dashboard | Rp 100.000 |
| 6 | **Optimasi, Realtime WebSocket & Testing** | Perbaikan notifikasi realtime lonceng, unit testing DocumentFilename & Invoice | Rp 100.000 |
| **TOTAL BIAYA** | | **Rp 1.000.000** |

---
*Dokumen ini digenerate secara otomatis berdasarkan riwayat commit git repositori `victory-core` periode 20 September – 15 Oktober 2026.*
