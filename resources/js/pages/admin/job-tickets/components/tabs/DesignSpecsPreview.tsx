import React, { useState } from 'react';
import { Lock, Plus, Unlock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SpecSection from './SpecSection';
import ManufacturingSection from './ManufacturingSection';
import type { Pesanan } from '../../types';
import { useCan } from '@/hooks/use-can';
import { router } from '@inertiajs/react';
import { toast } from 'sonner';

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

    const isBomLocked = workflow.design_specs_completed; 
    
    // 2. State untuk loading agar tombol tidak dispam klik
    const [isLoading, setIsLoading] = useState(false);

    // 3. Handler untuk toggle Kunci/Buka Kunci
    const handleToggleLock = () => {
        setIsLoading(true);
        
        // Kirim request ke backend, kebalikan dari status saat ini (!isBomLocked)
        router.post(`/pesanan/${activeOrder.id}/lock-bom`, {
            is_lock_bom: !isBomLocked
        }, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(`BOM berhasil ${!isBomLocked ? 'dikunci' : 'dibuka'}!`);
            },
            onFinish: () => setIsLoading(false),
        });
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap justify-end gap-2">
                <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleToggleLock}
                    // Disabled jika quotation sudah dibuat ATAU sedang proses loading
                    disabled={workflow.quotation_approved || isLoading} 
                >
                    {/* Ubah ikon dan teks secara dinamis */}
                    {isBomLocked ? (
                        <>
                            <Unlock className="size-4 mr-2" /> Buka Kunci BOM
                        </>
                    ) : (
                        <>
                            <Lock className="size-4 mr-2" /> Kunci BOM
                        </>
                    )}
                </Button>
                {onCreateMaterial && can('boms.create') && (
                    <Button
                        type="button"
                        size="sm"
                        onClick={onCreateMaterial}
                        disabled={workflow.quotation_approved || workflow.design_specs_completed}
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
                        disabled={workflow.quotation_approved || workflow.design_specs_completed}
                    >
                        <Plus className="size-4 mr-2" /> Tambah Manufaktur
                    </Button>
                )}
            </div>

            <SpecSection
                title="Bahan Baku"
                items={bahan}
                workflow={workflow}
                onEdit={onEditMaterial}
                onDelete={onDeleteMaterial}
            />

            <SpecSection
                title="Aksesoris Tambahan"
                items={aksesoris}
                workflow={workflow}
                onEdit={onEditMaterial}
                onDelete={onDeleteMaterial}
            />

            <ManufacturingSection
                items={manufacturingSpecs}
                workflow={workflow}
                onEdit={onEditManufacturing}
                onDelete={onDeleteManufacturing}
            />
        </div>
    );
}

export default DesignSpecsPreview;