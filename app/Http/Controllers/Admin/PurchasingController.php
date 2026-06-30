<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\MaterialReceiving;
use App\Models\Pesanan;
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

    public function __construct(
        protected ProductionRunService $productionRunService,
        protected InvoiceService $invoiceService,
    ) {}
    /**
     * Display a listing of the resource.
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
        $receivedQty = (float) (
            $p->received_qty
            ?: $p->materialReceivings->sum('received_qty')
        );

        $purchaseQty = (float) ($p->purchase_qty ?: $p->qty_bahan);

        $remainingQty = max(
            $purchaseQty - $receivedQty,
            0
        );

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

    public function generateFromBom(Request $request, string $pesananId)
    {
        $validated = $request->validate([
            'sample_qty' => ['required', 'integer', 'min:0'],
        ]);

        $pesanan = Pesanan::with([
            'workflowStatus',
            'materialSpecs.supplier',
            'purchasing',
            'jobTicket.quotations',
        ])->findOrFail($pesananId);

        if (! $pesanan->workflowStatus?->sample_paid) {
            abort(422, 'Purchasing belum bisa dibuat karena invoice sample belum lunas.');
        }

        if ($pesanan->purchasing()->exists()) {
            abort(422, 'Purchasing sudah pernah digenerate. Edit PO yang sudah ada jika perlu.');
        }

        $quotation = $pesanan->jobTicket->quotations->first();

        // dd($pesanan,$quotation);

        $productionQty = (int) ($pesanan->quantity ?: $pesanan->q ?: 0);
        $sampleQty = (int) ($pesanan->sample_qty ?: 1);
        $totalPlannedQty = $productionQty + $sampleQty;

        $pesanan->update([
            'sample_qty' => $sampleQty,
        ]);

        if ($totalPlannedQty <= 0) {
            abort(422, 'Total quantity belum valid.');
        }

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

                $pesanan->purchasing()->create([
                    'pesanan_material_spec_id' => $spec->id,
                    'supplier_id' => $spec->supplier_id,

                    'item_bahan' => $spec->material_name_snapshot,
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
                    'purchase_scope' => 'sample_and_production',
                    'notes' => null,
                ]);
            }

            $pesanan->workflowStatus()->updateOrCreate(
                ['pesanan_id' => $pesanan->id],
                [
                    'materials_purchased' => true,
                    'materials_received' => false,
                ]
            );

            $pesanan->jobTicket->workflowHistory()->create([
                'step' => 'purchasing',
                'action' => 'generated_from_bom',
                'user_id' => Auth::id(),
                'notes' => 'Purchasing digenerate dari BOM untuk kebutuhan sample dan production.',
            ]);

            $pesanan->jobTicket()->update([
                'status' => 'Purchasing'
            ]);
        });

        return back()->with('success', 'Purchasing BOM/PO berhasil digenerate.');
    }

    public function updatePoItem(Request $request, string $purchasingId)
    {
        $validated = $request->validate([
            'supplier_id' => ['nullable', 'exists:suppliers,id'],
            'stock_qty' => ['required', 'numeric', 'min:0'],
            'purchase_qty' => ['required', 'numeric', 'min:0'],
            'harga_satuan' => ['required', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string'],
            'tgl_pembelian' => ['nullable', 'date'],
        ]);

        $purchasing = Purchasing::with('pesanan.workflowStatus')->findOrFail($purchasingId);

        if (in_array($purchasing->status, ['received', 'cancelled'])) {
            abort(422, 'PO item yang sudah received/cancelled tidak bisa diedit.');
        }

        $requiredQty = (float) $purchasing->required_qty;
        $stockQty = (float) $validated['stock_qty'];
        $purchaseQty = (float) $validated['purchase_qty'];

        $leftoverQty = max(($stockQty + $purchaseQty) - $requiredQty, 0);
        $totalHarga = $purchaseQty * (float) $validated['harga_satuan'];

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
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request, string $pesananId)
    {
        $request->validate([
            'supplier_id' => ['nullable', 'exists:suppliers,id'],
            'item_bahan' => ['required', 'string'],
            'qty_bahan' => ['required', 'numeric', 'min:0.01'],
            'satuan' => ['required', 'string'],
            'harga_satuan' => ['required', 'numeric', 'min:0'],
            'tgl_pembelian' => ['nullable', 'date'],
            'purchase_scope' => ['nullable', 'in:sample_and_production,sample,production,additional'],
            'notes' => ['nullable', 'string']
        ]);

        $pesanan = Pesanan::with('workflowStatus')->findOrFail($pesananId);

        if (! $pesanan->workflowStatus?->sample_paid) {
            abort(422, 'Purchasing belum bisa dibuat karena invoice sample belum diverifikasi.');
        }

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

        $purchasing = Purchasing::with(['materialReceivings', 'pesanan'])->findOrFail($purchasingId);

        if (in_array($purchasing->status, ['received', 'cancelled'])) {
            abort(422, 'Purchasing yang sudah received/cancelled tidak bisa diedit.');
        }

        $receivedQty = (float) $purchasing->materialReceivings()->sum('received_qty');

        if ((float) $request->qty_bahan < $receivedQty) {
            abort(422, 'Qty bahan tidak boleh lebih kecil dari qty yang sudah diterima.');
        }

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
            'notes' => 'Item purchasing ditandai sudah ordered.',
        ]);

        return back()->with('success', 'Item purchasing ditandai ordered.');
    }

    public function storeReceiving(Request $request, string $purchasingId)
    {
        $request->validate([
            'received_qty' => ['required', 'numeric', 'min:0.01'],
            'received_at' => ['required', 'date'],
            'notes' => ['nullable', 'string'],
        ]);

        $purchasing = Purchasing::with([
            'materialReceivings',
            'pesanan.workflowStatus',
        ])->findOrFail($purchasingId);

        if (in_array($purchasing->status, ['received', 'cancelled'])) {
            abort(422, 'Item ini sudah final dan tidak bisa menerima receiving baru.');
        }

        $receivedQty = (float) $purchasing->materialReceivings()->sum('received_qty');
        $remainingQty = max(((float) $purchasing->qty_bahan) - $receivedQty, 0);

        if ((float) $request->received_qty > $remainingQty) {
            abort(422, 'Qty diterima melebihi sisa qty bahan.');
        }

        DB::transaction(function () use ($request, $purchasing) {
            $purchasing->materialReceivings()->create([
                'received_qty' => $request->received_qty,
                'received_at' => $request->received_at,
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

            $this->productionRunService
                ->ensureProductionRun(
                    $purchasing->pesanan->jobTicket
                );
        });

        return back()->with('success', 'Material receiving berhasil disimpan.');
    }

    public function destroyReceiving(string $receivingId)
    {
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

        $receivedQty = (float) $purchasing->materialReceivings()->sum('received_qty');
        $qty = (float) $purchasing->qty_bahan;

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
        return (float) $purchasing->materialReceivings()->sum('received_qty');
    }

    private function roundQty(float $value, int $precision = 4): float
    {
        return round($value, $precision);
    }

    private function isQtyEnough(float $received, float $required): bool
    {
        return $this->roundQty($received) + 0.0001 >= $this->roundQty($required);
    }

    private function isSampleMaterialsReady(Pesanan $pesanan): bool
    {
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
            $required = $this->getPurchasingProductionRequiredQty($purchasing, $pesanan);
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
            'jobTicket.productionRuns.processes',  
            'materialSpecs'           
        ]);

        $purchasings = $pesanan->purchasing()->with('materialReceivings')->get();

        $hasPurchasing = $purchasings->count() > 0;

        $allReceived = $hasPurchasing && $purchasings->every(function ($item) {
            return $item->is_received || $item->status === 'received';
        });

        $currentWorkflow = $pesanan->workflowStatus;

        $sampleMaterialsReady = $this->isSampleMaterialsReady($pesanan);
        $productionMaterialsReady = $this->isProductionMaterialsReady($pesanan);

        //down downgrade if sample is already started / ready before
        if ($currentWorkflow?->sample_materials_ready) {
            $sampleMaterialsReady = true;
        }

        if ($pesanan->jobTicket->productionRuns()->where('type', 'sample')->exists()) {
            $sampleMaterialsReady = true;
        }

        //dont downgrade if production is already started / ready before
        if ($currentWorkflow?->production_materials_ready) {
            $productionMaterialsReady = true;
        }

        if ($pesanan->jobTicket->productionRuns()
            ->where('type', 'production')
            ->whereIn('status', ['draft', 'in_progress', 'waiting_qc', 'qc_completed', 'packed', 'in_delivery', 'delivered'])
            ->exists()
        ) {
            $productionMaterialsReady = true;
        }

        $allDistributed = $hasPurchasing && $purchasings->every(function ($item) {
            return $item->is_distributed || $item->status === 'distributed';
        });

        $pesanan->workflowStatus()->updateOrCreate(
            ['pesanan_id' => $pesanan->id],
            [
                'materials_purchased' => $hasPurchasing,
                'materials_received' => $allReceived,
                'materials_distributed' => $allDistributed,

                'sample_materials_ready' => $sampleMaterialsReady,
                'production_materials_ready' => $productionMaterialsReady,
            ]
        );

        if ($sampleMaterialsReady) {
            $this->productionRunService->ensureSampleRun($pesanan->jobTicket);
        }

        if ($productionMaterialsReady) {
            $this->productionRunService->ensureProductionRun($pesanan->jobTicket);
        }
    }

    private function ensureSampleProductionRun(Pesanan $pesanan)
    {
        $pesanan->loadMissing([
            'manufacturingSpecs',
            'jobTicket.productionRuns',
        ]);

        $existsingRun = $pesanan->jobTicket->productionRuns()
            ->where('type', 'sample')
            ->whereNotIn('status', ['rejected'])
            ->latest()
            ->first();

        if ($existsingRun) {
            return;
        }

        
        DB::transaction(function() use ($pesanan, $existingRun) {
            $run = $pesanan->jobTicket->productionRuns()->create([
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
