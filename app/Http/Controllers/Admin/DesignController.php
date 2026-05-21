<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Design;
use App\Models\Pesanan;
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
            'file_desain' => 'required|image|max:2048',
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

            $pesanan->workflowHistory()->create([
                'step' => 'design',
                'action' => 'upload',
                'user_id' => Auth::user()->id,
                'notes' => 'Designer mengunggah desain untuk direview customer.',
            ]);
        });

        return back()->with('success', 'Desain berhasil diunggah.');
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

            $pesanan->workflowHistory()->create([
                'step' => 'design',
                'action' => 'approve',
                'user_id' => Auth::user()->id,
                'notes' => 'Desain disetujui customer/admin.',
            ]);
        });

        return back()->with('success', 'Desain disetujui.');
    }

    public function requestRevision(Request $request, string $id)
    {
        $request->validate([
            'customer_revision_note' => 'required|string',
        ], [
            'customer_revision_note.required' => 'Catatan revisi wajib diisi.',
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
                'customer_revision_note' => $request->customer_revision_note,
                'approved_at' => null,
                'approved_by' => null,
            ]);

            $pesanan->workflowStatus()->updateOrCreate(
                ['pesanan_id' => $pesanan->id],
                [
                    'design_uploaded' => true,
                    'design_approved' => false,
                ]
            );

            $pesanan->workflowHistory()->create([
                'step' => 'design',
                'action' => $wasApproved ? 'revision_after_approval' : 'revision',
                'user_id' => Auth::user()->id,
                'notes' => $request->customer_revision_note,
            ]);
        });

        return back()->with('success', 'Revisi desain berhasil diminta.');
    }
}