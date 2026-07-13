<?php

namespace App\Services;

use App\Notifications\SystemNotification;
use Illuminate\Support\Facades\Notification;
use App\Models\Invoice;
use App\Models\JobTicket;
use App\Models\User;
use Illuminate\Support\Facades\DB;

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
        // Cek apakah invoice produksi sudah dibuat sebelumnya
        $exists = $jobTicket->invoices()
            ->whereIn('kategori_invoice', ['dp_produksi', 'production', 'produksi'])
            ->whereNotIn('status_tagihan', ['cancelled', 'Cancelled'])
            ->exists();

        if ($exists) {
            return;
        }

        DB::transaction(function () use ($jobTicket) {
            // 1. Ambil data grand total dan persiapkan data item
            $approvedQuotation = $jobTicket->quotations()->where('status', 'approved')->first();
            $grandTotal = 0;
            $invoiceItems = [];

            // dd($jobTicket->pesanans, $approvedQuotation);

            if ($approvedQuotation) {
                // Jika pakai quotation, ambil totalnya
                $grandTotal = (float) $approvedQuotation->grand_total;
                
                // Asumsi: jika ada quotation, kita buatkan item per pesanan yang ada di quotation
                foreach ($jobTicket->pesanans as $pesanan) {
                    $price = (float) ($pesanan->harga_jual_per_pcs ?? 0);
                    $qty = (int) ($pesanan->q ?? 0);
                    
                    if ($qty > 0) {
                        $invoiceItems[] = [
                            'pesanan_id' => $pesanan->id,
                            'item_name' => $pesanan->requested_product_name ?? $pesanan->produk,
                            'quantity' => $qty,
                            'price_per_pcs' => $price,
                            'subtotal' => $price * $qty,
                        ];
                    }
                }
            } else {
                // Fallback kalkulasi manual
                foreach ($jobTicket->pesanans as $pesanan) {
                    $price = (float) ($pesanan->harga_jual_per_pcs ?? $pesanan->price_per_piece ?? 0);
                    $qty = (int) ($pesanan->quantity ?: $pesanan->q ?: 0);
                    $subtotal = $price * $qty;
                    
                    $grandTotal += $subtotal;

                    if ($qty > 0) {
                        $invoiceItems[] = [
                            'pesanan_id' => $pesanan->id,
                            'item_name' => $pesanan->requested_product_name ?? $pesanan->product_name,
                            'quantity' => $qty,
                            'price_per_pcs' => $price,
                            'subtotal' => $subtotal,
                        ];
                    }
                }
            }

            // dd($invoiceItems);

            // 2. Create the invoice
            $invoice = $jobTicket->invoices()->create([
                'no_invoice' => $this->generate('INV-PROD'),
                'kategori_invoice' => 'produksi',
                'total_tagihan' => $grandTotal,
                'status_tagihan' => 'unpaid',
                'tgl_jatuh_tempo' => now()->addDays(7)->toDateString(),
            ]);

            // 3. Create invoice items (Snapshot harga saat invoice dibuat)
            foreach ($invoiceItems as $item) {
                $invoice->items()->create($item);
            }

            // 4. Update workflow_status untuk setiap pesanan
            foreach ($jobTicket->pesanans as $pesanan) {
                $pesanan->workflowStatus()->updateOrCreate(
                    ['pesanan_id' => $pesanan->id],
                    [
                        'production_invoice_created' => true,
                        'production_dp_paid' => false,
                    ]
                );
            }
        });

        $usersToNotify = User::permission('invoices.pay')->get();
        if ($usersToNotify->isNotEmpty()) {
            Notification::send($usersToNotify, new SystemNotification(
                'Invoice Produksi telah dibuat',
                "Invoice Poduksi telah dibuat, lakukan pembayaran.",
                "/job-tickets/{$jobTicket->id}?tab=invoices",
                'info'
            ));
        }
    }
}