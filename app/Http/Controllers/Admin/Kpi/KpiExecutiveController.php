<?php

namespace App\Http\Controllers\Admin\Kpi;

use App\Http\Controllers\Controller;
use App\Services\Kpi\KpiCalculationService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class KpiExecutiveController extends Controller
{
    protected KpiCalculationService $kpiService;

    public function __construct(KpiCalculationService $kpiService)
    {
        $this->kpiService = $kpiService;
    }

    public function index(Request $request): Response
    {
        $data = $this->kpiService->getExecutiveMetrics();

        return Inertia::render('admin/kpi/executive', [
            'metrics' => $data['metrics'],
            'monthlyTrend' => $data['monthlyTrend'],
            'salesFunnel' => $data['salesFunnel'],
            'alerts' => $data['alerts'],
        ]);
    }
}
