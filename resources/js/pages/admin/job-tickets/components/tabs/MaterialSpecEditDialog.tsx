import React from 'react';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select as Select1,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

import Select from 'react-select';

import Field from '@/components/sample/field';
import type { SupplierOption } from '../../types';
import FormattedNumberInput from '@/components/ui/formatted-number-input';

function MaterialSpecEditDialog({
    open,
    onOpenChange,
    spec,
    form,
    suppliers,
    onSubmit,
    mode = 'edit',
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    spec: any | null;
    form: any;
    suppliers: SupplierOption[];
    onSubmit: (e: React.FormEvent) => void;
    mode?: 'create' | 'edit';
}) {
    const isCreate = mode === 'create';

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle>
                        {isCreate
                            ? 'Tambah Bahan / Aksesoris'
                            : `Edit ${spec?.type === 'bahan' ? 'Bahan' : 'Aksesoris'}`}
                    </DialogTitle>

                    <DialogDescription>
                        {isCreate
                            ? 'Tambahkan spesifikasi bahan atau aksesoris manual.'
                            : 'Perbarui warna, pemakaian, vendor, pilihan harga, dan total costing.'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={onSubmit} className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <Field label="Tipe" error={form.errors.type}>
                            <Select1
                                value={form.data.type || 'bahan'}
                                onValueChange={(value) =>
                                    form.setData('type', value)
                                }
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Pilih tipe" />
                                </SelectTrigger>

                                <SelectContent>
                                    <SelectItem value="bahan">
                                        Bahan
                                    </SelectItem>
                                    <SelectItem value="aksesoris">
                                        Aksesoris
                                    </SelectItem>
                                </SelectContent>
                            </Select1>
                        </Field>

                        <Field
                            label="Nama Material"
                            error={form.errors.material_name_snapshot}
                        >
                            <Input
                                value={form.data.material_name_snapshot || ''}
                                onChange={(e) =>
                                    form.setData(
                                        'material_name_snapshot',
                                        e.target.value,
                                    )
                                }
                                placeholder="Contoh: Cotton Combed 20s / Label Size"
                            />
                        </Field>
                    </div>

                    {!isCreate && spec && (
                        <div className="rounded-xl border bg-slate-50 p-4">
                            <p className="text-xs text-slate-500">
                                Material Aktif
                            </p>
                            <p className="mt-1 font-semibold text-slate-900">
                                {spec.material_name_snapshot ||
                                    spec.material_name ||
                                    '-'}
                            </p>
                        </div>
                    )}

                    <div className="grid gap-4 md:grid-cols-3">
                        <Field label="Warna" error={form.errors.color}>
                            <Input
                                value={form.data.color || ''}
                                onChange={(e) =>
                                    form.setData('color', e.target.value)
                                }
                                placeholder="Contoh: Navy / Black"
                            />
                        </Field>

                        <Field label="Pemakaian / pcs" error={form.errors.usage}>
                            <FormattedNumberInput
                                value={form.data.usage}
                                allowDecimal
                                onValueChange={(value) =>
                                    form.setData('usage', value)
                                }
                                placeholder="cth: 0,5"
                            />
                        </Field>

                        <Field label="Unit" error={form.errors.unit}>
                            <Input
                                value={form.data.unit || ''}
                                onChange={(e) =>
                                    form.setData('unit', e.target.value)
                                }
                                placeholder="meter / pcs / kg"
                            />
                        </Field>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <Field label="Supplier" error={form.errors.supplier_id}>
                            {/* <Select
                                value={
                                    form.data.supplier_id
                                        ? String(form.data.supplier_id)
                                        : ''
                                }
                                onValueChange={(value) =>
                                    form.setData('supplier_id', Number(value))
                                }
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Pilih supplier" />
                                </SelectTrigger>

                                <SelectContent>
                                    {suppliers.map((supplier) => (
                                        <SelectItem
                                            key={supplier.id}
                                            value={String(supplier.id)}
                                        >
                                            {(supplier.nama_perusahaan ||
                                                supplier.nama ||
                                                'Supplier') +
                                                (supplier.kategori
                                                    ? ` — ${supplier.kategori}`
                                                    : '')}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select> */}
                            <Select
                                className='text-sm rounded-full'
                                classNamePrefix='select'
                                options={suppliers}
                                value={
                                    suppliers?.find(
                                        x => x.value === form.data.supplier_id
                                    )
                                }
                                onChange={(option) => {
                                    form.setData('supplier_id', Number(option?.value ?? ""))
                                }}
                                placeholder="Pilih supplier..."
                                isSearchable={true}
                            />
                        </Field>

                        <Field label="Pilihan Harga" error={form.errors.price_type}>
                            <Select1
                                value={form.data.price_type || 'ecer'}
                                onValueChange={(value) =>
                                    form.setData('price_type', value)
                                }
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Pilih harga" />
                                </SelectTrigger>

                                <SelectContent>
                                    <SelectItem value="ecer">Ecer</SelectItem>
                                    <SelectItem value="roll">Roll</SelectItem>
                                </SelectContent>
                            </Select1>
                        </Field>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                        <Field label="Harga Ecer" error={form.errors.harga_ecer}>
                            <FormattedNumberInput
                                value={form.data.harga_ecer}
                                onValueChange={(value) =>
                                    form.setData('harga_ecer', value)
                                }
                                placeholder="cth: 35.000"
                            />
                        </Field>

                        <Field label="Harga Roll" error={form.errors.harga_roll}>
                            <FormattedNumberInput
                                value={form.data.harga_roll}
                                onValueChange={(value) =>
                                    form.setData('harga_roll', value)
                                }
                                placeholder="cth: 350.000"
                            />
                        </Field>

                        <Field label="Isi Roll" error={form.errors.roll_qty}>
                            <FormattedNumberInput
                                value={form.data.roll_qty}
                                allowDecimal
                                onValueChange={(value) =>
                                    form.setData('roll_qty', value)
                                }
                                placeholder="cth: 25"
                            />
                        </Field>
                    </div>

                    <div className="rounded-xl border bg-slate-50 p-4">
                        <p className="text-xs text-slate-500">
                            Estimasi Costing
                        </p>
                        <p className="mt-1 text-sm text-slate-600">
                            Costing akan dihitung ulang otomatis setelah data
                            disimpan.
                        </p>
                    </div>

                    <div className="flex justify-end gap-2 border-t pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Batal
                        </Button>

                        <Button type="submit" disabled={form.processing}>
                            {isCreate ? 'Tambah Spec' : 'Simpan Perubahan'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export default MaterialSpecEditDialog;