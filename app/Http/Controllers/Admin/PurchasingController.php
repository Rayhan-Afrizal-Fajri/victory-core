<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;

use App\Notifications\SystemNotification;
use Illuminate\Support\Facades\Notification;
use App\Models\MaterialReceiving;
use App\Models\Pesanan;
use App\Models\User;
use App\Models\Quotation;
use App\Models\Purchasing;
use App\Models\Supplier;
use App\Models\JobTicket;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use App\Services\ProductionRunService;
use App\Services\InvoiceService;

class PurchasingController extends Controller
{
    /**
     * Controller Purchasing
     *
     * Mengelola alur Purchasing (PO) bahan: pembuatan PO dari BOM,
     * update PO, penerimaan material (receiving), dan sinkronisasi
     * status workflow terkait `Pesanan` dan `JobTicket`.
     */
    public function __construct(
        protected ProductionRunService $productionRunService,
        protected InvoiceService $invoiceService,
    ) {}
    /**
     * Menampilkan halaman index purchasing
     *
     * Mengambil daftar `Purchasing`, `JobTicket`, dan `Supplier` yang
     * diperlukan untuk tampilan admin/purchasing/Index.
     */
    public function index()
    {
        $purchasings = Purchasing::query()
            ->with([
                'pesanan.jobTicket.customer',
                'pesanan.jobTicket.companyProfile',
                'pesanan.workflowStatus',
                'supplier',
                'pesananMaterialSpec',
                'materialReceivings.checkedBy',
            ])
            ->latest()
            ->get()
            ->map(fn ($purchasing) => $this->mapPurchasing($purchasing))
            ->values();

        $jobTickets = JobTicket::query()
            ->with([
                'customer',
                'pesanans.workflowStatus',
            ])
            ->whereHas('pesanans.workflowStatus', function ($query) {
                $query->where('sample_paid', true);
            })
            ->latest()
            ->get()
            ->map(fn ($jobTicket) => [
                'id' => $jobTicket->id,
                'no_job_ticket' => $jobTicket->no_job_ticket,

                'customer' => [
                    'id' => $jobTicket->customer?->id,
                    'nama' => $jobTicket->customer?->nama,
                    'nama_perusahaan' => $jobTicket->customer?->nama_perusahaan,
                ],
            ])
            ->values();

        $suppliers = Supplier::query()
            ->orderBy('nama_perusahaan')
            ->get()
            ->map(fn ($supplier) => [
                'id' => $supplier->id,
                'nama' => $supplier->nama,
                'nama_perusahaan' => $supplier->nama_perusahaan,
                'kategori' => $supplier->kategori,
                'kontak' => $supplier->kontak,
                'alamat' => $supplier->alamat,
            ])
            ->values();

        return Inertia::render('admin/purchasing/Index', [
            'purchasings' => $purchasings,
            'jobTickets' => $jobTickets,
            'suppliers' => $suppliers,
        ]);
    }

    private function mapPurchasing(Purchasing $p): array
    {
        // Map model `Purchasing` menjadi array yang dibutuhkan oleh frontend
        // (menggabungkan informasi job ticket, supplier, dan receiving).
        $receivedQty = (float) (
            $p->received_qty
            ?: $p->materialReceivings->sum('received_qty')
        );

        $purchaseQty = (float) ($p->purchase_qty ?: $p->qty_bahan);

        $remainingQty = max(
            $purchaseQty - $receivedQty,
            0
        );

        // Ambil job ticket terkait jika ada, dipakai untuk menampilkan
        // customer dan company pada tampilan PO.
        $jobTicket = $p->pesanan?->jobTicket;

        return [

            'id' => $p->id,

            'job_ticket_id' => $jobTicket?->id,

            'pesanan_id' => $p->pesanan_id,

            'pesanan_material_spec_id' => $p->pesanan_material_spec_id,

            'source' => $p->pesanan_material_spec_id
                ? 'bom'
                : 'manual',

            'job_ticket' => $jobTicket ? [

                'id' => $jobTicket->id,

                'no_job_ticket' => $jobTicket->no_job_ticket,

                'customer' => [
                    'id' => $jobTicket->customer?->id,
                    'nama' => $jobTicket->customer?->nama,
                    'nama_perusahaan' => $jobTicket->customer?->nama_perusahaan,
                ],

                'company_profile' => [
                    'id' => $jobTicket->companyProfile?->id,
                    'company_name' => $jobTicket->companyProfile?->company_name,
                ],

            ] : null,

            // legacy
            'no_job_ticket' => $jobTicket?->no_job_ticket,

            'customer' =>
                $jobTicket?->customer?->nama_perusahaan
                ?? $jobTicket?->customer?->nama
                ?? '-',

            'supplier_id' => $p->supplier_id,

            'supplier' => $p->supplier ? [

                'id' => $p->supplier->id,

                'nama' => $p->supplier->nama,

                'nama_perusahaan' => $p->supplier->nama_perusahaan,

                'kategori' => $p->supplier->kategori,

                'kontak' => $p->supplier->kontak,

                'alamat' => $p->supplier->alamat,

            ] : null,

            'item_bahan' => $p->item_bahan,

            'item' => $p->item_bahan,

            'qty_bahan' => (float) $p->qty_bahan,

            'required_qty' => (float) $p->required_qty,

            'purchase_qty' => $purchaseQty,

            'stock_qty' => (float) $p->stock_qty,

            'leftover_qty' => (float) $p->leftover_qty,

            'satuan' => $p->satuan,

            'unit' => $p->satuan,

            'harga_satuan' => (float) $p->harga_satuan,

            'total_harga' => (float) $p->total_harga,

            'tgl_pembelian' => $p->tgl_pembelian,

            'is_received' => (bool) $p->is_received,

            'received_qty' => $receivedQty,

            'remaining_qty' => $remainingQty,

            'status' => $p->status,

            'purchase_scope' => $p->purchase_scope,

            'notes' => $p->notes,

            'workflow_status' => $p->pesanan?->workflowStatus,

            'material_receivings' => $p->materialReceivings
                ->map(fn ($receiving) => [

                    'id' => $receiving->id,

                    'received_qty' => (float) $receiving->received_qty,

                    'qty_received' => (float) $receiving->received_qty,

                    'received_at' => $receiving->received_at,

                    'notes' => $receiving->notes,

                    'checked_by' => $receiving->checkedBy?->name,

                ])
                ->values(),
        ];
    }

    /**
     * Generate purchasing dari BOM
     *
     * Menerima request `sample_qty` lalu membuat baris PO untuk setiap
     * material spec pada pesanan jika invoice sample sudah dibayar.
     */
    public function generateFromBom(Request $request, string $pesananId)
    {
        $validated = $request->validate([
            'sample_qty' => ['required', 'integer', 'min:0'],
        ]);

        // Ambil pesanan beserta relasi penting untuk perhitungan PO.
        $pesanan = Pesanan::with([
            'workflowStatus',
            'materialSpecs.supplier',
            'purchasing',
            'jobTicket.quotations',
        ])->findOrFail($pesananId);

        // Pastikan invoice sample sudah dibayar/verifikasi sebelum generate PO.
        if (! $pesanan->workflowStatus?->sample_paid) {
            abort(422, 'Purchasing belum bisa dibuat karena invoice sample belum lunas.');
        }

        // Cegah duplikasi jika purchasing sudah pernah dibuat untuk pesanan.
        if ($pesanan->purchasing()->exists() && $pesanan->workflowStatus->sample_revision == false) {
            abort(422, 'Purchasing sudah pernah digenerate. Edit PO yang sudah ada jika perlu.');
        }

        $quotation = Quotation::where('job_ticket_id', $pesanan->jobTicket->id)->latest()->first();

        // dd($pesanan,$quotation);

        $productionQty = $pesanan->workflowStatus->sample_revision == true ? 0 : (int) ($pesanan->quantity ?: $pesanan->q ?: 0);
        $sampleQty = (int) ($pesanan->sample_qty ?: 0);
        $totalPlannedQty = $productionQty + $sampleQty;

        // Simpan nilai sample_qty pada pesanan.
        $pesanan->update([
            'sample_qty' => $sampleQty,
        ]);

        if ($totalPlannedQty <= 0) {
            abort(422, 'Total quantity belum valid.');
        }

        // Buat PO untuk setiap material spec dalam satu transaksi.
        DB::transaction(function () use ($pesanan, $totalPlannedQty) {
            foreach ($pesanan->materialSpecs as $spec) {
                $usage = (float) $spec->usage;
                $usagePerSet = (float) ($spec->usage_per_set ?: 1);

                $usagePerPcs = $usage / $usagePerSet;
                $requiredQty = $usagePerPcs * $totalPlannedQty;

                $purchaseQty = $requiredQty;
                $stockQty = 0;
                $leftoverQty = max($purchaseQty + $stockQty - $requiredQty, 0);

                $hargaSatuan = $spec->price_type === 'roll'
                    ? (float) $spec->harga_roll
                    : (float) $spec->harga_ecer;

                $totalHarga = $purchaseQty * $hargaSatuan;

                // Simpan baris purchasing berdasarkan spec.
                $pesanan->purchasing()->create([
                    'pesanan_material_spec_id' => $spec->id,
                    'supplier_id' => $spec->supplier_id,

                    'item_bahan' => $spec->material_name_snapshot,
                    'color' => $spec->color,
                    'qty_bahan' => $requiredQty,
                    'required_qty' => $requiredQty,
                    'purchase_qty' => $purchaseQty,
                    'stock_qty' => $stockQty,
                    'leftover_qty' => $leftoverQty,

                    'satuan' => $spec->unit,
                    'harga_satuan' => $hargaSatuan,
                    'total_harga' => $totalHarga,

                    'is_received' => false,
                    'status' => 'draft',
                    'purchase_scope' => $pesanan->workflowStatus->sample_revision == true
                        ? 'sample'
                        : 'sample_and_production',
                    'notes' => null,
                ]);
            }

            // Tandai workflow bahwa materials sudah dibuat/diorder.
            $pesanan->workflowStatus()->updateOrCreate(
                ['pesanan_id' => $pesanan->id],
                [
                    'materials_purchased' => true,
                    'purchasing_generated' => true,
                    'materials_received' => false,
                    'materials_received' => false,
                ]
            );

            if ($pesanan->workflowStatus->sample_revision == true) {
                $pesanan->workflowStatus()->update([
                    'sample_materials_ready' => false,
                ]);
            }

            $pesanan->jobTicket->workflowHistory()->create([
                'step' => 'purchasing',
                'action' => 'generated_from_bom',
                'user_id' => Auth::id(),
                'notes' => 'Purchasing digenerate dari BOM untuk kebutuhan sample dan production.',
            ]);

            // Update status job ticket agar UI mencerminkan tahap Purchasing.
            $pesanan->jobTicket()->update([
                'status' => 'Purchasing'
            ]);
        });

        $usersToNotify = User::permission('purchasings.mark_ordered')->get();
        if ($usersToNotify->isNotEmpty()) {
            Notification::send($usersToNotify, new SystemNotification(
                'Purchasing BOM Digenerate',
                "Purchasing untuk pesanan {$pesanan->jobTicket->no_job_ticket} telah dibuat. Silakan lakukan pemesanan.",
                "/job-tickets/{$pesanan->jobTicket->id}?tab=purchasing",
                'info'
            ));
        }

        return back()->with('success', 'Purchasing BOM/PO berhasil digenerate.');
    }

    public function updatePoItem(Request $request, string $purchasingId)
    {
        // Update satu item PO (dipakai di UI edit PO item)
        $validated = $request->validate([
            'supplier_id' => ['nullable', 'exists:suppliers,id'],
            'stock_qty' => ['required', 'numeric', 'min:0'],
            'purchase_qty' => ['required', 'numeric', 'min:0'],
            'harga_satuan' => ['required', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string'],
            'tgl_pembelian' => ['nullable', 'date'],
        ]);

        // Ambil purchasing untuk divalidasi.
        $purchasing = Purchasing::with('pesanan.workflowStatus')->findOrFail($purchasingId);

        // PO yang sudah final tidak boleh diedit.
        if (in_array($purchasing->status, ['received', 'cancelled'])) {
            abort(422, 'PO item yang sudah received/cancelled tidak bisa diedit.');
        }

        $requiredQty = (float) $purchasing->required_qty;
        $stockQty = (float) $validated['stock_qty'];
        $purchaseQty = (float) $validated['purchase_qty'];

        $leftoverQty = max(($stockQty + $purchaseQty) - $requiredQty, 0);
        $totalHarga = $purchaseQty * (float) $validated['harga_satuan'];

        // Simpan perubahan dan hitung ulang field turunan.
        $purchasing->update([
            'supplier_id' => $validated['supplier_id'] ?? null,
            'stock_qty' => $stockQty,
            'purchase_qty' => $purchaseQty,
            'leftover_qty' => $leftoverQty,
            'qty_bahan' => $purchaseQty,
            'harga_satuan' => $validated['harga_satuan'],
            'total_harga' => $totalHarga,
            'notes' => $validated['notes'] ?? null,
            'tgl_pembelian' => $validated['tgl_pembelian'] ?? null,
        ]);

        $purchasing->pesanan->jobTicket->workflowHistory()->create([
            'step' => 'purchasing',
            'action' => 'po_item_updated',
            'user_id' => Auth::id(),
            'notes' => "PO item diperbarui: {$purchasing->item_bahan}",
        ]);

        return back()->with('success', 'PO item berhasil diperbarui.');
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        // Form pembuatan PO manual (tidak memiliki implementasi backend khusus).
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request, string $pesananId)
    {
        $request->validate([
            'supplier_id' => ['nullable', 'exists:suppliers,id'],
            'item_bahan' => ['required', 'string'],
            'qty_bahan' => ['required', 'numeric', 'min:0.0001'],
            'satuan' => ['required', 'string'],
            'harga_satuan' => ['required', 'numeric', 'min:0'],
            'tgl_pembelian' => ['nullable', 'date'],
            'purchase_scope' => ['nullable', 'in:sample_and_production,sample,production,additional'],
            'notes' => ['nullable', 'string']
        ]);

        // Validasi bahwa pesanan boleh menambahkan PO (invoice sample terverifikasi).
        $pesanan = Pesanan::with('workflowStatus')->findOrFail($pesananId);

        if (! $pesanan->workflowStatus?->sample_paid) {
            abort(422, 'Purchasing belum bisa dibuat karena invoice sample belum diverifikasi.');
        }

        // Simpan purchasing manual dalam transaksi.
        DB::transaction(function () use ($request, $pesanan) {
            $qty = (float) $request->qty_bahan;
            $price = (float) $request->harga_satuan;
            $purchaseScope = $request->purchase_scope ?: 'sample_and_production';

            $pesanan->purchasing()->create([
                'supplier_id' => $request->supplier_id,
                'item_bahan' => $request->item_bahan,

                'qty_bahan' => $qty,

                'required_qty' => $qty,
                'purchase_qty' => $qty,
                'stock_qty' => 0,
                'leftover_qty' => 0,

                'satuan' => $request->satuan,
                'harga_satuan' => $price,
                'total_harga' => $qty * $price,
                'tgl_pembelian' => $request->tgl_pembelian,
                'is_received' => false,
                'status' => 'draft',
                'purchase_scope' => $purchaseScope,
                'notes' => $request->notes,
            ]);

            // Sinkronisasi workflow pesanan setelah penambahan PO.
            $this->syncPesananPurchasingWorkflow($pesanan);

            // $pesanan->workflowStatus()->updateOrCreate(
            //     ['pesanan_id' => $pesanan->id],
            //     [
            //         'materials_purchased' => true,
            //         'materials_received' => false,
            //         'materials_distributed' => false,
            //     ]
            // );

            $pesanan->jobTicket->workflowHistory()->create([
                'step' => 'purchasing',
                'action' => 'created',
                'user_id' => Auth::id(),
                'notes' => 'Item purchasing dibuat.',
            ]);
        });

        return back()->with('success', 'Item purchasing berhasil dibuat.');
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $purchasingId)
    {
        $request->validate([
            'supplier_id' => ['nullable', 'exists:suppliers,id'],
            'item_bahan' => ['required', 'string'],
            'qty_bahan' => ['required', 'numeric', 'min:0.01'],
            'satuan' => ['required', 'string'],
            'harga_satuan' => ['required', 'numeric', 'min:0'],
            'tgl_pembelian' => ['nullable', 'date'],
        ]);

        // Ambil purchasing beserta history receiving untuk memvalidasi update.
        $purchasing = Purchasing::with(['materialReceivings', 'pesanan'])->findOrFail($purchasingId);

        // PO final tidak boleh diedit.
        if (in_array($purchasing->status, ['received', 'cancelled'])) {
            abort(422, 'Purchasing yang sudah received/cancelled tidak bisa diedit.');
        }

        $receivedQty = (float) $purchasing->materialReceivings()->sum('received_qty');

        if ((float) $request->qty_bahan < $receivedQty) {
            abort(422, 'Qty bahan tidak boleh lebih kecil dari qty yang sudah diterima.');
        }

        // Lakukan update dalam transaksi dan sinkronkan status.
        DB::transaction(function () use ($request, $purchasing) {
            $qty = (float) $request->qty_bahan;
            $price = (float) $request->harga_satuan;

            $purchasing->update([
                'supplier_id' => $request->supplier_id,
                'item_bahan' => $request->item_bahan,
                'qty_bahan' => $qty,
                'satuan' => $request->satuan,
                'harga_satuan' => $price,
                'total_harga' => $qty * $price,
                'tgl_pembelian' => $request->tgl_pembelian,
            ]);

            // Perbarui status berdasarkan receiving yang ada.
            $this->syncPurchasingStatus($purchasing);

            $purchasing->pesanan->jobTicket->workflowHistory()->create([
                'step' => 'purchasing',
                'action' => 'updated',
                'user_id' => Auth::id(),
                'notes' => 'Item purchasing diperbarui.',
            ]);
        });

        return back()->with('success', 'Item purchasing berhasil diperbarui.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $purchasingId)
    {
        // Hapus purchasing jika belum memiliki receiving dan belum received.
        $purchasing = Purchasing::with(['materialReceivings', 'pesanan.workflowStatus'])->findOrFail($purchasingId);

        if ($purchasing->materialReceivings()->exists()) {
            abort(422, 'Purchasing tidak bisa dihapus karena sudah memiliki riwayat receiving.');
        }

        if (in_array($purchasing->status, ['received'])) {
            abort(422, 'Purchasing yang sudah received tidak bisa dihapus.');
        }

        DB::transaction(function () use ($purchasing) {
            $pesanan = $purchasing->pesanan;

            $purchasing->delete();

            $this->syncPesananPurchasingWorkflow($pesanan);

            $pesanan->jobTicket->workflowHistory()->create([
                'step' => 'purchasing',
                'action' => 'deleted',
                'user_id' => Auth::id(),
                'notes' => 'Item purchasing dihapus.',
            ]);
        });

        return back()->with('success', 'Item purchasing berhasil dihapus.');
    }

    public function markOrdered(string $purchasingId)
    {
        // Tandai item PO sebagai ordered (dari draft).
        $purchasing = Purchasing::with('pesanan')->findOrFail($purchasingId);

        if ($purchasing->status !== 'draft') {
            abort(422, 'Hanya item draft yang bisa ditandai ordered.');
        }

        $purchasing->update([
            'status' => 'ordered',
        ]);

        $purchasing->pesanan->jobTicket->workflowHistory()->create([
            'step' => 'purchasing',
            'action' => 'ordered',
            'user_id' => Auth::id(),
            'notes' => 'Item ' .$purchasing->item_bahan. ' sudah dipesan',
        ]);

        return back()->with('success', 'Item purchasing ditandai ordered.');
    }

    public function undoMarkOrdered(string $purchasingId)
    {
        $purchasing = Purchasing::with('pesanan')->findOrFail($purchasingId);

        $purchasing->update([
            'status' => 'draft',
        ]);

        $purchasing->pesanan->jobTicket->workflowHistory()->create([
            'step' => 'purchasing',
            'action' => 'ordered',
            'user_id' => Auth::id(),
            'notes' => 'Item ' .$purchasing->item_bahan. ' batal dipesan',
        ]);

    }

    public function storeReceiving(Request $request, string $purchasingId)
    {
        $request->validate([
            'received_qty' => ['required', 'numeric', 'min:0.0001'],
            'received_at' => ['required', 'date'],
            'item_condition' => ['required', 'in:good,damaged,expired'],
            'notes' => ['nullable', 'string'],
        ]);

        // Simpan receiving untuk PO tertentu, dengan validasi batas qty.
        $purchasing = Purchasing::with([
            'materialReceivings',
            'pesanan.workflowStatus',
        ])->findOrFail($purchasingId);

        if (in_array($purchasing->status, ['received', 'cancelled'])) {
            abort(422, 'Item ini sudah final dan tidak bisa menerima receiving baru.');
        }

        $receivedQty = (float) $purchasing->materialReceivings()->sum('received_qty');
        $remainingQty = max(((float) $purchasing->qty_bahan) - $receivedQty, 0);

        // dd($request->received_qty > $remainingQty, 3.12 > 3.12);

        // dd($receivedQty, $remainingQty);

        // if ((float) $request->received_qty > $remainingQty) {
        //     abort(422, 'Qty diterima melebihi sisa qty bahan, received qty: ' . $request->received_qty . ' remainig qty: '  .$remainingQty);
        // }

        // Transaksi: buat receiving, sinkronkan status dan buat invoice/run bila perlu.
        DB::transaction(function () use ($request, $purchasing) {
            $purchasing->materialReceivings()->create([
                'received_qty' => $request->received_qty,
                'received_at' => $request->received_at,
                'item_condition' => $request->item_condition,
                'checked_by' => Auth::id(),
                'notes' => $request->notes,
            ]);

            $this->syncPurchasingStatus($purchasing);
            $this->syncPesananPurchasingWorkflow($purchasing->pesanan);

            $purchasing->pesanan->jobTicket->workflowHistory()->create([
                'step' => 'material_receiving',
                'action' => 'received',
                'user_id' => Auth::id(),
                'notes' => 'Material diterima.',
            ]);

            $this->invoiceService
                ->ensureProductionInvoice(
                    $purchasing->pesanan->jobTicket
                );

            // $this->productionRunService
            //     ->ensureProductionRun(
            //         $purchasing->pesanan
            //     );
        });

        // Notifikasi jika barang diterima cacat atau expired
        if (in_array($request->item_condition, ['damaged', 'expired'])) {
            $usersToNotify = User::permission('purchasings.edit')->get();
            if ($usersToNotify->isNotEmpty()) {
                Notification::send($usersToNotify, new SystemNotification(
                    'Penerimaan Barang Cacat / Expired',
                    "Material {$purchasing->item_bahan} diterima dengan kondisi {$request->item_condition} pada Job Ticket {$purchasing->pesanan->jobTicket->no_job_ticket}.",
                    "/job-tickets/{$purchasing->pesanan->jobTicket->id}?tab=purchasing",
                    'warning'
                ));
            }
        }

        return back()->with('success', 'Material receiving berhasil disimpan.');
    }

    public function destroyReceiving(string $receivingId)
    {
        // Hapus riwayat receiving dan sinkronkan status terkait.
        $receiving = MaterialReceiving::with('purchasing.pesanan.workflowStatus')->findOrFail($receivingId);

        DB::transaction(function () use ($receiving) {
            $purchasing = $receiving->purchasing;
            $pesanan = $purchasing->pesanan;

            $receiving->delete();

            $this->syncPurchasingStatus($purchasing);
            $this->syncPesananPurchasingWorkflow($pesanan);

            $pesanan->jobTicket->workflowHistory()->create([
                'step' => 'material_receiving',
                'action' => 'receiving_deleted',
                'user_id' => Auth::id(),
                'notes' => 'Riwayat receiving material dihapus.',
            ]);
        });

        return back()->with('success', 'Receiving material berhasil dihapus.');
    }

    private function syncPurchasingStatus(Purchasing $purchasing): void
    {
        $purchasing->refresh();

        $receivedQty = (float) $purchasing->materialReceivings()->whereNotIn('item_condition', ['damaged', 'expired'])->sum('received_qty');
        $qty = (float) $purchasing->qty_bahan;

        // Tentukan status purchasing berdasarkan jumlah yang diterima.
        if ($receivedQty <= 0) {
            $status = $purchasing->status === 'draft' ? 'draft' : 'ordered';
            $isReceived = false;
        } elseif ($receivedQty < $qty) {
            $status = 'partial_received';
            $isReceived = false;
        } else {
            $status = 'received';
            $isReceived = true;
        }

        // dd('Received: '.$receivedQty, 'Qty: '.$qty, 'Status: '.$status, $purchasing->materialReceivings()->get()->toArray());

        $purchasing->update([
            'received_qty' => $receivedQty,
            'status' => $status,
            'is_received' => $isReceived,
        ]);
    }

    private function getPurchasingSampleRequiredQty(Purchasing $purchasing, Pesanan $pesanan): float
    {
        // Hitung jumlah qty yang dibutuhkan untuk keperluan sample
        // berdasarkan scope purchasing (sample/production/both/additional).
        $scope = $purchasing->purchase_scope ?: 'sample_and_production';
        $totalRequiredQty = (float) ($purchasing->required_qty ?: $purchasing->qty_bahan ?: 0);

        if (in_array($scope, ['additional', 'production'])) {
            return 0;
        }

        if ($scope === 'sample') {
            return $totalRequiredQty;
        }

        $sampleQty = (float) ($pesanan->sample_qty ?: 0);
        $productionQty = (float) ($pesanan->quantity ?: $pesanan->q ?: 0);
        $totalQty = $sampleQty + $productionQty;

        if ($sampleQty <= 0 || $totalQty <= 0) {
            return  0;
        }

        return $this->roundQty($totalRequiredQty * ($sampleQty / $totalQty));
    }

    private function getPurchasingProductionRequiredQty(Purchasing $purchasing, Pesanan $pesanan): float
    {
        // Hitung jumlah qty yang dibutuhkan untuk keperluan produksi
        // berdasarkan scope purchasing (sample/production/both/additional).
        $scope = $purchasing->purchase_scope ?: 'sample_and_production';
        $totalRequiredQty = (float) ($purchasing->required_qty ?: $purchasing->qty_bahan ?: 0);

        if (in_array($scope, ['additional', 'sample'])) {
            return 0;
        }

        if ($scope === 'production') {
            return $totalRequiredQty;
        }

        $sampleQty = (float) ($pesanan->sample_qty ?: 0);
        $productionQty = (float) ($pesanan->quantity ?: $pesanan->q ?: 0);
        $totalQty = $sampleQty + $productionQty;

        if ($productionQty <= 0 || $totalQty <= 0) {
            return 0;
        }

        return $this->roundQty($totalRequiredQty * ($productionQty / $totalQty));
    }
    
    private function getPurchasingReceivedQty(Purchasing $purchasing): float
    {
        // Jumlah qty yang sudah diterima untuk sebuah purchasing.
        return (float) $purchasing->materialReceivings()->sum('received_qty');
    }

    private function roundQty(float $value, int $precision = 4): float
    {
        // Pembulatan qty untuk mengurangi isu presisi floating point.
        return round($value, $precision);
    }

    private function isQtyEnough(float $received, float $required): bool
    {
        // Cek apakah received sudah cukup untuk memenuhi required,
        // dengan toleransi kecil untuk perbandingan float.
        return $this->roundQty($received) + 0.0001 >= $this->roundQty($required);
    }

    private function isSampleMaterialsReady(Pesanan $pesanan): bool
    {
        // Cek apakah semua material yang diperlukan untuk sample sudah siap
        // (dengan mempertimbangkan purchase_scope tiap purchasing).
        $purchasings = $pesanan->purchasing()
            ->with('materialReceivings')
            ->where('status', '!=', 'cancelled')
            ->get();

        if ($purchasings->isEmpty()) {
            return false;
        }

        $relevantPurchasings = $purchasings->filter(function ($purchasing) use ($pesanan) {
            return $this->getPurchasingSampleRequiredQty($purchasing, $pesanan) > 0;
        });

        if ($relevantPurchasings->isEmpty()) {
            return false;
        }

        return $relevantPurchasings->every(function ($purchasing) use ($pesanan) {
            $required = $this->getPurchasingSampleRequiredQty($purchasing, $pesanan);
            $received = $this->getPurchasingReceivedQty($purchasing);

            return $this->isQtyEnough($received, $required);
        });
    }

    private function getReceivedQtyForMaterialSpec(Pesanan $pesanan, int $materialSpecId): float
    {
        return (float) $pesanan->purchasing
            ->where('pesanan_material_spec_id', $materialSpecId)
            ->flatMap(function ($purchasing) {
                return $purchasing->materialReceivings;
            })
            ->sum('received_qty');
    }

    private function isProductionMaterialsReady(Pesanan $pesanan): bool
    {
        $purchasings = $pesanan->purchasing()
            ->with('materialReceivings')
            ->where('status', '!=', 'cancelled')
            ->get();

        if ($purchasings->isEmpty()) {
            return false;
        }

        $relevantPurchasings = $purchasings->filter(function ($purchasing) use ($pesanan) {
            return $this->getPurchasingProductionRequiredQty($purchasing, $pesanan) > 0;
        });

        if ($relevantPurchasings->isEmpty()) {
            return false;
        }

        return $relevantPurchasings->every(function ($purchasing) use ($pesanan) {
            $scope = $purchasing->purchase_scope ?: 'sample_and_production';

            // ✅ FIX LOGIKA:
            // Jika PO adalah gabungan sample & production, pastikan total barang diterima 
            // menutupi TOTAL DIBUTUHKAN. Jika tidak, barang yang baru datang (untuk sample) 
            // akan dianggap memenuhi produksi massal juga.
            if ($scope === 'sample_and_production') {
                $required = (float) ($purchasing->required_qty ?: $purchasing->qty_bahan ?: 0);
            } else {
                $required = $this->getPurchasingProductionRequiredQty($purchasing, $pesanan);
            }

            $received = $this->getPurchasingReceivedQty($purchasing);

            return $this->isQtyEnough($received, $required);
        });
    }

    private function syncPesananPurchasingWorkflow(Pesanan $pesanan): void
    {
        $pesanan->loadMissing([
            'workflowStatus',
            'purchasing',
            'manufacturingSpecs',
            'productionRuns.processes',  
            'materialSpecs'          
        ]);

        $purchasings = $pesanan->purchasing()->with('materialReceivings')->get();
        $hasPurchasing = $purchasings->count() > 0;

        $allReceived = $hasPurchasing && $purchasings->every(function ($item) {
            return $item->is_received || $item->status === 'received';
        });

        $currentWorkflow = $pesanan->workflowStatus;

        // 1. DETEKSI APAKAH PESANAN INI BUTUH SAMPLE ATAU TIDAK
        $isNoSample = (float) ($pesanan->sample_qty ?? 0) <= 0;

        // 2. BYPASS LOGIC UNTUK SAMPLE
        // Jika tidak butuh sample, anggap material sample selalu "ready" agar workflow bisa lanjut.
        $sampleMaterialsReady = $isNoSample ? true : $this->isSampleMaterialsReady($pesanan);
        
        $productionMaterialsReady = $this->isProductionMaterialsReady($pesanan);

        if ($pesanan->samples()->whereNot('status', 'revision_needed')->exists()) {
            $sampleMaterialsReady = true;
        }

        if ($pesanan->productionRuns()->where('type', 'production')->exists()) {
            $productionMaterialsReady = true;
        }

        if ($pesanan->productionRuns()
            ->where('type', 'production')
            ->whereIn('status', ['draft', 'in_progress', 'waiting_qc', 'qc_completed', 'packed', 'in_delivery', 'delivered'])
            ->exists()
        ) {
            $productionMaterialsReady = true;
        }

        $allDistributed = $hasPurchasing && $purchasings->every(function ($item) {
            return $item->is_distributed || $item->status === 'distributed';
        });

        // 3. UPDATE WORKFLOW STATUS
        // Jika isNoSample true, kita juga harus nge-bypass sample_paid dan sample_approved
        // agar kartu Kanban tidak nyangkut di step sample.
        $pesanan->workflowStatus()->updateOrCreate(
            ['pesanan_id' => $pesanan->id],
            [
                'materials_purchased' => $hasPurchasing,
                'materials_received' => $allReceived,
                'materials_distributed' => $allDistributed,

                // Bypass logic diaplikasikan ke DB
                'sample_materials_ready' => $sampleMaterialsReady,
                'sample_paid' => $isNoSample ? true : ($currentWorkflow->sample_paid ?? false),
                'sample_approved' => $isNoSample ? true : ($currentWorkflow->sample_approved ?? false),
                
                'production_materials_ready' => $productionMaterialsReady,
            ]
        );

        // Ambil status sebelumnya untuk memastikan notifikasi hanya dikirim sekali
        $wasSampleMaterialsReady = $currentWorkflow->sample_materials_ready ?? false;

        // Notifikasi jika material sample BARU SAJA dinyatakan siap dan butuh sample
        if ($sampleMaterialsReady && !$wasSampleMaterialsReady && !$isNoSample) {
            $usersToNotify = User::permission('samples.start')->get();
            if ($usersToNotify->isNotEmpty()) {
                Notification::send($usersToNotify, new SystemNotification(
                    'Material Sample Siap',
                    "Semua material sample untuk Job Ticket {$pesanan->jobTicket->no_job_ticket} telah siap. Silakan mulai proses pembuatan sample.",
                    "/job-tickets/{$pesanan->jobTicket->id}?tab=sample",
                    'success'
                ));
            }
        }

        // 4. GUARD UNTUK ENSURE RUN
        // Pastikan kita HANYA men-generate Sample Run jika material ready DAN memang butuh sample
        if ($sampleMaterialsReady && !$isNoSample) {
            $this->productionRunService->ensureSampleRun($pesanan);
        }

        if ($productionMaterialsReady) {
            $this->productionRunService->ensureProductionRun($pesanan);
        }
    }

    private function ensureSampleProductionRun(Pesanan $pesanan)
    {
        // Pastikan ada sample production run jika belum ada.
        $pesanan->loadMissing([
            'manufacturingSpecs',
            'productionRuns',
        ]);

        $existsingRun = $pesanan->productionRuns()
            ->where('type', 'sample')
            ->whereNotIn('status', ['rejected'])
            ->latest()
            ->first();

        if ($existsingRun) {
            return;
        }

        // Buat sample run baru berdasarkan manufacturing specs.
        DB::transaction(function() use ($pesanan, $existingRun) {
            $run = $pesanan->productionRuns()->create([
                'type' => 'sample',
                'status' => 'draft',
            ]);
                
            $sampleQty = (int) ($pesanan->sample_qty ?: 1);
            foreach ($pesanan->manufacturingSpecs as $index => $spec) {
                $run->processes()->create([
                    'pesanan_manufacturing_spec_id' => $spec->id,
                    'work_name' => $spec->work_name_snapshot,
                    'quantity' => $sampleQty,
                    'sequence' => $index + 1,
                    'status' => 'pending',
                    'qc_status' => 'pending',
                ]);
            }

            $pesanan->jobTicket->workflowHistory()->create([
                'step' => 'production',
                'action' => 'sample_run_created',
                'user_id' => Auth::id(),
                'notes' => "Sample production run otomatis dibuat dengan qty {$sampleQty}.",
            ]);
        });
    }
}
