import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import {
    Truck,
    Award,
    CheckCircle2,
    AlertTriangle,
    ShieldCheck,
    Clock,
    Search,
    Star,
    ArrowUpRight,
    Building2,
    Calendar,
    Layers
} from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { KpiHeader } from './components/kpi-header';
import { mockSupplierScorecards, SupplierScorecardItem } from './data/kpi-mock';
import { toast } from 'sonner';

export default function KpiSuppliers() {
    const [period, setPeriod] = useState('monthly');

    return (
        <>
            <Head title="Supplier Scorecard & Purchasing KPI - Stage 2" />

            <div className="space-y-6">
                <KpiHeader activeTab="suppliers" period={period} onPeriodChange={setPeriod} />

                {/* TOP 3 SUPPLY CHAIN METRICS */}
                <div className="grid gap-4 sm:grid-cols-3">
                    <Card className="border-l-4 border-l-emerald-500 shadow-xs">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs text-muted-foreground font-medium">Material Receiving Reject Rate</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold font-mono text-emerald-600">
                                0.8%
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Di bawah ambang batas toleransi pabrik (&le;1.0%)
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-blue-500 shadow-xs">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs text-muted-foreground font-medium">Rata-rata Supplier Lead Time</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold font-mono text-foreground">
                                3.2 <span className="text-sm font-normal text-muted-foreground">Hari</span>
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Durasi pemesanan PO hingga kain tiba di gudang
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-purple-500 shadow-xs">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs text-muted-foreground font-medium">Supplier & Vendor Aktif</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold font-mono text-foreground">
                                4 Mitra
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                                2 Suplier Kain & Aksesoris, 2 Vendor Makloon
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* SUPPLIER SCORECARD TABLE */}
                <Card className="shadow-xs">
                    <CardHeader>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                    <Award className="h-4 w-4 text-amber-500" />
                                    Papan Peringkat & Evaluasi Kinerja Supplier (Supplier Scorecard)
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    Skor komposit dihitung dari: Ketepatan Waktu Pengiriman (40%), Kualitas Lolos Bebas Cacat (40%), dan Kompetisi Harga (20%)
                                </CardDescription>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                className="text-xs cursor-pointer"
                                onClick={() => toast.success('Evaluasi Supplier berhasil diekspor ke format PDF!')}
                            >
                                Cetak Raport Supplier
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto rounded-lg border">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-muted/60 text-muted-foreground font-medium border-b text-[11px]">
                                    <tr>
                                        <th className="p-3">Nama Mitra / Supplier</th>
                                        <th className="p-3">Kategori Pasokan</th>
                                        <th className="p-3 text-center">Total Order</th>
                                        <th className="p-3 text-right">Ketepatan Kirim</th>
                                        <th className="p-3 text-right">Kualitas Bebas Cacat</th>
                                        <th className="p-3 text-right">Kompetisi Harga</th>
                                        <th className="p-3 text-center font-bold">Skor Akhir</th>
                                        <th className="p-3 text-center w-22.5">Grade</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {mockSupplierScorecards.map((sup) => (
                                        <tr key={sup.id} className="hover:bg-muted/20 transition-colors">
                                            <td className="p-3 font-semibold text-foreground">
                                                {sup.name}
                                            </td>
                                            <td className="p-3 text-muted-foreground">
                                                <Badge variant="outline" className="text-[10px]">
                                                    {sup.category}
                                                </Badge>
                                            </td>
                                            <td className="p-3 text-center font-mono font-medium">
                                                {sup.totalOrders} Transaksi
                                            </td>
                                            <td className="p-3 text-right font-mono font-medium text-emerald-600">
                                                {sup.onTimeDeliveryPct}%
                                            </td>
                                            <td className="p-3 text-right font-mono font-medium text-emerald-600">
                                                {sup.qualityPassPct}%
                                            </td>
                                            <td className="p-3 text-right font-mono font-medium text-foreground">
                                                {sup.priceCompetitiveness}%
                                            </td>
                                            <td className="p-3 text-center font-mono font-bold text-sm text-primary">
                                                {sup.compositeScore}
                                            </td>
                                            <td className="p-3 text-center">
                                                <Badge
                                                    className={
                                                        sup.grade === 'A'
                                                            ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-bold text-xs px-3'
                                                            : 'bg-amber-500/15 text-amber-700 dark:text-amber-400 font-bold text-xs px-3'
                                                    }
                                                >
                                                    Grade {sup.grade}
                                                </Badge>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {/* LOG KOMPLAIN BAHAN / URGENT MATERIAL ISSUES */}
                <Card className="shadow-xs border-amber-500/30">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-amber-700 dark:text-amber-400">
                                <AlertTriangle className="h-4 w-4" />
                                Log Penanganan Bahan Bermasalah (Material Incident Log)
                            </CardTitle>
                            <Badge variant="outline" className="border-amber-400 text-amber-600 text-xs">
                                Quality Assurance Gudang
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <div className="rounded-lg border p-3 bg-muted/20 flex flex-wrap items-center justify-between gap-2 text-xs">
                                <div>
                                    <span className="font-semibold text-foreground">CV Sumber Tekstil Bandung · 24 Okt 2026</span>
                                    <p className="text-muted-foreground mt-0.5">
                                        Lot kain Cotton Combed 30s Hitam (Roll #3) memiliki susut lebar 2 cm. Supplier segera mengganti potongan 1 roll baru dalam 4 jam.
                                    </p>
                                </div>
                                <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-500/30 text-[10px]">
                                    Terselesaikan / Diganti
                                </Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

KpiSuppliers.layout = (page: React.ReactNode) => (
    <AppLayout
        title="Supplier Scorecard & Purchasing KPI"
        description="Papan peringkat keandalan supplier bahan kain dan vendor makloon eksternal."
        information="STAGE 2 · SUPPLY CHAIN ANALYTICS"
        breadcrumbs={[
            { title: 'Dashboard', href: '/dashboard' },
            { title: 'KPI & Analitik', href: '/admin/kpi/executive' },
            { title: 'Supplier Scorecard', href: '/admin/kpi/suppliers' },
        ]}
    >
        {page}
    </AppLayout>
);
