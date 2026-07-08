import React, { useEffect, useMemo, useState } from 'react';
import { useForm } from '@inertiajs/react';
import { toast } from 'sonner';

import type { JobTicket } from '../../types';
import QuotationSection from '@/components/designs/quotationSection';
import WorkflowGate from '../WorkflowGate';
import CostingSummaryCard from '@/components/designs/costing-summary-card';

const CostingTab: React.FC<{ jobTicket: JobTicket }> = ({ jobTicket }) => {

    const [activeOrderIndex, setActiveOrderIndex] = useState(0);

    const activeOrder = jobTicket.orders?.[activeOrderIndex];

    const canOpenCosting =
        activeOrder &&
        (
            activeOrder.material_specs?.length ||
            activeOrder.manufacturing_specs?.length
        );

    function getRecommendedPrice(cost: number, margin: number) {
        if (!cost || cost <= 0) return 0;

        return cost / (1 - margin);
    }

    // const costingSummary = useMemo(() => {
    //     const materialCostPerPcs = materialSpecs.reduce(
    //         (total: number, item: any) => {
    //             return total + Number(item.cost_per_pcs || 0);
    //         },
    //         0,
    //     );

    //     const manufacturingCostPerPcs = manufacturingSpecs.reduce(
    //         (total: number, item: any) => {
    //             return total + Number(item.cost_per_pcs || 0);
    //         },
    //         0,
    //     );

    //     const hppPerPcs = materialCostPerPcs + manufacturingCostPerPcs;

    //     return {
    //         materialCostPerPcs,
    //         manufacturingCostPerPcs,
    //         hppPerPcs,
    //         totalHpp: hppPerPcs * orderQty,
    //         recommendations: {
    //             25: getRecommendedPrice(hppPerPcs, 0.25),
    //             30: getRecommendedPrice(hppPerPcs, 0.3),
    //             35: getRecommendedPrice(hppPerPcs, 0.35),
    //             40: getRecommendedPrice(hppPerPcs, 0.4),
    //         },
    //     };
    // }, [materialSpecs, manufacturingSpecs, orderQty]);

    const ownerPriceForm = useForm({
        harga_jual_per_pcs:
            activeOrder?.price_per_piece ?? 0,
        estimasi_hpp_per_pcs:
            activeOrder?.estimated_hpp_per_piece ?? 0,
    });

    useEffect(() => {
        if (!activeOrder) return;

        ownerPriceForm.setData({
            harga_jual_per_pcs:
                activeOrder.price_per_piece ?? 0,
            estimasi_hpp_per_pcs:
                activeOrder.estimated_hpp_per_piece ?? 0,
        });
    }, [activeOrder?.id]);

    // useEffect(() => {
    //     ownerPriceForm.setData({
    //         harga_jual_per_pcs: Number(
    //             (jobTicket as any).price_per_piece ||
    //                 (jobTicket as any).harga_jual_per_pcs ||
    //                 0,
    //         ),
    //         estimasi_hpp_per_pcs: costingSummary.hppPerPcs,
    //     });
    // }, [
    //     (jobTicket as any).price_per_piece,
    //     (jobTicket as any).harga_jual_per_pcs,
    //     costingSummary.hppPerPcs,
    // ]);

    const submitOwnerPrice = (e: React.FormEvent) => {
        e.preventDefault();

        ownerPriceForm.patch(`/pesanan/${activeOrder.id}/owner-selling-price`, {
            preserveScroll: true,
            onSuccess: () =>
                toast.success('Harga jual final berhasil disimpan.'),
        });
    };

    return (
        <div className="space-y-6">
            {jobTicket.orders.length > 1 && (
                 <div className="mb-6 bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                        Pilih Produk Pesanan:
                    </p>
                    <div className="flex gap-2 overflow-x-auto pb-2">
                        {jobTicket.orders.map((order,index)=>(
                            <button
                                key={order.id}
                                onClick={() =>
                                    setActiveOrderIndex(index)
                                }
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

            {canOpenCosting ? (
                <>
                    <CostingSummaryCard
                        activeOrder={activeOrder}
                        form={ownerPriceForm}
                        onSubmit={submitOwnerPrice}
                    />
                </>
            ): (
                <WorkflowGate reason="Costing belum tersedia. Sync artikel atau lengkapi material/manufacturing specs terlebih dahulu." />
            )}
            <QuotationSection
                form={ownerPriceForm}
                job={jobTicket as JobTicket}
                quotations={(jobTicket as any).quotations || []}
            />
        </div>
    );
};

export default CostingTab;