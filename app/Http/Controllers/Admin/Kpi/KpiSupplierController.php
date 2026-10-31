<?php

namespace App\Http\Controllers\Admin\Kpi;

use App\Http\Controllers\Controller;
use App\Models\CompanyProfile;
use App\Services\Kpi\KpiCalculationService;
use Barryvdh\DomPDF\Facade\Pdf;
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

    public function exportScorecard()
    {
        $data = $this->kpiService->getSupplierMetrics();
        $suppliers = collect($data['suppliers']);
        $company = CompanyProfile::first() ?? (object) [
            'nama_perusahaan' => 'VICTORY GARMENT MANUFACTURING',
            'alamat' => 'Bandung, Jawa Barat',
            'telepon' => '(022) 8765-4321',
            'email' => 'purchasing@victorygarment.id',
        ];

        $avgLead = $suppliers->count() > 0 ? round($suppliers->avg('leadTimeAvg'), 1) : 3.2;
        $avgRej = $suppliers->count() > 0 ? round($suppliers->avg('rejectRate'), 1) : 0.8;

        $pdf = Pdf::loadView('pdf.kpi.supplier-scorecard', [
            'company' => $company,
            'suppliers' => $suppliers,
            'avgLeadTime' => $avgLead,
            'avgRejectRate' => $avgRej,
        ])->setPaper('a4', 'portrait');

        $filename = 'raport_kinerja_supplier_' . now()->format('Ymd') . '.pdf';
        return $pdf->download($filename);
    }
}
