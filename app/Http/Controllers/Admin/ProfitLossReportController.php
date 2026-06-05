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
        $scope = $request->input('scope', 'all');

        $rows = Pesanan::query()
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
            ->flatMap(fn ($order) => $this->mapReportRows($order, $scope))
            ->values();

        $summary = $this->buildSummary($rows);

        return Inertia::render('admin/report/Index', [
            'filters' => [
                'period_type' => $periodType,
                'date' => $date,
                'month' => $month,
                'year' => $year,
                'scope' => $scope,
            ],
            'rows' => $rows,
            'summary' => $summary,
            'charts' => [
                'period_profitability' => $this->buildPeriodProfitabilityChart($rows),
                'top_gop_orders' => $this->buildTopGopChart($rows),
                'margin_by_scope' => $this->buildMarginByScopeChart($rows),
            ],
        ]);
    }

    private function mapReportRows(Pesanan $order, string $scope)
    {
        $rows = collect();

        if (in_array($scope, ['all', 'sample'])) {
            $rows->push($this->mapReportRow($order, 'sample'));
        }

        if (in_array($scope, ['all', 'production'])) {
            $rows->push($this->mapReportRow($order, 'production'));
        }

        return $rows->filter(fn ($row) => $row['qty'] > 0 || $row['revenue'] > 0);
    }

    private function mapReportRow(Pesanan $order, string $scope): array
    {
        $qty = $scope === 'sample'
            ? (int) ($order->sample_qty ?: 0)
            : (int) ($order->quantity ?: $order->q ?: 0);

        $invoices = $order->invoices
            ->filter(fn ($invoice) => $this->getInvoiceCategory($invoice) === $scope)
            ->filter(fn ($invoice) => ! in_array($this->getInvoiceStatus($invoice), ['cancelled', 'Cancelled']));

        $revenue = (float) $invoices->sum(function ($invoice) {
            return (float) ($invoice->total_tagihan ?: $invoice->amount ?: $invoice->total ?: 0);
        });

        $paidRevenue = (float) $invoices->flatMap->payments
            ->where('status', 'verified')
            ->sum('jumlah_bayar');

        $costBreakdown = $this->buildCostBreakdown($order, $qty);

        $cost = $costBreakdown['total'];
        $hppPerPcs = $qty > 0 ? $cost / $qty : 0;
        $pricePerPcs = $qty > 0 ? $revenue / $qty : 0;

        $gop = $revenue - $cost;
        $margin = $revenue > 0 ? ($gop / $revenue) * 100 : 0;

        return [
            'id' => "{$order->id}-{$scope}",
            'orderId' => $order->id,
            'jobNo' => $order->no_job_ticket,
            'product' => $order->requested_product_name ?: $order->produk ?: '-',
            'customer' => $order->customer?->nama_perusahaan
                ?? $order->customer?->nama
                ?? $order->customer_perusahaan_snapshot
                ?? '-',

            'scope' => $scope,
            'scopeLabel' => $scope === 'sample' ? 'Sample' : 'Production',

            'qty' => $qty,
            'price' => $pricePerPcs,
            'hpp' => $hppPerPcs,
            'revenue' => $revenue,
            'paidRevenue' => $paidRevenue,
            'cost' => $cost,
            'gop' => $gop,
            'margin' => $margin,
            'date' => $order->created_at?->toDateString(),

            'costBreakdown' => $costBreakdown,
        ];
    }

    private function buildCostBreakdown(Pesanan $order, int $qty): array
    {
        $materials = $order->materialSpecs->groupBy('type')->map(function ($items) use ($qty) {
            return [
                'total' => (float) $items->sum(fn ($item) => (float) $item->cost_per_pcs * $qty),
                'items' => $items->map(fn ($item) => [
                    'label' => $item->material_name_snapshot,
                    'unit' => $item->unit,
                    'cost_per_pcs' => (float) $item->cost_per_pcs,
                    'total' => (float) $item->cost_per_pcs * $qty,
                ])->values()->toArray(),
            ];
        });

        $manufacturing = $order->manufacturingSpecs->groupBy(function ($item) {
            return $item->work_name_snapshot ?: 'Manufacturing';
        })->map(function ($items, $workName) use ($qty) {
            return [
                'label' => $workName,
                'total' => (float) $items->sum(fn ($item) => (float) $item->cost_per_pcs * $qty),
                'items' => $items->map(fn ($item) => [
                    'label' => $item->work_name_snapshot,
                    'unit' => $item->unit,
                    'behavior' => $item->process_behavior ?? 'production_process',
                    'cost_per_pcs' => (float) $item->cost_per_pcs,
                    'total' => (float) $item->cost_per_pcs * $qty,
                ])->values()->toArray(),
            ];
        })->values();

        $materialBahan = (float) data_get($materials, 'bahan.total', 0);
        $materialAksesoris = (float) data_get($materials, 'aksesoris.total', 0);
        $manufacturingTotal = (float) $manufacturing->sum('total');

        return [
            'materials' => [
                'bahan' => [
                    'label' => 'Bahan',
                    'total' => $materialBahan,
                    'items' => data_get($materials, 'bahan.items', []),
                ],
                'aksesoris' => [
                    'label' => 'Aksesoris',
                    'total' => $materialAksesoris,
                    'items' => data_get($materials, 'aksesoris.items', []),
                ],
            ],
            'manufacturing' => $manufacturing->toArray(),
            'material_total' => $materialBahan + $materialAksesoris,
            'manufacturing_total' => $manufacturingTotal,
            'total' => $materialBahan + $materialAksesoris + $manufacturingTotal,
        ];
    }

    private function buildSummary($rows): array
    {
        $revenue = $rows->sum('revenue');
        $paidRevenue = $rows->sum('paidRevenue');
        $cost = $rows->sum('cost');
        $gop = $rows->sum('gop');
        $qty = $rows->sum('qty');

        return [
            'revenue' => $revenue,
            'paidRevenue' => $paidRevenue,
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
                'label' => "{$row['jobNo']} · {$row['scopeLabel']}",
                'customer' => $row['customer'],
                'gop' => $row['gop'],
                'margin' => $row['margin'],
            ])
            ->values()
            ->toArray();
    }

    private function buildMarginByScopeChart($rows): array
    {
        return $rows
            ->groupBy('scopeLabel')
            ->map(function ($items, $scope) {
                $revenue = $items->sum('revenue');
                $gop = $items->sum('gop');

                return [
                    'label' => $scope,
                    'orders' => $items->count(),
                    'margin' => $revenue > 0 ? ($gop / $revenue) * 100 : 0,
                    'gop' => $gop,
                ];
            })
            ->values()
            ->toArray();
    }

    private function getInvoiceCategory($invoice): string
    {
        $category = $invoice->kategori_invoice ?? null;

        if (in_array($category, ['sample', 'production'])) {
            return $category;
        }

        $text = strtolower(($invoice->title ?? '') . ' ' . ($invoice->no_invoice ?? ''));

        if (str_contains($text, 'sample')) {
            return 'sample';
        }

        return 'production';
    }

    private function getInvoiceStatus($invoice): string
    {
        return $invoice->status_tagihan ?? $invoice->status ?? 'unpaid';
    }
}