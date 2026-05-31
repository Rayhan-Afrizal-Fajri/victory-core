import React from 'react';
import SpecSection from './SpecSection';
import ManufacturingSection from './ManufacturingSection';

// High-level preview of design-related specifications: Bahan, Aksesoris, Manufaktur.
function DesignSpecsPreview({
    materialSpecs,
    manufacturingSpecs,
    onEditMaterial,
    onEditManufacturing,
}: {
    materialSpecs: any[];
    manufacturingSpecs: any[];
    onEditMaterial: (spec: any) => void;
    onEditManufacturing: (spec: any) => void;
}) {
    // Split material specs into bahan and aksesoris groups by `type` field.
    const bahan = materialSpecs.filter((item) => item.type === 'bahan');
    const aksesoris = materialSpecs.filter((item) => item.type === 'aksesoris');

    return (
        <div className="space-y-4">
            {bahan && (
                <SpecSection title="Bahan" items={bahan} onEdit={onEditMaterial} />
            )}
            {aksesoris && (
                <SpecSection title="Aksesoris" items={aksesoris} onEdit={onEditMaterial} />
            )}
            {manufacturingSpecs && (
                <ManufacturingSection items={manufacturingSpecs} onEdit={onEditManufacturing}/>
            )}
        </div>
    );
}

export default DesignSpecsPreview;
