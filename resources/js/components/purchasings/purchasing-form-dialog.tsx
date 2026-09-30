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
import FormattedNumberInput from '../ui/formatted-number-input';

const PurchasingFormDialog = ({
    open,
    onOpenChange,
    form,
    onSubmit,
    mode = 'create',
    suppliers,
    jobTickets,
    job,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    form: any;
    onSubmit: (e: React.FormEvent) => void;
    mode?: 'create' | 'edit';
    suppliers: Supplier[];
    jobTickets?: {
        id: number;
        no_job_ticket: string;
        customer: string;
    }[];
    job?: any;
}) => {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl overflow-y-auto max-h-screen">
                <DialogHeader>
                    <DialogTitle>
                        {mode === 'edit' ? 'Edit Material Purchasing' : 'Tambah Material Purchasing'}
                    </DialogTitle>
                    <DialogDescription>
                        Input bahan/material yang dibutuhkan untuk proses produksi.
                    </DialogDescription>
                </DialogHeader>

                {job?.workflow_status?.sample_materials_ready !== 0 && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
                        Sample production sudah berjalan. Item manual baru akan dianggap sebagai pembelian tambahan dan tidak akan mengunci ulang Sample Tab.
                    </div>
                )}
                {job?.workflow_status?.production_started !== 0 && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
                        Production sudah berjalan. Item manual baru akan dianggap sebagai pembelian tambahan dan tidak akan mengunci ulang Production Tab.
                    </div>
                )}

                <form onSubmit={onSubmit} className="space-y-4">
                    <Field label="Nama Bahan" error={form.errors.item_bahan}>
                        <Input
                            value={form.data.item_bahan}
                            onChange={(e) => form.setData('item_bahan', e.target.value)}
                            placeholder="Contoh: Fleece Navy 330gsm"
                        />
                    </Field>

                    {jobTickets && jobTickets.length > 0 && (
                        <Field label="Purchase Order" error={form.errors.pesanan_id}>
                            <Select
                                value={form.data.pesanan_id ? String(form.data.pesanan_id) : ''}
                                onValueChange={(value) => form.setData('pesanan_id', value)}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Pilih Purchase Order" />
                                </SelectTrigger>

                                <SelectContent>
                                    {jobTickets.map((job) => (
                                        <SelectItem key={job.id} value={String(job.id)}>
                                            {job.no_job_ticket} · {job.customer}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </Field>
                    )}

                    <Field label="Scope Kebutuhan" error={form.errors.purchase_scope}>
                        <Select
                            value={form.data.purchase_scope || 'sample_and_production'}
                            onValueChange={(value) => form.setData('purchase_scope', value)}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Pilih scope" />
                            </SelectTrigger>

                            <SelectContent>
                                <SelectItem value="sample_and_production">
                                    Sample & Production
                                </SelectItem>
                                <SelectItem value="sample">
                                    Sample Only
                                </SelectItem>
                                <SelectItem value="production">
                                    Production Only
                                </SelectItem>
                                <SelectItem value="additional">
                                    Additional / Tidak Memblokir
                                </SelectItem>
                            </SelectContent>
                        </Select>

                        <p className="mt-1 text-xs text-slate-500">
                            Scope menentukan apakah item ini ikut memengaruhi kesiapan material sample/production.
                        </p>
                    </Field>

                    <div className="grid gap-4 md:grid-cols-3">
                        <Field label="Qty" error={form.errors.qty_bahan}>
                            <FormattedNumberInput
                                value={form.data.qty_bahan}
                                onValueChange={(value) => form.setData('qty_bahan', value)}
                                placeholder='cth: 35.000'
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
                            <FormattedNumberInput
                                value={form.data.harga_satuan}
                                onValueChange={(value) => form.setData('harga_satuan', value)}
                                placeholder='cth: 35.000'
                            />
                        </Field>
                    </div>
                    <Field label="Catatan" error={form.errors.notes}>
                        <Input
                            value={form.data.notes || ''}
                            onChange={(e) => form.setData('notes', e.target.value)}
                            placeholder="Contoh: pembelian tambahan karena rework / kebutuhan manual"
                        />
                    </Field>

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