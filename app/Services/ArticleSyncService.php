<?php

namespace App\Services;

use App\Models\Pesanan;
use App\Models\Product;
use Illuminate\Support\Facades\Auth;

class ArticleSyncService
{
    public function sync(Pesanan $pesanan, Product $product): void
    {
        $product->loadMissing([
            'productMaterials.material',
            'productManufacturingWorks.manufacturingWork',
        ]);

        $pesanan->update([
            'product_id' => $product->id,
            'article_synced_at' => now(),
            'article_synced_by' => Auth::id(),
        ]);

        $pesanan->materialSpecs()->delete();
        $pesanan->manufacturingSpecs()->delete();

        foreach ($product->productMaterials as $component) {
            $material = $component->material;
            $totalUsage = (float) $pesanan->q * (float) $component->default_usage;
            $totalCost = $totalUsage * (float) ($component->harga_ecer ?? 0);
            $costPerPcs = $pesanan->q > 0 ? round($totalCost / $pesanan->q, 2) : 0;

            $pesanan->materialSpecs()->create([
                'product_id' => $product->id,
                'material_id' => $material?->id,
                'supplier_id' => $component->default_supplier_id,
                'type' => $component->type,
                'material_name_snapshot' => $material?->name ?? '-',
                'color' => $component->default_color ?: $material?->default_color,
                'usage' => $component->default_usage,
                'unit' => $component->default_unit ?: $material?->unit,
                'usage_per_set' => 1,
                'harga_ecer' => $component->harga_ecer ?? 0,
                'harga_roll' => $component->harga_roll ?? 0,
                'price_type' => 'ecer',
                'total_usage' => $totalUsage,
                'total_cost' => $totalCost,
                'cost_per_pcs' => $costPerPcs,
            ]);
        }

        foreach ($product->productManufacturingWorks as $component) {
            $work = $component->manufacturingWork;

            $pesanan->manufacturingSpecs()->create([
                'product_id' => $product->id,
                'manufacturing_work_id' => $work?->id,
                'vendor_id' => $work?->default_vendor_id,
                'work_name_snapshot' => $work?->name ?? '-',
                'usage' => $component->default_usage,
                'unit' => $component->default_unit ?: $work?->default_unit,
                'usage_note' => $component->usage_note,
                'process_behavior' => $work?->process_behavior ?? 'production_process',
                'min_estimate' => $work?->default_min_estimate ?? 0,
                'max_estimate' => $work?->default_max_estimate ?? 0,
                'sort_order' => $component->sort_order ?? 0,
                'cost_per_pcs' => (float) $component->default_usage * (float) ($work?->default_max_estimate ?? 0),
            ]);
        }

        $pesanan->workflowStatus()->updateOrCreate(
            ['pesanan_id' => $pesanan->id],
            ['article_synced' => true]
        );
    }
}