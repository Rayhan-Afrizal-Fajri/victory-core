<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\MaterialReceiving;
use App\Models\Pesanan;
use App\Models\Purchasing;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class PurchasingController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return Inertia::render('admin/purchasing/Index');
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
        ])->findOrFail($pesananId);

        if (! $pesanan->workflowStatus?->sample_paid) {
            abort(422, 'Purchasing belum bisa dibuat karena invoice sample belum lunas.');
        }

        if ($pesanan->purchasing()->exists()) {
            abort(422, 'Purchasing sudah pernah digenerate. Edit PO yang sudah ada jika perlu.');
        }

        $productionQty = (int) ($pesanan->quantity ?: $pesanan->q ?: 0);
        $sampleQty = (int) $validated['sample_qty'];
        $totalPlannedQty = $productionQty + $sampleQty;

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

                // dd('nama: '.$spec->material_name_snapshot,' required: '.$requiredQty.', purchase: '.$purchaseQty.', stock: '.$stockQty.', leftover: '.$leftoverQty.', harga: '.$hargaSatuan.', total: '.$totalHarga);

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

            $pesanan->workflowHistory()->create([
                'step' => 'purchasing',
                'action' => 'generated_from_bom',
                'user_id' => Auth::id(),
                'notes' => 'Purchasing digenerate dari BOM untuk kebutuhan sample dan production.',
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

        $purchasing->pesanan->workflowHistory()->create([
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
        ]);

        $pesanan = Pesanan::with('workflowStatus')->findOrFail($pesananId);

        if (! $pesanan->workflowStatus?->sample_paid) {
            abort(422, 'Purchasing belum bisa dibuat karena invoice sample belum diverifikasi.');
        }

        DB::transaction(function () use ($request, $pesanan) {
            $qty = (float) $request->qty_bahan;
            $price = (float) $request->harga_satuan;

            $pesanan->purchasing()->create([
                'supplier_id' => $request->supplier_id,
                'item_bahan' => $request->item_bahan,
                'qty_bahan' => $qty,
                'satuan' => $request->satuan,
                'harga_satuan' => $price,
                'total_harga' => $qty * $price,
                'tgl_pembelian' => $request->tgl_pembelian,
                'is_received' => false,
                'status' => 'draft',
            ]);

            $pesanan->workflowStatus()->updateOrCreate(
                ['pesanan_id' => $pesanan->id],
                [
                    'materials_purchased' => true,
                    'materials_received' => false,
                    'materials_distributed' => false,
                ]
            );

            $pesanan->workflowHistory()->create([
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

            $purchasing->pesanan->workflowHistory()->create([
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

            $pesanan->workflowHistory()->create([
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



        $purchasing->pesanan->workflowHistory()->create([
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

            $purchasing->pesanan->workflowHistory()->create([
                'step' => 'material_receiving',
                'action' => 'received',
                'user_id' => Auth::id(),
                'notes' => 'Material diterima.',
            ]);
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

            $pesanan->workflowHistory()->create([
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

        $purchasing->update([
            'received_qty' => $receivedQty,
            'status' => $status,
            'is_received' => $isReceived,
        ]);
    }

    private function syncPesananPurchasingWorkflow(Pesanan $pesanan): void
    {
        $purchasings = $pesanan->purchasing()->get();

        $hasPurchasing = $purchasings->count() > 0;

        $allReceived = $hasPurchasing && $purchasings->every(function ($item) {
            return $item->is_received || $item->status === 'received';
        });

        $pesanan->workflowStatus()->updateOrCreate(
            ['pesanan_id' => $pesanan->id],
            [
                'materials_purchased' => $hasPurchasing,
                'materials_received' => $allReceived,
            ]
        );
    }
}
