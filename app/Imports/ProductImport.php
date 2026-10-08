<?php

namespace App\Imports;

use App\Models\Product;
use App\Models\ProductCategory;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

class ProductImport implements ToCollection, WithHeadingRow
{
    /**
    * @param Collection $collection
    */
    public function collection(Collection $rows)
    {
        DB::transaction(function () use ($rows) {
            foreach ($rows as $row) {
                if (!isset($row['name']) || empty($row['name'])) {
                    continue;
                }

                $categoryId = null;
                $categoryName = null;

                if (!empty($row['category_name'])) {
                    $category = ProductCategory::firstOrCreate([
                        'name' => $row['category_name'],
                    ]);
                    $categoryId = $category->id;
                    $categoryName = $category->name;
                }

                $product = Product::updateOrCreate(
                    [
                        'name' => $row['name'],
                        'product_category_id' => $categoryId,
                    ],
                    [
                        'category' => $categoryName,
                        'description' => $row['description'] ?? null,
                        'is_active' => isset($row['is_active']) ? (bool) $row['is_active'] : true,
                        'is_pattern_available' => isset($row['is_pattern_available']) ? (bool) $row['is_pattern_available'] : false,
                    ]
                );

                // Sinkronisasi Materials dan Works jika produk baru atau belum memiliki relasi
                if ($categoryId && $product->wasRecentlyCreated) {
                    $this->syncProductRelations($product, $categoryId);
                }
            }
        });
    }

    private function syncProductRelations(Product $product, $categoryId)
    {
        $productCategory = ProductCategory::with([
            'materials.material', 
            'manufacturingWorks.manufacturingWork'
        ])->find($categoryId);
        
        if (!$productCategory) return;

        // 3. Sinkronisasi Materials
        if ($productCategory->materials->isNotEmpty()) {
            $materialSortOrder = 1;
            
            foreach ($productCategory->materials as $categoryMaterial) {
                $material = $categoryMaterial->material;

                if ($material) {
                    $product->productMaterials()->create([
                        'material_id'         => $material->id,
                        'default_supplier_id' => $material->default_vendor_id,
                        'harga_ecer'          => $material->default_harga_ecer ?? 0,
                        'harga_roll'          => $material->default_harga_roll ?? 0,
                        'type'                => $material->category, // 'bahan' atau 'aksesoris'
                        'default_usage'       => $material->default_usage ?? 0,
                        'default_unit'        => $material->unit,
                        'default_color'       => $material->default_color,
                        'sort_order'          => $materialSortOrder++,
                        'is_required'         => true,
                        'notes'               => $material->description,
                    ]);
                }
            }
        }

        // 4. Sinkronisasi Manufacturing Works
        if ($productCategory->manufacturingWorks->isNotEmpty()) {
            $workSortOrder = 1;

            foreach ($productCategory->manufacturingWorks as $categoryWork) {
                $work = $categoryWork->manufacturingWork;

                if ($work) {
                    $product->productManufacturingWorks()->create([
                        'manufacturing_work_id' => $work->id,
                        'default_usage'         => 1, // Default usage untuk proses biasanya 1
                        'default_unit'          => $work->default_unit,
                        'min_estimate'          => $work->default_min_estimate,
                        'max_estimate'          => $work->default_max_estimate,
                        'usage_note'            => null,
                        'sort_order'            => $workSortOrder++,
                        'is_required'           => true,
                    ]);
                }
            }
        }
    }
}
