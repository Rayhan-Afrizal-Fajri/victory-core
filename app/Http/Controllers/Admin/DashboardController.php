<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use App\Models\Pesanan;
use App\Models\Invoice;
use Carbon\Carbon;

class DashboardController extends Controller
{

    public function index()
    {
        $orders = Pesanan::query()
            ->with([
                'customer',
                'workflowStatus',
            ])
            ->get();

        $totalOrders = $orders->count();

        $activeOrders = $orders->filter(function ($order) {
            return ! ($order->workflowStatus?->completed ?? false);
        })->count();

        $totalGop = Invoice::query()
            ->whereNotIn('status_tagihan', ['cancelled', 'Cancelled'])
            ->sum('total_tagihan');

        $deadlineUnderThreeDays = $orders->filter(function ($order) {
            if (! $order->deadline) {
                return false;
            }

            $deadline = Carbon::parse($order->deadline)->startOfDay();
            $today = now()->startOfDay();

            return $deadline->greaterThanOrEqualTo($today)
                && $deadline->diffInDays($today) <= 3
                && ! ($order->workflowStatus?->completed ?? false);
        })->count();

        $statusItems = $this->buildStatusDistribution($orders);

        $deadlineOrders = $orders
            ->filter(fn ($order) => $order->deadline)
            ->sortBy(fn ($order) => Carbon::parse($order->deadline))
            ->take(5)
            ->map(function ($order) {
                $status = $this->getWorkflowStatusLabel($order->workflowStatus);

                return [
                    'id' => $order->id,
                    'ticket' => $order->no_job_ticket,
                    'customer' => $order->customer?->nama_perusahaan
                        ?? $order->customer?->nama
                        ?? $order->customer_perusahaan_snapshot
                        ?? '-',
                    'product' => ($order->requested_product_name ?: $order->produk ?: '-')
                        . ' (' . (int) ($order->quantity ?: $order->q ?: 0) . ' pcs)',
                    'status' => $status,
                    'deadline' => $order->deadline,
                    'daysLeft' => $this->getDaysLeftLabel($order->deadline),
                ];
            })
            ->values();

        return Inertia::render('dashboard', [
            'dashboard' => [
                'summaryCards' => [
                    [
                        'key' => 'total_orders',
                        'title' => 'Total Pesanan',
                        'value' => $totalOrders,
                        'type' => 'total',
                    ],
                    [
                        'key' => 'active_orders',
                        'title' => 'Pesanan Aktif',
                        'value' => $activeOrders,
                        'type' => 'active',
                    ],
                    [
                        'key' => 'total_gop',
                        'title' => 'Total GOP',
                        'value' => 'Rp ' . number_format($totalGop, 0, ',', '.'),
                        'type' => 'money',
                    ],
                    [
                        'key' => 'deadline_soon',
                        'title' => 'Deadline < 3 hari',
                        'value' => $deadlineUnderThreeDays,
                        'type' => 'warning',
                    ],
                ],
                'statusItems' => $statusItems,
                'deadlineOrders' => $deadlineOrders,
            ],
            'user' => Auth::user(),
        ]);
    }

    private function buildStatusDistribution($orders): array
    {
        $statusMap = [
            'Design' => 0,
            'Quotation' => 0,
            'Sample Payment' => 0,
            'Purchasing' => 0,
            'Sample' => 0,
            'Production Payment' => 0,
            'Produksi' => 0,
            'Packing' => 0,
            'Delivery' => 0,
            'Done' => 0,
        ];

        foreach ($orders as $order) {
            $status = $this->getWorkflowStatusLabel($order->workflowStatus);

            if (isset($statusMap[$status])) {
                $statusMap[$status]++;
            }
        }

        $total = max($orders->count(), 1);

        return collect($statusMap)
            ->map(function ($count, $label) use ($total) {
                return [
                    'label' => $label,
                    'count' => $count,
                    'progress' => round(($count / $total) * 100),
                    'colorClass' => $this->getStatusColorClass($label),
                    'chipClass' => $this->getStatusChipClass($label),
                ];
            })
            ->values()
            ->toArray();
    }

    private function getWorkflowStatusLabel($workflow): string
    {
        if (! $workflow) return 'Design';

        if ($workflow->completed) return 'Done';
        if ($workflow->delivered) return 'Delivery';
        if ($workflow->packing_completed) return 'Packing';
        if ($workflow->production_completed || $workflow->production_started) return 'Produksi';
        if ($workflow->production_dp_paid || $workflow->production_invoice_created) return 'Production Payment';
        if ($workflow->sample_approved || $workflow->sample_delivered || $workflow->sample_created) return 'Sample';
        if ($workflow->materials_received || $workflow->materials_purchased) return 'Purchasing';
        if ($workflow->sample_paid) return 'Sample Payment';
        if ($workflow->quotation_approved) return 'Quotation';
        if ($workflow->design_approved) return 'Design';

        return 'Design';
    }

    private function getDaysLeftLabel(?string $deadline): string
    {
        if (! $deadline) {
            return '-';
        }

        $deadlineDate = Carbon::parse($deadline)->startOfDay();
        $today = now()->startOfDay();

        if ($deadlineDate->isPast() && ! $deadlineDate->isSameDay($today)) {
            return 'Terlambat ' . $deadlineDate->diffInDays($today) . ' hari';
        }

        if ($deadlineDate->isSameDay($today)) {
            return 'Hari ini';
        }

        return $today->diffInDays($deadlineDate) . ' hari';
    }

    private function getStatusColorClass(string $status): string
    {
        return match ($status) {
            'Design' => 'bg-blue-500',
            'Quotation' => 'bg-amber-500',
            'Sample Payment' => 'bg-cyan-500',
            'Purchasing' => 'bg-violet-500',
            'Sample' => 'bg-orange-500',
            'Production Payment' => 'bg-cyan-600',
            'Produksi' => 'bg-emerald-500',
            'Packing' => 'bg-purple-500',
            'Delivery' => 'bg-green-600',
            'Done' => 'bg-slate-500',
            default => 'bg-slate-500',
        };
    }

    private function getStatusChipClass(string $status): string
    {
        return match ($status) {
            'Design' => 'bg-blue-100 text-blue-700',
            'Quotation' => 'bg-amber-100 text-amber-700',
            'Sample Payment' => 'bg-cyan-100 text-cyan-700',
            'Purchasing' => 'bg-violet-100 text-violet-700',
            'Sample' => 'bg-orange-100 text-orange-700',
            'Production Payment' => 'bg-cyan-100 text-cyan-700',
            'Produksi' => 'bg-emerald-100 text-emerald-700',
            'Packing' => 'bg-purple-100 text-purple-700',
            'Delivery' => 'bg-green-100 text-green-700',
            'Done' => 'bg-slate-100 text-slate-700',
            default => 'bg-slate-100 text-slate-700',
        };
    }
}
