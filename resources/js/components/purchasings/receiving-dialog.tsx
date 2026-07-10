import React from 'react';

import Field from '@/components/sample/field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

import { getRemainingQty } from './purchasing-utils';
import FormattedNumberInput from '../ui/formatted-number-input';

const ReceivingDialog = ({
    open,
    onOpenChange,
    purchasing,
    form,
    onSubmit,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    purchasing: any | null;
    form: any;
    onSubmit: (e: React.FormEvent) => void;
}) => {
    if (!purchasing) return null;

    const remainingQty = getRemainingQty(purchasing);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>Receive Material</DialogTitle>
                    <DialogDescription>
                        Catat bahan yang diterima untuk kebutuhan sample dan production.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={onSubmit} className="space-y-4">
                    <div className="rounded-2xl border bg-slate-50 p-4">
                        <p className="text-xs text-slate-500">Material</p>
                        <p className="mt-1 font-semibold text-slate-900">
                            {purchasing.item || purchasing.item_bahan}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                            Sisa: {remainingQty} {purchasing.unit}
                        </p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <Field label="Qty Diterima" error={form.errors.received_qty}>
                            {/* <Input
                                type="number"
                                min={0}
                                step="0.01"
                                max={remainingQty}
                                value={form.data.received_qty}
                                onChange={(e) => form.setData('received_qty', Number(e.target.value))}
                            /> */}
                            <FormattedNumberInput
                                min={0}
                                // max={remainingQty}
                                value={form.data.received_qty}
                                onValueChange={(value) => form.setData('received_qty', value)}
                                placeholder='cth: 35.000'
                            />
                        </Field>

                        <Field label="Tanggal Terima" error={form.errors.received_at}>
                            <Input
                                type="date"
                                value={form.data.received_at}
                                onChange={(e) => form.setData('received_at', e.target.value)}
                            />
                        </Field>
                    </div>

                    <Field label="Catatan" error={form.errors.notes}>
                        <Textarea
                            rows={3}
                            value={form.data.notes}
                            onChange={(e) => form.setData('notes', e.target.value)}
                            placeholder="Catatan penerimaan material..."
                        />
                    </Field>

                    <div className="flex justify-end gap-2 border-t pt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Batal
                        </Button>

                        <Button type="submit" disabled={form.processing}>
                            Simpan Receiving
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default ReceivingDialog;