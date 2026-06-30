<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Pesanan;
use App\Models\PesananManufacturingSpecs;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class PesananManufacturingSpecController extends Controller
{
    public function store(Request $request, Pesanan $pesanan)
    {
        $validated = $request->validate([
            'work_name_snapshot' => ['required', 'string', 'max:255'],
            'manufacturing_work_id' => ['nullable', 'exists:manufacturing_works,id'],
            'usage' => ['required', 'numeric', 'min:0'],
            'unit' => ['nullable', 'string', 'max:50'],
            'usage_note' => ['nullable', 'string'],
            'vendor_id' => ['nullable', 'exists:suppliers,id'],
            'min_estimate' => ['required', 'numeric', 'min:0'],
            'max_estimate' => ['required', 'numeric', 'min:0'],
            'process_behavior' => ['nullable', 'in:production_process,costing_only'],
        ]);

        $this->validateEstimate($validated);

        DB::transaction(function () use ($pesanan, $validated) {
            $costPerPcs = $this->calculateCostPerPcs($validated);

            $spec = $pesanan->manufacturingSpecs()->create([
                'product_id' => $pesanan->product_id,
                'manufacturing_work_id' => $validated['manufacturing_work_id'] ?? null,
                'vendor_id' => $validated['vendor_id'] ?? null,

                'work_name_snapshot' => $validated['work_name_snapshot'],
                'usage' => $validated['usage'],
                'unit' => $validated['unit'] ?? null,
                'usage_note' => $validated['usage_note'] ?? null,

                'min_estimate' => $validated['min_estimate'],
                'max_estimate' => $validated['max_estimate'],
                'cost_per_pcs' => $costPerPcs,

                // Kalau kolom belum ada, hapus line ini dulu.
                'process_behavior' => $validated['process_behavior'] ?? 'production_process',
            ]);

            $pesanan->jobTicket->workflowHistory()->create([
                'step' => 'design',
                'action' => 'manufacturing_spec_created',
                'user_id' => Auth::id(),
                'notes' => "Spesifikasi manufaktur ditambahkan: {$spec->work_name_snapshot}",
            ]);
        });

        return back()->with('success', 'Spesifikasi manufaktur berhasil ditambahkan.');
    }

    public function update(Request $request, PesananManufacturingSpecs $spec)
    {
        $validated = $request->validate([
            'work_name_snapshot' => ['nullable', 'string', 'max:255'],
            'manufacturing_work_id' => ['nullable', 'exists:manufacturing_works,id'],
            'usage' => ['required', 'numeric', 'min:0'],
            'unit' => ['nullable', 'string', 'max:50'],
            'usage_note' => ['nullable', 'string'],
            'vendor_id' => ['nullable', 'exists:suppliers,id'],
            'min_estimate' => ['required', 'numeric', 'min:0'],
            'max_estimate' => ['required', 'numeric', 'min:0'],
            'process_behavior' => ['nullable', 'in:production_process,costing_only'],
        ]);

        $this->validateEstimate($validated);

        $spec->load('pesanan');

        DB::transaction(function () use ($spec, $validated) {
            $costPerPcs = $this->calculateCostPerPcs($validated);

            $spec->update([
                'manufacturing_work_id' => $validated['manufacturing_work_id'] ?? $spec->manufacturing_work_id,
                'vendor_id' => $validated['vendor_id'] ?? null,

                'work_name_snapshot' => $validated['work_name_snapshot'] ?? $spec->work_name_snapshot,
                'usage' => $validated['usage'],
                'unit' => $validated['unit'] ?? null,
                'usage_note' => $validated['usage_note'] ?? null,

                'min_estimate' => $validated['min_estimate'],
                'max_estimate' => $validated['max_estimate'],
                'cost_per_pcs' => $costPerPcs,

                // Kalau kolom belum ada, hapus line ini dulu.
                'process_behavior' => $validated['process_behavior'] ?? $spec->process_behavior ?? 'production_process',
            ]);

            $spec->pesanan->jobTicket->workflowHistory()->create([
                'step' => 'design',
                'action' => 'manufacturing_spec_updated',
                'user_id' => Auth::id(),
                'notes' => "Spesifikasi manufaktur diperbarui: {$spec->work_name_snapshot}",
            ]);
        });

        return back()->with('success', 'Spesifikasi manufaktur berhasil diperbarui.');
    }

    public function destroy(PesananManufacturingSpecs $spec)
    {
        $spec->load('pesanan');

        if ($spec->pesanan?->workflowStatus?->sample_created) {
            abort(422, 'Spec tidak bisa dihapus karena sample sudah dibuat.');
        }

        DB::transaction(function () use ($spec) {
            $pesanan = $spec->pesanan;
            $name = $spec->work_name_snapshot;

            $spec->delete();

            $pesanan->jobTicket->workflowHistory()->create([
                'step' => 'design',
                'action' => 'manufacturing_spec_deleted',
                'user_id' => Auth::id(),
                'notes' => "Spesifikasi manufaktur dihapus: {$name}",
            ]);
        });

        return back()->with('success', 'Spesifikasi manufaktur berhasil dihapus.');
    }

    private function calculateCostPerPcs(array $validated): float
    {
        $usage = (float) $validated['usage'];
        $maxEstimate = (float) $validated['max_estimate'];

        return round($usage * $maxEstimate, 2);
    }

    private function validateEstimate(array $validated): void
    {
        if ((float) $validated['max_estimate'] < (float) $validated['min_estimate']) {
            abort(422, 'Estimasi maksimal tidak boleh lebih kecil dari estimasi minimal.');
        }
    }
}