import React from 'react';
import SectionCard from '../SectionCard';
import InfoBox from './InfoBox';
import type { Pesanan } from '../../types';
import { formatCurrency } from '@/helpers/format';

function OrderRequestSummaryCard({ activeOrder, customerNotes }: { activeOrder: Pesanan; customerNotes?: string | null }) {
    const sizeBreakdowns = activeOrder.size_breakdowns || [];
    const totalSize = sizeBreakdowns.reduce((total, row) => total + Number(row.qty || 0), 0);

    return (
        <SectionCard title="Detail Pesanan & Catatan PO">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <InfoBox
                    label="Produk Diminta"
                    value={activeOrder.requested_product_name || activeOrder.product_name || '-'}
                />
                <InfoBox
                    label="Artikel / Master Produk"
                    value={activeOrder.product?.name || 'Belum di-sync'}
                />
                <InfoBox
                    label="Qty Produksi"
                    value={`${activeOrder.quantity || 0} pcs`}
                />
                <InfoBox 
                    label="Qty Sample"
                    value={`${activeOrder.sample_qty || 0} pcs`} 
                />
                <InfoBox
                    label="Harga Jual / Pcs"
                    value={formatCurrency(activeOrder.price_per_piece || 0)}
                />
                <InfoBox
                    label="Estimasi HPP / Pcs"
                    value={formatCurrency(activeOrder.estimated_hpp_per_piece || 0)}
                />
            </div>

            <div className="mt-4 rounded-md border bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900">
                    <p className="mb-3 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                        Size Breakdown {totalSize > 0 && <span className="normal-case">({totalSize} pcs)</span>}
                    </p>
                    {sizeBreakdowns.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {sizeBreakdowns.map((row) => (
                                <div
                                    key={row.id || `${row.color}-${row.size_label}`}
                                    className="rounded-md border bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                                >
                                    <span className="font-semibold text-slate-900 dark:text-white">
                                        {[row.color, row.fabric_spec, row.size_label].filter(Boolean).join(' / ') || 'Tanpa label'}
                                    </span>
                                    <span className="ml-2 text-xs text-slate-500 dark:text-slate-400">{row.qty} pcs</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm italic text-slate-400">Tidak ada detail ukuran.</p>
                    )}
            </div>

            <div className="mt-4 border-t pt-4">
                <p className="mb-2 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Catatan PO</p>
                {customerNotes?.trim() ? (
                    <p className="whitespace-pre-line text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                        {customerNotes}
                    </p>
                ) : (
                    <p className="text-sm italic text-slate-400">Tidak ada catatan untuk Purchase Order ini.</p>
                )}
            </div>
        </SectionCard>
    );
}

export default OrderRequestSummaryCard;