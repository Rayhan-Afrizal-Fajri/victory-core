<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Pesanan;
use Illuminate\Http\Request;
use Inertia\Inertia;

class JobTicketController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {

        $orders = Pesanan::query()
            ->with('customer', 'productionProgress')
            ->latest()
            ->get()
            ->map(function ($order) {

                //simulasi progress sementara
                $progress = $order->productionProgress;

                $checklistFields = [
                    'ppm_bahan',
                    'ppm_aksesoris',
                    'ppm_cutting',
                    'ppm_sablon',
                    'ppm_jahit',

                    'cut_test_susut',
                    'cut_test_luntur',
                    'cut_relax_bahan',
                    'cut_form_cutting',
                    'cut_label_potongan',
                    'cut_sisa_bahan',

                    'sablon_sample_warna',
                    'sablon_test_muntah',

                    'jahit_kelengkapan_aksesoris',
                    'jahit_titik_kritis',
                    'jahit_random_check',

                    'qc_stem_packing',
                    'qc_sampling_ukuran',
                    'qc_inspeksi_jahit',
                    'qc_surat_jalan',

                    'log_foto_confirm',
                    'log_random_cek',
                    'log_payment_delivery',
                ];

                $checkedCount = collect($checklistFields)
                    ->filter(fn ($field) => $progress?->field)
                    ->count();

                $progressPercentage = round(($checkedCount/count($checklistFields)) * 100);

                return [
                    'id' => $order->id,
                    'no_job_ticket' => $order->no_job_ticket,
                    'produk' => $order->produk,
                    'customer' => $order->customer?->nama_perusahaan ?? $order->customer_perusahaan_snapshot,
                    'qty' => $order->q,
                    'deadline' => $order->deadline,
                    'status_divisi' => $order->status_divisi,
                    'acc_sample' => $progress?->acc_sample ?? false,
                    'progress' => $progressPercentage,
                ];
            });

        // Di React Index.tsx, tangkap ini sebagai props `orders`
        return Inertia::render('admin/job-tickets/Index', [
            'orders' => $orders,
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
    public function store(Request $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {        
        // Cari order berdasarkan ID
        $pesanan = Pesanan::with([
            'customer',
            'designs'=> function ($query) {
                $query->latest();
            },
            'orderSpecification',
            'samples' => function ($query) {
                $query->with([
                    'invoice.payments',
                    'media',
                    'delivery'
                ])->latest();
            },
            'invoices.payments',
            'purchasing.materialReceiving',
            'productionProgress',
            'workflowHistory' => function ($query) {
                $query->with('user')->latest();
            },
            'attachment',
            'workflowStatus',
        ])->findOrFail($id);

        $workflowStatus = $pesanan->workflowStatus;

        $mapped = [
            'id' => $pesanan->id,
            'order_number' => $pesanan->no_job_ticket,
            'product_name' => $pesanan->produk,
            'customer' => [
                'name' => $pesanan->customer?->nama ?? $pesanan->customer_nama_snapshot,
                'company' => $pesanan->customer?->nama_perusahaan ?? $pesanan->customer_perusahaan_snapshot,
            ],
            'quantity' => $pesanan->q,
            'deadline' => $pesanan->deadline,
            'created_at' => $pesanan->created_at,
            'status' => $pesanan->status_divisi,
            'price_per_piece' => (float) $pesanan->harga_jual_per_pcs,
            'estimated_hpp_per_piece' => (float) $pesanan->estimasi_hpp_per_pcs,
            'specs' => $pesanan->orderSpecification?->map(fn ($s) => [
                'id' => $s->id,
                'jenis_spesifikasi' => $s->jenis_spesifikasi,
                'value' => $s->value,
            ])->toArray(),
            'designs' => $pesanan->designs->map(fn ($d) => [
                'id' => $d->id,
                'file_path' => $d->file_path,
                'note' => $d->revision_note,
                'customer_revision_note' => $d->customer_revision_note,
                'designer_revision_note' => $d->designer_revision_note,
                'status' => $d->status,
                'approved' => (bool) $d->approved_at,
                'approved_at' => $d->approved_at,
                'created_at' => $d->uploaded_at,
            ])->toArray(),
            'samples' => $pesanan->samples->map(fn ($s) => [
                'id' => $s->id,
                'pesanan_id' => $s->pesanan_id,
                'qty' => $s->qty,
                'sample_price' => $s->sample_price,
                'invoice_id' => $s->invoice_id,
                'parent_sample_id' => $s->parent_sample_id,
                'is_chargeable' => $s->is_chargeable,
                'status' => $s->status,
                'catatan' => $s->catatan,
                'customer_review_note' => $s->customer_review_note,
                'internal_note' => $s->internal_note,
                'created_by' => $s->created_by,
                'created_sample_at' => $s->created_sample_at,
                'paid_at' => $s->paid_at,
                'sent_at' => $s->sent_at,
                'approved_at' => $s->approved_at,
                'approved_by' => $s->approved_by,
                'invoice' => $s->invoice,
                'media' => $s->media,
                'delivery' => $s->delivery,
                'created_at' => $s->created_at,
                'updated_at' => $s->updated_at,
            ])->toArray(),
            'invoices' => $pesanan->invoices->map(fn ($inv) => [
                'id' => $inv->id,
                'title' => $inv->no_invoice ?? $inv->kategori_invoice,
                'amount' => (float) $inv->total_tagihan,
                'status' => $inv->status_tagihan ?? 'Unpaid',
                'issued_at' => $inv->tgl_jatuh_tempo,
                'payments' => $inv->payments->map(fn ($p) => [
                    'id' => $p->id,
                    'invoice_id' => $p->invoice_id,
                    'tgl_bayar' => $p->tgl_bayar,
                    'jumlah_bayar' => (float) $p->jumlah_bayar,
                    'metode_pembayaran' => $p->metode_pembayaran,
                    'bukti_transfer_path' => $p->bukti_transfer_path,
                    'catatan_finance' => $p->catatan_finance,
                    'status' => $p->status,
                    'rejection_note' => $p->rejection_note,
                    'verified_by' => $p->verified_by,
                    'verified_at' => $p->verified_at,
                    'created_at' => $p->created_at,
                    'updated_at' => $p->updated_at,
                ])->toArray(),
            ])->toArray(),
            'purchasings' => $pesanan->purchasing->map(fn ($p) => [
                'id' => $p->id,
                'item' => $p->item_bahan,
                'supplier' => $p->supplier?->name ?? $p->supplier_id,
                'ordered_qty' => $p->qty_bahan,
                'received_qty' => $p->materialReceiving->sum('receiver_qty'),
                'material_receivings' => $p->materialReceiving->map(fn ($r) => [
                    'id' => $r->id,
                    'qty_received' => $r->receiver_qty,
                    'received_at' => $r->receiver_at ?? $r->created_at,
                ])->toArray(),
            ])->toArray(),
            'productionProgress' => $pesanan->productionProgress?->toArray() ?? null,
            'workflowHistories' => $pesanan->workflowHistory->map(fn ($h) => [
                'id' => $h->id,
                'actor' => $h->user?->name ?? 'System',
                'action' => $h->action,
                'note' => $h->notes,
                'created_at' => $h->created_at,
            ])->toArray(),
            'attachments' => $pesanan->attachment->map(fn ($a) => [
                'id' => $a->id,
                'category' => $a->kategori,
                'file_path' => $a->file_path,
                'notes' => $a->catatan,
            ])->toArray(),
            'workflow_status' => $workflowStatus?->toArray() ?? [],
        ];

        return Inertia::render('admin/job-tickets/Show', [
            'pesanan' => $mapped,
        ]);
    }

    /**
     * Update status divisi (Untuk dropdown perpindahan divisi / Kanban simulation)
     */
    public function updateStatus(Request $request, string $id)
    {
        // Validasi input
        $request->validate([
            'status_divisi' => [
                'required',
                'in:Penawaran,Quote,Sample,Blanks,CSA,Finance,Produksi,Pelunasan,Done,Cancel'
            ]
        ]);

        $pesanan = Pesanan::findOrFail($id);

        $pesanan->update([
            'status_divisi' => $request->status_divisi,
        ]);

        // Karena ini dummy, kembalikan redirect dengan flash message sukses
        return back();
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Pesanan $pesanan)
    {
        $pesanan->delete();
        return back();
    }
}
