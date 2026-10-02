# Rencana Perbaikan Victory Core

## Tujuan

Dokumen ini mencatat rencana dan status implementasi untuk perbaikan alur order, BOM, dokumen penawaran/tagihan, sinkronisasi artikel, dan purchasing.

## Temuan Kondisi Saat Ini

- Order Entry menyimpan `requested_product_name` sebagai teks bebas dan belum menerima pilihan `product_id`. Pembuatan spesifikasi dari artikel master dilakukan terpisah melalui sinkronisasi di tab Design.
- Sinkronisasi artikel saat ini mensyaratkan desain sudah disetujui. Prosesnya mengganti seluruh material dan manufacturing specs yang sudah ada.
- `JobTicket.customer_notes` sudah tersedia dan ditampilkan di ringkasan order, tetapi belum terhubung secara jelas ke referensi BOM/purchasing.
- PDF quotation dan invoice sudah mempunyai nama file pada saat print. Quotation memakai nomor quotation saja; invoice memakai nomor invoice saja.
- Invoice produksi saat ini mempunyai beberapa bentuk kategori dan alur: invoice manual mengenal `production`, sedangkan proses otomatis memakai `produksi`; workflow juga mencatat status pembayaran DP dan pelunasan.
- Purchasing BOM membuat baris dengan status `draft`. Endpoint dan aksi UI `Pesan`/batalkan sudah ada dan secara kode dapat dipakai pada baris purchasing BOM. Karena itu catatan kelima perlu diverifikasi pada data produksi nyata, gate tampilan, dan permission sebelum menambah mekanisme baru.
- Pembuatan quotation saat ini terikat ke `JobTicket` dan menunggu spesifikasi/harga final. Kolom `quotations.job_ticket_id` dan `quotation_items.pesanan_id` saat ini wajib, sehingga belum dapat menyimpan draft quotation mandiri sebelum ada PO.

## Rencana Per Butir

### 1. Catatan Pesanan Job Ticket/PO pada BOM

**Perilaku yang diharapkan**

- Catatan pesanan yang diinput pada Job Ticket dapat dibaca dari tampilan BOM pada pesanan terkait.
- Catatan yang sama ikut terlihat pada referensi BOM/PO yang dipakai tim purchasing agar konteks khusus pesanan tidak hilang setelah spesifikasi dibuat.
- Catatan tetap bersumber dari `JobTicket.customer_notes`; tidak membuat kolom catatan kedua yang dapat berbeda nilainya.
- Tampilkan kondisi kosong dengan jelas. Jangan membuat catatan wajib jika sebelumnya opsional.

**Area kerja yang diperkirakan**

- `app/Http/Controllers/Admin/JobTicketController.php` untuk memastikan data catatan disertakan dalam props pesanan.
- `resources/js/pages/admin/job-tickets/components/tabs/DesignTab.tsx` dan/atau komponen BOM yang menjadi pemilik tampilan spesifikasi.
- `resources/js/components/purchasings/design-specs-reference-card.tsx` bila catatan juga harus tampak pada referensi saat purchasing.
- `resources/js/pages/admin/job-tickets/components/tabs/OverviewTab.tsx` sebagai referensi tampilan catatan yang sudah ada.

**Kriteria penerimaan**

- Catatan PO dari Job Ticket tampil pada bagian BOM untuk setiap artikel dalam Job Ticket tersebut.
- Teks panjang, baris baru, dan nilai kosong ditampilkan dengan baik.
- Perubahan catatan Job Ticket tidak memerlukan migrasi dan tampak setelah halaman dimuat ulang.

### 2. Nama File PDF Quotation dan Invoice

**Format target**

`{nomor dokumen} - {nama perusahaan/customer} - {nama artikel}.pdf`

Contoh: `INV001 - Victory Labs - T-Shirt Oversize Hitam.pdf`.

**Rencana**

- Terapkan format pada nama file yang dikirim saat mengunduh/membuka PDF; nomor dokumen yang tercetak di dalam dokumen tidak berubah.
- Gunakan nama perusahaan customer, lalu fallback ke nama customer jika nama perusahaan kosong.
- Bersihkan karakter yang tidak aman untuk nama file, termasuk slash dan backslash, serta trim whitespace.
- Quotation dan invoice dapat mencakup beberapa pesanan/artikel dalam satu dokumen. Untuk kasus itu gunakan daftar nama artikel yang stabil dan aman (atau label `Multi-Artikel` jika panjang nama melewati batas yang disepakati); jangan diam-diam memilih artikel pertama.
- Terapkan aturan yang sama pada akses print quotation dan invoice.

**Area kerja yang diperkirakan**

- `app/Http/Controllers/Admin/QuotationController.php`, khususnya method `print()`.
- `app/Http/Controllers/Admin/InvoiceController.php`, khususnya method `print()`.
- Dapat memakai helper kecil bersama untuk sanitasi dan membatasi panjang nama file jika pola ini dibutuhkan di tempat lain.

**Kriteria penerimaan**

- Nama file PDF quotation dan invoice mengikuti pola nomor-perusahaan-artikel.
- Nama customer/perusahaan atau artikel yang mengandung karakter terlarang tidak merusak unduhan.
- Kasus multi-artikel dan nama perusahaan kosong mengikuti fallback yang disepakati.
- Nomor yang terlihat di isi PDF tetap sama seperti sebelumnya.

### 3. Opsi Sinkronisasi Artikel Langsung dari Order Entry

**Perilaku yang diharapkan**

- Saat membuat pesanan baru, operator dapat memilih artikel master dan memilih apakah spesifikasi BOM langsung disinkronkan.
- Alur lama tetap tersedia: operator dapat melewati sinkronisasi dan melakukannya kemudian dari tab Design.
- Nama artikel permintaan tetap disimpan sebagai snapshot/label order, sementara relasi `product_id` mengacu pada artikel master.
- Sinkronisasi dilakukan setelah record pesanan tersedia, dalam transaksi yang sama dengan data terkait bila aman, dan menandai `article_synced` beserta waktu/pengguna sinkronisasi.
- Logika pembuatan material/manufacturing specs harus digunakan bersama oleh Order Entry dan tab Design, bukan diduplikasi.
- Jika proses menghapus/mengganti specs yang telah diedit manual, tampilkan konfirmasi sebelum sinkronisasi ulang. Untuk pembuatan baru tanpa specs, tidak perlu konfirmasi.
- Order Entry edit harus mempertahankan relasi artikel. Perubahan quantity setelah sinkronisasi harus menghasilkan kebutuhan BOM yang konsisten atau meminta sinkronisasi ulang secara eksplisit.

**Area kerja yang diperkirakan**

- `app/Http/Controllers/Admin/OrderEntryController.php` untuk props pilihan artikel, validasi, create, dan update.
- `resources/js/pages/admin/order-entry/Index.tsx` dan `resources/js/pages/admin/order-entry/components/order-item.tsx` untuk pemilih artikel dan opsi sync.
- `app/Http/Controllers/Admin/DesignController.php` untuk memindahkan/membagi logika sinkronisasi menjadi operasi yang dapat dipakai ulang.
- `resources/js/pages/admin/job-tickets/components/tabs/DesignTab.tsx` agar aksi sinkronisasi yang sekarang tetap memakai operasi yang sama.
- `app/Models/Pesanan.php` dan relasi produk yang sudah ada untuk memverifikasi kontrak data.

**Kriteria penerimaan**

- Order baru dengan artikel terpilih dan opsi sync aktif langsung memiliki `product_id`, status synced, serta specs hasil artikel master.
- Order tanpa opsi sync tetap berfungsi seperti sekarang dan dapat disinkronkan kemudian.
- Pilihan artikel tidak aktif/tidak valid ditolak oleh backend.
- Sinkronisasi gagal tidak meninggalkan pesanan tanpa workflow atau dengan specs setengah terbentuk.
- Uji order tunggal, beberapa artikel dalam Job Ticket, edit order, quantity berubah, dan sync ulang dengan specs yang sudah ada.

### 4. Dokumen Invoice DP Produksi 50%

**Aturan bisnis yang diputuskan**

- Tetap gunakan satu invoice produksi dan satu ledger pembayaran. Tidak dibuat record invoice DP atau invoice pelunasan terpisah.
- Sediakan dua pilihan cetak: **DP Produksi** sebesar 50% total produksi dan **Pelunasan Produksi** sebesar sisa 50%.
- Alokasikan pembayaran terverifikasi berurutan: pertama melunasi porsi DP, lalu ke porsi pelunasan. Pembayaran pending/rejected tidak mengurangi sisa dokumen.
- Contoh total Rp50.000.000 dan pembayaran terverifikasi Rp25.000.000: dokumen DP menunjukkan tagihan dan pembayaran Rp25.000.000 serta sisa Rp0; dokumen pelunasan menunjukkan tagihan/sisa Rp25.000.000.
- Untuk total rupiah ganjil, porsi DP dibulatkan ke rupiah terdekat dan porsi pelunasan menerima sisanya agar jumlah keduanya tetap sama dengan total invoice.
- Kategori invoice yang sudah digunakan tetap dipertahankan untuk menjaga kompatibilitas; alias produksi lama dinormalisasi saat menampilkan opsi cetak dan kategori UI.

**Area kerja yang diperkirakan**

- `app/Services/InvoiceService.php` untuk trigger otomatis, perhitungan, dan pencegahan duplikasi.
- `app/Http/Controllers/Admin/InvoiceController.php` untuk kategori manual, mapping data, dan aturan invoice.
- `app/Http/Controllers/Admin/PaymentController.php` untuk status DP dan verifikasi pembayaran.
- `app/Models/Invoice.php`, `app/Models/WorkflowStatus.php`, migrasi yang relevan, tampilan invoice, dan template `resources/views/pdf/invoices/show.blade.php`.
- Laporan dan dashboard yang mengelompokkan kategori invoice perlu diperiksa saat kategori diselaraskan.

**Kriteria penerimaan**

- Opsi cetak DP dan pelunasan hanya tersedia untuk invoice produksi; keduanya menggunakan nomor invoice dan pembayaran yang sama.
- Total kedua dokumen sama dengan total produksi dan tidak menghasilkan invoice DP aktif kedua.
- Pembayaran terverifikasi mengisi porsi DP terlebih dahulu, lalu porsi pelunasan; pending/rejected tidak dihitung.
- Satu pembayaran 50% membuat dokumen DP lunas dan menunjukkan seluruh porsi pelunasan masih harus dibayar.
- Dokumen DP dan pelunasan dapat dicetak dengan nilai paid/remaining yang sesuai; status ledger invoice serta laporan tidak terduplikasi.

### 5. Tombol Checklist "Pesan" untuk Purchasing Produksi

**Kondisi yang ditemukan**

- Baris purchasing dibuat berstatus `draft` oleh generate BOM.
- Tabel purchasing sudah menampilkan tombol `Pesan` untuk status `draft` dan `Batal` untuk status `ordered`, melalui endpoint mark-ordered yang ada.
- Generator BOM mengisi `purchase_scope` produksi/sample-dan-produksi. Secara struktur, tidak terlihat pembatas eksplisit yang mengkhususkan tombol pada sample.

**Rencana**

- Reproduksi menggunakan Job Ticket yang memiliki material untuk sample dan produksi, lalu periksa state row yang dikirim backend, permission, filter tabel, serta kondisi setelah material sample diterima.
- Pastikan seluruh baris yang diperlukan untuk produksi tetap menampilkan aksi pesan, termasuk baris `sample_and_production` dan `production`.
- Bedakan status pemesanan dari status penerimaan. Tombol menandai dipesan tidak boleh hilang hanya karena row dipakai untuk kuantitas produksi atau karena progres sample telah selesai.
- Pertahankan route/status `draft -> ordered` yang ada bila pengujian menunjukkan alur bekerja. Perbaiki gate/serialisasi atau kondisi tabel yang menyebabkan tombol tidak muncul; jangan menambah kolom/status duplikat tanpa kebutuhan terbukti.
- Validasi backend untuk aksi batal agar hanya status yang dapat dibatalkan yang kembali ke `draft`, dan status receiving tidak diturunkan secara tidak sengaja.

**Area kerja yang diperkirakan**

- `resources/js/components/purchasings/purchasing-material-table.tsx` dan `resources/js/components/purchasings/purchasing-utils.ts`.
- `app/Http/Controllers/Admin/PurchasingController.php` untuk `mapPurchasing()`, `markOrdered()`, dan `undoMarkOrdered()`.
- `resources/js/pages/admin/job-tickets/components/tabs/PurchasingTab.tsx` untuk alur pengguna di detail Job Ticket.
- Permission `purchasings.mark_ordered` dan factory/test fixture purchasing.

**Kriteria penerimaan**

- Pengguna dengan permission dapat menandai baris material produksi sebagai dipesan; state tersimpan sebagai `ordered` dan dapat dilihat setelah reload.
- Pengguna dapat membatalkan penandaan hanya ketika status masih memungkinkan.
- Receiving tetap berjalan sesudah item dipesan dan tidak mereset status secara tidak sengaja.
- Tanpa permission, aksi tidak terlihat dan endpoint tetap terlindungi.
- Uji baris BOM `production`, `sample_and_production`, dan purchasing manual sesuai scope yang memang didukung.

### 6. Quotation Manual, Draft Global, dan Tampilan Detail PO

**Kebutuhan client**

- Quotation dapat dibuat manual tanpa menunggu desain, BOM, atau penetapan harga di workflow PO.
- Quotation baru berstatus `draft` dan dapat ditautkan ke PO kemudian melalui tab Costing & Quotation.
- Pada detail PO tersedia aksi untuk membuat quotation baru atau memilih quotation draft yang sudah ada.
- Riwayat quotation pada detail PO diubah dari kumpulan card menjadi tabel interaktif yang konsisten dengan gaya sistem; form panjang dipindahkan ke modal.

**Rekomendasi alur**

- Jadikan halaman `/quotations` sebagai tempat melihat dan membuat draft quotation mandiri. Form manual dapat diakses dari tombol **Buat Quotation** dan berisi customer/perusahaan, masa berlaku, syarat, catatan, serta daftar item (nama artikel, qty, harga per unit, subtotal, pajak/ongkir bila berlaku). Sumber data boleh berupa input manual; BOM dan workflow pricing tidak menjadi prasyarat.
- Pada detail PO, tampilkan tabel quotation yang sudah terhubung dengan kolom nomor, tanggal, customer, jumlah item, total, status, dan aksi. Gunakan pencarian, sorting, pagination, serta aksi yang sesuai status dan permission.
- Letakkan dua aksi terpisah di atas tabel: **Buat Quotation** membuka modal form yang sama dan mem-prefill customer serta item dari PO bila tersedia; **Pilih Draft** membuka modal pemilih draft yang belum terhubung dan customer-nya cocok dengan PO.
- Setelah memilih draft, tampilkan konfirmasi ringkas termasuk customer, item, total, dan PO tujuan sebelum attach. Jika item belum memiliki relasi pesanan, minta pemetaan item quotation ke pesanan di PO; jangan mengaitkan otomatis hanya berdasarkan nama tanpa konfirmasi.
- Pertahankan satu sumber komponen/form untuk halaman Quotations dan modal di detail PO agar validasi, kalkulasi, dan tampilan PDF tidak bercabang.

**Perubahan data yang diperkirakan**

- Jadikan `quotations.job_ticket_id` nullable untuk draft yang belum dihubungkan ke PO; tambahkan customer/company reference atau snapshot yang diperlukan agar draft mandiri tetap dapat dicetak dan difilter.
- Jadikan `quotation_items.pesanan_id` nullable untuk item draft mandiri. Simpan nama artikel, qty, harga, dan subtotal sebagai snapshot agar data quotation tidak bergantung pada BOM.
- Saat attach, dalam satu transaksi validasi status masih `draft`, belum terhubung ke PO lain, customer cocok, dan item sudah dipetakan ke pesanan PO. Set `job_ticket_id`, isi `pesanan_id` pada item yang cocok, lalu sinkronkan workflow PO yang diperlukan.
- Jangan mengubah `draft` menjadi status baru hanya untuk menandai attach. Relasi `job_ticket_id` membedakan draft global dari draft yang telah dipasang ke PO, sedangkan status quotation tetap menggambarkan tahap persetujuan.
- Batasi penghapusan cascade agar menghapus PO tidak ikut menghapus draft/quotation yang perlu dipertahankan sebagai dokumen komersial; tentukan aturan detach atau restrict sebelum migrasi.

**Area kerja yang diperkirakan**

- `database/migrations/*quotations*` dan `database/migrations/*quotation_items*` untuk nullable FK dan referensi customer/company/snapshot yang diperlukan.
- `app/Models/Quotation.php`, `app/Models/QuotationItem.php`, `app/Http/Controllers/Admin/QuotationController.php`, serta generator nomor dan PDF.
- `resources/js/pages/admin/quotations/index.tsx` untuk daftar dan pembuatan draft mandiri.
- `resources/js/components/designs/quotationSection.tsx` dan tab Costing & Quotation pada detail PO untuk tabel, modal buat, dan modal attach draft.
- Policies/permissions, notifikasi, workflow status PO, serta approval/rejection agar draft yang di-attach tetap mengikuti alur persetujuan yang benar.

**Kriteria penerimaan**

- Draft dapat dibuat tanpa Job Ticket, BOM, atau harga dari workflow; wajib memiliki customer, minimal satu item valid, dan total hasil kalkulasi server.
- Draft mandiri muncul pada daftar Quotation dan dapat dicetak dengan customer serta item snapshot yang benar.
- Pada detail PO tersedia aksi buat baru dan pilih draft. Daftar draft yang dapat dipilih hanya menampilkan draft yang belum terhubung dan customer-nya cocok.
- Attach gagal secara atomik jika draft sudah dipakai, customer berbeda, item tidak dipetakan, atau status bukan `draft`.
- Setelah attach, quotation tampil pada tabel PO dan approval tetap memperbarui workflow/quotation items pesanan dengan benar.
- Tabel mendukung pencarian, sorting, pagination, empty state, serta aksi berdasarkan status dan permission; form/modal nyaman di desktop dan mobile.
- Penghapusan PO tidak menghilangkan quotation yang seharusnya tetap menjadi dokumen komersial.

## Urutan Implementasi yang Disarankan

1. Gunakan aturan DP satu ledger di atas dan nama file multi-artikel yang mencakup seluruh artikel.
2. Perbaiki tampilan catatan pada BOM; perubahan ini kecil dan tidak memerlukan migrasi.
3. Terapkan nama file quotation/invoice dengan fallback multi-artikel dan sanitasi.
4. Refaktor operasi sync artikel agar reusable, lalu tambahkan opsi sync ke Order Entry dan cakupan tes edit/quantity.
5. Reproduksi isu tombol purchasing produksi, lalu perbaiki gate atau state yang terbukti menjadi penyebab.
6. Sediakan mode cetak DP/pelunasan pada invoice produksi yang sama; audit alokasi pembayaran, workflow, print, dan laporan sebagai satu perubahan lintas modul.
7. Setelah keputusan relasi quotation dan aturan penghapusan PO disetujui, tambahkan draft mandiri, attach draft ke PO, lalu ubah riwayat quotation PO ke tabel dengan modal create/pilih.

## Strategi Pengujian

- **Feature tests Laravel:** create/update Order Entry dengan dan tanpa sync; validasi product; sinkronisasi specs; generate invoice DP satu kali; nominal invoice; verifikasi pembayaran; mark/undo ordered dengan status dan permission.
- **Frontend/build checks:** pemilih artikel dan state sync; aksi purchasing untuk status/scope produksi; tampilan catatan kosong/panjang; jalankan build TypeScript/Vite.
- **PDF checks:** assertion nama file dari response print untuk quotation/invoice, termasuk karakter khusus, fallback perusahaan kosong, dan lebih dari satu artikel.
- **Regression checks:** alur sync yang masih dilakukan dari tab Design, invoice sample/produksi yang sudah ada, pembayaran dan laporan, serta receiving purchasing.

## Risiko dan Dependensi

- Sinkronisasi artikel mengganti specs lama; perubahan reusable harus mempertahankan konfirmasi dan transaksi agar data manual tidak hilang diam-diam.
- Invoice dan workflow saat ini memakai kategori serta flag DP/pelunasan yang tidak seragam; perubahan DP harus mencakup seluruh pemakai kategori, bukan hanya tombol create.
- Quotation dan invoice dapat berisi beberapa artikel; aturan nama file harus ditentukan agar nama tetap informatif dan tidak terlalu panjang.
- Catatan Job Ticket bersifat tingkat PO, sedangkan BOM bersifat per artikel. UI perlu menandai bahwa catatan berlaku untuk seluruh Job Ticket, bukan hanya satu artikel.
- Checklist pemesanan produksi dipisahkan dari status receiving; penerimaan baik yang telah memasuki alokasi produksi otomatis mencatat waktu dan pengguna pemesan.
- Draft quotation mandiri dan redesign tabel/modal quotation pada detail PO: belum diimplementasikan; perubahan nullable FK, mapping item, customer matching, dan aturan penghapusan PO perlu dikerjakan sebagai satu slice.

## Status Implementasi (3 Oktober 2026)

- Catatan PO/detail pesanan pada tab BOM: selesai.
- Nama file quotation/invoice dengan fallback multi-artikel dan sanitasi: selesai.
- Sinkronisasi artikel langsung dari Order Entry: selesai. Pilihan artikel master bersifat opsional; checkbox sync default nonaktif dan mengisi BOM saat dicentang. Sync ulang dari edit meminta konfirmasi.
- Cetak invoice DP dan pelunasan dari satu invoice produksi: selesai.
- Checklist purchasing produksi: selesai. Tombol tersedia setelah material sample siap dan sample disetujui; penerimaan material baik pada alokasi produksi juga otomatis menandai pemesanan.
- Quotation manual, attach PO, edit sebelum approval, dan UI: selesai. Draft dapat dibuat mandiri atau dari PO eligible; draft mandiri dapat dipilih dari detail PO, item dipetakan ke pesanan, dan perubahan ditolak setelah status approved.