import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import {
    Wallet,
    ArrowDownLeft,
    ArrowUpRight,
    TrendingUp,
    ShieldCheck,
    AlertCircle,
    CheckCircle2,
    Clock,
    FileText,
    Target,
    Layers,
    DollarSign,
    RefreshCw,
    Plus,
    Building2,
    Receipt
} from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { formatCurrency } from '@/helpers/format';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AccountingHeader } from './components/accounting-header';
import { mockCOA, mockJournals, mockJobCosting, mockReceivables, mockPayables } from './data/accounting-mock';
import { toast } from 'sonner';

export default function AccountingIndex() {
    const [filterPeriod, setFilterPeriod] = useState('oktober-2026');

    // Aggregate Calculations
    const cashTotal = 8500000 + 74200000 + 35800000;
    const arTotal = mockReceivables.reduce((acc, curr) => acc + curr.remainingAmount, 0);
    const apTotal = mockPayables.reduce((acc, curr) => acc + curr.remainingAmount, 0);
    const netProfitMonth = 25300000;

    const handleSyncEvent = () => {
        toast.success('Sinkronisasi Event Operasional selesai! 6 Jurnal Otomatis ter-update.');
    };

    return (
        <>
            <Head title="Accounting & Financial Management - Stage 2" />

            <div className="space-y-6">
                <AccountingHeader activeTab="overview" />

                {/* TOP FINANCIAL METRICS CARDS */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Kas & Bank */}
                    <Card className="border-l-4 border-l-blue-500 shadow-xs transition-all hover:shadow-md">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs font-medium text-muted-foreground">
                                Total Kas & Bank
                            </CardTitle>
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                <Wallet className="h-4 w-4" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold tracking-tight text-foreground">
                                {formatCurrency(cashTotal)}
                            </div>
                            <p className="mt-1 flex items-center text-xs text-muted-foreground">
                                <span className="font-medium text-emerald-600 dark:text-emerald-400">3 Rekening Aktif</span>
                                <span className="mx-1.5">·</span>
                                <span>BCA, Mandiri, Kas Kecil</span>
                            </p>
                        </CardContent>
                    </Card>

                    {/* Piutang Usaha (AR) */}
                    <Card className="border-l-4 border-l-amber-500 shadow-xs transition-all hover:shadow-md">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs font-medium text-muted-foreground">
                                Piutang Usaha (AR)
                            </CardTitle>
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                <ArrowDownLeft className="h-4 w-4" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold tracking-tight text-foreground">
                                {formatCurrency(arTotal)}
                            </div>
                            <p className="mt-1 flex items-center text-xs text-muted-foreground">
                                <span className="font-medium text-amber-600 dark:text-amber-400">4 Invoice Menunggu</span>
                                <span className="mx-1.5">·</span>
                                <span>2 Melewati Tempo</span>
                            </p>
                        </CardContent>
                    </Card>

                    {/* Hutang Usaha & Vendor (AP) */}
                    <Card className="border-l-4 border-l-rose-500 shadow-xs transition-all hover:shadow-md">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs font-medium text-muted-foreground">
                                Hutang Usaha (AP)
                            </CardTitle>
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
                                <ArrowUpRight className="h-4 w-4" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold tracking-tight text-foreground">
                                {formatCurrency(apTotal)}
                            </div>
                            <p className="mt-1 flex items-center text-xs text-muted-foreground">
                                <span className="font-medium text-rose-600 dark:text-rose-400">Supplier & Makloon</span>
                                <span className="mx-1.5">·</span>
                                <span>1 Jatuh tempo minggu ini</span>
                            </p>
                        </CardContent>
                    </Card>

                    {/* Laba Bersih Berjalan */}
                    <Card className="border-l-4 border-l-emerald-500 shadow-xs transition-all hover:shadow-md">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs font-medium text-muted-foreground">
                                Laba Bersih (Net Profit)
                            </CardTitle>
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                <TrendingUp className="h-4 w-4" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                                {formatCurrency(netProfitMonth)}
                            </div>
                            <p className="mt-1 flex items-center text-xs text-muted-foreground">
                                <span className="font-medium text-emerald-600">Margin 25.7%</span>
                                <span className="mx-1.5">·</span>
                                <span>Setelah HPP & OPEX</span>
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* ROW 2: BANK BALANCES & AUTO-JOURNAL FEED */}
                <div className="grid gap-6 lg:grid-cols-3">
                    {/* LEFT (1 Col): KAS & BANK SUMMARY */}
                    <Card className="shadow-xs lg:col-span-1">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-semibold">Rekening Kas & Bank</CardTitle>
                                <Badge variant="secondary" className="text-[10px]">Real-Time</Badge>
                            </div>
                            <CardDescription className="text-xs">
                                Saldo rekening penampung operasional konveksi
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center justify-between rounded-lg border p-3">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-md bg-blue-600 text-white font-bold text-xs">
                                        BCA
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-foreground">BCA Operasional Pabrik</p>
                                        <p className="text-[11px] text-muted-foreground">731-0982-881 (a.n Victory)</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-bold text-foreground">{formatCurrency(74200000)}</p>
                                    <span className="text-[10px] text-emerald-600 font-medium">Aktif / Kliring</span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between rounded-lg border p-3">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-md bg-amber-600 text-white font-bold text-xs">
                                        MDR
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-foreground">Bank Mandiri Penerimaan</p>
                                        <p className="text-[11px] text-muted-foreground">131-00-192-4412</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-bold text-foreground">{formatCurrency(35800000)}</p>
                                    <span className="text-[10px] text-emerald-600 font-medium">Rekening Tagihan</span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between rounded-lg border p-3">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-md bg-emerald-600 text-white font-bold text-xs">
                                        KAS
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-foreground">Kas Kecil (Petty Cash)</p>
                                        <p className="text-[11px] text-muted-foreground">Brankas Office & Workshop</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-bold text-foreground">{formatCurrency(8500000)}</p>
                                    <span className="text-[10px] text-muted-foreground">Imprest Limit 10 Jt</span>
                                </div>
                            </div>

                            <Link href="/admin/accounting/expenses" className="block pt-2">
                                <Button variant="outline" size="sm" className="w-full text-xs cursor-pointer">
                                    Kelola Mutasi & Kas Kecil
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>

                    {/* RIGHT (2 Cols): EVENT-DRIVEN AUTO JOURNAL FEED */}
                    <Card className="shadow-xs lg:col-span-2">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                    <ShieldCheck className="h-4 w-4 text-emerald-500" />
                                    Jurnal Otomatis Berbasis Event (Auto-Journal Engine)
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    Transaksi operasional Victory Core dicatat otomatis ke jurnal umum tanpa input manual
                                </CardDescription>
                            </div>
                            <Button variant="ghost" size="sm" className="gap-1 text-xs cursor-pointer" onClick={handleSyncEvent}>
                                <RefreshCw className="h-3.5 w-3.5" />
                                <span>Sinkronisasi</span>
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <div className="divide-y rounded-lg border">
                                {mockJournals.slice(0, 4).map((journal) => (
                                    <div key={journal.id} className="p-3.5 transition-colors hover:bg-muted/40">
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className="font-mono text-[10px] uppercase">
                                                    {journal.entryNumber}
                                                </Badge>
                                                {journal.jobTicketNo && (
                                                    <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px]">
                                                        {journal.jobTicketNo}
                                                    </Badge>
                                                )}
                                                <span className="text-xs text-muted-foreground">{journal.date}</span>
                                            </div>
                                            <div className="text-xs font-semibold text-foreground">
                                                Total: {formatCurrency(journal.totalDebit)}
                                            </div>
                                        </div>

                                        <p className="mt-1.5 text-xs font-medium text-foreground">
                                            {journal.description}
                                        </p>

                                        {/* Debit & Credit Line Snapshot */}
                                        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] bg-muted/30 rounded-md p-2">
                                            <div>
                                                <span className="font-semibold text-emerald-700 dark:text-emerald-400">Debit:</span>{' '}
                                                {journal.lines.filter(l => l.debit > 0).map(l => (
                                                    <span key={l.accountCode} className="text-muted-foreground">
                                                        {l.accountCode} {l.accountName} ({formatCurrency(l.debit)})
                                                    </span>
                                                ))}
                                            </div>
                                            <div>
                                                <span className="font-semibold text-blue-700 dark:text-blue-400">Kredit:</span>{' '}
                                                {journal.lines.filter(l => l.credit > 0).map(l => (
                                                    <span key={l.accountCode} className="text-muted-foreground">
                                                        {l.accountCode} {l.accountName} ({formatCurrency(l.credit)})
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                                <span className="flex items-center gap-1.5">
                                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                                    Semua transaksi seimbang (Debit = Kredit 100%)
                                </span>
                                <Link href="/admin/accounting/journals" className="font-semibold text-primary hover:underline">
                                    Buka Buku Besar & Jurnal Lengkap →
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* ROW 3: JOB ORDER COSTING HIGHLIGHTS */}
                <Card className="shadow-xs">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                <Target className="h-4 w-4 text-primary" />
                                Job Order Costing (HPP Riil per PO & Variance BOM)
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Evaluasi selisih antara Estimasi Biaya di Quotation (BOM) vs Realisasi Aktual di Pabrik
                            </CardDescription>
                        </div>
                        <Link href="/admin/accounting/costing">
                            <Button variant="outline" size="sm" className="text-xs cursor-pointer">
                                Analisis Lengkap HPP
                            </Button>
                        </Link>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto rounded-lg border">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-muted/60 text-muted-foreground font-medium border-b">
                                    <tr>
                                        <th className="p-3">No. PO & Artikel</th>
                                        <th className="p-3">Customer</th>
                                        <th className="p-3 text-right">Qty</th>
                                        <th className="p-3 text-right">Pendapatan</th>
                                        <th className="p-3 text-right">Estimasi BOM</th>
                                        <th className="p-3 text-right">HPP Riil (Actual)</th>
                                        <th className="p-3 text-right">Cost Variance</th>
                                        <th className="p-3 text-right">Gross Profit</th>
                                        <th className="p-3 text-center">Margin %</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {mockJobCosting.map((job) => (
                                        <tr key={job.id} className="hover:bg-muted/30 transition-colors">
                                            <td className="p-3 font-medium">
                                                <span className="font-semibold text-primary">{job.jobTicketNo}</span>
                                                <div className="text-[11px] text-muted-foreground truncate max-w-[200px]">
                                                    {job.productName}
                                                </div>
                                            </td>
                                            <td className="p-3 text-foreground">{job.customer}</td>
                                            <td className="p-3 text-right font-mono">{job.qty} pcs</td>
                                            <td className="p-3 text-right font-mono font-medium">{formatCurrency(job.revenue)}</td>
                                            <td className="p-3 text-right font-mono text-muted-foreground">{formatCurrency(job.estBOMCost)}</td>
                                            <td className="p-3 text-right font-mono font-bold text-foreground">{formatCurrency(job.totalActualCost)}</td>
                                            <td className="p-3 text-right font-mono font-semibold">
                                                {job.varianceAmount <= 0 ? (
                                                    <span className="text-emerald-600 dark:text-emerald-400">
                                                        {formatCurrency(job.varianceAmount)} ({job.variancePercent}%)
                                                    </span>
                                                ) : (
                                                    <span className="text-rose-600 dark:text-rose-400">
                                                        +{formatCurrency(job.varianceAmount)} (+{job.variancePercent}%)
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-3 text-right font-mono font-bold text-emerald-600">
                                                {formatCurrency(job.grossProfit)}
                                            </td>
                                            <td className="p-3 text-center">
                                                <Badge
                                                    variant="secondary"
                                                    className={job.grossMarginPercent >= 35 ? 'bg-emerald-500/15 text-emerald-700 font-semibold' : 'bg-amber-500/15 text-amber-700 font-semibold'}
                                                >
                                                    {job.grossMarginPercent}%
                                                </Badge>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

AccountingIndex.layout = (page: React.ReactNode) => (
    <AppLayout
        title="Modul Akuntansi (Stage 2)"
        description="Sistem Akuntansi Keuangan Double-Entry & Akuntansi Biaya Produksi Garmen."
        information="STAGE 2 · FINANCIAL & COST ACCOUNTING"
        breadcrumbs={[
            { title: 'Dashboard', href: '/dashboard' },
            { title: 'Akuntansi', href: '/admin/accounting' },
        ]}
    >
        {page}
    </AppLayout>
);
