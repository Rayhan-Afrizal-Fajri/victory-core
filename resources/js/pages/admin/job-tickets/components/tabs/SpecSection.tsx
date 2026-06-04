import React from 'react';
import SectionCard from '../SectionCard';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDecimal } from '@/helpers/format';

// Renders a specification table for materials or accessories with an Edit action.
function SpecSection({ title, items, onEdit, onDelete }: { title: string; items: any[]; onEdit: (spec: any) => void; onDelete?: (spec: any) => void }) {
    return (
        <SectionCard title={title}>
            {items && items.length === 0 ? (
                <p className="text-sm text-slate-500">
                    Belum ada data {title.toLowerCase()}. Sync artikel terlebih dahulu.
                </p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b text-left text-xs uppercase text-slate-500">
                                <th className="py-2">Material</th>
                                <th className="py-2">Warna</th>
                                <th className="py-2">Pemakaian</th>
                                <th className="py-2">Unit</th>
                                <th className="py-2">Vendor</th>
                                <th className="py-2">Harga Ecer</th>
                                <th className="py-2">Harga Roll</th>
                                <th className="py-2">Pilihan</th>
                                <th className="py-2 text-right">Total/Pcs</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item) => (
                                <tr key={item.id} className="border-b">
                                    <td className="py-2 font-medium">{item.material_name}</td>
                                    <td className="py-2">{item.color || '-'}</td>
                                    <td className="py-2">{formatDecimal(item.usage || 0)}</td>
                                    <td className="py-2">{item.unit || '-'}</td>
                                    <td className="py-2">{item.supplier || '-'}</td>
                                    <td className="py-2">{formatCurrency(item.harga_ecer || 0)}</td>
                                    <td className="py-2">{formatCurrency(item.harga_roll || 0   )}</td>
                                    <td className="py-2">{item.price_type || '-'}</td>
                                    <td className="py-2 text-right">{formatCurrency(item.cost_per_pcs || 0)}</td>
                                    <td className="py-2 text-right">
                                        <Button type="button" size="sm" variant="outline" onClick={() => onEdit(item)}>
                                            Edit
                                        </Button>
                                        {onDelete && (
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="outline"
                                                className="border-red-200 text-red-600 hover:bg-red-50"
                                                onClick={() => onDelete(item)}
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
