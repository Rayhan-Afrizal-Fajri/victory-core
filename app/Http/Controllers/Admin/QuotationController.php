<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\JobTicket;
use App\Models\Pesanan;
use App\Models\Quotation;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Barryvdh\DomPDF\Facade\Pdf;

class QuotationController extends Controller
{
    // Ubah parameter agar mengambil berdasarkan JobTicket
    public function generate(Request $request, string $jobTicketId)
    {
        $validated = $request->validate([
            'valid_until' => ['nullable', 'date'],
            'sample_qtys' => ['required', 'array'],
            'sample_qtys.*' => ['required', 'integer', 'min:0'],
            'sample_prices' => ['required', 'array'],
            'sample_prices.*' => ['required', 'numeric', 'min:0'],
            'payment_terms' => ['nullable', 'string'],
            'delivery_terms' => ['nullable', 'string'],
            'notes' => ['required', 'array', 'min:1'],
            'notes.*' => ['nullable', 'string'],
            'delivery_cost' => ['nullable', 'numeric', 'min:0'],
        ]);

        // Ambil Job Ticket beserta Company Profile pendukungnya
        $jobTicket = JobTicket::with([
            'customer',
            'companyProfile', 
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
            $pesananSampleQty = (int) ($validated['sample_qtys'][$pesanan->id] ?? 0);
            $pesananSamplePrice = (float) ($validated['sample_prices'][$pesanan->id] ?? 0);

            // VALIDASI RULE: Harga sample tidak boleh diisi jika quantity pesanan (sample) 0
            if ($pesananSampleQty === 0 && $pesananSamplePrice > 0) {
                $namaProduk = $pesanan->requested_product_name ?: $pesanan->produk ?: $pesanan->product_name;
                abort(422, "Harga sample untuk produk [{$namaProduk}] harus Rp 0 karena Quantity Sample adalah 0.");
            }

            $pricePerPcs = (float) ($pesanan->harga_jual_per_pcs ?? $pesanan->price_per_piece ?? 0);
            $qty = (int) ($pesanan->quantity ?: $pesanan->q ?: 0);

            $subtotal += ($pricePerPcs * $qty);
            $totalQuantity += $qty;
            $totalSampleQtyGlobal += $pesananSampleQty;
        }

        // --- LOGIKA HITUNG PAJAK OTOMATIS BERDASARKAN COMPANY PROFILE ---
        $taxAmount = 0;
        $companyProfile = $jobTicket->companyProfile;

        if ($companyProfile && $companyProfile->company_type === 'pkp') {
            $percentage = (float) ($companyProfile->tax_percentage ?? 0);
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
                'tax' => $taxAmount, 
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
                $pesananSampleQty = (int) ($validated['sample_qtys'][$pesanan->id] ?? 0);
                $pesananSamplePrice = (float) ($validated['sample_prices'][$pesanan->id] ?? 0);
                
                $pesanan->update([
                    'sample_qty' => $pesananSampleQty,
                    'harga_sample_per_pcs' => $pesananSamplePrice,
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

        // $this->generateQuotationPdf($quotation);

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
            
            // --- LOGIKA PERHITUNGAN INVOICE SAMPLE OTOMATIS ---
            $totalSampleInvoiceAmount = 0;

            $isFirstQuotation = $jobTicket->invoices->isEmpty();
            // 1. Hitung total tagihan global untuk menentukan apakah invoice perlu dicetak
            foreach ($pesanans as $pesanan) {
                $qty = (int) $pesanan->sample_qty;
                
                // JIKA INI BUKAN QUOTATION PERTAMA (Artinya ada revisi/pembuatan ulang)
                if (!$isFirstQuotation) {
                    // Baru kita terapkan filter:
                    // Jika pesanan ini TIDAK minta revisi, berarti sebelumnya sudah approved, jadikan qty 0
                    if (!$pesanan->workflowStatus?->sample_revision) {
                        $qty = 0; 
                    }
                }
                // Jika ini Quotation Pertama, logika `if (!$isFirstQuotation)` diabaikan,
                // sehingga $qty tetap utuh nilainya sesuai inputan user.

                $price = (float) $pesanan->harga_sample_per_pcs;
                $totalSampleInvoiceAmount += ($qty * $price);
            }

            // dd($totalSampleInvoiceAmount, 'Total Sample Invoice Amount', $pesanans); // Debugging line

            $isGlobalInvoiceZero = ($totalSampleInvoiceAmount <= 0);

            // dd($isGlobalInvoiceZero, 'Is Global Invoice Zero', $totalSampleInvoiceAmount, 'Total Sample Invoice Amount'); // Debugging line

            // 2. Update status per-pesanan secara spesifik
            foreach ($pesanans as $pesanan) {
                $qty = (int) $pesanan->sample_qty;
                $price = (float) $pesanan->harga_sample_per_pcs;
                $itemTotal = $qty * $price;

                // Cek khusus untuk item ini: Apakah dia gratis atau qty-nya 0 (karena sudah approved sebelumnya)?
                $isThisPesananFreeOrNotNeeded = ($itemTotal <= 0);

                $pesanan->workflowStatus()->updateOrCreate(
                    ['pesanan_id' => $pesanan->id],
                    [
                        'quotation_created' => true,
                        'quotation_approved' => true,
                        // ✅ FIX: Otomatis lunas (true) HANYA untuk pesanan yang tagihannya 0 di penawaran ini
                        'sample_paid' => $isThisPesananFreeOrNotNeeded ? true : false, 
                    ]
                );
                
                $pesanan->jobTicket->workflowHistory()->create([
                    'step' => 'quotation',
                    'action' => 'approved',
                    'user_id' => Auth::id(),
                    'notes' => 'Surat penawaran disetujui customer.',
                ]);
            }
            
            // 3. Generate Invoice hanya jika nominal GLOBAL-nya lebih dari 0
            if (!$isGlobalInvoiceZero) {
                $this->generateSampleInvoiceIfNotExists(
                    jobTicket: $jobTicket,
                    quotation: $quotation,
                    amount: $totalSampleInvoiceAmount
                );

                $jobTicket->update([
                    'status' => 'Sample Payment'
                ]);
            } else {
                // Jika semua pesanan tagihannya 0, langsung ubah status JT ke proses selanjutnya
                $jobTicket->update([
                    'status' => 'Purchasing Sample'
                ]);
            }
        });

        $quotation->refresh();
        // $this->generateQuotationPdf($quotation);

        return back()->with('success', 'Quotation disetujui. Workflow pesanan diperbarui.');
    }

    private function generateSampleInvoiceIfNotExists(JobTicket $jobTicket, Quotation $quotation, float $amount): void
    {
        // 1. Cari invoice sample yang statusnya masih 'unpaid' atau 'partial_paid'
        $unpaidInvoice = $jobTicket->invoices()
            ->where('kategori_invoice', 'sample')
            ->whereIn('status_tagihan', ['unpaid', 'partial_paid']) // Cari yang masih bisa ditambah tagihannya
            ->first();

        // dd($unpaidInvoice, 'Unpaid Invoice', $amount, 'Amount to Add'); // Debugging line

        // 2. Jika ada invoice unpaid, UPDATE total tagihannya
        if ($unpaidInvoice) {
            $newTotal = (float)$unpaidInvoice->total_tagihan + $amount;
            
            $unpaidInvoice->update([
                'total_tagihan' => $newTotal,
                // Jika total jadi 0, mungkin bisa dianggap paid (tapi jarang terjadi di sini)
                'status_tagihan' => $newTotal > 0 ? 'unpaid' : 'paid',
            ]);
            
            // Update workflow flag untuk pesanan yang baru saja direvisi
            $this->updateWorkflowFlags($jobTicket, true);
            return;
        }

        // 3. Jika tidak ada invoice unpaid (mungkin sudah lunas / belum pernah dibuat),
        // kita buat invoice baru
        $jobTicket->invoices()->create([
            'no_invoice' => $this->generateInvoiceNumber('SAMPLE'),
            'kategori_invoice' => 'sample',
            'total_tagihan' => $amount,
            'status_tagihan' => $amount == 0 ? 'paid' : 'unpaid',
            'tgl_jatuh_tempo' => now()->addDays(30)->toDateString(),
        ]);

        // Update workflow flag
        $this->updateWorkflowFlags($jobTicket, ($amount == 0));
    }

    /**
     * Helper untuk update workflow agar tidak redundant
     */
    private function updateWorkflowFlags(JobTicket $jobTicket, bool $isPaid): void
    {
        foreach ($jobTicket->pesanans as $pesanan) {
            // Cek kembali: Apakah pesanan ini secara individu punya tagihan sample?
            // Jika tidak, tetap set paid = true
            $isThisPesananFree = ($pesanan->sample_qty * $pesanan->harga_sample_per_pcs) <= 0;

            $pesanan->workflowStatus()->updateOrCreate(
                ['pesanan_id' => $pesanan->id],
                [
                    'sample_invoice_created' => true,
                    'sample_paid' => $isThisPesananFree ? true : $isPaid, 
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

    private function generateQuotationPdf(Quotation $quotation)
    {
        $quotation->load([
            'jobTicket.customer',
            'jobTicket.companyProfile',
            'jobTicket.pesanans.sizeBreakdowns',
            'items',
            'quotationNotes',
        ]);

        $owner = User::whereHas('roles', function ($query) {
            $query->where('name', 'Owner');
        })->first();

        return Pdf::loadView('pdf.quotations.show', [
            'quotation' => $quotation,
            'jobTicket' => $quotation->jobTicket,
            'customer' => $quotation->jobTicket->customer,
            'owner' => $owner,
        ])->setPaper('a4', 'portrait');
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

        $pdf = $this->generateQuotationPdf($quotation);

        $search = array('/', '\\');
        // Perform the replacement
        $quo_number = str_replace($search, '-', $quotation->quotation_number);
        return $pdf->stream(
            "quotation-{$quo_number}.pdf"
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