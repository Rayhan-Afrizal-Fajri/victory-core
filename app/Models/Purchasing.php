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

    public function getReceivedQtyAttribute()
    {
        return (float) $this->materialReceivings()->sum('received_qty');
    }

    public function getRemainingQtyAttribute()
    {
        return max(((float) $this->qty_bahan) - ((float) $this->received_qty), 0);
    }

    public function getReceivingStatusAttribute()
    {
        if ($this->received_qty <= 0) {
            return 'not_received';
        }

        if ($this->received_qty < $this->qty_bahan) {
            return 'partial_received';
        }

        return 'received';
    }
}