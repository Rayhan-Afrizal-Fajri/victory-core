import React, { useEffect, useMemo } from 'react';
import { useForm } from '@inertiajs/react';
import { toast } from 'sonner';

import type { JobTicket } from '../../types';
import QuotationSection from '@/components/designs/quotationSection';
import WorkflowGate from '../WorkflowGate';
import CostingSummaryCard from '@/components/designs/costing-summary-card';

const CostingTab: React.FC<{ job: JobTicket }> = ({ job }) => {

    const selectedProduct = (job as any).product || null;
    const materialSpecs = (job as any).material_specs || [];
    const manufacturingSpecs = (job as any).manufacturing_specs || [];
    const orderQty = Number((job as any).quantity || (job as any).q || 0);

    const canOpenCosting =
        selectedProduct &&
        (materialSpecs.length > 0 || manufacturingSpecs.length > 0);

    function getRecommendedPrice(cost: number, margin: number) {
        if (!cost || cost <= 0) return 0;

        return cost / (1 - margin);
    }

    const costingSummary = useMemo(() => {
        const materialCostPerPcs = materialSpecs.reduce(
            (total: number, item: any) => {
                return total + Number(item.cost_per_pcs || 0);
            },
            0,
        );

        const manufacturingCostPerPcs = manufacturingSpecs.reduce(
            (total: number, item: any) => {
                return total + Number(item.cost_per_pcs || 0);
            },
            0,
        );

        const hppPerPcs = materialCostPerPcs + manufacturingCostPerPcs;

        return {
            materialCostPerPcs,
            manufacturingCostPerPcs,
            hppPerPcs,
            totalHpp: hppPerPcs * orderQty,
            recommendations: {
                25: getRecommendedPrice(hppPerPcs, 0.25),
                30: getRecommendedPrice(hppPerPcs, 0.3),
                35: getRecommendedPrice(hppPerPcs, 0.35),
                40: getRecommendedPrice(hppPerPcs, 0.4),
            },
        };
    }, [materialSpecs, manufacturingSpecs, orderQty]);

    console.log(materialSpecs);

    const ownerPriceForm = useForm({
        harga_jual_per_pcs: Number((job as any).price_per_piece || (job as any).harga_jual_per_pcs || 0),
        estimasi_hpp_per_pcs: 0,
    });

    useEffect(() => {
        ownerPriceForm.setData({
            harga_jual_per_pcs: Number(
                (job as any).price_per_piece ||
                    (job as any).harga_jual_per_pcs ||
                    0,
            ),
            estimasi_hpp_per_pcs: costingSummary.hppPerPcs,
        });
    }, [
        (job as any).price_per_piece,
        (job as any).harga_jual_per_pcs,
        costingSummary.hppPerPcs,
    ]);

    const submitOwnerPrice = (e: React.FormEvent) => {
        e.preventDefault();

        ownerPriceForm.patch(`/pesanan/${job.id}/owner-selling-price`, {
            preserveScroll: true,
            onSuccess: () =>
                toast.success('Harga jual final berhasil disimpan.'),
        });
    };

    if (!canOpenCosting) {
        return (
            <WorkflowGate reason="Costing belum tersedia. Sync artikel dan lengkapi material/manufacturing specs terlebih dahulu." />
        );
    }

    return (
        <div className="space-y-6">
            <CostingSummaryCard
                orderQty={orderQty}
                summary={costingSummary}
                form={ownerPriceForm}
                onSubmit={submitOwnerPrice}
            />

            <QuotationSection
                job={job}
                quotations={(job as any).quotations || []}
            />
        </div>
    );
};

export default CostingTab;