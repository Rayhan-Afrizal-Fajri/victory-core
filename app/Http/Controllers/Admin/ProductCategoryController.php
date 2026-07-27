<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ManufacturingWork;
use App\Models\Material;
use App\Models\ProductCategory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ProductCategoryController extends Controller
{
    public function index()
    {
        // Eager load relasi ke pivot dan data aslinya
        $categories = ProductCategory::with([
            'materials.material',
            'manufacturingWorks.manufacturingWork'
        ])->latest()->get();

        // Ambil data untuk opsi di Form
        $bahanMaterials = Material::with('defaultVendor')->where('category', 'bahan')->orderBy('name')->get();
        $aksesorisMaterials = Material::with('defaultVendor')->where('category', 'aksesoris')->orderBy('name')->get();
        $manufacturingWorks = ManufacturingWork::all();

        return inertia('admin/master/products-categories/Categories', [
            'categories' => $categories,
            'bahanMaterials' => $bahanMaterials,
            'aksesorisMaterials' => $aksesorisMaterials,
            'manufacturingWorks' => $manufacturingWorks,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'bahan_ids' => 'nullable|array',
            'bahan_ids.*' => 'exists:materials,id',
            'aksesoris_ids' => 'nullable|array',
            'aksesoris_ids.*' => 'exists:materials,id',
            'manufacturing_work_ids' => 'nullable|array',
            'manufacturing_work_ids.*' => 'exists:manufacturing_works,id',
        ]);

        DB::transaction(function () use ($validated) {
            $category = ProductCategory::create(['name' => $validated['name']]);

            // Gabungkan ID bahan dan aksesoris untuk dimasukkan ke table materials
            $materialIds = array_merge($validated['bahan_ids'] ?? [], $validated['aksesoris_ids'] ?? []);
            
            foreach ($materialIds as $materialId) {
                $category->materials()->create([
                    'material_id' => $materialId
                ]);
            }

            // Masukkan Manufacturing Works
            foreach ($validated['manufacturing_work_ids'] ?? [] as $workId) {
                $category->manufacturingWorks()->create([
                    'manufacturing_work_id' => $workId
                ]);
            }
        });

        return back()->with([
            'success' => 'Kategori produk berhasil dibuat.',
            'flash_id' => Str::uuid(),
        ]);
    }

    public function update(Request $request, ProductCategory $productCategory)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'bahan_ids' => 'nullable|array',
            'aksesoris_ids' => 'nullable|array',
            'manufacturing_work_ids' => 'nullable|array',
        ]);

        DB::transaction(function () use ($validated, $productCategory) {
            $productCategory->update(['name' => $validated['name']]);

            // Hapus relasi pivot lama
            $productCategory->materials()->delete();
            $productCategory->manufacturingWorks()->delete();

            // Insert ulang relasi baru
            $materialIds = array_merge($validated['bahan_ids'] ?? [], $validated['aksesoris_ids'] ?? []);
            foreach ($materialIds as $materialId) {
                $productCategory->materials()->create(['material_id' => $materialId]);
            }

            foreach ($validated['manufacturing_work_ids'] ?? [] as $workId) {
                $productCategory->manufacturingWorks()->create(['manufacturing_work_id' => $workId]);
            }
        });

        return back()->with([
            'success' => 'Kategori produk berhasil diperbarui.',
            'flash_id' => Str::uuid(),
        ]);
    }

    public function destroy(ProductCategory $productCategory)
    {
        DB::transaction(function () use ($productCategory) {
            // Hapus child/pivot terlebih dahulu (jika DB belum diset cascade on delete)
            $productCategory->materials()->delete();
            $productCategory->manufacturingWorks()->delete();
            
            // Hapus parent
            $productCategory->delete();
        });

        return back()->with([
            'success' => 'Kategori produk berhasil dihapus.',
            'flash_id' => Str::uuid()
        ]);
    }
}