<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Attachment extends Model
{
    protected $fillable = [
        'pesanan_id',
        'kategori',
        'file_path',
        'uploaded_by',
        'catatan',
    ];

    public function pesanan()
    {
        return $this->belongsTo(Pesanan::class);
    }

    public function uploadedBy()
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }
}
