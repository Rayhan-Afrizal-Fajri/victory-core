<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Pesanan;
use App\Models\Supplier;
use App\Models\Product;
use App\Models\User;
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
            // 'purchasing.materialReceiving.checkedBy',
            // 'purchasing.supplier',
            'purchasing' => function ($query) {
                $query->with('supplier', 'materialReceiving.checkedBy')->latest();
            },
            'productionProgress',
            'workflowHistory' => function ($query) {
                $query->with('user')->latest();
            },
            'attachment',
            'workflowStatus',
            'sizeBreakdowns',
            'manufacturingSpecs.vendor',
            'materialSpecs.supplier',
            'quotations.items',
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
                'status' => $inv->status_tagihan ?? 'unpaid',
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
                'pesanan_material_spec_id' => $p->pesanan_material_spec_id,

                'item' => $p->item_bahan,
                'supplier_id' => $p->supplier_id,
                'supplier' => $p->supplier ? [
                    'id' => $p->supplier->id,
                    'nama' => $p->supplier->nama ?? null,
                    'nama_perusahaan' => $p->supplier->nama_perusahaan ?? null,
                    'kategori' => $p->supplier->kategori ?? null,
                    'alamat' => $p->supplier->alamat ?? null,
                    'kontak' => $p->supplier->kontak ?? null,
                ] : null,

                'color' => $p->materialSpec?->color,
                'required_qty' => (float) $p->required_qty,
                'purchase_qty' => (float) $p->purchase_qty,
                'stock_qty' => (float) $p->stock_qty,
                'leftover_qty' => (float) $p->leftover_qty,

                'ordered_qty' => (float) $p->qty_bahan,
                'received_qty' => (float) $p->materialReceiving->sum('received_qty'),

                'unit' => $p->satuan,
                'harga_satuan' => (float) $p->harga_satuan,
                'total_harga' => (float) $p->total_harga,

                'notes' => $p->notes,
                'tgl_pembelian' => $p->tgl_pembelian,
                'status' => $p->status,

                'material_receivings' => $p->materialReceiving->map(fn ($r) => [
                    'id' => $r->id,
                    'qty_received' => (float) $r->received_qty,
                    'checked_by' => User::find($r->checked_by) ?? null,
                    'received_at' => $r->received_at ?? $r->created_at?->toDateString(),
                    'notes' => $r->notes,
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
            'size_breakdowns' => $pesanan->sizeBreakdowns->map(fn ($row) => [
                'id' => $row->id,
                'color' => $row->color,
                'size_label' => $row->size_label,
                'qty' => $row->qty,
            ]),

            'product' => $pesanan->product ? [
                'id' => $pesanan->product->id,
                'name' => $pesanan->product->name,
                'category' => $pesanan->product->category,
            ] : null,

            'material_specs' => $pesanan->materialSpecs->map(fn ($spec) => [
                'id' => $spec->id,
                'supplier_id' => $spec->supplier_id,
                'type' => $spec->type,
                'material_name' => $spec->material_name_snapshot,
                'color' => $spec->color,
                'usage' => $spec->usage,
                'unit' => $spec->unit,
                'usage_per_set' => $spec->usage_per_set,
                'supplier' => $spec->supplier?->nama ?? $spec->supplier?->name,
                'harga_ecer' => $spec->harga_ecer,
                'harga_roll' => $spec->harga_roll,
                'roll_qty' => $spec->roll_qty,
                'price_type' => $spec->price_type,
                'cost_per_pcs' => $spec->cost_per_pcs,
            ]),

            'manufacturing_specs' => $pesanan->manufacturingSpecs->map(fn ($spec) => [
                'id' => $spec->id,
                'work_name' => $spec->work_name_snapshot,
                'usage' => $spec->usage,
                'unit' => $spec->unit,
                'usage_note' => $spec->usage_note,
                'vendor' => $spec->vendor?->nama ?? $spec->vendor?->name,
                'min_estimate' => $spec->min_estimate,
                'max_estimate' => $spec->max_estimate,
                'cost_per_pcs' => $spec->cost_per_pcs,
            ]),

            'quotations' => $pesanan->quotations->sortByDesc('id')->values()->map(fn ($q) => [
                'id' => $q->id,
                'quotation_number' => $q->quotation_number,
                'status' => $q->status,
                'valid_until' => $q->valid_until?->toDateString(),
                'payment_terms' => $q->payment_terms,
                'delivery_terms' => $q->delivery_terms,
                'notes' => $q->notes,
                'price_per_pcs' => (float) $q->price_per_pcs,
                'quantity' => (int) $q->quantity,
                'subtotal' => (float) $q->subtotal,
                'tax' => (float) $q->tax,
                'delivery_cost' => (float) $q->delivery_cost,
                'grand_total' => (float) $q->grand_total,
                'approved_at' => $q->approved_at?->toDateTimeString(),
                'approved_by_name' => $q->approved_by_name,
                'signature_path' => $q->signature_path,
                'items' => $q->items->map(fn ($item) => [
                    'id' => $item->id,
                    'item_name' => $item->item_name,
                    'fabric' => $item->fabric,
                    'print_method' => $item->print_method,
                    'quantity' => $item->quantity,
                    'price_per_pcs' => (float) $item->price_per_pcs,
                    'subtotal' => (float) $item->subtotal,
                ]),
            ]),
        ];

        $productOption = Product::all()->map(fn ($p) => [
            'id' => $p->id,
            'name' => $p->name,
            'category' => $p->category,
        ]);


        $suppliers = Supplier::all();

        return Inertia::render('admin/job-tickets/Show', [
            'pesanan' => $mapped,
            'suppliers' => $suppliers,
            'productOptions' => $productOption,
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
