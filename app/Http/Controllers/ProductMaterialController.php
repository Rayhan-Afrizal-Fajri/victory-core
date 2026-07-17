<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreProductMaterialRequest;
use App\Http\Requests\UpdateProductMaterialRequest;
use App\Models\ProductMaterial;
// use Illuminate\Http\Request;

class ProductMaterialController extends Controller
{
    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreProductMaterialRequest $request)
    {
        $validated = $request->validated();

        // Check if material with same type already exists for this product
        $exists = ProductMaterial::where('product_id', $validated['product_id'])
            ->where('material_id', $validated['material_id'])
            ->exists();

        if ($exists) {
            return back()->withErrors(['material_id' => 'Material ini sudah ditambahkan untuk produk ini.']);
        }

        ProductMaterial::create($validated);

        return back();
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateProductMaterialRequest $request, ProductMaterial $productMaterial)
    {
        $validated = $request->validated();
        
        $productMaterial->update($validated);

        return back();
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(ProductMaterial $productMaterial)
    {
        $productMaterial->delete();

        return back();
    }
}
