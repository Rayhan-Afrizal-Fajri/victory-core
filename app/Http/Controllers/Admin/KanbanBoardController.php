<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Pesanan;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use App\Models\User;

class KanbanBoardController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        $isAdmin = $user->can('dashboard.admin');

        $cardsQuery = Pesanan::query()
            ->with([
                'jobTicket.customer',
                'workflowStatus',
                'productionRuns.processes.qcLogs',
                'urgentMaterialIssues.purchasing.supplier'
            ])
            ->latest('id');

        if (! $isAdmin) {
            $cardsQuery->whereHas('jobTicket', function ($query) use ($user) {
                $query->where('customer_id', $user->customer?->id);
            });
        }

        $columns = $this->columns($user); // MEMANGGIL FUNCTION COLUMNS MILIK ANDA

        // 1. Eksekusi query sekali dan simpan di variabel (agar tidak query berulang)
        $pesanans = $cardsQuery->get();

        // 2. Buat list terpisah khusus untuk Urgent Issues
        $urgentIssuesList = $pesanans->filter(function ($pesanan) {
            
            // --- 1. Cek Issue Produksi (Logika Anda sudah benar) ---
            $productionIssues = collect();
            foreach($pesanan->productionRuns as $run) {
                foreach($run->processes as $process) {
                    $initialDefects = $process->qcLogs->where('qc_type', 'initial_check')->sum('defect_qty');
                    $reworkedPassed = $process->qcLogs->where('qc_type', 'rework_check')->sum('passed_qty');
                    $unresolved = max($initialDefects - $reworkedPassed, 0);
                    
                    if ($unresolved > 0) {
                        $productionIssues->push((object)[
                            'process_name' => $process->work_name,
                            'run_type' => $run->type,
                            'unresolved_qty' => $unresolved,
                            'total_defects' => $initialDefects
                        ]);
                    }
                }
            }
            $pesanan->calculated_production_issues = $productionIssues;

            // 2. Cek Issue Purchasing (Logika BARU: Hanya jika jumlah rusak > jumlah bagus)
            $unresolvedPurchasingIssues = $pesanan->purchasing->filter(function($p) {
                // Hitung total barang BAGUS yang sudah masuk
                $goodReceived = $p->materialReceivings()
                                ->whereNotIn('item_condition', ['damaged', 'expired'])
                                ->sum('received_qty');
                                
                // Hitung total barang RUSAK/EXPIRED yang masuk
                $damagedReceived = $p->materialReceivings()
                                    ->whereIn('item_condition', ['damaged', 'expired'])
                                    ->sum('received_qty');

                // SYARAT URGENT: Hanya tampil jika barang rusak LEBIH BANYAK dari barang bagus
                // Artinya: kerusakan belum "ditambal" oleh kiriman barang bagus berikutnya
                return ($damagedReceived > $goodReceived); 
            });

            $pesanan->calculated_purchasing_issues = $unresolvedPurchasingIssues;

            // Board hanya tampil jika ada issue produksi ATAU issue purchasing (kerusakan belum tertutupi)
            return $unresolvedPurchasingIssues->count() > 0 || $productionIssues->count() > 0;
            
        })->map(function ($pesanan) {
            
            // Map Data Purchasing
            $purchasingIssues = $pesanan->calculated_purchasing_issues->map(function ($p) {
                $goodReceived = $p->materialReceivings()
                                ->whereNotIn('item_condition', ['damaged', 'expired'])
                                ->sum('received_qty');
                
                $damagedReceived = $p->materialReceivings()
                                    ->whereIn('item_condition', ['damaged', 'expired'])
                                    ->sum('received_qty');

                // Gunakan + 0 atau (float) untuk membuang nol tidak penting
                $qtyRusak = (float) $damagedReceived; 
                $totalBagus = (float) $goodReceived;
                $required = (float) $p->required_qty;

                return [
                    'id' => 'pur_'.$p->id,
                    'type' => 'purchasing',
                    'title' => $p->item_bahan,
                    'subtitle' => $p->supplier->nama_perusahaan ?? '-',
                    'qty' => $qtyRusak, // Sekarang sudah bersih
                    'satuan' => $p->satuan ?? '',
                    'condition' => 'damaged_issue',
                    'date' => 'Perlu Tindakan',
                    'notes' => "Terdapat {$qtyRusak} {$p->satuan} barang cacat/expired. Total barang bagus diterima: {$totalBagus} / {$required} {$p->satuan}.",
                ];
            })->toArray();

            // Map Data Production (Tetap seperti semula)
            $productionIssues = $pesanan->calculated_production_issues->map(function ($issue, $idx) {
                return [
                    'id' => 'prod_'.$idx,
                    'type' => 'production',
                    'title' => 'Proses ' . $issue->process_name,
                    'subtitle' => 'Tahap ' . ucfirst($issue->run_type),
                    'qty' => $issue->unresolved_qty,
                    'satuan' => 'pcs',
                    'condition' => 'defect',
                    'date' => 'Menunggu Rework',
                    'notes' => "Total defect awal: {$issue->total_defects} pcs. Sisa {$issue->unresolved_qty} pcs belum lolos QC Rework.",
                ];
            })->toArray();

            return [
                'id' => $pesanan->id,
                'jobNo' => $pesanan->jobTicket?->no_job_ticket ?? '-',
                'customer' => $pesanan->jobTicket?->customer?->nama_perusahaan ?? '-',
                'product' => $pesanan->produk ?? '-',
                'showUrl' => '/job-tickets/' . ($pesanan->jobTicket?->id ?? 0) . '?tab=purchasing',
                'issues' => array_merge($purchasingIssues, $productionIssues),
            ];
        })->values()->toArray();

        $cards = $cardsQuery
            ->get()
            ->flatMap(function ($pesanan) {
                $w = $pesanan->workflowStatus;
                if (! $w) {
                    return [];
                }

                $jobTicket = $pesanan->jobTicket;
                $deadline = $pesanan->deadline ?: $jobTicket?->deadline;
                $daysLeft = $this->getDaysLeft($deadline);
                $blocker = $this->resolveBlocker($pesanan);

                $sampleProgress = $this->mapRunProgress($pesanan->productionRuns->where('type', 'sample')->first());
                $productionProgress = $this->mapRunProgress($pesanan->productionRuns->where('type', 'production')->first());
                
                // KONDISI KHUSUS DUAL CARD:
                // Invoice produksi sudah dibuat, DP belum dibayar, TAPI proses produksi/purchasing sudah dimulai
                $isInvoiceUnpaidButProductionStarted = $w->production_invoice_created 
                    && ! $w->production_dp_paid 
                    && ($w->materials_purchased || $w->production_materials_ready || $w->production_started);

                $generatedCards = [];
                $jobId = $jobTicket?->id ?? 0;

                if ($isInvoiceUnpaidButProductionStarted) {
                    // CARD 1: Tertahan di kolom "INVOICE PRODUCTION" (menunggu pelunasan)
                    $stage1 = 'invoice_production';
                    $tab1 = $this->getTabForStage($stage1);
                    $generatedCards[] = [
                        'id' => $pesanan->id, 
                        'jobNo' => ($jobTicket?->no_job_ticket ?? '-') . ' (INV)',
                        'product' => ($pesanan->produk ?? '-') . ' [Tagihan Pending]',
                        'customer' => $jobTicket?->customer?->nama_perusahaan ?? '-',
                        'qty' => (int) $pesanan->q,
                        'deadline' => $deadline,
                        'daysLeft' => $daysLeft,
                        'stage' => $stage1,
                        'stageLabel' => $this->getStageLabel($stage1),
                        'progress' => $this->calculateProgress($stage1),
                        'blocker' => 'Menunggu Pembayaran DP Produksi',
                        'sampleProgress' => $sampleProgress,
                        'productionProgress' => $productionProgress,
                        'showUrl' => '/job-tickets/' . $jobId . '?tab=' . urlencode($tab1),
                    ];

                    // CARD 2: Melaju ke Purchasing Production atau Production (mengikuti kondisi riil pabrik)
                    $stage2 = $this->resolveStage($w, true); // true = abaikan cek status DP
                    $tab2 = $this->getTabForStage($stage2);
                    $generatedCards[] = [
                        'id' => $pesanan->id,
                        'jobNo' => $jobTicket?->no_job_ticket ?? '-',
                        'product' => $pesanan->produk ?? '-',
                        'customer' => $jobTicket?->customer?->nama_perusahaan ?? '-',
                        'qty' => (int) $pesanan->q,
                        'deadline' => $deadline,
                        'daysLeft' => $daysLeft,
                        'stage' => $stage2,
                        'stageLabel' => $this->getStageLabel($stage2),
                        'progress' => $this->calculateProgress($stage2),
                        'blocker' => $blocker,
                        'sampleProgress' => $sampleProgress,
                        'productionProgress' => $productionProgress,
                        'showUrl' => '/job-tickets/' . $jobId . '?tab=' . urlencode($tab2),
                    ];
                } else {
                    // JIKA NORMAL: Hanya 1 Card
                    $stage = $this->resolveStage($w, false);
                    $tab = $this->getTabForStage($stage);
                    $generatedCards[] = [
                        'id' => $pesanan->id,
                        'jobNo' => $jobTicket?->no_job_ticket ?? '-',
                        'product' => $pesanan->produk ?? '-',
                        'customer' => $jobTicket?->customer?->nama_perusahaan ?? '-',
                        'qty' => (int) $pesanan->q,
                        'deadline' => $deadline,
                        'daysLeft' => $daysLeft,
                        'stage' => $stage,
                        'stageLabel' => $this->getStageLabel($stage),
                        'progress' => $this->calculateProgress($stage),
                        'blocker' => $blocker,
                        'sampleProgress' => $sampleProgress,
                        'productionProgress' => $productionProgress,
                        'showUrl' => '/job-tickets/' . $jobId . '?tab=' . urlencode($tab),
                    ];
                }

                return $generatedCards;
            });

        return Inertia::render('admin/kanban/Index', [
            'cards' => $cards,
            'columns' => $columns,
            'urgentIssues' => $urgentIssuesList,
        ]);
    }

    private function canAny(User $user, array $permissions): bool
    {
        foreach ($permissions as $permission) {
            if ($user->can($permission)) {
                return true;
            }
        }

        return false;
    }

    // --- ARRAY COLUMNS ASLI MILIK ANDA (TIDAK DIUBAH SAMA SEKALI) ---
    private function columns(User $user): array
    {
        $definitions = [
            [
                'permissions' => ['designs.upload'],
                'column' => [
                    'id' => 'upload_design',
                    'name' => 'UPLOAD DESIGN',
                    'bgColor' => 'bg-slate-50',
                    'borderColor' => 'border-l-slate-400',
                ],
            ],

            [
                'permissions' => [
                    'designs.approve',
                    'designs.revision',
                ],
                'column' => [
                    'id' => 'approval_design',
                    'name' => 'APPROVAL DESIGN',
                    'bgColor' => 'bg-blue-50',
                    'borderColor' => 'border-l-blue-400',
                ],
            ],

            [
                'permissions' => [
                    'boms.sync',
                    'boms.create',
                    'boms.edit',
                    'boms.delete',
                    'manufactures.create',
                    'manufactures.edit',
                    'manufactures.delete',
                ],
                'column' => [
                    'id' => 'bom',
                    'name' => 'BOM',
                    'bgColor' => 'bg-amber-50',
                    'borderColor' => 'border-l-amber-400',
                ],
            ],

            [
                'permissions' => [
                    'costings.input_price',
                ],
                'column' => [
                    'id' => 'price_approval',
                    'name' => 'APPROVAL HARGA JUAL',
                    'bgColor' => 'bg-cyan-50',
                    'borderColor' => 'border-l-cyan-400',
                ],
            ],

            [
                'permissions' => [
                    'quotation.generate',
                    'quotation.print',
                    'quotation.approve',
                ],
                'column' => [
                    'id' => 'quotation',
                    'name' => 'QUOTATION',
                    'bgColor' => 'bg-violet-50',
                    'borderColor' => 'border-l-violet-400',
                ],
            ],

            [
                'permissions' => [
                    'invoices.show',
                    'invoices.print',
                    'invoices.pay',
                    'invoices.verify',
                    'invoices.edit',
                    'invoices.delete',
                ],
                'column' => [
                    'id' => 'invoice_sample',
                    'name' => 'INVOICE SAMPLE',
                    'bgColor' => 'bg-orange-50',
                    'borderColor' => 'border-l-orange-400',
                ],
            ],

            [
                'permissions' => [
                    'purchasings.generate',
                    'purchasings.create',
                    'purchasings.edit',
                    'purchasings.mark_ordered',
                    'purchasings.receive',
                    'purchasings.delete',
                ],
                'column' => [
                    'id' => 'purchasing_sample',
                    'name' => 'PURCHASING SAMPLE',
                    'bgColor' => 'bg-emerald-50',
                    'borderColor' => 'border-l-emerald-400',
                ],
            ],

            [
                'permissions' => [
                    'samples.start',
                    'samples.complete',
                    'samples.packing',
                    'samples.delivery',
                    'samples.approve',
                    'samples.revision',
                ],
                'column' => [
                    'id' => 'sample',
                    'name' => 'SAMPLE',
                    'bgColor' => 'bg-cyan-50',
                    'borderColor' => 'border-l-cyan-500',
                ],
            ],

            [
                'permissions' => [
                    'invoices.show',
                    'invoices.print',
                    'invoices.pay',
                    'invoices.verify',
                    'invoices.edit',
                    'invoices.delete',
                ],
                'column' => [
                    'id' => 'invoice_production',
                    'name' => 'INVOICE PRODUCTION',
                    'bgColor' => 'bg-purple-50',
                    'borderColor' => 'border-l-purple-500',
                ],
            ],

            [
                'permissions' => [
                    'purchasings.generate',
                    'purchasings.create',
                    'purchasings.edit',
                    'purchasings.mark_ordered',
                    'purchasings.receive',
                    'purchasings.delete',
                ],
                'column' => [
                    'id' => 'purchasing_production',
                    'name' => 'PURCHASING PRODUCTION',
                    'bgColor' => 'bg-green-50',
                    'borderColor' => 'border-l-green-500',
                ],
            ],

            [
                'permissions' => [
                    'productions.run',
                    'productions.packing',
                    'productions.delivery',
                ],
                'column' => [
                    'id' => 'production',
                    'name' => 'PRODUCTION',
                    'bgColor' => 'bg-slate-100',
                    'borderColor' => 'border-l-slate-600',
                ],
            ],
        ];

        $columns = [];

        foreach ($definitions as $definition) {
            if ($this->canAny($user, $definition['permissions'])) {
                $columns[] = $definition['column'];
            }
        }

        // Selalu tampil
        $columns[] = [
            'id' => 'done',
            'name' => 'DONE',
            'bgColor' => 'bg-slate-100',
            'borderColor' => 'border-l-slate-600',
        ];

        $columns[] = [
            'id' => 'cancel',
            'name' => 'CANCEL',
            'bgColor' => 'bg-red-50',
            'borderColor' => 'border-l-red-500',
        ];

        return $columns;
    }

    /**
     * Resolve Stage berdasarkan ID dari columns() di atas
     */
    private function resolveStage($w, bool $skipDpCheck = false): string
    {
        // Cancel logic jika ada flagnya (bisa disesuaikan jika punya field khusus cancel)
        // if ($w->status === 'cancelled') return 'cancel';

        if (! $w->design_uploaded) return 'upload_design';
        if (! $w->design_approved) return 'approval_design';
        
        // BOM mencakup artikel dan specs
        if (! $w->article_synced || ! $w->design_specs_completed) return 'bom';
        
        if (! $w->price_approved) return 'price_approval';
        if (! $w->quotation_created || ! $w->quotation_approved) return 'quotation';
        
        if (! $w->sample_paid) return 'invoice_sample';
        if (! $w->sample_materials_ready) return 'purchasing_sample';
        
        // SAMPLE mencakup dari mulai dikerjakan sampai dikirim dan disetujui (Approved)
        if (! $w->sample_approved) return 'sample'; 
        
        // INVOICE PRODUCTION menahan card sampai DP dilunasi
        if (! $skipDpCheck && ! $w->production_dp_paid) {
            return 'invoice_production';
        }

        if (! $w->production_materials_ready) return 'purchasing_production';
        
        // PRODUCTION mencakup mulai dikerjakan, QC, Packing, Final Payment, sampai Delivery
        if ((! $w->delivered && ! $w->completed) || ($w->delivered && !$w->completed)) return 'production';

        // Jika semua tuntas, pindah ke DONE
        if ($w->completed) return 'done';

        return 'cancel';
    }

    private function getStageLabel(string $stage): string
    {
        // Label disamakan persis dengan "name" di dalam array columns()
        $labels = [
            'upload_design' => 'UPLOAD DESIGN',
            'approval_design' => 'APPROVAL DESIGN',
            'bom' => 'BOM',
            'price_approval' => 'APPROVAL HARGA JUAL',
            'quotation' => 'QUOTATION',
            'invoice_sample' => 'INVOICE SAMPLE',
            'purchasing_sample' => 'PURCHASING SAMPLE',
            'sample' => 'SAMPLE',
            'invoice_production' => 'INVOICE PRODUCTION',
            'purchasing_production' => 'PURCHASING PRODUCTION',
            'production' => 'PRODUCTION',
            'done' => 'DONE',
            'cancel' => 'CANCEL',
        ];

        return $labels[$stage] ?? '-';
    }

    /**
     * Memetakan Kanban stage ke tab yang ada di halaman detail job ticket.
     */
    private function getTabForStage(string $stage): string
    {
        return match ($stage) {
            'upload_design', 'approval_design', 'bom' => 'design',
            'price_approval', 'quotation' => 'costing & quotation', // Ganti menjadi 'costing & quotation' jika di React masih memakai nama tersebut
            'invoice_sample', 'invoice_production' => 'invoices',
            'purchasing_sample', 'purchasing_production' => 'purchasing',
            'sample' => 'sample',
            'production', 'done' => 'production',
            default => 'overview',
        };
    }

    private function calculateProgress(string $stage): int
    {
        $progressMap = [
            'upload_design' => 5,
            'approval_design' => 10,
            'bom' => 20,
            'price_approval' => 30,
            'quotation' => 40,
            'invoice_sample' => 50,
            'purchasing_sample' => 60,
            'sample' => 70,
            'invoice_production' => 80,
            'purchasing_production' => 85,
            'production' => 90,
            'done' => 100,
            'cancel' => 0,
        ];

        return $progressMap[$stage] ?? 0;
    }

    private function resolveBlocker(Pesanan $pesanan): ?string
    {
        $w = $pesanan->workflowStatus;

        if (! $w) {
            return 'Menunggu order entry diproses';
        }
        
        if (! $w->design_uploaded) {
            return 'Desain belum diupload';
        }

        if (! $w->design_approved) {
            return 'Menunggu persetujuan desain';
        }

        if (! $w->article_synced) {
            return 'Menunggu sinkronisasi artikel';
        }

        if (! $w->design_specs_completed) {
            return 'BOM artikel belum selesai';
        }

        if (!$w->price_approved) {
            return 'Harga jual belum ditentukan';
        }

        if (! $w->quotation_created) {
            return 'Quotation belum dibuat';
        }

        if (! $w->quotation_approved) {
            return 'Menunggu persetujuan quotation dari customer';
        }

        if (! $w->sample_paid) {
            return 'Menunggu pelunasan invoice sample';
        }

        if (! $w->sample_materials_ready) {
            return 'Material untuk sample belum cukup diterima';
        }

        if (! ($w->sample_materials_ready ?? false)) {
            return 'Menunggu material sample siap';
        }

        if (! ($w->sample_created ?? false)) {
            return 'Menunggu sample production';
        }

        if (! $w->sample_started) {
            return 'Sample belum dimulai';
        }

        if (! $w->sample_completed) {
            return 'Sample telah dimulai. Bukti sample belum diunggah';
        }

        if (! $w->sample_delivered) {
            return 'Sample menunggu dikirim';
        }

        if (! $w->sample_approved && ! $w->sample_revision) {
            return 'Menunggu sample approval';
        }

        if ($w->sample_revision) {
            return 'Sample direvisi';
        }

        if (! ($w->sample_approved ?? false)) {
            return 'Menunggu sample approval';
        }

        if (! ($w->production_invoice_created ?? false)) {
            return 'Menunggu invoice produksi';
        }

        /**
         * Catatan:
         * Nanti jika sudah ada payment_term / allow_production_without_dp
         * di job_tickets, blocker DP ini jangan dibuat mutlak.
         */
        // if (
        //     ($w->production_invoice_created ?? false) &&
        //     ! ($w->production_dp_paid ?? false) && 
        //     (!$w->production_materials_ready || !$w->production_started)
        // ) {
        //     return 'Menunggu DP production / approval tempo';
        // }

        if (! ($w->production_materials_ready ?? false)) {
            return 'Menunggu material produksi siap';
        }

        if (! ($w->production_started ?? false)) {
            return 'Menunggu produksi dimulai';
        }

        if (! ($w->qc_completed ?? false)) {
            return 'Menunggu QC completed';
        }

        if (! ($w->packing_completed ?? false)) {
            return 'Menunggu packing';
        }

        /**
         * Sama seperti DP, ini nanti perlu disesuaikan dengan AR / tempo.
         */
        if (
            ($w->packing_completed ?? false) &&
            ! ($w->final_payment_paid ?? false)
        ) {
            return 'Menunggu pelunasan / approval AR';
        }

        if (
            ($w->final_payment_paid ?? false) &&
            ! ($w->delivered ?? false)
        ) {
            return 'Menunggu delivery';
        }

        return null;
    }

    private function mapRunProgress($run): ?array
    {
        if (! $run) {
            return null;
        }

        $processes = $run->processes ?? collect();
        $total = $processes->count();

        $completed = $processes
            ->filter(function ($process) {
                return $process->status === 'completed'
                    && $process->qc_status === 'passed';
            })
            ->count();

        // --- TAMBAHAN: Mapping detail proses untuk memunculkan qty qc ---
        $processDetails = $processes->map(function ($process) {
            return [
                'id' => $process->id,
                'work_name' => $process->work_name, // Contoh: "Cutting", "Sewing"
                'status' => $process->status,
                'qc_status' => $process->qc_status,
                'target_qty' => (int) $process->quantity,
                'checked_qty' => (int) $process->checked_qty,
                'passed_qty' => (int) $process->passed_qty,
                'defect_qty' => (int) $process->defect_qty,
            ];
        })->values()->toArray();
        // ----------------------------------------------------------------

        return [
            'type' => $run->type,
            'status' => $run->status,
            'quantity' => (int) $run->quantity,
            'completed' => $completed,
            'total' => $total,
            'percent' => $total > 0
                ? (int) round(($completed / $total) * 100)
                : 0,
            
            // Masukkan rincian proses ke dalam response balikan
            'process_details' => $processDetails, 
        ];
    }

    private function getDaysLeft(?string $deadline): ?int
    {
        if (! $deadline) {
            return null;
        }

        return now()->startOfDay()->diffInDays(
            Carbon::parse($deadline)->startOfDay(),
            false
        );
    }
}