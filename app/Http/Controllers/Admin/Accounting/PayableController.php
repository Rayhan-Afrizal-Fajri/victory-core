<?php

namespace App\Http\Controllers\Admin\Accounting;

use App\Http\Controllers\Controller;
use App\Models\Accounting\ChartOfAccount;
use App\Models\Accounting\VendorBill;
use App\Models\Accounting\VendorBillPayment;
use App\Services\Accounting\AccountingJournalService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PayableController extends Controller
{
    protected AccountingJournalService $journalService;

    public function __construct(AccountingJournalService $journalService)
    {
        $this->journalService = $journalService;
    }

    public function index(Request $request): Response
    {
        $bills = VendorBill::with(['supplier', 'purchasing.pesanan.jobTicket'])
            ->orderByDesc('id')
            ->get()
            ->map(function ($bill) {
                $total = (float) $bill->total_amount;
                $paid = (float) $bill->paid_amount;
                $remaining = max(0, $total - $paid);

                $dueDate = $bill->due_date ? $bill->due_date->format('Y-m-d') : '';
                $daysOverdue = (int) round((time() - strtotime($dueDate)) / 86400);

                $aging = 'current';
                if ($daysOverdue > 90) {
                    $aging = '>90_days';
                } elseif ($daysOverdue > 60) {
                    $aging = '61_90_days';
                } elseif ($daysOverdue > 30) {
                    $aging = '31_60_days';
                } elseif ($daysOverdue > 0) {
                    $aging = '1_30_days';
                }

                $supplier = $bill->supplier;
                $supplierName = $supplier ? ($supplier->nama ?: $supplier->name) : 'Supplier Garment';
                $job = $bill->jobTicket ?: ($bill->purchasing && $bill->purchasing->pesanan ? $bill->purchasing->pesanan->jobTicket : null);

                return [
                    'id' => $bill->id,
                    'billNumber' => $bill->bill_number,
                    'supplierName' => $supplierName,
                    'jobTicketNo' => $job ? $job->no_job_ticket : '-',
                    'billDate' => $bill->bill_date ? $bill->bill_date->format('Y-m-d') : '',
                    'dueDate' => $dueDate,
                    'daysOverdue' => max(0, $daysOverdue),
                    'totalAmount' => $total,
                    'paidAmount' => $paid,
                    'remainingAmount' => $remaining,
                    'status' => $bill->status,
                    'notes' => $bill->notes,
                    'aging' => $aging,
                ];
            });

        // Aggregations
        $totalAP = $bills->sum('remainingAmount');
        $totalPaid = $bills->sum('paidAmount');
        $currentAP = $bills->where('aging', 'current')->sum('remainingAmount');
        $aging1_30 = $bills->where('aging', '1_30_days')->sum('remainingAmount');
        $aging31_60 = $bills->where('aging', '31_60_days')->sum('remainingAmount');
        $aging61_90 = $bills->where('aging', '61_90_days')->sum('remainingAmount');
        $agingOver90 = $bills->where('aging', '>90_days')->sum('remainingAmount');

        $paymentAccounts = ChartOfAccount::where('sub_category', 'Kas & Bank')
            ->where('is_active', true)
            ->get(['id', 'account_code', 'account_name']);

        return Inertia::render('admin/accounting/payables', [
            'payables' => $bills,
            'paymentAccounts' => $paymentAccounts,
            'summary' => [
                'totalAP' => $totalAP,
                'totalPaid' => $totalPaid,
                'current' => $currentAP,
                'aging1_30' => $aging1_30,
                'aging31_60' => $aging31_60,
                'aging61_90' => $aging61_90,
                'agingOver90' => $agingOver90,
            ],
        ]);
    }

    public function recordPayment(Request $request, VendorBill $bill)
    {
        $validated = $request->validate([
            'payment_date' => 'required|date',
            'amount' => 'required|numeric|min:1',
            'payment_method' => 'required|string',
            'account_id' => 'required|exists:chart_of_accounts,id',
            'notes' => 'nullable|string',
        ]);

        $amount = (float) $validated['amount'];
        $newPaid = $bill->paid_amount + $amount;
        $status = $newPaid >= $bill->total_amount ? 'paid' : 'partially_paid';

        VendorBillPayment::create([
            'vendor_bill_id' => $bill->id,
            'payment_date' => $validated['payment_date'],
            'amount' => $amount,
            'payment_method' => $validated['payment_method'],
            'account_id' => $validated['account_id'],
            'notes' => $validated['notes'],
            'paid_by' => auth()->id(),
        ]);

        $bill->update([
            'paid_amount' => $newPaid,
            'status' => $status,
        ]);

        // Auto Journal for AP Payment: DR 2-1110 (Hutang), CR Bank/Kas (account_id)
        try {
            $this->journalService->createEntry(
                [
                    'entry_date' => $validated['payment_date'],
                    'reference_type' => 'bill_payment',
                    'reference_id' => $bill->id,
                    'job_ticket_id' => $bill->job_ticket_id,
                    'description' => "Pembayaran Tagihan Supplier #{$bill->bill_number}",
                    'is_auto_generated' => true,
                ],
                [
                    [
                        'account_code' => '2-1110', // Hutang Usaha Supplier
                        'debit' => $amount,
                        'credit' => 0,
                        'memo' => "Pelunasan tagihan {$bill->bill_number}",
                    ],
                    [
                        'account_id' => $validated['account_id'], // Kas / Bank pengirim
                        'debit' => 0,
                        'credit' => $amount,
                        'memo' => "Pengeluaran via {$validated['payment_method']}",
                    ],
                ]
            );
        } catch (\Exception $e) {
            // Log but don't crash
        }

        return back()->with('success', 'Pembayaran hutang supplier berhasil dicatat!');
    }
}
