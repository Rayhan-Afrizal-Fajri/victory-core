<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Pesanan;
use App\Models\ProductionRun;
use App\Models\ProductionRunProcess;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use App\Services\InvoiceService;
use App\Services\ProductionRunService;

class ProductionRunController extends Controller
{
    public function __construct(
        protected ProductionRunService $productionRunService,
        protected InvoiceService $invoiceService,
    ) {}

    public function ensureSampleRun(Request $request, string $pesananId)
    {
        $validated = $request->validate([
            'quantity' => ['required', 'integer', 'min:1'],
        ]);

        $pesanan = Pesanan::with([
            'workflowStatus',
            'manufacturingSpecs',
        ])->findOrFail($pesananId);

        if (! $pesanan->workflowStatus?->materials_received) {
            abort(422, 'Material belum diterima semua.');
        }

        $this->productionRunService->ensureSampleRun(
            pesanan: $pesanan,
            quantity: (int) $validated['quantity']
        );

        return back()->with('success', 'Sample production berhasil disiapkan.');
    }

    public function ensureProductionRun(Request $request, string $pesananId)
    {
        $pesanan = Pesanan::with([
            'workflowStatus',
            'manufacturingSpecs',
        ])->findOrFail($pesananId);

        if (! $pesanan->workflowStatus?->production_dp_paid) {
            abort(422, 'DP produksi belum terpenuhi.');
        }

        $this->productionRunService->ensureProductionRun($pesanan);

        return back()->with('success', 'Production run berhasil disiapkan.');
    }

    public function startProcess(string $processId)
    {
        $process = ProductionRunProcess::with('productionRun.pesanan')->findOrFail($processId);

        if ($process->status !== 'pending') {
            abort(422, 'Process tidak bisa dimulai.');
        }

        DB::transaction(function() use ($process) {
            $process->update([
                'status' => 'in_progress',
                'started_at' => now(),
            ]);

            $run = $process->productionRun;

            $run->update([
                'status' => 'in_progress',
                'started_at' => $run->started_at ?: now(),
            ]);

            if ($run->type === 'production') {
                $run->pesanan->workflowStatus()->updateOrCreate(
                    ['pesanan_id' => $run->pesanan->id],
                    [
                        'production_started' => true,
                    ]
                );
            }

            if ($run->type === 'sample') {
                $run->pesanan->workflowStatus()->updateOrCreate(
                    ['pesanan_id' => $run->pesanan->id],
                    [
                        'sample_created' => true,
                    ]
                );
            }
        });

        return back()->with('success', 'Process dimulai.');
    }

    public function completeProcess(string $processId)
    {
        $process = ProductionRunProcess::with('productionRun')->findOrFail($processId);

        if ($process->status !== 'in_progress') {
            abort(422, 'Process belum berjalan.');
        }

        $process->update([
            'status' => 'completed',
            'completed_at' => now(),
            'qc_status' => 'pending',
        ]);

        $this->syncRunStatus($process->productionRun);

        return back()->with('success', 'Process selesai. Lanjut QC.');
    }

    public function submitQc(Request $request, string $processId)
    {
        $validated = $request->validate([
            'checked_qty' => ['required', 'integer', 'min:0'],
            'passed_qty' => ['required', 'integer', 'min:0'],
            'defect_qty' => ['required', 'integer', 'min:0'],
            'qc_notes' => ['nullable', 'string'],
            'corrective_action' => ['nullable', 'string'],
        ]);

        $process = ProductionRunProcess::with('productionRun')->findOrFail($processId);

        if ($process->status !== 'completed') {
            abort(422, 'Process harus selesai sebelum QC.');
        }

        $qcStatus = (int) $validated['defect_qty'] > 0 ? 'failed' : 'passed';

        $process->update([
            'checked_qty' => $validated['checked_qty'],
            'passed_qty' => $validated['passed_qty'],
            'defect_qty' => $validated['defect_qty'],
            'qc_status' => $qcStatus,
            'qc_notes' => $validated['qc_notes'] ?? null,
            'corrective_action' => $validated['corrective_action'] ?? null,
        ]);

        $this->syncRunStatus($process->productionRun);

        return back()->with('success', 'QC berhasil disimpan.');
    }

    public function completePacking(Request $request, string $runId)
    {
        $validated = $request->validate([
            'packing_notes' => ['nullable', 'string'],
        ]);

        $run = ProductionRun::with('processes', 'pesanan.workflowStatus')->findOrFail($runId);

        if (! $this->allProcessesQcPassed($run)) {
            abort(422, 'Semua process harus QC passed sebelum packing.');
        }

        DB::transaction(function () use ($run, $validated) {
            $run->update([
                'packing_completed' => true,
                'packing_notes' => $validated['packing_notes'] ?? null,
            ]);

            if ($run->type === 'production') {
                $run->pesanan->workflowStatus()->updateOrCreate(
                    ['pesanan_id' => $run->pesanan->id],
                    [
                        'packing_completed' => true,
                    ]
                );
            }
        });

        return back()->with('success', 'Packing sample selesai.');
    }

    public function submitDelivery(Request $request, string $runId)
    {
        $validated = $request->validate([
            'courier_name' => ['nullable', 'string'],
            'tracking_number' => ['nullable', 'string'],
            'tracking_url' => ['nullable', 'string'],
            'delivery_note' => ['nullable', 'string'],
        ]);

        $run = ProductionRun::findOrFail($runId);

        if (! $run->packing_completed) {
            abort(422, 'Packing belum selesai.');
        }

        $run->update([
            'status' => 'in_delivery',
            'courier_name' => $validated['courier_name'] ?? null,
            'tracking_number' => $validated['tracking_number'] ?? null,
            'tracking_url' => $validated['tracking_url'] ?? null,
            'delivery_note' => $validated['delivery_note'] ?? null,
        ]);

        return back()->with('success', 'Delivery sample disimpan.');
    }

    public function markDelivered(string $runId)
    {
        $run = ProductionRun::findOrFail($runId);

        if ($run->status !== 'in_delivery') {
            abort(422, 'Sample belum dalam proses delivery.');
        }

        DB::transaction(function() use ($run) {
            $run->update([
                'status' => 'delivered',
                'delivered_at' => now(),
            ]);

            $pesanan = $run->pesanan;
            $workflow = $pesanan->workflowStatus;

            if ($run->type === 'sample') {
                $workflow->updateOrCreate(
                    ['pesanan_id' => $pesanan->id],
                    [
                        'sample_delivered' => true,
                    ]
                );
            } elseif ($run->type === 'production') {
                $isFinalPaid = (bool) ($workflow?->final_payment_paid ?? false);

                $workflow->updateOrCreate(
                    ['pesanan_id' => $pesanan->id],
                    [
                        'delivered' => true,
                        'completed' => $isFinalPaid, // Mark as completed if final payment sudah dibayar
                    ]
                );
            }
        });

        return back()->with('success', 'Sample ditandai delivered.');
    }

    private function generateProductionInvoiceIfNotExists(Pesanan $pesanan): void
    {
        $exists = $pesanan->invoices()
            ->where('kategori_invoice', 'production')
            ->whereNotIn('status_tagihan', ['cancelled', 'Cancelled'])
            ->exists();

        if ($exists) {
            return;
        }

        $quotation = $pesanan->quotations()
            ->where('status', 'approved')
            ->latest()
            ->first();

        $quantity = (int) ($pesanan->quantity ?: $pesanan->q ?: 0);
        $pricePerPcs = (float) ($pesanan->harga_jual_per_pcs ?: 0);

        if ($quotation) {
            $total = (float) $quotation->grand_total;
        } else {
            if ($quantity <= 0 || $pricePerPcs <= 0) {
                abort(422, 'Quantity atau harga jual final belum valid untuk membuat invoice produksi.');
            }

            $total = $quantity * $pricePerPcs;
        }

        $pesanan->invoices()->create([
            'no_invoice' => $this->invoiceService->generate('PROD'),
            'kategori_invoice' => 'production',
            'title' => 'Invoice Production - ' . ($pesanan->requested_product_name ?: $pesanan->produk),
            'total_tagihan' => $total,
            'status_tagihan' => 'unpaid',
            'tgl_jatuh_tempo' => now()->addDays(30)->toDateString(),
        ]);

        $pesanan->workflowStatus()->updateOrCreate(
            ['pesanan_id' => $pesanan->id],
            [
                'production_invoice_created' => true,
                'production_dp_paid' => false,
                'final_payment_paid' => false,
            ]
        );

        $pesanan->workflowHistory()->create([
            'step' => 'production_invoice',
            'action' => 'auto_generated',
            'user_id' => Auth::id(),
            'notes' => $quotation
                ? 'Invoice produksi otomatis dibuat berdasarkan approved quotation.'
                : 'Invoice produksi otomatis dibuat setelah sample disetujui.',
        ]);
    }

    public function approveSample(string $runId)
    {
        $run = ProductionRun::with('pesanan.workflowStatus')->findOrFail($runId);

        if ($run->type !== 'sample') {
            abort(422, 'Run ini bukan sample.');
        }

        if ($run->status !== 'delivered') {
            abort(422, 'Sample harus delivered sebelum approval.');
        }

        DB::transaction(function () use ($run) {
            $run->update([
                'status' => 'approved',
                'approved_at' => now(),
            ]);

            $pesanan = $run->pesanan;

            $pesanan->workflowStatus()->updateOrCreate(
                ['pesanan_id' => $pesanan->id],
                [
                    'sample_approved' => true,
                ]
            );

            $pesanan->workflowHistory()->create([
                'step' => 'sample',
                'action' => 'approved',
                'user_id' => Auth::id(),
                'notes' => 'Sample disetujui customer.',
            ]);

            $this->generateProductionInvoiceIfNotExists($pesanan);
        });

        return back()->with('success', 'Sample disetujui.');
    }

    public function requestSampleRevision(Request $request, string $runId)
    {
        $validated = $request->validate([
            'customer_review_note' => ['required', 'string'],
        ]);

        $run = ProductionRun::findOrFail($runId);

        if ($run->status !== 'delivered') {
            abort(422, 'Sample harus delivered sebelum revisi.');
        }

        $run->update([
            'status' => 'revision_needed',
            'customer_review_note' => $validated['customer_review_note'],
        ]);

        return back()->with('success', 'Revisi sample berhasil diminta.');
    }

    public function rejectSample(Request $request, string $runId)
    {
        $validated = $request->validate([
            'customer_review_note' => ['required', 'string'],
        ]);

        $run = ProductionRun::findOrFail($runId);

        if ($run->status !== 'delivered') {
            abort(422, 'Sample harus delivered sebelum ditolak.');
        }

        $run->update([
            'status' => 'rejected',
            'customer_review_note' => $validated['customer_review_note'],
        ]);

        return back()->with('success', 'Sample ditolak.');
    }

    private function syncRunStatus(ProductionRun $run): void
    {
        $run->load('processes', 'pesanan.workflowStatus');

        $pesanan = $run->pesanan;

        if ($this->allProcessesQcPassed($run)) {
            DB::transaction(function () use ($run, $pesanan) {
                $run->update([
                    'status' => 'qc_completed',
                    'completed_at' => now(),
                ]);

                if ($run->type === 'sample') {
                    $pesanan->workflowStatus()->updateOrCreate(
                        ['pesanan_id' => $pesanan->id],
                        [
                            'sample_approved' => true,
                            'sample_created' => true,
                        ]
                    );
                } elseif ($run->type === 'production') {
                    $pesanan->workflowStatus()->updateOrCreate(
                        ['pesanan_id' => $pesanan->id],
                        [
                            'production_completed' => true,
                            'qc_completed' => true,
                        ]
                    );
                }
            });

            return;
        }

        $hasInProgressProcess = $run->processes->contains(fn ($process) => $process->status === 'in_progress');

        if ($hasInProgressProcess) {
            $run->update([
                'status' => 'in_progress',
            ]);

            return;
        }

        $hasCompletedProcess = $run->processes->contains(fn ($process) => $process->status === 'completed');

        if ($hasCompletedProcess) {
            $run->update([
                'status' => 'waiting_qc',
            ]);
        }
    }

    private function allProcessesQcPassed(ProductionRun $run): bool
    {
        $run->loadMissing('processes');

        if ($run->processes->isEmpty()) {
            return false;
        }

        return $run->processes->every(function ($process) {
            return $process->qc_status === 'passed' && $process->status === 'completed';
        });
    }
}