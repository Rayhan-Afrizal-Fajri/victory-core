# Worker Board & QC Board Implementation

## 📋 Overview
Implementasi halaman "Papan Kerja Produksi" yang menampilkan 2 section:
- **Antrean Kerja (Worker Board)**: Menampilkan tugas produksi yang pending atau in-progress (internal work only)
- **Antrean QC (QC Board)**: Menampilkan tugas QC yang sudah completed tapi belum di-QC (all work, internal & external)

---

## 📁 File yang Dibuat/Dimodifikasi

### 1. Backend - Laravel Controller
**File**: `app/Http/Controllers/Admin/ProductionRunController.php`

#### Perubahan:
- ✅ Ditambahkan `use Inertia\Inertia;` import
- ✅ Ditambahkan method `boardIndex()` yang:
  - Fetch `workerTasks` dengan kriteria:
    - Status: `pending` atau `in_progress`
    - Internal only: `whereHas('pesananManufacturingSpec', fn($q) => $q->whereNull('vendor_id'))`
    - Eager load: `productionRun.pesanan.jobTicket`, `pesananManufacturingSpec`
    - Sort: By `job_tickets.deadline` ASC, then by `sequence` ASC
  
  - Fetch `qcTasks` dengan kriteria:
    - Status: `completed`
    - QC Status: `pending`
    - All work (internal & external)
    - Eager load: `productionRun.pesanan.jobTicket`, `pesananManufacturingSpec.vendor`
    - Sort: By `completed_at` DESC

  - Return data ke Inertia view `admin/production-runs/Board`

---

### 2. Routes
**File**: `routes/web.php`

#### Perubahan:
- ✅ Ditambahkan route baru:
```php
Route::get('/production-runs/board', [ProductionRunController::class, 'boardIndex'])
    ->name('production-runs.board');
```

Route ini dapat diakses di: `http://localhost/production-runs/board`

---

### 3. Frontend - React Component
**File**: `resources/js/pages/admin/production-runs/Board.tsx` (NEW)

#### Fitur:

**Layout:**
- Halaman responsif dengan Tabs (Shadcn UI)
- 2 tab: "Antrean Kerja" dan "Antrean QC"
- Design intuitif untuk pekerja pabrik

**Worker Board:**
- Card untuk setiap task dengan info:
  - Nomor Job Ticket
  - Nama Produk
  - Nama Proses (Work Name) + Sequence
  - Qty yang harus dikerjakan
  - Deadline dengan badge merah jika deadline dekat (≤3 hari)
  - Waktu mulai (jika sudah dimulai)
  
- Actions:
  - Tombol "Mulai Kerjakan" (untuk status `pending`)
    - Calls: `PATCH /production-run-processes/{id}/start`
  - Tombol "Selesaikan" (untuk status `in_progress`)
    - Calls: `PATCH /production-run-processes/{id}/complete`

**QC Board:**
- Card untuk setiap task QC dengan info:
  - Nomor Job Ticket
  - Nama Produk
  - Nama Proses
  - Nama Vendor (jika work external)
  - Kuantitas yang harus di-QC

- Form QC lengkap dengan:
  - Input: Checked Qty, Passed Qty, Defect Qty (dengan FormattedNumberInput)
  - Input: QC Notes (Textarea)
  - Input: Defect Reason (Textarea) - muncul hanya jika defect_qty > 0
  - Input: Corrective Action - muncul hanya jika defect_qty > 0
  - Validation: Total passed + defect = checked qty
  - Submit button dengan loading state

- Actions:
  - Tombol "Simpan QC"
    - Calls: `PATCH /production-run-processes/{id}/qc`

---

## 🔧 Fitur Teknis

### Data Validation
- **Worker Board**: 
  - Clamping qty input (0 - max quantity)
  - Real-time validation

- **QC Board**:
  - Clamping checked_qty (0 - max quantity)
  - Clamping passed_qty (0 - checked_qty)
  - Clamping defect_qty (0 - checked_qty)
  - Validation: passed_qty + defect_qty = checked_qty (sebelum submit)
  - Conditional fields: defect_reason & corrective_action only jika defect_qty > 0

### UI/UX
- Skeleton states dengan empty states yang jelas
- Badge untuk status dengan warna-warna yang berbeda
- Icons dari Lucide React (Play, CheckCircle2, AlertTriangle, etc.)
- Responsive design (md:grid-cols-2 lg:grid-cols-3 untuk worker cards)
- Toast notifications untuk success/error
- Preserve scroll pada setiap action

### Integration
- Menggunakan existing routes (TIDAK membuat endpoint baru)
- Kompatibel dengan existing ProductionRunController methods:
  - `startProcess()` - untuk start work
  - `completeProcess()` - untuk selesai work
  - `submitQc()` - untuk submit QC
- Inertia.js untuk server-side rendering props
- React hook `useForm` dari Inertia untuk form handling

---

## 🚀 Cara Menggunakan

### Access Board
1. Login ke aplikasi
2. Navigate ke: `/production-runs/board`
3. Atau buat link menu ke route name: `production-runs.board`

### Worker Board Usage
1. Lihat daftar task yang pending atau in-progress
2. Klik tombol "Mulai Kerjakan" untuk start proses
3. Setelah proses selesai, klik "Selesaikan"
4. Tugas akan pindah ke Antrean QC

### QC Board Usage
1. Lihat daftar task yang sudah completed tapi belum QC
2. Isi form QC dengan:
   - Checked Qty: Berapa unit yang dicheck
   - Passed Qty: Berapa unit yang lolos
   - Defect Qty: Berapa unit yang defect
3. Jika ada defect, isi Penyebab Defect dan Tindakan Perbaikan
4. Isi Catatan QC (opsional)
5. Klik "Simpan QC"
6. Task akan diupdate dengan QC status

---

## 📊 Data Flow

```
┌─────────────────────────────────────────────────────┐
│ GET /production-runs/board (User Access)            │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
        ┌────────────────────────────┐
        │ boardIndex() in Controller │
        └────────┬───────────────────┘
                 │
        ┌────────┴─────────┐
        │                  │
        ▼                  ▼
   Fetch Worker      Fetch QC
   Tasks            Tasks
   (pending/in_progress)    (completed/pending QC)
   Internal Only     All Work
        │                  │
        └────────┬─────────┘
                 │
        ┌────────▼──────────────┐
        │ Inertia::render()    │
        │ Pass to React        │
        └────────┬──────────────┘
                 │
                 ▼
        ┌────────────────────────┐
        │ Board.tsx (React)      │
        │ Render UI & Handle     │
        │ User Interactions      │
        └────────────────────────┘
                 │
        ┌────────┴──────────────┐
        │                       │
        ▼                       ▼
   PATCH /production-  PATCH /production-
   run-processes/     run-processes/
   {id}/start         {id}/qc
   or                 (with form data)
   /complete
```

---

## ✅ Checklist

- [x] Backend route dibuat
- [x] Controller method `boardIndex()` dibuat
- [x] React component `Board.tsx` dibuat
- [x] Worker Board dengan start/complete actions
- [x] QC Board dengan full QC form
- [x] Data sorting & filtering sesuai requirement
- [x] Form validation logic
- [x] UI responsif & intuitif
- [x] Toast notifications
- [x] Existing routes digunakan (no new endpoints)
- [x] PHP syntax verified
- [x] TypeScript/React syntax valid

---

## 🎨 Component Structure

```
Board.tsx (Main Component)
├── ProductionBoard (Container)
│   ├── Tabs (Shadcn UI)
│   ├── WorkerBoard (Tab 1)
│   │   └── WorkerTaskCard (Mapped)
│   │       ├── Task Info
│   │       ├── Deadline Badge
│   │       └── Action Buttons
│   │
│   └── QCBoard (Tab 2)
│       └── QCTaskCard (Mapped)
│           ├── Task Info
│           ├── QC Form
│           │   ├── Qty Inputs
│           │   ├── Defect Reason
│           │   ├── QC Notes
│           │   └── Corrective Action
│           └── Submit Button
```

---

## 🔐 Security Notes

- Routing dilindungi oleh middleware `['auth', 'verified']`
- Data fetching hanya untuk internal/assigned work
- Setiap aksi menggunakan existing authorized endpoints

---

## 📝 Notes

1. **Deadline Badge**: Otomatis jadi merah jika deadline ≤ 3 hari
2. **Vendor Info**: Hanya tampil untuk external work di QC Board
3. **Empty States**: User-friendly messages jika tidak ada task
4. **Form Validation**: Local validation + server-side validation
5. **Performance**: Eager loading digunakan untuk minimize queries
6. **Responsiveness**: Mobile-first design approach

