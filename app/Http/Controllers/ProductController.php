<?php

namespace App\Http\Controllers;

// use App\Http\Requests\StoreProductRequest;
// use App\Http\Requests\UpdateProductRequest;
use App\Models\Product;
use App\Models\Material;
use App\Models\ManufacturingWork;
use Inertia\Inertia;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;


class ProductController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $products = Product::query()
            ->withCount([
                'productMaterials as materials_count' => fn ($q) => $q->where('type', 'bahan'),
                'productMaterials as accessories_count' => fn ($q) => $q->where('type', 'aksesoris'),
                'productManufacturingWorks as manufacturing_count'
            ])
            ->latest()->get();

        $products = $products->map(fn ($product) => [
            'id' => $product->id,
            'name' => $product->name,
            'category' => $product->category,
            'description' => $product->description,
            'is_active' => $product->is_active,
            'is_pattern_available' => $product->is_pattern_available,
            'materials_count' => $product->materials_count,
            'accessories_count' => $product->accessories_count,
            'manufacturing_count' => $product->manufacturing_count,
        ]);

        // Fetch master data untuk Form Create/Edit
        $materials = Material::where('is_active', true)->get();
        $works = ManufacturingWork::where('is_active', true)->get();

        return Inertia::render('admin/master/products/Index', [
            'products' => $products,
            'materials' => $materials,
            'works' => $works,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'category' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
            'is_pattern_available' => 'boolean',
            'materials' => 'array',
            'manufacturing_works' => 'array',
        ]);

        DB::transaction(function () use ($validated, $request) {
            $product = Product::create([
                'name' => $validated['name'],
                'category' => $validated['category'] ?? null,
                'description' => $validated['description'] ?? null,
                'is_active' => $validated['is_active'] ?? true,
                'is_pattern_available' => $validated['is_pattern_available'] ?? false,
            ]);

            $this->syncProductRelations($product, $request);
        });

        return back();
    }

    /**
     * Display the specified resource.
     */
    public function show(Product $product)
    {
        $product->load([
            'productMaterials' => fn ($q) => $q->orderBy('sort_order'),
            'productMaterials.material',
            'productManufacturingWorks' => fn ($q) => $q->orderBy('sort_order'),
            'productManufacturingWorks.manufacturingWork',
        ]);

        $materials = Material::where('is_active', true)->get();
        $works = ManufacturingWork::where('is_active', true)->get();

        return Inertia::render('admin/master/products/Show', [
            'product' => [
                'id' => $product->id,
                'name' => $product->name,
                'category' => $product->category,
                'description' => $product->description,
                'is_active' => $product->is_active,
                'materials' => $product->productMaterials->map(fn ($pm) => [
                    'id' => $pm->id,
                    'material_id' => $pm->material_id,
                    'material_name' => $pm->material->name,
                    'material_category' => $pm->material->category,
                    'type' => $pm->type,
                    'default_usage' => (float) $pm->default_usage,
                    'default_unit' => $pm->default_unit,
                    'harga_ecer' => (float) $pm->harga_ecer, // Tambahan Harga
                    'harga_roll' => (float) $pm->harga_roll, // Tambahan Harga
                    'sort_order' => $pm->sort_order,
                    'is_required' => $pm->is_required,
                ])->values(),
                'manufacturing_works' => $product->productManufacturingWorks->map(fn ($pmw) => [
                    'id' => $pmw->id,
                    'manufacturing_work_id' => $pmw->manufacturing_work_id,
                    'work_name' => $pmw->manufacturingWork->name,
                    'default_usage' => (float) $pmw->default_usage,
                    'min_estimate' => (float) $pmw->min_estimate, // Fix mapping
                    'max_estimate' => (float) $pmw->max_estimate, // Fix mapping
                    'default_unit' => $pmw->default_unit,
                    'process_behavior' => $pmw->manufacturingWork->process_behavior,
                    'usage_note' => $pmw->usage_note,
                    'sort_order' => $pmw->sort_order,
                    'is_required' => $pmw->is_required,
                ])->values(),
            ],
            'materials' => $materials->map(fn ($m) => [
                'id' => $m->id,
                'name' => $m->name,
                'category' => $m->category,
                'unit' => $m->unit,
            ])->values(),
            'works' => $works->map(fn ($w) => [
                'id' => $w->id,
                'name' => $w->name,
                'default_unit' => $w->default_unit,
                'process_behavior' => $w->process_behavior,
            ])->values(),
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Product $product)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Product $product)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'category' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
            'is_pattern_available' => 'boolean',
            'materials' => 'array',
            'manufacturing_works' => 'array',
        ]);

        DB::transaction(function () use ($validated, $product, $request) {
            $product->update([
                'name' => $validated['name'],
                'category' => $validated['category'] ?? null,
                'description' => $validated['description'] ?? null,
                'is_active' => $validated['is_active'],
                'is_pattern_available' => $validated['is_pattern_available'],
            ]);

            // Hapus relasi lama untuk di-replace yang baru (mudah untuk re-ordering)
            $product->productMaterials()->delete();
            $product->productManufacturingWorks()->delete();

            $this->syncProductRelations($product, $request);
        });

        return back();
    }

    /**
     * Helper function untuk menyimpan materials dan manufacturing works
     */
    private function syncProductRelations(Product $product, Request $request)
    {
        if ($request->has('materials')) {
            foreach ($request->materials as $index => $mat) {
                $product->productMaterials()->create([
                    'material_id' => $mat['material_id'],
                    'type' => $mat['type'] ?? 'bahan',
                    'default_usage' => $mat['default_usage'] ?? 0,
                    'default_unit' => $mat['default_unit'] ?? null,
                    'harga_ecer' => $mat['harga_ecer'] ?? 0,
                    'harga_roll' => $mat['harga_roll'] ?? 0,
                    'sort_order' => $index + 1,
                    'is_required' => $mat['is_required'] ?? true,
                ]);
            }
        }

        if ($request->has('manufacturing_works')) {
            foreach ($request->manufacturing_works as $index => $work) {
                $product->productManufacturingWorks()->create([
                    'manufacturing_work_id' => $work['manufacturing_work_id'],
                    'default_usage' => $work['default_usage'] ?? 1,
                    'default_unit' => $work['default_unit'] ?? null,
                    'usage_note' => $work['usage_note'] ?? null,
                    'min_estimate' => $work['min_estimate'] ?? null,
                    'max_estimate' => $work['max_estimate'] ?? null,
                    'sort_order' => $index + 1,
                    'is_required' => $work['is_required'] ?? true,
                ]);
            }
        }
    }

    public function updatePattern(Request $request, Product $product)
    {
        $validated = $request->validate([
            'is_pattern_available' => ['required', 'boolean'],
        ]);

        $product->update($validated);

        return back();
    }

    public function updateStatus(Request $request, Product $product)
    {
        $validated = $request->validate([
            'is_active' => ['required', 'boolean'],
        ]);

        $product->update($validated);

        return back();
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Product $product)
    {
        $product->delete();

        return back();
    }

    /**
     * Toggle product active status.
     */
    public function toggleActive(Product $product)
    {
        $product->update(['is_active' => !$product->is_active]);

        return back();
    }
}
