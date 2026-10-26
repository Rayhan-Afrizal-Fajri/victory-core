<?php

namespace App\Http\Controllers\Admin\Kpi;

use App\Http\Controllers\Controller;
use App\Services\Kpi\KpiCalculationService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class KpiSupplierController extends Controller
{
    protected KpiCalculationService $kpiService;

    public function __construct(KpiCalculationService $kpiService)
    {
        $this->kpiService = $kpiService;
    }

    public function index(Request $request): Response
    {
        $data = $this->kpiService->getSupplierMetrics();

        return Inertia::render('admin/kpi/suppliers', [
            'suppliers' => $data['suppliers'],
            'urgentIssues' => $data['urgentIssues'],
        ]);
    }
}
