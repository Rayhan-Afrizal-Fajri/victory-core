<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreMaterialRequest;
use App\Http\Requests\UpdateMaterialRequest;
use App\Models\Material;
use App\Models\Supplier;
use App\Models\DefaultSizeBreakdown;
use Inertia\Inertia;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Str;

class MaterialController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $materials = Material::query()
            ->latest()
            ->paginate(15);

        $suppliers = Supplier::query()
            ->select('id', 'nama', 'nama_perusahaan')
            ->get();

        $colors = DefaultSizeBreakdown::query()
            ->select('id', 'label')
            ->where('type', 'color')
            ->get();

        $units = DefaultSizeBreakdown::query()
            ->select('id', 'label')
            ->where('type', 'unit')
            ->get();

        $materials = $materials->map(fn ($material) => [
            'id' => $material->id,
            'name' => $material->name,
            'category' => $material->category,
            'unit' => $material->unit,
            'default_color' => $material->default_color,
            'default_vendor_id' => $material->default_vendor_id,
            'default_vendor_name' => $material->defaultVendor?->nama_perusahaan,
            'default_harga_ecer' => $material->default_harga_ecer,
            'default_harga_roll' => $material->default_harga_roll,
            'default_price_type' => $material->default_price_type, //ecer or roll
            'default_usage' => $material->default_usage, //usage per item product/article
            'is_active' => $material->is_active,
        ]);

        // dd($materials);

        return Inertia::render('admin/master/materials/Index', [
            'materials' => $materials,
            'suppliers' => $suppliers,
            'colors' => $colors,
            'units' => $units,
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
        if (! $material->canBeDeleted()) {
            return back()->with([
                'error' => 'Material ini sedang digunakan di tabel lain dan tidak dapat dihapus.',
                'flash_id' => Str::uuid(),
            ]);
        }

        $material->delete();

        return back()->with('success', 'Material berhasil dihapus.');
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
