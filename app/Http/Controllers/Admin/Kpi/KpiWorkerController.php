<?php

namespace App\Http\Controllers\Admin\Kpi;

use App\Http\Controllers\Controller;
use App\Models\CompanyProfile;
use App\Services\Kpi\KpiCalculationService;
use Barryvdh\DomPDF\Facade\Pdf;
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

    public function exportSlip()
    {
        $data = $this->kpiService->getWorkerMetrics();
        $workers = collect($data['workers']);
        $company = CompanyProfile::first() ?? (object) [
            'nama_perusahaan' => 'VICTORY GARMENT MANUFACTURING',
            'alamat' => 'Bandung, Jawa Barat',
            'telepon' => '(022) 8765-4321',
            'email' => 'hr@victorygarment.id',
        ];

        $totalOutput = (int) $workers->sum('totalCompletedPcs');
        $totalWage = $totalOutput * 1500;

        $pdf = Pdf::loadView('pdf.kpi.worker-slip', [
            'company' => $company,
            'workers' => $workers,
            'totalOutput' => $totalOutput,
            'totalWage' => $totalWage,
        ])->setPaper('a4', 'portrait');

        $filename = 'rekap_upah_borongan_' . now()->format('Ymd') . '.pdf';
        return $pdf->download($filename);
    }
}
