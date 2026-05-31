<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\Pesanan;
use App\Models\Quotation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Storage;

class QuotationController extends Controller
{
    public function generate(Request $request, string $pesananId)
    {
        $validated = $request->validate([
            'valid_until' => ['nullable', 'date'],
            'payment_terms' => ['nullable', 'string'],
            'delivery_terms' => ['nullable', 'string'],
            'notes' => ['nullable', 'string'],
            'tax' => ['nullable', 'numeric', 'min:0'],
            'delivery_cost' => ['nullable', 'numeric', 'min:0'],
            'fabric' => ['nullable', 'string'],
            'print_method' => ['nullable', 'string'],
        ]);

        $pesanan = Pesanan::with([
            'customer',
            'workflowStatus',
            'materialSpecs',
            'manufacturingSpecs',
        ])->findOrFail($pesananId);

        if (! $pesanan->harga_jual_per_pcs || $pesanan->harga_jual_per_pcs <= 0) {
            abort(422, 'Harga jual final belum ditentukan.');
        }

        $quantity = (int) ($pesanan->quantity ?: $pesanan->q ?: 0);

        if ($quantity <= 0) {
            abort(422, 'Quantity order belum valid.');
        }

        $pricePerPcs = (float) $pesanan->harga_jual_per_pcs;
        $subtotal = $pricePerPcs * $quantity;
        $tax = (float) ($validated['tax'] ?? 0);
        $deliveryCost = (float) ($validated['delivery_cost'] ?? 0);
        $grandTotal = $subtotal + $tax + $deliveryCost;

        $quotation = DB::transaction(function () use (
            $pesanan,
            $validated,
            $quantity,
            $pricePerPcs,
            $subtotal,
            $tax,
            $deliveryCost,
            $grandTotal
        ) {
            $quotation = $pesanan->quotations()->create([
                'quotation_number' => $this->generateQuotationNumber(),
                'status' => 'draft',
                'valid_until' => $validated['valid_until'] ?? now()->addDays(30)->toDateString(),
                'payment_terms' => $validated['payment_terms']
                    ?? 'Setelah sample approve, customer melakukan down payment sebesar 50% dari nilai order. Sisa pembayaran dilakukan sebelum pengiriman.',
                'delivery_terms' => $validated['delivery_terms']
                    ?? 'Estimasi delivery 10–14 hari kerja dari DP dan ACC sample.',
                'notes' => $validated['notes']
                    ?? 'Harga sudah termasuk bahan, proses produksi, dan packing. Harga belum termasuk delivery dan pajak.',
                'price_per_pcs' => $pricePerPcs,
                'quantity' => $quantity,
                'subtotal' => $subtotal,
                'tax' => $tax,
                'delivery_cost' => $deliveryCost,
                'grand_total' => $grandTotal,
                'created_by' => Auth::id(),
            ]);

            $quotation->items()->create([
                'item_name' => $pesanan->requested_product_name ?: $pesanan->produk,
                'fabric' => $validated['fabric'] ?? $this->guessFabric($pesanan),
                'print_method' => $validated['print_method'] ?? $this->guessPrintMethod($pesanan),
                'quantity' => $quantity,
                'price_per_pcs' => $pricePerPcs,
                'subtotal' => $subtotal,
            ]);

            $pesanan->workflowStatus()->updateOrCreate(
                ['pesanan_id' => $pesanan->id],
                [
                    'quotation_created' => true,
                    'quotation_approved' => false,
                ]
            );

            $pesanan->workflowHistory()->create([
                'step' => 'quotation',
                'action' => 'generated',
                'user_id' => Auth::id(),
                'notes' => 'Surat penawaran dibuat.',
            ]);

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
            'pesanan.workflowStatus',
            'pesanan.invoices',
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

            $pesanan = $quotation->pesanan;

            $pesanan->workflowStatus()->updateOrCreate(
                ['pesanan_id' => $pesanan->id],
                [
                    'quotation_created' => true,
                    'quotation_approved' => true,
                ]
            );

            $this->generateSampleInvoiceIfNotExists(
                pesanan: $pesanan,
                quotation: $quotation,
                amount: (float) ($validated['sample_invoice_amount'] ?? 0)
            );

            $pesanan->workflowHistory()->create([
                'step' => 'quotation',
                'action' => 'approved',
                'user_id' => Auth::id(),
                'notes' => 'Surat penawaran disetujui customer dan invoice sample dibuat.',
            ]);
        });

        $quotation->refresh();
        $this->generateQuotationPdf($quotation);

        return back()->with('success', 'Quotation disetujui dan invoice sample berhasil dibuat.');
    }

    private function generateSampleInvoiceIfNotExists(Pesanan $pesanan, Quotation $quotation, float $amount): void
    {
        $exists = $pesanan->invoices()
            ->where('kategori_invoice', 'sample')
            ->whereNotIn('status_tagihan', ['cancelled', 'Cancelled'])
            ->exists();

        if ($exists) {
            return;
        }

        // Jika amount tidak diisi, gunakan default 3 pcs x harga jual final.
        // Bisa kamu ganti sesuai kebijakan bisnis.
        if ($amount <= 0) {
            $amount = ((float) $quotation->price_per_pcs) * 3;
        }

        $pesanan->invoices()->create([
            'no_invoice' => $this->generateInvoiceNumber('SAMPLE'),
            'kategori_invoice' => 'sample',
            'title' => 'Invoice Sample - ' . ($pesanan->requested_product_name ?: $pesanan->produk),
            'total_tagihan' => $amount,
            'status_tagihan' => 'unpaid',
            'tgl_jatuh_tempo' => now()->addDays(3)->toDateString(),
        ]);

        $pesanan->workflowStatus()->updateOrCreate(
            ['pesanan_id' => $pesanan->id],
            [
                'sample_invoice_created' => true,
                'sample_paid' => false,
            ]
        );
    }

    private function generateInvoiceNumber(string $prefix): string
    {
        $numberPrefix = $prefix . '/' . date('Y/m');

        $last = Invoice::query()
            ->where('no_invoice', 'like', $numberPrefix . '/%')
            ->latest('id')
            ->first();

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

        $quotation = Quotation::with('pesanan.workflowStatus')->findOrFail($quotationId);

        if ($quotation->status === 'approved') {
            abort(422, 'Quotation yang sudah approved tidak bisa ditolak.');
        }

        DB::transaction(function () use ($quotation, $request) {
            $quotation->update([
                'status' => 'rejected',
            ]);

            $quotation->pesanan->workflowStatus()->updateOrCreate(
                ['pesanan_id' => $quotation->pesanan->id],
                [
                    'quotation_approved' => false,
                ]
            );

            $quotation->pesanan->workflowHistory()->create([
                'step' => 'quotation',
                'action' => 'rejected',
                'user_id' => Auth::id(),
                'notes' => $request->rejection_note,
            ]);
        });

        return back()->with('success', 'Quotation ditolak.');
    }

    private function generateQuotationPdf(Quotation $quotation): string
    {
        $quotation->load([
            'pesanan.customer',
            'pesanan.sizeBreakdowns',
            'items',
        ]);

        $pdf = Pdf::loadView('pdf.quotations.show', [
            'quotation' => $quotation,
            'pesanan' => $quotation->pesanan,
            'customer' => $quotation->pesanan->customer,
        ])->setPaper('a4', 'potrait');

        $safeNumber = str_replace(['/', '\\'], '-', $quotation->quotation_number);

        $path = "quotations/{$safeNumber}.pdf";

        Storage::disk('public')->put($path, $pdf->output());

        $quotation->update([
            'pdf_path' => $path,
        ]);

        return $path;
    }

    public function print(string $quotationId)
    {
        $quotation = Quotation::with([
            'pesanan.customer',
            'pesanan.sizeBreakdowns',
            'items',
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
        $quotation = Quotation::findOrFail($quotationId);

        if ($quotation->status === 'approved') {
            abort(422, 'Quotation yang sudah disetujui tidak bisa dihapus.');
        }

        $quotation->delete();

        return back()->with('success', 'Quotation berhasil dihapus.');
    }
}