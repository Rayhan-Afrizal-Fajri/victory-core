import React from 'react';
import SectionCard from '../SectionCard';
import InfoBox from './InfoBox';

// Displays a compact summary of the customer's order request and size breakdown.
function OrderRequestSummaryCard({ job, sizeBreakdowns }: { job: any; sizeBreakdowns: any[] }) {
    // Calculate the total quantity across all size breakdown rows.
    const totalSize = sizeBreakdowns.reduce((total, row) => {
        return total + Number(row.qty || 0);
    }, 0);

    return (
        <SectionCard title="Request Customer">
            <div className="grid gap-4 md:grid-cols-2">
                <InfoBox
                    label="Produk Diminta"
                    value={job.requested_product_name || job.product_name || '-'}
                />
                <InfoBox
                    label="Quantity"
                    value={`${job.quantity || job.q || 0} pcs`}
                />
                <InfoBox label="Deadline" value={job.deadline || '-'} />
                <InfoBox
                    label="Total Size Breakdown"
                    value={`${totalSize} pcs`}
                />
            </div>

            {sizeBreakdowns.length > 0 && (
                <div className="mt-4 rounded-xl border bg-slate-50 p-4">
                    <p className="mb-3 text-xs font-semibold uppercase text-slate-500">
                        Size Breakdown
                    </p>

                    <div className="grid gap-2 md:grid-cols-4">
                        {sizeBreakdowns.map((row) => (
                            <div
                                key={row.id || `${row.color}-${row.size_label}`}
                                className="rounded-lg border bg-white p-3 text-sm"
                            >
                                <p className="font-semibold text-slate-900">
                                    {row.color ? `${row.color} / ` : ''}
                                    {row.size_label}
                                </p>
                                <p className="text-xs text-slate-500">{row.qty} pcs</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {(job.customer_notes || job.keterangan_tambahan) && (
                <div className="mt-4 rounded-xl border bg-slate-50 p-4 text-sm text-slate-700">
                    <p className="mb-1 text-xs font-semibold uppercase text-slate-500">
                        Catatan Customer
                    </p>
                    {job.customer_notes || job.keterangan_tambahan}
                </div>
            )}
        </SectionCard>
    );
}

export default OrderRequestSummaryCard;
