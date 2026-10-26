<?php

namespace App\Http\Controllers\Admin\Kpi;

use App\Http\Controllers\Controller;
use App\Services\Kpi\KpiCalculationService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class KpiCommercialFinancialController extends Controller
{
    protected KpiCalculationService $kpiService;

    public function __construct(KpiCalculationService $kpiService)
    {
        $this->kpiService = $kpiService;
    }

    public function index(Request $request): Response
    {
        $data = $this->kpiService->getCommercialFinancialMetrics();

        return Inertia::render('admin/kpi/commercial-financial', [
            'winRate' => $data['winRate'],
            'aov' => $data['aov'],
            'dso' => $data['dso'],
            'repeatOrderRate' => $data['repeatOrderRate'],
            'quotationBreakdown' => $data['quotationBreakdown'],
            'costVarianceList' => $data['costVarianceList'],
        ]);
    }
}
