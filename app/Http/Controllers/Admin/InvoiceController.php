<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\Pesanan;
use App\Services\InvoiceService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Barryvdh\DomPDF\Facade\Pdf;

class InvoiceController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $invoices = Invoice::query()
            ->with([
                'jobTicket.customer',
                'jobTicket.pesanans.workflowStatus',
                'payments',
            ])
            ->latest()
            ->get()
            ->map(fn ($invoice) => $this->mapInvoice($invoice))
            ->values();

        // $eligibleJobTickets = Pesanan::query()
        //     ->with([
        //         'customer',
        //         'workflowStatus',
        //         'quotations',
        //         'invoices.payments',
        //     ])
        //     ->latest()
        //     ->get()
        //     ->map(fn ($pesanan) => $this->mapEligibleJobTicket($pesanan))
        //     ->filter(fn ($ticket) => count($ticket['available_invoice_categories']) > 0)
        //     ->values();

        return Inertia::render('admin/invoices/Index', [
            'invoices' => $invoices,
            // 'eligibleJobTickets' => $eligibleJobTickets,
        ]);
    }

    private function mapInvoice(Invoice $invoice): array
    {
        $jobTicket = $invoice->jobTicket;
        $payments = $invoice->payments ?? collect();

        return [
            'id' => $invoice->id,

            'job_ticket_id' => $invoice->job_ticket_id,

            'jobTicket' => $jobTicket ? [
                'id' => $jobTicket->id,
                'no_job_ticket' => $jobTicket->no_job_ticket,

                'customer' => [
                    'id' => $jobTicket->customer?->id,
                    'nama' => $jobTicket->customer?->nama,
                    'nama_perusahaan' => $jobTicket->customer?->nama_perusahaan,
                    'email' => $jobTicket->customer?->user?->email,
                    'no_hp' => $jobTicket->customer?->no_hp,
                ],

                'company_profile' => [
                    'id' => $jobTicket->companyProfile?->id,
                    'company_name' => $jobTicket->companyProfile?->company_name,
                    'company_type' => $jobTicket->companyProfile?->company_type,
                    'bank_type' => $jobTicket->companyProfile?->bank_type,
                    'account_number' => $jobTicket->companyProfile?->account_number,
                    'address' => $jobTicket->companyProfile?->address,
                ],

                'deadline' => $jobTicket->deadline,
                'customer_notes' => $jobTicket->customer_notes,
                'status' => $jobTicket->status,
                'created_at' => optional($jobTicket->created_at)->toDateTimeString(),
            ] : null,

            'no_invoice' => $invoice->no_invoice,

            'kategori_invoice' => $invoice->kategori_invoice,

            'total_tagihan' => (float) $invoice->total_tagihan,

            'status_tagihan' => $invoice->status_tagihan,

            'tgl_jatuh_tempo' => $invoice->tgl_jatuh_tempo,

            'payments' => $payments->map(fn ($payment) => [

                'id' => $payment->id,

                'jumlah_bayar' => (float) $payment->jumlah_bayar,

                'amount' => (float) $payment->jumlah_bayar,

                'tgl_bayar' => $payment->tgl_bayar,

                'date' => $payment->tgl_bayar,

                'metode_pembayaran' => $payment->metode_pembayaran,

                'method' => $payment->metode_pembayaran,

                'status' => $payment->status,

                'verified_at' => optional($payment->verified_at)?->toDateTimeString(),

                'verified_by' => $payment->verified_by,

                'bukti_transfer_path' => $payment->bukti_transfer_path,

                'catatan_finance' => $payment->catatan_finance,

                'rejection_note' => $payment->rejection_note,

                'created_at' => optional($payment->created_at)->toDateTimeString(),

                'updated_at' => optional($payment->updated_at)->toDateTimeString(),

            ])->values(),

            // Legacy frontend
            'title' => $invoice->title ?? 'Invoice',

            'amount' => (float) $invoice->total_tagihan,

            'status' => $invoice->status_tagihan,

            'due_date' => $invoice->tgl_jatuh_tempo,

            'created_at' => optional($invoice->created_at)->toDateTimeString(),

            'updated_at' => optional($invoice->updated_at)->toDateTimeString(),
        ];
    }

    private function mapEligibleJobTicket(Pesanan $pesanan): array
    {
        $activeInvoices = $pesanan->invoices
            ->filter(fn ($invoice) => ! in_array($invoice->status_tagihan, ['cancelled', 'Cancelled']));

        $hasSampleInvoice = $activeInvoices
            ->contains(fn ($invoice) => $invoice->kategori_invoice === 'sample');

        $hasProductionInvoice = $activeInvoices
            ->contains(fn ($invoice) => $invoice->kategori_invoice === 'production');

        $workflow = $pesanan->workflowStatus;

        $availableCategories = [];

        if (($workflow?->quotation_approved ?? false) && ! $hasSampleInvoice) {
            $availableCategories[] = [
                'value' => 'sample',
                'label' => 'Sample',
                'default_amount' => $this->calculateSampleInvoiceAmount($pesanan),
            ];
        }

        if (($workflow?->sample_approved ?? false) && ! $hasProductionInvoice) {
            $availableCategories[] = [
                'value' => 'production',
                'label' => 'Production',
                'default_amount' => $this->calculateProductionInvoiceAmount($pesanan),
            ];
        }

        return [
            'id' => $pesanan->id,
            'no_job_ticket' => $pesanan->no_job_ticket,
            'produk' => $pesanan->requested_product_name ?: $pesanan->produk,
            'customer' => $pesanan->customer?->nama_perusahaan
                ?? $pesanan->customer?->nama
                ?? $pesanan->customer_perusahaan_snapshot
                ?? '-',
            'quantity' => (int) ($pesanan->quantity ?: $pesanan->q ?: 0),
            'sample_qty' => (int) ($pesanan->sample_qty ?: 1),
            'harga_jual_per_pcs' => (float) ($pesanan->harga_jual_per_pcs ?: 0),
            'available_invoice_categories' => $availableCategories,
        ];
    }

    private function calculateSampleInvoiceAmount(Pesanan $pesanan): float
    {
        $sampleQty = (int) ($pesanan->sample_qty ?: 1);
        $pricePerPcs = (float) ($pesanan->harga_jual_per_pcs ?: 0);

        return $sampleQty * $pricePerPcs;
    }

    private function calculateProductionInvoiceAmount(Pesanan $pesanan): float
    {
        $quotation = $pesanan->quotations()
            ->where('status', 'approved')
            ->latest()
            ->first();

        if ($quotation) {
            return (float) $quotation->grand_total;
        }

        $quantity = (int) ($pesanan->quantity ?: $pesanan->q ?: 0);
        $pricePerPcs = (float) ($pesanan->harga_jual_per_pcs ?: 0);

        return $quantity * $pricePerPcs;
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request, InvoiceService $invoiceService)
    {
        $validated = $request->validate([
            'pesanan_id' => ['required', 'exists:pesanan,id'],
            'kategori_invoice' => ['required', 'in:sample,production'],
            'total_tagihan' => ['required', 'numeric', 'min:1'],
            'tgl_jatuh_tempo' => ['nullable', 'date'],
            'title' => ['nullable', 'string', 'max:255'],
        ]);

        $pesanan = Pesanan::with(['workflowStatus', 'invoices'])->findOrFail($validated['pesanan_id']);

        $exists = $pesanan->invoices()
            ->where('kategori_invoice', $validated['kategori_invoice'])
            ->whereNotIn('status_tagihan', ['cancelled', 'Cancelled'])
            ->exists();

        if ($exists) {
            abort(422, 'Job ticket ini sudah memiliki invoice aktif untuk kategori tersebut.');
        }

        if ($validated['kategori_invoice'] === 'sample' && ! $pesanan->workflowStatus?->quotation_approved) {
            abort(422, 'Invoice sample hanya bisa dibuat setelah quotation approved.');
        }

        if ($validated['kategori_invoice'] === 'production' && ! $pesanan->workflowStatus?->sample_approved) {
            abort(422, 'Invoice production hanya bisa dibuat setelah sample approved.');
        }

        DB::transaction(function () use ($pesanan, $validated, $invoiceService) {
            $prefix = $validated['kategori_invoice'] === 'sample' ? 'SAMPLE' : 'PROD';

            $pesanan->invoices()->create([
                'no_invoice' => $invoiceService->generate($prefix),
                'kategori_invoice' => $validated['kategori_invoice'],
                'title' => $validated['title']
                    ?: ($validated['kategori_invoice'] === 'sample'
                        ? 'Invoice Sample - ' . ($pesanan->requested_product_name ?: $pesanan->produk)
                        : 'Invoice Production - ' . ($pesanan->requested_product_name ?: $pesanan->produk)),
                'total_tagihan' => $validated['total_tagihan'],
                'status_tagihan' => 'unpaid',
                'tgl_jatuh_tempo' => now()->addDays(30)->toDateString(),
            ]);

            $workflowPayload = [];

            if ($validated['kategori_invoice'] === 'sample') {
                $workflowPayload['sample_invoice_created'] = true;
            }

            if ($validated['kategori_invoice'] === 'production') {
                $workflowPayload['production_invoice_created'] = true;
                $workflowPayload['production_dp_paid'] = false;
                $workflowPayload['final_payment_paid'] = false;
            }

            if ($workflowPayload) {
                $pesanan->workflowStatus()->updateOrCreate(
                    ['pesanan_id' => $pesanan->id],
                    $workflowPayload
                );
            }

            $pesanan->jobTicket->workflowHistory()->create([
                'step' => 'invoice',
                'action' => 'manual_created',
                'user_id' => Auth::id(),
                'notes' => 'Invoice manual dibuat dari menu Invoice.',
            ]);
        });

        return back()->with('success', 'Invoice berhasil dibuat.');
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id, InvoiceService $invoiceService)
    {
        $request->validate([
            'total_tagihan' => ['required', 'numeric', 'min:0'],
            'tgl_jatuh_tempo' => ['nullable', 'date'],
        ]);

        $invoice = Invoice::with([
            'payments',
            'sample.pesanan.workflowStatus',
        ])->findOrFail($id);

        $hasVerifiedPayment = $invoice->payments()
            ->where('status', 'verified')
            ->exists();

        if ($hasVerifiedPayment) {
            abort('422', 'Invoice tidak dapat diedit karena sudah memiliki payment terverifikasi');
        }

        if (in_array($invoice->status_tagihan, ['paid', 'Paid'])) {
            abort(422, 'Invoice lunas tidak bisa diedit.');
        }

        if (in_array($invoice->status_tagihan, ['cancelled', 'Cancelled'])) {
            abort(422, 'Invoice yang sudah dibatalkan tidak bisa diedit.');
        }

        DB::transaction(function () use ($request, $invoice, $invoiceService){
            $invoice->update([
                'total_tagihan' => $request->total_tagihan,
                'tgl_jatuh_tempo' => $request->tgl_jatuh_tempo,
            ]);

            $invoice = $invoiceService->recalculateStatus($invoice);

            $sample = $invoice->sample;
            if ($sample) {
                $sample->update([
                    'sample_price' => $request->total_tagihan,
                    'status' => 'waiting_payment',
                    'paid_at' => null,
                ]);

                $sample->pesanan->workflowStatus()->update([
                    'sample_paid' => false,
                ]);

                $sample->pesanan->jobTicket->workflowHistory()->create([
                    'step' => 'sample',
                    'action' => 'invoice_updated',
                    'user_id' => Auth::user()->id,
                    'notes' => 'Invoice sample diperbarui'
                ]);
            }
        });

        return back()->with('success', 'Invoice berhasil diperbarui.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }

    public function cancel(string $id)
    {
        $invoice = Invoice::with([
            'payments',
            'sample.pesanan.workflowStatus',
        ])->findOrFail($id);

        $hasVerifiedPayment = $invoice->payments()
            ->where('status', 'verified')
            ->exists();

        if ($hasVerifiedPayment) {
            abort(422, 'Invoice tidak bisa dibatalkan karena sudah memiliki payment terverifikasi');
        }

        if (in_array($invoice->status_tagihan, ['paid', 'Paid'])) {
            abort(422, 'Invoice lunas tidak bisa dibatalkan');
        }

        if (in_array($invoice->status_tagihan, ['cancelled', 'Cancelled'])) {
            abort(422, 'Invoice sudah dibatalkan');
        }

        DB::transaction(function() use ($invoice){
            $invoice->update([
                'status_tagihan' => 'cancelled',
            ]);

            $sample = $invoice->sample;
            if ($sample) {
                $sample->update([
                    'invoice_id' => null,
                    'is_chargeable' => false,
                    'status' => 'paid',
                    'paid_at' => now(),
                ]);

                $sample->pesanan->workflowStatus()->update([
                    'sample_paid' => true,
                ]);

                $sample->pesanan->jobTicket->workflowHistory()->create([
                    'step' => 'sample',
                    'action' => 'invoice_cancelled',
                    'user_id' => Auth::user()->id,
                    'notes' => 'Invoice sample dibatalkan. Sample dianggap tanpa biaya.', 
                ]);
            }
        }); 

        return back()->with('success', 'Invoice berhasil dibatalkan.');
    }

    public function print(string $invoiceId)
    {
        $invoice = Invoice::with([
            'jobTicket.customer',
            'jobTicket.companyProfile',
            'jobTicket.pesanans.sizeBreakdowns',
            'payments',
            'items.pesanan',
        ])->findOrFail($invoiceId);

        // OPTIMASI: Filter langsung dari data yang sudah di-load, 
        // tidak perlu query ulang ke database.
        $pesanans = $invoice->jobTicket->pesanans->filter(function ($pesanan) {
            // Tampilkan jika Qty > 0 (Harga 0 / gratis akan tetap ikut tampil)
            return $pesanan->sample_qty > 0;
        })->values(); // values() berguna untuk merapikan ulang index array

        $pdf = Pdf::loadView('pdf.invoices.show', [
            'invoice' => $invoice,
            'company' => $invoice->jobTicket->companyProfile,
            'items' => $invoice->items,
            'customer' => $invoice->jobTicket->customer,
            'payments' => $invoice->payments,
        ])->setPaper('a4', 'portrait');

        // Sanitasi nama file: ubah garis miring menjadi strip
        $rawFilename = $invoice->no_invoice ?? 'invoice';
        $safeFilename = str_replace(['/', '\\'], '-', $rawFilename) . '.pdf';

        return $pdf->stream($safeFilename);
    }
}
