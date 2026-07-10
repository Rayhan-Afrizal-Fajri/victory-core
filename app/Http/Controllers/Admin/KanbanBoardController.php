<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Pesanan;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

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
                'productionRuns.processes',
            ])
            ->latest('id');

        if (! $isAdmin) {
            $cardsQuery->whereHas('jobTicket', function ($query) use ($user) {
                $query->where('customer_id', $user->customer?->id);
            });
        }

        $columns = $this->columns(); // MEMANGGIL FUNCTION COLUMNS MILIK ANDA

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
                $showUrl = route('job-tickets.show', $jobTicket?->id ?? 0);

                // KONDISI KHUSUS DUAL CARD:
                // Invoice produksi sudah dibuat, DP belum dibayar, TAPI proses produksi/purchasing sudah dimulai
                $isInvoiceUnpaidButProductionStarted = $w->production_invoice_created 
                    && ! $w->production_dp_paid 
                    && ($w->materials_purchased || $w->production_materials_ready || $w->production_started);

                $generatedCards = [];

                if ($isInvoiceUnpaidButProductionStarted) {
                    // CARD 1: Tertahan di kolom "INVOICE PRODUCTION" (menunggu pelunasan)
                    $stage1 = 'invoice_production';
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
                        'showUrl' => $showUrl,
                    ];

                    // CARD 2: Melaju ke Purchasing Production atau Production (mengikuti kondisi riil pabrik)
                    $stage2 = $this->resolveStage($w, true); // true = abaikan cek status DP
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
                        'showUrl' => $showUrl,
                    ];
                } else {
                    // JIKA NORMAL: Hanya 1 Card
                    $stage = $this->resolveStage($w, false);
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
                        'showUrl' => $showUrl,
                    ];
                }

                return $generatedCards;
            });

        return Inertia::render('admin/kanban/Index', [
            'cards' => $cards,
            'columns' => $columns,
        ]);
    }

    // --- ARRAY COLUMNS ASLI MILIK ANDA (TIDAK DIUBAH SAMA SEKALI) ---
    private function columns(): array
    {
        return [
            [
                'id' => 'upload_design',
                'name' => 'UPLOAD DESIGN',
                'bgColor' => 'bg-slate-50',
                'borderColor' => 'border-l-slate-400',
            ],
            [
                'id' => 'approval_design',
                'name' => 'APPROVAL DESIGN',
                'bgColor' => 'bg-blue-50',
                'borderColor' => 'border-l-blue-400',
            ],
            [
                'id' => 'bom',
                'name' => 'BOM',
                'bgColor' => 'bg-amber-50',
                'borderColor' => 'border-l-amber-400',
            ],
            [
                'id' => 'price_approval',
                'name' => 'APPROVAL HARGA JUAL',
                'bgColor' => 'bg-cyan-50',
                'borderColor' => 'border-l-cyan-400',
            ],
            [
                'id' => 'quotation',
                'name' => 'QUOTATION',
                'bgColor' => 'bg-violet-50',
                'borderColor' => 'border-l-violet-400',
            ],
            [
                'id' => 'invoice_sample',
                'name' => 'INVOICE SAMPLE',
                'bgColor' => 'bg-orange-50',
                'borderColor' => 'border-l-orange-400',
            ],
            [
                'id' => 'purchasing_sample',
                'name' => 'PURCHASING SAMPLE',
                'bgColor' => 'bg-emerald-50',
                'borderColor' => 'border-l-emerald-400',
            ],
            [
                'id' => 'sample',
                'name' => 'SAMPLE',
                'bgColor' => 'bg-cyan-50',
                'borderColor' => 'border-l-cyan-500',
            ],
            [
                'id' => 'invoice_production',
                'name' => 'INVOICE PRODUCTION',
                'bgColor' => 'bg-purple-50',
                'borderColor' => 'border-l-purple-500',
            ],
            [
                'id' => 'purchasing_production',
                'name' => 'PURCHASING PRODUCTION',
                'bgColor' => 'bg-green-50',
                'borderColor' => 'border-l-green-500',
            ],
            [
                'id' => 'production',
                'name' => 'PRODUCTION',
                'bgColor' => 'bg-slate-100',
                'borderColor' => 'border-l-slate-600',
            ],
            [
                'id' => 'done',
                'name' => 'DONE',
                'bgColor' => 'bg-slate-100',
                'borderColor' => 'border-l-slate-600',
            ],
            [
                'id' => 'cancel',
                'name' => 'CANCEL',
                'bgColor' => 'bg-slate-100',
                'borderColor' => 'border-l-slate-600',
            ],
        ];
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
        if (
            ($w->production_invoice_created ?? false) &&
            ! ($w->production_dp_paid ?? false)
        ) {
            return 'Menunggu DP production / approval tempo';
        }

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

        return [
            'type' => $run->type,
            'status' => $run->status,
            'quantity' => (int) $run->quantity,
            'completed' => $completed,
            'total' => $total,
            'percent' => $total > 0
                ? (int) round(($completed / $total) * 100)
                : 0,
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