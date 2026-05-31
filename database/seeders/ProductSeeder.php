<?php

namespace Database\Seeders;

use App\Models\Product;
use App\Models\ProductMaterial;
use App\Models\ProductManufacturingWork;
use Illuminate\Database\Seeder;

class ProductSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Product 1: T-Shirt Oversize
        $tshirtOversize = Product::create([
            'name' => 'T-Shirt Oversize',
            'category' => 'Casual Wear',
            'description' => 'Kaos oversize casual dengan comfort tinggi, cocok untuk usia segala umur.',
            'is_active' => true,
        ]);

        // Add materials for T-Shirt Oversize
        ProductMaterial::create([
            'product_id' => $tshirtOversize->id,
            'material_id' => 1, // Combed Cotton 20s
            'type' => 'bahan',
            'default_usage' => 0.85,
            'default_unit' => 'meter',
            'sort_order' => 1,
            'is_required' => true,
        ]);

        ProductMaterial::create([
            'product_id' => $tshirtOversize->id,
            'material_id' => 2, // Rib Cotton
            'type' => 'bahan',
            'default_usage' => 0.15,
            'default_unit' => 'meter',
            'sort_order' => 2,
            'is_required' => true,
        ]);

        ProductMaterial::create([
            'product_id' => $tshirtOversize->id,
            'material_id' => 5, // Label Woven
            'type' => 'aksesoris',
            'default_usage' => 1,
            'default_unit' => 'pcs',
            'sort_order' => 1,
            'is_required' => true,
        ]);

        ProductMaterial::create([
            'product_id' => $tshirtOversize->id,
            'material_id' => 6, // Polybag
            'type' => 'aksesoris',
            'default_usage' => 1,
            'default_unit' => 'pcs',
            'sort_order' => 2,
            'is_required' => true,
        ]);

        // Add manufacturing works for T-Shirt Oversize
        ProductManufacturingWork::create([
            'product_id' => $tshirtOversize->id,
            'manufacturing_work_id' => 1, // Cutting
            'default_usage' => 1,
            'default_unit' => 'pcs',
            'usage_note' => 'Potong sesuai ukuran',
            'sort_order' => 1,
            'is_required' => true,
        ]);

        ProductManufacturingWork::create([
            'product_id' => $tshirtOversize->id,
            'manufacturing_work_id' => 2, // Jahit
            'default_usage' => 1,
            'default_unit' => 'pcs',
            'usage_note' => 'Jahit badan, lengan, dan leher',
            'sort_order' => 2,
            'is_required' => true,
        ]);

        ProductManufacturingWork::create([
            'product_id' => $tshirtOversize->id,
            'manufacturing_work_id' => 4, // Sablon
            'default_usage' => 1,
            'default_unit' => 'pcs',
            'usage_note' => 'Optional, tergantung design',
            'sort_order' => 3,
            'is_required' => false,
        ]);

        ProductManufacturingWork::create([
            'product_id' => $tshirtOversize->id,
            'manufacturing_work_id' => 3, // QC
            'default_usage' => 1,
            'default_unit' => 'pcs',
            'usage_note' => 'Check kualitas jahitan dan finishing',
            'sort_order' => 4,
            'is_required' => true,
        ]);

        ProductManufacturingWork::create([
            'product_id' => $tshirtOversize->id,
            'manufacturing_work_id' => 7, // Packing
            'default_usage' => 1,
            'default_unit' => 'pcs',
            'usage_note' => 'Lipat dan masukkan ke polybag',
            'sort_order' => 5,
            'is_required' => true,
        ]);

        // Product 2: Hoodie
        $hoodie = Product::create([
            'name' => 'Hoodie',
            'category' => 'Outerwear',
            'description' => 'Hoodie nyaman dengan kualitas premium, perfect untuk casual dan outdoor.',
            'is_active' => true,
        ]);

        // Add materials for Hoodie
        ProductMaterial::create([
            'product_id' => $hoodie->id,
            'material_id' => 4, // Jersey Polyester
            'type' => 'bahan',
            'default_usage' => 1.2,
            'default_unit' => 'meter',
            'sort_order' => 1,
            'is_required' => true,
        ]);

        ProductMaterial::create([
            'product_id' => $hoodie->id,
            'material_id' => 2, // Rib Cotton
            'type' => 'bahan',
            'default_usage' => 0.25,
            'default_unit' => 'meter',
            'sort_order' => 2,
            'is_required' => true,
        ]);

        ProductMaterial::create([
            'product_id' => $hoodie->id,
            'material_id' => 5, // Label Woven
            'type' => 'aksesoris',
            'default_usage' => 1,
            'default_unit' => 'pcs',
            'sort_order' => 1,
            'is_required' => true,
        ]);

        ProductMaterial::create([
            'product_id' => $hoodie->id,
            'material_id' => 7, // Kancing Plastik
            'type' => 'aksesoris',
            'default_usage' => 6,
            'default_unit' => 'pcs',
            'sort_order' => 2,
            'is_required' => true,
        ]);

        // Add manufacturing works for Hoodie
        ProductManufacturingWork::create([
            'product_id' => $hoodie->id,
            'manufacturing_work_id' => 1, // Cutting
            'default_usage' => 1,
            'default_unit' => 'pcs',
            'sort_order' => 1,
            'is_required' => true,
        ]);

        ProductManufacturingWork::create([
            'product_id' => $hoodie->id,
            'manufacturing_work_id' => 2, // Jahit
            'default_usage' => 1,
            'default_unit' => 'pcs',
            'usage_note' => 'Jahit badan, lengan, hood, dan depan',
            'sort_order' => 2,
            'is_required' => true,
        ]);

        ProductManufacturingWork::create([
            'product_id' => $hoodie->id,
            'manufacturing_work_id' => 6, // Finishing
            'default_usage' => 1,
            'default_unit' => 'pcs',
            'usage_note' => 'Pastikan semua jahitan rapi',
            'sort_order' => 3,
            'is_required' => true,
        ]);

        ProductManufacturingWork::create([
            'product_id' => $hoodie->id,
            'manufacturing_work_id' => 3, // QC
            'default_usage' => 1,
            'default_unit' => 'pcs',
            'sort_order' => 4,
            'is_required' => true,
        ]);

        ProductManufacturingWork::create([
            'product_id' => $hoodie->id,
            'manufacturing_work_id' => 7, // Packing
            'default_usage' => 1,
            'default_unit' => 'pcs',
            'sort_order' => 5,
            'is_required' => true,
        ]);

        // Product 3: Polo Shirt
        $polo = Product::create([
            'name' => 'Polo Shirt',
            'category' => 'Casual Wear',
            'description' => 'Polo shirt berkualitas dengan kerah formal, cocok untuk kantor dan casual.',
            'is_active' => true,
        ]);

        // Add materials for Polo Shirt
        ProductMaterial::create([
            'product_id' => $polo->id,
            'material_id' => 1, // Combed Cotton 20s
            'type' => 'bahan',
            'default_usage' => 0.9,
            'default_unit' => 'meter',
            'sort_order' => 1,
            'is_required' => true,
        ]);

        ProductMaterial::create([
            'product_id' => $polo->id,
            'material_id' => 5, // Label Woven
            'type' => 'aksesoris',
            'default_usage' => 1,
            'default_unit' => 'pcs',
            'sort_order' => 1,
            'is_required' => true,
        ]);

        ProductMaterial::create([
            'product_id' => $polo->id,
            'material_id' => 7, // Kancing Plastik
            'type' => 'aksesoris',
            'default_usage' => 3,
            'default_unit' => 'pcs',
            'sort_order' => 2,
            'is_required' => true,
        ]);

        // Add manufacturing works for Polo Shirt
        ProductManufacturingWork::create([
            'product_id' => $polo->id,
            'manufacturing_work_id' => 1, // Cutting
            'default_usage' => 1,
            'default_unit' => 'pcs',
            'sort_order' => 1,
            'is_required' => true,
        ]);

        ProductManufacturingWork::create([
            'product_id' => $polo->id,
            'manufacturing_work_id' => 2, // Jahit
            'default_usage' => 1,
            'default_unit' => 'pcs',
            'usage_note' => 'Jahit kerah, badan, dan lengan',
            'sort_order' => 2,
            'is_required' => true,
        ]);

        ProductManufacturingWork::create([
            'product_id' => $polo->id,
            'manufacturing_work_id' => 3, // QC
            'default_usage' => 1,
            'default_unit' => 'pcs',
            'sort_order' => 3,
            'is_required' => true,
        ]);

        ProductManufacturingWork::create([
            'product_id' => $polo->id,
            'manufacturing_work_id' => 7, // Packing
            'default_usage' => 1,
            'default_unit' => 'pcs',
            'sort_order' => 4,
            'is_required' => true,
        ]);
    }
}
