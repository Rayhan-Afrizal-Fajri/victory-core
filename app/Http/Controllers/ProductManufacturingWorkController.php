<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreProductManufacturingWorkRequest;
use App\Http\Requests\UpdateProductManufacturingWorkRequest;
use App\Models\ProductManufacturingWork;
use Illuminate\Http\Request;

class ProductManufacturingWorkController extends Controller
{
    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreProductManufacturingWorkRequest $request)
    {
        $validated = $request->validated();

        // Check if manufacturing work already exists for this product
        $exists = ProductManufacturingWork::where('product_id', $validated['product_id'])
            ->where('manufacturing_work_id', $validated['manufacturing_work_id'])
            ->exists();

        if ($exists) {
            return back()->withErrors(['manufacturing_work_id' => 'Work ini sudah ditambahkan untuk produk ini.']);
        }

        ProductManufacturingWork::create($validated);

        return back();
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateProductManufacturingWorkRequest $request, ProductManufacturingWork $productManufacturingWork)
    {
        // dd($request->all());
        $validated = $request->validated();
        
        $productManufacturingWork->update($validated);

        return back();
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(ProductManufacturingWork $productManufacturingWork)
    {
        $productManufacturingWork->delete();

        return back();
    }

    /**
     * Memperbarui urutan (sort_order) secara massal.
     */
    public function reorder(Request $request)
    {
        $validated = $request->validate([
            'ordered_ids' => ['required', 'array'],
            'ordered_ids.*' => ['required', 'integer', 'exists:product_manufacturing_works,id'],
        ]);

        // Loop array id yang dikirimkan, lalu update sort_order-nya berdasarkan index array
        foreach ($validated['ordered_ids'] as $index => $id) {
            ProductManufacturingWork::where('id', $id)->update([
                'sort_order' => $index + 1 // Urutan dimulai dari 1
            ]);
        }

        return back(); // Inertia akan me-reload props otomatis
    }
}
