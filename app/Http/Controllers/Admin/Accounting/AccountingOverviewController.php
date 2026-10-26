<?php

namespace App\Http\Controllers\Admin\Accounting;

use App\Http\Controllers\Controller;
use App\Models\Accounting\ChartOfAccount;
use App\Models\Accounting\JobOrderCost;
use App\Models\Accounting\JournalEntry;
use App\Models\Accounting\VendorBill;
use App\Models\Invoice;
use App\Models\Payment;
use App\Services\Accounting\AccountingSyncService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AccountingOverviewController extends Controller
{
    protected AccountingSyncService $syncService;

    public function __construct(AccountingSyncService $syncService)
    {
        $this->syncService = $syncService;
    }

    public function index(Request $request): Response
    {
        // 1. Kas & Bank Balances
        $cashAccounts = ChartOfAccount::where('sub_category', 'Kas & Bank')
            ->with(['journalLines'])
            ->get()
            ->map(function ($acc) {
                return [
                    'id' => $acc->id,
                    'code' => $acc->account_code,
                    'name' => $acc->account_name,
                    'balance' => $acc->balance,
                ];
            });

        $totalCash = $cashAccounts->sum('balance');
        // If cash accounts haven't been seeded with initial balances, calculate verified payments
        if ($totalCash <= 0) {
            $totalCash = (float) Payment::where('status', 'verified')->sum('jumlah_bayar');
        }

        // 2. Piutang Usaha (AR)
        $totalAR = (float) Invoice::where('status_tagihan', 'unpaid')->sum('total_tagihan');
        $unpaidInvoicesCount = Invoice::where('status_tagihan', 'unpaid')->count();

        // 3. Hutang Usaha (AP)
        $totalAP = (float) VendorBill::whereIn('status', ['unpaid', 'partially_paid'])
            ->sum(ChartOfAccount::raw('total_amount - paid_amount'));
        if ($totalAP <= 0) {
            $totalAP = (float) VendorBill::sum('total_amount');
        }
        $unpaidBillsCount = VendorBill::where('status', '!=', 'paid')->count();

        // 4. Laba / Rugi Berjalan
        $totalRevenue = (float) Invoice::sum('total_tagihan');
        $totalCogs = (float) JobOrderCost::sum('total_actual_cogs');
        $netProfit = max(0, $totalRevenue - $totalCogs);

        // 5. Recent Journal Entries
        $recentJournals = JournalEntry::with(['lines.account'])
            ->orderByDesc('entry_date')
            ->orderByDesc('id')
            ->take(8)
            ->get()
            ->map(function ($entry) {
                return [
                    'id' => $entry->id,
                    'entryNumber' => $entry->entry_number,
                    'date' => $entry->entry_date ? $entry->entry_date->format('Y-m-d') : '',
                    'description' => $entry->description,
                    'referenceType' => $entry->reference_type,
                    'totalDebit' => (float) $entry->total_debit,
                    'totalCredit' => (float) $entry->total_credit,
                    'lines' => $entry->lines->map(function ($line) {
                        return [
                            'accountCode' => $line->account ? $line->account->account_code : '',
                            'accountName' => $line->account ? $line->account->account_name : '',
                            'debit' => (float) $line->debit,
                            'credit' => (float) $line->credit,
                            'memo' => $line->memo,
                        ];
                    }),
                ];
            });

        return Inertia::render('admin/accounting/index', [
            'overview' => [
                'totalCash' => $totalCash,
                'cashAccounts' => $cashAccounts,
                'totalAR' => $totalAR,
                'unpaidInvoicesCount' => $unpaidInvoicesCount,
                'totalAP' => $totalAP,
                'unpaidBillsCount' => $unpaidBillsCount,
                'netProfit' => $netProfit,
                'totalRevenue' => $totalRevenue,
                'totalCogs' => $totalCogs,
            ],
            'recentJournals' => $recentJournals,
        ]);
    }

    /**
     * Trigger manual sync of operational events to accounting
     */
    public function sync(Request $request)
    {
        $results = $this->syncService->syncAll();

        return back()->with('success', "Sinkronisasi berhasil! {$results['invoices']} Invoice, {$results['payments']} Pembayaran, {$results['purchasings']} Tagihan Pembelian.");
    }
}
