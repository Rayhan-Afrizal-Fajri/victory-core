<?php

namespace App\Services\Accounting;

use App\Models\Accounting\ChartOfAccount;
use App\Models\Accounting\JobOrderCost;
use App\Models\Accounting\JournalEntry;
use App\Models\Accounting\VendorBill;
use App\Models\Invoice;
use App\Models\JobTicket;
use App\Models\Payment;
use App\Models\Pesanan;
use App\Models\Purchasing;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class AccountingSyncService
{
    protected AccountingJournalService $journalService;

    public function __construct(AccountingJournalService $journalService)
    {
        $this->journalService = $journalService;
    }

    /**
     * Run full synchronization of operational data into accounting system
     */
    public function syncAll(): array
    {
        $invoiceStats = $this->syncInvoices();
        $paymentStats = $this->syncPayments();
        $purchasingStats = $this->syncPurchasingsAndVendorBills();
        $costingStats = $this->syncJobOrderCosting();

        return [
            'invoices' => $invoiceStats,
            'payments' => $paymentStats,
            'purchasings' => $purchasingStats,
            'costing' => $costingStats,
        ];
    }

    /**
     * Sync Invoices to Journal Entries (AR & Revenue)
     */
    public function syncInvoices(): int
    {
        $invoices = Invoice::with('jobTicket')->get();
        $count = 0;

        foreach ($invoices as $inv) {
            $existing = JournalEntry::where('reference_type', 'invoice')
                ->where('reference_id', $inv->id)
                ->first();

            if ($existing) {
                continue;
            }

            $total = (float) $inv->total_tagihan;
            if ($total <= 0) {
                continue;
            }

            $isSample = ($inv->kategori_invoice === 'sample');
            $arAccount = $isSample ? '1-1220' : '1-1210';
            $revAccount = $isSample ? '4-2000' : '4-1000';

            try {
                $this->journalService->createEntry(
                    [
                        'entry_date' => $inv->created_at ? $inv->created_at->format('Y-m-d') : now()->format('Y-m-d'),
                        'reference_type' => 'invoice',
                        'reference_id' => $inv->id,
                        'job_ticket_id' => $inv->job_ticket_id,
                        'description' => "Pengakuan Piutang Invoice #{$inv->no_invoice} ({$inv->kategori_invoice})",
                        'is_auto_generated' => true,
                    ],
                    [
                        [
                            'account_code' => $arAccount,
                            'debit' => $total,
                            'credit' => 0,
                            'memo' => "Tagihan Invoice #{$inv->no_invoice}",
                        ],
                        [
                            'account_code' => $revAccount,
                            'debit' => 0,
                            'credit' => $total,
                            'memo' => "Pendapatan Invoice #{$inv->no_invoice}",
                        ],
                    ]
                );
                $count++;
            } catch (\Exception $e) {
                Log::warning("AccountingSyncService: Failed to journal invoice #{$inv->id}: " . $e->getMessage());
            }
        }

        return $count;
    }

    /**
     * Sync Verified Payments to Journal Entries (Cash/Bank & AR settlement)
     */
    public function syncPayments(): int
    {
        $payments = Payment::where('status', 'verified')->with('invoice')->get();
        $count = 0;

        foreach ($payments as $pay) {
            $existing = JournalEntry::where('reference_type', 'payment')
                ->where('reference_id', $pay->id)
                ->first();

            if ($existing) {
                continue;
            }

            $amount = (float) $pay->jumlah_bayar;
            if ($amount <= 0) {
                continue;
            }

            // Pick Bank account: BCA 1-1120 or Mandiri 1-1130 or Cash 1-1110
            $cashAccount = '1-1120';
            if ($pay->metode_pembayaran && stripos($pay->metode_pembayaran, 'mandiri') !== false) {
                $cashAccount = '1-1130';
            } elseif ($pay->metode_pembayaran && stripos($pay->metode_pembayaran, 'tunai') !== false) {
                $cashAccount = '1-1110';
            }

            $inv = $pay->invoice;
            $arAccount = ($inv && $inv->kategori_invoice === 'sample') ? '1-1220' : '1-1210';
            $jobTicketId = $inv ? $inv->job_ticket_id : null;

            try {
                $this->journalService->createEntry(
                    [
                        'entry_date' => $pay->tgl_bayar ? date('Y-m-d', strtotime($pay->tgl_bayar)) : now()->format('Y-m-d'),
                        'reference_type' => 'payment',
                        'reference_id' => $pay->id,
                        'job_ticket_id' => $jobTicketId,
                        'description' => "Penerimaan Pembayaran #PAY-{$pay->id} via {$pay->metode_pembayaran}",
                        'is_auto_generated' => true,
                    ],
                    [
                        [
                            'account_code' => $cashAccount,
                            'debit' => $amount,
                            'credit' => 0,
                            'memo' => "Kas masuk pembayaran invoice",
                        ],
                        [
                            'account_code' => $arAccount,
                            'debit' => 0,
                            'credit' => $amount,
                            'memo' => "Pelunasan piutang customer",
                        ],
                    ]
                );
                $count++;
            } catch (\Exception $e) {
                Log::warning("AccountingSyncService: Failed to journal payment #{$pay->id}: " . $e->getMessage());
            }
        }

        return $count;
    }

    /**
     * Sync Purchasings to Vendor Bills & AP Journal Entries
     */
    public function syncPurchasingsAndVendorBills(): int
    {
        $purchasings = Purchasing::with(['pesanan', 'supplier'])->get();
        $count = 0;

        foreach ($purchasings as $po) {
            $total = (float) $po->total_harga;
            if ($total <= 0 || !$po->supplier_id) {
                continue;
            }

            $billNumber = 'BILL-PO-' . str_pad((string)$po->id, 5, '0', STR_PAD_LEFT);
            $billDate = $po->tgl_pembelian ? date('Y-m-d', strtotime($po->tgl_pembelian)) : ($po->created_at ? $po->created_at->format('Y-m-d') : now()->format('Y-m-d'));
            $dueDate = date('Y-m-d', strtotime($billDate . ' +30 days'));

            $isPaid = ($po->status === 'completed' || $po->status === 'paid');
            $status = $isPaid ? 'paid' : ($po->is_received ? 'unpaid' : 'draft');
            $paidAmount = $isPaid ? $total : 0;

            $jobTicketId = $po->pesanan ? $po->pesanan->job_ticket_id : null;

            $vendorBill = VendorBill::firstOrCreate(
                ['purchasing_id' => $po->id],
                [
                    'bill_number' => $billNumber,
                    'supplier_id' => $po->supplier_id,
                    'job_ticket_id' => $jobTicketId,
                    'bill_date' => $billDate,
                    'due_date' => $dueDate,
                    'total_amount' => $total,
                    'paid_amount' => $paidAmount,
                    'status' => $status,
                    'notes' => "Pengadaan bahan: {$po->item_bahan} ({$po->qty_bahan} {$po->satuan})",
                ]
            );

            // Create journal entry if not already present
            $existing = JournalEntry::where('reference_type', 'purchasing')
                ->where('reference_id', $po->id)
                ->first();

            if (!$existing && $total > 0) {
                try {
                    $this->journalService->createEntry(
                        [
                            'entry_date' => $billDate,
                            'reference_type' => 'purchasing',
                            'reference_id' => $po->id,
                            'job_ticket_id' => $jobTicketId,
                            'description' => "Hutang Pembelian Bahan #{$po->id} - {$po->item_bahan}",
                            'is_auto_generated' => true,
                        ],
                        [
                            [
                                'account_code' => '1-1310', // Persediaan Bahan Baku
                                'debit' => $total,
                                'credit' => 0,
                                'memo' => "Penerimaan bahan {$po->item_bahan}",
                            ],
                            [
                                'account_code' => '2-1110', // Hutang Usaha Supplier
                                'debit' => 0,
                                'credit' => $total,
                                'memo' => "Tagihan supplier untuk PO #{$po->id}",
                            ],
                        ]
                    );
                } catch (\Exception $e) {
                    Log::warning("AccountingSyncService: Failed to journal purchasing #{$po->id}: " . $e->getMessage());
                }
            }

            $count++;
        }

        return $count;
    }

    /**
     * Sync Job Order Costing per Pesanan & Job Ticket
     */
    public function syncJobOrderCosting(): int
    {
        $pesanans = Pesanan::with(['jobTicket.invoices', 'purchasings', 'manufacturingSpecs'])->get();
        $count = 0;

        foreach ($pesanans as $pesanan) {
            if (!$pesanan->job_ticket_id) {
                continue;
            }

            // Actual Material Cost
            $actualMaterial = (float) $pesanan->purchasings->sum('total_harga');

            // Actual Labor Cost (from production run processes if available)
            $productionRuns = DB::table('production_runs')->where('pesanan_id', $pesanan->id)->pluck('id');
            $actualLabor = 0;
            if ($productionRuns->isNotEmpty()) {
                $actualLabor = (float) DB::table('production_run_processes')
                    ->whereIn('production_run_id', $productionRuns)
                    ->sum(DB::raw('COALESCE(worker_qty, quantity, 0) * 1500')); // default avg rate per process or actual
            }
            if ($actualLabor == 0) {
                // Fallback to internal manufacturing specs
                $internalSpecs = $pesanan->manufacturingSpecs->whereNull('vendor_id');
                $actualLabor = (float) $internalSpecs->sum(function ($spec) use ($pesanan) {
                    return (float) ($spec->cost_per_pcs ?? 0) * (float) ($pesanan->q ?? 1);
                });
            }

            // Actual Subcon (Makloon) Cost
            $subconSpecs = $pesanan->manufacturingSpecs->whereNotNull('vendor_id');
            $actualSubcon = (float) $subconSpecs->sum(function ($spec) use ($pesanan) {
                return (float) ($spec->cost_per_pcs ?? 0) * (float) ($pesanan->q ?? 1);
            });

            // Defect Cost
            $defectCost = 0;
            if ($productionRuns->isNotEmpty()) {
                $processIds = DB::table('production_run_processes')->whereIn('production_run_id', $productionRuns)->pluck('id');
                $defectQty = (float) DB::table('production_qc_logs')->whereIn('production_run_process_id', $processIds)->sum('defect_qty');
                $defectCost = $defectQty * 25000; // estimated unit defect scrap value
            }

            // Estimated Costs
            $orderQty = max(1, (float) ($pesanan->q ?: $pesanan->sample_qty ?: 1));
            $estHppPerPcs = (float) $pesanan->estimasi_hpp_per_pcs;
            $totalEstCogs = $estHppPerPcs > 0 ? ($estHppPerPcs * $orderQty) : ($actualMaterial * 0.95);
            $estMaterial = $totalEstCogs * 0.60;
            $estLabor = $totalEstCogs * 0.25;
            $estSubcon = $totalEstCogs * 0.15;

            $totalActualCogs = $actualMaterial + $actualLabor + $actualSubcon + $defectCost;

            // Revenue Billed
            $invoices = $pesanan->jobTicket ? $pesanan->jobTicket->invoices : collect();
            $revenueBilled = (float) $invoices->sum('total_tagihan');
            if ($revenueBilled == 0) {
                $revenueBilled = (float) ($pesanan->harga_jual_per_pcs ?: ($pesanan->harga_sample_per_pcs ?: 0)) * $orderQty;
            }

            $grossProfit = $revenueBilled - $totalActualCogs;
            $grossMarginPct = $revenueBilled > 0 ? round(($grossProfit / $revenueBilled) * 100, 2) : 0;

            JobOrderCost::updateOrCreate(
                ['pesanan_id' => $pesanan->id],
                [
                    'job_ticket_id' => $pesanan->job_ticket_id,
                    'estimated_material_cost' => $estMaterial,
                    'actual_material_cost' => $actualMaterial,
                    'estimated_labor_cost' => $estLabor,
                    'actual_labor_cost' => $actualLabor,
                    'estimated_subcon_cost' => $estSubcon,
                    'actual_subcon_cost' => $actualSubcon,
                    'defect_scrap_cost' => $defectCost,
                    'total_estimated_cogs' => $totalEstCogs,
                    'total_actual_cogs' => $totalActualCogs,
                    'revenue_billed' => $revenueBilled,
                    'gross_profit' => $grossProfit,
                    'gross_margin_pct' => $grossMarginPct,
                    'status' => ($pesanan->jobTicket && $pesanan->jobTicket->status === 'completed') ? 'completed' : 'in_progress',
                ]
            );

            $count++;
        }

        return $count;
    }
}
