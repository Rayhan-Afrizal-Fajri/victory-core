<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Pesanan;
use App\Models\PesananMaterialSpecs;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class PesananMaterialSpecController extends Controller
{
    public function store(Request $request, Pesanan $pesanan)
    {
        $validated = $request->validate([
            'type' => ['required', 'in:bahan,aksesoris'],
            'material_name_snapshot' => ['required', 'string', 'max:255'],
            'material_id' => ['nullable', 'exists:materials,id'],
            'color' => ['nullable', 'string', 'max:100'],
            'usage' => ['required', 'numeric', 'min:0'],
            'unit' => ['required', 'string', 'max:50'],
            'supplier_id' => ['nullable', 'exists:suppliers,id'],
            'harga_ecer' => ['required', 'numeric', 'min:0'],
            'harga_roll' => ['required', 'numeric', 'min:0'],
            'price_type' => ['required', 'in:ecer,roll'],
            'roll_qty' => ['nullable', 'numeric', 'min:0'],
        ]);

        $this->validateRoll($validated);

        DB::transaction(function () use ($pesanan, $validated) {
            $calculated = $this->calculateCost($pesanan, $validated);

            $spec = $pesanan->materialSpecs()->create([
                'product_id' => $pesanan->product_id,
                'material_id' => $validated['material_id'] ?? null,
                'supplier_id' => $validated['supplier_id'] ?? null,

                'type' => $validated['type'],
                'material_name_snapshot' => $validated['material_name_snapshot'],
                'color' => $validated['color'] ?? null,

                'usage' => $validated['usage'],
                'unit' => $validated['unit'],
                'usage_per_set' => 1,

                'harga_ecer' => $validated['harga_ecer'],
                'harga_roll' => $validated['harga_roll'],
                'price_type' => $validated['price_type'],
                'roll_qty' => $validated['roll_qty'] ?? null,

                'total_usage' => $calculated['total_usage'],
                'total_cost' => $calculated['total_cost'],
                'cost_per_pcs' => $calculated['cost_per_pcs'],
            ]);

            $pesanan->workflowHistory()->create([
                'step' => 'design',
                'action' => 'material_spec_created',
                'user_id' => Auth::id(),
                'notes' => "Spesifikasi {$spec->type} ditambahkan: {$spec->material_name_snapshot}",
            ]);
        });

        return back()->with('success', 'Spesifikasi material berhasil ditambahkan.');
    }

    public function update(Request $request, PesananMaterialSpecs $spec)
    {
        $validated = $request->validate([
            'type' => ['nullable', 'in:bahan,aksesoris'],
            'material_name_snapshot' => ['nullable', 'string', 'max:255'],
            'material_id' => ['nullable', 'exists:materials,id'],
            'color' => ['nullable', 'string', 'max:100'],
            'usage' => ['required', 'numeric', 'min:0'],
            'unit' => ['required', 'string', 'max:50'],
            'supplier_id' => ['nullable', 'exists:suppliers,id'],
            'harga_ecer' => ['required', 'numeric', 'min:0'],
            'harga_roll' => ['required', 'numeric', 'min:0'],
            'price_type' => ['required', 'in:ecer,roll'],
            'roll_qty' => ['nullable', 'numeric', 'min:0'],
        ]);

        $this->validateRoll($validated);

        $spec->load('pesanan');
        $pesanan = $spec->pesanan;

        DB::transaction(function () use ($spec, $pesanan, $validated) {
            $calculated = $this->calculateCost($pesanan, $validated);

            $spec->update([
                'material_id' => $validated['material_id'] ?? $spec->material_id,
                'supplier_id' => $validated['supplier_id'] ?? null,

                'type' => $validated['type'] ?? $spec->type,
                'material_name_snapshot' => $validated['material_name_snapshot'] ?? $spec->material_name_snapshot,
                'color' => $validated['color'] ?? null,

                'usage' => $validated['usage'],
                'unit' => $validated['unit'],
                'harga_ecer' => $validated['harga_ecer'],
                'harga_roll' => $validated['harga_roll'],
                'price_type' => $validated['price_type'],
                'roll_qty' => $validated['roll_qty'] ?? null,

                'total_usage' => $calculated['total_usage'],
                'total_cost' => $calculated['total_cost'],
                'cost_per_pcs' => $calculated['cost_per_pcs'],
            ]);

            $pesanan->workflowHistory()->create([
                'step' => 'design',
                'action' => 'material_spec_updated',
                'user_id' => Auth::id(),
                'notes' => "Spesifikasi {$spec->type} diperbarui: {$spec->material_name_snapshot}",
            ]);
        });

        return back()->with('success', 'Spesifikasi material berhasil diperbarui.');
    }

    public function destroy(PesananMaterialSpecs $spec)
    {
        $spec->load('pesanan');

        if ($spec->pesanan?->workflowStatus?->sample_created) {
            abort(422, 'Spec tidak bisa dihapus karena sample sudah dibuat.');
        }

        DB::transaction(function () use ($spec) {
            $pesanan = $spec->pesanan;
            $name = $spec->material_name_snapshot;

            $spec->delete();

            $pesanan->workflowHistory()->create([
                'step' => 'design',
                'action' => 'material_spec_deleted',
                'user_id' => Auth::id(),
                'notes' => "Spesifikasi material dihapus: {$name}",
            ]);
        });

        return back()->with('success', 'Spesifikasi material berhasil dihapus.');
    }

    private function calculateCost(Pesanan $pesanan, array $validated): array
    {
        $orderQty = (float) ($pesanan->quantity ?: $pesanan->q ?: 0);

        if ($orderQty <= 0) {
            abort(422, 'Quantity order belum valid.');
        }

        $usage = (float) $validated['usage'];
        $totalUsage = round($usage * $orderQty, 4);

        $hargaEcer = (float) $validated['harga_ecer'];
        $hargaRoll = (float) $validated['harga_roll'];
        $rollQty = (float) ($validated['roll_qty'] ?? 0);

        if ($validated['price_type'] === 'roll') {
            $rollNeeded = ceil($totalUsage / $rollQty);
            $totalCost = $rollNeeded * $hargaRoll;
        } else {
            $totalCost = $totalUsage * $hargaEcer;
        }

        return [
            'total_usage' => $totalUsage,
            'total_cost' => $totalCost,
            'cost_per_pcs' => round($totalCost / $orderQty, 2),
        ];
    }

    private function validateRoll(array $validated): void
    {
        if (($validated['price_type'] ?? null) === 'roll') {
            $rollQty = (float) ($validated['roll_qty'] ?? 0);

            if ($rollQty <= 0) {
                abort(422, 'Roll qty wajib diisi jika memilih harga roll.');
            }
        }
    }
}