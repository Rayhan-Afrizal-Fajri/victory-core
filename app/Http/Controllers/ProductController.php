<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreProductRequest;
use App\Http\Requests\UpdateProductRequest;
use App\Models\Product;
use App\Models\Material;
use App\Models\ManufacturingWork;
use Inertia\Inertia;

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
            ->latest()
            ->paginate(15);

        $products = $products->map(fn ($product) => [
            'id' => $product->id,
            'name' => $product->name,
            'category' => $product->category,
            'description' => $product->description,
            'is_active' => $product->is_active,
            'materials_count' => $product->materials_count,
            'accessories_count' => $product->accessories_count,
            'manufacturing_count' => $product->manufacturing_count,
        ]);

        return Inertia::render('admin/master/products/Index', [
            'products' => $products,
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
    public function store(StoreProductRequest $request)
    {
        $validated = $request->validated();
        
        Product::create($validated);

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
                    'sort_order' => $pm->sort_order,
                    'is_required' => $pm->is_required,
                ])->values(),
                'manufacturing_works' => $product->productManufacturingWorks->map(fn ($pmw) => [
                    'id' => $pmw->id,
                    'manufacturing_work_id' => $pmw->manufacturing_work_id,
                    'work_name' => $pmw->manufacturingWork->name,
                    'default_usage' => (float) $pmw->default_usage,
                    'default_unit' => $pmw->default_unit,
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
    public function update(UpdateProductRequest $request, Product $product)
    {
        $validated = $request->validated();
        
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
