import { Head, router } from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";
import { ReactNode, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import ProgressBar from "@/components/dashboard/progress-bar";
import { CheckCircle2, Lock, Trash2 } from "lucide-react";
import { route } from 'ziggy-js';
import jobTickets from "@/routes/job-tickets";
import { toast } from "sonner";
import { update as updateProgress } from "@/routes/production-progress";

// Definisi Tipe Data Berdasarkan Skema Database Tergabung
type Pesanan = {
    id: number;
    no_job_ticket: string;
    produk: string;
    customer: { nama: string; nama_perusahaan: string };
    q: number;
    qs: number;
    deadline: string;
    created_at: string;
    status_divisi: string;
    harga_jual_per_pcs: number;
    estimasi_hpp_per_pcs: number;
    spesifikasi_bahan?: string;
    spesifikasi_sablon_bordir?: string;
    spesifikasi_aksesoris?: string;
    keterangan_tambahan?: string;
    production_progress: {
        id: number;
        prioritas: string;
        acc_sample: boolean;
        ppm_bahan: boolean;
        ppm_aksesoris: boolean;
        ppm_cutting: boolean;
        ppm_sablon: boolean;
        ppm_jahit: boolean;
        cut_test_susut: boolean;
        cut_test_luntur: boolean;
        cut_relax_bahan: boolean;
        cut_form_cutting: boolean;
        cut_label_potongan: boolean;
        cut_sisa_bahan: boolean;
        sablon_sample_warna: boolean;
        sablon_test_muntah: boolean;
        jahit_kelengkapan_aksesoris: boolean;
        jahit_titik_kritis: boolean;
        jahit_random_check: boolean;
        qc_steam_packing: boolean;
        qc_sampling_ukuran: boolean;
        qc_inspeksi_jahit: boolean;
        qc_surat_jalan: boolean;
        log_foto_confirm: boolean;
        log_random_cek: boolean;
        log_payment_delivery: boolean;
    };
};

interface ShowProps {
    pesanan: Pesanan;
}

export default function Show({ pesanan }: ShowProps) {
    const progress = pesanan.production_progress;
    
    // Perhitungan Sisa Hari Secara Dinamis
    const calculateDaysLeft = (deadlineStr: string) => {
        const deadlineDate = new Date(deadlineStr);
        const today = new Date();
        const diffTime = deadlineDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 0 ? `${diffDays} hari` : 'Overdue';
    };

    // Fungsi Pengiriman Update Checklist ke Backend (Menggunakan Inertia router)
    const handleCheckChange = (field: string, currentValue: boolean) => {
        if (!progress.id) return;

        router.patch(route('production-progress.update', progress.id), {
            [field]: !currentValue
        }, {
            preserveScroll: true,
            preserveState: true,
        });
    };

    // Fungsi Trigger Utama ACC Sample
    const handleToggleAccSample = () => {
    if (!progress.id) return;

    const willBeAcc = !progress.acc_sample;

    router.patch(
            route('production-progress.toggle-sample', progress.id),
            {},
            {
                preserveScroll: true,
                preserveState: true,

                onSuccess: () => {
                    toast.success(
                        willBeAcc
                            ? 'Sample di-ACC, tahap produksi terbuka!'
                            : 'ACC sample dibatalkan, tahap produksi dikunci kembali.'
                    );
                },
            }
        );
    };

    // Hitung persentase progres internal berdasarkan jumlah checklist yang bernilai true
    const totalCheckboxes = 22; 
    const checkedCount = Object.keys(progress).filter(
        (key) => key !== 'id' && key !== 'prioritas' && progress[key as keyof typeof progress] === true
    ).length;
    const progressPercentage = Math.round((checkedCount / totalCheckboxes) * 100);

    return (
        <>
            <Head title={`Job Ticket - ${pesanan.no_job_ticket}`} />
            
            <div className="space-y-6 max-w-400 mx-auto p-1">
                {/* Header Informasi Utama */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="space-y-1">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            JOB TICKETS / {pesanan.no_job_ticket}
                        </p>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-950">{pesanan.produk}</h1>
                        <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-slate-500">
                            <span className="font-semibold text-slate-700">{pesanan.customer.nama_perusahaan || pesanan.customer.nama}</span>
                            <span>•</span>
                            <span>{pesanan.q} pcs</span>
                            <span>•</span>
                            <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">Sample</Badge>
                            <span>•</span>
                            <Badge variant="secondary">{calculateDaysLeft(pesanan.deadline)}</Badge>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <select 
                            value={pesanan.status_divisi} 
                            onChange={(e) => router.patch(route('pesanan.update-status', pesanan.id), { status_divisi: e.target.value })}
                            className="bg-white border border-slate-200 rounded-md px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {['Penawaran', 'Quote', 'Sample', 'Blanks', 'CSA', 'Finance', 'Produksi', 'Pelunasan', 'Done'].map((st) => (
                                <option key={st} value={st}>{st}</option>
                            ))}
                        </select>
                        <Button variant="outline" className="text-destructive hover:bg-destructive/5 gap-2 cursor-pointer">
                            <Trash2 className="size-4" /> Hapus
                        </Button>
                    </div>
                </div>

                {/* Banner Status Gate - Klik Untuk ACC Sample */}
                <div 
                    onClick={handleToggleAccSample}
                    className={`w-full p-4 rounded-xl border border-dashed transition-all cursor-pointer flex items-center justify-center gap-2 text-sm font-semibold tracking-wide ${
                        progress.acc_sample 
                            ? 'bg-emerald-50/60 border-emerald-300 text-emerald-800 hover:bg-emerald-50' 
                            : 'bg-amber-50/60 border-amber-300 text-amber-800 hover:bg-amber-50'
                    }`}
                >
                    {progress.acc_sample ? (
                        <>
                            <CheckCircle2 className="size-5 text-emerald-600" />
                            SAMPLE SUDAH DI-ACC · KLIK UNTUK BATAL
                        </>
                    ) : (
                        <>
                            <Lock className="size-5 text-amber-600" />
                            KLIK UNTUK ACC SAMPLE (BUKA TAHAP PRODUKSI)
                        </>
                    )}
                </div>

                {/* Grid Tata Letak Konten */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Kolom Kiri: Checklist & Spesifikasi */}
                    <div className="lg:col-span-2 space-y-6">
                        <Tabs defaultValue="pre-production" className="w-full">
                            <TabsList className="grid w-full grid-cols-2 max-w-100 border-b rounded-none bg-transparent h-auto p-0">
                                <TabsTrigger value="pre-production" className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-blue-600 bg-transparent px-4 py-2 text-sm font-medium shadow-none">
                                    PRE-PRODUCTION
                                </TabsTrigger>
                                <TabsTrigger value="production" className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-blue-600 bg-transparent px-4 py-2 text-sm font-medium shadow-none flex items-center gap-1.5">
                                    {!progress.acc_sample && <Lock className="size-3.5 text-muted-foreground" />}
                                    PRODUKSI {!progress.acc_sample && '(LOCKED)'}
                                </TabsTrigger>
                            </TabsList>

                            {/* Konten Tab Pre-Production */}
                            <TabsContent value="pre-production" className="mt-4 space-y-4">
                                <Card>
                                    <CardContent className="p-6 space-y-4">
                                        <div className="flex items-center justify-between border-b pb-2">
                                            <h3 className="font-semibold text-slate-900">PPM (Pre-Production Meeting)</h3>
                                            <Badge variant={progress.ppm_bahan && progress.ppm_aksesoris && progress.ppm_cutting && progress.ppm_sablon && progress.ppm_jahit ? "default" : "secondary"}>
                                                {progress.ppm_bahan && progress.ppm_aksesoris && progress.ppm_cutting && progress.ppm_sablon && progress.ppm_jahit ? "DONE" : "IN PROGRESS"}
                                            </Badge>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                                            {[
                                                { key: 'ppm_bahan', label: 'Brief & Spek Bahan Dikonfirmasi' },
                                                { key: 'ppm_aksesoris', label: 'Kelengkapan Aksesoris Siap' },
                                                { key: 'ppm_cutting', label: 'Pola & Metode Cutting Disepakati' },
                                                { key: 'ppm_sablon', label: 'Titik Kritis & Kapasitas Sablon/Bordir' },
                                                { key: 'ppm_jahit', label: 'Titik Kritis & Kapasitas Jahit' },
                                            ].map((item) => (
                                                <div key={item.key} className="flex items-center space-x-2 p-2 rounded-md hover:bg-slate-50">
                                                    <Checkbox 
                                                        id={item.key} 
                                                        checked={progress[item.key as keyof typeof progress] as boolean}
                                                        onCheckedChange={() => handleCheckChange(item.key, progress[item.key as keyof typeof progress] as boolean)}
                                                    />
                                                    <label htmlFor={item.key} className="text-sm font-medium text-slate-700 cursor-pointer">{item.label}</label>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* Konten Tab Produksi (Hanya Terbuka Jika ACC Sample True) */}
                            <TabsContent value="production" className="mt-4">
                                {!progress.acc_sample ? (
                                    <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed rounded-xl bg-slate-50/50">
                                        <Lock className="size-8 text-amber-500 mb-2" />
                                        <h3 className="font-semibold text-slate-900">Tahap Produksi Terkunci</h3>
                                        <p className="text-sm text-slate-500 max-w-sm mt-1">
                                            Lakukan ACC Sample pada tombol banner di atas untuk mengaktifkan seluruh checklist lini produksi massal.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {/* Sekat Lini Per Divisi Lapangan Menggunakan Pola Accordion/Collapsible Ringan */}
                                        {[
                                            {
                                                title: 'Fase Cutting (Pemotongan Bahan)',
                                                items: [
                                                    { key: 'cut_test_susut', label: 'Test Susut Bahan < 3%' },
                                                    { key: 'cut_test_luntur', label: 'Test Luntur Kain' },
                                                    { key: 'cut_relax_bahan', label: 'Relaxasi Kain Sebelum Potong' },
                                                    { key: 'cut_form_cutting', label: 'Pemeriksaan Form Cutting' },
                                                    { key: 'cut_label_potongan', label: 'Labeling Tiap Potongan Bundel (No Ticket)' },
                                                    { key: 'cut_sisa_bahan', label: 'Setting & Pengembalian Sisa Bahan roll' },
                                                ]
                                            },
                                            {
                                                title: 'Fase Sablon / Bordir',
                                                items: [
                                                    { key: 'sablon_sample_warna', label: 'Sample Warna Asli / Proofing Hasil' },
                                                    { key: 'sablon_test_muntah', label: 'Test Ketahanan Warna & Gosok' },
                                                ]
                                            },
                                            {
                                                title: 'Fase Jahit (Sewing Assembly)',
                                                items: [
                                                    { key: 'jahit_kelengkapan_aksesoris', label: 'Kelengkapan Aksesoris per Bundel' },
                                                    { key: 'jahit_titik_kritis', label: 'Pengecekan Titik Kritis Kerah/Saku' },
                                                    { key: 'jahit_random_check', label: 'Random Check Ukuran Berjalan' },
                                                ]
                                            },
                                            {
                                                title: 'Fase Quality Control (QC) & Packing',
                                                items: [
                                                    { key: 'qc_steam_packing', label: 'Pembersihan Benang (BB) & Steam Packing' },
                                                    { key: 'qc_sampling_ukuran', label: 'Random Sampling Ukuran Akhir Sesuai Size Chart' },
                                                    { key: 'qc_inspeksi_jahit', label: 'Inspeksi Akhir Titik Kritis Jahitan' },
                                                    { key: 'qc_surat_jalan', label: 'Penerbitan Dokumen Surat Jalan Manual CSA' },
                                                ]
                                            },
                                            {
                                                title: 'Fase Logistik (CSA Delivery)',
                                                items: [
                                                    { key: 'log_foto_confirm', label: 'Foto Produk Akhir & Konfirmasi ke Customer' },
                                                    { key: 'log_random_cek', label: 'Random Cek Kesesuaian Sampel Sebelum Kirim' },
                                                    { key: 'log_payment_delivery', label: 'Cek Verifikasi Pelunasan Pembayaran + Pengiriman' },
                                                ]
                                            }
                                        ].map((divisi, idx) => (
                                            <Card key={idx}>
                                                <CardContent className="p-5 space-y-3">
                                                    <h4 className="font-semibold text-sm border-b pb-1.5 uppercase tracking-wider text-blue-700">{divisi.title}</h4>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                        {divisi.items.map((item) => (
                                                            <div key={item.key} className="flex items-center space-x-2 p-1.5 rounded hover:bg-slate-50">
                                                                <Checkbox 
                                                                    id={item.key} 
                                                                    checked={progress[item.key as keyof typeof progress] as boolean}
                                                                    onCheckedChange={() => handleCheckChange(item.key, progress[item.key as keyof typeof progress] as boolean)}
                                                                />
                                                                <label htmlFor={item.key} className="text-xs font-medium text-slate-700 cursor-pointer">{item.label}</label>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                )}
                            </TabsContent>
                        </Tabs>

                        {/* Bar Progres Alur Kerja Global */}
                        <Card>
                            <CardContent className="p-5 space-y-2">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">PROGRESS WORKFLOW</span>
                                <ProgressBar value={progressPercentage} showPercentage={true} />
                            </CardContent>
                        </Card>

                        {/* Kotak Informasi Spesifikasi Detail Dokumen Teknis Designer */}
                        <Card>
                            <CardContent className="p-5 space-y-4">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block border-b pb-1">CATATAN / SPESIFIKASI TEKNIS</span>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-700">
                                    <div>
                                        <p className="font-semibold text-slate-900">Spesifikasi Kain/Bahan:</p>
                                        <p className="text-slate-600 mt-0.5">{pesanan.spesifikasi_bahan || 'Bahan oxford, warna navy.'}</p>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-slate-900">Spesifikasi Aplikasi Desain:</p>
                                        <p className="text-slate-600 mt-0.5">{pesanan.spesifikasi_sablon_bordir || 'Bordir logo dada kiri.'}</p>
                                    </div>
                                    <div className="md:col-span-2">
                                        <p className="font-semibold text-slate-900">Aksesoris & Keterangan Tambahan:</p>
                                        <p className="text-slate-600 mt-0.5">{pesanan.keterangan_tambahan || pesanan.spesifikasi_aksesoris || 'Kancing senada bahan, kemasan plastik satuan.'}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Kolom Kanan: Finansial Komersial & Timeline */}
                    <div className="space-y-6">
                        {/* Ringkasan Komersial */}
                        <Card>
                            <CardContent className="p-5 space-y-4">
                                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 border-b pb-1">KOMERSIAL</h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-500">Harga Jual / pcs</span>
                                        <span className="font-semibold text-slate-900">Rp {pesanan.harga_jual_per_pcs.toLocaleString('id-ID')}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-500">Estimasi HPP / pcs</span>
                                        <span className="font-semibold text-slate-900">Rp {pesanan.estimasi_hpp_per_pcs.toLocaleString('id-ID')}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm bg-blue-50/50 p-2 rounded border border-blue-100">
                                        <span className="text-blue-700 font-medium">Harga Sample (3x)</span>
                                        <span className="font-bold text-blue-900">Rp {(pesanan.harga_jual_per_pcs * 3).toLocaleString('id-ID')}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm pt-1 border-t">
                                        <span className="text-slate-500">Quantity</span>
                                        <span className="font-semibold text-slate-900">{pesanan.q} pcs</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm pt-2 bg-emerald-50/40 p-2 rounded border border-emerald-100">
                                        <span className="text-emerald-800 font-medium">GOP Total (Estimasi)</span>
                                        <span className="font-bold text-emerald-950">
                                            Rp {((pesanan.harga_jual_per_pcs - pesanan.estimasi_hpp_per_pcs) * pesanan.q).toLocaleString('id-ID')}
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Pemantau Batas Waktu */}
                        <Card>
                            <CardContent className="p-5 space-y-4">
                                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 border-b pb-1">TIMELINE</h3>
                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-500">Tanggal Masuk</span>
                                        <span className="font-medium text-slate-800">{new Date(pesanan.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: '2-digit', day: '2-digit' })}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-500">Batas Selesai</span>
                                        <span className="font-medium text-slate-800">{new Date(pesanan.deadline).toLocaleDateString('id-ID', { year: 'numeric', month: '2-digit', day: '2-digit' })}</span>
                                    </div>
                                    <div className="flex justify-between items-center pt-2 border-t">
                                        <span className="text-slate-500">Sisa Hari</span>
                                        <Badge variant="secondary" className="font-semibold bg-blue-100 text-blue-800 border-none">
                                            {calculateDaysLeft(pesanan.deadline)}
                                        </Badge>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </>
    );
}

// Perbarui fungsi Show.layout di bagian paling bawah file Show.tsx Anda menjadi seperti ini:

Show.layout = (page: React.ReactElement<ShowProps>) => {
    const pesanan = page.props?.pesanan;

    const noJobTicket =
        pesanan?.no_job_ticket || 'Detail Tiket';

    return (
        <AppLayout
            title=""
            description="Pantau progres perakitan garmen, spesifikasi produksi, dan verifikasi gerbang persetujuan sampel."
            information="Production · Digital Checklist"
            breadcrumbs={[
                {
                    title: 'Job Tickets',
                    href: jobTickets.index(),
                },
                {
                    title: noJobTicket,
                    href: pesanan
                        ? jobTickets.show(pesanan.id)
                        : '#',
                },
            ]}
        >
            {page}
        </AppLayout>
    );
};