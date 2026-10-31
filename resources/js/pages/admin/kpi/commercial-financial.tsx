import React, { useState, useMemo } from 'react';
import { Head } from '@inertiajs/react';
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    Target,
    Layers,
    Clock,
    FileText,
    Users,
    CheckCircle2,
    Building2,
    Calendar,
    ArrowUpRight,
    ArrowDownRight
} from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { formatCurrency } from '@/helpers/format';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { KpiHeader } from './components/kpi-header';
import { mockJobCosting } from '../accounting/data/accounting-mock';
import { toast } from 'sonner';

interface CommercialFinancialProps {
    winRate?: number;
    aov?: number;
    dso?: number;
    repeatOrderRate?: number;
    quotationBreakdown?: {
        approved: number;
        draft: number;
        expired: number;
    };
    costVarianceList?: any[];
}

export default function KpiCommercialFinancial({
    winRate: propWinRate,
    aov: propAov,
    dso: propDso,
    repeatOrderRate: propRepeatOrderRate,
    quotationBreakdown,
    costVarianceList: propCostVarianceList,
}: CommercialFinancialProps) {
    const [period, setPeriod] = useState('monthly');

    const winRate = propWinRate !== undefined ? propWinRate : 68.5;
    const aov = propAov !== undefined ? propAov : 14850000;
    const dsoDays = propDso !== undefined ? propDso : 11.4;
    const repeatOrderRate = propRepeatOrderRate !== undefined ? propRepeatOrderRate : 42.8;

    const varianceItems = useMemo(() => {
        if (propCostVarianceList && propCostVarianceList.length > 0) {
            return propCostVarianceList;
        }
        return mockJobCosting.map((item) => ({
            id: item.id,
            poNumber: item.jobTicketNo,
            article: item.productName,
            customer: item.customer,
            revenue: item.revenue,
            estimatedCogs: item.estBOMCost,
            actualCogs: item.totalActualCost,
            varianceAmount: item.varianceAmount,
            variancePct: item.variancePercent,
            status: item.varianceAmount <= 0 ? 'efficient' : 'over_budget',
        }));
    }, [propCostVarianceList]);

    const approvedQuotes = quotationBreakdown?.approved ?? 24;
    const totalDecidedQuotes = (quotationBreakdown?.approved ?? 24) + (quotationBreakdown?.expired ?? 11);

    return (
        <>
            <Head title="KPI Komersial & Finansial - Stage 2" />

            <div className="space-y-6">
                <KpiHeader activeTab="commercial" period={period} onPeriodChange={setPeriod} />

                {/* 4 TOP COMMERCIAL METRICS */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {/* WIN RATE */}
                    <Card className="border-l-4 border-l-emerald-500 shadow-xs">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs text-muted-foreground font-medium">Quotation Win Rate (%)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold font-mono text-emerald-600">
                                {winRate}%
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                                {approvedQuotes} dari {totalDecidedQuotes} penawaran closing (Target &ge;65%)
                            </p>
                        </CardContent>
                    </Card>

                    {/* AOV */}
                    <Card className="border-l-4 border-l-blue-500 shadow-xs">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs text-muted-foreground font-medium">Average Order Value (AOV)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold font-mono text-foreground">
                                {formatCurrency(aov)}
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Rata-rata nominal per Invoice / Pesanan
                            </p>
                        </CardContent>
                    </Card>

                    {/* DSO */}
                    <Card className="border-l-4 border-l-purple-500 shadow-xs">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs text-muted-foreground font-medium">Days Sales Outstanding (DSO)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold font-mono text-purple-600">
                                {dsoDays} <span className="text-sm font-normal text-muted-foreground">Hari</span>
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Rata-rata umur piutang tertagih (Target &le;14 Hari)
                            </p>
                        </CardContent>
                    </Card>

                    {/* REPEAT ORDER */}
                    <Card className="border-l-4 border-l-amber-500 shadow-xs">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs text-muted-foreground font-medium">Repeat Order Rate (%)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold font-mono text-amber-600">
                                {repeatOrderRate}%
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Pelanggan repeat order &gt; 1 kali
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* COST VARIANCE HEATMAP TABLE */}
                <Card className="shadow-xs">
                    <CardHeader>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                    <Target className="h-4 w-4 text-primary" />
                                    Cost Variance Heatmap (BOM vs HPP Riil per Artikel)
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    Mendeteksi potensi kebocoran biaya atau efisiensi keuntungan kotor setiap Job Ticket
                                </CardDescription>
                            </div>
                            <Badge variant="outline" className="text-xs">
                                Deviasi Biaya Lapangan
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto rounded-lg border">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-muted/60 text-muted-foreground font-medium border-b text-[11px]">
                                    <tr>
                                        <th className="p-3">Job Ticket / PO</th>
                                        <th className="p-3">Artikel Produk</th>
                                        <th className="p-3 text-right">Pendapatan</th>
                                        <th className="p-3 text-right">Budget Estimasi (BOM)</th>
                                        <th className="p-3 text-right font-bold">HPP Aktual Riil</th>
                                        <th className="p-3 text-right">Selisih Deviasi</th>
                                        <th className="p-3 text-center">Status Efisiensi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {varianceItems.map((item: any) => {
                                        const isEfficient = item.varianceAmount <= 0;
                                        return (
                                            <tr key={item.id || item.poNumber} className="hover:bg-muted/20 transition-colors">
                                                <td className="p-3 font-semibold font-mono text-primary">
                                                    {item.poNumber || item.jobTicketNo}
                                                </td>
                                                <td className="p-3">
                                                    <div className="font-medium text-foreground">{item.article || item.productName}</div>
                                                    <div className="text-[11px] text-muted-foreground">{item.customer || `${item.quantity || 100} pcs`}</div>
                                                </td>
                                                <td className="p-3 text-right font-mono font-medium">
                                                    {formatCurrency(item.revenue || ((item.actualCogs || item.totalActualCost || 1000000) * 1.35))}
                                                </td>
                                                <td className="p-3 text-right font-mono text-muted-foreground">
                                                    {formatCurrency(item.estimatedCogs || item.estBOMCost || 0)}
                                                </td>
                                                <td className="p-3 text-right font-mono font-bold text-foreground">
                                                    {formatCurrency(item.actualCogs || item.totalActualCost || 0)}
                                                </td>
                                                <td className="p-3 text-right font-mono font-bold">
                                                    {isEfficient ? (
                                                        <span className="text-emerald-600 flex items-center justify-end gap-1">
                                                            <ArrowDownRight className="h-3.5 w-3.5" />
                                                            Hemat {formatCurrency(Math.abs(item.varianceAmount))}
                                                        </span>
                                                    ) : (
                                                        <span className="text-rose-600 flex items-center justify-end gap-1">
                                                            <ArrowUpRight className="h-3.5 w-3.5" />
                                                            Over +{formatCurrency(item.varianceAmount)}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="p-3 text-center">
                                                    <Badge
                                                        className={isEfficient ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30' : 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30'}
                                                    >
                                                        {isEfficient ? 'Efisien (Profit Terjaga)' : 'Bocor / Perlu Evaluasi'}
                                                    </Badge>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {/* SALES PERFORMANCE BY SALES PERSON */}
                <Card className="shadow-xs">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <Users className="h-4 w-4 text-primary" />
                            Produktivitas & Win Rate Tim Penjualan / Sales Rep
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 sm:grid-cols-3">
                            {[
                                { name: 'Rian Pratama', issued: 15, approved: 11, winRate: 73.3, revenue: 142000000 },
                                { name: 'Dina Marlina', issued: 12, approved: 8, winRate: 66.7, revenue: 118000000 },
                                { name: 'Budi Santoso', issued: 8, approved: 5, winRate: 62.5, revenue: 78000000 },
                            ].map((rep) => (
                                <div key={rep.name} className="rounded-xl border p-4 bg-muted/20 space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="font-bold text-xs text-foreground">{rep.name}</span>
                                        <Badge variant="outline" className="text-emerald-600 font-semibold font-mono">
                                            {rep.winRate}% Closing
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        {rep.approved} dari {rep.issued} Quotation berhasil closing
                                    </p>
                                    <div className="border-t pt-2 flex justify-between items-baseline">
                                        <span className="text-[11px] text-muted-foreground">Total Omset:</span>
                                        <span className="font-mono font-bold text-foreground text-sm">
                                            {formatCurrency(rep.revenue)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

KpiCommercialFinancial.layout = (page: React.ReactNode) => (
    <AppLayout
        title="KPI Komersial & Finansial"
        description="Analisis Win Rate penawaran harga, AOV, umur piutang DSO & heatmap variansi HPP."
        information="STAGE 2 · COMMERCIAL & FINANCIAL ANALYTICS"
        breadcrumbs={[
            { title: 'Dashboard', href: '/dashboard' },
            { title: 'KPI & Analitik', href: '/admin/kpi/executive' },
            { title: 'Komersial & Finansial', href: '/admin/kpi/commercial-financial' },
        ]}
    >
        {page}
    </AppLayout>
);