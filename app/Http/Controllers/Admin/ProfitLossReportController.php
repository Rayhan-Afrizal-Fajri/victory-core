<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Pesanan;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ProfitLossReportController extends Controller
{
    public function index(Request $request)
    {
        $periodType = $request->input('period_type', 'monthly');
        $date = $request->input('date', now()->toDateString());
        $month = $request->input('month', now()->format('Y-m'));
        $year = $request->input('year', now()->format('Y'));
        $status = $request->input('status', 'all');

        $orders = Pesanan::query()
            ->with([
                'customer',
                'workflowStatus',
                'materialSpecs',
                'manufacturingSpecs',
                'invoices.payments',
            ])
            ->when($periodType === 'daily', function ($query) use ($date) {
                $query->whereDate('created_at', $date);
            })
            ->when($periodType === 'monthly', function ($query) use ($month) {
                $query->whereYear('created_at', Carbon::parse($month)->year)
                    ->whereMonth('created_at', Carbon::parse($month)->month);
            })
            ->when($periodType === 'yearly', function ($query) use ($year) {
                $query->whereYear('created_at', $year);
            })
            ->latest()
            ->get()
            ->map(fn ($order) => $this->mapReportRow($order))
            ->filter(function ($row) use ($status) {
                if ($status === 'all') {
                    return true;
                }

                return $row['status'] === $status;
            })
            ->values();

        $summary = $this->buildSummary($orders);

        return Inertia::render('admin/report/Index', [
            'filters' => [
                'period_type' => $periodType,
                'date' => $date,
                'month' => $month,
                'year' => $year,
                'status' => $status,
            ],
            'rows' => $orders,
            'summary' => $summary,
            'charts' => [
                'period_profitability' => $this->buildPeriodProfitabilityChart($orders),
                'top_gop_orders' => $this->buildTopGopChart($orders),
                'margin_by_status' => $this->buildMarginByStatusChart($orders),
            ],
        ]);
    }

    private function mapReportRow(Pesanan $order): array
    {
        $qty = (int) ($order->quantity ?: $order->q ?: 0);
        $pricePerPcs = (float) ($order->harga_jual_per_pcs ?: 0);

        $materialCost = (float) $order->materialSpecs->sum('cost_per_pcs');
        $manufacturingCost = (float) $order->manufacturingSpecs->sum('cost_per_pcs');

        $hppPerPcs = $materialCost + $manufacturingCost;

        $revenue = $qty * $pricePerPcs;
        $cost = $qty * $hppPerPcs;
        $gop = $revenue - $cost;
        $margin = $revenue > 0 ? ($gop / $revenue) * 100 : 0;

        return [
            'id' => $order->id,
            'jobNo' => $order->no_job_ticket,
            'product' => $order->requested_product_name ?: $order->produk ?: '-',
            'customer' => $order->customer?->nama_perusahaan
                ?? $order->customer?->nama
                ?? $order->customer_perusahaan_snapshot
                ?? '-',
            'status' => $this->getReportStatus($order->workflowStatus),
            'statusLabel' => $this->getStatusLabel($this->getReportStatus($order->workflowStatus)),
            'qty' => $qty,
            'price' => $pricePerPcs,
            'hpp' => $hppPerPcs,
            'revenue' => $revenue,
            'cost' => $cost,
            'gop' => $gop,
            'margin' => $margin,
            'date' => $order->created_at?->toDateString(),
        ];
    }

    private function buildSummary($rows): array
    {
        $revenue = $rows->sum('revenue');
        $cost = $rows->sum('cost');
        $gop = $rows->sum('gop');
        $qty = $rows->sum('qty');

        return [
            'revenue' => $revenue,
            'cost' => $cost,
            'gop' => $gop,
            'qty' => $qty,
            'orders' => $rows->count(),
            'margin' => $revenue > 0 ? ($gop / $revenue) * 100 : 0,
        ];
    }

    private function buildPeriodProfitabilityChart($rows): array
    {
        return $rows
            ->groupBy('date')
            ->map(function ($items, $date) {
                return [
                    'label' => $date ?: '-',
                    'revenue' => $items->sum('revenue'),
                    'cost' => $items->sum('cost'),
                    'gop' => $items->sum('gop'),
                ];
            })
            ->sortKeys()
            ->values()
            ->toArray();
    }

    private function buildTopGopChart($rows): array
    {
        return $rows
            ->sortByDesc('gop')
            ->take(5)
            ->map(fn ($row) => [
                'label' => $row['jobNo'],
                'customer' => $row['customer'],
                'gop' => $row['gop'],
                'margin' => $row['margin'],
            ])
            ->values()
            ->toArray();
    }

    private function buildMarginByStatusChart($rows): array
    {
        return $rows
            ->groupBy('statusLabel')
            ->map(function ($items, $status) {
                $revenue = $items->sum('revenue');
                $gop = $items->sum('gop');

                return [
                    'label' => $status,
                    'orders' => $items->count(),
                    'margin' => $revenue > 0 ? ($gop / $revenue) * 100 : 0,
                    'gop' => $gop,
                ];
            })
            ->values()
            ->toArray();
    }

    private function getReportStatus($workflow): string
    {
        if (! $workflow) return 'penawaran';

        if ($workflow->completed) return 'done';
        if ($workflow->production_started || $workflow->production_completed) return 'produksi';
        if ($workflow->sample_created || $workflow->sample_delivered || $workflow->sample_approved) return 'sample';
        if ($workflow->quotation_approved || $workflow->design_approved) return 'penawaran';

        return 'penawaran';
    }

    private function getStatusLabel(string $status): string
    {
        return match ($status) {
            'sample' => 'Sample',
            'produksi' => 'Produksi',
            'done' => 'Done',
            default => 'Penawaran',
        };
    }
}