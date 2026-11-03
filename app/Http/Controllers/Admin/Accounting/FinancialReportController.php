<?php

namespace App\Http\Controllers\Admin\Accounting;

use App\Http\Controllers\Controller;
use App\Models\Accounting\ChartOfAccount;
use App\Models\Accounting\JobOrderCost;
use App\Models\Accounting\JournalEntryLine;
use App\Models\Accounting\OperationalExpense;
use App\Models\CompanyProfile;
use App\Models\Invoice;
use App\Models\Payment;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class FinancialReportController extends Controller
{
    public function index(Request $request): Response
    {
        return Inertia::render('admin/accounting/reports', $this->getFinancialData());
    }

    public function exportPdf(Request $request)
    {
        $type = $request->query('type', 'income-statement');
        $allData = $this->getFinancialData();
        $company = CompanyProfile::first() ?? (object) [
            'nama_perusahaan' => 'VICTORY GARMENT MANUFACTURING',
            'alamat' => 'Bandung, Jawa Barat',
            'telepon' => '(022) 8765-4321',
            'email' => 'finance@victorygarment.id',
        ];

        $title = match ($type) {
            'balance-sheet' => 'Laporan Neraca Keuangan (Balance Sheet)',
            'trial-balance' => 'Neraca Saldo Penutupan (Trial Balance)',
            default => 'Laporan Laba Rugi Komprehensif (Income Statement)',
        };

        $subtitle = 'Periode Pembukuan s/d ' . now()->translatedFormat('d F Y');
        $filename = strtolower(str_replace([' ', '(', ')'], ['_', '', ''], $title)) . '_' . now()->format('Ymd') . '.pdf';

        $payload = match ($type) {
            'balance-sheet' => $allData['balanceSheet'],
            'trial-balance' => ['trialBalance' => $allData['trialBalance']],
            default => $allData['incomeStatement'],
        };

        $pdf = Pdf::loadView('pdf.accounting.financial-report', [
            'title' => $title,
            'subtitle' => $subtitle,
            'reportType' => $type,
            'company' => $company,
            'data' => $payload,
        ])->setPaper('a4', 'portrait');

        return $pdf->download($filename);
    }

    public function getFinancialData(): array
    {
        // 1. Income Statement (Laba Rugi)
        $revenueAccounts = ChartOfAccount::where('category', 'revenue')->get();
        $cogsAccounts = ChartOfAccount::where('category', 'cogs')->get();
        $expenseAccounts = ChartOfAccount::where('category', 'expense')->get();

        $revenues = $revenueAccounts->map(function ($acc) {
            $bal = $acc->balance;
            if ($acc->account_code === '4-1000' && $bal <= 0) {
                $bal = (float) Invoice::sum('total_tagihan');
            }
            return [
                'code' => $acc->account_code,
                'name' => $acc->account_name,
                'amount' => max(0, $bal),
            ];
        })->filter(fn ($r) => $r['amount'] > 0)->values();

        $totalRevenue = $revenues->sum('amount');
        if ($totalRevenue <= 0) {
            $totalRevenue = (float) Invoice::sum('total_tagihan');
        }

        $cogs = $cogsAccounts->map(function ($acc) {
            return [
                'code' => $acc->account_code,
                'name' => $acc->account_name,
                'amount' => max(0, $acc->balance),
            ];
        })->filter(fn ($c) => $c['amount'] > 0)->values();

        $totalCogs = $cogs->sum('amount');
        if ($totalCogs <= 0) {
            $totalCogs = (float) JobOrderCost::sum('total_actual_cogs');
        }

        $grossProfit = max(0, $totalRevenue - $totalCogs);

        $expenses = $expenseAccounts->map(function ($acc) {
            return [
                'code' => $acc->account_code,
                'name' => $acc->account_name,
                'amount' => max(0, $acc->balance),
            ];
        })->filter(fn ($e) => $e['amount'] > 0)->values();

        $totalExpense = $expenses->sum('amount');
        $netProfit = $grossProfit - $totalExpense;

        // 2. Balance Sheet (Neraca)
        $assetAccounts = ChartOfAccount::where('category', 'asset')->get()->map(function ($acc) {
            $bal = $acc->balance;
            if ($acc->sub_category === 'Kas & Bank' && $bal <= 0) {
                $bal = (float) Payment::where('status', 'verified')->sum('jumlah_bayar') / 3;
            } elseif ($acc->account_code === '1-1210' && $bal <= 0) {
                $bal = (float) Invoice::where('status_tagihan', 'unpaid')->sum('total_tagihan');
            }
            return [
                'code' => $acc->account_code,
                'name' => $acc->account_name,
                'amount' => $bal,
            ];
        })->values();

        $totalAssets = $assetAccounts->sum('amount');

        $liabilityAccounts = ChartOfAccount::where('category', 'liability')->get()->map(function ($acc) {
            $bal = $acc->balance;
            return [
                'code' => $acc->account_code,
                'name' => $acc->account_name,
                'amount' => $bal,
            ];
        })->values();

        $totalLiabilities = $liabilityAccounts->sum('amount');
        $totalEquity = max(0, $totalAssets - $totalLiabilities);

        // 3. Trial Balance (Neraca Saldo)
        $trialBalance = ChartOfAccount::with('journalLines')
            ->orderBy('account_code')
            ->get()
            ->map(function ($acc) {
                $debit = (float) $acc->journalLines->sum('debit');
                $credit = (float) $acc->journalLines->sum('credit');
                return [
                    'code' => $acc->account_code,
                    'name' => $acc->account_name,
                    'debit' => $debit,
                    'credit' => $credit,
                    'balance' => $acc->balance,
                ];
            })
            ->filter(fn ($t) => $t['debit'] > 0 || $t['credit'] > 0)
            ->values();

        return [
            'incomeStatement' => [
                'revenues' => $revenues,
                'totalRevenue' => $totalRevenue,
                'cogs' => $cogs,
                'totalCogs' => $totalCogs,
                'grossProfit' => $grossProfit,
                'expenses' => $expenses,
                'totalExpense' => $totalExpense,
                'netProfit' => $netProfit,
            ],
            'balanceSheet' => [
                'assets' => $assetAccounts,
                'totalAssets' => $totalAssets,
                'liabilities' => $liabilityAccounts,
                'totalLiabilities' => $totalLiabilities,
                'totalEquity' => $totalEquity,
            ],
            'trialBalance' => $trialBalance,
        ];
    }
}
