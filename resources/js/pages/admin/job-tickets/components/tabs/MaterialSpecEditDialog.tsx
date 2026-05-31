import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Field from '@/components/sample/field';
import type { Supplier } from '../../types';

// Dialog used to edit a material or accessory specification.
function MaterialSpecEditDialog({
    open,
    onOpenChange,
    spec,
    form,
    suppliers,
    onSubmit,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    spec: any | null;
    form: any;
    suppliers: Supplier[];
    onSubmit: (e: React.FormEvent) => void;
}) {
    if (!spec) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Edit {spec.type === 'bahan' ? 'Bahan' : 'Aksesoris'}</DialogTitle>
                    <DialogDescription>
                        Perbarui warna, pemakaian, vendor, pilihan harga, dan total costing.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={onSubmit} className="space-y-4">
                    <div className="rounded-xl border bg-slate-50 p-4">
                        <p className="text-xs text-slate-500">Material</p>
                        <p className="mt-1 font-semibold text-slate-900">{spec.material_name}</p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                        <Field label="Warna" error={form.errors.color}>
                            <Input value={form.data.color} onChange={(e) => form.setData('color', e.target.value)} />
                        </Field>

                        <Field label="Pemakaian" error={form.errors.usage}>
                            <Input type="number" step="0.01" value={form.data.usage} onChange={(e) => form.setData('usage', Number(e.target.value))} />
                        </Field>

                        <Field label="Unit" error={form.errors.unit}>
                            <Input value={form.data.unit} onChange={(e) => form.setData('unit', e.target.value)} placeholder="meter / pcs / kg" />
                        </Field>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                        {/* <Field label="Penggunaan untuk berapa pcs/set" error={form.errors.usage_per_set}>
                            <Input type="number" min={1} value={form.data.usage_per_set} onChange={(e) => form.setData('usage_per_set', Number(e.target.value))} />
                        </Field> */}

                        <Field label="Pilihan Harga" error={form.errors.price_type}>
                            <Select value={form.data.price_type} onValueChange={(value) => form.setData('price_type', value)}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Pilih harga" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ecer">Ecer</SelectItem>
                                    <SelectItem value="roll">Roll</SelectItem>
                                </SelectContent>
                            </Select>
                        </Field>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                        <Field label="Harga Ecer" error={form.errors.harga_ecer}>
                            <Input type="number" min={0} value={form.data.harga_ecer} onChange={(e) => form.setData('harga_ecer', Number(e.target.value))} />
                        </Field>

                        <Field label="Harga Roll" error={form.errors.harga_roll}>
                            <Input type="number" min={0} value={form.data.harga_roll} onChange={(e) => form.setData('harga_roll', Number(e.target.value))} />
                        </Field>

                        <Field label="Isi Roll" error={form.errors.roll_qty}>
                            <Input type="number" min={0} step="0.01" value={form.data.roll_qty ?? ''} onChange={(e) => form.setData('roll_qty', e.target.value ? Number(e.target.value) : null)} placeholder="cth. 40 meter" />
                        </Field>
                    </div>

                    <div className="flex justify-end gap-2 border-t pt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Batal
                        </Button>
                        <Button type="submit" disabled={form.processing}>
                            Simpan Perubahan
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export default MaterialSpecEditDialog;
