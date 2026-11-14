<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class CompanyProfile extends Model
{
    protected $fillable = [
        'company_name',
        'company_type',
        'bank_type',
        'tax_percentage',
        'account_number',
        'account_name',
        'address',
        'swift_code',
        'stamp',
    ];

    protected $appends = ['stamp_url'];

    public function getStampUrlAttribute(): ?string
    {
        if (!$this->stamp) return null;
        return Storage::disk('public')->url($this->stamp);
    }

    public function jobTickets()
    {
        return $this->hasMany(JobTicket::class);
    }
}
