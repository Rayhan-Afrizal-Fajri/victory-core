import { Link } from '@inertiajs/react';
import {
    Activity,
    Award,
    BarChart3,
    Calendar,
    CheckCircle2,
    Gauge,
    Layers,
    Sparkles,
    TrendingUp,
    Truck,
    Users,
    AlertTriangle,
    SlidersHorizontal
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface KpiHeaderProps {
    activeTab: 'executive' | 'production' | 'commercial' | 'suppliers' | 'workers';
    period?: string;
    onPeriodChange?: (period: string) => void;
    onOpenSettings?: () => void;
}

export function KpiHeader({ activeTab, period = 'monthly', onPeriodChange, onOpenSettings }: KpiHeaderProps) {
    const tabs = [
        { id: 'executive', label: 'Executive Overview', href: '/admin/kpi/executive', icon: Gauge },
        { id: 'production', label: 'Produksi & QC', href: '/admin/kpi/production-qc', icon: Activity },
        { id: 'commercial', label: 'Komersial & Finansial', href: '/admin/kpi/commercial-financial', icon: TrendingUp },
        { id: 'suppliers', label: 'Supplier Scorecard', href: '/admin/kpi/suppliers', icon: Truck },
        { id: 'workers', label: 'Worker Leaderboard', href: '/admin/kpi/workers', icon: Users },
    ];

    return (
        <div className="space-y-4">
            {/* STAGE 2 BANNER */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/20 bg-linear-to-r from-primary/10 via-background to-primary/5 p-4 shadow-xs">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs">
                        <Gauge className="h-5 w-5" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-base font-bold text-foreground">Modul KPI & Analitik Kinerja (Stage 2)</h2>
                            <Badge variant="outline" className="border-primary/40 bg-primary/15 text-xs text-primary font-semibold">
                                Balanced Scorecard Engine
                            </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Pengukuran 5 Dimensi Kinerja Pabrik Konveksi: OTD, Kualitas, Finansial, Komersial & Supply Chain
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex items-center rounded-lg border bg-background/80 p-0.5 text-xs shadow-xs">
                        {['Harian', 'Mingguan', 'Bulanan', 'Q4 2026'].map((p, idx) => (
                            <button
                                key={p}
                                type="button"
                                onClick={() => onPeriodChange && onPeriodChange(p.toLowerCase())}
                                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                                    idx === 2
                                        ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                                        : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                {p}
                            </button>
                        ))}
                    </div>

                    {onOpenSettings && (
                        <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5 text-xs cursor-pointer"
                            onClick={onOpenSettings}
                        >
                            <SlidersHorizontal className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Target KPI</span>
                        </Button>
                    )}
                </div>
            </div>

            {/* TAB NAVIGATION */}
            <div className="flex items-center gap-1 overflow-x-auto border-b pb-2 pt-1 scrollbar-none">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <Link
                            key={tab.id}
                            href={tab.href}
                            className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-3.5 py-2 text-xs font-medium transition-all ${
                                isActive
                                    ? 'bg-primary text-primary-foreground shadow-xs'
                                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                            }`}
                        >
                            <Icon className="h-3.5 w-3.5" />
                            <span>{tab.label}</span>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
