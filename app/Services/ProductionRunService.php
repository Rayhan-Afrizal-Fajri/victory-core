<?php

namespace App\Services;

use App\Models\Pesanan;
use App\Models\ProductionRun;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class ProductionRunService
{
    public function ensureSampleRun(Pesanan $pesanan, ?int $quantity = null): ?ProductionRun
    {
        return DB::transaction(function () use ($pesanan, $quantity) {
            $pesanan->loadMissing([
                'manufacturingSpecs',
                'productionRuns',
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

            $run = $pesanan->productionRuns()->create([
                'type' => 'sample',
                'quantity' => $sampleQty,
                'status' => 'draft',
            ]);

            foreach ($pesanan->manufacturingSpecs as $index => $spec) {
                $run->processes()->create([
                    'pesanan_manufacturing_spec_id' => $spec->id,
                    'work_name' => $spec->work_name_snapshot,
                    'sequence' => $index + 1,
                    'status' => 'pending',
                    'qc_status' => 'pending',
                ]);
            }

            $pesanan->workflowHistory()->create([
                'step' => 'sample_production',
                'action' => 'sample_run_auto_created',
                'user_id' => Auth::id(),
                'notes' => "Sample production run dibuat dengan qty {$sampleQty}.",
            ]);

            return $run;
        });
    }

    public function ensureProductionRun(Pesanan $pesanan): ?ProductionRun
    {
        return DB::transaction(function () use ($pesanan) {
            $pesanan->loadMissing([
                'manufacturingSpecs',
                'productionRuns',
            ]);

            $existingRun = $pesanan->productionRuns()
                ->where('type', 'production')
                ->whereNotIn('status', ['cancelled', 'rejected'])
                ->latest()
                ->first();

            if ($existingRun) {
                return $existingRun;
            }

            $productionQty = (int) ($pesanan->quantity ?: $pesanan->q ?: 0);

            if ($productionQty <= 0) {
                return null;
            }

            $run = $pesanan->productionRuns()->create([
                'type' => 'production',
                'quantity' => $productionQty,
                'status' => 'draft',
            ]);

            foreach ($pesanan->manufacturingSpecs as $index => $spec) {
                $run->processes()->create([
                    'pesanan_manufacturing_spec_id' => $spec->id,
                    'work_name' => $spec->work_name_snapshot,
                    'sequence' => $index + 1,
                    'status' => 'pending',
                    'qc_status' => 'pending',
                ]);
            }

            $pesanan->workflowHistory()->create([
                'step' => 'production',
                'action' => 'production_run_auto_created',
                'user_id' => Auth::id(),
                'notes' => "Production run otomatis dibuat dengan qty {$productionQty}.",
            ]);

            return $run;
        });
    }
}