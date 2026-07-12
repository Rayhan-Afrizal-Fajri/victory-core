import { Head, Link } from '@inertiajs/react';
import { AlertTriangle, CalendarDays, Eye } from 'lucide-react';
import { useMemo } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { useCan } from '@/hooks/use-can';

type KanbanColumn = {
    id: string;
    name: string;
    bgColor: string;
    borderColor: string;
};

type RunProgress = {
    type: 'sample' | 'production';
    status: string;
    quantity: number;
    completed: number;
    total: number;
    percent: number;
};

type KanbanCard = {
    id: number;
    jobNo: string;
    product: string;
    customer: string;
    qty: number;
    deadline?: string | null;
    daysLeft?: number | null;
    stage: string;
    stageLabel: string;
    progress: number;
    blocker?: string | null;
    sampleProgress?: RunProgress | null;
    productionProgress?: RunProgress | null;
    showUrl: string;
};

type PageProps = {
    cards: KanbanCard[];
    columns: KanbanColumn[];
};

function getDeadlineText(daysLeft?: number | null) {
    if (daysLeft === null || daysLeft === undefined) {
        return 'No deadline';
    }

    if (daysLeft < 0) {
        return `Lewat ${Math.abs(daysLeft)} hari`;
    }

    if (daysLeft === 0) {
        return 'Hari ini';
    }

    return `${daysLeft} hari`;
}

function getDeadlineClass(daysLeft?: number | null) {
    if (daysLeft === null || daysLeft === undefined) {
        return 'text-slate-500 bg-slate-100';
    }

    if (daysLeft < 0) {
        return 'text-red-700 bg-red-100';
    }

    if (daysLeft <= 3) {
        return 'text-orange-700 bg-orange-100';
    }

    return 'text-emerald-700 bg-emerald-100';
}

function getProgressColor(progress: number) {
    if (progress >= 100) return 'bg-emerald-500';
    if (progress >= 70) return 'bg-green-500';
    if (progress >= 40) return 'bg-amber-500';

    return 'bg-blue-500';
}

function KanbanJobCard({ card }: { card: KanbanCard }) {
    const can = useCan();

    const activeRun =
        card.stage === 'sample_production'
            ? card.sampleProgress
            : card.stage === 'production'
              ? card.productionProgress
              : null;

    return (
        <div className="rounded-xl border-l-4 border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
            <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                    <h4 className="font-semibold text-slate-900">
                        {card.jobNo}
                    </h4>

                    <p className="mt-1 text-xs text-slate-500">
                        {card.customer}
                    </p>
                </div>

                <Badge className="bg-slate-100 text-slate-700">
                    {card.stageLabel}
                </Badge>
            </div>

            <p className="text-sm font-medium text-slate-800">
                {card.product}
            </p>

            <p className="mt-1 text-xs text-slate-500">
                Qty: {card.qty} pcs
            </p>

            <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Progress</span>
                    <span className="font-semibold text-slate-800">
                        {card.progress}%
                    </span>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                        className={`h-full rounded-full transition-all ${getProgressColor(card.progress)}`}
                        style={{ width: `${card.progress}%` }}
                    />
                </div>
            </div>

            {activeRun && (
                <div className="mt-4 rounded-lg border bg-slate-50 p-3">
                    <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-700">
                            {activeRun.type === 'sample' ? 'Sample' : 'Production'} Run
                        </span>
                        <span className="text-slate-500">
                            {activeRun.completed}/{activeRun.total}
                        </span>
                    </div>

                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
                        <div
                            className="h-full rounded-full bg-emerald-500"
                            style={{ width: `${activeRun.percent}%` }}
                        />
                    </div>

                    <p className="mt-2 text-[11px] text-slate-500">
                        Status: {activeRun.status} · Qty: {activeRun.quantity}
                    </p>
                </div>
            )}

            {card.blocker && card.stage !== 'done' && (
                <div className="mt-4 flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-2 text-xs text-amber-700">
                    <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                    <span>{card.blocker}</span>
                </div>
            )}

            <div className="mt-4 flex items-center justify-between gap-3">
                <div
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${getDeadlineClass(card.daysLeft)}`}
                >
                    <CalendarDays className="size-3" />
                    {getDeadlineText(card.daysLeft)}
                </div>

                {can('dashboard.admin') && (
                    <Link href={card.showUrl}>
                        <Button size="sm" variant="outline">
                            <Eye className="size-4" />
                            Detail
                        </Button>
                    </Link>
                )}
            </div>
        </div>
    );
}

    function KanbanColumnView({
        column,
        cards,
    }: {
        column: KanbanColumn;
        cards: KanbanCard[];
    }) {
        return (
            <div className={`flex min-h-105 flex-col rounded-xl border ${column.bgColor} p-4`}>
                <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-sm font-bold tracking-wide text-slate-900">
                        {column.name}
                    </h3>

                    <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-white px-2 text-xs font-bold text-slate-700 shadow-sm">
                        {cards.length}
                    </span>
                </div>

                <div className="flex-1 space-y-3">
                    {cards.length > 0 ? (
                        cards.map((card) => (
                            <KanbanJobCard key={card.id} card={card} />
                        ))
                    ) : (
                        <div className="flex h-28 items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-white/60 text-center">
                            <p className="text-sm text-slate-500">
                                Tidak ada purchase order
                            </p>
                        </div>
                    )}
                </div>
            </div>
        );
    }

export default function Index({
    cards = [],
    columns = [],
}: PageProps) {
    const cardsByStage = useMemo(() => {
        const grouped: Record<string, KanbanCard[]> = {};

        columns.forEach((column) => {
            grouped[column.id] = cards.filter((card) => {
                return card.stage === column.id;
            });
        });

        return grouped;
    }, [cards, columns]);

    return (
        <>
            <Head title="Kanban Board" />

            <div className="space-y-6">

                <div className="overflow-x-auto pb-2">
                    <div className="flex gap-4 w-max">
                        {columns.map(column => (
                            <div key={column.id} className="w-80 shrink-0">
                                <KanbanColumnView
                                    column={column}
                                    cards={cardsByStage[column.id] || []}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
}

Index.layout = (page: React.ReactNode) => (
    <AppLayout
        title="Kanban Board"
        description="Monitoring visual untuk briefing harian. Setiap card menunjukkan posisi purchase order berdasarkan workflow terbaru, tanpa aksi pindah status manual."
        information="MONITORING PURCHASE ORDER"
    >
        {page}
    </AppLayout>
);