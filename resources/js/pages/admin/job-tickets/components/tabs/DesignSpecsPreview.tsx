import React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SpecSection from './SpecSection';
import ManufacturingSection from './ManufacturingSection';
import type { Pesanan } from '../../types';
import { useCan } from '@/hooks/use-can';

function DesignSpecsPreview({
    materialSpecs,
    manufacturingSpecs,
    onEditMaterial,
    onEditManufacturing,
    onCreateMaterial,
    onCreateManufacturing,
    onDeleteMaterial,
    onDeleteManufacturing,
    activeOrder
}: {
    materialSpecs: any[];
    manufacturingSpecs: any[];
    onEditMaterial: (spec: any) => void;
    onEditManufacturing: (spec: any) => void;
    onCreateMaterial?: () => void;
    onCreateManufacturing?: () => void;
    onDeleteMaterial?: (spec: any) => void;
    onDeleteManufacturing?: (spec: any) => void;
    activeOrder: Pesanan;
}) {
    const bahan = materialSpecs.filter((item) => item.type === 'bahan');
    const aksesoris = materialSpecs.filter((item) => item.type === 'aksesoris');
    const workflow = activeOrder?.workflow_status || {};

    const can = useCan();

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap justify-end gap-2">
                {onCreateMaterial && can('boms.create') && (
                    <Button
                        type="button"
                        size="sm"
                        onClick={onCreateMaterial}
                        disabled={workflow.quotation_created}
                    >
                        <Plus className="size-4 mr-2" /> Tambah Bahan / Aksesoris
                    </Button>
                )}

                {onCreateManufacturing && can('manufactures.create') && (
                    <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={onCreateManufacturing}
                        disabled={workflow.quotation_created}
                    >
                        <Plus className="size-4 mr-2" /> Tambah Manufaktur
                    </Button>
                )}
            </div>

            <SpecSection
                title="Bahan Baku"
                items={bahan}
                onEdit={onEditMaterial}
                onDelete={onDeleteMaterial}
            />

            <SpecSection
                title="Aksesoris Tambahan"
                items={aksesoris}
                onEdit={onEditMaterial}
                onDelete={onDeleteMaterial}
            />

            <ManufacturingSection
                items={manufacturingSpecs}
                onEdit={onEditManufacturing}
                onDelete={onDeleteManufacturing}
            />
        </div>
    );
}

export default DesignSpecsPreview;