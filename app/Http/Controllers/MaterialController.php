<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreMaterialRequest;
use App\Http\Requests\UpdateMaterialRequest;
use App\Models\Material;
use App\Models\Supplier;
use Inertia\Inertia;

class MaterialController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $materials = Material::query()
            ->with('defaultSupplier')
            ->latest()
            ->paginate(15);

        $suppliers = Supplier::query()
            ->select('id', 'nama')
            ->get();

        $materials = $materials->map(fn ($material) => [
            'id' => $material->id,
            'name' => $material->name,
            'category' => $material->category,
            'unit' => $material->unit,
            // 'default_usage' => $material->productMaterials,
            'supplier_id' => $material->default_supplier_id,
            'supplier_name' => $material->defaultSupplier?->nama_perusahaan,
            'harga_ecer' => (float) $material->harga_ecer,
            'harga_roll' => (float) $material->harga_roll,
            'roll_qty' => $material->roll_qty ? (float) $material->roll_qty : null,
            'roll_unit' => $material->roll_unit,
            'is_active' => $material->is_active,
        ]);

        return Inertia::render('admin/master/materials/Index', [
            'materials' => $materials,
            'suppliers' => $suppliers,
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
    public function store(StoreMaterialRequest $request)
    {
        $validated = $request->validated();
        
        Material::create($validated);

        return back();
    }

    /**
     * Display the specified resource.
     */
    public function show(Material $material)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Material $material)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateMaterialRequest $request, Material $material)
    {
        $validated = $request->validated();
        
        $material->update($validated);

        return back();
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Material $material)
    {
        $material->delete();

        return back();
    }

    /**
     * Toggle material active status.
     */
    public function toggleActive(Material $material)
    {
        $material->update(['is_active' => !$material->is_active]);

        return back();
    }
}
