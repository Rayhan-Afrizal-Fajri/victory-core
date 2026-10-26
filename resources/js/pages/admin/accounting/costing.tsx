import React, { useState, useMemo } from 'react';
import { Head } from '@inertiajs/react';
import {
    Target,
    TrendingUp,
    TrendingDown,
    ArrowUpRight,
    ArrowDownRight,
    Search,
    Filter,
    Layers,
    Scissors,
    Shirt,
    Sparkles,
    AlertTriangle,
    CheckCircle2,
    Eye,
    Download
} from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { formatCurrency } from '@/helpers/format';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { AccountingHeader } from './components/accounting-header';
import { mockJobCosting, JobOrderCostItem } from './data/accounting-mock';
import { toast } from 'sonner';

interface CostingProps {
    jobCostings?: any[];
    summary?: {
        totalEstimatedCogs: number;
        totalActualCogs: number;
        totalRevenue: number;
        totalGrossProfit: number;
        avgGrossMargin: number;
        totalVariance: number;
    };
}

export default function AccountingCosting({ jobCostings: propJobCostings, summary }: CostingProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedJob, setSelectedJob] = useState<any | null>(null);

    const jobs = useMemo(() => {
        if (!propJobCostings || propJobCostings.length === 0) {
            return mockJobCosting;
        }
        return propJobCostings.map((c) => ({
            id: c.id,
            jobTicketNo: c.jobTicketNo,
            customer: c.customerName,
            productName: c.articleName,
            qty: c.quantity,
            revenue: c.revenueBilled,
            estBOMCost: c.totalEstimatedCogs,
            actualMaterial: c.actualMaterial,
            actualLabor: c.actualLabor,
            actualSubcon: c.actualSubcon,
            defectScrapCost: c.defectScrapCost,
            totalActualCost: c.totalActualCogs,
            varianceAmount: c.costVariance,
            variancePercent: c.costVariancePct,
            grossProfit: c.grossProfit,
            grossMarginPercent: c.grossMarginPct,
            status: c.status,
        }));
    }, [propJobCostings]);

    const filteredJobs = jobs.filter((job: any) =>
        job.jobTicketNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.productName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Aggregate Variance
    const totalEstCost = summary ? summary.totalEstimatedCogs : jobs.reduce((acc: number, curr: any) => acc + curr.estBOMCost, 0);
    const totalActCost = summary ? summary.totalActualCogs : jobs.reduce((acc: number, curr: any) => acc + curr.totalActualCost, 0);
    const totalRevenue = summary ? summary.totalRevenue : jobs.reduce((acc: number, curr: any) => acc + curr.revenue, 0);
    const netVariance = summary ? summary.totalVariance : (totalActCost - totalEstCost);
    const avgMargin = summary ? summary.avgGrossMargin : (jobs.reduce((acc: number, curr: any) => acc + curr.grossMarginPercent, 0) / (jobs.length || 1)).toFixed(1);

    return (
        <>
            <Head title="Job Order Costing (HPP Riil) - Stage 2" />

            <div className="space-y-6">
                <AccountingHeader activeTab="costing" />

                {/* SUMMARY CARDS */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Card className="shadow-xs">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs text-muted-foreground font-medium">Total Estimasi HPP (BOM)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold font-mono text-foreground">
                                {formatCurrency(totalEstCost)}
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">Budget awal berdasarkan penawaran</p>
                        </CardContent>
                    </Card>

                    <Card className="shadow-xs">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs text-muted-foreground font-medium">Total HPP Riil (Actual)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold font-mono text-foreground">
                                {formatCurrency(totalActCost)}
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">Penyerapan riil bahan, upah & makloon</p>
                        </CardContent>
                    </Card>

                    <Card className="shadow-xs">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs text-muted-foreground font-medium">Total Cost Variance</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className={`text-2xl font-bold font-mono ${netVariance <= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {netVariance <= 0 ? '-' : '+'}{formatCurrency(Math.abs(netVariance))}
                            </div>
                            <p className="mt-1 text-xs text-emerald-600 font-medium">
                                Efisiensi biaya produksi -1.2% di bawah budget
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="shadow-xs">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs text-muted-foreground font-medium">Rata-rata Gross Margin</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold font-mono text-primary">
                                {avgMargin}%
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">Target standar garmen: &ge; 35.0%</p>
                        </CardContent>
                    </Card>
                </div>

                {/* SEARCH & FILTERS */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Cari nomor PO, artikel, pelanggan..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 text-xs"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5 text-xs cursor-pointer"
                            onClick={() => toast.success('Laporan Job Order Costing berhasil diekspor!')}
                        >
                            <Download className="h-3.5 w-3.5" />
                            <span>Export Rekap HPP</span>
                        </Button>
                    </div>
                </div>

                {/* JOB ORDER COSTING TABLE */}
                <Card className="shadow-xs">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-sm font-semibold">Tabel Akumulasi Biaya Pokok Produksi per PO</CardTitle>
                                <CardDescription className="text-xs">
                                    Perbandingan langsung antara biaya estimasi BOM di Quotation dengan biaya sesungguhnya di lapangan
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto rounded-lg border">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-muted/60 text-muted-foreground font-medium border-b text-[11px]">
                                    <tr>
                                        <th className="p-3">Job Ticket / PO</th>
                                        <th className="p-3">Artikel & Qty</th>
                                        <th className="p-3 text-right">Pendapatan</th>
                                        <th className="p-3 text-right">Bahan Riil</th>
                                        <th className="p-3 text-right">Upah Borongan</th>
                                        <th className="p-3 text-right">Makloon</th>
                                        <th className="p-3 text-right">Scrap/QC</th>
                                        <th className="p-3 text-right font-bold">Total HPP Riil</th>
                                        <th className="p-3 text-right">Variance BOM</th>
                                        <th className="p-3 text-center">Margin %</th>
                                        <th className="p-3 text-center w-[80px]">Detail</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {filteredJobs.map((job) => (
                                        <tr key={job.id} className="hover:bg-muted/20 transition-colors">
                                            <td className="p-3 font-medium">
                                                <span className="font-semibold text-primary">{job.jobTicketNo}</span>
                                                <div className="text-[11px] text-muted-foreground">{job.customer}</div>
                                            </td>
                                            <td className="p-3">
                                                <div className="font-medium text-foreground">{job.productName}</div>
                                                <div className="text-[11px] text-muted-foreground font-mono">
                                                    {job.qty} pcs @ {formatCurrency(job.sellingPrice)}
                                                </div>
                                            </td>
                                            <td className="p-3 text-right font-mono font-medium text-foreground">
                                                {formatCurrency(job.revenue)}
                                            </td>
                                            <td className="p-3 text-right font-mono text-muted-foreground">
                                                {formatCurrency(job.actMaterialCost)}
                                            </td>
                                            <td className="p-3 text-right font-mono text-muted-foreground">
                                                {formatCurrency(job.actLaborCost)}
                                            </td>
                                            <td className="p-3 text-right font-mono text-muted-foreground">
                                                {formatCurrency(job.actSubconCost)}
                                            </td>
                                            <td className="p-3 text-right font-mono text-rose-600 dark:text-rose-400">
                                                {formatCurrency(job.actScrapCost)}
                                            </td>
                                            <td className="p-3 text-right font-mono font-bold text-foreground">
                                                {formatCurrency(job.totalActualCost)}
                                            </td>
                                            <td className="p-3 text-right font-mono font-semibold">
                                                {job.varianceAmount <= 0 ? (
                                                    <span className="text-emerald-600 dark:text-emerald-400 flex items-center justify-end gap-1">
                                                        <ArrowDownRight className="h-3 w-3" />
                                                        {formatCurrency(Math.abs(job.varianceAmount))} ({job.variancePercent}%)
                                                    </span>
                                                ) : (
                                                    <span className="text-rose-600 dark:text-rose-400 flex items-center justify-end gap-1">
                                                        <ArrowUpRight className="h-3 w-3" />
                                                        +{formatCurrency(job.varianceAmount)} (+{job.variancePercent}%)
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-3 text-center">
                                                <Badge
                                                    variant="secondary"
                                                    className={job.grossMarginPercent >= 35 ? 'bg-emerald-500/15 text-emerald-700 font-semibold' : 'bg-amber-500/15 text-amber-700 font-semibold'}
                                                >
                                                    {job.grossMarginPercent}%
                                                </Badge>
                                            </td>
                                            <td className="p-3 text-center">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 text-muted-foreground hover:text-foreground cursor-pointer"
                                                    onClick={() => setSelectedJob(job)}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {/* MODAL DETAIL HPP ARTIKEL */}
                <Dialog open={!!selectedJob} onOpenChange={() => setSelectedJob(null)}>
                    <DialogContent className="sm:max-w-[620px]">
                        <DialogHeader>
                            <DialogTitle className="text-base font-semibold flex items-center justify-between">
                                <span>Rincian HPP Riil: {selectedJob?.jobTicketNo}</span>
                                <Badge variant="outline" className="font-mono text-xs">
                                    {selectedJob?.qty} Pcs
                                </Badge>
                            </DialogTitle>
                            <DialogDescription className="text-xs">
                                {selectedJob?.productName} — Pelanggan: {selectedJob?.customer}
                            </DialogDescription>
                        </DialogHeader>

                        {selectedJob && (
                            <div className="space-y-4 py-2 text-xs">
                                <div className="grid grid-cols-3 gap-3 rounded-lg border bg-muted/20 p-3">
                                    <div>
                                        <p className="text-muted-foreground text-[11px]">Total Pendapatan</p>
                                        <p className="font-mono font-bold text-foreground text-sm">{formatCurrency(selectedJob.revenue)}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground text-[11px]">Estimasi BOM Awal</p>
                                        <p className="font-mono font-bold text-muted-foreground text-sm">{formatCurrency(selectedJob.estBOMCost)}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground text-[11px]">HPP Riil Terpakai</p>
                                        <p className="font-mono font-bold text-foreground text-sm">{formatCurrency(selectedJob.totalActualCost)}</p>
                                    </div>
                                </div>

                                {/* COST BREAKDOWN BARS */}
                                <div className="space-y-2.5">
                                    <h4 className="font-semibold text-xs text-foreground">Struktur Penyerapan Biaya Riil:</h4>

                                    {/* 1. Bahan Baku */}
                                    <div className="rounded-lg border p-2.5 space-y-1">
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="font-medium text-foreground flex items-center gap-1.5">
                                                <Shirt className="h-3.5 w-3.5 text-blue-500" />
                                                1. Biaya Bahan Baku Langsung (Kain & Aksesoris)
                                            </span>
                                            <span className="font-mono font-bold">{formatCurrency(selectedJob.actMaterialCost)}</span>
                                        </div>
                                        <p className="text-[11px] text-muted-foreground">
                                            Diambil dari purchasing kain riil dan pemakaian benang/kancing sesuai Job Ticket.
                                        </p>
                                    </div>

                                    {/* 2. Tenaga Kerja Langsung */}
                                    <div className="rounded-lg border p-2.5 space-y-1">
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="font-medium text-foreground flex items-center gap-1.5">
                                                <Scissors className="h-3.5 w-3.5 text-amber-500" />
                                                2. Biaya Tenaga Kerja Langsung (BTKL / Borongan)
                                            </span>
                                            <span className="font-mono font-bold">{formatCurrency(selectedJob.actLaborCost)}</span>
                                        </div>
                                        <p className="text-[11px] text-muted-foreground">
                                            Akumulasi output operator di Worker Board (Potong, Jahit, Finishing) * tarif upah per pcs.
                                        </p>
                                    </div>

                                    {/* 3. Makloon / Subkontrak */}
                                    <div className="rounded-lg border p-2.5 space-y-1">
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="font-medium text-foreground flex items-center gap-1.5">
                                                <Sparkles className="h-3.5 w-3.5 text-purple-500" />
                                                3. Biaya Makloon Subkontrak (Sablon & Bordir)
                                            </span>
                                            <span className="font-mono font-bold">{formatCurrency(selectedJob.actSubconCost)}</span>
                                        </div>
                                        <p className="text-[11px] text-muted-foreground">
                                            Biaya aktual tagihan vendor makloon eksternal untuk cetak DTF dan bordir.
                                        </p>
                                    </div>

                                    {/* 4. Scrap & Defect */}
                                    <div className="rounded-lg border p-2.5 space-y-1">
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="font-medium text-foreground flex items-center gap-1.5">
                                                <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />
                                                4. Biaya Defect, Kerusakan & Rework
                                            </span>
                                            <span className="font-mono font-bold text-rose-600">{formatCurrency(selectedJob.actScrapCost)}</span>
                                        </div>
                                        <p className="text-[11px] text-muted-foreground">
                                            Alokasi kerugian bahan rusak dari log QC Board yang harus dipotong ulang.
                                        </p>
                                    </div>
                                </div>

                                {/* BOTTOM SUMMARY */}
                                <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 flex justify-between items-center">
                                    <div>
                                        <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 block">
                                            Laba Kotor Riil (Gross Profit):
                                        </span>
                                        <span className="text-[11px] text-muted-foreground">
                                            Margin keuntungan kotor: <strong>{selectedJob.grossMarginPercent}%</strong>
                                        </span>
                                    </div>
                                    <span className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">
                                        {formatCurrency(selectedJob.grossProfit)}
                                    </span>
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
}

AccountingCosting.layout = (page: React.ReactNode) => (
    <AppLayout
        title="Job Order Costing (HPP Riil)"
        description="Perhitungan HPP riil per PO & perbandingan akurat dengan estimasi BOM."
        information="STAGE 2 · JOB ORDER COST ACCOUNTING"
        breadcrumbs={[
            { title: 'Dashboard', href: '/dashboard' },
            { title: 'Akuntansi', href: '/admin/accounting' },
            { title: 'Job Order Costing', href: '/admin/accounting/costing' },
        ]}
    >
        {page}
    </AppLayout>
);
