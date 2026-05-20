import { Head } from '@inertiajs/react';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';

type KanbanStatus = {
    id: string;
    name: string;
    color: string;
    bgColor: string;
    borderColor: string;
    count: number;
};

type KanbanCard = {
    id: string;
    jobNo: string;
    product: string;
    customer: string;
    qty: number;
    qtyCompleted: number;
    price: number;
    deadline: string;
    daysLeft: number;
    status: string;
};

// Dynamic statuses
const STATUSES: KanbanStatus[] = [
    {
        id: 'penawaran',
        name: 'PENAWARAN',
        color: 'border-slate-400',
        bgColor: 'bg-slate-50',
        borderColor: 'border-l-slate-400',
        count: 0,
    },
    {
        id: 'sample',
        name: 'SAMPLE',
        color: 'border-yellow-400',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-l-yellow-400',
        count: 0,
    },
    {
        id: 'produksi',
        name: 'PRODUKSI',
        color: 'border-blue-400',
        bgColor: 'bg-blue-50',
        borderColor: 'border-l-blue-400',
        count: 0,
    },
    {
        id: 'done',
        name: 'DONE',
        color: 'border-green-400',
        bgColor: 'bg-green-50',
        borderColor: 'border-l-green-400',
        count: 0,
    },
];

// Sample data based on Pesanan model
const SAMPLE_DATA: KanbanCard[] = [
    {
        id: 'vl-2026-004',
        jobNo: 'VL-2026-004',
        product: 'Jaket Almamater',
        customer: 'SMA Negeri 5',
        qty: 350,
        qtyCompleted: 70,
        price: 245000,
        deadline: '2026-06-15',
        daysLeft: 30,
        status: 'penawaran',
    },
    {
        id: 'vl-2026-003',
        jobNo: 'VL-2026-003',
        product: 'T-Shirt Cotton Combed 30s',
        customer: 'Startup Kopi Nusa',
        qty: 200,
        qtyCompleted: 40,
        price: 89000,
        deadline: '2026-06-03',
        daysLeft: 18,
        status: 'sample',
    },
    {
        id: 'vl-2026-001',
        jobNo: 'VL-2026-001',
        product: 'Kemeja Seragam Kantor',
        customer: 'PT Sinar Mandiri',
        qty: 120,
        qtyCompleted: 72,
        price: 185000,
        deadline: '2026-05-27',
        daysLeft: 11,
        status: 'produksi',
    },
    {
        id: 'vl-2026-002',
        jobNo: 'VL-2026-002',
        product: 'Jersey Running Sublim',
        customer: 'Komunitas Lari Bandung',
        qty: 75,
        qtyCompleted: 60,
        price: 135000,
        deadline: '2026-05-19',
        daysLeft: 3,
        status: 'produksi',
    },
    {
        id: 'vl-2026-005',
        jobNo: 'VL-2026-005',
        product: 'Polo Shirt Lacoste CVC',
        customer: 'Event Organizer Bali Fest',
        qty: 60,
        qtyCompleted: 60,
        price: 125000,
        deadline: '2026-05-16',
        daysLeft: -5,
        status: 'done',
    },
    {
        id: 'vl-2026-006',
        jobNo: 'VL-2026-006',
        product: 'Hoodie Premium Cotton',
        customer: 'Kolaboratif Bandung',
        qty: 150,
        qtyCompleted: 0,
        price: 220000,
        deadline: '2026-06-20',
        daysLeft: 35,
        status: 'penawaran',
    },
];

function formatIDR(value: number) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(value);
}

function getDeadlineColor(daysLeft: number) {
    if (daysLeft < 0) {
return 'text-red-600';
}

    if (daysLeft < 5) {
return 'text-orange-600';
}

    return 'text-green-600';
}

function getProgressColor(percentage: number) {
    if (percentage >= 100) {
return 'bg-green-500';
}

    if (percentage >= 75) {
return 'bg-blue-500';
}

    if (percentage >= 50) {
return 'bg-yellow-500';
}

    return 'bg-red-500';
}

function KanbanCard({
    card,
    onStatusChange,
}: {
    card: KanbanCard;
    onStatusChange: (cardId: string, newStatus: string) => void;
}) {
    const percentage = Math.round((card.qtyCompleted / card.qty) * 100);
    const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('cardId', card.id);
    };

    const currentIndex = STATUSES.findIndex(
        (s) => s.id === card.status
    );

    const prevStatus =
        currentIndex > 0
            ? STATUSES[currentIndex - 1]
            : null;

    const nextStatus =
        currentIndex < STATUSES.length - 1
            ? STATUSES[currentIndex + 1]
            : null;

    return (
        <div
            draggable
            onDragStart={handleDragStart}
            className="cursor-grab rounded-sm border-l-4 border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md active:cursor-grabbing"
        >
            <div className="mb-2 flex items-start justify-between">
                <h4 className="font-semibold text-slate-900">{card.jobNo}</h4>
                <button className="text-slate-400 hover:text-slate-600">
                    ⋮
                </button>
            </div>

            <p className="mb-1 text-sm font-medium text-slate-700">
                {card.product}
            </p>
            <p className="mb-3 text-xs text-slate-500">
                📍 {card.customer}
            </p>

            <div className="mb-3 space-y-2">
                <div className="flex justify-between text-xs">
                    <span className="text-slate-600">
                        {card.qtyCompleted} / {card.qty} pcs
                    </span>
                    <span className="font-semibold text-slate-900">
                        {percentage}%
                    </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
                    <div
                        className={`h-full transition-all ${getProgressColor(percentage)}`}
                        style={{ width: `${percentage}%` }}
                    />
                </div>
            </div>

            <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-900">
                    {formatIDR(card.price)}
                </span>
            </div>

            <div className="flex items-center justify-between">
                <div
                    className={`rounded px-2 py-1 text-center text-xs font-semibold ${getDeadlineColor(card.daysLeft)}`}
                >
                    {card.daysLeft < 0 ? (
                        <span className="text-red-600">
                            Lewat {Math.abs(card.daysLeft)}h
                        </span>
                    ) : (
                        <span>{card.daysLeft} hari</span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        size="icon"
                        variant="ghost"
                        disabled={!prevStatus}
                        onClick={() =>
                            prevStatus &&
                            onStatusChange(card.id, prevStatus.id)
                        }
                        className="h-7 w-7 p-2 border border-slate-300"
                    >
                        <ChevronLeftIcon className="h-4 w-4" />
                    </Button>

                    <Button
                        size="icon"
                        variant="ghost"
                        disabled={!nextStatus}
                        onClick={() =>
                            nextStatus &&
                            onStatusChange(card.id, nextStatus.id)
                        }
                        className="h-7 w-7 p-2 border border-slate-300"
                    >
                        <ChevronRightIcon className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}

function KanbanColumn({
    status,
    cards,
    onStatusChange,
}: {
    status: KanbanStatus;
    cards: KanbanCard[];
    onStatusChange: (cardId: string, newStatus: string) => void;
}) {
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const cardId = e.dataTransfer.getData('cardId');
        onStatusChange(cardId, status.id);
    };
    

    return (
        <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className="flex flex-col rounded-sm bg-slate-100 p-4"
        >
            <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold text-slate-900">
                    {status.name}
                </h3>
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-700">
                    {cards.length}
                </span>
            </div>

            <div className="space-y-3 flex-1">
                {cards.length > 0 ? (
                    cards.map((card) => (
                        <KanbanCard
                            key={card.id}
                            card={card}
                            onStatusChange={onStatusChange}
                        />
                    ))
                ) : (
                    <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-slate-300 py-8 text-center">
                        <p className="text-sm text-slate-500">
                            Tidak ada data
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function Index() {
    const [cards, setCards] = useState<KanbanCard[]>(SAMPLE_DATA);
    const handleStatusChange = (
        cardId: string,
        newStatus: string
    ) => {
        const card = cards.find((c) => c.id === cardId);

        if (card && card.status !== newStatus) {
            setCards((prevCards) =>
                prevCards.map((c) =>
                    c.id === cardId
                        ? { ...c, status: newStatus }
                        : c
                )
            );

            toast.success('Status Updated', {
                description: `${card.jobNo} moved to ${newStatus.toUpperCase()}`,
            });
        }
    };

    const cardsByStatus = useMemo(() => {
        const grouped: Record<string, KanbanCard[]> = {};
        STATUSES.forEach((status) => {
            grouped[status.id] = cards.filter((c) => c.status === status.id);
        });

        return grouped;
    }, [cards]);

    return (
        <>
            <Head title="Kanban Board" />
            <div className="space-y-6">

                <div className="grid grid-cols-1 gap-4 overflow-x-auto md:grid-cols-2 lg:grid-cols-4">
                    {STATUSES.map((status) => (
                        <KanbanColumn
                            key={status.id}
                            status={status}
                            cards={cardsByStatus[status.id]}
                            onStatusChange={handleStatusChange}
                        />
                    ))}
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-6">
                    <h3 className="mb-4 font-semibold text-slate-900">
                        Kontrol Keyboard
                    </h3>
                    <div className="space-y-2 text-sm text-slate-600">
                        <p>• Drag & Drop: Pindahkan kartu ke kolom status lain</p>
                        <p>• Tombol Next/Prev: Navigasi data dalam status</p>
                        <p>• Hover: Lihat preview detail kartu</p>
                    </div>
                </div>
            </div>
        </>
    );
}

Index.layout = (page: React.ReactNode) => (
    <AppLayout
        title="Kanban Board"
        description="Drag-and-drop card antar kolom, atau gunakan tombol panah untuk pindah status."
        information="PRODUCTION PIPELINE"
    >
        {page}
    </AppLayout>
)
