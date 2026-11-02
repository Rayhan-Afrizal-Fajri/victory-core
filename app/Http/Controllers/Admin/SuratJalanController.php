<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\JobTicket;
use App\Models\ProductionRun;
use App\Models\SuratJalan;
use App\Models\User;
use App\Services\Delivery\SuratJalanService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class SuratJalanController extends Controller
{
    protected SuratJalanService $suratJalanService;

    public function __construct(SuratJalanService $suratJalanService)
    {
        $this->suratJalanService = $suratJalanService;
    }

    /**
     * Stream or print Surat Jalan by ID
     */
    public function print(string $id)
    {
        $suratJalan = SuratJalan::with([
            'items',
            'companyProfile',
            'customer',
            'jobTicket',
        ])->findOrFail($id);

        $suratJalan->update([
            'printed_at' => now(),
        ]);

        return $this->generatePdfResponse($suratJalan, false);
    }

    /**
     * Download Surat Jalan PDF by ID
     */
    public function download(string $id)
    {
        $suratJalan = SuratJalan::with([
            'items',
            'companyProfile',
            'customer',
            'jobTicket',
        ])->findOrFail($id);

        $suratJalan->update([
            'printed_at' => now(),
        ]);

        return $this->generatePdfResponse($suratJalan, true);
    }

    /**
     * Auto-generate (if not exists) and print Surat Jalan for a Job Ticket
     */
    public function printForJobTicket(string $jobTicketId)
    {
        $jobTicket = JobTicket::with(['customer', 'companyProfile', 'pesanans.product'])->findOrFail($jobTicketId);

        $suratJalan = $this->suratJalanService->createOrUpdateForJobTicket($jobTicket);

        $suratJalan->update([
            'printed_at' => now(),
        ]);

        return $this->generatePdfResponse($suratJalan, false);
    }

    /**
     * Auto-generate (if not exists) and print Surat Jalan for a Production Run
     */
    public function printForProductionRun(string $runId)
    {
        $run = ProductionRun::with(['pesanan.jobTicket.customer', 'pesanan.jobTicket.companyProfile'])->findOrFail($runId);

        $suratJalan = $this->suratJalanService->createOrUpdateForProductionRun($run);

        $suratJalan->update([
            'printed_at' => now(),
        ]);

        return $this->generatePdfResponse($suratJalan, false);
    }

    /**
     * Update courier or delivery info on Surat Jalan
     */
    public function update(Request $request, string $id)
    {
        $validated = $request->validate([
            'delivery_date' => ['nullable', 'date'],
            'courier_name' => ['nullable', 'string', 'max:100'],
            'tracking_number' => ['nullable', 'string', 'max:100'],
            'tracking_url' => ['nullable', 'string', 'max:255'],
            'vehicle_number' => ['nullable', 'string', 'max:50'],
            'driver_name' => ['nullable', 'string', 'max:100'],
            'notes' => ['nullable', 'string'],
            'status' => ['nullable', 'in:ready_to_ship,in_transit,delivered'],
        ]);

        $suratJalan = SuratJalan::findOrFail($id);
        $suratJalan->update($validated);

        return back()->with('success', 'Surat Jalan berhasil diperbarui.');
    }

    /**
     * Helper to render DomPDF
     */
    private function generatePdfResponse(SuratJalan $suratJalan, bool $forceDownload = false)
    {
        $owner = User::whereHas('roles', function ($query) {
            $query->where('name', 'Owner');
        })->first() ?? User::first();

        $pdf = Pdf::loadView('pdf.surat-jalan.show', [
            'suratJalan' => $suratJalan,
            'companyProfile' => $suratJalan->companyProfile,
            'owner' => $owner,
        ])->setPaper('a4', 'portrait');

        $cleanNumber = str_replace('/', '_', $suratJalan->surat_jalan_number);
        $customerSlug = Str::slug($suratJalan->customer_company_snapshot ?: $suratJalan->customer_name_snapshot ?: 'Customer');
        $filename = "Surat_Jalan_{$cleanNumber}_{$customerSlug}.pdf";

        if ($forceDownload) {
            return $pdf->download($filename);
        }

        return $pdf->stream($filename);
    }
}
