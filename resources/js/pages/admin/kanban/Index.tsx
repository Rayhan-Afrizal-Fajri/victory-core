import { Head, Link } from '@inertiajs/react';
import { AlertTriangle, Building2, Calendar, CalendarDays, Eye, FileSpreadsheet, PackageX } from 'lucide-react';
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

type ProcessDetail = {
    id: string;
    work_name: string;
    status: string;
    qc_status: string;
    target_qty: number;
    checked_qty: number;
    passed_qty: number;
    defect_qty: number;
}

type RunProgress = {
    type: 'sample' | 'production';
    status: string;
    quantity: number;
    completed: number;
    total: number;
    percent: number;
    process_details: ProcessDetail[];
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
    urgentIssues: any[]; // Add this line
};

type HandleExportProps = {
    type: number;
    param: string;
}

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

            {/* Rincian Proses Produksi (Cutting, Sewing, dll) */}
            {activeRun?.process_details && activeRun?.process_details.length > 0 && (
                <div className="mt-3 space-y-2 border-t border-slate-200 pt-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Rincian QC & Proses
                    </p>
                    
                    {activeRun?.process_details.map((process: any) => (
                        <div 
                            key={process.id} 
                            className="rounded border border-slate-100 bg-white p-2 text-[11px] shadow-sm"
                        >
                            <div className="mb-1 flex items-center justify-between font-medium text-slate-700">
                                <span>{process.work_name}</span>
                                <span className="font-normal text-slate-400">
                                    Target: {process.target_qty}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-slate-500">
                                    Cek: <span className="font-semibold text-slate-700">{process.checked_qty}</span>
                                </span>
                                <span className="text-emerald-600">
                                    Lolos: <span className="font-semibold">{process.passed_qty}</span>
                                </span>
                                <span className="text-rose-500">
                                    Cacat: <span className="font-semibold">{process.defect_qty}</span>
                                </span>
                            </div>
                        </div>
                    ))}
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
    urgentIssues = [],
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
    
    // React Component
    const handleExport = ({type, param = ''}: HandleExportProps) => {
        // Cara paling mudah untuk download file tanpa ribet urus Blob axios
        const url = `/export/purchasing?type=${type}&param=${param}`;
        window.location.href = url;
    };


    return (
        <>
            <Head title="Kanban Board" />

            <div className="space-y-6 flex flex-col overflow-hidden bg-gray-50 p-4">

                {/* --- MULAI SECTION URGENT ISSUES (NEW UI) --- */}
                {urgentIssues && urgentIssues.length > 0 && (
                    <div className="mb-6 bg-white border border-red-200 rounded-lg shadow-sm overflow-hidden flex-shrink-0">
                        {/* Header Banner */}
                        <div className="bg-red-50/80 border-b border-red-100 px-4 py-3 flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-red-600 animate-pulse" />
                            <h2 className="text-sm font-bold text-red-800 uppercase tracking-wider">
                                Urgent Briefing: Material Bermasalah
                            </h2>
                            <span className="ml-auto bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                {urgentIssues.length} Kasus
                            </span>
                        </div>

                        {/* List Content */}
                        <div className="divide-y divide-slate-100 max-h-75 overflow-y-auto custom-scrollbar">
                            {urgentIssues.map((order) => (
                                <div key={order.id} className="flex flex-col md:flex-row p-4 hover:bg-slate-50 transition-colors">
                                    
                                    {/* Info Pesanan (Sebelah Kiri) */}
                                    <div className="md:w-1/4 mb-3 md:mb-0 md:pr-4">
                                        <Link 
                                            href={order.showUrl} 
                                            className="font-bold text-blue-600 hover:text-blue-800 hover:underline text-sm"
                                        >
                                            {order.jobNo}
                                        </Link>
                                        <p className="text-sm font-medium text-slate-800 mt-1">{order.customer}</p>
                                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{order.product}</p>
                                    </div>

                                    {/* Detail Item Cacat (Sebelah Kanan) */}
                                    <div className="md:w-3/4 flex flex-col gap-2">
                                        {order.issues.map((issue, idx) => (
                                            <div 
                                                key={issue.id} 
                                                className="flex flex-wrap md:flex-nowrap items-start justify-between bg-white border border-red-100 p-3 rounded-md shadow-sm gap-4 relative overflow-hidden"
                                            >
                                                {/* Efek Garis Merah di Kiri */}
                                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500"></div>
                                                
                                                <div className="pl-2">
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-sm font-bold text-slate-800">
                                                            {issue.title} {/* Diubah dari issue.item_bahan */}
                                                        </p>
                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider bg-red-100 text-red-700`}>
                                                            {issue.condition === 'damaged_issue' ? 'Damaged' : issue.condition}
                                                        </span>
                                                    </div>
                                                    
                                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-slate-600">
                                                        <div className="flex items-center gap-1">
                                                            <Building2 className="w-3.5 h-3.5 text-slate-400" />
                                                            <span>{issue.subtitle}</span> {/* Diubah dari issue.supplier */}
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                                            <span>Status: {issue.date}</span> {/* Diubah dari issue.received_at */}
                                                        </div>
                                                    </div>

                                                    {issue.notes && (
                                                        <p className="text-xs text-red-600 font-medium italic mt-2 bg-red-50 inline-block px-2 py-1 rounded">
                                                            Catatan: "{issue.notes}"
                                                        </p>
                                                    )}
                                                </div>

                                                <div className="text-right flex flex-row md:flex-col items-center md:items-end gap-2 md:gap-0 pl-2 md:pl-0 w-full md:w-auto border-t md:border-t-0 pt-2 md:pt-0 mt-2 md:mt-0 border-slate-100">
                                                    <p className="text-xs text-slate-500 font-medium hidden md:block">Qty Bermasalah</p>
                                                    <div className="flex items-center gap-1 text-red-600 font-bold text-lg md:mt-1">
                                                        <PackageX className="w-4 h-4 md:hidden" />
                                                        {issue.qty} <span className="text-sm font-medium">{issue.satuan}</span> {/* Diubah dari issue.received_qty */}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                {/* --- SELESAI SECTION URGENT ISSUES --- */}

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

Index.layout = (page: React.ReactNode) => {
    // React Component
    const handleExport = (type, param = '') => {
        // Cara paling mudah untuk download file tanpa ribet urus Blob axios
        const url = `/export/purchasing?type=${type}&param=${param}`;
        window.location.href = url;
    };
    return (
        <AppLayout
            title="Kanban Board"
            description="Monitoring visual untuk briefing harian. Setiap card menunjukkan posisi purchase order berdasarkan workflow terbaru, tanpa aksi pindah status manual."
            information="MONITORING PURCHASE ORDER"
            breadcrumbs={[
                {
                    title: 'Kanban Board',
                    href: '',
                },
            ]}
            actions={
                <>
                    <Button
                        onClick={() => handleExport(4)}
                        className="gap-2 bg-emerald-600 hover:bg-emerald-700 cursor-pointer"
                    >
                        <FileSpreadsheet className="h-4 w-4" />
                        Export Purchasing
                    </Button>
                </>
            }
        >
            {page}
        </AppLayout>
    )
};