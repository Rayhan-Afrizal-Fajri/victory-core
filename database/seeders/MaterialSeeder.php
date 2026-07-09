<?php

namespace Database\Seeders;

use App\Models\Material;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class MaterialSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Bahan - Fabrics
        Material::create([
            'name' => 'Kain',
            'category' => 'bahan',
            'unit' => 'kg',
            'default_color' => 'Hitam',
            // 'default_supplier_id' => random_int(Supplier::first()->id, Supplier::latest()->first()->id), // Assuming you have 5 suppliers seeded
            // 'harga_ecer' => 122000,
            // 'harga_roll' => 125000,
            // 'roll_qty' => 100,
            // 'roll_unit' => 'kg',
            'description' => 'Combed',
            'is_active' => true,
        ]);

        Material::create([
            'name' => 'Rib',
            'category' => 'bahan',
            'unit' => 'kg',
            'default_color' => 'Hitam',
            // 'default_supplier_id' => random_int(Supplier::first()->id, Supplier::latest()->first()->id), // Assuming you have 5 suppliers seeded
            // 'harga_ecer' => 122000,
            // 'harga_roll' => 114000,
            // 'roll_qty' => 100,
            // 'roll_unit' => 'kg',
            'description' => 'Combed',
            'is_active' => true,
        ]);

        Material::create([
            'name' => 'Benang',
            'category' => 'aksesoris',
            'unit' => 'lusin',
            'default_color' => 'Hitam',
            // 'default_supplier_id' => random_int(Supplier::first()->id, Supplier::latest()->first()->id), // Assuming you have 5 suppliers seeded
            // 'harga_ecer' => 25000,
            // 'harga_roll' => 114000,
            // 'roll_qty' => 100,
            // 'roll_unit' => 'kg',
            'description' => 'Katun',
            'is_active' => true,
        ]);

        Material::create([
            'name' => 'Plastik',
            'category' => 'aksesoris',
            'unit' => 'Pcs',
            'default_color' => 'Hitam',
            // 'default_supplier_id' => random_int(Supplier::first()->id, Supplier::latest()->first()->id), // Assuming you have 5 suppliers seeded
            // 'harga_ecer' => 370,
            // 'harga_roll' => 10000,
            // 'roll_qty' => 100,
            // 'roll_unit' => 'kg',
            'description' => 'opp 30 mikron ?x?',
            'is_active' => true,
        ]);

        Material::create([
            'name' => 'Label Size',
            'category' => 'aksesoris',
            'unit' => 'Pcs',
            'default_color' => 'Hitam',
            // 'default_supplier_id' => random_int(Supplier::first()->id, Supplier::latest()->first()->id), // Assuming you have 5 suppliers seeded
            // 'harga_ecer' => 15,
            // 'harga_roll' => 10000,
            // 'roll_qty' => 100,
            // 'roll_unit' => 'kg',
            'description' => 'Woven',
            'is_active' => true,
        ]);

        Material::create([
            'name' => 'Sablon',
            'category' => 'aksesoris',
            'unit' => 'Pcs',
            'default_color' => 'Hitam',
            // 'default_supplier_id' => random_int(Supplier::first()->id, Supplier::latest()->first()->id), // Assuming you have 5 suppliers seeded
            // 'harga_ecer' => 15,
            // 'harga_roll' => 10000,
            // 'roll_qty' => 100,
            // 'roll_unit' => 'kg',
            'description' => 'Woven',
            'is_active' => true,
        ]);
    }
}

