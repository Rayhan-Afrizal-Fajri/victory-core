<?php

namespace App\Services;

use App\Models\Pesanan;
// use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class PurchasingService
{
    public function generateFromBom(Pesanan $pesanan)
    {
        // Load relasi yang dibutuhkan jika belum diload
        $pesanan->loadMissing([
            'workflowStatus',
            'materialSpecs.supplier',
            'purchasing',
            'jobTicket.quotations',
        ]);

        //keperluan testing
        // $productionQty = $pesanan->workflowStatus->sample_revision == true 
        //     ? 0 
        //     : (int) ($pesanan->quantity ?: $pesanan->q ?: 0);
            
        // $sampleQty = (int) ($pesanan->sample_qty ?: 0);
        // $totalPlannedQty = $productionQty + $sampleQty;

        // dd(
        //     'sample paid?',
        //     $pesanan->workflowStatus->sample_paid,
        //     'purchasing exists?',
        //     $pesanan->purchasing()->exists(),
        //     'sample revision?',
        //     $pesanan->workflowStatus->sample_revision,
        //     'total planned qty?',
        //     $totalPlannedQty, 'sample qty', $sampleQty, 'production qty', $productionQty
        // );

        // 1. Cek validasi dasar, gunakan return alih-alih abort()
        if (! $pesanan->workflowStatus?->sample_paid) {
            return false; // Belum dibayar, lewati
        }

        if ($pesanan->purchasing()->exists() && $pesanan->workflowStatus->sample_revision == false) {
            return false; // Sudah pernah digenerate, lewati
        }

        // 2. Kalkulasi Qty (Mengabaikan request karena akan mengambil langsung dari DB)
        $productionQty = $pesanan->workflowStatus->sample_revision == true 
            ? 0 
            : (int) ($pesanan->quantity ?: $pesanan->q ?: 0);
            
        $sampleQty = (int) ($pesanan->sample_qty ?: 0);
        $totalPlannedQty = $productionQty + $sampleQty;

        if ($totalPlannedQty <= 0) {
            return false; // Qty tidak valid, lewati
        }

        // 3. Proses Generate PO (Tidak perlu DB::transaction baru jika dipanggil dari dalam transaksi payment)
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

        // 4. Update Workflow
        $pesanan->workflowStatus()->updateOrCreate(
            ['pesanan_id' => $pesanan->id],
            [
                'materials_purchased' => true,
                'purchasing_generated' => true,
                'materials_received' => false,
            ]
        );

        if ($pesanan->workflowStatus->sample_revision == true) {
            $pesanan->workflowStatus()->update([
                'sample_materials_ready' => false,
            ]);
        }

        // 5. Catat History
        $pesanan->jobTicket->workflowHistory()->create([
            'step' => 'purchasing',
            'action' => 'generated_from_bom',
            'user_id' => Auth::id(),
            'notes' => 'Purchasing otomatis digenerate dari BOM untuk kebutuhan pesanan.',
        ]);

        // 6. Update Status Job Ticket
        $pesanan->jobTicket()->update([
            'status' => 'Purchasing'
        ]);

        return true;
    }
}