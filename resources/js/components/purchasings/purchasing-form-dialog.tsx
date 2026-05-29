import React from 'react';

import Field from '@/components/sample/field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Supplier } from '@/pages/admin/job-tickets/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const PurchasingFormDialog = ({
    open,
    onOpenChange,
    form,
    onSubmit,
    mode = 'create',
    suppliers,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    form: any;
    onSubmit: (e: React.FormEvent) => void;
    mode?: 'create' | 'edit';
    suppliers: Supplier[]
}) => {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>
                        {mode === 'edit' ? 'Edit Material Purchasing' : 'Tambah Material Purchasing'}
                    </DialogTitle>
                    <DialogDescription>
                        Input bahan/material yang dibutuhkan untuk proses produksi.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={onSubmit} className="space-y-4">
                    <Field label="Nama Bahan" error={form.errors.item_bahan}>
                        <Input
                            value={form.data.item_bahan}
                            onChange={(e) => form.setData('item_bahan', e.target.value)}
                            placeholder="Contoh: Fleece Navy 330gsm"
                        />
                    </Field>

                    <div className="grid gap-4 md:grid-cols-3">
                        <Field label="Qty" error={form.errors.qty_bahan}>
                            <Input
                                type="number"
                                min={0}
                                step="0.01"
                                value={form.data.qty_bahan}
                                onChange={(e) => form.setData('qty_bahan', Number(e.target.value))}
                            />
                        </Field>

                        <Field label="Satuan" error={form.errors.satuan}>
                            <Input
                                value={form.data.satuan}
                                onChange={(e) => form.setData('satuan', e.target.value)}
                                placeholder="meter / pcs / roll"
                            />
                        </Field>

                        <Field label="Tanggal Pembelian" error={form.errors.tgl_pembelian}>
                            <Input
                                type="date"
                                value={form.data.tgl_pembelian}
                                onChange={(e) => form.setData('tgl_pembelian', e.target.value)}
                            />
                        </Field>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <Field label="Supplier" error={form.errors.supplier_id}>
                            <Select
                                value={form.data.supplier_id ? String(form.data.supplier_id) : ''}
                                onValueChange={(value) => {
                                    form.setData('supplier_id', Number(value));
                                }}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Pilih supplier" />
                                </SelectTrigger>

                                <SelectContent>
                                    {suppliers.length === 0 ? (
                                        <SelectItem value="no-supplier" disabled>
                                            Belum ada supplier
                                        </SelectItem>
                                    ) : (
                                        suppliers.map((supplier) => (
                                            <SelectItem
                                                key={supplier.id}
                                                value={String(supplier.id)}
                                            >
                                                {supplier.nama_perusahaan || supplier.nama || 'Supplier tanpa nama'}
                                                {supplier.kategori ? ` — ${supplier.kategori}` : ''}
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                        </Field>

                        <Field label="Harga Satuan" error={form.errors.harga_satuan}>
                            <Input
                                type="number"
                                min={0}
                                value={form.data.harga_satuan}
                                onChange={(e) => form.setData('harga_satuan', Number(e.target.value))}
                            />
                        </Field>
                    </div>

                    <div className="rounded-xl border bg-slate-50 p-4">
                        <p className="text-xs text-slate-500">Total Harga</p>
                        <p className="mt-1 font-semibold text-slate-900">
                            Rp {Number((form.data.qty_bahan || 0) * (form.data.harga_satuan || 0)).toLocaleString('id-ID')}
                        </p>
                    </div>

                    <div className="flex justify-end gap-2 border-t pt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Batal
                        </Button>

                        <Button type="submit" disabled={form.processing}>
                            {mode === 'edit' ? 'Simpan Perubahan' : 'Tambah Material'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default PurchasingFormDialog;