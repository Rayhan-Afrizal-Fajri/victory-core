<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
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
        return Inertia::render('admin/invoices/Index');
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
    public function store(Request $request)
    {
        //
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
                'tgl_jatuh_tempo' => $request->tgl_jatuh_tempo
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

                $sample->pesanan->workflowHistory()->create([
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

                $sample->pesanan->workflowHistory()->create([
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
            'pesanan.customer',
            'payments',
        ])->findOrFail($invoiceId);

        $pdf = Pdf::loadView('pdf.invoices.show', [
            'invoice' => $invoice,
            'pesanan' => $invoice->pesanan,
            'customer' => $invoice->pesanan?->customer,
            'payments' => $invoice->payments,
        ])->setPaper('a4', 'portrait');

        // Sanitasi nama file: ubah garis miring menjadi strip
        $rawFilename = $invoice->no_invoice ?? 'invoice';
        $safeFilename = str_replace(['/', '\\'], '-', $rawFilename) . '.pdf';

        return $pdf->stream($safeFilename);
    }
}
