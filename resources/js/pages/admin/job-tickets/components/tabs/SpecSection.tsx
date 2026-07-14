import React from 'react';
import SectionCard from '../SectionCard';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDecimal } from '@/helpers/format';
import { useCan } from '@/hooks/use-can';

// Renders a specification table for materials or accessories with an Edit action.
function SpecSection({ title, items, workflow, onEdit, onDelete }: { title: string; items: any[]; workflow: any; onEdit: (spec: any) => void; onDelete?: (spec: any) => void }) {
    const can = useCan();
    return (
        <SectionCard title={title}>
            {items && items.length === 0 ? (
                <p className="text-sm text-slate-500">
                    Belum ada data {title.toLowerCase()}. Sync artikel terlebih dahulu.
                </p>
            ) : (
                <div className="w-full overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <table className="min-w-full divide-y divide-slate-200 text-sm">
                        <thead className="bg-slate-50">
                        <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                            <th className="px-4 py-3.5 whitespace-nowrap">Material</th>
                            <th className="px-4 py-3.5 whitespace-nowrap">Warna</th>
                            <th className="px-4 py-3.5 whitespace-nowrap">Pemakaian</th>
                            <th className="px-4 py-3.5 whitespace-nowrap">Unit</th>
                            <th className="px-4 py-3.5 whitespace-nowrap">Vendor</th>
                            <th className="px-4 py-3.5 whitespace-nowrap">Harga Ecer</th>
                            <th className="px-4 py-3.5 whitespace-nowrap">Harga Roll</th>
                            <th className="px-4 py-3.5 whitespace-nowrap">Pilihan</th>
                            <th className="px-4 py-3.5 whitespace-nowrap text-right">Total/Pcs</th>
                            {/* BONUS: Menambahkan th ke-10 yang hilang agar sinkron dengan td aksi */}
                            {can(['boms.edit', 'boms.delete']) && (
                                <th className="px-4 py-3.5 whitespace-nowrap text-right">Aksi</th> 
                            )}
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 bg-white">
                        {items.map((item) => (
                            <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-4 py-3 font-medium text-slate-900 whitespace-nowrap">
                                {item.material_name}
                            </td>
                            <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                                {item.color || '-'}
                            </td>
                            <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                                {formatDecimal(item.usage || 0)}
                            </td>
                            <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                                {item.unit || '-'}
                            </td>
                            <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                                {item.supplier || '-'}
                            </td>
                            <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                                {formatCurrency(item.harga_ecer || 0)}
                            </td>
                            <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                                {formatCurrency(item.harga_roll || 0)}
                            </td>
                            <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                                {item.price_type || '-'}
                            </td>
                            <td className="px-4 py-3 text-right font-semibold text-slate-900 whitespace-nowrap">
                                {formatCurrency(item.cost_per_pcs || 0)}
                            </td>
                            <td className="px-4 py-3 text-right whitespace-nowrap gap-2 space-x-2">
                                {can('boms.edit') && (
                                    <Button 
                                        type="button" 
                                        size="sm" 
                                        variant="outline" 
                                        onClick={() => onEdit(item)}
                                        disabled={!can('boms.edit') || workflow.design_specs_completed}
                                    >
                                        Edit
                                    </Button>
                                )}
                                {onDelete && can('boms.delete') && (
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                                    onClick={() => onDelete(item)}
                                    disabled={!can('boms.delete') || workflow.design_specs_completed}
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

export default SpecSection;
