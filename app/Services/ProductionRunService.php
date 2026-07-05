<?php

namespace App\Services;

use App\Models\Pesanan;
use App\Models\ProductionRun;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class ProductionRunService
{
    /**
     * Membuat atau memastikan Sample Run ada untuk SPESIFIK 1 Pesanan
     */
    public function ensureSampleRun(Pesanan $pesanan, ?int $quantity = null): ?ProductionRun
    {
        return DB::transaction(function () use ($pesanan, $quantity) {
            $pesanan->loadMissing([
                'manufacturingSpecs',
                'productionRuns',
                'jobTicket'
            ]);

            $existingRun = $pesanan->productionRuns()
                ->where('type', 'sample')
                ->whereNotIn('status', ['rejected'])
                ->latest()
                ->first();

            if ($existingRun) {
                return $existingRun;
            }

            $sampleQty = $quantity ?: (int) ($pesanan->sample_qty ?: 1);

            if ($sampleQty <= 0) {
                return null;
            }

            // Buat Induk Production Run (Level Pesanan)
            $run = $pesanan->productionRuns()->create([
                'type' => 'sample', 
                'status' => 'draft',
            ]);

            $executableSpecs = $this->executableManufacturingSpecs($pesanan);

            foreach ($executableSpecs as $index => $spec) {
                // pesanan_id sudah dihapus di sini karena sudah tidak ada di fillable Process
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
                'notes' => "Sample production run otomatis dibuat dengan qty {$sampleQty} pcs.",
            ]);

            return $run;
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