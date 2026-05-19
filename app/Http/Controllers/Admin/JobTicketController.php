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
                    'customer' => $order->customer?->nama,
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
            'productionProgress'
        ])->findOrFail($id);

        // Kirim data lengkap ke file Show.tsx Anda
        return Inertia::render('admin/job-tickets/Show', [
            'pesanan' => [
                'id' => $pesanan->id,
                'no_job_ticket' => $pesanan->no_job_ticket,
                'produk' => $pesanan->produk,

                'customer' => [
                    'nama' => $pesanan->customer?->nama,
                    'nama_perusahaan' => $pesanan->customer?->nama
                ],

                'q' => $pesanan->q,
                'qs' => $pesanan->qs,
                'deadline' => $pesanan->deadline,
                'created_at' => $pesanan->created_at,
                'status_divisi' => $pesanan->status_divisi,

                'harga_jual_per_pcs' => (float) $pesanan->harga_jual_per_pcs,
                'estimasi_hpp_per_pcs' => (float) $pesanan->estimasi_hpp_per_pcs,
                'spesifikasi_bahan' => $pesanan->spesifikasi_bahan,
                'spesifikasi_sablon_bordir' => $pesanan->spesifikasi_sablon_bordir,
                'keterangan_tambahan' => $pesanan->keterangan_tambahan,

                'production_progress' => $pesanan->productionProgress ?? [
                    'id' => null,
                    'prioritas' => 'Medium',
                    'acc_sample' => false,

                    'ppm_bahan' => false,
                    'ppm_aksesoris' => false,
                    'ppm_cutting' => false,
                    'ppm_sablon' => false,
                    'ppm_jahit' => false,

                    'cut_test_susut' => false,
                    'cut_test_luntur' => false,
                    'cut_relax_bahan' => false,
                    'cut_form_cutting' => false,
                    'cut_label_potongan' => false,
                    'cut_sisa_bahan' => false,

                    'sablon_sample_warna' => false,
                    'sablon_test_muntah' => false,

                    'jahit_kelengkapan_aksesoris' => false,
                    'jahit_titik_kritis' => false,
                    'jahit_random_check' => false,

                    'qc_steam_packing' => false,
                    'qc_sampling_ukuran' => false,
                    'qc_inspeksi_jahit' => false,
                    'qc_surat_jalan' => false,

                    'log_foto_confirm' => false,
                    'log_random_cek' => false,
                    'log_payment_delivery' => false,
                ],
            ]
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
    public function destroy(string $id)
    {
        //
    }
}
