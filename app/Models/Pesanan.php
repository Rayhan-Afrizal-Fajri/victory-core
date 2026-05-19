<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Pesanan extends Model
{
    protected $table = 'pesanan';
    protected $fillable = [
        'date',
        'no_job_ticket',
        'customer_id',
        'produk',
        'q',
        'qs',
        'deadline',
        'status_divisi',
        'harga_jual_per_pcs',
        'estimasi_hpp_per_pcs',
        'spesifikasi_bahan',
        'spesifikasi_sablon_bordir',
        'spesifikasi_aksesoris',
        'file_design_path',
        'keterangan_tambahan',
        'created_by',
    ];

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function invoice()
    {
        return $this->hasMany(Invoice::class);
    }

    public function productionProgress()
    {
        return $this->hasOne(ProductionProgress::class);
    }

    public function profitLoss()
    {
        return $this->hasOne(ProfitLoss::class);
    }

    public function purchasing()
    {
        return $this->hasMany(Purchasing::class);
    }
}
