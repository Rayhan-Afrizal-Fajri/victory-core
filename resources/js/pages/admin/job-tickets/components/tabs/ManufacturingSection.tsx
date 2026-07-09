import React from 'react';
import SectionCard from '../SectionCard';
import { Button } from '@/components/ui/button';
import { formatNumber } from '@/helpers/format';
import { useCan } from '@/hooks/use-can';

// Renders manufacturing specs table with cost estimates.
function ManufacturingSection({ items, onEdit, onDelete }: { items: any[]; onEdit: (items: any) => void; onDelete?: (items: any) => void }) {
    const can = useCan();
    return (
        <SectionCard title="Manufaktur">
            {items.length === 0 ? (
                <p className="text-sm text-slate-500">Belum ada data manufaktur. Sync artikel terlebih dahulu.</p>
            ) : (
                <div className="w-full overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <table className="min-w-full divide-y divide-slate-200 text-sm">
                        <thead className='bg-slate-50'>
                            <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                <th className="px-4 py-3.5 whitespace-nowrap">Work</th>
                                <th className="px-4 py-3.5 whitespace-nowrap">Pemakaian</th>
                                <th className="px-4 py-3.5 whitespace-nowrap">Unit</th>
                                <th className="px-4 py-3.5 whitespace-nowrap">Keterangan</th>
                                <th className="px-4 py-3.5 whitespace-nowrap">Vendor</th>
                                <th className="px-4 py-3.5 whitespace-nowrap">Estimasi Min</th>
                                <th className="px-4 py-3.5 whitespace-nowrap">Estimasi Max</th>
                                <th className="px-4 py-3.5 whitespace-nowrap text-right">Total/Pcs</th>
                            </tr>
                        </thead>
                        <tbody className='divide-y divide-slate-200 bg-white'>
                            {items.map((item) => (
                                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-4 py-3 font-medium text-slate-900 whitespace-nowrap">{item.work_name}</td>
                                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{formatNumber(item.usage)}</td>
                                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{item.unit || '-'}</td>
                                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{item.usage_note || '-'}</td>
                                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{item.vendor || '-'}</td>
                                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{Number(item.min_estimate || 0).toLocaleString('id-ID')}</td>
                                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{Number(item.max_estimate || 0).toLocaleString('id-ID')}</td>
                                    <td className="px-4 py-3 text-right font-semibold text-slate-900 whitespace-nowrap">{Number(item.cost_per_pcs || 0).toLocaleString('id-ID')}</td>
                                    <td className="px-4 py-3 text-right whitespace-nowrap gap-2 space-x-2">
                                        <Button type="button" size="sm" variant="outline" onClick={() => onEdit(item)} disabled={!can('manufactures.edit')}>
                                            Edit
                                        </Button>
                                        {onDelete && (
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="outline"
                                                className="border-red-200 text-red-600 hover:bg-red-50"
                                                onClick={() => onDelete(item)}
                                                disabled={!can('manufactures.delete')}
                                            >
                                                Hapus
                                            </Button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </SectionCard>
    );
}

export default ManufacturingSection;
