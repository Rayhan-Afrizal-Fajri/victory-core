<?php

namespace App\Services;

use App\Models\JobTicket;
use App\Models\Pesanan;
use App\Models\ProductionRun;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class ProductionRunService
{
    /**
     * Membuat atau memastikan Sample Run ada untuk keseluruhan Job Ticket
     */
    public function ensureSampleRun(JobTicket $jobTicket): ?ProductionRun
    {
        return DB::transaction(function () use ($jobTicket) {
            $jobTicket->loadMissing([
                'pesanans.manufacturingSpecs',
                'productionRuns',
            ]);

            // Cek apakah batch produksi sample sudah ada untuk job ticket ini
            $existingRun = $jobTicket->productionRuns()
                ->where('type', 'sample')
                ->whereNotIn('status', ['rejected'])
                ->latest()
                ->first();

            if ($existingRun) {
                return $existingRun;
            }

            // Buat Induk Production Run (Global)
            $run = $jobTicket->productionRuns()->create([
                'type' => 'sample',
                'status' => 'draft',
            ]);

            // Loop ke semua pesanan untuk meng-generate proses produksinya
            foreach ($jobTicket->pesanans as $pesanan) {
                $sampleQty = (int) ($pesanan->sample_qty ?: 0);

                if ($sampleQty <= 0) {
                    continue; // Skip jika pesanan ini tidak butuh sample
                }

                $executableSpecs = $this->executableManufacturingSpecs($pesanan);

                foreach ($executableSpecs as $index => $spec) {
                    $run->processes()->create([
                        'pesanan_id' => $pesanan->id, // Tautkan ke pesanannya
                        'quantity' => $sampleQty,
                        'pesanan_manufacturing_spec_id' => $spec->id,
                        'work_name' => $spec->work_name_snapshot,
                        'sequence' => $index + 1,
                        'status' => 'pending',
                        'qc_status' => 'pending',
                    ]);
                }
                
                $pesanan->jobTicket->workflowHistory()->create([
                    'step' => 'production',
                    'action' => 'sample_run_auto_created',
                    'user_id' => Auth::id(),
                    'notes' => "Proses sample produksi untuk produk ini telah disiapkan dalam batch Job Ticket.",
                ]);
            }

            return $run;
        });
    }

    /**
     * Membuat atau memastikan Production Run utama (Mass Pro) ada untuk Job Ticket
     */
    public function ensureProductionRun(JobTicket $jobTicket): ?ProductionRun
    {
        $jobTicket->loadMissing([
            'pesanans.workflowStatus',
            'pesanans.purchasing',
            'productionRuns',
        ]);

        $existingRun = $jobTicket->productionRuns()
            ->where('type', 'production')
            ->whereNotIn('status', ['rejected'])
            ->latest()
            ->first();

        if ($existingRun) {
            return $existingRun;
        }

        $sampleApproved =
            $jobTicket->pesanans
                ->every(fn($p)=>
                    optional($p->workflowStatus)->sample_approved
                );

        $allReceived =
        $jobTicket->pesanans->every(function ($pesanan) {

            return
                $pesanan->purchasing->isNotEmpty()
                &&
                $pesanan->purchasing->every(
                    fn($p) => $p->is_received
                );
        });

        if (! $sampleApproved || ! $allReceived) {
            return null;
        }

        return $this->createProductionRun($jobTicket);
    }

    private function createProductionRun(JobTicket $jobTicket) {
        return DB::transaction(function () use ($jobTicket) {
            $jobTicket->loadMissing([
                'pesanans.manufacturingSpecs',
                'pesanans.workflowStatus',
                'productionRuns',
            ]);

            $existingRun = $jobTicket->productionRuns()
                ->where('type', 'production')
                ->whereNotIn('status', ['rejected'])
                ->latest()
                ->first();

            if ($existingRun) {
                return $existingRun;
            }

            // Buat Induk Production Run (Global)
            $run = $jobTicket->productionRuns()->create([
                'type' => 'production',
                'status' => 'draft',
            ]);

            foreach ($jobTicket->pesanans as $pesanan) {
                $productionQty = (int) ($pesanan->quantity ?: $pesanan->q ?: 0);

                if ($productionQty <= 0) {
                    continue;
                }

                $executableSpecs = $this->executableManufacturingSpecs($pesanan);

                foreach ($executableSpecs as $index => $spec) {
                    $run->processes()->create([
                        'pesanan_id' => $pesanan->id, // Tautkan ke pesanannya
                        'quantity' => $productionQty,
                        'pesanan_manufacturing_spec_id' => $spec->id,
                        'work_name' => $spec->work_name_snapshot,
                        'sequence' => $index + 1,
                        'status' => 'pending',
                        'qc_status' => 'pending',
                    ]);
                }

                $pesanan->workflowStatus()->updateOrCreate(

                    ['pesanan_id'=>$pesanan->id],

                    [
                        'production_started'=>true
                    ]

                );

            }
            $jobTicket->workflowHistory()->create([
                'step' => 'production',
                'action' => 'production_run_auto_created',
                'user_id' => Auth::id(),
                'notes' => "Proses mass production untuk produk ini telah disiapkan dalam batch Job Ticket.",
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

                if ($behavior) {
                    return $behavior === 'production_process';
                }

                $workName = strtolower($spec->work_name_snapshot ?? '');

                // Karena packing sekarang ada di level Global JobTicket,
                // Kita kecualikan packing dari list per-pesanan.
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