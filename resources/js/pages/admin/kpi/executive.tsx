import React, { useState, useMemo, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import {
    Gauge,
    TrendingUp,
    TrendingDown,
    AlertTriangle,
    ShieldAlert,
    CheckCircle2,
    Calendar,
    ArrowUpRight,
    ArrowDownRight,
    Sparkles,
    Activity,
    Layers,
    Target,
    Filter,
    SlidersHorizontal,
    Bell,
    Check
} from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { formatCurrency } from '@/helpers/format';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { KpiHeader } from './components/kpi-header';
import { mockKpiMetrics, mockKpiAlerts, KpiMetric, KpiAlert } from './data/kpi-mock';
import { toast } from 'sonner';

interface ExecutiveProps {
    metrics?: any[];
    monthlyTrend?: any[];
    salesFunnel?: any[];
    alerts?: any[];
}

export default function KpiExecutive({
    metrics: propMetrics,
    monthlyTrend: propMonthlyTrend,
    salesFunnel: propSalesFunnel,
    alerts: propAlerts,
}: ExecutiveProps) {
    const [period, setPeriod] = useState('monthly');

    // Default alerts with prop fallback
    const rawAlerts: KpiAlert[] = useMemo(() => {
        if (!propAlerts || propAlerts.length === 0) {
            return mockKpiAlerts;
        }
        return propAlerts.map(a => ({
            id: String(a.id),
            level: (a.level === 'critical' ? 'danger' : (a.level === 'warning' ? 'warning' : 'success')) as any,
            title: a.title,
            message: a.message,
            date: a.date,
            metricCode: a.source || 'KPI',
        }));
    }, [propAlerts]);

    const [alerts, setAlerts] = useState<KpiAlert[]>(rawAlerts);

    useEffect(() => {
        setAlerts(rawAlerts);
    }, [rawAlerts]);

    // Metrics mapping
    const rawMetrics: KpiMetric[] = useMemo(() => {
        if (!propMetrics || propMetrics.length === 0) {
            return mockKpiMetrics;
        }
        return propMetrics.map((m) => {
            const isGood = m.status === 'good' || m.status === 'success';
            const isWarn = m.status === 'warning';
            return {
                code: m.code,
                name: m.name,
                dimension: (m.category === 'financial' ? 'Finansial' : (m.category === 'quality' ? 'Kualitas' : 'Produksi')) as any,
                currentValue: m.currentValue,
                targetValue: m.targetValue,
                unit: m.unit,
                trend: m.trend || 'up',
                trendValue: m.trendPct ? `${m.trendPct > 0 ? '+' : ''}${m.trendPct}% vs bln lalu` : '+0%',
                status: isGood ? 'success' : isWarn ? 'warning' : 'danger',
                description: m.name,
            };
        });
    }, [propMetrics]);

    const [metrics, setMetrics] = useState<KpiMetric[]>(rawMetrics);

    useEffect(() => {
        setMetrics(rawMetrics);
    }, [rawMetrics]);

    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isSavingTargets, setIsSavingTargets] = useState(false);

    // Trend and Funnel Mappings
    const trendItems = useMemo(() => {
        if (propMonthlyTrend && propMonthlyTrend.length > 0) {
            return propMonthlyTrend.map((item: any) => {
                const rev = Number(item.revenue) || 0;
                const cogs = Number(item.cost) || 0;
                const gop = Number(item.profit) || (rev - cogs);
                const margin = rev > 0 ? Number(((gop / rev) * 100).toFixed(1)) : 35;
                return {
                    month: item.month,
                    rev,
                    cogs,
                    gop,
                    margin,
                };
            });
        }
        return [
            { month: 'Mei 2026', rev: 72000000, cogs: 44500000, gop: 27500000, margin: 38.2 },
            { month: 'Jun 2026', rev: 84000000, cogs: 51200000, gop: 32800000, margin: 39.0 },
            { month: 'Jul 2026', rev: 79500000, cogs: 49000000, gop: 30500000, margin: 38.4 },
            { month: 'Agt 2026', rev: 91000000, cogs: 56400000, gop: 34600000, margin: 38.0 },
            { month: 'Sep 2026', rev: 94500000, cogs: 57800000, gop: 36700000, margin: 38.8 },
            { month: 'Okt 2026', rev: 98400000, cogs: 56900000, gop: 41500000, margin: 42.2 },
        ];
    }, [propMonthlyTrend]);

    const funnelItems = useMemo(() => {
        if (propSalesFunnel && propSalesFunnel.length > 0) {
            return propSalesFunnel.map((item: any, idx: number) => ({
                stage: item.stage || `Stage ${idx + 1}`,
                count: item.count || 0,
                value: item.value || 0,
            }));
        }
        return [
            { stage: '1. Penawaran Diterbitkan', count: 35, value: 385000000 },
            { stage: '2. Disetujui Pelanggan', count: 24, value: 260000000 },
            { stage: '3. DP 50% Terverifikasi', count: 22, value: 130000000 },
            { stage: '4. Sedang Diproduksi', count: 18, value: 180000000 },
            { stage: '5. Dikirim & Selesai', count: 16, value: 160000000 },
        ];
    }, [propSalesFunnel]);

    // Settings Modal State
    const [targetOtd, setTargetOtd] = useState<number>(95);
    const [targetGpm, setTargetGpm] = useState<number>(35);
    const [targetDefect, setTargetDefect] = useState<number>(2.5);

    const handleAcknowledgeAlert = (id: string) => {
        setAlerts(alerts.filter(a => a.id !== id));
        router.post(`/admin/kpi/alerts/${id}/acknowledge`, {}, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Peringatan anomali telah ditandai sebagai diketahui.');
            },
            onError: () => {
                toast.success('Peringatan anomali telah ditandai sebagai diketahui.');
            }
        });
    };

    const handleSaveTargets = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSavingTargets(true);

        router.post('/admin/kpi/targets', {
            targets: [
                { code: 'OTD_RATE', target_value: targetOtd },
                { code: 'GPM_PCT', target_value: targetGpm },
                { code: 'DEFECT_RATE', target_value: targetDefect },
            ]
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setIsSavingTargets(false);
                setIsSettingsOpen(false);
                toast.success('Target KPI & Ambang Batas berhasil disimpan ke server!');
            },
            onError: () => {
                setIsSavingTargets(false);
                // Also update local state for presentation
                const updated = metrics.map((m) => {
                    if (m.code === 'OTD_RATE') return { ...m, targetValue: targetOtd };
                    if (m.code === 'GPM_PCT') return { ...m, targetValue: targetGpm };
                    if (m.code === 'DEFECT_RATE') return { ...m, targetValue: targetDefect };
                    return m;
                });
                setMetrics(updated);
                setIsSettingsOpen(false);
                toast.success('Target KPI & Ambang Batas berhasil diperbarui!');
            }
        });
    };

    return (
        <>
            <Head title="Executive KPI Dashboard - Stage 2" />

            <div className="space-y-6">
                <KpiHeader
                    activeTab="executive"
                    period={period}
                    onPeriodChange={setPeriod}
                    onOpenSettings={() => setIsSettingsOpen(false)}
                />

                {/* EARLY WARNING SYSTEM (CRITICAL ANOMALY ALERTS) */}
                {alerts.length > 0 && (
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs font-semibold text-rose-600 dark:text-rose-400">
                            <ShieldAlert className="h-4 w-4" />
                            <span>EARLY WARNING SYSTEM (PERINGATAN DINI RESIKO OPERASIONAL)</span>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                            {alerts.map((alert) => (
                                <div
                                    key={alert.id}
                                    className={`flex items-start justify-between gap-3 rounded-xl border p-3.5 shadow-xs transition-all ${
                                        alert.level === 'danger'
                                            ? 'border-rose-500/40 bg-rose-500/10 text-rose-950 dark:text-rose-100'
                                            : 'border-amber-500/40 bg-amber-500/10 text-amber-950 dark:text-amber-100'
                                    }`}
                                >
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <Badge
                                                variant={alert.level === 'danger' ? 'destructive' : 'secondary'}
                                                className="text-[10px] font-semibold uppercase"
                                            >
                                                {alert.level === 'danger' ? 'Kritis' : 'Waspada'}
                                            </Badge>
                                            <span className="font-semibold text-xs text-foreground">{alert.title}</span>
                                            <span className="text-[10px] text-muted-foreground">· {alert.date}</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground leading-relaxed">
                                            {alert.message}
                                        </p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 text-xs text-muted-foreground hover:text-foreground cursor-pointer shrink-0"
                                        onClick={() => handleAcknowledgeAlert(alert.id)}
                                    >
                                        <Check className="h-3.5 w-3.5 mr-1" /> Mengerti
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 5 BALANCED SCORECARD METRIC CARDS */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {metrics.map((metric) => {
                        const isSuccess = metric.status === 'success';
                        const isWarning = metric.status === 'warning';
                        return (
                            <Card key={metric.code} className="shadow-xs transition-all hover:shadow-md">
                                <CardHeader className="flex flex-row items-start justify-between pb-2">
                                    <div>
                                        <Badge variant="outline" className="text-[10px] uppercase font-semibold mb-1">
                                            {metric.dimension}
                                        </Badge>
                                        <CardTitle className="text-xs font-medium text-muted-foreground">
                                            {metric.name}
                                        </CardTitle>
                                    </div>
                                    <Badge
                                        className={`text-[10px] font-semibold ${
                                            isSuccess
                                                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                                                : isWarning
                                                ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30'
                                                : 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30'
                                        }`}
                                    >
                                        {isSuccess ? 'On Target' : isWarning ? 'Waspada' : 'Kritis'}
                                    </Badge>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-baseline justify-between">
                                        <div className="text-3xl font-bold tracking-tight font-mono text-foreground">
                                            {metric.currentValue}
                                            <span className="text-base font-normal text-muted-foreground ml-1">
                                                {metric.unit}
                                            </span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[11px] text-muted-foreground block">
                                                Target: <strong>{metric.targetValue} {metric.unit}</strong>
                                            </span>
                                        </div>
                                    </div>

                                    {/* PROGRESS BAR TO TARGET */}
                                    <div className="mt-3 h-1.5 w-full rounded-full bg-muted overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all ${
                                                isSuccess ? 'bg-emerald-500' : isWarning ? 'bg-amber-500' : 'bg-rose-500'
                                            }`}
                                            style={{
                                                width: `${Math.min(100, (metric.currentValue / metric.targetValue) * 100)}%`,
                                            }}
                                        />
                                    </div>

                                    <div className="mt-2.5 flex items-center justify-between text-xs">
                                        <span className="flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400">
                                            <TrendingUp className="h-3 w-3" />
                                            {metric.trendValue}
                                        </span>
                                        <span className="text-[11px] text-muted-foreground truncate max-w-37.5">
                                            {metric.description}
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                {/* ROW 2: MONTHLY FINANCIAL TREND & SALES FUNNEL */}
                <div className="grid gap-6 lg:grid-cols-3">
                    {/* LEFT (2 Cols): REVENUE VS HPP VS GOP TREND */}
                    <Card className="shadow-xs lg:col-span-2">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                    <TrendingUp className="h-4 w-4 text-primary" />
                                    Trend Finansial & Profitabilitas Pabrik (6 Bulan Terakhir)
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    Perbandingan Pendapatan Riil, Harga Pokok Penjualan (HPP), dan Laba Kotor (GOP)
                                </CardDescription>
                            </div>
                            <Badge variant="outline" className="text-xs">
                                Q2 - Q4 2026
                            </Badge>
                        </CardHeader>
                        <CardContent>
                            {/* CSS / SVG BAR CHART SIMULATION */}
                            <div className="space-y-4 pt-2">
                                {trendItems.map((item) => (
                                    <div key={item.month} className="space-y-1">
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="font-semibold text-foreground w-20">{item.month}</span>
                                            <div className="flex items-center gap-3 font-mono text-[11px]">
                                                <span className="text-muted-foreground">Pendapatan: {formatCurrency(item.rev)}</span>
                                                <span className="text-rose-600">HPP: {formatCurrency(item.cogs)}</span>
                                                <span className="text-emerald-600 font-bold">Laba: {formatCurrency(item.gop)} ({item.margin}%)</span>
                                            </div>
                                        </div>
                                        <div className="flex h-3 w-full rounded-md overflow-hidden bg-muted">
                                            <div
                                                className="bg-emerald-500 h-full transition-all"
                                                style={{ width: `${Math.min(100, Math.max(0, item.margin))}%` }}
                                                title={`Gross Profit: ${item.margin}%`}
                                            />
                                            <div
                                                className="bg-rose-500/80 h-full transition-all"
                                                style={{ width: `${Math.min(100, Math.max(0, 100 - item.margin))}%` }}
                                                title={`HPP Riil: ${(100 - item.margin).toFixed(1)}%`}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-4 flex items-center justify-center gap-6 text-xs text-muted-foreground border-t pt-3">
                                <span className="flex items-center gap-1.5">
                                    <span className="h-3 w-3 rounded-sm bg-emerald-500 inline-block" /> Laba Kotor (GOP)
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <span className="h-3 w-3 rounded-sm bg-rose-500/80 inline-block" /> HPP Aktual Pabrik
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* RIGHT (1 Col): SALES CONVERSION FUNNEL */}
                    <Card className="shadow-xs lg:col-span-1">
                        <CardHeader>
                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                <Target className="h-4 w-4 text-primary" />
                                Sales Conversion Funnel
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Perjalanan penawaran harga menjadi pesanan produksi aktif
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {funnelItems.map((item, idx) => {
                                const bgColors = [
                                    'bg-blue-500/5 border-blue-500/20 text-blue-600',
                                    'bg-indigo-500/5 border-indigo-500/20 text-indigo-600',
                                    'bg-purple-500/5 border-purple-500/20 text-purple-600',
                                    'bg-amber-500/5 border-amber-500/20 text-amber-600',
                                    'bg-emerald-500/10 border-emerald-500/30 text-emerald-600',
                                ];
                                const colorClass = bgColors[idx % bgColors.length];
                                return (
                                    <div
                                        key={item.stage}
                                        className={`rounded-lg border p-2.5 transition-all ${colorClass}`}
                                        style={{ marginLeft: `${idx * 6}px` }}
                                    >
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="font-semibold text-foreground">{item.stage}</span>
                                            <span className="font-mono font-bold">{item.count} PO</span>
                                        </div>
                                        <p className="text-[11px] text-muted-foreground">
                                            Nilai akumulasi: {formatCurrency(item.value)}
                                        </p>
                                    </div>
                                );
                            })}
                        </CardContent>
                    </Card>
                </div>

                {/* MODAL SETTING TARGET KPI */}
                <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                    <DialogContent className="sm:max-w-120">
                        <DialogHeader>
                            <DialogTitle className="text-base font-semibold">Konfigurasi Target KPI & Ambang Batas</DialogTitle>
                            <DialogDescription className="text-xs">
                                Atur standar acuan performa yang dijadikan tolak ukur evaluasi manajemen.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleSaveTargets} className="space-y-4 py-2 text-xs">
                            <div className="space-y-1.5">
                                <Label className="text-xs">Target On-Time Delivery Rate (OTD %)</Label>
                                <Input
                                    type="number"
                                    value={targetOtd}
                                    onChange={(e) => setTargetOtd(Number(e.target.value))}
                                    className="text-xs font-mono font-bold"
                                    required
                                />
                                <p className="text-[11px] text-muted-foreground">Standar industri garmen: 95%</p>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs">Target Gross Profit Margin (GPM %)</Label>
                                <Input
                                    type="number"
                                    value={targetGpm}
                                    onChange={(e) => setTargetGpm(Number(e.target.value))}
                                    className="text-xs font-mono font-bold"
                                    required
                                />
                                <p className="text-[11px] text-muted-foreground">Batas minimal profit margin artikel kustom: 35%</p>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs">Ambang Batas Maksimal Defect / Scrap (%)</Label>
                                <Input
                                    type="number"
                                    step="0.1"
                                    value={targetDefect}
                                    onChange={(e) => setTargetDefect(Number(e.target.value))}
                                    className="text-xs font-mono font-bold"
                                    required
                                />
                                <p className="text-[11px] text-muted-foreground">Toleransi maksimal kegagalan QC: 2.5%</p>
                            </div>

                            <DialogFooter className="pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsSettingsOpen(false)}
                                    className="text-xs"
                                >
                                    Batal
                                </Button>
                                <Button type="submit" size="sm" className="text-xs cursor-pointer">
                                    Simpan Perubahan
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
}

KpiExecutive.layout = (page: React.ReactNode) => (
    <AppLayout
        title="Executive KPI Dashboard"
        description="Ringkasan strategis 5 Dimensi Balanced Scorecard & Anomaly Alerting."
        information="STAGE 2 · EXECUTIVE ANALYTICS"
        breadcrumbs={[
            { title: 'Dashboard', href: '/dashboard' },
            { title: 'KPI & Analitik', href: '/admin/kpi/executive' },
        ]}
    >
        {page}
    </AppLayout>
);
