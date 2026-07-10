<?php

namespace App\Services;

use App\Models\Pesanan;
use App\Models\Sample;
use App\Models\ProductionRun;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class ProductionRunService
{
    /**
     * Membuat atau memastikan Sample Run ada untuk SPESIFIK 1 Pesanan
     */
    public function ensureSampleRun(Pesanan $pesanan, ?int $quantity = null): ?Sample
    {
        return DB::transaction(function () use ($pesanan, $quantity) {
            $pesanan->loadMissing([
                'samples',
                'jobTicket'
            ]);

            // Cari sample aktif (bukan rejected)
            $activeSample = $pesanan->samples()
                ->whereIn('status', ['draft', 'in_production', 'completed', 'in_delivery'])
                ->latest()
                ->first();

            if ($activeSample) {
                return $activeSample;
            }

            

            $sampleQty = $quantity ?: (int) ($pesanan->sample_qty ?: 1);

            if ($sampleQty <= 0) {
                return null;
            }

            // Cari Invoice Sample yang aktif untuk Job Ticket ini
            $activeInvoice = $pesanan->jobTicket->invoices()
                ->where('kategori_invoice', 'sample')
                ->whereNotIn('status_tagihan', ['cancelled'])
                ->latest()
                ->first();

            $sample = $pesanan->samples()->create([
                'qty' => $sampleQty,
                'status' => 'draft',
                'invoice_id' => $activeInvoice?->id, // <--- Link otomatis ke Invoice yang aktif
                'is_chargeable' => $activeInvoice ? true : false,
                'created_sample_at' => now(),
            ]);

            // Update Workflow Status
            $pesanan->workflowStatus()->updateOrCreate(
                ['pesanan_id' => $pesanan->id],
                ['sample_created' => true]
            );

            $pesanan->jobTicket->workflowHistory()->create([
                'step' => 'sample',
                'action' => 'sample_created',
                'user_id' => Auth::id(),
                'notes' => "Sample otomatis diinisiasi dari penerimaan material dengan qty {$sampleQty} pcs.",
            ]);

            return $sample;
        });
    }

    /**
     * Membuat atau memastikan Mass Production Run ada untuk SPESIFIK 1 Pesanan
     */
    public function ensureProductionRun(Pesanan $pesanan, ?int $quantity = null): ?ProductionRun
    {
        return DB::transaction(function () use ($pesanan, $quantity) {
            $pesanan->loadMissing([
                'manufacturingSpecs',
                'productionRuns',
                'jobTicket',
            ]);

            $existingRun = $pesanan->productionRuns()
                ->where('type', 'production')
                ->whereNotIn('status', ['rejected'])
                ->latest()
                ->first();

            if ($existingRun) {
                return $existingRun;
            }

            // Fallback ke quantity utama dari form pesanan jika null
            $productionQty = $quantity ?: (int) ($pesanan->quantity ?: $pesanan->q ?: 0);

            if ($productionQty <= 0) {
                return null; // Skip jika qty produksi 0
            }

            // Buat Induk Production Run (Level Pesanan)
            $run = $pesanan->productionRuns()->create([
                'type' => 'production',
                'status' => 'draft',
            ]);

            $executableSpecs = $this->executableManufacturingSpecs($pesanan);

            foreach ($executableSpecs as $index => $spec) {
                // pesanan_id juga dihapus di sini
                $run->processes()->create([
                    'pesanan_manufacturing_spec_id' => $spec->id,
                    'work_name' => $spec->work_name_snapshot,
                    'quantity' => $productionQty, 
                    'sequence' => $index + 1,
                    'status' => 'pending',
                    'qc_status' => 'pending',
                ]);
            }

            $pesanan->jobTicket->workflowHistory()->create([
                'step' => 'production',
                'action' => 'production_run_auto_created',
                'user_id' => Auth::id(),
                'notes' => "Mass production run otomatis disiapkan dengan qty {$productionQty} pcs.",
            ]);

            return $run;
        });
    }

    /**
     * Filter proses mana saja yang masuk ke papan produksi
     */
    private function executableManufacturingSpecs(Pesanan $pesanan)
    {
        return $pesanan->manufacturingSpecs
            ->filter(function ($spec) {
                $behavior = $spec->process_behavior ?: null;

                // Jika spec tersebut didefinisikan khusus sebagai proses produksi
                if ($behavior) {
                    return $behavior === 'production_process';
                }

                $workName = strtolower($spec->work_name_snapshot ?? '');

                // Karena fitur Packing dan QC sekarang di-handle di level global (ProductionRun induknya),
                // maka kita kecualikan kata kunci tersebut dari form card per-proses
                $costingOnlyKeywords = [
                    'qc',
                    'quality control',
                    'packing',
                    'packaging',
                ];

                foreach ($costingOnlyKeywords as $keyword) {
                    if (str_contains($workName, $keyword)) {
                        return false;
                    }
                }

                return true;
            })
            ->values();
    }
}