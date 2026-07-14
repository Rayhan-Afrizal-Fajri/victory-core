<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Design extends Model
{
    protected $fillable = [
        'pesanan_id',
        'designer_id',
        'file_path',
        'preview_path',
        'revision_note',
        'customer_revision_note',
        'designer_revision_note',
        'status',
        'uploaded_at',
        'approved_at',
        'approved_by',
    ];

    public function pesanan()
    {
        return $this->belongsTo(Pesanan::class);
    }

    public function designer()
    {
        return $this->belongsTo(User::class, 'designer_id');
    }

    public function approvedBy()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}
