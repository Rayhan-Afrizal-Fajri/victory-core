import React from 'react';
import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import SpecSection from './SpecSection';
import ManufacturingSection from './ManufacturingSection';

function DesignSpecsPreview({
    materialSpecs,
    manufacturingSpecs,
    onEditMaterial,
    onEditManufacturing,
    onCreateMaterial,
    onCreateManufacturing,
    onDeleteMaterial,
    onDeleteManufacturing,
    job
}: {
    materialSpecs: any[];
    manufacturingSpecs: any[];
    onEditMaterial: (spec: any) => void;
    onEditManufacturing: (spec: any) => void;
    onCreateMaterial?: () => void;
    onCreateManufacturing?: () => void;
    onDeleteMaterial?: (spec: any) => void;
    onDeleteManufacturing?: (spec: any) => void;
    job?: any;
}) {
    const bahan = materialSpecs.filter((item) => item.type === 'bahan');
    const aksesoris = materialSpecs.filter((item) => item.type === 'aksesoris');
    const workflow = job?.workflow_status;

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap justify-end gap-2">
                {onCreateMaterial && (
                    <Button
                        type="button"
                        size="sm"
                        onClick={onCreateMaterial}
                        disabled={workflow.quotation_created}
                    >
                        <Plus className="size-4" />
                        Tambah Bahan / Aksesoris
                    </Button>
                )}

                {onCreateManufacturing && (
                    <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={onCreateManufacturing}
                        disabled={workflow.quotation_created}
                    >
                        <Plus className="size-4" />
                        Tambah Manufaktur
                    </Button>
                )}
            </div>

            <SpecSection
                title="Bahan"
                items={bahan}
                onEdit={onEditMaterial}
                onDelete={onDeleteMaterial}
            />

            <SpecSection
                title="Aksesoris"
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