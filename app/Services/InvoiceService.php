<?php

namespace App\Services;

use App\Models\Invoice;

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
}