import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import {
    Activity,
    CheckCircle2,
    Clock,
    AlertTriangle,
    Scissors,
    Shirt,
    Package,
    ShieldCheck,
    Gauge,
    BarChart3,
    ArrowUpRight,
    TrendingUp,
    Users,
    Filter
} from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { KpiHeader } from './components/kpi-header';
import { mockThroughput, mockDefectPareto, ThroughputItem } from './data/kpi-mock';
import { toast } from 'sonner';

export default function KpiProductionQc() {
    const [period, setPeriod] = useState('daily');

    const otdRate = 94.2;
    const ftprRate = 96.8;
    const defectRate = 1.8;

    return (
        <>
            <Head title="KPI Produksi & Quality Control (QC) - Stage 2" />

            <div className="space-y-6">
                <KpiHeader activeTab="production" period={period} onPeriodChange={setPeriod} />

                {/* TOP 3 MANUFACTURING SPEEDOMETER CARDS */}
                <div className="grid gap-4 sm:grid-cols-3">
                    {/* OTD RATE GAUGE CARD */}
                    <Card className="shadow-xs border-l-4 border-l-blue-500">
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-xs text-muted-foreground font-medium">
                                    On-Time Delivery Rate (OTD)
                                </CardTitle>
                                <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 text-[10px]">
                                    Waspada (Target &ge;95%)
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-bold font-mono text-foreground">{otdRate}%</span>
                                <span className="text-xs text-muted-foreground">PO Tepat Waktu</span>
                            </div>
                            {/* Gauge Visual Bar */}
                            <div className="mt-3 space-y-1">
                                <div className="h-2 w-full rounded-full bg-muted overflow-hidden flex">
                                    <div className="bg-amber-500 h-full" style={{ width: `${otdRate}%` }} />
                                </div>
                                <div className="flex justify-between text-[10px] text-muted-foreground">
                                    <span>0%</span>
                                    <span className="font-semibold text-primary">Target: 95.0%</span>
                                    <span>100%</span>
                                </div>
                            </div>
                            <p className="mt-2 text-[11px] text-muted-foreground">
                                23 dari 24 PO diserahkan sebelum tenggat waktu pelanggan.
                            </p>
                        </CardContent>
                    </Card>

                    {/* FTPR / RIGHT FIRST TIME GAUGE CARD */}
                    <Card className="shadow-xs border-l-4 border-l-emerald-500">
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-xs text-muted-foreground font-medium">
                                    First Time Pass Rate (FTPR %)
                                </CardTitle>
                                <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-[10px]">
                                    Sangat Baik (Target &ge;95%)
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                                    {ftprRate}%
                                </span>
                                <span className="text-xs text-muted-foreground">Lolos Inspeksi Awal</span>
                            </div>
                            {/* Gauge Visual Bar */}
                            <div className="mt-3 space-y-1">
                                <div className="h-2 w-full rounded-full bg-muted overflow-hidden flex">
                                    <div className="bg-emerald-500 h-full" style={{ width: `${ftprRate}%` }} />
                                </div>
                                <div className="flex justify-between text-[10px] text-muted-foreground">
                                    <span>0%</span>
                                    <span className="font-semibold text-emerald-600">Target: 95.0%</span>
                                    <span>100%</span>
                                </div>
                            </div>
                            <p className="mt-2 text-[11px] text-muted-foreground">
                                968 dari 1.000 baju lolos QC tanpa perlu bongkar jahitan (rework).
                            </p>
                        </CardContent>
                    </Card>

                    {/* DEFECT / SCRAP RATE */}
                    <Card className="shadow-xs border-l-4 border-l-purple-500">
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-xs text-muted-foreground font-medium">
                                    Defect / Scrap Rate (%)
                                </CardTitle>
                                <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-[10px]">
                                    Hemat (Batas &le;2.5%)
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-bold font-mono text-foreground">{defectRate}%</span>
                                <span className="text-xs text-muted-foreground">Tingkat Cacat Riil</span>
                            </div>
                            {/* Gauge Visual Bar */}
                            <div className="mt-3 space-y-1">
                                <div className="h-2 w-full rounded-full bg-muted overflow-hidden flex">
                                    <div className="bg-emerald-500 h-full" style={{ width: `${(defectRate / 2.5) * 100}%` }} />
                                </div>
                                <div className="flex justify-between text-[10px] text-muted-foreground">
                                    <span>0.0%</span>
                                    <span className="font-semibold text-rose-600">Maksimal: 2.5%</span>
                                </div>
                            </div>
                            <p className="mt-2 text-[11px] text-muted-foreground">
                                Total scrap bahan & kegagalan QC terkendali dengan baik.
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* ROW 2: REAL-TIME THROUGHPUT PER WORK CENTER */}
                <Card className="shadow-xs">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                <Activity className="h-4 w-4 text-primary" />
                                Real-Time Output Throughput per Work Center (Pcs / Hari)
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Kapasitas riil barang yang diselesaikan hari ini per stasiun kerja di Worker Board
                            </CardDescription>
                        </div>
                        <Badge variant="outline" className="text-xs font-mono">
                            Hari Ini · Shift 1 & 2
                        </Badge>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            {mockThroughput.map((tp) => {
                                const isOverTarget = tp.completionPct >= 100;
                                return (
                                    <div key={tp.center} className="rounded-xl border p-4 bg-muted/20 space-y-3">
                                        <div className="flex justify-between items-start">
                                            <span className="font-semibold text-xs text-foreground">{tp.center}</span>
                                            <Badge
                                                className={`text-[10px] ${
                                                    isOverTarget
                                                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                                                        : 'bg-amber-500/15 text-amber-700 dark:text-amber-400'
                                                }`}
                                            >
                                                {tp.completionPct}%
                                            </Badge>
                                        </div>

                                        <div className="flex items-baseline justify-between">
                                            <div className="text-2xl font-bold font-mono text-foreground">
                                                {tp.currentPcs.toLocaleString()}
                                                <span className="text-xs font-normal text-muted-foreground ml-1">pcs</span>
                                            </div>
                                            <span className="text-xs text-muted-foreground">
                                                Target: {tp.targetPcs.toLocaleString()}
                                            </span>
                                        </div>

                                        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${isOverTarget ? 'bg-emerald-500' : 'bg-amber-500'}`}
                                                style={{ width: `${Math.min(100, tp.completionPct)}%` }}
                                            />
                                        </div>

                                        <div className="text-[11px] text-muted-foreground flex justify-between border-t pt-2">
                                            <span>{tp.activeWorkers} Operator Aktif</span>
                                            <span className="font-medium text-foreground">{tp.leadOperator}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                {/* ROW 3: DEFECT PARETO BREAKDOWN & CORRECTIVE ACTIONS */}
                <Card className="shadow-xs">
                    <CardHeader>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                    <BarChart3 className="h-4 w-4 text-rose-500" />
                                    Analisis Diagram Pareto Cacat (80/20 Defect Pareto Breakdown)
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    Distribusi frekuensi penyebab kegagalan QC dari QC Board beserta tindakan korektif (corrective action)
                                </CardDescription>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                className="text-xs cursor-pointer"
                                onClick={() => toast.success('Laporan Analisis Cacat QC berhasil diekspor!')}
                            >
                                Export Log QC
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto rounded-lg border">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-muted/60 text-muted-foreground font-medium border-b text-[11px]">
                                    <tr>
                                        <th className="p-3 w-[50px] text-center">Rank</th>
                                        <th className="p-3">Penyebab Cacat (Defect Reason)</th>
                                        <th className="p-3 text-right w-[100px]">Jumlah Kasus</th>
                                        <th className="p-3 text-right w-[110px]">Frekuensi (%)</th>
                                        <th className="p-3 text-right w-[130px]">Kumulatif (80/20)</th>
                                        <th className="p-3">Aksi Korektif Standar (Corrective Action)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {mockDefectPareto.map((item, idx) => (
                                        <tr key={item.reason} className="hover:bg-muted/20 transition-colors">
                                            <td className="p-3 text-center font-bold text-muted-foreground">
                                                #{idx + 1}
                                            </td>
                                            <td className="p-3 font-semibold text-foreground">
                                                {item.reason}
                                            </td>
                                            <td className="p-3 text-right font-mono font-bold text-foreground">
                                                {item.count} pcs
                                            </td>
                                            <td className="p-3 text-right font-mono text-muted-foreground">
                                                {item.pct}%
                                            </td>
                                            <td className="p-3 text-right font-mono font-bold">
                                                <Badge
                                                    variant="secondary"
                                                    className={item.cumulativePct <= 80 ? 'bg-rose-500/15 text-rose-700 dark:text-rose-400 font-bold' : 'bg-muted text-muted-foreground'}
                                                >
                                                    {item.cumulativePct}%
                                                </Badge>
                                            </td>
                                            <td className="p-3 text-muted-foreground">
                                                <span className="font-medium text-foreground">{item.correctiveAction}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <p className="mt-3 text-[11px] text-muted-foreground italic">
                            * Prinsip Pareto: 80% cacat berasal dari 3 penyebab teratas (Jahitan melompat, noda minyak, sablon retak). Penanganan 3 pos ini akan memangkas reject hingga 82.4%.
                        </p>
                    </CardContent>
                </Card>

                {/* ROW 4: DEADLINE WATCHLIST (URGENT ORDERS) */}
                <Card className="shadow-xs border-amber-500/30">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-amber-700 dark:text-amber-400">
                                <Clock className="h-4 w-4" />
                                Deadline Watchlist: Job Ticket Mendekati Jatuh Tempo (&le; 3 Hari)
                            </CardTitle>
                            <Badge variant="outline" className="border-amber-400 text-amber-600 text-xs">
                                Pantauan Kritis
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto rounded-lg border">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-muted text-muted-foreground border-b text-[11px]">
                                    <tr>
                                        <th className="p-2.5">No. PO & Artikel</th>
                                        <th className="p-2.5">Pelanggan</th>
                                        <th className="p-2.5">Deadline</th>
                                        <th className="p-2.5">Sisa Waktu</th>
                                        <th className="p-2.5">Stasiun Aktif</th>
                                        <th className="p-2.5 text-center">Progres Fisik</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    <tr className="hover:bg-muted/10">
                                        <td className="p-2.5 font-semibold text-primary">PO-2026-10-044 (Kemeja PDH 300 pcs)</td>
                                        <td className="p-2.5">SMA Nusantara 1</td>
                                        <td className="p-2.5 font-mono">28 Okt 2026</td>
                                        <td className="p-2.5 font-bold text-rose-600 font-mono">&lt; 48 Jam</td>
                                        <td className="p-2.5">Jahit (Sewing - Line 2)</td>
                                        <td className="p-2.5 text-center">
                                            <Badge className="bg-amber-500/15 text-amber-700 border-amber-500/30">65% Selesai</Badge>
                                        </td>
                                    </tr>
                                    <tr className="hover:bg-muted/10">
                                        <td className="p-2.5 font-semibold text-primary">PO-2026-10-046 (Jersey Komunitas 200 pcs)</td>
                                        <td className="p-2.5">PT Mandiri Sejahtera</td>
                                        <td className="p-2.5 font-mono">29 Okt 2026</td>
                                        <td className="p-2.5 font-bold text-amber-600 font-mono">3 Hari</td>
                                        <td className="p-2.5">QC & Steam Polybag</td>
                                        <td className="p-2.5 text-center">
                                            <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-500/30">90% Selesai</Badge>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

KpiProductionQc.layout = (page: React.ReactNode) => (
    <AppLayout
        title="KPI Produksi & Quality Control (QC)"
        description="Pengukuran throughput stasiun kerja, OTD pabrik, dan analisis pareto cacat."
        information="STAGE 2 · SHOPFLOOR ANALYTICS"
        breadcrumbs={[
            { title: 'Dashboard', href: '/dashboard' },
            { title: 'KPI & Analitik', href: '/admin/kpi/executive' },
            { title: 'Produksi & QC', href: '/admin/kpi/production-qc' },
        ]}
    >
        {page}
    </AppLayout>
);
