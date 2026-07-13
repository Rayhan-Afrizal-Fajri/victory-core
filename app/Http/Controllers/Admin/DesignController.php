<?php

namespace App\Http\Controllers\Admin;

use App\Notifications\SystemNotification; // Pastikan import ini
use Illuminate\Support\Facades\Notification;
use App\Http\Controllers\Controller;
use App\Models\Design;
use App\Models\Pesanan;
use App\Models\PesananManufacturingSpecs;
use App\Models\PesananMaterialSpecs;
use App\Models\Product;
use App\Models\User;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class DesignController extends Controller
{
    public function store(Request $request, string $pesananId)
    {
        $pesanan = Pesanan::with('designs')->findOrFail($pesananId);

        $latestRevision = $pesanan->designs()
            ->where('status', 'revision_needed')
            ->latest()
            ->first();

        $rules = [
            'file_desain' => 'required|file|mimes:jpg,jpeg,png,webp,pdf|max:10240',
            'designer_revision_note' => $latestRevision
                ? 'required|string'
                : 'nullable|string',
        ];

        $messages = [
            'designer_revision_note.required' => 'Catatan perbaikan wajib diisi ketika upload revisi desain.',
        ];

        $request->validate($rules, $messages);

        DB::transaction(function () use ($request, $pesanan) {
            $path = $request->file('file_desain')->store('designs', 'public');

            $pesanan->designs()->create([
                'designer_id' => Auth::user()->id,
                'file_path' => $path,
                'designer_revision_note' => $request->designer_revision_note,
                'status' => 'waiting_approval',
                'uploaded_at' => now(),
            ]);

            $pesanan->workflowStatus()->updateOrCreate(
                ['pesanan_id' => $pesanan->id],
                [
                    'design_uploaded' => true,
                    'design_approved' => false,
                ]
            );

            $pesanan->jobTicket->workflowHistory()->create([
                'step' => 'design',
                'action' => 'upload',
                'user_id' => Auth::user()->id,
                'notes' => "Designer mengunggah desain {$pesanan->produk} untuk direview customer.",
            ]);

            $pesanan->jobTicket()->update([
                'status' => 'Design'
            ]);
        });

        $usersToNotify = User::permission('designs.approve')->get();

        if ($usersToNotify->isNotEmpty()) {
            Notification::send($usersToNotify, new SystemNotification(
                'Desain menunggu approval',
                "Desain untuk produk '{$pesanan->produk}' telah diunggah dan menunggu persetujuan Anda.",
                "/job-tickets/{$pesanan->job_ticket_id}?tab=design",
                'info'
            ));
        }

        return back()->with('success', 'Desain berhasil diunggah.');
    }

    public function exportPdf(Pesanan $pesanan)
    {
        $designs = $pesanan->designs()
            ->orderByDesc('uploaded_at')
            ->orderByDesc('created_at')
            ->get();

        $pdf = Pdf::loadView('pdf.designs.export', [
            'pesanan' => $pesanan,
            'designs' => $designs,
        ])
            ->setPaper('a4', 'portrait')
            ->setOption('isRemoteEnabled', true);

        return $pdf->stream(sprintf('design-%s.pdf', $pesanan->id));
    }

    public function exportDesignPdf(Design $design)
    {
        $pesanan = $design->pesanan;
        $designs = $pesanan->designs()
            ->where('id', $design->id)
            ->orderByDesc('uploaded_at')
            ->orderByDesc('created_at')
            ->get();

        $pdf = Pdf::loadView('pdf.designs.export', [
            'pesanan' => $pesanan,
            'designs' => $designs,
        ])
            ->setPaper('a4', 'portrait')
            ->setOption('isRemoteEnabled', true);

        return $pdf->stream(sprintf('design-%s.pdf', $pesanan->id));
    }

    public function approveDesign(Request $request, string $id)
    {
        $design = Design::with('pesanan.workflowStatus')->findOrFail($id);
        $pesanan = $design->pesanan;

        DB::transaction(function () use ($design, $pesanan) {
            // Hanya design yang sedang menunggu approval yang boleh diapprove
            if ($design->status !== 'waiting_approval') {
                abort(422, 'Desain ini tidak sedang menunggu approval.');
            }

            // Pastikan hanya 1 desain yang approved
            $pesanan->designs()
                ->where('id', '!=', $design->id)
                ->where('status', 'approved')
                ->update([
                    'status' => 'rejected',
                ]);

            $design->update([
                'status' => 'approved',
                'approved_at' => now(),
                'approved_by' => Auth::user()->id,
            ]);

            $pesanan->workflowStatus()->updateOrCreate(
                ['pesanan_id' => $pesanan->id],
                [
                    'design_uploaded' => true,
                    'design_approved' => true,
                ]
            );

            $pesanan->refresh();

            $pesanan->jobTicket->workflowHistory()->create([
                'step' => 'design',
                'action' => 'approve',
                'user_id' => Auth::user()->id,
                'notes' => "Desain {$pesanan->produk} disetujui customer/admin.",
            ]);
        });

        $usersToNotify = User::permission('boms.sync')->get();

        if ($usersToNotify->isNotEmpty()) {
            Notification::send($usersToNotify, new SystemNotification(
                'Buat Spesifikasi Desain',
                "Desain untuk produk '{$pesanan->produk}' telah disetujui, sinkronkan spesifikasi desain.",
                "/job-tickets/{$pesanan->job_ticket_id}?tab=design",
                'info'
            ));
        }

        return back()->with('success', 'Desain disetujui.');
    }

    public function requestRevision(Request $request, string $id)
    {
        $request->validate([
            'revision_note' => 'required|string',
        ], [
            'revision_note.required' => 'Catatan revisi wajib diisi.',
        ]);

        $design = Design::with('pesanan.workflowStatus')->findOrFail($id);
        $pesanan = $design->pesanan;


        DB::transaction(function () use ($request, $design, $pesanan) {
            if (! in_array($design->status, ['waiting_approval', 'approved'])) {
                abort(422, 'Desain ini tidak bisa direvisi.');
            }

            if ($pesanan->workflowStatus?->sample_created) {
                abort(422, 'Desain tidak bisa direvisi karena sample sudah dibuat');
            }

            $wasApproved = $design->status === 'approved';

            $design->update([
                'status' => 'revision_needed',
                'customer_revision_note' => $request->revision_note,
                'approved_at' => null,
                'approved_by' => null,
            ]);

            $pesanan->workflowStatus()->updateOrCreate(
                ['pesanan_id' => $pesanan->id],
                [
                    'design_uploaded' => false,
                    'design_approved' => false,
                ]
            );

            $pesanan->jobTicket->workflowHistory()->create([
                'step' => 'design',
                'action' => $wasApproved ? 'revision_after_approval' : 'revision',
                'user_id' => Auth::user()->id,
                'notes' => "Revisi desain {$pesanan->produk}: {$request->revision_note}",
            ]);
        });

        $usersToNotify = User::permission('designs.upload')->get();

        if ($usersToNotify->isNotEmpty()) {
            Notification::send($usersToNotify, new SystemNotification(
                'Desain direvisi',
                "Desain untuk produk '{$pesanan->produk}' direvisi, upload ulang desain Anda.",
                "/job-tickets/{$pesanan->job_ticket_id}?tab=design",
                'info'
            ));
        }

        return back()->with('success', 'Revisi desain berhasil diminta.');
    }

    public function syncArticle(Request $request, string $pesananId)
    {
        $validated = $request->validate([
            'product_id' => ['required', 'exists:products,id'],
        ]);

        $pesanan = Pesanan::with([
            'materialSpecs',
            'manufacturingSpecs',
            'workflowStatus',
        ])->findOrFail($pesananId);

        $product = Product::with([
            'productMaterials.defaultSupplier',
            'productManufacturingWorks.manufacturingWork.defaultVendor',
        ])->findOrFail($validated['product_id']);

        // dd($product);       

        DB::transaction(function () use ($pesanan, $product) {
            $pesanan->update([
                'product_id' => $product->id,
                'article_synced_at' => now(),
                'article_synced_by' => Auth::id(),
            ]);

            // MVP: replace specs lama saat sync ulang artikel
            $pesanan->materialSpecs()->delete();
            $pesanan->manufacturingSpecs()->delete();

            foreach ($product->productMaterials as $component) {
                $material = $component->material;
                

                $totalUsage = $pesanan->q * $component->default_usage;
                $totalCost = $totalUsage * ($component?->harga_ecer ?? 0);
                $costPerPcs = $pesanan->q > 0 ? round($totalCost / $pesanan->q, 2) : 0;

                $pesanan->materialSpecs()->create([
                    'product_id' => $product->id,
                    'material_id' => $material?->id,
                    'supplier_id' => $component?->default_supplier_id,

                    'type' => $component->type,
                    'material_name_snapshot' => $material?->name ?? '-',

                    'color' => null,
                    'usage' => $component->default_usage,
                    'unit' => $component->default_unit ?: $material?->unit,
                    'color' => $component->default_color ?: $material?->default_color,

                    'usage_per_set' => 1,

                    'harga_ecer' => $component?->harga_ecer ?? 0,
                    'harga_roll' => $component?->harga_roll ?? 0,
                    'price_type' => 'ecer',
                    // 'roll_qty' => $material?->roll_qty,

                    'total_usage' => $totalUsage,
                    'total_cost' => $totalCost,
                    'cost_per_pcs' => $costPerPcs,
                ]);
            }

            foreach ($product->productManufacturingWorks as $component) {
                $work = $component->manufacturingWork;


                $costPerPcs = $component->default_usage * ($work?->default_max_estimate ?? 0);

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
                    'sort_order' => $component?->sort_order ?? 0,
                    'cost_per_pcs' => $costPerPcs,
                ]);
            }

            $pesanan->workflowStatus()->updateOrCreate(
                ['pesanan_id' => $pesanan->id],
                [
                    'article_synced' => true,
                    // 'design_approved' => true,
                ]
            );

            $pesanan->jobTicket->workflowHistory()->create([
                'step' => 'design',
                'action' => 'sync_article',
                'user_id' => Auth::id(),
                'notes' => "Designer memilih artikel master: {$product->name} untuk pesanan {$pesanan->produk}",
            ]);
        });

        return back()->with('success', 'Artikel berhasil disinkronkan.');
    }

    public function updateMaterialSpec(Request $request, string $id)
    {
        $validated = $request->validate([
            'color' => ['nullable', 'string', 'max:100'],
            'usage' => ['required', 'numeric', 'min:0'],
            'unit' => ['required', 'string', 'max:50'],
            'usage_per_set' => ['nullable', 'numeric'],
            'supplier_id' => ['nullable', 'exists:suppliers,id'],
            'harga_ecer' => ['required', 'numeric', 'min:0'],
            'harga_roll' => ['required', 'numeric', 'min:0'],
            'price_type' => ['required', 'in:ecer,roll'],
            'roll_qty' => ['nullable', 'numeric', 'min:0'],
        ]);

        $spec = PesananMaterialSpecs::with('pesanan.workflowStatus')->findOrFail($id);
        $pesanan = $spec->pesanan;

        $orderQty = (float) ($pesanan->quantity ?: $pesanan->q ?: 0);

        if ($orderQty <= 0) {
            abort(422, 'Quantity order belum valid.');
        }

        $usage = (float) $validated['usage'];
        // $usagePerSet = (float) $validated['usage_per_set'];

        $totalUsage = round($usage * $orderQty, 2);

        $hargaEcer = (float) $validated['harga_ecer'];
        $hargaRoll = (float) $validated['harga_roll'];
        $rollQty = (float) ($validated['roll_qty'] ?? 0);

        if ($validated['price_type'] === 'roll') {

            // $rollNeeded = ceil($totalUsage / $rollQty);
            $totalCost = $totalUsage * $hargaRoll;
        } else {
            $totalCost = $totalUsage * $hargaEcer;
        }

        $costPerPcs = round($totalCost / $orderQty, 2);

        // dd('penggunaan per pcs:'. $usage, 'order qty: '. $orderQty,'total usage: '. $totalUsage, 'total cost: '. $totalCost, 'cost per pcs: '. $costPerPcs);

        $spec->update([
            'color' => $validated['color'] ?? null,
            'usage' => $usage,
            'unit' => $validated['unit'],
            // 'usage_per_set' => $usagePerSet,
            'supplier_id' => $validated['supplier_id'] ?? null,
            'harga_ecer' => $hargaEcer,
            'harga_roll' => $hargaRoll,
            'price_type' => $validated['price_type'],
            'roll_qty' => $rollQty ?: null,
            'total_usage' => $totalUsage,
            'total_cost' => $totalCost,
            'cost_per_pcs' => $costPerPcs,
        ]);

        $pesanan->jobTicket->workflowHistory()->create([
            'step' => 'design',
            'action' => 'material_spec_updated',
            'user_id' => Auth::id(),
            'notes' => "Spesifikasi {$spec->type} produk {$pesanan->produk} diperbarui: {$spec->material_name_snapshot}",
        ]);

        return back()->with('success', 'Spesifikasi material berhasil diperbarui.');
    }

    public function updateManufacturingSpec(Request $request, string $id)
    {
        $validated = $request->validate([
            'usage' => ['required', 'numeric', 'min:0'],
            'unit' => ['nullable', 'string', 'max:50'],
            'usage_note' => ['nullable', 'string'],
            'vendor_id' => ['nullable', 'exists:suppliers,id'],
            'min_estimate' => ['required', 'numeric', 'min:0'],
            'max_estimate' => ['required', 'numeric', 'min:0'],
        ]);

        if ((float) $validated['max_estimate'] < (float) $validated['min_estimate']) {
            abort(422, 'Estimasi maksimal tidak boleh lebih kecil dari estimasi minimal.');
        }

        $spec = PesananManufacturingSpecs::with('pesanan')->findOrFail($id);
        $pesanan = $spec->pesanan;

        $usage = (float) $validated['usage'];
        $maxEstimate = (float) $validated['max_estimate'];

        // MVP: pakai estimasi maksimal sebagai costing aman
        $costPerPcs = $usage * $maxEstimate;

        $spec->update([
            'usage' => $usage,
            'unit' => $validated['unit'],
            'usage_note' => $validated['usage_note'] ?? null,
            'vendor_id' => $validated['vendor_id'] ?? null,
            'min_estimate' => $validated['min_estimate'],
            'max_estimate' => $maxEstimate,
            'cost_per_pcs' => $costPerPcs,
        ]);

        $pesanan->jobTicket->workflowHistory()->create([
            'step' => 'design',
            'action' => 'manufacturing_spec_updated',
            'user_id' => Auth::id(),
            'notes' => "Spesifikasi manufaktur {$pesanan->produk} diperbarui: {$spec->work_name_snapshot}",
        ]);

        return back()->with('success', 'Spesifikasi manufaktur berhasil diperbarui.');
    }

    public function lockBOM(Request $request, Pesanan $pesanan)
    {
        $validated = $request->validate([
            'is_lock_bom' => ['required', 'boolean'],
        ]);

        // Langsung gunakan nilai boolean dari request
        $pesanan->workflowStatus()->updateOrCreate(
            ['pesanan_id' => $pesanan->id],
            [
                'design_specs_completed' => $validated['is_lock_bom'],
            ]
        );

        $usersToNotify = User::permission('costings.input_price')->get();

        if ($usersToNotify->isNotEmpty()) {
            Notification::send($usersToNotify, new SystemNotification(
                'Tentukan Harga Jual Pesanan',
                "Spesifikasi desain untuk pesanan '{$pesanan->produk}' telah selesai, Tentukan harga jual pesanan.",
                "/job-tickets/{$pesanan->job_ticket_id}?tab=costing%20%26%20quotation",
                'info'
            ));
        }

        // Pastikan mengembalikan response (misal menggunakan Inertia/redirect)
        return back()->with('success', 'Status BOM berhasil diubah.');
    }

    public function updateOwnerSellingPrice(Request $request, string $pesananId)
    {
        $validated = $request->validate([
            'harga_jual_per_pcs' => ['required', 'numeric', 'min:0'],
            'estimasi_hpp_per_pcs' => ['required', 'numeric', 'min:0'],
        ]);

        $pesanan = Pesanan::with([
            'materialSpecs',
            'manufacturingSpecs',
            'workflowStatus',
        ])->findOrFail($pesananId);

        DB::transaction(function () use ($pesanan, $validated) {
            $pesanan->update([
                'harga_jual_per_pcs' => $validated['harga_jual_per_pcs'],
                'estimasi_hpp_per_pcs' => $validated['estimasi_hpp_per_pcs'],
            ]);

            $pesanan->workflowStatus()->updateOrCreate(
                ['pesanan_id' => $pesanan->id],
                [
                    'price_approved' => true,
                ]
            );

            $pesanan->jobTicket->workflowHistory()->create([
                'step' => 'design',
                'action' => 'owner_selling_price_updated',
                'user_id' => Auth::id(),
                'notes' => "Owner menentukan harga jual final {$pesanan->produk} per pcs.",
            ]);

            $pesanan->jobTicket()->update([
                'status' => 'Design'
            ]);
            
        });

        $usersToNotify = User::permission('quotation.generate')->get();

        if ($usersToNotify->isNotEmpty()) {
            Notification::send($usersToNotify, new SystemNotification(
                'Buat Surat Penawaran',
                "Harga jual '{$pesanan->produk}' telah ditentukan, buat surat penawaran.",
                "/job-tickets/{$pesanan->job_ticket_id}?tab=costing%20%26%20quotation",
                'info'
            ));
        }

        return back()->with('success', 'Harga jual final berhasil disimpan.');
    }
}