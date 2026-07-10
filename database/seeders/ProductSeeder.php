<?php

namespace Database\Seeders;

use App\Models\Product;
use App\Models\Material;
use App\Models\Supplier;
use App\Models\ManufacturingWork;
use App\Models\ProductMaterial;
use App\Models\ProductManufacturingWork;
use Illuminate\Database\Seeder;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        // 1. MOCKUP MASTER SUPPLIERS (Berdasarkan data tabel)
        $suppliersData = ['Knitto', 'Intan', 'CKP', 'Fabriku', '1001', 'Mapan Plastik', 'Lucas', 'Max Print'];
        $suppliers = [];
        foreach ($suppliersData as $supplierName) {
            $suppliers[$supplierName] = Supplier::firstOrCreate(['nama_perusahaan' => $supplierName]);
        }

        // 2. MOCKUP MASTER MATERIALS (Katalog Bahan Mentah Global)
        $materialsData = [
            'Kain Combed' => ['category' => 'bahan', 'unit' => 'kg'],
            'Bahan Rib' => ['category' => 'bahan', 'unit' => 'kg'],
            'Benang Katun' => ['category' => 'aksesoris', 'unit' => 'lusin'],
            'Plastik OPP 30 Mikron' => ['category' => 'aksesoris', 'unit' => 'Pc'],
            'Label Woven' => ['category' => 'aksesoris', 'unit' => 'Pc'],
            'Sablon Plastisol' => ['category' => 'aksesoris', 'unit' => 'kg'],
            'Sablon DTF' => ['category' => 'aksesoris', 'unit' => 'cm'],
        ];
        $materials = [];
        foreach ($materialsData as $name => $data) {
            $materials[$name] = Material::firstOrCreate(
                ['name' => $name],
                ['category' => $data['category'], 'unit' => $data['unit'], 'is_active' => true]
            );
        }

        // 3. MOCKUP MASTER MANUFACTURING WORKS
        $worksData = ['Cutting', 'Jahit', 'QC', 'Sablon', 'Pasang Kancing'];
        $works = [];
        foreach ($worksData as $workName) {
            $works[$workName] = ManufacturingWork::firstOrCreate(
                ['name' => $workName],
                ['process_behavior' => $workName === 'QC' ? 'costing_only' : 'production_process', 'is_active' => true]
            );
        }

        // 4. DATA PRODUK DARI TABEL CLIENT
        $productsToSeed = [
            [
                'name' => 'T-shirt S/S combed premium Sablon Premium sablon 1-3 warna',
                'category' => 'Casual Wear',
                'materials' => [
                    ['mat' => 'Kain Combed', 'sup' => 'Knitto', 'qty' => 0.23, 'unit' => 'kg', 'price' => 122000],
                    ['mat' => 'Bahan Rib', 'sup' => 'Knitto', 'qty' => 0.008, 'unit' => 'kg', 'price' => 122000],
                    ['mat' => 'Benang Katun', 'sup' => '1001', 'qty' => 0.04, 'unit' => 'lusin', 'price' => 25000],
                    ['mat' => 'Plastik OPP 30 Mikron', 'sup' => 'Mapan Plastik', 'qty' => 1, 'unit' => 'Pc', 'price' => 370],
                    ['mat' => 'Label Woven', 'sup' => '1001', 'qty' => 1, 'unit' => 'Pc', 'price' => 15],
                    ['mat' => 'Sablon Plastisol', 'sup' => 'Lucas', 'qty' => 0.05, 'unit' => 'kg', 'price' => 96570],
                ],
                'works' => ['Cutting', 'Jahit', 'QC', 'Sablon']
            ],
            [
                'name' => 'T-shirt S/S combed reguler Sablon Premium sablon 1-3 warna',
                'category' => 'Casual Wear',
                'materials' => [
                    ['mat' => 'Kain Combed', 'sup' => 'CKP', 'qty' => 0.23, 'unit' => 'kg', 'price' => 122000],
                    ['mat' => 'Bahan Rib', 'sup' => 'CKP', 'qty' => 0.008, 'unit' => 'kg', 'price' => 122000],
                    ['mat' => 'Benang Katun', 'sup' => '1001', 'qty' => 0.04, 'unit' => 'lusin', 'price' => 25000],
                    ['mat' => 'Plastik OPP 30 Mikron', 'sup' => 'Mapan Plastik', 'qty' => 1, 'unit' => 'Pc', 'price' => 370],
                    ['mat' => 'Label Woven', 'sup' => '1001', 'qty' => 1, 'unit' => 'Pc', 'price' => 15],
                    ['mat' => 'Sablon DTF', 'sup' => 'Max Print', 'qty' => 0.1, 'unit' => 'cm', 'price' => 35000],
                ],
                'works' => ['Cutting', 'Jahit', 'QC', 'Sablon']
            ],
            [
                'name' => 'T-shirt S/S combed premium DTF',
                'category' => 'Casual Wear',
                'materials' => [
                    ['mat' => 'Kain Combed', 'sup' => 'Fabriku', 'qty' => 0.23, 'unit' => 'kg', 'price' => 122000],
                    ['mat' => 'Bahan Rib', 'sup' => 'Fabriku', 'qty' => 0.008, 'unit' => 'kg', 'price' => 114000],
                    ['mat' => 'Benang Katun', 'sup' => '1001', 'qty' => 0.04, 'unit' => 'lusin', 'price' => 25000],
                    ['mat' => 'Plastik OPP 30 Mikron', 'sup' => 'Mapan Plastik', 'qty' => 1, 'unit' => 'Pc', 'price' => 370],
                    ['mat' => 'Label Woven', 'sup' => '1001', 'qty' => 1, 'unit' => 'Pc', 'price' => 15],
                    ['mat' => 'Sablon Plastisol', 'sup' => 'Lucas', 'qty' => 0.05, 'unit' => 'kg', 'price' => 96570],
                ],
                'works' => ['Cutting', 'Jahit', 'QC', 'Sablon']
            ],
            [
                'name' => 'T-shirt S/S combed Reguler DTF',
                'category' => 'Casual Wear',
                'materials' => [
                    ['mat' => 'Kain Combed', 'sup' => 'Intan', 'qty' => 0.23, 'unit' => 'kg', 'price' => 122000],
                    ['mat' => 'Bahan Rib', 'sup' => 'Intan', 'qty' => 0.008, 'unit' => 'kg', 'price' => 114000],
                    ['mat' => 'Benang Katun', 'sup' => '1001', 'qty' => 0.04, 'unit' => 'lusin', 'price' => 25000],
                    ['mat' => 'Plastik OPP 30 Mikron', 'sup' => 'Mapan Plastik', 'qty' => 1, 'unit' => 'Pc', 'price' => 370],
                    ['mat' => 'Label Woven', 'sup' => '1001', 'qty' => 1, 'unit' => 'Pc', 'price' => 15],
                    ['mat' => 'Sablon DTF', 'sup' => 'Max Print', 'qty' => 0.1, 'unit' => 'cm', 'price' => 35000],
                ],
                'works' => ['Cutting', 'Jahit', 'QC', 'Sablon']
            ],
        ];

        // 5. EKSEKUSI PEMBUATAN PRODUK & RELASINYA
        foreach ($productsToSeed as $prodData) {
            $product = Product::create([
                'name' => $prodData['name'],
                'category' => $prodData['category'],
                'is_active' => true,
                'is_pattern_available' => true,
            ]);

            // Insert Materials
            $sortOrderMat = 1;
            foreach ($prodData['materials'] as $matSpec) {
                ProductMaterial::create([
                    'product_id' => $product->id,
                    'material_id' => $materials[$matSpec['mat']]->id,
                    'default_supplier_id' => $suppliers[$matSpec['sup']]->id,
                    'type' => $materials[$matSpec['mat']]->category, // Ambil dari default master
                    'default_usage' => $matSpec['qty'],
                    'default_unit' => $matSpec['unit'],
                    'harga_ecer' => $matSpec['price'],
                    'harga_roll' => $matSpec['price'], // Disamakan sementara
                    'sort_order' => $sortOrderMat++,
                    'is_required' => true,
                ]);
            }

            // Insert Manufacturing Works
            $sortOrderWork = 1;
            foreach ($prodData['works'] as $workName) {
                // Simpan instance model master ke dalam variabel agar lebih rapi
                $workMaster = $works[$workName]; 

                ProductManufacturingWork::create([
                    'product_id'            => $product->id,
                    'manufacturing_work_id' => $workMaster->id,
                    
                    // Ambil default_max_estimate dari master ManufacturingWork
                    'max_estimate'          => $workMaster->default_max_estimate, 
                    
                    // Jika Anda memiliki default cost di master, panggil juga di sini.
                    // Contoh jika nilainya statis atau mau diset 0 sementara:
                    'cost_per_pcs'          => 0, 

                    'default_usage'         => 1,
                    'default_unit'          => 'pcs', // atau bisa $workMaster->default_unit
                    'sort_order'            => $sortOrderWork++,
                    'is_required'           => true,
                ]);
            }
        }
    }
}