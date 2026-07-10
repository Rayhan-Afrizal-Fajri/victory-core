<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\JobTicket;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        $isAdmin = $user->can('dashboard.admin');

        $ordersQuery = JobTicket::query()
            ->with([
                'customer',
                'pesanans.workflowStatus',
            ]);

        /**
         * Jika bukan admin, filter berdasarkan customer milik user login.
         */
        if (! $isAdmin) {
            $ordersQuery->where('customer_id', $user->customer?->id);
        }

        $orders = $ordersQuery->get();

        $totalOrders = $orders->count();

        $activeOrders = $orders
            ->filter(fn ($order) => ! $this->isJobTicketCompleted($order))
            ->count();

        /**
         * Invoice sekarang berada di level JobTicket.
         */
        $invoiceQuery = Invoice::query()
            ->whereNotIn('status_tagihan', ['cancelled', 'Cancelled']);

        if (! $isAdmin) {
            $invoiceQuery->whereHas('jobTicket', function ($query) use ($user) {
                $query->where('customer_id', $user->customer?->id);
            });
        }

        $totalRevenue = $invoiceQuery->sum('total_tagihan');

        $deadlineUnderThreeDays = $orders
            ->filter(function ($order) {
                if (! $order->deadline) {
                    return false;
                }

                if ($this->isJobTicketCompleted($order)) {
                    return false;
                }

                $deadline = Carbon::parse($order->deadline)->startOfDay();
                $today = now()->startOfDay();

                return $deadline->greaterThanOrEqualTo($today)
                    && $today->diffInDays($deadline) <= 3;
            })
            ->count();

        $statusItems = $this->buildStatusDistribution($orders);

        $deadlineOrders = $orders
            ->filter(fn ($order) => $order->deadline)
            ->reject(fn ($order) => $this->isJobTicketCompleted($order))
            ->sortBy(fn ($order) => Carbon::parse($order->deadline))
            ->take(5)
            ->map(function ($order) {
                $status = $this->getJobTicketStatusLabel($order);

                return [
                    'id' => $order->id,
                    'ticket' => $order->no_job_ticket,
                    'customer' => $order->customer?->nama_perusahaan
                        ?? $order->customer?->nama
                        ?? $order->customer_perusahaan_snapshot
                        ?? '-',

                    /**
                     * Untuk dashboard, tampilkan ringkasan banyak artikel.
                     */
                    'pesanan' => $this->getPesananSummary($order),

                    /**
                     * Kalau frontend masih pakai key product, isi juga.
                     */
                    'product' => $this->getPesananSummary($order),

                    'status' => $status,
                    'deadline' => $order->deadline,
                    'daysLeft' => $this->getDaysLeftLabel($order->deadline),
                ];
            })
            ->values();

        $summaryCards = [
            [
                'key' => 'total_orders',
                'title' => 'Total Purchase Order',
                'value' => $totalOrders,
                'type' => 'total',
            ],
            [
                'key' => 'active_orders',
                'title' => 'Purchase Order Aktif',
                'value' => $activeOrders,
                'type' => 'active',
            ],
        ];

        if ($isAdmin) {
            array_push(
                $summaryCards,
                [
                    'key' => 'total_revenue',
                    'title' => 'Total Revenue',
                    'value' => 'Rp ' . number_format($totalRevenue, 0, ',', '.'),
                    'type' => 'money',
                ],
                [
                    'key' => 'deadline_soon',
                    'title' => 'Deadline < 3 hari',
                    'value' => $deadlineUnderThreeDays,
                    'type' => 'warning',
                ],
            );
        }

        return Inertia::render('dashboard', [
            'dashboard' => [
                'summaryCards' => $summaryCards,
                'statusItems' => $statusItems,
                'deadlineOrders' => $deadlineOrders,
            ],
            'user' => $user,
        ]);
    }

    private function buildStatusDistribution($orders): array
    {
        $statusMap = [
            'Order Entry' => 0,
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
            $status = $this->getJobTicketStatusLabel($order);

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

    /**
     * Status Purchase Order dihitung dari semua pesanan di dalamnya.
     */
    private function getJobTicketStatusLabel($jobTicket): string
    {
        $pesanans = $jobTicket->pesanans ?? collect();

        if ($pesanans->isEmpty()) {
            return 'Order Entry';
        }

        $workflows = $pesanans
            ->pluck('workflowStatus')
            ->filter();

        if ($workflows->isEmpty()) {
            return 'Order Entry';
        }

        /**
         * Jika semua artikel completed, maka Purchase Order Done.
         */
        if (
            $workflows->count() === $pesanans->count() &&
            $workflows->every(fn ($workflow) => (bool) $workflow->completed)
        ) {
            return 'Done';
        }

        /**
         * Selain Done, status Purchase Order mengikuti progress terjauh
         * dari salah satu artikel/pesanan.
         */
        if ($workflows->contains(fn ($workflow) => (bool) $workflow->delivered)) {
            return 'Delivery';
        }

        if ($workflows->contains(fn ($workflow) => (bool) $workflow->packing_completed)) {
            return 'Packing';
        }

        if ($workflows->contains(fn ($workflow) => (bool) $workflow->production_completed || (bool) $workflow->production_started)) {
            return 'Produksi';
        }

        if ($workflows->contains(fn ($workflow) => (bool) $workflow->production_dp_paid || (bool) $workflow->production_invoice_created)) {
            return 'Production Payment';
        }

        if ($workflows->contains(fn ($workflow) => (bool) $workflow->sample_approved || (bool) $workflow->sample_delivered || (bool) $workflow->sample_created)) {
            return 'Sample';
        }

        if ($workflows->contains(fn ($workflow) => (bool) $workflow->materials_received || (bool) $workflow->materials_purchased)) {
            return 'Purchasing';
        }

        if ($workflows->contains(fn ($workflow) => (bool) $workflow->sample_paid)) {
            return 'Sample Payment';
        }

        if ($workflows->contains(fn ($workflow) => (bool) $workflow->quotation_approved || (bool) $workflow->quotation_created)) {
            return 'Quotation';
        }

        if ($workflows->contains(fn ($workflow) => (bool) $workflow->design_approved || (bool) $workflow->design_uploaded || (bool) $workflow->article_synced)) {
            return 'Design';
        }

        return 'Order Entry';
    }

    private function isJobTicketCompleted($jobTicket): bool
    {
        $pesanans = $jobTicket->pesanans ?? collect();

        if ($pesanans->isEmpty()) {
            return false;
        }

        return $pesanans->every(function ($pesanan) {
            return (bool) ($pesanan->workflowStatus?->completed ?? false);
        });
    }

    private function getPesananSummary($jobTicket): string
    {
        $pesanans = $jobTicket->pesanans ?? collect();

        if ($pesanans->isEmpty()) {
            return 'Belum ada artikel';
        }

        $totalQty = $pesanans->sum(fn ($pesanan) => (int) ($pesanan->q ?? 0));
        $articleCount = $pesanans->count();

        $preview = $pesanans
            ->take(2)
            ->map(function ($pesanan) {
                $name = $pesanan->produk
                    ?: $pesanan->requested_product_name
                    ?: 'Artikel';

                return $name . ' (' . (int) ($pesanan->q ?? 0) . ' pcs)';
            })
            ->implode(', ');

        if ($articleCount > 2) {
            $preview .= ', +' . ($articleCount - 2) . ' artikel lain';
        }

        return "{$preview} · Total {$totalQty} pcs";
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
            'Order Entry' => 'bg-slate-500',
            'Design' => 'bg-blue-500',
            'Quotation' => 'bg-amber-500',
            'Sample Payment' => 'bg-cyan-500',
            'Purchasing' => 'bg-violet-500',
            'Sample' => 'bg-orange-500',
            'Production Payment' => 'bg-cyan-600',
            'Produksi' => 'bg-emerald-500',
            'Packing' => 'bg-purple-500',
            'Delivery' => 'bg-green-600',
            'Done' => 'bg-slate-700',
            default => 'bg-slate-500',
        };
    }

    private function getStatusChipClass(string $status): string
    {
        return match ($status) {
            'Order Entry' => 'bg-slate-100 text-slate-700',
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