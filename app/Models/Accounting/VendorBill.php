<?php

namespace App\Models\Accounting;

use App\Models\JobTicket;
use App\Models\Purchasing;
use App\Models\Supplier;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class VendorBill extends Model
{
    use HasFactory;

    protected $table = 'vendor_bills';

    protected $fillable = [
        'bill_number',
        'supplier_id',
        'job_ticket_id',
        'purchasing_id',
        'bill_date',
        'due_date',
        'total_amount',
        'paid_amount',
        'status',
        'notes',
    ];

    protected $casts = [
        'bill_date' => 'date',
        'due_date' => 'date',
        'total_amount' => 'float',
        'paid_amount' => 'float',
    ];

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class, 'supplier_id');
    }

    public function jobTicket(): BelongsTo
    {
        return $this->belongsTo(JobTicket::class, 'job_ticket_id');
    }

    public function purchasing(): BelongsTo
    {
        return $this->belongsTo(Purchasing::class, 'purchasing_id');
    }

    public function payments(): HasMany
    {
        return $this->hasMany(VendorBillPayment::class, 'vendor_bill_id');
    }

    public function getRemainingAmountAttribute(): float
    {
        return max(0, $this->total_amount - $this->paid_amount);
    }
}
