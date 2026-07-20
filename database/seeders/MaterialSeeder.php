<?php

namespace Database\Seeders;

use App\Models\Material;
use App\Models\Supplier;
use Illuminate\Database\Seeder;

class MaterialSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Fallback untuk dummy vendor
        $vendor = Supplier::first();
        $dummyVendorId = $vendor ? $vendor->id : 1;

        // Data Bahan Baku diekstrak dari seluruh sheet
        $bahans = [
            'Bahan', 'Bahan Badan', 'Bahan Tali', 'Dryfit', 
            'Dryfit Poli-Spandex', 'Rib', 'Rib Poli'
        ];

        foreach ($bahans as $bahan) {
            Material::firstOrCreate(
                ['name' => $bahan, 'category' => 'bahan'],
                [
                    'unit' => 'Kg',
                    'default_color' => 'Hitam',
                    'default_vendor_id' => $dummyVendorId,
                    'default_harga_ecer' => 125000,
                    'default_harga_roll' => 120000,
                    'default_price_type' => 'ecer',
                    'default_usage' => 0.5,
                    'description' => 'Dummy data bahan dari Excel Master Kategori',
                    'is_active' => true,
                ]
            );
        }

        // Data Aksesoris diekstrak dari seluruh sheet
        $aksesorises = [
            'Benang Jahit', 
            'Benang Obras', 
            'Boor', 
            'Bordir', 
            'Cat Sablon', 
            'Dtf', 
            'Kain Keras', 
            'Kain Keras 1', 
            'Kain Keras 2', 
            'Kancing', 
            'Kancing Besi', 
            'Kancing Kait', 
            'Kancing Plastik', 
            'Karet', 
            'Karung', 
            'Kragh', 
            'Label Size', 
            'List', 
            'Manset', 
            'Pcr', 
            'Plastik Opp 30 Micron', 
            'Plastik Pp', 
            'Plastik Pp 50X60Cm', 
            'Rajangan Spunbond', 
            'Stopper', 
            'Sublim', 
            'Tali', 
            'Webbing', 
            'Zipper'
        ];

        foreach ($aksesorises as $aksesoris) {
            Material::firstOrCreate(
                ['name' => $aksesoris, 'category' => 'aksesoris'],
                [
                    'unit' => 'Pcs', // Mayoritas aksesoris menggunakan Pcs
                    'default_color' => 'Hitam',
                    'default_vendor_id' => $dummyVendorId,
                    'default_harga_ecer' => 5000,
                    'default_harga_roll' => 4500,
                    'default_price_type' => 'ecer',
                    'default_usage' => 1,
                    'description' => 'Dummy data aksesoris dari Excel Master Kategori',
                    'is_active' => true,
                ]
            );
        }
    }
}