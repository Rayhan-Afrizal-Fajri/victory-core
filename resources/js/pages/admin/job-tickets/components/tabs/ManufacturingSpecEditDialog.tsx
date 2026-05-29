import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Field from '@/components/sample/field';
import type { Supplier } from '../../types';

// Dialog used to edit manufacturing specification entries.
function ManufacturingSpecEditDialog({
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
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Edit Manufaktur</DialogTitle>
                    <DialogDescription>Perbarui work, pemakaian, vendor, dan estimasi biaya.</DialogDescription>
                </DialogHeader>

                <form onSubmit={onSubmit} className="space-y-4">
                    <div className="rounded-xl border bg-slate-50 p-4">
                        <p className="text-xs text-slate-500">Work</p>
                        <p className="mt-1 font-semibold text-slate-900">{spec.work_name}</p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <Field label="Pemakaian" error={form.errors.usage}>
                            <Input type="number" step="0.0001" value={form.data.usage} onChange={(e) => form.setData('usage', Number(e.target.value))} />
                        </Field>

                        <Field label="Unit" error={form.errors.unit}>
                            <Input value={form.data.unit} onChange={(e) => form.setData('unit', e.target.value)} />
                        </Field>
                    </div>

                    <Field label="Keterangan Pemakaian" error={form.errors.usage_note}>
                        <Textarea rows={2} value={form.data.usage_note} onChange={(e) => form.setData('usage_note', e.target.value)} />
                    </Field>

                    <Field label="Vendor" error={form.errors.vendor_id}>
                        <Select value={form.data.vendor_id ? String(form.data.vendor_id) : ''} onValueChange={(value) => form.setData('vendor_id', Number(value))}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Pilih vendor" />
                            </SelectTrigger>
                            <SelectContent>
                                {suppliers.map((supplier) => (
                                    <SelectItem key={supplier.id} value={String(supplier.id)}>
                                        {(supplier.nama_perusahaan || supplier.nama || 'Vendor') + (supplier.kategori ? ` — ${supplier.kategori}` : '')}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </Field>

                    <div className="grid gap-4 md:grid-cols-2">
                        <Field label="Estimasi Minimal" error={form.errors.min_estimate}>
                            <Input type="number" min={0} value={form.data.min_estimate} onChange={(e) => form.setData('min_estimate', Number(e.target.value))} />
                        </Field>

                        <Field label="Estimasi Maksimal" error={form.errors.max_estimate}>
                            <Input type="number" min={0} value={form.data.max_estimate} onChange={(e) => form.setData('max_estimate', Number(e.target.value))} />
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

export default ManufacturingSpecEditDialog;
