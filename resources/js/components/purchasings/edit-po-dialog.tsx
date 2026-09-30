import React from 'react';

import Field from '@/components/sample/field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import formatRupiah from '@/components/ui/format-rupiah';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

import type { Supplier } from '@/pages/admin/job-tickets/types';
import { formatDecimal } from '@/helpers/format';
import FormattedNumberInput from '../ui/formatted-number-input';

const EditPoDialog = ({
    open,
    onOpenChange,
    purchasing,
    form,
    suppliers,
    onSubmit,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    purchasing: any | null;
    form: any;
    suppliers: Supplier[];
    onSubmit: (e: React.FormEvent) => void;
}) => {
    if (!purchasing) return null;

    const unit = purchasing.unit || purchasing.satuan || '';
    const requiredQty = Number(purchasing.required_qty || purchasing.ordered_qty || purchasing.qty_bahan || 0);
    const stockQty = Number(form.data.stock_qty || 0);
    const purchaseQty = Number(form.data.purchase_qty || 0);
    const hargaSatuan = Number(form.data.harga_satuan || 0);

    // Membulatkan ke 2 angka di belakang koma
    const rawLeftover = stockQty + purchaseQty - requiredQty;
    const leftoverQty = Math.round(rawLeftover * 100) / 100;

    // Lakukan hal yang sama untuk shortage agar sinkron
    const rawShortage = requiredQty - stockQty - purchaseQty;
    const shortageQty = Math.max(Math.round(rawShortage * 100) / 100, 0);
    const totalHarga = purchaseQty * hargaSatuan;


    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-3xl max-h-screen overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Edit PO Item</DialogTitle>
                    <DialogDescription>
                        Atur stok, qty beli, supplier, harga, dan catatan untuk item hasil Generate BOM.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={onSubmit} className="space-y-4">
                    <div className="rounded-2xl border bg-slate-50 p-4">
                        <p className="text-xs font-medium uppercase text-slate-500">
                            Material
                        </p>

                        <p className="mt-1 font-semibold text-slate-900">
                            {purchasing.item || purchasing.item_bahan || '-'}
                        </p>

                        {purchasing.color && (
                            <p className="mt-1 text-xs text-slate-500">
                                Warna: {purchasing.color}
                            </p>
                        )}

                        <div className="mt-4 grid gap-3 md:grid-cols-4">
                            <MiniInfo
                                label="Required"
                                value={`${requiredQty} ${unit}`}
                            />

                            <MiniInfo
                                label="Stock"
                                value={`${stockQty} ${unit}`}
                            />

                            <MiniInfo
                                label="Purchase"
                                value={`${purchaseQty} ${unit}`}
                            />

                            <MiniInfo
                                label="Leftover"
                                value={`${formatDecimal(leftoverQty)} ${unit}`}
                                danger={shortageQty > 0}
                            />
                        </div>

                        {shortageQty > 0 && (
                            <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
                                Qty masih kurang {shortageQty} {unit}. Tambahkan stock atau purchase qty.
                            </div>
                        )}
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                        <Field label="Qty dari Stok" error={form.errors.stock_qty}>
                            <FormattedNumberInput
                                value={form.data.stock_qty}
                                onValueChange={(value) => form.setData('stock_qty', value)}
                                placeholder='cth: 35.000'
                            />
                        </Field>

                        <Field label="Qty Beli" error={form.errors.purchase_qty}>
                            <FormattedNumberInput
                                value={form.data.purchase_qty}
                                onValueChange={(value) => form.setData('purchase_qty', value)}
                                placeholder='cth: 35.000'
                            />
                        </Field>

                        <Field label="Tanggal Pembelian" error={form.errors.tgl_pembelian}>
                            <Input
                                type="date"
                                value={form.data.tgl_pembelian || ''}
                                onChange={(e) =>
                                    form.setData('tgl_pembelian', e.target.value)
                                }
                            />
                        </Field>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <Field label="Supplier" error={form.errors.supplier_id}>
                            <Select
                                value={form.data.supplier_id ? String(form.data.supplier_id) : ''}
                                onValueChange={(value) =>
                                    form.setData('supplier_id', Number(value))
                                }
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

                    <div className="rounded-xl border bg-slate-50 p-4">
                        <p className="text-xs text-slate-500">Total Harga PO Item</p>
                        <p className="mt-1 text-lg font-bold text-slate-900">
                            {formatRupiah(totalHarga)}
                        </p>
                    </div>

                    <Field label="Notes" error={form.errors.notes}>
                        <Textarea
                            rows={3}
                            value={form.data.notes || ''}
                            onChange={(e) => form.setData('notes', e.target.value)}
                            placeholder="Catatan pembelian, stok, vendor, atau kebutuhan tambahan..."
                        />
                    </Field>

                    <div className="flex justify-end gap-2 border-t pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Batal
                        </Button>

                        <Button type="submit" disabled={form.processing}>
                            Simpan PO Item
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

function MiniInfo({
    label,
    value,
    danger = false,
}: {
    label: string;
    value: React.ReactNode;
    danger?: boolean;
}) {
    return (
        <div className="rounded-xl border bg-white p-3">
            <p className="text-[10px] font-medium uppercase text-slate-400">
                {label}
            </p>
            <p
                className={`mt-1 font-semibold ${
                    danger ? 'text-amber-700' : 'text-slate-900'
                }`}
            >
                {value}
            </p>
        </div>
    );
}

export default EditPoDialog;