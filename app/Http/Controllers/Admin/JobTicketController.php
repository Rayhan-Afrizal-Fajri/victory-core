<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Pesanan;
use Illuminate\Http\Request;
use Inertia\Inertia;

class JobTicketController extends Controller
{

    // Simulasi Database Koleksi Data Dummy Terpusat
    private static function getMockOrders()
    {
        return [
            [
                'id' => 1,
                'no_job_ticket' => 'VL-2026-001',
                'produk' => 'Polo Shirt Event',
                'customer' => [
                    'nama' => 'Maju Bersama',
                    'nama_perusahaan' => 'PT Maju Bersama'
                ],
                'q' => 120,
                'qs' => 2,
                'deadline' => '2026-05-18',
                'created_at' => '2026-05-10 09:00:00',
                'status_divisi' => 'Produksi',
                'harga_jual_per_pcs' => 85000,
                'estimasi_hpp_per_pcs' => 55000,
                'spesifikasi_bahan' => 'Pique Cotton Premium Indigo Blue',
                'spesifikasi_sablon_bordir' => 'Bordir Komputer 3 Titik (Dada L/R, Punggung)',
                'keterangan_tambahan' => 'Kancing senada kain, packing plastik rapi per pcs.',
                'production_progress' => [
                    'id' => 1,
                    'prioritas' => 'High',
                    'acc_sample' => true,
                    'tgl_acc_sample' => '2026-05-12 14:00:00',
                    'ppm_bahan' => true, 'ppm_aksesoris' => true, 'ppm_cutting' => true, 'ppm_sablon' => true, 'ppm_jahit' => true,
                    'cut_test_susut' => true, 'cut_test_luntur' => true, 'cut_relax_bahan' => true, 'cut_form_cutting' => true, 'cut_label_potongan' => true, 'cut_sisa_bahan' => false,
                    'sablon_sample_warna' => true, 'sablon_test_muntah' => true,
                    'jahit_kelengkapan_aksesoris' => true, 'jahit_titik_kritis' => false, 'jahit_random_check' => false,
                    'qc_steam_packing' => false, 'qc_sampling_ukuran' => false, 'qc_inspeksi_jahit' => false, 'qc_surat_jalan' => false,
                    'log_foto_confirm' => false, 'log_random_cek' => false, 'log_payment_delivery' => false,
                ]
            ],
            [
                'id' => 2,
                'no_job_ticket' => 'VL-2026-002',
                'produk' => 'Kemeja Lapangan',
                'customer' => [
                    'nama' => 'Sinar Abadi',
                    'nama_perusahaan' => 'CV Sinar Abadi'
                ],
                'q' => 80,
                'qs' => 1,
                'deadline' => '2026-05-15',
                'created_at' => '2026-05-11 10:30:00',
                'status_divisi' => 'Sample',
                'harga_jual_per_pcs' => 135000,
                'estimasi_hpp_per_pcs' => 80000,
                'spesifikasi_bahan' => 'Ripstop Tornado Khaki',
                'spesifikasi_sablon_bordir' => 'Bordir Emblem Lepas Pasang Velcro',
                'keterangan_tambahan' => 'Ventilasi jaring di punggung belakang.',
                'production_progress' => [
                    'id' => 2,
                    'prioritas' => 'Medium',
                    'acc_sample' => false,
                    'tgl_acc_sample' => null,
                    'ppm_bahan' => true, 'ppm_aksesoris' => false, 'ppm_cutting' => false, 'ppm_sablon' => false, 'ppm_jahit' => false,
                    'cut_test_susut' => false, 'cut_test_luntur' => false, 'cut_relax_bahan' => false, 'cut_form_cutting' => false, 'cut_label_potongan' => false, 'cut_sisa_bahan' => false,
                    'sablon_sample_warna' => false, 'sablon_test_muntah' => false,
                    'jahit_kelengkapan_aksesoris' => false, 'jahit_titik_kritis' => false, 'jahit_random_check' => false,
                    'qc_steam_packing' => false, 'qc_sampling_ukuran' => false, 'qc_inspeksi_jahit' => false, 'qc_surat_jalan' => false,
                    'log_foto_confirm' => false, 'log_random_cek' => false, 'log_payment_delivery' => false,
                ]
            ],
            [
                'id' => 3,
                'no_job_ticket' => 'VL-2026-003',
                'produk' => 'Hoodie Komunitas',
                'customer' => [
                    'nama' => 'Vespa Club',
                    'nama_perusahaan' => 'Komunitas Vespa'
                ],
                'q' => 200,
                'qs' => 3,
                'deadline' => '2026-05-13',
                'created_at' => '2026-05-01 08:00:00',
                'status_divisi' => 'Done',
                'harga_jual_per_pcs' => 175000,
                'estimasi_hpp_per_pcs' => 110000,
                'spesifikasi_bahan' => 'Cotton Fleece 330gsm Deep Black',
                'spesifikasi_sablon_bordir' => 'Sablon Plastisol High Density Glossy',
                'keterangan_tambahan' => 'Tali hoodie kustom anyaman tebal.',
                'production_progress' => [
                    'id' => 3,
                    'prioritas' => 'Urgent',
                    'acc_sample' => true,
                    'tgl_acc_sample' => '2026-05-04 11:00:00',
                    'ppm_bahan' => true, 'ppm_aksesoris' => true, 'ppm_cutting' => true, 'ppm_sablon' => true, 'ppm_jahit' => true,
                    'cut_test_susut' => true, 'cut_test_luntur' => true, 'cut_relax_bahan' => true, 'cut_form_cutting' => true, 'cut_label_potongan' => true, 'cut_sisa_bahan' => true,
                    'sablon_sample_warna' => true, 'sablon_test_muntah' => true,
                    'jahit_kelengkapan_aksesoris' => true, 'jahit_titik_kritis' => true, 'jahit_random_check' => true,
                    'qc_steam_packing' => true, 'qc_sampling_ukuran' => true, 'qc_inspeksi_jahit' => true, 'qc_surat_jalan' => true,
                    'log_foto_confirm' => true, 'log_random_cek' => true, 'log_payment_delivery' => true,
                ]
            ],
        ];
    }
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
                    'invoice.payment',
                    'media',
                    'delivery'
                ])->latest();
            },
            'invoices.payment',
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
                'qty' => $s->qty,
                'status' => $s->status,
                'sent_at' => $s->sent_at,
                'approved_at' => $s->approved_at,
            ])->toArray(),
            'invoices' => $pesanan->invoices->map(fn ($inv) => [
                'id' => $inv->id,
                'title' => $inv->no_invoice ?? $inv->kategori_invoice,
                'amount' => (float) $inv->total_tagihan,
                'status' => $inv->status_tagihan ?? 'Unpaid',
                'issued_at' => $inv->tgl_jatuh_tempo,
                'payments' => $inv->payment->map(fn ($p) => [
                    'id' => $p->id,
                    'amount' => (float) $p->jumlah_bayar,
                    'method' => $p->metode_pembayaran,
                    'paid_at' => $p->tgl_bayar,
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
