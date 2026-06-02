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
            'name' => 'Combed Cotton 20s',
            'category' => 'bahan',
            'unit' => 'meter',
            'default_supplier_id' => random_int(1, 5), // Assuming you have 5 suppliers seeded
            'harga_ecer' => 25000,
            'harga_roll' => 22000,
            'roll_qty' => 100,
            'roll_unit' => 'meter',
            'is_active' => true,
        ]);

        Material::create([
            'name' => 'Rib Cotton',
            'category' => 'bahan',
            'unit' => 'meter',
            'default_supplier_id' => random_int(1, 5), // Assuming you have 5 suppliers seeded
            'harga_ecer' => 30000,
            'harga_roll' => 23000,
            'roll_qty' => 100,
            'roll_unit' => 'meter',
            'is_active' => true,
        ]);

        Material::create([
            'name' => 'Twill Cotton',
            'category' => 'bahan',
            'unit' => 'meter',
            'default_supplier_id' => random_int(1, 5), // Assuming you have 5 suppliers seeded
            'harga_ecer' => 28000,
            'harga_roll' => 24000,
            'roll_qty' => 100,
            'roll_unit' => 'meter',
            'is_active' => true,
        ]);

        Material::create([
            'name' => 'Jersey Polyester',
            'category' => 'bahan',
            'unit' => 'meter',
            'default_supplier_id' => random_int(1, 5), // Assuming you have 5 suppliers seeded
            'harga_ecer' => 22000,
            'harga_roll' => 20000,
            'roll_qty' => 100,
            'roll_unit' => 'meter',
            'is_active' => true,
        ]);

        // Aksesoris - Accessories
        Material::create([
            'name' => 'Label Woven',
            'category' => 'aksesoris',
            'unit' => 'pcs',
            'default_supplier_id' => random_int(1, 5), // Assuming you have 5 suppliers seeded
            'harga_ecer' => 500,
            'harga_roll' => 300,
            'roll_qty' => 1000,
            'roll_unit' => 'pcs',
            'is_active' => true,
        ]);

        Material::create([
            'name' => 'Polybag',
            'category' => 'aksesoris',
            'unit' => 'pcs',
            'default_supplier_id' => random_int(1, 5), // Assuming you have 5 suppliers seeded
            'harga_ecer' => 200,
            'harga_roll' => 100,
            'roll_qty' => 1000,
            'roll_unit' => 'pcs',
            'is_active' => true,
        ]);

        Material::create([
            'name' => 'Kancing Plastik',
            'category' => 'aksesoris',
            'unit' => 'pcs',
            'default_supplier_id' => random_int(1, 5), // Assuming you have 5 suppliers seeded
            'harga_ecer' => 150,
            'harga_roll' => 120,
            'roll_qty' => 1000,
            'roll_unit' => 'pcs',
            'is_active' => true,
        ]);

        Material::create([
            'name' => 'Benang Jahit',
            'category' => 'aksesoris',
            'unit' => 'roll',
            'default_supplier_id' => random_int(1, 5), // Assuming you have 5 suppliers seeded
            'harga_ecer' => 5000,
            'harga_roll' => 4500,
            'roll_qty' => 50,
            'roll_unit' => 'roll',
            'is_active' => true,
        ]);

        Material::create([
            'name' => 'Karet Jahit',
            'category' => 'aksesoris',
            'unit' => 'meter',
            'default_supplier_id' => random_int(1, 5), // Assuming you have 5 suppliers seeded
            'harga_ecer' => 3000,
            'harga_roll' => 3000,
            'roll_qty' => 100,
            'roll_unit' => 'meter',
            'is_active' => true,
        ]);

        Material::create([
            'name' => 'Tag Karton',
            'category' => 'aksesoris',
            'unit' => 'pcs',
            'default_supplier_id' => random_int(1, 5), // Assuming you have 5 suppliers seeded
            'harga_ecer' => 800,
            'harga_roll' => 700,
            'roll_qty' => 1000,
            'roll_unit' => 'pcs',
            'is_active' => true,
        ]);
    }
}

