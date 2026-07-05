<?php

namespace App\Services;

use App\Models\Invoice;
use App\Models\JobTicket;

class InvoiceService
{
    public function generate(string $prefix = 'INV'): string
    {
        $date = now()->format('Ymd');

        $latestInvoice = Invoice::query()
            ->whereDate('created_at', today())
            ->where('no_invoice', 'like', "{$prefix}-{$date}-%")
            ->latest('id')
            ->first();

        $nextNumber = 1;

        if ($latestInvoice) {
            $lastNumber = (int) substr($latestInvoice->no_invoice, strrpos($latestInvoice->no_invoice, '-') + 1);
            $nextNumber = $lastNumber + 1;
        }

        return "{$prefix}-{$date}-" . str_pad($nextNumber, 4, '0', STR_PAD_LEFT);
    }

    public function recalculateStatus(Invoice $invoice): Invoice
    {
        $totalPaid = $invoice->payments()
            ->where('status', 'verified')
            ->sum('jumlah_bayar');

        if ($totalPaid <= 0) {
            $status = 'unpaid';
        } elseif ($totalPaid < $invoice->total_tagihan) {
            $status = 'partially_paid';
        } else {
            $status = 'paid';
        }

        $invoice->update([
            'status_tagihan' => $status,
        ]);

        return $invoice->refresh();
    }

    public function ensureProductionInvoice(JobTicket $jobTicket): void
    {
        $jobTicket->loadMissing([
            'pesanans.workflowStatus',
            'pesanans.purchasing',
            'quotations',
            'invoices',
        ]);

        // Sudah pernah dibuat?
        if (
            $jobTicket->invoices()
                ->where('kategori_invoice', 'produksi')
                ->whereNotIn('status_tagihan', ['cancelled'])
                ->exists()
        ) {
            return;
        }

        $sampleApproved =
            $jobTicket->pesanans
                ->every(fn($p) =>
                    optional($p->workflowStatus)->sample_approved
                );

        if (! $sampleApproved) {
            return;
        }

        $this->createProductionInvoice($jobTicket);
    }

    private function createProductionInvoice(JobTicket $jobTicket): void
    {
        // Cek apakah invoice produksi (DP/Pelunasan) sudah dibuat sebelumnya untuk JobTicket ini
        $exists = $jobTicket->invoices()
            ->whereIn('kategori_invoice', ['dp_produksi', 'production'])
            ->whereNotIn('status_tagihan', ['cancelled', 'Cancelled'])
            ->exists();

        if ($exists) {
            return;
        }

        // Ambil nominal grand total dari quotation yang disetujui (jika ada)
        $approvedQuotation = $jobTicket->quotations()->where('status', 'approved')->first();
        $grandTotal = 0;

        if ($approvedQuotation) {
            $grandTotal = (float) $approvedQuotation->grand_total;
        } else {
            // Fallback kalkulasi manual dari pesanan
            foreach ($jobTicket->pesanans as $pesanan) {
                $price = (float) ($pesanan->harga_jual_per_pcs ?? $pesanan->price_per_piece ?? 0);
                $qty = (int) ($pesanan->quantity ?: $pesanan->q ?: 0);
                $grandTotal += ($price * $qty);
            }
        }

        // Contoh: DP yang ditagihkan adalah 50%
        $dpAmount = $grandTotal * 0.5;

        // Create the invoice
        $jobTicket->invoices()->create([
            'no_invoice' => $this->generate('INV-PROD'),
            'kategori_invoice' => 'produksi',
            'total_tagihan' => $grandTotal,
            'status_tagihan' => 'unpaid',
            'tgl_jatuh_tempo' => now()->addDays(7)->toDateString(),
        ]);

        // Update workflow_status untuk setiap pesanan bahwa invoice produksi telah dibuat
        foreach ($jobTicket->pesanans as $pesanan) {
            $pesanan->workflowStatus()->updateOrCreate(
                ['pesanan_id' => $pesanan->id],
                [
                    'production_invoice_created' => true,
                    'production_dp_paid' => false, // Menunggu pembayaran
                ]
            );
        }
    }
}