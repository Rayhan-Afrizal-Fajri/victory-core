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
        // Daftar semua produk yang diekstrak dari PDF
        $products = [
            // T-Shirt & Casual Wear
            'T-shirt S/S combed premium Sablon Premium sablon 1-3 warna',
            'T-shirt S/S combed reguler Sablon Premium sablon 1-3 warna',
            'T-shirt S/S combed premium DTF',
            'T-shirt S/S combed Reguler DTF',
            'T-shirt Oversize combed premium Sablon Premium sablon 1-3 warna',
            'T-shirt Oversize combed reguler Sablon Premium sablon 1-3 warna',
            'T-shirt Oversize combed premium DTF',
            'T-shirt Oversize combed Reguler DTF',
            'T-shirt Boxy combed premium Sablon Premium sablon 1-3 warna',
            'T-shirt Boxy combed reguler Sablon Premium sablon 1-3 warna',
            'T-shirt Boxy combed premium DTF',
            'T-shirt Boxy combed Reguler DTF',
            'T-shirt L/S combed premium Sablon Premium sablon 1-3 warna',
            'T-shirt L/S combed reguler Sablon Premium sablon 1-3 warna',
            'T-shirt L/S combed premium DTF',
            'T-shirt L/S combed Reguler DTF',
            'T-shirt Raglan S/S combed premium Sablon Premium sablon 1-3 warna',
            'T-shirt Raglan S/S combed reguler Sablon Premium sablon 1-3 warna',
            'T-shirt Raglan S/S combed premium DTF',
            'T-shirt Raglan S/S combed Reguler DTF',
            'T-shirt Raglan L/S combed premium Sablon Premium sablon 1-3 warna',
            'T-shirt Raglan L/S combed reguler Sablon Premium sablon 1-3 warna',
            'T-shirt Raglan L/S combed premium DTF',
            'T-shirt Raglan L/S combed Reguler DTF',
            'T-shirt S/S Poli single Sablon Premium sablon 1-3 warna',
            'T-shirt S/S Poli single DTF / sablon logo',
            'T-shirt L/S Poli single Sablon Premium sablon 1-3 warna',
            'T-shirt L/S Poli single DTF / sablon Logo',
            
            // Jersey & Sportswear
            'Jersey Dryfit S/S full print Premium Victorylabs',
            'Jersey Dryfit S/S full print Premium Spandex Victorylabs',
            'Jersey Dryfit L/S full print Premium Victorylabs',
            'Jersey Dryfit L/S full print Premium Spandex Victorylabs',
            'Jersey Dryfit Raglan S/S full print Premium Victorylabs',
            'Jersey Dryfit Raglan S/S full print Premium Spandex Victorylabs',
            'Jersey Dryfit Raglan L/S full print Premium Victorylabs',
            'Jersey Dryfit Raglan L/S full print Premium Spandex Victorylabs',
            'Polo Jersey Dryfit S/S Sublim Premium Victorylabs',
            'Polo Jersey Dryfit S/S Sublim Premium Spandex Victorylabs',
            'Polo-Jersey Dryfit L/S Sublim Premium Victorylabs',
            'Polo-Jersey Dryfit L/S Sublim Premium Spandex Victorylabs',
            
            // Polo Shirts
            'Polo-Shirt S/S Poli soft Victorylabs Bordir 1-3 Titik Logo',
            'Polo-Shirt S/S Poli soft Victorylabs Kragh Custom Bordir 1-3 Titik Logo',
            'Polo-Shirt L/S Poli soft Victorylabs Bordir 1-3 Titik Logo',
            'Polo-Shirt L/S Poli soft Victorylabs Kragh Custom Bordir 1-3 Titik Logo',
            'Polo-Shirt S/S Lacoste Pique Premium Bordir 1-3 Titik Logo',
            'Polo-Shirt S/S Lacoste Pique Premium Kragh Custom Bordir 1-3 Titik Logo',
            'Polo-Shirt L/S Lacoste Pique Premium Bordir 1-3 Titik Logo',
            'Polo-Shirt L/S Lacoste Pique Premium Kragh Custom Bordir 1-3 Titik Logo',
            'Polo-Shirt S/S Combed Premium Bordir/sablon 1-3 Titik Logo',
            'Polo-Shirt S/S Combed Premium Kragh Custom Bordir/sablon 1-3 Titik Logo',
            'Polo-Shirt L/S Combed Premium Bordir/sablon 1-3 Titik Logo',
            'Polo-Shirt L/S Combed Premium Kragh Custom Bordir /sablon 1-3 Titik Logo',
            'Polo-Shirt S/S Scuba Tebal Bordir/sablon 1-3 Titik Logo',
            'Polo-Shirt L/S Scuba Tebal Bordir/sablon 1-3 Titik Logo',
            'Polo-Shirt S/S Lacoste Reguler PE Bordir/sablon 1-3 Titik Logo',
            'Polo-Shirt S/S Lacoste Reguler PE Kragh Custom Bordir/sablon 1-3 Titik Logo',
            'Polo-Shirt L/S Lacoste Reguler PE Bordir/sablon 1-3 Titik Logo',
            'Polo-Shirt L/S Lacoste Reguler PE Kragh Custom Bordir / sablon 1-3 Titik Logo',

            // Kemeja & Uniforms
            'Kemeja Seragam S/S Drill/Tropical Premium',
            'Kemeja Seragam S/S Drill Heavy Duty',
            'Kemeja Seragam S/S Toyobo Premium',
            'Kemeja Seragam S/S High Twist Premium',
            'Kemeja Seragam L/S Drill/Tropical Premium',
            'Kemeja Seragam L/S Drill Heavy Duty',
            'Kemeja Seragam L/S Toyobo Premium',
            'Kemeja Seragam L/S High Twist Premium',
            'Kemeja Seragam S/S Toyobo full Print',
            'Kemeja Seragam S/S Hight Twist full print',
            'Kemeja Seragam S/S Poli - Micro full print',
            'Kemeja Seragam L/S Toyobo full Print',
            'Kemeja Seragam L/S Hight Twist full print',
            'Kemeja Seragam L/S Poli - Micro full print',

            // Bottoms (Celana)
            'Celana Panjang Sopan Drill/Tropical (karet/Non Karet)',
            'Celana Panjang Sopan Drill/Tropical Heavy Duty (karet/Non Karet)',
            'Celana Panjang Sopan High Twist',
            'Celana Panjang Engineering Drill/Tropical (karet/Non Karet)',
            'Celana Panjang Engineering Drill/Tropical Heavy Duty (karet/Non Karet)',
            'Celana Panjang Engineering High Twist',
            'Celana Panjang olah raga diadora Poli',
            'Celana Panjang olah raga Baby Tery Poli',
            'Celana pendek Drill/Tropical (karet/Non Karet)',
            'Celana pendek Drill/Tropical Heavy Duty (karet/Non Karet)',
            'Celana pendek Olah raga Jersey Dryfit',
            'Celana pendek Olah raga DSP Stripe',

            // Outerwear (Warepack, Rompi, Hoodie, Jacket)
            'Warepack bengkel Drill bordir 1-3 titik',
            'Warepack Drill Heavy Duty (premium) bordir 1-3 titik',
            'Rompi Event Jersey ekonomis (samping karet) sablon 1-2 warna',
            'Rompi Lapangan drill reguler bordir 1-2 titik',
            'Rompi Lapangan drill Heavy Duty (Premium) bordir 1-2 titik',
            'Rompi Lapangan Parasit Taslan bordir 1-2 titik',
            'Rompi Lapangan drill reguler bordir 1-2 titik + Inner',
            'Rompi Lapangan drill Heavy Duty (Premium) bordir 1-2 titik + Inner',
            'Rompi Lapangan Parasit Taslan bordir 1-2 titik + Inner',
            'Crew Neck Fleece Premium CVC/ Cotton sablon/Bordir 1-3 warna',
            'Crew Neck Fleece poliester / Cotton sablon/Bordir 1-3 warna',
            'Hoodie Fleece Premium Non Zipper CVC/Cotton sablon/Bordir 1-3 warna',
            'Hoodie Fleece poliester Non Zipper / Cotton sablon/Bordir 1-3 warna',
            'Hoodie Fleece Premium Zipper CVC/ Cotton sablon/Bordir 1-3 warna',
            'Hoodie Fleece poliester Zipper / Cotton sablon/Bordir 1-3 warna',
            'Jacket Varsity Lotto',
            'Jacket Varsity Puma + Inner (bordir 1-3 titik)',
            'Jacket Varsity Taslan + Inner (bordir 1-3 titik)',
            'Jacket Varsity Lotto + Inner (bordir 1-3 titik)',
            'Jacket Parka Puma + Bordir (waterproof Zipper) + Inner',
            'Jacket Parka Taslan + Bordir (waterproof Zipper) + inner',
            'Jacket Parka hoddie Drill Premium Bordir + Inner',
            'Jacket Parka hoddie Drill Heavy Duty + Inner',
            'Jacket Winter Parasit KRA Quilting + Inner (min 300Pc)',
            'Jacket Windbreaker Dusky',
            'Jacket Windbreaker Parasit KRA',

            // Bags (Totte Bag, Foldable, Pouch)
            'Totte Bag Canvas Ekonomis 23x30 sablon 1 warna GL',
            'Totte Bag Canvas Ekonomis 28x35 sablon 1 warna GL',
            'Totte Bag Canvas Ekonomis 33x40 sablon 1 warna GL',
            'Totte Bag Canvas Premium 23x30 sablon 1-2 warna Plastisol',
            'Totte Bag Canvas Premium 28x35 sablon 1-2 warna Plastisol',
            'Totte Bag Canvas Premium 33x40 sablon 1-2 warna Plastisol',
            'Totte Bag Canvas Reguler 23x30 sablon 1-2 warna Plastisol',
            'Totte Bag Canvas Reguler 28x35 sablon 1-2 warna Plastisol',
            'Totte Bag Canvas Reguler 33x40 sablon 1-2 warna Plastisol',
            'Totte Bag Canvas Premium CTR 23x30 Full Print',
            'Totte Bag Canvas Premium CTR 28x35 Full Print',
            'Totte Bag Canvas Premium CTR 33x40 Full Print',
            'Totte Bag Canvas Premium RBO 23x30 Full Print',
            'Totte Bag Canvas Premium RBO 28x35 Full Print',
            'Totte Bag Canvas Premium RBO 33x40 Full Print',
            'Totte Bag Blacu Tebal 23x30 sablon 1-2 warna GL',
            'Totte Bag Blacu Tebal 28x35 sablon 1-2 warna GL',
            'Totte Bag Blacu Tebal 33x40 sablon 1-2 warna GL',
            'Totte Bag Blacu Sedang 23x30 sablon 1-2 warna GL',
            'Totte Bag Blacu Sedang 28x35 sablon 1-2 warna GL',
            'Totte Bag Blacu Sedang 33x40 sablon 1-2 warna GL',
            'Totte Bag Twill 2/1 23x30 GL',
            'Totte Bag Twill 2/1 28x35 GL',
            'Totte Bag Twill 2/1 33x40 GL',
            'Totte Bag Spunbond 40x30x8 (press) sablon 1-2 warna 75 grm',
            'Totte Bag Spunbond costum (press) sablon 1-2 warna 75 grm',
            'Totte Bag Spunbond costum sablon 1-2 warna 75 grm (35x30x10)',
            'Totte Bag Spunbond costum sablon 1-2 warna 100 grm (35x30x10)',
            'Foldable Parasit Pola DSP Reguler 28x35 sablon 1 warna',
            'Foldable Parasit Pola DSP Reguler 33x40 sablon 1 warna',
            'Foldable Parasit Pola DSP Reguler 28x35 full print',
            'Foldable Parasit Pola DSP Reguler 33x40 Full Print',
            'Foldable Parasit DSP Pola tali samping 28x35',
            'Foldable Parasit DSP Pola tali samping 33x40',
            'Foldable Parasit DSP Pola tali samping 28x35 full print',
            'Foldable Parasit DSP Pola tali samping 33x40 Full Print',
            'Foldable Parasit DSP Pola tali bulat 28x35',
            'Foldable Parasit DSP Pola tali bulat 33x40',
            'Foldable Parasit DSP Pola tali bulat 28x35 full print',
            'Foldable Parasit DSP Pola tali bulat 33x40 Full Print',
            'Foldable Parasit Premium JN Pola Reguler 28x35',
            'Foldable Parasit Premium JN Pola Reguler 33x40',
            'Foldable Parasit Premium JN Pola Reguler 28x35 full print',
            'Foldable Parasit Premium JN Pola Reguler 33x40 Full Print',
            'Foldable Parasit Premium JN Pola tali samping 28x35',
            'Foldable Parasit Premium JN Pola tali samping 33x40',
            'Foldable Parasit Premium JN Pola tali samping 28x35 full print',
            'Foldable Parasit Premium JN Pola tali samping 33x40 Full Print',
            'Foldable Parasit Premium JN Pola bulat 28x35',
            'Foldable Parasit Premium JN Pola bulat 33x40',
            'Foldable Parasit Premium JN Pola bulat 28x35 full print',
            'Foldable Parasit Premium JN Pola bulat 33x40 Full Print',
            'Foldable Bag Canvas Premium sablon 1-3 warna 28x35',
            'Foldable Bag Canvas Premium sablon 1-3 warna 33x40',
            'Foldable Bag Canvas Premium Full Print 28x35',
            'Foldable Bag Canvas Premium Full Print 33x40',
            'Pouch mika Rainbow Blue/Red Small 16x9x6',
            'Pouch mika Rainbow Blue/Red Medium 21x12x12',
            'Pouch mika 0.8 Premium Small 16x9x6',
            'Pouch mika 0.8 Premium Medium 21x12x12',
            'Pouch mika reguler 0.4 Small 16x9x6',
            'Pouch mika reguler 0.4 Medium 21x12x12',
            'Pouch Hand bag Synthetic Leather emboss/ Sablon small 20x12x6',
            'Pouch Hand bag Parasit + Quilting small 20x12x6',
            'Pouch Hand bag Cordura Full Print small 20x12x6',
            'Pouch Hand bag Cordura/Dinir small 20x12x6',
            'Pouch Hand bag Canvas Full Print small 20x12x6',
            'Pouch Hand bag Canvas Premium Sablon small 20x12x6',
            'Pouch Hand bag Synthetic Leather emboss/ Sablon Big 23x13x7.5',
            'Pouch Hand bag Parasit + Quilting small Big 23x13x7.5',
            'Pouch Hand bag Cordura Full Print small Big 23x13x7.5',
            'Pouch Hand bag Cordura/Dinir small Big 23x13x7.5',
            'Pouch Hand bag Canvas Full Print small Big 23x13x7.5',
            'Pouch Hand bag Canvas Premium Sablon small Big 23x13x7.5',
            'Pouch Cordura Full Print Small 12x22',
            'Pouch Canvas Premium Full Print Small 12x22',
            'Pouch Canvas Premium Sablon Small 12x22',
            'Pouch Canvas Reguler Full Print Small 12x22',
            'Pouch Canvas Reguler Sablon 1-2 warna Small 12x22',
            'Pouch Twill 2/1 Full Print Small 12x22',
            'Pouch Twill 2/1 Sablon Small 12x22',
            'Pouch Jala Small 12x22',
            'Pouch Taslan GN Small Full Print 12x22',
            'Pouch Cordura Full Print Medium 18x23',
            'Pouch Canvas Premium Full Print Medium 18x23',
            'Pouch Canvas Premium Sablon Medium 18x23',
            'Pouch Canvas Reguler Full Print Medium 18x23',
            'Pouch Canvas Reguler Sablon 1-2 warna Medium 18x23',
            'Pouch Twill 2/1 Full Print Medium Medium 18x23',
            'Pouch Twill 2/1 Sablon Medium 18x23',
            'Pouch Jala Medium 18x23',
            'Pouch Taslan GN Medium Full Print 18x23',

            // Aprons
            'Apron Drill Premium Half bordir',
            'Apron Drill Premium Long bordir',
            'Apron Drill Premium Long To Back bordir',
            'Apron Canvas Premium Half bordir',
            'Apron Canvas Premium Long bordir',
            'Apron Canvas Premium Long To Back bordir',
            'Apron Canvas Premium CTR Half Full Print',
            'Apron Canvas Premium CTR Long Full Print',
            'Apron Canvas Premium CTR Long To Back Full Print',

            // Rashguards & Others
            'Rashguard Premium Nylon Spandex raglan S/S (S-XL)',
            'Rashguard Premium Nylon Spandex raglan S/S (Big Size)',
            'Rashguard Premium Nylon Spandex raglan L/S (S-XL)',
            'Rashguard Premium Nylon Spandex raglan L/S (Big Size)',
            'Rashguard Premium Nylon kombinasi Poliester Sublim Raglan S/S (S-XL)',
            'Rashguard Premium Nylon kombinasi Poliester Sublim Raglan S/S (Big Size)',
            'Rashguard Premium Nylon kombinasi Poliester Sublim Raglan L/S (S-XL)',
            'Rashguard Premium Nylon kombinasi Poliester Sublim Raglan L/S (Big Size)',
            'Rashguard Premium Poliester Spandex Full Print S/S (S-XL)',
            'Rashguard Premium Poliester Spandex Full Print S/S (Big Size)',
            'Rashguard Premium Poliester Spandex Full Print L/S (S-XL)',
            'Rashguard Premium Poliester Spandex Full Print L/S (Big Size)',
            'Boy Short Premium Poli-Spandex',
            
            // CMT / Services
            'CMT + Aksesories Kemeja Basic pendek',
            'CMT Kemeja Basic pendek',
            'CMT + Aksesories Kemeja Tailor pendek',
            'CMT Kemeja Tailor pendek',
            'CMT + Aksesories Kemeja Basic Tangan Panjang',
            'CMT Kemeja Basic Tangan Panjang',
            'CMT T-shirt Basic bahu rantai',
            'CMT T-shirt Basic Bahu Stik',
            'CMT Polo Shirt',
            'CMT + Aksesories Jacket Basic',
            'CMT Jacket Basic',
            'CMT + Aksesories Jacket variasi',
            'CMT Jacket variasi',
            'CMT + Aksesories celana',
            'CMT celana',
            'Plastik Zipper',
            'Plastik Zip Lock',
        ];

        foreach ($products as $productName) {
            // Determine Category based on Name
            $category = $this->determineCategory($productName);

            // Create Product
            $product = Product::create([
                'name' => $productName,
                'category' => $category,
                'description' => $productName . ' berkualitas premium, cocok untuk kebutuhan Anda.',
                'is_active' => true,
            ]);

            // Attach Default Materials and Works
            $this->attachDefaultMaterials($product->id, $category);
            $this->attachDefaultWorks($product->id, $category);
        }
    }

    /**
     * Menentukan kategori secara otomatis berdasarkan kata kunci dari nama produk
     */
    private function determineCategory(string $productName): string
    {
        $productName = strtolower($productName);

        if (str_contains($productName, 't-shirt') || str_contains($productName, 'polo')) {
            return 'Casual Wear';
        } elseif (str_contains($productName, 'jersey') || str_contains($productName, 'rashguard') || str_contains($productName, 'olah raga')) {
            return 'Sportswear';
        } elseif (str_contains($productName, 'kemeja')) {
            return 'Uniform & Workwear';
        } elseif (str_contains($productName, 'celana')) {
            return 'Bottoms';
        } elseif (str_contains($productName, 'jacket') || str_contains($productName, 'hoodie') || str_contains($productName, 'rompi') || str_contains($productName, 'warepack')) {
            return 'Outerwear';
        } elseif (str_contains($productName, 'bag') || str_contains($productName, 'pouch') || str_contains($productName, 'apron') || str_contains($productName, 'plastik')) {
            return 'Accessories';
        } elseif (str_contains($productName, 'cmt')) {
            return 'Services / CMT';
        }

        return 'General / Lainnya';
    }

    /**
     * Menambahkan Material standar yang disesuaikan dengan kategori (Berdasarkan template awal)
     */
    private function attachDefaultMaterials(int $productId, string $category): void
    {
        $materials = [];

        // Standarisasi material untuk Casual/Sport
        if ($category === 'Casual Wear' || $category === 'Sportswear') {
            $materials = [
                ['material_id' => 1, 'type' => 'bahan', 'default_usage' => 0.85, 'default_unit' => 'meter', 'sort_order' => 1], // Cotton/Jersey
                ['material_id' => 5, 'type' => 'aksesoris', 'default_usage' => 1, 'default_unit' => 'pcs', 'sort_order' => 2], // Label Woven
                ['material_id' => 6, 'type' => 'aksesoris', 'default_usage' => 1, 'default_unit' => 'pcs', 'sort_order' => 3], // Polybag
            ];
        } 
        // Standarisasi material untuk Outerwear/Uniform
        elseif ($category === 'Outerwear' || $category === 'Uniform & Workwear') {
            $materials = [
                ['material_id' => 4, 'type' => 'bahan', 'default_usage' => 1.5, 'default_unit' => 'meter', 'sort_order' => 1], // Drill/Fleece/Taslan
                ['material_id' => 7, 'type' => 'aksesoris', 'default_usage' => 5, 'default_unit' => 'pcs', 'sort_order' => 2], // Kancing / Zipper
                ['material_id' => 6, 'type' => 'aksesoris', 'default_usage' => 1, 'default_unit' => 'pcs', 'sort_order' => 3], // Polybag
            ];
        }
        // Standarisasi material untuk Tas & Aksesoris
        elseif ($category === 'Accessories') {
            $materials = [
                ['material_id' => 10, 'type' => 'bahan', 'default_usage' => 0.5, 'default_unit' => 'meter', 'sort_order' => 1], // Canvas / Taslan / Mika
                ['material_id' => 6, 'type' => 'aksesoris', 'default_usage' => 1, 'default_unit' => 'pcs', 'sort_order' => 2], // Polybag
            ];
        }

        foreach ($materials as $mat) {
            ProductMaterial::create(array_merge(['product_id' => $productId, 'is_required' => true], $mat));
        }
    }

    /**
     * Menambahkan Workflow standar yang disesuaikan dengan kategori
     */
    private function attachDefaultWorks(int $productId, string $category): void
    {
        // Pengecualian: CMT atau Plastik murni mungkin tidak butuh manufacturing works default
        if ($category === 'Services / CMT') return;

        $works = [
            ['manufacturing_work_id' => 1, 'usage_note' => 'Potong sesuai pola dan ukuran', 'sort_order' => 1], // Cutting
            ['manufacturing_work_id' => 2, 'usage_note' => 'Jahit perakitan produk', 'sort_order' => 2], // Jahit
        ];

        // Tambahan Sablon / Bordir jika bukan Bottoms
        if ($category !== 'Bottoms' && $category !== 'Accessories') {
            $works[] = ['manufacturing_work_id' => 4, 'usage_note' => 'Sablon/Bordir (menyesuaikan tipe)', 'sort_order' => 3];
        }

        // Finishing standard
        $works[] = ['manufacturing_work_id' => 3, 'usage_note' => 'Check kualitas jahitan', 'sort_order' => 4]; // QC
        $works[] = ['manufacturing_work_id' => 7, 'usage_note' => 'Lipat dan packing', 'sort_order' => 5]; // Packing

        foreach ($works as $work) {
            ProductManufacturingWork::create([
                'product_id' => $productId,
                'manufacturing_work_id' => $work['manufacturing_work_id'],
                'default_usage' => 1,
                'default_unit' => 'pcs',
                'usage_note' => $work['usage_note'],
                'sort_order' => $work['sort_order'],
                'is_required' => true,
            ]);
        }
    }
}