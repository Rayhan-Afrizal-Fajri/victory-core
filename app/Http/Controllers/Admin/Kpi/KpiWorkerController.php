<?php

namespace App\Http\Controllers\Admin\Kpi;

use App\Http\Controllers\Controller;
use App\Services\Kpi\KpiCalculationService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class KpiWorkerController extends Controller
{
    protected KpiCalculationService $kpiService;

    public function __construct(KpiCalculationService $kpiService)
    {
        $this->kpiService = $kpiService;
    }

    public function index(Request $request): Response
    {
        $data = $this->kpiService->getWorkerMetrics();

        return Inertia::render('admin/kpi/workers', [
            'workers' => $data['workers'],
        ]);
    }
}
