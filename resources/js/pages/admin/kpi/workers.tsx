import React, { useState, useMemo } from 'react';
import { Head } from '@inertiajs/react';
import {
    Users,
    Award,
    CheckCircle2,
    Clock,
    DollarSign,
    Scissors,
    Shirt,
    ShieldCheck,
    Search,
    Download,
    TrendingUp,
    Medal
} from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { formatCurrency } from '@/helpers/format';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { KpiHeader } from './components/kpi-header';
import { mockWorkerLeaderboard, WorkerLeaderboardItem } from './data/kpi-mock';
import { toast } from 'sonner';

interface WorkerProps {
    workers?: any[];
}

export default function KpiWorkers({ workers: propWorkers }: WorkerProps) {
    const [period, setPeriod] = useState('weekly');
    const [searchTerm, setSearchTerm] = useState('');

    const workerList = useMemo(() => {
        if (propWorkers && propWorkers.length > 0) {
            return propWorkers.map((w, idx) => ({
                id: w.id,
                rank: w.rank || (idx + 1),
                name: w.name,
                role: w.role || 'Operator Jahit & Finishing',
                workCenter: w.workCenter || (idx % 2 === 0 ? 'Sewing Line 1' : 'Cutting & Assembly'),
                completedPcs: w.totalCompletedPcs || w.completedPcs || 0,
                defectContributionPct: w.defectSharePct || w.defectContributionPct || 0.4,
                punctualityScore: w.punctualityScore || 98,
                accumulatedWage: w.accumulatedWage || ((w.totalCompletedPcs || w.completedPcs || 0) * 1500),
                badge: w.badge || (idx === 0 ? 'Top Performer' : (idx < 3 ? 'Star Worker' : 'Standar Baik')),
            }));
        }
        return mockWorkerLeaderboard;
    }, [propWorkers]);

    const filteredWorkers = workerList.filter((w: any) =>
        w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.workCenter.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.role.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalOutputPcs = useMemo(() => {
        return workerList.reduce((a: number, c: any) => a + (c.completedPcs || 0), 0);
    }, [workerList]);

    const totalWage = useMemo(() => {
        return workerList.reduce((a: number, c: any) => a + (c.accumulatedWage || 0), 0);
    }, [workerList]);

    const avgDefect = useMemo(() => {
        if (!workerList.length) return '0.26';
        const total = workerList.reduce((a: number, c: any) => a + (c.defectContributionPct || 0), 0);
        return (total / workerList.length).toFixed(2);
    }, [workerList]);

    return (
        <>
            <Head title="Worker Productivity & QC Leaderboard - Stage 2" />

            <div className="space-y-6">
                <KpiHeader activeTab="workers" period={period} onPeriodChange={setPeriod} />

                {/* SUMMARY STATS */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Card className="border-l-4 border-l-blue-500 shadow-xs">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs text-muted-foreground font-medium">Total Output Pekerja (Bulan Ini)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold font-mono text-foreground">
                                {totalOutputPcs.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">Pcs</span>
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Dari seluruh stasiun kerja pabrik
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-emerald-500 shadow-xs">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs text-muted-foreground font-medium">Total Akumulasi Upah Borongan</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold font-mono text-emerald-600">
                                {formatCurrency(totalWage)}
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Berdasarkan output terekam di Shopfloor
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-amber-500 shadow-xs">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs text-muted-foreground font-medium">Rata-rata Skor Disiplin Jam Kerja</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold font-mono text-amber-600">
                                98.2%
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Akurasi mulai & selesai proses kerja
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-purple-500 shadow-xs">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs text-muted-foreground font-medium">Rata-rata Tingkat Cacat Operator</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold font-mono text-purple-600">
                                {avgDefect}%
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Standar keahlian & ketelitian sangat tinggi
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* SEARCH & FILTERS */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Cari nama operator, stasiun kerja, posisi..."
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
                            onClick={() => {
                                window.open('/admin/kpi/workers/export/slip', '_blank');
                                toast.success('Mengunduh Rekap Slip Gaji Borongan Mingguan (PDF)...');
                            }}
                        >
                            <Download className="h-3.5 w-3.5" />
                            <span>Export Slip Borongan</span>
                        </Button>
                    </div>
                </div>

                {/* WORKER LEADERBOARD TABLE */}
                <Card className="shadow-xs">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                    <Medal className="h-4 w-4 text-amber-500" />
                                    Papan Peringkat Produktivitas & Kualitas Operator Pabrik
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    Dasar obyektif bagi manajemen untuk perhitungan insentif bonus produktivitas dan pembinaan operator
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto rounded-lg border">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-muted/60 text-muted-foreground font-medium border-b text-[11px]">
                                    <tr>
                                        <th className="p-3 w-15 text-center">Rank</th>
                                        <th className="p-3">Nama Operator & Peran</th>
                                        <th className="p-3">Stasiun Kerja</th>
                                        <th className="p-3 text-right">Output Selesai</th>
                                        <th className="p-3 text-right">Kontribusi Cacat (%)</th>
                                        <th className="p-3 text-right">Skor Disiplin</th>
                                        <th className="p-3 text-right font-bold">Akumulasi Hak Borongan</th>
                                        <th className="p-3 text-center">Apresiasi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {filteredWorkers.map((w: any) => (
                                        <tr key={w.id} className="hover:bg-muted/20 transition-colors">
                                            <td className="p-3 text-center font-bold">
                                                {w.rank === 1 ? (
                                                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-white font-bold text-xs mx-auto shadow-xs">
                                                        1
                                                    </span>
                                                ) : w.rank === 2 ? (
                                                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-400 text-white font-bold text-xs mx-auto">
                                                        2
                                                    </span>
                                                ) : w.rank === 3 ? (
                                                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-700 text-white font-bold text-xs mx-auto">
                                                        3
                                                    </span>
                                                ) : (
                                                    <span className="text-muted-foreground font-mono">#{w.rank}</span>
                                                )}
                                            </td>
                                            <td className="p-3">
                                                <span className="font-semibold text-foreground block">{w.name}</span>
                                                <span className="text-[11px] text-muted-foreground">{w.role}</span>
                                            </td>
                                            <td className="p-3">
                                                <Badge variant="outline" className="text-[10px]">
                                                    {w.workCenter}
                                                </Badge>
                                            </td>
                                            <td className="p-3 text-right font-mono font-bold text-foreground">
                                                {Number(w.completedPcs).toLocaleString()} pcs
                                            </td>
                                            <td className="p-3 text-right font-mono text-emerald-600 font-medium">
                                                {w.defectContributionPct}%
                                            </td>
                                            <td className="p-3 text-right font-mono font-medium text-foreground">
                                                {w.punctualityScore}%
                                            </td>
                                            <td className="p-3 text-right font-mono font-bold text-foreground">
                                                {formatCurrency(w.accumulatedWage)}
                                            </td>
                                            <td className="p-3 text-center">
                                                {w.rank <= 3 ? (
                                                    <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 text-[10px] font-semibold">
                                                        Top Performer ⭐
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="secondary" className="text-[10px]">
                                                        Standar Baik
                                                    </Badge>
                                                )}
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

KpiWorkers.layout = (page: React.ReactNode) => (
    <AppLayout
        title="Worker Productivity & QC Leaderboard"
        description="Papan peringkat kinerja operator jahit, potong & finishing lantai pabrik."
        information="STAGE 2 · SHOPFLOOR HUMAN CAPITAL"
        breadcrumbs={[
            { title: 'Dashboard', href: '/dashboard' },
            { title: 'KPI & Analitik', href: '/admin/kpi/executive' },
            { title: 'Worker Leaderboard', href: '/admin/kpi/workers' },
        ]}
    >
        {page}
    </AppLayout>
);