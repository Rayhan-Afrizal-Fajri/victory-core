import React from 'react';
import SectionCard from '../SectionCard';
import { Button } from '@/components/ui/button';

// Renders manufacturing specs table with cost estimates.
function ManufacturingSection({ items, onEdit, onDelete }: { items: any[]; onEdit: (items: any) => void; onDelete?: (items: any) => void }) {
    return (
        <SectionCard title="Manufaktur">
            {items.length === 0 ? (
                <p className="text-sm text-slate-500">Belum ada data manufaktur. Sync artikel terlebih dahulu.</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b text-left text-xs uppercase text-slate-500">
                                <th className="py-2">Work</th>
                                <th className="py-2">Pemakaian</th>
                                <th className="py-2">Unit</th>
                                <th className="py-2">Keterangan</th>
                                <th className="py-2">Vendor</th>
                                <th className="py-2">Estimasi Min</th>
                                <th className="py-2">Estimasi Max</th>
                                <th className="py-2 text-right">Total/Pcs</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item) => (
                                <tr key={item.id} className="border-b">
                                    <td className="py-2 font-medium">{item.work_name}</td>
                                    <td className="py-2">{item.usage}</td>
                                    <td className="py-2">{item.unit || '-'}</td>
                                    <td className="py-2">{item.usage_note || '-'}</td>
                                    <td className="py-2">{item.vendor || '-'}</td>
                                    <td className="py-2">{Number(item.min_estimate || 0).toLocaleString('id-ID')}</td>
                                    <td className="py-2">{Number(item.max_estimate || 0).toLocaleString('id-ID')}</td>
                                    <td className="py-2 text-right">{Number(item.cost_per_pcs || 0).toLocaleString('id-ID')}</td>
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

export default ManufacturingSection;
