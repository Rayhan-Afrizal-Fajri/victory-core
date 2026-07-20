<?php

namespace Database\Seeders;

use App\Models\ProductCategory;
use App\Models\Material;
use App\Models\ManufacturingWork;
use App\Models\ProductCategoryMaterial;
use App\Models\ProductCategoryManufacturingWork;
use Illuminate\Database\Seeder;

class ProductCategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Hasil mapping langsung dari ke-13 sheet di "Victory Labs - Master Kategori.xlsx"
        $categories = [
            'T-Shirt' => [
                'bahan' => ['Bahan', 'Rib'],
                'aksesoris' => ['Benang Jahit', 'Benang Obras', 'Label Size', 'Plastik OPP 30 Micron', 'Plastik PP 50x60cm', 'Karung', 'Cat Sablon', 'Dtf', 'Bordir', 'Sublim'],
                'pekerja' => ['Setting', 'Cutting', 'Sablon', 'DTF', 'Jahit', 'QC', 'Finishing']
            ],
            'Jersey' => [
                'bahan' => ['Dryfit', 'Dryfit Poli-spandex', 'Rib poli'],
                'aksesoris' => ['Benang Jahit', 'Benang Obras', 'Label Size', 'Plastik OPP 30 Micron', 'Plastik PP 50x60cm', 'Karung', 'Cat Sablon', 'Dtf', 'Bordir', 'Sublim'],
                'pekerja' => ['Setting', 'Cutting', 'Sablon', 'DTF', 'Jahit', 'QC', 'Finishing']
            ],
            'Polo' => [
                'bahan' => ['Bahan'],
                'aksesoris' => ['Benang Jahit', 'Benang Obras', 'Label Size', 'Plastik OPP 30 Micron', 'Plastik PP 50x60cm', 'Karung', 'Cat Sablon', 'Dtf', 'Bordir', 'Sublim', 'Kancing', 'Kain Keras', 'Kragh', 'Manset'],
                'pekerja' => ['Setting', 'Cutting', 'Sablon', 'DTF', 'Jahit', 'Pasang Kancing', 'QC', 'Finishing']
            ],
            'RushGuard' => [
                'bahan' => ['Bahan'],
                'aksesoris' => ['Benang Jahit', 'Benang Obras', 'Label Size', 'Plastik OPP 30 Micron', 'Plastik PP 50x60cm', 'Karung', 'Cat Sablon', 'Dtf', 'Sublim'],
                'pekerja' => ['Setting', 'Cutting', 'Sablon', 'DTF', 'Jahit', 'Pasang Kancing', 'QC', 'Finishing']
            ],
            'Jaket' => [
                'bahan' => ['Bahan'],
                'aksesoris' => ['Benang Jahit', 'Benang Obras', 'Label Size', 'Plastik OPP 30 Micron', 'Plastik PP 50x60cm', 'Karung', 'Cat Sablon', 'Dtf', 'Bordir', 'Sublim', 'Kancing', 'Kain Keras', 'Boor', 'Tali', 'Stopper', 'Kancing Plastik', 'Zipper', 'Kancing Besi'],
                'pekerja' => ['Setting', 'Cutting', 'Sablon', 'DTF', 'Jahit', 'Pasang Kancing', 'QC', 'Finishing']
            ],
            'Totte Bag' => [
                'bahan' => ['Bahan Badan', 'Bahan Tali'],
                'aksesoris' => ['Benang Jahit', 'Benang Obras', 'Plastik OPP 30 Micron', 'Plastik PP', 'Karung', 'Cat Sablon', 'Dtf', 'Bordir', 'Sublim', 'Kancing Plastik', 'Kain Keras', 'Pcr', 'Webbing', 'List', 'Rajangan spunbond'],
                'pekerja' => ['Setting', 'Cutting', 'Sablon', 'DTF', 'Jahit', 'Pasang Kancing', 'QC', 'Finishing']
            ],
            'Foldable' => [
                'bahan' => ['Bahan Badan', 'Bahan Tali'],
                'aksesoris' => ['Benang Jahit', 'Benang Obras', 'Plastik OPP 30 Micron', 'Plastik PP', 'Karung', 'Cat Sablon', 'Dtf', 'Bordir', 'Sublim', 'Kancing Plastik', 'Kain Keras', 'Pcr', 'Webbing', 'List', 'Rajangan spunbond'],
                'pekerja' => ['Setting', 'Cutting', 'Sablon', 'DTF', 'Jahit', 'Pasang Kancing', 'QC', 'Finishing']
            ],
            'Pouch' => [
                'bahan' => ['Bahan Badan', 'Bahan Tali'],
                'aksesoris' => ['Benang Jahit', 'Benang Obras', 'Plastik OPP 30 Micron', 'Plastik PP', 'Karung', 'Cat Sablon', 'Dtf', 'Bordir', 'Sublim', 'Kancing Plastik', 'Kain Keras', 'Pcr', 'Webbing', 'List', 'Rajangan spunbond'],
                'pekerja' => ['Setting', 'Cutting', 'Sablon', 'DTF', 'Jahit', 'Pasang Kancing', 'QC', 'Finishing']
            ],
            'Kemeja' => [
                'bahan' => ['Bahan'],
                'aksesoris' => ['Benang Jahit', 'Benang Obras', 'Label Size', 'Plastik OPP 30 Micron', 'Plastik PP', 'Karung', 'Cat Sablon', 'Dtf', 'Bordir', 'Sublim', 'Kancing', 'Kain Keras 1', 'Kain keras 2', 'Zipper'],
                'pekerja' => ['Setting', 'Cutting', 'Sablon', 'DTF', 'Jahit', 'Pasang Kancing', 'QC', 'Finishing']
            ],
            'Celana' => [
                'bahan' => ['Bahan'],
                'aksesoris' => ['Benang Jahit', 'Benang Obras', 'Label Size', 'Plastik OPP 30 Micron', 'Plastik PP', 'Karung', 'Cat Sablon', 'Dtf', 'Bordir', 'Sublim', 'Kancing', 'Kain Keras 1', 'Zipper', 'Kancing Kait', 'Kain keras 2', 'Karet'],
                'pekerja' => ['Setting', 'Cutting', 'Sablon', 'DTF', 'Jahit', 'Pasang Kancing', 'QC', 'Finishing']
            ],
            'Wearpack' => [
                'bahan' => ['Bahan'],
                'aksesoris' => ['Benang Jahit', 'Benang Obras', 'Label Size', 'Plastik OPP 30 Micron', 'Plastik PP', 'Karung', 'Cat Sablon', 'Dtf', 'Bordir', 'Sublim', 'Kancing', 'Kain Keras 1', 'Kain keras 2', 'Zipper', 'Karet'],
                'pekerja' => ['Setting', 'Cutting', 'Sablon', 'DTF', 'Jahit', 'Pasang Kancing', 'QC', 'Finishing']
            ],
            'Rompi' => [
                'bahan' => ['Bahan'],
                'aksesoris' => ['Benang Jahit', 'Benang Obras', 'Label Size', 'Plastik OPP 30 Micron', 'Plastik PP', 'Karung', 'Cat Sablon', 'Dtf', 'Bordir', 'Sublim', 'Kancing', 'Kain Keras 1', 'Kain keras 2', 'Zipper'],
                'pekerja' => ['Setting', 'Cutting', 'Sablon', 'DTF', 'Jahit', 'Pasang Kancing', 'QC', 'Finishing']
            ],
            'Apron' => [
                'bahan' => ['Bahan'],
                'aksesoris' => ['Benang Jahit', 'Benang Obras', 'Label Size', 'Plastik OPP 30 Micron', 'Plastik PP', 'Karung', 'Cat Sablon', 'Dtf', 'Bordir', 'Sublim', 'Kancing', 'Kain Keras 1', 'Kain keras 2', 'Zipper'],
                'pekerja' => ['Setting', 'Cutting', 'Sablon', 'DTF', 'Jahit', 'Pasang Kancing', 'QC', 'Finishing']
            ]
        ];

        foreach ($categories as $catName => $data) {
            $category = ProductCategory::firstOrCreate(['name' => $catName]);

            // Menyambungkan Material (Bahan & Aksesoris)
            $allMaterials = array_unique(array_merge($data['bahan'], $data['aksesoris']));
            foreach ($allMaterials as $matName) {
                $material = Material::where('name', $matName)->first();
                if ($material) {
                    ProductCategoryMaterial::firstOrCreate([
                        'product_category_id' => $category->id,
                        'material_id' => $material->id,
                    ]);
                }
            }

            // Menyambungkan Proses Manufaktur (Pekerjaan)
            foreach (array_unique($data['pekerja']) as $workName) {
                $work = ManufacturingWork::where('name', $workName)->first();
                if ($work) {
                    ProductCategoryManufacturingWork::firstOrCreate([
                        'product_category_id' => $category->id,
                        'manufacturing_work_id' => $work->id,
                    ]);
                }
            }
        }
    }
}