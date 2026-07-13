<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\JobTicket;
use App\Models\Invoice;
use App\Models\ProductionRun;
use App\Models\ProductionRunProcess;
use App\Models\ProductionQcLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use App\Services\InvoiceService;
use App\Services\ProductionRunService;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class ProductionRunController extends Controller
{
    public function __construct(
        protected ProductionRunService $productionRunService,
        protected InvoiceService $invoiceService,
    ) {}

    public function index()
    {
        $productionProcess = ProductionRunProcess::with('productionRun.pesanan.jobTicket')->get();
    }

    public function ensureSampleRun(Request $request, string $jobTicketId)
    {
        $jobTicket = JobTicket::with(['pesanans.workflowStatus'])->findOrFail($jobTicketId);
        
        // Pengecekan keamanan: Pastikan setidaknya 1 pesanan siap bahan sample
        $ready = $jobTicket->pesanans->contains(fn($p) => $p->workflowStatus?->sample_materials_ready);
        if (!$ready) {
            abort(422, 'Material sample belum siap untuk diproduksi.');
        }

        $this->productionRunService->ensureSampleRun($jobTicket);

        return back()->with('success', 'Sample production run berhasil disiapkan.');
    }

    public function ensureProductionRun(Request $request, string $jobTicketId)
    {
        $jobTicket = JobTicket::with(['pesanans.workflowStatus'])->findOrFail($jobTicketId);

        $this->productionRunService->ensureProductionRun($jobTicket);

        return back()->with('success', 'Mass production run berhasil disiapkan.');
    }

    public function startProcess(Request $request, string $processId)
    {
        $request->validate([
            'worker_qty' => ['required', 'integer', 'min:1'],
        ]);

        $process = ProductionRunProcess::with('productionRun')
            ->findOrFail($processId);

        if ($process->status !== 'pending') {
            abort(422, 'Process tidak bisa dimulai.');
        }

        DB::transaction(function () use ($process, $request) {

            $process->update([
                'status' => 'in_progress',
                'worker_qty' => $request->worker_qty,
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

    public function updateProcess(Request $request, string $processId)
    {
        $validated = $request->validate([
            'status' => ['required', 'in:pending,in_progress,completed'],
        ]);

        $process = ProductionRunProcess::with('productionRun')->findOrFail($processId);

        $data = ['status' => $validated['status']];
        if ($validated['status'] === 'in_progress' && ! $process->started_at) {
            $data['started_at'] = now();
        } elseif ($validated['status'] === 'completed') {
            $data['completed_at'] = now();
            // Reset QC Status jika sebelumnya sudah QC tapi diulang
            if ($process->qc_status === 'pending') {
                $data['qc_status'] = 'pending';
            }
        }

        $process->update($data);
        $this->recalculateRunStatus($process->productionRun);

        return back()->with('success', 'Status proses berhasil diupdate.');
    }

    public function completeProcess(string $processId)
    {
        $process = ProductionRunProcess::with('productionRun')->findOrFail($processId);

        if ($process->status !== 'in_progress') {
            abort(422, 'Process belum berjalan.');
        }

        DB::transaction(function() use ($process) {
            $process->update([
                'status' => 'completed',
                'completed_at' => now(),
                'qc_status' => $process->qc_status ?: 'pending',
            ]);

            $this->syncRunStatus($process);
        });

        return back()->with('success', 'Process selesai. Lanjut QC.');
    }

    public function submitQc(Request $request, string $processId)
    {

        $validated = $request->validate([
            'checked_qty' => ['required', 'integer', 'min:1'],
            'passed_qty' => ['required', 'integer', 'min:0'],
            'defect_qty' => ['required', 'integer', 'min:0'],
            'qc_notes' => ['nullable', 'string'],

            // Tambahkan validasi qc_type dari frontend (jika ada form bypass/rework)
            'qc_type' => ['nullable', Rule::in(['initial_check', 'rework_check'])],

            'defect_reason' => [
                Rule::requiredIf(fn () => (int) $request->defect_qty > 0),
                'nullable',
                'string',
            ],

            'corrective_action' => [
                Rule::requiredIf(fn () => (int) $request->defect_qty > 0),
                'nullable',
                'string',
            ],
        ]);

        if (($validated['passed_qty'] + $validated['defect_qty']) !== $validated['checked_qty']) {
            abort(422, 'Total passed + defect harus sama dengan checked qty.');
        }

        $process = ProductionRunProcess::with('productionRun.pesanan.jobTicket')->findOrFail($processId);

        DB::transaction(function () use ($process, $validated) {
            ProductionQcLog::create([
                'production_run_process_id' => $process->id,
                'checked_qty' => $validated['checked_qty'],
                'passed_qty' => $validated['passed_qty'],
                'defect_qty' => $validated['defect_qty'],
                'defect_reason' => $validated['defect_reason'],
                'corrective_action' => $validated['corrective_action'],
                'qc_type' => $validated['qc_type'] ?? 'initial_check',
                'checked_by' => Auth::id(),
            ]);

            // 2. RUMUS KUMULATIF
            // Total Checked = HANYA hitung log yang bertipe 'initial_check'
            // (Jadi kalau awal cek 55, totalChecked tetap 55, meskipun ada log rework setelahnya)
            $totalChecked = $process->qcLogs()->where('qc_type', 'initial_check')->sum('checked_qty');
            
            // Total Passed = Hitung SEMUA barang yang lulus (baik dari initial maupun rework)
            // (Awal lulus 50, Rework lulus 5. Total Passed = 55)
            $totalPassed = $process->qcLogs()->sum('passed_qty');
            
            // Total Defect Saat Ini = Total Awal yang diperiksa - Total yang akhirnya lulus
            // (55 - 55 = 0 Defect!)
            $totalDefect = $totalChecked - $totalPassed;

            // 3. Tentukan Status QC berdasarkan TOTAL (Bukan per request lagi)
            $qcStatus = 'passed';
            $targetQty = $process->quantity;

            if ($totalPassed >= $targetQty) {

                $qcStatus = 'passed';

            } elseif ($totalDefect > 0) {

                $qcStatus = 'conditionally_passed';

            } else {

                // semua yang masuk sudah lolos,
                // tetapi jumlahnya belum mencapai target produksi
                $qcStatus = 'pending';
            }

            $process->update([
                'checked_qty' => $totalChecked,
                'passed_qty' => $totalPassed,
                'defect_qty' => $totalDefect,
                'qc_status' => $qcStatus,
                'qc_notes' => $validated['qc_notes'],
                'corrective_action' => $validated['corrective_action'] ?? null,
                'qc_checked_at' => now(),
                'qc_checked_by' => Auth::id(),
            ]);

            $this->recalculateRunStatus($process->productionRun);
        });

        return back()->with('success', 'QC berhasil disubmit.');
    }

    public function packRun(Request $request, string $runId)
    {
        $validated = $request->validate([
            'packing_notes' => ['nullable', 'string'],
        ]);

        $run = ProductionRun::findOrFail($runId);

        $run->update([
            'status' => 'packed',
            'packing_completed' => true,
            'packed_at' => now(),
            'packing_notes' => $validated['packing_notes'],
        ]);

        return back()->with('success', 'Packing berhasil diselesaikan.');
    }

    public function deliverRun(Request $request, string $runId)
    {
        $validated = $request->validate([
            'courier_name' => ['required', 'string'],
            'tracking_url' => ['nullable', 'string'],
            'delivery_note' => ['nullable', 'string'],
        ]);

        $run = ProductionRun::with('jobTicket.pesanans.workflowStatus')->findOrFail($runId);

        DB::transaction(function () use ($run, $validated) {
            $run->update([
                'status' => 'shipped',
                'courier_name' => $validated['courier_name'],
                'tracking_url' => $validated['tracking_url'],
                'delivery_note' => $validated['delivery_note'],
            ]);

            // Update status workflow di setiap pesanan
            foreach ($run->jobTicket->pesanans as $pesanan) {
                if ($run->type === 'sample') {
                    $pesanan->workflowStatus()->updateOrCreate(
                        ['pesanan_id' => $pesanan->id],
                        ['sample_delivered' => true]
                    );
                } else {
                    $pesanan->workflowStatus()->updateOrCreate(
                        ['pesanan_id' => $pesanan->id],
                        ['production_delivered' => true]
                    );
                }
            }
        });

        return back()->with('success', 'Informasi pengiriman berhasil disimpan.');
    }

    public function approveSample(Request $request, string $runId)
    {
        $validated = $request->validate([
            'customer_review_note' => ['nullable', 'string'],
        ]);


        $run = ProductionRun::with('pesanan.workflowStatus')->findOrFail($runId);

        DB::transaction(function () use ($run, $validated) {
            $run->update([
                'status' => 'approved',
                'approved_at' => now(),
                'customer_review_note' => $validated['customer_review_note'] ?? null,
            ]);

            $pesanan = $run->pesanan;

            $pesanan->workflowStatus()->updateOrCreate(
                ['pesanan_id' => $pesanan->id],
                ['sample_approved' => true]
            );

            $pesanan->jobTicket->workflowHistory()->create([
                'step' => 'sample',
                'action' => 'sample_approved',
                'user_id' => Auth::id(),
                'notes' => "Customer menyetujui sample global dengan catatan {$validated['customer_review_note']}.",
            ]);
            
            $this->invoiceService
                ->ensureProductionInvoice(
                    $run->pesanan->jobTicket
                );

            $this->productionRunService
                ->ensureProductionRun(
                    $run->pesanan
                );
        });

        return back()->with('success', 'Sample berhasil disetujui.');
    }

    private function recalculateRunStatus(ProductionRun $run)
    {
        $run->loadMissing('processes');
        $pesanan = $run->pesanan;

        if ($run->processes->isEmpty()) {
            return;
        }

        // 1. Cek apakah tim produksi sudah "Selesai" mengerjakan tugasnya
        $allWorkersCompleted = $run->processes->every(fn($p) => $p->status === 'completed');
        
        // 2. Cek apakah QC sudah dinyatakan "Lulus" ATAU "Lulus Bersyarat"
        // $allQcPassedFlags = $run->processes->every(fn($p) => in_array($p->qc_status, ['passed', 'conditionally_passed']));

        $allQcFinished = $run->processes->every(function ($p) {
            return $p->passed_qty >= $p->quantity;
        });
        
        // 3. LOGIKA BARU: Cek apakah SEMUA barang sudah di-QC 100%
        // (Checked Qty harus sama atau lebih besar dari Target Quantity)
        $allFullyQcChecked = $run->processes->every(fn($p) => $p->checked_qty >= $p->quantity);

        // KONDISI A: Produksi Selesai & QC 100% Selesai
        if ($allWorkersCompleted && $allQcFinished) {
            $run->update([
                'status' => 'qc_completed',
                'completed_at' => $run->completed_at ?? now(),
            ]);
            
            // Update workflow global jika ini mass production
            if ($run->type === 'production') {
                $pesanan->workflowStatus()->updateOrCreate(
                    ['pesanan_id' => $pesanan->id],
                    [
                        'production_completed' => true,
                        'qc_completed' => true,
                    ]
                );
            }
            return;
        }

        // KONDISI B: Masih ada proses yang sedang dikerjakan
        $hasInProgress = $run->processes->contains(fn($p) => $p->status === 'in_progress');
        if ($hasInProgress) {
            $run->update([
                'status' => 'in_progress', 
                'started_at' => $run->started_at ?? now()
            ]);
            return;
        }

        // KONDISI C: Tukang jahit/potong sudah selesai, tapi QC belum 100% beres (parsial)
        if ($allWorkersCompleted && !$allQcFinished) {
            $run->update(['status' => 'waiting_qc']);
        }
    }

    public function completePacking(Request $request, string $runId)
    {
        $validated = $request->validate([
            'packing_notes' => ['nullable', 'string'],
        ]);

        $run = ProductionRun::with('processes', 'pesanan.workflowStatus', 'pesanan.jobTicket.workflowHistory')->findOrFail($runId);

        if (! $this->allProcessesQcPassed($run)) {
            abort(422, 'Semua process harus QC passed sebelum packing.');
        }

        DB::transaction(function () use ($run, $validated) {
            $run->update([
                'packing_completed' => true,
                'packing_notes' => $validated['packing_notes'] ?? null,
            ]);

            $pesanan = $run->pesanan;

            if ($run->type === 'production') {
                $pesanan->workflowStatus()->updateOrCreate(
                    ['pesanan_id' => $pesanan->id],
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
            'courier_name'    => ['nullable', 'string'],
            'tracking_number' => ['nullable', 'string'],
            'tracking_url'    => ['nullable', 'string'],
            'delivery_note'   => ['nullable', 'string'],
        ]);

        $run = ProductionRun::with([
            'pesanan.workflowStatus',
            'pesanan.jobTicket.workflowHistory',
        ])->findOrFail($runId);

        if (! $run->packing_completed) {
            abort(422, 'Packing belum selesai.');
        }

        DB::transaction(function () use ($run, $validated) {

            $run->update([
                'status' => 'in_delivery',
                'courier_name' => $validated['courier_name'] ?? null,
                'tracking_number' => $validated['tracking_number'] ?? null,
                'tracking_url' => $validated['tracking_url'] ?? null,
                'delivery_note' => $validated['delivery_note'] ?? null,
            ]);

            $pesanan = $run->pesanan;

            if ($run->type === 'sample') {

                $pesanan->workflowStatus()->updateOrCreate(
                    ['pesanan_id' => $pesanan->id],
                    [
                        'sample_in_delivery' => true,
                    ]
                );

            } else {

                $pesanan->workflowStatus()->updateOrCreate(
                    ['pesanan_id' => $pesanan->id],
                    [
                        'in_delivery' => true,
                    ]
                );

            }

            $run->pesanan->jobTicket->workflowHistory()->create([
                'step' => $run->type,
                'action' => 'delivery_started',
                'user_id' => Auth::id(),
                'notes' => $run->type === 'sample'
                    ? 'Sample mulai dikirim ke customer.'
                    : 'Produk mulai dikirim ke customer.',
            ]);

        });

        return back()->with(
            'success',
            $run->type === 'sample'
                ? 'Delivery sample berhasil disimpan.'
                : 'Delivery production berhasil disimpan.'
        );
    }

    public function markDelivered(string $runId)
    {
        $run = ProductionRun::with([
            'pesanan.jobTicket.workflowHistory',
            'pesanan.workflowStatus',
        ])->findOrFail($runId);

        if ($run->status !== 'in_delivery') {
            abort(422, 'Run belum dalam proses delivery.');
        }

        DB::transaction(function () use ($run) {

            $run->update([
                'status' => 'delivered',
                'delivered_at' => now(),
            ]);

            $pesanan = $run->pesanan;

            $workflowStatus = $pesanan->workflowStatus();

            if ($run->type === 'sample') {

                $workflowStatus->updateOrCreate(
                    [
                        'pesanan_id' => $pesanan->id,
                    ],
                    [
                        'sample_delivered' => true,
                    ]
                );

            } else {

                $isFinalPaid = (bool) optional($pesanan->workflowStatus)->final_payment_paid;

                $workflowStatus->updateOrCreate(
                    [
                        'pesanan_id' => $pesanan->id,
                    ],
                    [
                        'delivered' => true,
                        'completed' => $isFinalPaid,
                    ]
                );
            }

            $pesanan->jobTicket->workflowHistory()->create([
                'step' => $run->type,
                'action' => 'delivered',
                'user_id' => Auth::id(),
                'notes' => $run->type === 'sample'
                    ? 'Sample telah dikirim ke customer.'
                    : 'Produk telah dikirim ke customer.',
            ]);
        });

        return back()->with(
            'success',
            $run->type === 'sample'
                ? 'Sample berhasil ditandai delivered.'
                : 'Produk berhasil ditandai delivered.'
        );
    }

    private function generateProductionInvoiceIfNotExists(JobTicket $jobTicket): void
    {
        // Cek apakah invoice produksi (DP/Pelunasan) sudah dibuat sebelumnya untuk JobTicket ini
        $exists = $jobTicket->invoices()
            ->whereIn('kategori_invoice', ['dp_produksi', 'production'])
            ->whereNotIn('status_tagihan', ['cancelled', 'Cancelled'])
            ->exists();

        if ($exists) {
            return;
        }

        // Ambil nominal grand total dari quotation yang disetujui (jika ada)
        $approvedQuotation = $jobTicket->quotations()->where('status', 'approved')->first();
        $grandTotal = 0;

        if ($approvedQuotation) {
            $grandTotal = (float) $approvedQuotation->grand_total;
        } else {
            // Fallback kalkulasi manual dari pesanan
            foreach ($jobTicket->pesanans as $pesanan) {
                $price = (float) ($pesanan->harga_jual_per_pcs ?? $pesanan->price_per_piece ?? 0);
                $qty = (int) ($pesanan->quantity ?: $pesanan->q ?: 0);
                $grandTotal += ($price * $qty);
            }
        }

        // Contoh: DP yang ditagihkan adalah 50%
        $dpAmount = $grandTotal * 0.5;

        // Create the invoice
        $jobTicket->invoices()->create([
            'no_invoice' => $this->generateInvoiceNumber('PROD'),
            'kategori_invoice' => 'produksi',
            'total_tagihan' => $grandTotal,
            'status_tagihan' => 'unpaid',
            'tgl_jatuh_tempo' => now()->addDays(7)->toDateString(),
        ]);

        // Update workflow_status untuk setiap pesanan bahwa invoice produksi telah dibuat
        foreach ($jobTicket->pesanans as $pesanan) {
            $pesanan->workflowStatus()->updateOrCreate(
                ['pesanan_id' => $pesanan->id],
                [
                    'production_invoice_created' => true,
                    'production_dp_paid' => false, // Menunggu pembayaran
                ]
            );
        }
    }

    private function generateInvoiceNumber(string $prefix): string
    {
        $numberPrefix = $prefix . '/' . date('Y/m');
        $last = Invoice::query()->where('no_invoice', 'like', $numberPrefix . '/%')->latest('id')->first();
        $nextNumber = 1;
        
        if ($last) {
            $parts = explode('/', $last->no_invoice);
            $nextNumber = ((int) end($parts)) + 1;
        }
        
        return $numberPrefix . '/' . str_pad($nextNumber, 4, '0', STR_PAD_LEFT);
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

    public function boardIndex()
    {
        // 1. WORKER TASKS (Internal Only, Status pending/in_progress)
        $workerTasks = ProductionRunProcess::query()
            ->with([
                'productionRun.pesanan.jobTicket.customer',
                'pesananManufacturingSpec',
            ])
            ->whereIn('status', ['pending', 'in_progress'])
            ->whereHas('pesananManufacturingSpec', function ($q) {
                $q->whereNull('vendor_id'); // Hanya internal
            })
            // --- LOGIKA FILTER BARU ---
            ->whereHas('productionRun', function ($runQuery) {
                $runQuery->where(function ($q) {
                    // Tampilkan jika ini adalah proses pembuatan Sample
                    $q->where('type', 'sample');
                })->orWhere(function ($q) {
                    // ATAU tampilkan jika ini Produksi Massal, TAPI syaratnya sample_approved = true
                    $q->where('type', 'production')
                      ->whereHas('pesanan.workflowStatus', function ($wf) {
                          $wf->where('sample_approved', true);
                      });
                });
            })
            ->get()
            ->sortBy(function ($process) {
                $deadline = $process->productionRun->pesanan->jobTicket->deadline ?? '9999-12-31';
                $sequence = str_pad($process->sequence, 3, '0', STR_PAD_LEFT);
                return $deadline . '-' . $sequence;
            })
            ->values();

        // 2. QC TASKS (Semua proses yang butuh QC)
        $qcTasks = ProductionRunProcess::query()
            ->with([
                'productionRun.pesanan.jobTicket.customer',
                'pesananManufacturingSpec.vendor',
            ])
            ->where('status', 'completed')
            ->where('qc_status', 'pending')
            // --- LOGIKA FILTER BARU ---
            ->whereHas('productionRun', function ($runQuery) {
                $runQuery->where(function ($q) {
                    $q->where('type', 'sample');
                })->orWhere(function ($q) {
                    $q->where('type', 'production')
                      ->whereHas('pesanan.workflowStatus', function ($wf) {
                          $wf->where('sample_approved', true);
                      });
                });
            })
            ->orderByDesc('completed_at')
            ->get();

        return Inertia::render('admin/production-runs/Board', [
            'workerTasks' => $workerTasks,
            'qcTasks' => $qcTasks,
        ]);
    }

    private function syncRunStatus(ProductionRunProcess $process): void
    {
        $process->load('productionRun.pesanan.workflowStatus');

        $run = $process->productionRun;
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