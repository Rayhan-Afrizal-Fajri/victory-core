<?php

namespace App\Http\Controllers\Admin;

use App\Notifications\SystemNotification;
use Illuminate\Support\Facades\Notification;
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
use App\Services\PurchasingService;
use Illuminate\Validation\ValidationException;

class QuotationController extends Controller
{
    public function __construct(
        // protected ProductionRunService $productionRunService,
        // protected InvoiceService $invoiceService,
        protected PurchasingService $purchasingService,
    ) {}
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

        $usersToNotify = User::permission('quotation.approve')->get();

        if ($usersToNotify->isNotEmpty()) {
            Notification::send($usersToNotify, new SystemNotification(
                'Setujui Surat Penawaran',
                "Surat Penawaran '{$pesanan->jobTicket->no_job_ticket}' telah dibuat, menunggu approval.",
                "/job-tickets/{$pesanan->job_ticket_id}?tab=costing%20%26%20quotation",
                'info'
            ));
        }

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
            
            $pesanansCalculated = [];
            $totalSampleInvoiceAmount = 0;
            
            $isFirstQuotation = $jobTicket->quotations()->where('id', '!=', $quotation->id)->doesntExist();

            // 1. Hitung total tagihan global
            foreach ($pesanans as $pesanan) {
                $workflow = $pesanan->workflowStatus;
                $qty = (int) $pesanan->sample_qty;
                
                // KONDISI BARU: Kapan kita harus memproses pesanan ini?
                // 1. Jika ini Quotation Pertama, ATAU
                // 2. Jika ada permintaan Revisi, ATAU
                // 3. Jika status quotation_approved-nya False (Berarti habis di-undo)
                $needsProcessing = (
                    $isFirstQuotation || 
                    $workflow?->sample_revision || 
                    !$workflow?->quotation_approved
                );

                // Jika pesanan ini TIDAK butuh diproses (karena sudah approved di penawaran sebelumnya)
                if (!$needsProcessing) {
                    $qty = 0; 
                }

                $price = (float) $pesanan->harga_sample_per_pcs;
                $subtotal = $qty * $price;

                if ($qty > 0) {
                    $pesanansCalculated[] = [
                        'pesanan_id' => $pesanan->id,
                        'name' => $pesanan->produk ?? 'Product Sample',
                        'qty' => $qty,
                        'price' => $price,
                        'subtotal' => $subtotal
                    ];
                }
                
                $totalSampleInvoiceAmount += $subtotal;
            }

            // 2. Update status per-pesanan secara spesifik
            foreach ($pesanans as $pesanan) {
                $workflow = $pesanan->workflowStatus;

                $needsProcessing = (
                    $isFirstQuotation || 
                    $workflow?->sample_revision || 
                    !$workflow?->quotation_approved
                );

                // JIKA TIDAK BUTUH DIPROSES: Lewati agar status yg sudah jalan tidak rusak
                if (!$needsProcessing) {
                    continue; 
                }
                
                // LOGIKA DI BAWAH HANYA JALAN UNTUK YANG MEMANG BUTUH DIPROSES
                $qty = (int) $pesanan->sample_qty;
                $price = (float) $pesanan->harga_sample_per_pcs;
                $itemTotal = $qty * $price;

                $isSampleFree = ($itemTotal <= 0);
                $isSampleNotRequired = ($qty <= 0);

                $pesanan->workflowStatus()->updateOrCreate(
                    ['pesanan_id' => $pesanan->id],
                    [
                        'quotation_created' => true,
                        'quotation_approved' => true,
                        // Sekarang sample_paid akan berhasil diset true jika item gratis
                        'sample_paid' => $isSampleFree ? true : false, 
                        'sample_approved' => $isSampleNotRequired,
                        'sample_materials_ready' => $isSampleNotRequired,
                        'sample_created' => $isSampleNotRequired,
                        'sample_started' => $isSampleNotRequired,
                        'sample_completed' => $isSampleNotRequired,
                        'sample_uploaded' => $isSampleNotRequired,
                        'sample_delivered' => $isSampleNotRequired,
                    ]
                );
                
                $pesanan->jobTicket->workflowHistory()->create([
                    'step' => 'quotation',
                    'action' => 'approved',
                    'user_id' => Auth::id(),
                    'notes' => 'Surat penawaran disetujui customer.',
                ]);
            }

            if ($totalSampleInvoiceAmount > 0) {
                $this->generateSampleInvoiceIfNotExists($jobTicket, $quotation, $pesanansCalculated);
                
                $jobTicket->update(['status' => 'Sample Payment']);
                
                $usersToNotify = User::permission('invoices.pay')->get();
                if ($usersToNotify->isNotEmpty()) {
                    Notification::send($usersToNotify, new SystemNotification(
                        'Invoice Sample telah dibuat',
                        "Invoice Sample untuk produk telah dibuat. Lakukan penagihan.",
                        "/job-tickets/{$jobTicket->id}?tab=invoices",
                        'info'
                    ));
                }
            } else {
                $jobTicket->update(['status' => 'Purchasing Sample']);

                $isPurchasingGenerated = false;

                // Jika total tagihan sample 0, maka langsung generate purchasing
                foreach($pesanans as $pesanan) {
                    $pesanan->refresh(); // Pastikan data terbaru, termasuk sample_paid yang baru saja diset True
                    
                    // Gunakan Service Purchasing
                    $generated = app(\App\Services\PurchasingService::class)->generateFromBom($pesanan);
                    $isPurchasingGenerated = $isPurchasingGenerated || $generated;
                }

                if ($isPurchasingGenerated) {
                    $usersToNotify = User::permission('purchasings.mark_ordered')->get();
                    if ($usersToNotify->isNotEmpty()) {
                        Notification::send($usersToNotify, new SystemNotification(
                            'Purchasing BOM Otomatis Dibuat',
                            "Penawaran disetujui tanpa biaya sample. Purchasing otomatis terbuat. Silakan lakukan pemesanan.",
                            "/job-tickets/{$jobTicket->id}?tab=purchasing",
                            'info'
                        ));
                    }
                }
            }
        });

        $quotation->refresh();

        return back()->with('success', 'Quotation disetujui. Workflow pesanan diperbarui.');
    }

    public function undoApprove(Request $request, string $quotationId)
    {
        $request->validate([
            'reason' => ['required', 'string', 'min:5', 'max:500'],
        ]);

        $quotation = Quotation::with([
            'jobTicket.pesanans.purchasing', // Pastikan relasi ke purchasing ada
            'jobTicket.invoices',
            'jobTicket.pesanans.workflowStatus'
        ])->findOrFail($quotationId);

        // 1. GUARD: Cek apakah sudah disetujui
        if ($quotation->status !== 'approved') {
            abort(422, 'Quotation belum disetujui atau sudah dibatalkan.');
        }

        $jobTicket = $quotation->jobTicket;

        // 2. GUARD: Cek status Purchasing
        // Pastikan tidak ada satupun item yang sudah dipesan (ordered/received)
        foreach ($jobTicket->pesanans as $pesanan) {
            $hasProcessedPurchasing = $pesanan->purchasing()
                ->whereIn('status', ['ordered', 'partial_received', 'received', 'cancelled'])
                ->exists();

            if ($hasProcessedPurchasing) {
                throw ValidationException::withMessages([
                    'undo' => 'Undo gagal: Sebagian atau seluruh material (BOM) sudah masuk proses pemesanan ke Supplier (Ordered/Received). Batalkan pemesanan di menu Purchasing terlebih dahulu.'
                ]);            
            }
        }

        // 3. GUARD: Cek status Invoice Sample
        // $hasPaidInvoice = $jobTicket->invoices()
        //     ->where('kategori_invoice', 'sample')
        //     ->where('status', 'verified') // Sesuaikan dengan status lunas di sistem Anda
        //     ->exists();

        // if ($hasPaidInvoice) {
        //     abort(422, 'Undo gagal: Invoice Sample sudah dibayar. Hubungi pihak Finance.');
        // }

        // 4. JALANKAN TRANSAKSI UNDO
        DB::transaction(function () use ($quotation, $jobTicket, $request) {
            
            // A. Reset Quotation
            $quotation->update([
                'status' => 'expired', // Atau 'sent' / 'draft' sesuai default sistem Anda
                'approved_at' => null,
                'approved_by_name' => null,
                // Opsional: hapus file signature jika diperlukan
                // 'signature_path' => null, 
            ]);

            // B. Hapus Invoice Sample yang belum dibayar
            $jobTicket->invoices()
                ->where('kategori_invoice', 'sample')
                ->whereIn('status_tagihan', ['unpaid', 'partially_paid'])
                ->delete();

            // C. Proses per-Pesanan
            foreach ($jobTicket->pesanans as $pesanan) {
                // Hapus data purchasing yang masih draft agar nanti bisa digenerate ulang dari BOM yang baru
                $pesanan->purchasing()->delete();

                // Reset Workflow Status
                $pesanan->workflowStatus()->updateOrCreate(
                    ['pesanan_id' => $pesanan->id],
                    [
                        // Buka kunci BOM dan Harga
                        'design_specs_completed' => false,
                        'price_approved' => false,
                        
                        // Batalkan status persetujuan
                        'quotation_created' => false,
                        'quotation_approved' => false,
                        
                        // Reset status Purchasing
                        'purchasing_generated' => false,
                        'materials_purchased' => false,
                        
                        // Reset status Sample (termasuk sample gratis yang tadi otomatis lunas)
                        'sample_invoice_created' => false,
                        'sample_paid' => false,
                        'sample_approved' => false,
                        'sample_materials_ready' => false,
                        'sample_created' => false,
                        'sample_started' => false,
                        'sample_completed' => false,
                        'sample_uploaded' => false,
                        'sample_delivered' => false,
                    ]
                );
            }

            // D. Kembalikan status Job Ticket ke tahap BOM/Pricing
            $jobTicket->update([
                'status' => 'BOM & Pricing' // Sesuaikan dengan nama status awal Anda
            ]);

            // E. Catat di History
            $jobTicket->workflowHistory()->create([
                'step' => 'quotation',
                'action' => 'undo_approved',
                'user_id' => Auth::id(),
                'notes' => 'Persetujuan Quotation dibatalkan. Alasan: ' . $request->reason,
            ]);
            
            // F. Notifikasi (Opsional: Beri tahu tim terkait)
            $usersToNotify = User::permission([
                'purchasings.generate', 'purchasings.create','purchasings.edit',
                'boms.sync', 'boms.sync','boms.create','boms.edit','boms.delete',
                'manufactures.create','manufactures.edit','manufactures.delete',
                ])->get();
            if ($usersToNotify->isNotEmpty()) {
                Notification::send($usersToNotify, new SystemNotification(
                    'Quotation Dibatalkan (Undo)',
                    "Persetujuan Quotation untuk {$jobTicket->no_job_ticket} dibatalkan. BOM dan Desain kembali terbuka untuk direvisi. Alasan: {$request->reason}",
                    "/job-tickets/{$jobTicket->id}",
                    'warning'
                ));
            }
        });

        return back()->with('success', 'Persetujuan Quotation berhasil dibatalkan. BOM dan Harga bisa direvisi kembali.');
    }

    private function generateSampleInvoiceIfNotExists(JobTicket $jobTicket, Quotation $quotation, array $pesanansCalculated): void
    {
        // 1. Cari invoice sample yang masih bisa ditambah (unpaid/partial)
        $unpaidInvoice = $jobTicket->invoices()
            ->where('kategori_invoice', 'sample')
            ->whereIn('status_tagihan', ['unpaid', 'partial_paid'])
            ->first();

        if ($unpaidInvoice) {
            // Jika invoice ada, tambahkan item baru ke invoice tersebut
            foreach ($pesanansCalculated as $data) {
                if ($data['qty'] > 0) {
                    $unpaidInvoice->items()->create([
                        'pesanan_id' => $data['pesanan_id'],
                        'item_name' => $data['name'],
                        'quantity' => $data['qty'],
                        'price_per_pcs' => $data['price'],
                        'subtotal' => $data['qty'] * $data['price'],
                    ]);
                }
            }
            
            // Update total tagihan berdasarkan jumlah subtotal item
            $newTotal = $unpaidInvoice->items()->sum('subtotal');
            $unpaidInvoice->update(['total_tagihan' => $newTotal]);
            
            return;
        }

        // 2. Jika tidak ada invoice unpaid, buat invoice baru beserta items-nya
        $invoice = $jobTicket->invoices()->create([
            'no_invoice' => $this->generateInvoiceNumber('SAMPLE'),
            'kategori_invoice' => 'sample',
            'total_tagihan' => array_sum(array_column($pesanansCalculated, 'subtotal')),
            'status_tagihan' => 'unpaid',
            'tgl_jatuh_tempo' => now()->addDays(30)->toDateString(),
        ]);

        foreach ($pesanansCalculated as $data) {
            if ($data['qty'] > 0) {
                $invoice->items()->create([
                    'pesanan_id' => $data['pesanan_id'],
                    'item_name' => $data['name'],
                    'quantity' => $data['qty'],
                    'price_per_pcs' => $data['price'],
                    'subtotal' => $data['subtotal'],
                ]);
            }

            if ($invoice) {
                $pesanan = Pesanan::with('workflowStatus')->find($data['pesanan_id']);
                $pesanan->workflowStatus()->updateOrCreate(
                    ['pesanan_id' => $pesanan->id],
                    [
                        'sample_invoice_created' => true,
                    ]
                );
            }
        }
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