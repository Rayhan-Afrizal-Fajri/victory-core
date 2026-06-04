<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use App\Models\Pesanan;
use Carbon\Carbon;

class KanbanBoardController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $cards = Pesanan::query()
            ->with([
                'customer',
                'workflowStatus',
                'sampleRun.processes',
                'productionRun.processes',
            ])
            ->latest()
            ->get()
            ->map(function ($pesanan) {
                $workflow = $pesanan->workflowStatus;

                $stage = $this->resolveStage($workflow);
                $progress = $this->calculateProgress($workflow);
                $blocker = $this->resolveBlocker($pesanan);

                return [
                    'id' => $pesanan->id,
                    'jobNo' => $pesanan->no_job_ticket ?? $pesanan->order_number ?? '-',
                    'product' => $pesanan->requested_product_name ?: $pesanan->produk ?: '-',
                    'customer' => $pesanan->customer?->nama_perusahaan
                        ?? $pesanan->customer?->nama
                        ?? $pesanan->customer_perusahaan_snapshot
                        ?? '-',
                    'qty' => (int) ($pesanan->quantity ?: $pesanan->q ?: 0),
                    'deadline' => $pesanan->deadline,
                    'daysLeft' => $this->getDaysLeft($pesanan->deadline),
                    'stage' => $stage,
                    'stageLabel' => $this->getStageLabel($stage),
                    'progress' => $progress,
                    'blocker' => $blocker,
                    'sampleProgress' => $this->mapRunProgress($pesanan->sampleRun),
                    'productionProgress' => $this->mapRunProgress($pesanan->productionRun),
                    'showUrl' => route('job-tickets.show', $pesanan->id),
                ];
            })
            ->values();
        
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

        if ($workflow->completed) return 'done';
        
        if ($workflow->delivered || $workflow->packing_completed) {
            return 'packing_delivery';
        }

        if ($workflow->production_started || $workflow->production_completed || $workflow->qc_completed) {
            return 'production';
        }

        if ($workflow->production_invoice_created || $workflow->production_dp_paid || $workflow->final_payment_paid) {
            return 'production_payment';
        }

        if ($workflow->sample_approved) {
            return 'sample_approval';
        }

        if ($workflow->sample_created || $workflow->sample_delivered) {
            return 'sample_production';
        }

        if ($workflow->materials_purchased || $workflow->materials_received || $workflow->sample_paid) {
            return 'purchasing';
        }

        if ($workflow->quotation_approved) {
            return 'sample_payment';
        }

        if ($workflow->design_approved) {
            return 'quotation';
        }

        if ($workflow->design_uploaded || $workflow->design_created) {
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

        $steps = [
            'pesanan_id',
            'design_uploaded',
            'design_approved',
            'quotation_approved',
            'sample_paid',
            'materials_purchased',
            'materials_received',
            'sample_created',
            'sample_delivered',
            'sample_approved',
            'production_invoice_created',
            'production_dp_paid',
            'production_started',
            'production_completed',
            'qc_completed',
            'packing_completed',
            'final_payment_paid',
            'delivered',
            'completed',
        ];

        $done = collect($steps)->filter(function ($step) use ($workflow) {
            return (bool) ($workflow->{$step} ?? false);
        })->count();

        return (int) round(($done / count($steps)) * 100);
    }

    private function resolveBlocker(Pesanan $pesanan): ?string
    {
        $w = $pesanan->workflowStatus;

        if (! $w) {
            return 'Menunggu order diproses';
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

        if (! ($w->materials_received ?? false)) {
            return 'Menunggu material purchasing/receiving';
        }

        if (! ($w->sample_approved ?? false)) {
            return 'Menunggu sample approval';
        }

        if (($w->production_invoice_created ?? false) && ! ($w->production_dp_paid ?? false)) {
            return 'Menunggu DP production';
        }

        if (($w->packing_completed ?? false) && ! ($w->final_payment_paid ?? false)) {
            return 'Menunggu pelunasan';
        }

        if (($w->final_payment_paid ?? false) && ! ($w->delivered ?? false)) {
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

        $completed = $processes->filter(function ($process) {
            return $process->status === 'completed'
                && $process->qc_status === 'passed';
        })->count();

        return [
            'type' => $run->type,
            'status' => $run->status,
            'quantity' => (int) $run->quantity,
            'completed' => $completed,
            'total' => $total,
            'percent' => $total > 0 ? round(($completed / $total) * 100) : 0,
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
