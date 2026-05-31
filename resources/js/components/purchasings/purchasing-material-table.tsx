import {
    CheckCircle2,
    Edit,
    PackageCheck,
    PlusCircle,
    Trash2,
} from 'lucide-react';

import SectionCard from '@/pages/admin/job-tickets/components/SectionCard';
import Badge from '@/components/sample/badge';
import EmptyState from '@/components/sample/empty-state';
import formatRupiah from '@/components/ui/format-rupiah';
import { Button } from '@/components/ui/button';

import {
    canDeletePurchasing,
    canEditPurchasing,
    canMarkOrdered,
    canReceiveMaterial,
    getPurchasingStatusLabel,
    getReceivedQty,
    getReceivingProgress,
    getRemainingQty,
    getReceivings,
    purchasingStatusClass,
    getSupplierName,
} from './purchasing-utils';
import { formatCurrency, formatDecimal } from '@/helpers/format';

const PurchasingMaterialTable = ({
    purchasings,
    onCreate,
    onEditPo,
    onEditManual,
    onDelete,
    onMarkOrdered,
    onReceive,
    onDeleteReceiving,
}: {
    purchasings: any[];
    onCreate: () => void;
    onEditPo: (purchasing: any) => void;
    onEditManual: (purchasing: any) => void;
    onDelete: (purchasing: any) => void;
    onMarkOrdered: (purchasing: any) => void;
    onReceive: (purchasing: any) => void;
    onDeleteReceiving: (receiving: any) => void;
}) => {
    return (
        <SectionCard title="Daftar Material">
            <div className="mb-4 flex justify-end">
                <Button type="button" onClick={onCreate}>
                    <PlusCircle className="size-4" />
                    Tambah Item Manual
                </Button>
            </div>

            {purchasings.length === 0 ? (
                <EmptyState
                    icon={<PackageCheck className="size-5" />}
                    title="Belum ada material"
                    description="Tambahkan daftar bahan yang perlu dibeli untuk produksi."
                />
            ) : (
                <div className="space-y-4">
                    {purchasings.map((item) => {
                        const receivedQty = getReceivedQty(item);
                        const remainingQty = getRemainingQty(item);
                        const progress = getReceivingProgress(item);
                        const receivings = getReceivings(item);
                        const isGeneratedFromBom = Boolean(item.pesanan_material_spec_id);

                        return (
                            <div key={item.id} className="rounded-2xl border bg-white p-4">
                                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <p className="font-semibold text-slate-900">
                                                {item.item}
                                            </p>

                                            <Badge
                                                className={
                                                    purchasingStatusClass[item.status] ||
                                                    'bg-slate-100 text-slate-700 border-slate-200'
                                                }
                                            >
                                                {getPurchasingStatusLabel(item.status)}
                                            </Badge>
                                            <Badge
                                                className={
                                                    isGeneratedFromBom
                                                        ? 'border-blue-200 bg-blue-100 text-blue-700'
                                                        : 'border-slate-200 bg-slate-100 text-slate-700'
                                                }
                                            >
                                                {isGeneratedFromBom ? 'BOM' : 'Manual'}
                                            </Badge>
                                        </div>

                                        <p className="mt-1 text-xs text-slate-500">
                                            Supplier: {getSupplierName(item)}
                                        </p>

                                        <p className="mt-1 text-xs text-slate-500">
                                            Tgl pembelian: {item.tgl_pembelian || '-'}
                                        </p>
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                        {canEditPurchasing(item) && (
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="outline"
                                                onClick={() => {
                                                    if (isGeneratedFromBom) {
                                                        onEditPo(item);
                                                        return;
                                                    }

                                                    onEditManual(item);
                                                }}
                                            >
                                                <Edit className="size-4" />
                                                {isGeneratedFromBom ? 'Edit PO' : 'Edit Manual'}
                                            </Button>
                                        )}

                                        {canDeletePurchasing(item) && (
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="outline"
                                                className="border-red-200 text-red-700 hover:bg-red-50"
                                                onClick={() => onDelete(item)}
                                            >
                                                <Trash2 className="size-4" />
                                                Delete
                                            </Button>
                                        )}

                                        {canMarkOrdered(item) && (
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="secondary"
                                                onClick={() => onMarkOrdered(item)}
                                            >
                                                <CheckCircle2 className="size-4" />
                                                Mark Ordered
                                            </Button>
                                        )}

                                        {canReceiveMaterial(item) && (
                                            <Button
                                                type="button"
                                                size="sm"
                                                onClick={() => onReceive(item)}
                                            >
                                                <PackageCheck className="size-4" />
                                                Receive
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-4 grid gap-3 md:grid-cols-6">
                                    <InfoBox
                                        label="Required"
                                        value={`${formatDecimal(item.required_qty || item.ordered_qty || 0)} ${item.unit || ''}`}
                                    />

                                    <InfoBox
                                        label="Stock"
                                        value={`${formatDecimal(item.stock_qty || 0)} ${item.unit || ''}`}
                                    />

                                    <InfoBox
                                        label="Purchase"
                                        value={`${formatDecimal(item.purchase_qty || item.ordered_qty || 0)} ${item.unit || ''}`}
                                    />

                                    <InfoBox
                                        label="Leftover"
                                        value={`${formatDecimal(item.leftover_qty || 0)} ${item.unit || ''}`}
                                    />

                                    <InfoBox
                                        label="Received"
                                        value={`${formatDecimal(receivedQty)} ${item.unit || ''}`}
                                    />

                                    <InfoBox
                                        label="Total"
                                        value={formatCurrency(item.total_harga || 0)}
                                    />
                                </div>

                                <div className="mt-4">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-slate-500">Progress Receiving</span>
                                        <span className="font-medium">{Math.round(progress)}%</span>
                                    </div>

                                    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                                        <div
                                            className="h-full rounded-full bg-green-500"
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                </div>

                                {receivings.length > 0 && (
                                    <div className="mt-4 rounded-xl border bg-slate-50 p-3">
                                        <p className="mb-2 text-xs font-semibold uppercase text-slate-500">
                                            Riwayat Receiving
                                        </p>

                                        <div className="space-y-2">
                                            {receivings.map((receiving: any) => (
                                                <div
                                                    key={receiving.id}
                                                    className="flex items-start justify-between gap-3 rounded-lg bg-white p-3 text-sm"
                                                >
                                                    <div>
                                                        <p className="font-semibold text-slate-900">
                                                            {receiving.received_qty} {item.satuan}
                                                        </p>
                                                        <p className="mt-1 text-xs text-slate-500">
                                                            {receiving.received_at || '-'} • Checked by:{' '}
                                                            {receiving.checked_by?.name || '-'}
                                                        </p>

                                                        {receiving.notes && (
                                                            <p className="mt-1 text-xs text-slate-600">
                                                                {receiving.notes}
                                                            </p>
                                                        )}
                                                    </div>

                                                    {item.status !== 'received' && (
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            variant="outline"
                                                            className="border-red-200 text-red-700 hover:bg-red-50"
                                                            onClick={() => onDeleteReceiving(receiving)}
                                                        >
                                                            <Trash2 className="size-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </SectionCard>
    );
};

function InfoBox({
    label,
    value,
    danger = false,
}: {
    label: string;
    value: React.ReactNode;
    danger?: boolean;
}) {
    return (
        <div className="rounded-xl border bg-slate-50 p-3">
            <p className="text-xs text-slate-500">{label}</p>
            <p className={`mt-1 font-semibold ${danger ? 'text-red-500' : 'text-slate-900'}`}>
                {value}
            </p>
        </div>
    );
}

export default PurchasingMaterialTable;