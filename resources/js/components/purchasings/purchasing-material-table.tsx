import React, { useMemo, useState } from 'react';
import {
    CheckCircle2,
    Edit,
    PackageCheck,
    PlusCircle,
    Trash2,
    History,
    FileSpreadsheet
} from 'lucide-react';

import SectionCard from '@/pages/admin/job-tickets/components/SectionCard';
import Badge from '@/components/sample/badge';
import { Button } from '@/components/ui/button';

import { DataTable } from '../data-table';
import type { DataTableColumn } from '../data-table';
// ---------------------------------------------------------

import {
    canDeletePurchasing,
    canEditPurchasing,
    canMarkOrdered,
    canReceiveMaterial,
    getPurchasingStatusLabel,
    getReceivedQty,
    getReceivings,
    purchasingStatusClass,
    getSupplierName,
    getRequiredQty,
    getSampleReceivedQty,
    getProductionReceivedQty,
    getProgressPercentage,
    formatMaterialQty,
} from './purchasing-utils';
import { formatDecimal } from '@/helpers/format';
import { useCan } from '@/hooks/use-can';

const PurchasingMaterialTable = ({
    purchasings,
    order,
    job,
    onCreate,
    onEditPo,
    onEditManual,
    onDelete,
    onMarkOrdered,
    onUndoMarkOrdered,
    onReceive,
    onDeleteReceiving,
}: {
    purchasings: any[];
    order: any;
    job: any;
    onCreate: () => void;
    onEditPo: (purchasing: any) => void;
    onEditManual: (purchasing: any) => void;
    onDelete: (purchasing: any) => void;
    onMarkOrdered: (purchasing: any) => void;
    onUndoMarkOrdered: (purchasing: any) => void;
    onReceive: (purchasing: any) => void;
    onDeleteReceiving: (receiving: any) => void;
}) => {
    const can = useCan();
    const workflow = order.workflow_status;
    const hasSample = Number(order.sample_qty || 0) > 0;

    // React Component
    const handleExport = (type, param = '') => {
        // Cara paling mudah untuk download file tanpa ribet urus Blob axios
        const url = `/export/purchasing?type=${type}&param=${param}`;
        window.location.href = url;
    };

    // Gunakan useMemo untuk columns agar tidak me-render ulang jika props tidak berubah
    const columns = useMemo<DataTableColumn<any>[]>(() => [
        {
            header: 'Bahan & Supplier',
            accessor: 'item',
            className: 'min-w-[200px] align-top',
            cell: (row) => (
                <div className="space-y-1 py-1">
                    <p className="font-semibold text-slate-900">{row.item}</p>
                    <p className="text-xs text-slate-500">{getSupplierName(row)}</p>
                    <p className="text-xs text-slate-400">{row.tgl_pembelian || '-'}</p>
                </div>
            ),
        },
        {
            header: 'Status & Scope',
            accessor: 'status',
            className: 'w-[180px] align-top',
            cell: (row) => {
                const isGeneratedFromBom = Boolean(row.pesanan_material_spec_id);
                const purchaseScope = row.purchase_scope || 'sample_and_production';
                
                return (
                    <div className="space-y-2 py-1">
                        <div>
                            <Badge className={purchasingStatusClass[row.status] || 'bg-slate-100 text-slate-700'}>
                                {getPurchasingStatusLabel(row.status)}
                            </Badge>
                        </div>
                        <div className="flex flex-wrap gap-1">
                            <Badge className={isGeneratedFromBom ? 'border-blue-200 bg-blue-100 text-blue-700' : 'border-slate-200 bg-slate-100 text-slate-700'}>
                                {isGeneratedFromBom ? 'BOM' : 'Manual'}
                            </Badge>
                            {purchaseScope === 'sample_revision' && (
                                <Badge className="border-purple-200 bg-purple-100 text-purple-700">Revisi</Badge>
                            )}
                        </div>
                    </div>
                );
            },
        },
        {
            header: 'Kuantitas & Riwayat',
            accessor: 'required_qty',
            className: 'min-w-[260px] align-top',
            cell: (row) => (
                // Komponen lokal untuk menghandle toggle history per baris
                <QuantityAndHistoryCell 
                    item={row} 
                    can={can} 
                    onDeleteReceiving={onDeleteReceiving} 
                />
            ),
        },
        {
            header: 'Progress Kebutuhan',
            accessor: 'id', // Fallback accessor
            className: 'min-w-[200px] align-top',
            cell: (row) => {
                const sampleRequiredQty = getRequiredQty(row, order, 'sample');
                const productionRequiredQty = getRequiredQty(row, order, 'production');
                const sampleReceivedQty = getSampleReceivedQty(row, order);
                const productionReceivedQty = getProductionReceivedQty(row, order);
                const sampleProgress = getProgressPercentage(sampleReceivedQty, sampleRequiredQty);
                const productionProgress = getProgressPercentage(productionReceivedQty, productionRequiredQty);

                return (
                    <div className="space-y-3 py-1">
                        {hasSample && sampleRequiredQty > 0 && (
                            <MiniProgressBar 
                                label="Sample" 
                                progress={sampleProgress} 
                                text={`${formatMaterialQty(sampleReceivedQty)} / ${formatMaterialQty(sampleRequiredQty)}`} 
                            />
                        )}
                        {workflow?.sample_materials_ready == 1 && productionRequiredQty > 0 && (
                            <MiniProgressBar 
                                label="Produksi" 
                                progress={productionProgress} 
                                text={`${formatMaterialQty(productionReceivedQty)} / ${formatMaterialQty(productionRequiredQty)}`} 
                            />
                        )}
                        {sampleRequiredQty <= 0 && productionRequiredQty <= 0 && (
                            <span className="text-xs text-slate-400 italic">Tidak ada target spesifik</span>
                        )}
                    </div>
                );
            },
        },
        {
            header: 'Aksi',
            accessor: 'id',
            className: 'w-[160px] align-top',
            cell: (row) => {
                const isGeneratedFromBom = Boolean(row.pesanan_material_spec_id);
                return (
                    <div className="flex flex-col items-end gap-2 py-1">
                        <div className="flex gap-2">
                            {canReceiveMaterial(row) && can('purchasings.receive') && (
                                <Button type="button" size="sm" onClick={() => onReceive(row)} className="bg-emerald-600 hover:bg-emerald-700 h-8 text-xs">
                                    <PackageCheck className="size-3 mr-1" /> Terima
                                </Button>
                            )}
                            {canMarkOrdered(row) && can('purchasings.mark_ordered') && (
                                <Button 
                                    type="button" 
                                    size="sm" 
                                    variant="secondary" 
                                    className="h-8 text-xs"
                                    onClick={() => row.status === 'draft' ? onMarkOrdered(row) : onUndoMarkOrdered(row)}
                                >
                                    <CheckCircle2 className="size-3 mr-1" />
                                    {row.status === 'draft' ? 'Pesan' : 'Batal'}
                                </Button>
                            )}
                        </div>
                        
                        <div className="flex gap-2">
                            {canEditPurchasing(row) && can('purchasings.edit') && (
                                <Button type="button" size="icon" variant="outline" className="h-8 w-8" onClick={() => isGeneratedFromBom ? onEditPo(row) : onEditManual(row)} title="Edit">
                                    <Edit className="size-3.5 text-slate-600" />
                                </Button>
                            )}
                            {canDeletePurchasing(row) && !isGeneratedFromBom && can('purchasings.delete') && (
                                <Button type="button" size="icon" variant="outline" className="h-8 w-8 border-red-200 hover:bg-red-50" onClick={() => onDelete(row)} title="Hapus">
                                    <Trash2 className="size-3.5 text-red-600" />
                                </Button>
                            )}
                        </div>
                    </div>
                );
            }
        },
    ], [order, can, onReceive, onMarkOrdered, onUndoMarkOrdered, onEditPo, onEditManual, onDelete, onDeleteReceiving, hasSample, workflow]);

    return (
        <SectionCard title="Daftar Material">
            <div className="flex gap-2 justify-end">
                {can('purchasings.create') && (
                    <div className="mb-4 flex justify-end">
                        <Button type="button" onClick={onCreate} disabled={!can('purchasings.create')}>
                            <PlusCircle className="size-4" />
                            Tambah Item Manual
                        </Button>
                    </div>
                )}
                <Button
                    onClick={() => handleExport(2, job.no_job_ticket)}
                    className="mb-4 bg-emerald-600 hover:bg-emerald-700 cursor-pointer"
                >
                    <FileSpreadsheet className="h-4 w-4" />
                    Export Purchasing
                </Button>
            </div>

            <DataTable
                columns={columns}
                data={purchasings}
                searchKeys={['item', 'status']}
                emptyText="Belum ada material. Tambahkan daftar bahan yang perlu dibeli untuk produksi."
                searchPlaceholder="Cari bahan material..."
                pageSize={10}
            />
        </SectionCard>
    );
};

// ============================================================================
// KOMPONEN PENDUKUNG (Render di dalam cell)
// ============================================================================

function QuantityAndHistoryCell({ item, can, onDeleteReceiving }: { item: any, can: any, onDeleteReceiving: (r: any) => void }) {
    const [isExpanded, setIsExpanded] = useState(false);
    
    const receivedQty = getReceivedQty(item);
    const receivings = getReceivings(item);

    return (
        <div className="py-1">
            {/* Ringkasan Qty */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs mb-2">
                <span className="text-slate-500">Required:</span>
                <span className="font-medium text-slate-900">{formatDecimal(item.required_qty || 0)} {item.unit}</span>
                
                <span className="text-slate-500">Purchased:</span>
                <span className="font-medium text-slate-900">{formatDecimal(item.purchase_qty || item.ordered_qty || 0)} {item.unit}</span>
                
                <span className="text-slate-500">Received:</span>
                <span className="font-medium text-emerald-600">{formatDecimal(receivedQty)} {item.unit}</span>
            </div>

            {/* Toggle History */}
            {receivings.length > 0 && (
                <div className="mt-2">
                    <button 
                        onClick={() => setIsExpanded(!isExpanded)} 
                        className="text-xs text-blue-600 hover:text-blue-800 flex items-center font-medium"
                    >
                        <History className="size-3 mr-1" />
                        {isExpanded ? 'Tutup Riwayat' : `Lihat Riwayat (${receivings.length})`}
                    </button>

                    {/* Expandable History Area (Render in Cell) */}
                    {isExpanded && (
                        <div className="mt-2 space-y-2 border-t border-slate-100 pt-2">
                            {receivings.map((receiving: any) => (
                                <div key={receiving.id} className="flex items-start justify-between gap-2 p-2 rounded-md bg-slate-50 border border-slate-200">
                                    <div>
                                        <p className="font-medium text-slate-800 text-[11px]">{formatDecimal(receiving.received_qty)} {item.unit}</p>
                                        <p className="text-[10px] text-slate-500 mt-0.5">{receiving.received_at?.slice(0,10) || '-'} • Oleh: {receiving.checked_by?.name || '-'}</p>
                                    </div>
                                    {item.status !== 'received' && can('purchasings.create') && (
                                        <button type="button" onClick={() => onDeleteReceiving(receiving)} className="text-red-500 hover:text-red-700">
                                            <Trash2 className="size-3" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function MiniProgressBar({ label, progress, text }: { label: string; progress: number; text: string }) {
    const isDone = progress >= 100;

    return (
        <div className="w-full">
            <div className="flex justify-between text-[11px] mb-1">
                <span className="font-medium text-slate-700">{label}</span>
                <span className="text-slate-500">{text} ({Math.round(progress)}%)</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                <div 
                    className={`h-full rounded-full transition-all ${isDone ? 'bg-emerald-500' : 'bg-amber-500'}`} 
                    style={{ width: `${progress}%` }} 
                />
            </div>
        </div>
    );
}

export default PurchasingMaterialTable;