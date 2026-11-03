<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SuratJalan extends Model
{
    use HasFactory;

    protected $table = 'surat_jalans';

    protected $fillable = [
        'job_ticket_id',
        'pesanan_id',
        'production_run_id',
        'surat_jalan_number',
        'delivery_date',
        'company_profile_id',
        'customer_id',
        'customer_name_snapshot',
        'customer_company_snapshot',
        'customer_phone_snapshot',
        'customer_address_snapshot',
        'customer_pic_snapshot',
        'courier_name',
        'tracking_number',
        'tracking_url',
        'vehicle_number',
        'driver_name',
        'total_quantity',
        'notes',
        'status',
        'created_by',
        'printed_at',
        'delivered_at',
        'received_by_name',
    ];

    protected $casts = [
        'delivery_date' => 'date',
        'total_quantity' => 'integer',
        'printed_at' => 'datetime',
        'delivered_at' => 'datetime',
    ];

    public function jobTicket(): BelongsTo
    {
        return $this->belongsTo(JobTicket::class);
    }

    public function pesanan(): BelongsTo
    {
        return $this->belongsTo(Pesanan::class);
    }

    public function productionRun(): BelongsTo
    {
        return $this->belongsTo(ProductionRun::class);
    }

    public function companyProfile(): BelongsTo
    {
        return $this->belongsTo(CompanyProfile::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function items(): HasMany
    {
        return $this->hasMany(SuratJalanItem::class)->orderBy('sort_order')->orderBy('id');
    }
}
