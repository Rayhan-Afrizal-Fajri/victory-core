<?php

namespace App\Models\Accounting;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OperationalExpense extends Model
{
    use HasFactory;

    protected $table = 'operational_expenses';

    protected $fillable = [
        'expense_number',
        'account_id',
        'payment_account_id',
        'expense_date',
        'amount',
        'category',
        'recipient',
        'description',
        'proof_path',
        'created_by',
    ];

    protected $casts = [
        'expense_date' => 'date',
        'amount' => 'float',
    ];

    public function expenseAccount(): BelongsTo
    {
        return $this->belongsTo(ChartOfAccount::class, 'account_id');
    }

    public function paymentAccount(): BelongsTo
    {
        return $this->belongsTo(ChartOfAccount::class, 'payment_account_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
