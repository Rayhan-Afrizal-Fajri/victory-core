<?php

namespace App\Http\Controllers\Admin\Kpi;

use App\Http\Controllers\Controller;
use App\Services\Kpi\KpiCalculationService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class KpiProductionQcController extends Controller
{
    protected KpiCalculationService $kpiService;

    public function __construct(KpiCalculationService $kpiService)
    {
        $this->kpiService = $kpiService;
    }

    public function index(Request $request): Response
    {
        $data = $this->kpiService->getProductionQcMetrics();

        return Inertia::render('admin/kpi/production-qc', [
            'otdRate' => $data['otdRate'],
            'defectRate' => $data['defectRate'],
            'ftprRate' => $data['ftprRate'],
            'paretoDefects' => $data['paretoDefects'],
            'workCenterThroughput' => $data['workCenterThroughput'],
            'deadlineWatchlist' => $data['deadlineWatchlist'],
        ]);
    }
}
