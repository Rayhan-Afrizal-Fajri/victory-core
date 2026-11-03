<?php

namespace App\Http\Controllers\Admin\Accounting;

use App\Http\Controllers\Controller;
use App\Models\Accounting\ChartOfAccount;
use App\Models\Accounting\OperationalExpense;
use App\Services\Accounting\AccountingJournalService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ExpenseController extends Controller
{
    protected AccountingJournalService $journalService;

    public function __construct(AccountingJournalService $journalService)
    {
        $this->journalService = $journalService;
    }

    public function index(Request $request): Response
    {
        $expenses = OperationalExpense::with(['expenseAccount', 'paymentAccount', 'creator'])
            ->orderByDesc('expense_date')
            ->orderByDesc('id')
            ->get()
            ->map(function ($exp) {
                return [
                    'id' => $exp->id,
                    'expenseNumber' => $exp->expense_number,
                    'date' => $exp->expense_date ? $exp->expense_date->format('Y-m-d') : '',
                    'category' => $exp->category,
                    'recipient' => $exp->recipient,
                    'description' => $exp->description,
                    'amount' => (float) $exp->amount,
                    'accountCode' => $exp->expenseAccount ? $exp->expenseAccount->account_code : '',
                    'accountName' => $exp->expenseAccount ? $exp->expenseAccount->account_name : '',
                    'paymentMethod' => $exp->paymentAccount ? $exp->paymentAccount->account_name : 'Kas',
                    'creator' => $exp->creator ? $exp->creator->name : 'Admin',
                ];
            });

        // Summary Statistics
        $totalExpense = $expenses->sum('amount');
        $expenseAccounts = ChartOfAccount::where('category', 'expense')->where('is_active', true)->get();
        $paymentAccounts = ChartOfAccount::where('sub_category', 'Kas & Bank')->where('is_active', true)->get();

        return Inertia::render('admin/accounting/expenses', [
            'expenses' => $expenses,
            'summary' => [
                'totalExpense' => $totalExpense,
                'count' => $expenses->count(),
            ],
            'expenseAccounts' => $expenseAccounts,
            'paymentAccounts' => $paymentAccounts,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'expense_date' => 'required|date',
            'account_id' => 'required|exists:chart_of_accounts,id',
            'payment_account_id' => 'required|exists:chart_of_accounts,id',
            'amount' => 'required|numeric|min:1',
            'category' => 'required|string',
            'recipient' => 'nullable|string|max:150',
            'description' => 'required|string',
        ]);

        $prefix = 'EXP-' . date('Ym', strtotime($validated['expense_date'])) . '-';
        $last = OperationalExpense::where('expense_number', 'LIKE', $prefix . '%')->orderByDesc('id')->first();
        $seq = $last ? ((int) substr($last->expense_number, strlen($prefix)) + 1) : 1;
        $expenseNumber = $prefix . str_pad((string)$seq, 4, '0', STR_PAD_LEFT);

        $expense = OperationalExpense::create([
            'expense_number' => $expenseNumber,
            'account_id' => $validated['account_id'],
            'payment_account_id' => $validated['payment_account_id'],
            'expense_date' => $validated['expense_date'],
            'amount' => $validated['amount'],
            'category' => $validated['category'],
            'recipient' => $validated['recipient'],
            'description' => $validated['description'],
            'created_by' => auth()->id(),
        ]);

        // Auto Journal for OPEX: DR Expense (account_id), CR Kas/Bank (payment_account_id)
        try {
            $this->journalService->createEntry(
                [
                    'entry_date' => $validated['expense_date'],
                    'reference_type' => 'expense',
                    'reference_id' => $expense->id,
                    'description' => "Beban Operasional: {$validated['description']} ({$expenseNumber})",
                    'is_auto_generated' => true,
                ],
                [
                    [
                        'account_id' => $validated['account_id'],
                        'debit' => (float) $validated['amount'],
                        'credit' => 0,
                        'memo' => $validated['description'],
                    ],
                    [
                        'account_id' => $validated['payment_account_id'],
                        'debit' => 0,
                        'credit' => (float) $validated['amount'],
                        'memo' => "Pengeluaran kas {$expenseNumber}",
                    ],
                ]
            );
        } catch (\Exception $e) {
            // log
        }

        return back()->with('success', 'Beban operasional berhasil dicatat!');
    }
}
