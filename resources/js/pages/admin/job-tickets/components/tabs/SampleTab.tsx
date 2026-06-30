import React, { useState } from 'react';

import type { JobTicket, Pesanan } from '../../types';
import WorkflowGate from '../WorkflowGate';

import ProductionRunBoard from '@/components/production-runs/production-run-board';

const SampleTab: React.FC<{ job: JobTicket }> = ({ job }) => {
    const [activeOrderIndex, setActiveOrderIndex] = useState<number>(0);
    const activeOrder: Pesanan | undefined = job?.orders?.[activeOrderIndex];

    const workflow = activeOrder.workflow_status;

    return (
        <div className="space-y-6">
            {job.orders && job.orders.length > 1 && (
                <div className="mb-6 bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Pilih Produk Pesanan:</p>
                    <div className="flex gap-2 overflow-x-auto pb-2">
                        {job.orders.map((order, index) => (
                            <button
                                key={order.id}
                                onClick={() => setActiveOrderIndex(index)}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center whitespace-nowrap ${
                                    activeOrderIndex === index
                                        ? 'bg-blue-600 text-white shadow-sm'
                                        : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                                }`}
                            >
                                <span className={`mr-2 flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${activeOrderIndex === index ? 'bg-blue-500/50' : 'bg-slate-200'}`}>
                                    {index + 1}
                                </span>
                                {order.requested_product_name || order.product_name || `Produk #${index + 1}`}
                            </button>
                        ))}
                    </div>
                </div>
            )}
            {workflow?.sample_materials_ready ? (
                <ProductionRunBoard
                    job={job}
                    activeOrder={activeOrder}
                    run={(job as any).sample_run || null}
                    runType="sample"
                />
            ): (
                <WorkflowGate reason="Material untuk sample belum cukup diterima. Sample production terkunci." />
            )}
        </div>
    );
};

export default SampleTab;