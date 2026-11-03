<?php

namespace App\Http\Controllers\Admin\Accounting;

use App\Http\Controllers\Controller;
use App\Models\Accounting\ChartOfAccount;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ChartOfAccountController extends Controller
{
    public function index(): Response
    {
        $accounts = ChartOfAccount::with(['journalLines'])
            ->orderBy('account_code')
            ->get()
            ->map(function ($acc) {
                return [
                    'id' => $acc->id,
                    'code' => $acc->account_code,
                    'name' => $acc->account_name,
                    'category' => $acc->category,
                    'subCategory' => $acc->sub_category,
                    'normalBalance' => $acc->normal_balance,
                    'balance' => $acc->balance,
                    'isActive' => $acc->is_active,
                    'description' => $acc->description,
                ];
            });

        return Inertia::render('admin/accounting/coa', [
            'accounts' => $accounts,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'account_code' => 'required|string|max:20|unique:chart_of_accounts,account_code',
            'account_name' => 'required|string|max:150',
            'category' => 'required|in:asset,liability,equity,revenue,cogs,expense',
            'sub_category' => 'nullable|string|max:100',
            'normal_balance' => 'required|in:debit,credit',
            'description' => 'nullable|string',
        ]);

        ChartOfAccount::create($validated);

        return back()->with('success', 'Akun berhasil ditambahkan!');
    }

    public function update(Request $request, ChartOfAccount $account)
    {
        $validated = $request->validate([
            'account_name' => 'required|string|max:150',
            'category' => 'required|in:asset,liability,equity,revenue,cogs,expense',
            'sub_category' => 'nullable|string|max:100',
            'normal_balance' => 'required|in:debit,credit',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $account->update($validated);

        return back()->with('success', 'Akun berhasil diperbarui!');
    }

    public function destroy(ChartOfAccount $account)
    {
        if ($account->journalLines()->exists()) {
            return back()->with('error', 'Akun tidak dapat dihapus karena sudah memiliki transaksi jurnal!');
        }

        $account->delete();

        return back()->with('success', 'Akun berhasil dihapus!');
    }
}
