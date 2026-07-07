<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\JobTicket;
use App\Models\Pesanan;
use App\Models\Quotation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Storage;

class QuotationController extends Controller
{
    // Ubah parameter agar mengambil berdasarkan JobTicket
    public function generate(Request $request, string $jobTicketId)
    {
        $validated = $request->validate([
            'valid_until' => ['nullable', 'date'],
            'sample_qtys' => ['required', 'array'],
            'sample_qtys.*' => ['required', 'integer', 'min:1'],
            'payment_terms' => ['nullable', 'string'],
            'delivery_terms' => ['nullable', 'string'],
            'notes' => ['required', 'array', 'min:1'],
            'notes.*' => ['nullable', 'string'],
            'delivery_cost' => ['nullable', 'numeric', 'min:0'],
        ]);

        // Ambil Job Ticket beserta Company Profile pendukungnya
        $jobTicket = JobTicket::with([
            'customer',
            'companyProfile', // Memastikan relasi ini terpanggil
            'pesanans.workflowStatus',
            'pesanans.materialSpecs',
            'pesanans.manufacturingSpecs',
        ])->findOrFail($jobTicketId);

        $pesanans = $jobTicket->pesanans;

        if ($pesanans->isEmpty()) {
            abort(422, 'Tidak ada pesanan dalam Job Ticket ini.');
        }

        $subtotal = 0;
        $totalQuantity = 0;
        $totalSampleQtyGlobal = 0;

        foreach ($pesanans as $pesanan) {
            $pricePerPcs = (float) ($pesanan->harga_jual_per_pcs ?? $pesanan->price_per_piece ?? 0);
            $qty = (int) ($pesanan->quantity ?: $pesanan->q ?: 0);

            $pesananSampleQty = (int) ($validated['sample_qtys'][$pesanan->id] ?? 1);

            $subtotal += ($pricePerPcs * $qty);
            $totalQuantity += $qty;
            $totalSampleQtyGlobal += $pesananSampleQty;
        }

        // --- LOGIKA HITUNG PAJAK OTOMATIS BERDASARKAN COMPANY PROFILE ---
        $taxAmount = 0;
        $companyProfile = $jobTicket->companyProfile;

        if ($companyProfile && $companyProfile->company_type === 'pkp') {
            $percentage = (float) ($companyProfile->tax_percentage ?? 0);
            // Menghitung nominal pajak dari persentase dikali subtotal penawaran
            $taxAmount = ($percentage / 100) * $subtotal;
        }

        $deliveryCost = (float) ($validated['delivery_cost'] ?? 0);
        $grandTotal = $subtotal + $taxAmount + $deliveryCost;

        $quotation = DB::transaction(function () use (
            $jobTicket,
            $pesanans,
            $validated,
            $totalQuantity,
            $totalSampleQtyGlobal,
            $subtotal,
            $taxAmount,
            $deliveryCost,
            $grandTotal
        ) {
            $quotation = $jobTicket->quotations()->create([
                'quotation_number' => $this->generateQuotationNumber(),
                'status' => 'draft',
                'valid_until' => $validated['valid_until'] ?? now()->addDays(30)->toDateString(),
                'sample_qty' => $totalSampleQtyGlobal,

                'payment_terms' => null,
                'delivery_terms' => null,
                'notes' => null,

                'price_per_pcs' => 0,
                'quantity' => $totalQuantity,
                'subtotal' => $subtotal,
                'tax' => $taxAmount, // Menyimpan snapshot hasil kalkulasi pajak
                'delivery_cost' => $deliveryCost,
                'grand_total' => $grandTotal,
                'created_by' => Auth::id(),
            ]);

            $notesToInsert = [];
            foreach($validated['notes'] as $noteContent) {
                if (!empty(trim(strip_tags($noteContent)))) {
                    $notesToInsert[] = ['notes' => $noteContent];
                }
            }
            if (count($notesToInsert) > 0) {
                $quotation->quotationNotes()->createMany($notesToInsert);
            }

            foreach ($pesanans as $pesanan) {
                $pesananSampleQty = (int) ($validated['sample_qtys'][$pesanan->id] ?? 1);
                $pesanan->update([
                    'sample_qty' => $pesananSampleQty,
                ]);

                $pricePerPcs = (float) ($pesanan->harga_jual_per_pcs ?? $pesanan->price_per_piece ?? 0);
                $qty = (int) ($pesanan->quantity ?: $pesanan->q ?: 0);

                $quotation->items()->create([
                    'pesanan_id' => $pesanan->id,
                    'item_name' => $pesanan->requested_product_name ?: $pesanan->produk ?: $pesanan->product_name,
                    'fabric' => $this->guessFabric($pesanan),
                    'print_method' => $this->guessPrintMethod($pesanan),
                    'quantity' => $qty,
                    'price_per_pcs' => $pricePerPcs,
                    'subtotal' => ($pricePerPcs * $qty),
                ]);

                $pesanan->workflowStatus()->updateOrCreate(
                    ['pesanan_id' => $pesanan->id],
                    ['quotation_created' => true]
                );
            }

            $jobTicket->update(['status' => 'Quotation']);

            return $quotation;
        });

        $this->generateQuotationPdf($quotation);

        return back()->with('success', 'Surat penawaran berhasil dibuat.');
    }

    private function generateQuotationNumber(): string
    {
        $prefix = 'QUO/' . date('Y/m');

        $last = Quotation::query()
            ->where('quotation_number', 'like', $prefix . '/%')
            ->latest('id')
            ->first();

        $nextNumber = 1;

        if ($last) {
            $parts = explode('/', $last->quotation_number);
            $nextNumber = ((int) end($parts)) + 1;
        }

        return $prefix . '/' . str_pad($nextNumber, 4, '0', STR_PAD_LEFT);
    }

    private function guessFabric(Pesanan $pesanan): ?string
    {
        return $pesanan->materialSpecs()
            ->where('type', 'bahan')
            ->first()?->material_name_snapshot;
    }

    private function guessPrintMethod(Pesanan $pesanan): ?string
    {
        return $pesanan->manufacturingSpecs()
            ->where('work_name_snapshot', 'like', '%sablon%')
            ->first()?->work_name_snapshot;
    }

    public function approve(Request $request, string $quotationId)
    {
        $validated = $request->validate([
            'approved_by_name' => ['nullable', 'string', 'max:255'],
            'signature' => ['nullable', 'file', 'mimes:jpg,jpeg,png', 'max:2048'],
            'sample_invoice_amount' => ['nullable', 'numeric', 'min:0'],
        ]);

        $quotation = Quotation::with([
            'jobTicket.pesanans.workflowStatus',
            'jobTicket.invoices',
        ])->findOrFail($quotationId);

        if ($quotation->status === 'approved') {
            abort(422, 'Quotation sudah disetujui.');
        }

        DB::transaction(function () use ($quotation, $validated, $request) {
            $signaturePath = $quotation->signature_path;

            if ($request->hasFile('signature')) {
                $signaturePath = $request->file('signature')->store('quotation-signatures', 'public');
            }

            $quotation->update([
                'status' => 'approved',
                'approved_at' => now(),
                'approved_by_name' => $validated['approved_by_name'] ?? null,
                'signature_path' => $signaturePath,
            ]);

            $jobTicket = $quotation->jobTicket;
            $pesanans = $jobTicket->pesanans;
            
            foreach ($pesanans as $pesanan) {
                $pesanan->workflowStatus()->updateOrCreate(
                    ['pesanan_id' => $pesanan->id],
                    [
                        'quotation_created' => true,
                        'quotation_approved' => true,
                    ]
                );
                
                $pesanan->jobTicket->workflowHistory()->create([
                    'step' => 'quotation',
                    'action' => 'approved',
                    'user_id' => Auth::id(),
                    'notes' => 'Surat penawaran disetujui customer.',
                ]);
            }
            
            // Buat Invoice Sample di level Job Ticket
            $this->generateSampleInvoiceIfNotExists(
                jobTicket: $jobTicket,
                quotation: $quotation,
                amount: (float) ($validated['sample_invoice_amount'] ?? 0)
            );

            $jobTicket->update([
                'status' => 'Sample Payment'
            ]);
        });

        $quotation->refresh();
        $this->generateQuotationPdf($quotation);

        return back()->with('success', 'Quotation disetujui dan invoice sample berhasil dibuat.');
    }

    private function generateSampleInvoiceIfNotExists(JobTicket $jobTicket, Quotation $quotation, float $amount): void
    {
        // Cek apakah invoice sample untuk Job Ticket ini sudah ada
        $exists = $jobTicket->invoices()
            ->where('kategori_invoice', 'sample')
            ->whereNotIn('status_tagihan', ['cancelled', 'Cancelled'])
            ->exists();

        if ($exists) {
            return;
        }

        if ($amount <= 0) {
            $amount = 0; // Pakai total quotation jika nominal tidak diset
        }

        // Buat invoice berelasi langsung dengan job_ticket
        $jobTicket->invoices()->create([
            'no_invoice' => $this->generateInvoiceNumber('SAMPLE'),
            'kategori_invoice' => 'sample',
            'total_tagihan' => $amount,
            'status_tagihan' => $amount == 0? 'paid' : 'unpaid',
            'tgl_jatuh_tempo' => now()->addDays(30)->toDateString(),
        ]);

        // Update status sample_invoice_created untuk semua pesanan dalam Job Ticket ini
        foreach ($jobTicket->pesanans as $pesanan) {
            $pesanan->workflowStatus()->updateOrCreate(
                ['pesanan_id' => $pesanan->id],
                [
                    'sample_invoice_created' => true,
                    'sample_paid' => $amount == 0 ? true : true,
                ]
            );
        }
    }

    private function generateInvoiceNumber(string $prefix): string
    {
        // Tetap sama
        $numberPrefix = $prefix . '/' . date('Y/m');
        $last = Invoice::query()->where('no_invoice', 'like', $numberPrefix . '/%')->latest('id')->first();
        $nextNumber = 1;
        if ($last) {
            $parts = explode('/', $last->no_invoice);
            $nextNumber = ((int) end($parts)) + 1;
        }
        return $numberPrefix . '/' . str_pad($nextNumber, 4, '0', STR_PAD_LEFT);
    }

    public function reject(Request $request, string $quotationId)
    {
        $request->validate([
            'rejection_note' => ['nullable', 'string'],
        ]);

        $quotation = Quotation::with('jobTicket.pesanans.workflowStatus')->findOrFail($quotationId);

        if ($quotation->status === 'approved') {
            abort(422, 'Quotation yang sudah approved tidak bisa ditolak.');
        }

        DB::transaction(function () use ($quotation, $request) {
            $quotation->update(['status' => 'rejected']);

            foreach ($quotation->jobTicket->pesanans as $pesanan) {
                $pesanan->workflowStatus()->updateOrCreate(
                    ['pesanan_id' => $pesanan->id],
                    ['quotation_approved' => false]
                );
    
                $pesanan->jobTicket->workflowHistory()->create([
                    'step' => 'quotation',
                    'action' => 'rejected',
                    'user_id' => Auth::id(),
                    'notes' => $request->rejection_note,
                ]);
            }
        });

        return back()->with('success', 'Quotation ditolak.');
    }

    private function generateQuotationPdf(Quotation $quotation): string
    {
        // Eager load seluruh relasi hingga ke sizeBreakdowns pesanan
        $quotation->load([
            'jobTicket.customer',
            'jobTicket.companyProfile',
            'jobTicket.pesanans.sizeBreakdowns', 
            'items',
        ]);

        $pdf = Pdf::loadView('pdf.quotations.show', [
            'quotation' => $quotation,
            'jobTicket' => $quotation->jobTicket,
            'customer' => $quotation->jobTicket->customer,
        ])->setPaper('a4', 'portrait');

        $safeNumber = str_replace(['/', '\\'], '-', $quotation->quotation_number);
        $path = "quotations/{$safeNumber}.pdf";

        Storage::disk('public')->put($path, $pdf->output());

        $quotation->update(['pdf_path' => $path]);

        return $path;
    }

    public function print(string $quotationId)
    {
        $quotation = Quotation::with([
            'jobTicket.customer',
            'jobTicket.companyProfile',
            'jobTicket.pesanans.sizeBreakdowns',
            'items',
            'quotationNotes',
        ])->findOrFail($quotationId);
        
        if (! $quotation->pdf_path || ! Storage::disk('public')->exists($quotation->pdf_path)) {
            $this->generateQuotationPdf($quotation);
            $quotation->refresh();
        }

        return response()->file(
            storage_path('app/public/' . $quotation->pdf_path)
        );
    }

    public function destroy(string $quotationId)
    {
        $quotation = Quotation::with('jobTicket.pesanans')->findOrFail($quotationId);
        $jobTicket = $quotation->jobTicket;

        if ($quotation->status === 'approved') {
            abort(422, 'Quotation yang sudah disetujui tidak bisa dihapus.');
        }

        $quotation->delete();

        // Rollback semua status pesanan jika tidak ada quotation lagi di job ticket
        if (!Quotation::where('job_ticket_id', $jobTicket->id)->exists()) {
            foreach ($jobTicket->pesanans as $pesanan) {
                $pesanan->workflowStatus()->updateOrCreate(
                    ['pesanan_id' => $pesanan->id],
                    [
                        'quotation_created' => false,
                        'quotation_approved' => false,
                    ]
                );
            }
        }

        return back()->with('success', 'Quotation berhasil dihapus.');
    }
}