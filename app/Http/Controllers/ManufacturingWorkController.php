<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreManufacturingWorkRequest;
use App\Http\Requests\UpdateManufacturingWorkRequest;
use App\Models\ManufacturingWork;
use App\Models\Supplier;
use Inertia\Inertia;
use Illuminate\Support\Str;

class ManufacturingWorkController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $works = ManufacturingWork::query()
            ->with('defaultVendor')
            ->latest()
            ->paginate(15);

        $suppliers = Supplier::query()
            ->select('id', 'nama', 'nama_perusahaan')
            ->where('kategori', 'CMT / Makloon')
            ->get();

        $works = $works->map(fn ($work) => [
            'id' => $work->id,
            'name' => $work->name,
            'process_behavior' => $work->process_behavior,
            'behavior' => ucwords(str_replace('_', ' ', $work->process_behavior)),
            'default_unit' => $work->default_unit,
            'vendor_id' => $work->default_vendor_id,
            'vendor_name' => $work->defaultVendor?->nama_perusahaan,
            'default_min_estimate' => (float) $work->default_min_estimate,
            'default_max_estimate' => (float) $work->default_max_estimate,
            'is_active' => $work->is_active,
        ]);

        return Inertia::render('admin/master/manufacturing-works/Index', [
            'works' => $works,
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
    public function store(StoreManufacturingWorkRequest $request)
    {
        $validated = $request->validated();

        
        ManufacturingWork::create($validated);

        return back();
    }

    /**
     * Display the specified resource.
     */
    public function show(ManufacturingWork $manufacturingWork)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(ManufacturingWork $manufacturingWork)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateManufacturingWorkRequest $request, ManufacturingWork $manufacturingWork)
    {
        $validated = $request->validated();
        
        $manufacturingWork->update($validated);

        return back();
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(ManufacturingWork $manufacturingWork)
    {
        if (! $manufacturingWork->canBeDeleted()) {
            return back()->with([
                'error' => 'Proses ini sedang digunakan di tabel lain dan tidak dapat dihapus.',
                'flash_id' => Str::uuid(),
            ]);
        }
        $manufacturingWork->delete();

        return back();
    }

    /**
     * Toggle manufacturing work active status.
     */
    public function toggleActive(ManufacturingWork $manufacturingWork)
    {
        $manufacturingWork->update(['is_active' => !$manufacturingWork->is_active]);

        return back();
    }
}
