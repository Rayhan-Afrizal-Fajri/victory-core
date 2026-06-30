<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

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
    ];

    public function jobTickets()
    {
        return $this->hasMany(JobTicket::class);
    }
}
