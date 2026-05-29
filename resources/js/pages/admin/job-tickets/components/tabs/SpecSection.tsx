import React from 'react';
import SectionCard from '../SectionCard';
import { Button } from '@/components/ui/button';

// Renders a specification table for materials or accessories with an Edit action.
function SpecSection({ title, items, onEdit }: { title: string; items: any[]; onEdit: (spec: any) => void }) {
    return (
        <SectionCard title={title}>
            {items.length === 0 ? (
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
                                    <td className="py-2">{item.usage}</td>
                                    <td className="py-2">{item.unit || '-'}</td>
                                    <td className="py-2">{item.supplier || '-'}</td>
                                    <td className="py-2">{Number(item.harga_ecer || 0).toLocaleString('id-ID')}</td>
                                    <td className="py-2">{Number(item.harga_roll || 0).toLocaleString('id-ID')}</td>
                                    <td className="py-2">{item.price_type || '-'}</td>
                                    <td className="py-2 text-right">{Number(item.cost_per_pcs || 0).toLocaleString('id-ID')}</td>
                                    <td className="py-2 text-right">
                                        <Button type="button" size="sm" variant="outline" onClick={() => onEdit(item)}>
                                            Edit
                                        </Button>
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
