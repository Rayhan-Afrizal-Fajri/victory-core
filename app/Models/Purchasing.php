<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Purchasing extends Model
{
    protected $fillable = [
        'pesanan_id',
        'pesanan_material_spec_id',
        'supplier_id',
        'item_bahan',
        'color',
        'qty_bahan',
        'required_qty',
        'purchase_qty',
        'stock_qty',
        'leftover_qty',
        'satuan',
        'harga_satuan',
        'total_harga',
        'is_received',
        'tgl_pembelian',
        'received_by',
        'status',
        'purchase_scope',
        'notes',
    ];

    protected $appends = [
        'received_qty',
        'remaining_qty',
        'receiving_status',
    ];

    public function pesanan()
    {
        return $this->belongsTo(Pesanan::class);
    }

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    public function materialReceivings()
    {
        return $this->hasMany(MaterialReceiving::class);
    }

    public function materialReceiving()
    {
        return $this->materialReceivings();
    }

    public function pesananMaterialSpec()
    {
        return $this->belongsTo(PesananMaterialSpecs::class, 'pesanan_material_spec_id');
    }

    /**
     * Hanya menghitung quantity yang kondisinya GOOD
     * Ini yang akan digunakan untuk progress bar dan penentuan sisa kebutuhan
     */
    public function getReceivedQtyAttribute()
    {
        return (float) $this->materialReceivings()
            ->whereNotIn('item_condition', ['damaged', 'expired']) // Hanya hitung yang Good
            ->sum('received_qty');
    }

    /**
     * Menghitung semua quantity (Good + Damaged + Expired)
     */
    public function getTotalReceivedQtyAttribute()
    {
        return (float) $this->materialReceivings()->sum('received_qty');
    }

    public function getRemainingQtyAttribute()
    {
        // Bulatkan ke 4 angka desimal menggunakan received_qty yang GOOD saja
        $sisa = ((float) $this->qty_bahan) - ((float) $this->received_qty);
        return max(round($sisa, 4), 0);
    }

    public function getReceivingStatusAttribute()
    {
        // Bulatkan juga saat mengecek qty di sini agar akurat
        $received = round((float) $this->received_qty, 4); // Menggunakan received_qty (Good)
        $required = round((float) $this->qty_bahan, 4);

        if ($received <= 0) {
            return 'not_received';
        }

        if ($received < $required) {
            return 'partial_received';
        }

        return 'received';
    }
}