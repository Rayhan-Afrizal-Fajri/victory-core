import { ClipboardList } from 'lucide-react';

import SectionCard from '@/pages/admin/job-tickets/components/SectionCard';
import EmptyState from '@/components/sample/empty-state';
import { formatCurrency, formatDecimal } from '@/helpers/format';

const DesignSpecsReferenceCard = ({ job }: { job: any }) => {
    const materialSpecs = job.material_specs || [];
    const manufacturingSpecs = job.manufacturing_specs || [];

    const bahan = materialSpecs.filter((item: any) => item.type === 'bahan');
    const aksesoris = materialSpecs.filter((item: any) => item.type === 'aksesoris');

    const hasSpecs =
        bahan.length > 0 ||
        aksesoris.length > 0 ||
        manufacturingSpecs.length > 0;

    return (
        <SectionCard title="Referensi BOM dari Design">
            {!hasSpecs ? (
                <EmptyState
                    icon={<ClipboardList className="size-5" />}
                    title="Belum ada BOM"
                    description="Sync artikel dan lengkapi spesifikasi Design terlebih dahulu."
                />
            ) : (
                <div className="space-y-4">
                    <SpecGroup title="Bahan" items={bahan} />
                    <SpecGroup title="Aksesoris" items={aksesoris} />
                    <ManufacturingGroup items={manufacturingSpecs} />
                </div>
            )}
        </SectionCard>
    );
};

function SpecGroup({
    title,
    items,
}: {
    title: string;
    items: any[];
}) {
    if (items.length === 0) return null;

    return (
        <div>
            <p className="mb-2 text-xs font-semibold uppercase text-slate-500">
                {title}
            </p>

            <div className="grid gap-3 md:grid-cols-2">
                {items.map((item: any) => (
                    <div key={item.id} className="rounded-xl border bg-white p-4">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="font-semibold text-slate-900">
                                    {item.material_name}
                                </p>
                                <p className="mt-1 text-xs text-slate-500">
                                    Warna: {item.color || '-'}
                                </p>
                            </div>
                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600">
                            <Info label="Pemakaian" value={formatDecimal(item.usage || 0) + ' ' + item.unit} />
                            <Info label="Vendor" value={item.supplier || '-'} />
                            <Info label="Harga" value={item.price_type || '-'} />
                            <Info
                                label="Total/Pcs"
                                value={formatCurrency(item.cost_per_pcs || 0)}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function ManufacturingGroup({ items }: { items: any[] }) {
    if (items.length === 0) return null;

    return (
        <div>
            <p className="mb-2 text-xs font-semibold uppercase text-slate-500">
                Manufaktur
            </p>

            <div className="grid gap-3 md:grid-cols-2">
                {items.map((item: any) => (
                    <div key={item.id} className="rounded-xl border bg-white p-4">
                        <p className="font-semibold text-slate-900">
                            {item.work_name}
                        </p>

                        <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600">
                            <Info label="Pemakaian" value={`${formatDecimal(item.usage || 0)} ${item.unit || ''}`} />
                            <Info label="Vendor" value={item.vendor || '-'} />
                            <Info
                                label="Estimasi Min"
                                value={formatCurrency(item.min_estimate || 0)}
                            />
                            <Info
                                label="Estimasi Max"
                                value={formatCurrency(item.max_estimate || 0)}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function Info({
    label,
    value,
}: {
    label: string;
    value: React.ReactNode;
}) {
    return (
        <div className="rounded-lg bg-slate-50 p-2">
            <p className="text-[10px] uppercase text-slate-400">{label}</p>
            <p className="mt-1 font-medium text-slate-700">{value}</p>
        </div>
    );
}

export default DesignSpecsReferenceCard;