import { useMemo } from 'react';
import { ClipboardList } from 'lucide-react';

import { DataTable } from '@/components/data-table';
import type { DataTableColumn } from '@/components/data-table';

import EmptyState from '@/components/sample/empty-state';
import SectionCard from '@/pages/admin/job-tickets/components/SectionCard';

import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDecimal } from '@/helpers/format';

const DesignSpecsReferenceCard = ({ job }: { job: any }) => {
    const materialSpecs = job.material_specs || [];

    const hasSpecs = materialSpecs.length > 0;

    const data = useMemo(
        () =>
            materialSpecs.map((item: any) => ({
                ...item,
                category:
                    item.type === 'bahan'
                        ? 'Bahan'
                        : 'Aksesoris',
            })),
        [materialSpecs],
    );

    const columns: DataTableColumn<any>[] = [
        {
            header: 'Kategori',
            accessor: 'category',
            className: 'w-[110px]',
            cell: (row) => (
                <Badge
                    className={
                        row.type === 'bahan'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-violet-100 text-violet-700'
                    }
                >
                    {row.category}
                </Badge>
            ),
        },
        {
            header: 'Material',
            accessor: 'material_name',
            className: 'w-[250px]',
            cell: (row) => (
                <div>
                    <p className="font-medium">
                        {row.material_name}
                    </p>
                    <p className="text-xs text-slate-500">
                        {row.color || '-'}
                    </p>
                </div>
            ),
        },
        {
            header: 'Pemakaian',
            accessor: 'usage',
            className: 'w-[120px]',
            cell: (row) => (
                <>
                    {formatDecimal(row.usage)} {row.unit}
                </>
            ),
        },
        {
            header: 'Vendor',
            accessor: 'supplier',
            className: 'w-[180px]',
            cell: (row) => row.supplier || '-',
        },
        {
            header: 'Harga',
            accessor: 'price_type',
            className: 'w-[140px]',
            cell: (row) => row.price_type || '-',
        },
        {
            header: 'Total / Pcs',
            accessor: 'cost_per_pcs',
            className: 'w-[140px] text-right',
            cell: (row) => (
                <span className="font-medium">
                    {formatCurrency(row.cost_per_pcs)}
                </span>
            ),
        },
    ];

    return (
        <SectionCard title="Referensi BOM dari Design">
            {!hasSpecs ? (
                <EmptyState
                    icon={<ClipboardList className="size-5" />}
                    title="Belum ada BOM"
                    description="Sync artikel dan lengkapi spesifikasi Design terlebih dahulu."
                />
            ) : (
                <DataTable
                    columns={columns}
                    data={data}
                    searchKeys={[
                        'material_name',
                        'supplier',
                        'color',
                    ]}
                    searchPlaceholder="Cari material..."
                    pageSize={8}
                />
            )}
        </SectionCard>
    );
};

export default DesignSpecsReferenceCard;