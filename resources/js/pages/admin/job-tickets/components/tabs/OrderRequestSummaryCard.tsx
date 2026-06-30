import React from 'react';
import SectionCard from '../SectionCard';
import InfoBox from './InfoBox';
import type { Pesanan } from '../../types';

function OrderRequestSummaryCard({ activeOrder }: { activeOrder: Pesanan }) {
    // Karena kita sudah memparsing size_breakdowns ke activeOrder, kita bisa langsung mapping
    const sizeBreakdowns = activeOrder.size_breakdowns || [];
    const totalSize = sizeBreakdowns.reduce((total, row) => total + Number(row.qty || 0), 0);

    return (
        <SectionCard title="Request Customer">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <InfoBox
                    label="Produk Diminta"
                    value={activeOrder.requested_product_name || activeOrder.product_name || '-'}
                />
                <InfoBox
                    label="Quantity Massal"
                    value={`${activeOrder.quantity || 0} pcs`}
                />
                <InfoBox 
                    label="Quantity Sample" 
                    value={`${activeOrder.sample_qty || 0} pcs`} 
                />
                {totalSize > 0 && (
                    <InfoBox
                        label="Total Size Breakdown"
                        value={`${totalSize} pcs`}
                    />
                )}
            </div>

            {sizeBreakdowns.length > 0 && (
                <div className="mt-4 rounded-xl border bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900">
                    <p className="mb-3 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                        Size Breakdown
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {sizeBreakdowns.map((row) => (
                            <div
                                key={row.id || `${row.color}-${row.size_label}`}
                                className="rounded-lg border bg-white px-3 py-2 text-sm shadow-sm dark:border-slate-700 dark:bg-slate-950"
                            >
                                <span className="font-semibold text-slate-900 dark:text-white mr-2">
                                    {row.color ? `${row.color} / ` : ''}{row.fabric_spec ? `${row.fabric_spec} / ` : ''}{row.size_label ? `${row.size_label}  ` : ''}
                                </span>
                                <span className="text-xs text-slate-500 dark:text-slate-400">{row.qty} pcs</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </SectionCard>
    );
}

export default OrderRequestSummaryCard;