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
}
