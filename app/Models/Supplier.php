<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Supplier extends Model
{
    protected $fillable = [
        'nama',
        'nama_perusahaan',
        'email',
        'kategori',
        'kontak',
        'alamat'  
    ];

    public function purchasing()
    {
        return $this->hasMany(Purchasing::class);
    }

    public function materials()
    {
        return $this->hasMany(Material::class, 'default_vendor_id');
    }

    public function manufacturingWork()
    {
        return $this->hasMany(ManufacturingWork::class, 'default_vendor_id');
    }

    public function productMaterials()
    {
        return $this->hasMany(ProductMaterial::class, 'default_supplier_id');
    }

    public function productManufacturingWorks()
    {
        return $this->hasMany(ProductManufacturingWork::class, 'default_supplier_id');
    }

    public function canBeDeleted(): bool
    {
        return !(
            $this->purchasing()->exists() ||
            $this->materials()->exists() ||
            $this->manufacturingWork()->exists() ||
            $this->productMaterials()->exists() ||
            $this->productManufacturingWorks()->exists()
        );
    }
}
