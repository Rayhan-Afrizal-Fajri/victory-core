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

        /**
         * Kanban tetap per Pesanan/Artikel,
         * karena workflowStatus, design, sample, production run itu level artikel.
         */
        $cardsQuery = Pesanan::query()
            ->with([
                'jobTicket.customer',
                'workflowStatus',
                'productionRunProcesses.productionRun',
            ])
            ->latest('id');

        if (! $isAdmin) {
            $cardsQuery->whereHas('jobTicket', function ($query) use ($user) {
                $query->where('customer_id', $user->customer?->id);
            });
        }

        $cards = $cardsQuery
            ->get()
            ->map(function ($pesanan) {
                $workflow = $pesanan->workflowStatus;
                $jobTicket = $pesanan->jobTicket;

                $deadline = $pesanan->deadline ?: $jobTicket?->deadline;

                $stage = $this->resolveStage($workflow);
                $progress = $this->calculateProgress($workflow);
                $blocker = $this->resolveBlocker($pesanan);

                return [
                    /**
                     * id card = id pesanan/artikel
                     */
                    'id' => $pesanan->id,
                    'pesananId' => $pesanan->id,
                    'jobTicketId' => $jobTicket?->id,

                    'jobNo' => $jobTicket?->no_job_ticket ?? '-',

                    /**
                     * product = nama artikel di dalam job ticket.
                     */
                    'product' => $pesanan->produk
                        ?: $pesanan->requested_product_name
                        ?: '-',

                    'customer' => $jobTicket?->customer?->nama_perusahaan
                        ?? $jobTicket?->customer?->nama
                        ?? $jobTicket?->customer_perusahaan_snapshot
                        ?? $jobTicket?->customer_nama_snapshot
                        ?? '-',

                    'qty' => (int) ($pesanan->q ?? 0),
                    'sampleQty' => (int) ($pesanan->sample_qty ?: $pesanan->qs ?: 0),

                    'deadline' => $deadline,
                    'daysLeft' => $this->getDaysLeft($deadline),

                    'stage' => $stage,
                    'stageLabel' => $this->getStageLabel($stage),
                    'progress' => $progress,
                    'blocker' => $blocker,

                    // 'sampleProgress' => $this->mapRunProgress($pesanan->productionRunProcesses->productionRun),
                    // 'productionProgress' => $this->mapRunProgress($pesanan->productionRunProcesses->productionRun),

                    /**
                     * Untuk sekarang card tetap buka detail Job Ticket.
                     * Nanti di frontend bisa auto-highlight artikel ini berdasarkan pesananId.
                     */
                    'showUrl' => $jobTicket
                        ? route('job-tickets.show', $jobTicket->id)
                        : '#',
                ];
            })
            ->values();

        // dd($cards);

        return Inertia::render('admin/kanban/Index', [
            'cards' => $cards,
            'columns' => $this->columns(),
        ]);
    }

    private function columns(): array
    {
        return [
            [
                'id' => 'order_entry',
                'name' => 'ORDER ENTRY',
                'bgColor' => 'bg-slate-50',
                'borderColor' => 'border-l-slate-400',
            ],
            [
                'id' => 'design',
                'name' => 'DESIGN',
                'bgColor' => 'bg-blue-50',
                'borderColor' => 'border-l-blue-400',
            ],
            [
                'id' => 'quotation',
                'name' => 'QUOTATION',
                'bgColor' => 'bg-amber-50',
                'borderColor' => 'border-l-amber-400',
            ],
            [
                'id' => 'sample_payment',
                'name' => 'SAMPLE PAYMENT',
                'bgColor' => 'bg-cyan-50',
                'borderColor' => 'border-l-cyan-400',
            ],
            [
                'id' => 'purchasing',
                'name' => 'PURCHASING',
                'bgColor' => 'bg-violet-50',
                'borderColor' => 'border-l-violet-400',
            ],
            [
                'id' => 'sample_production',
                'name' => 'SAMPLE PRODUCTION',
                'bgColor' => 'bg-orange-50',
                'borderColor' => 'border-l-orange-400',
            ],
            [
                'id' => 'sample_approval',
                'name' => 'SAMPLE APPROVAL',
                'bgColor' => 'bg-emerald-50',
                'borderColor' => 'border-l-emerald-400',
            ],
            [
                'id' => 'production_payment',
                'name' => 'PRODUCTION PAYMENT',
                'bgColor' => 'bg-cyan-50',
                'borderColor' => 'border-l-cyan-500',
            ],
            [
                'id' => 'production',
                'name' => 'PRODUCTION',
                'bgColor' => 'bg-green-50',
                'borderColor' => 'border-l-green-500',
            ],
            [
                'id' => 'packing_delivery',
                'name' => 'PACKING / DELIVERY',
                'bgColor' => 'bg-purple-50',
                'borderColor' => 'border-l-purple-500',
            ],
            [
                'id' => 'done',
                'name' => 'DONE',
                'bgColor' => 'bg-slate-100',
                'borderColor' => 'border-l-slate-600',
            ],
        ];
    }

    private function resolveStage($workflow): string
    {
        if (! $workflow) {
            return 'order_entry';
        }

        if ($workflow->completed) {
            return 'done';
        }

        if ($workflow->delivered || $workflow->packing_completed) {
            return 'packing_delivery';
        }

        if (
            $workflow->production_started ||
            $workflow->production_completed ||
            $workflow->qc_completed
        ) {
            return 'production';
        }

        if (
            $workflow->production_invoice_created ||
            $workflow->production_dp_paid ||
            $workflow->final_payment_paid
        ) {
            return 'production_payment';
        }

        if ($workflow->sample_approved) {
            return 'sample_approval';
        }

        if ($workflow->sample_created || $workflow->sample_delivered) {
            return 'sample_production';
        }

        if (
            $workflow->materials_purchased ||
            $workflow->materials_received ||
            $workflow->sample_materials_ready ||
            $workflow->production_materials_ready
        ) {
            return 'purchasing';
        }

        if ($workflow->sample_paid) {
            return 'sample_payment';
        }

        if ($workflow->quotation_approved || $workflow->quotation_created) {
            return 'quotation';
        }

        if (
            $workflow->design_uploaded ||
            $workflow->design_approved ||
            $workflow->article_synced ||
            $workflow->design_specs_completed
        ) {
            return 'design';
        }

        return 'order_entry';
    }

    private function getStageLabel(string $stage): string
    {
        return match ($stage) {
            'order_entry' => 'Order Entry',
            'design' => 'Design',
            'quotation' => 'Quotation',
            'sample_payment' => 'Sample Payment',
            'purchasing' => 'Purchasing',
            'sample_production' => 'Sample Production',
            'sample_approval' => 'Sample Approval',
            'production_payment' => 'Production Payment',
            'production' => 'Production',
            'packing_delivery' => 'Packing / Delivery',
            'done' => 'Done',
            default => 'Order Entry',
        };
    }

    private function calculateProgress($workflow): int
    {
        if (! $workflow) {
            return 0;
        }

        /**
         * Jangan masukkan pesanan_id ke steps,
         * karena itu bukan progress workflow.
         */
        $steps = [
            'article_synced',
            'design_uploaded',
            'design_approved',
            'design_specs_completed',
            'quotation_created',
            'quotation_approved',
            'sample_paid',
            'materials_purchased',
            'sample_materials_ready',
            'sample_created',
            'sample_delivered',
            'sample_approved',
            'production_invoice_created',
            'production_dp_paid',
            'production_materials_ready',
            'production_started',
            'production_completed',
            'qc_completed',
            'packing_completed',
            'final_payment_paid',
            'delivered',
            'completed',
        ];

        $done = collect($steps)
            ->filter(fn ($step) => (bool) ($workflow->{$step} ?? false))
            ->count();

        return (int) round(($done / count($steps)) * 100);
    }

    private function resolveBlocker(Pesanan $pesanan): ?string
    {
        $w = $pesanan->workflowStatus;

        if (! $w) {
            return 'Menunggu order entry diproses';
        }

        if (! $w->article_synced) {
            return 'Menunggu sync artikel';
        }

        if (! $w->design_uploaded) {
            return 'Menunggu upload design';
        }

        if (! $w->design_approved) {
            return 'Menunggu approval design';
        }

        if (! ($w->quotation_approved ?? false)) {
            return 'Menunggu approval quotation';
        }

        if (! ($w->sample_paid ?? false)) {
            return 'Menunggu payment sample';
        }

        if (! ($w->sample_materials_ready ?? false)) {
            return 'Menunggu material sample siap';
        }

        if (! ($w->sample_created ?? false)) {
            return 'Menunggu sample production';
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
            false,
        );
    }
}