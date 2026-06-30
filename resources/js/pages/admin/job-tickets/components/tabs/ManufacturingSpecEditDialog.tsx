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
import { Textarea } from '@/components/ui/textarea';
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

function ManufacturingSpecEditDialog({
    open,
    onOpenChange,
    spec,
    form,
    suppliers,
    onSubmit,
    mode = 'edit',
    enableProcessBehavior = false,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    spec: any | null;
    form: any;
    suppliers: SupplierOption[];
    onSubmit: (e: React.FormEvent) => void;
    mode?: 'create' | 'edit';
    enableProcessBehavior?: boolean;
}) {
    const isCreate = mode === 'create';

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>
                        {isCreate ? 'Tambah Manufaktur' : 'Edit Manufaktur'}
                    </DialogTitle>

                    <DialogDescription>
                        {isCreate
                            ? 'Tambahkan proses manufaktur manual untuk costing dan produksi.'
                            : 'Perbarui work, pemakaian, vendor, dan estimasi biaya.'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={onSubmit} className="space-y-4">
                    <Field
                        label="Nama Work"
                        error={form.errors.work_name_snapshot}
                    >
                        <Input
                            value={form.data.work_name_snapshot || ''}
                            onChange={(e) =>
                                form.setData(
                                    'work_name_snapshot',
                                    e.target.value,
                                )
                            }
                            placeholder="Contoh: Cutting / Jahit / Sablon / QC / Packing"
                        />
                    </Field>

                    {!isCreate && spec && (
                        <div className="rounded-xl border bg-slate-50 p-4">
                            <p className="text-xs text-slate-500">
                                Work Aktif
                            </p>
                            <p className="mt-1 font-semibold text-slate-900">
                                {spec.work_name_snapshot ||
                                    spec.work_name ||
                                    '-'}
                            </p>
                        </div>
                    )}

                    <div className="grid gap-4 md:grid-cols-2">
                        <Field label="Pemakaian" error={form.errors.usage}>
                            <FormattedNumberInput
                                value={form.data.usage}
                                allowDecimal
                                onValueChange={(value) =>
                                    form.setData('usage', value)
                                }
                                placeholder="cth: 1"
                            />
                        </Field>

                        <Field label="Unit" error={form.errors.unit}>
                            <Input
                                value={form.data.unit || ''}
                                onChange={(e) =>
                                    form.setData('unit', e.target.value)
                                }
                                placeholder="pcs / jam / set"
                            />
                        </Field>
                    </div>

                    <Field
                        label="Keterangan Pemakaian"
                        error={form.errors.usage_note}
                    >
                        <Textarea
                            rows={2}
                            value={form.data.usage_note || ''}
                            onChange={(e) =>
                                form.setData('usage_note', e.target.value)
                            }
                            placeholder="Contoh: biaya jahit per pcs / cutting per set"
                        />
                    </Field>

                    <Field label="Vendor" error={form.errors.vendor_id}>
                        {/* <Select1
                            value={
                                form.data.vendor_id
                                    ? String(form.data.vendor_id)
                                    : ''
                            }
                            onValueChange={(value) =>
                                form.setData('vendor_id', Number(value))
                            }
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Pilih vendor" />
                            </SelectTrigger>

                            <SelectContent>
                                {suppliers.map((supplier) => (
                                    <SelectItem
                                        key={supplier.id}
                                        value={String(supplier.id)}
                                    >
                                        {(supplier.nama_perusahaan ||
                                            supplier.nama ||
                                            'Vendor') +
                                            (supplier.kategori
                                                ? ` — ${supplier.kategori}`
                                                : '')}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select1> */}
                        <Select
                            className='text-sm rounded-full'
                            classNamePrefix='select'
                            options={suppliers}
                            value={
                                suppliers?.find(
                                    x => x.value === form.data.vendor_id
                                )
                            }
                            onChange={(option) => {
                                form.setData('vendor_id', Number(option?.value ?? ""))
                            }}
                            placeholder="Pilih supplier..."
                            isSearchable={true}
                        />
                    </Field>

                    <div className="grid gap-4 md:grid-cols-2">
                        <Field
                            label="Estimasi Minimal"
                            error={form.errors.min_estimate}
                        >
                            <FormattedNumberInput
                                value={form.data.min_estimate}
                                onValueChange={(value) =>
                                    form.setData('min_estimate', value)
                                }
                                placeholder="cth: 10.000"
                            />
                        </Field>

                        <Field
                            label="Estimasi Maksimal"
                            error={form.errors.max_estimate}
                        >
                            <FormattedNumberInput
                                value={form.data.max_estimate}
                                onValueChange={(value) =>
                                    form.setData('max_estimate', value)
                                }
                                placeholder="cth: 15.000"
                            />
                        </Field>
                    </div>

                    {enableProcessBehavior && (
                        <Field
                            label="Behavior"
                            error={form.errors.process_behavior}
                        >
                            <Select1
                                value={
                                    form.data.process_behavior ||
                                    'production_process'
                                }
                                onValueChange={(value) =>
                                    form.setData('process_behavior', value)
                                }
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Pilih behavior" />
                                </SelectTrigger>

                                <SelectContent>
                                    <SelectItem value="production_process">
                                        Production Process
                                    </SelectItem>
                                    <SelectItem value="costing_only">
                                        Costing Only
                                    </SelectItem>
                                </SelectContent>
                            </Select1>

                            <p className="mt-1 text-xs text-slate-500">
                                Costing Only cocok untuk QC/Packing agar masuk
                                costing tapi tidak menjadi proses produksi
                                ganda.
                            </p>
                        </Field>
                    )}

                    <div className="rounded-xl border bg-slate-50 p-4">
                        <p className="text-xs text-slate-500">
                            Estimasi Costing
                        </p>
                        <p className="mt-1 text-sm text-slate-600">
                            Cost per pcs = pemakaian × estimasi maksimal.
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

export default ManufacturingSpecEditDialog;