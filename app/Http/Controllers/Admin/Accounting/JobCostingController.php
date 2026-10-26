<?php

namespace App\Http\Controllers\Admin\Accounting;

use App\Http\Controllers\Controller;
use App\Models\Accounting\JobOrderCost;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class JobCostingController extends Controller
{
    public function index(Request $request): Response
    {
        $costs = JobOrderCost::with(['pesanan.product', 'jobTicket.customer'])
            ->orderByDesc('id')
            ->get()
            ->map(function ($cost) {
                $pesanan = $cost->pesanan;
                $job = $cost->jobTicket;
                $customer = $job ? $job->customer : null;

                $est = (float) $cost->total_estimated_cogs;
                $act = (float) $cost->total_actual_cogs;
                $variance = $act - $est;
                $variancePct = $est > 0 ? round(($variance / $est) * 100, 1) : 0;

                return [
                    'id' => $cost->id,
                    'jobTicketNo' => $job ? $job->no_job_ticket : "PO-{$cost->id}",
                    'customerName' => $job ? ($job->customer_nama_snapshot ?: ($customer ? ($customer->nama ?: $customer->name) : 'Pelanggan')) : 'Pelanggan',
                    'articleName' => $pesanan ? ($pesanan->produk ?: $pesanan->requested_product_name) : 'Garment Batch',
                    'quantity' => $pesanan ? (int) ($pesanan->q ?: $pesanan->sample_qty ?: 1) : 1,
                    'estimatedMaterial' => (float) $cost->estimated_material_cost,
                    'actualMaterial' => (float) $cost->actual_material_cost,
                    'estimatedLabor' => (float) $cost->estimated_labor_cost,
                    'actualLabor' => (float) $cost->actual_labor_cost,
                    'estimatedSubcon' => (float) $cost->estimated_subcon_cost,
                    'actualSubcon' => (float) $cost->actual_subcon_cost,
                    'defectScrapCost' => (float) $cost->defect_scrap_cost,
                    'totalEstimatedCogs' => $est,
                    'totalActualCogs' => $act,
                    'revenueBilled' => (float) $cost->revenue_billed,
                    'grossProfit' => (float) $cost->gross_profit,
                    'grossMarginPct' => (float) $cost->gross_margin_pct,
                    'costVariance' => $variance,
                    'costVariancePct' => $variancePct,
                    'status' => $cost->status,
                ];
            });

        // Summary Statistics
        $totalEstCogs = $costs->sum('totalEstimatedCogs');
        $totalActCogs = $costs->sum('totalActualCogs');
        $totalRevenue = $costs->sum('revenueBilled');
        $totalGrossProfit = $costs->sum('grossProfit');
        $avgGrossMargin = $totalRevenue > 0 ? round(($totalGrossProfit / $totalRevenue) * 100, 1) : 0;
        $totalVariance = $totalActCogs - $totalEstCogs;

        return Inertia::render('admin/accounting/costing', [
            'jobCostings' => $costs,
            'summary' => [
                'totalEstimatedCogs' => $totalEstCogs,
                'totalActualCogs' => $totalActCogs,
                'totalRevenue' => $totalRevenue,
                'totalGrossProfit' => $totalGrossProfit,
                'avgGrossMargin' => $avgGrossMargin,
                'totalVariance' => $totalVariance,
            ],
        ]);
    }
}
