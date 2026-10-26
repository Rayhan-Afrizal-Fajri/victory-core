<?php

namespace App\Models\Accounting;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ChartOfAccount extends Model
{
    use HasFactory;

    protected $table = 'chart_of_accounts';

    protected $fillable = [
        'account_code',
        'account_name',
        'category',
        'sub_category',
        'normal_balance',
        'parent_id',
        'is_active',
        'description',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function parent(): BelongsTo
    {
        return $this->belongsTo(ChartOfAccount::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(ChartOfAccount::class, 'parent_id');
    }

    public function journalLines(): HasMany
    {
        return $this->hasMany(JournalEntryLine::class, 'account_id');
    }

    /**
     * Calculate current net balance based on journal entry lines
     */
    public function getBalanceAttribute(): float
    {
        $debitSum = (float) $this->journalLines()->sum('debit');
        $creditSum = (float) $this->journalLines()->sum('credit');

        if ($this->normal_balance === 'debit') {
            return $debitSum - $creditSum;
        }

        return $creditSum - $debitSum;
    }
}
