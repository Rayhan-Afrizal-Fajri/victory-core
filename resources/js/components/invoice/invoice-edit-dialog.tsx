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

import { getInvoiceNumber } from './invoice-utils';

const InvoiceEditDialog = ({
    open,
    onOpenChange,
    invoice,
    invoiceForm,
    onSubmit,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    invoice: any | null;
    invoiceForm: any;
    onSubmit: (e: React.FormEvent) => void;
}) => {
    if (!invoice) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>Edit Invoice</DialogTitle>
                    <DialogDescription>
                        Edit nominal dan jatuh tempo invoice selama belum ada payment terverifikasi.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={onSubmit} className="space-y-4">
                    <div className="rounded-2xl border bg-slate-50 p-4">
                        <p className="text-xs text-slate-500">Invoice</p>
                        <p className="mt-1 font-semibold text-slate-900">
                            {getInvoiceNumber(invoice)}
                        </p>
                    </div>

                    <Field label="Total Tagihan" error={invoiceForm.errors.total_tagihan}>
                        <Input
                            type="number"
                            min={0}
                            value={invoiceForm.data.total_tagihan}
                            onChange={(e) =>
                                invoiceForm.setData('total_tagihan', Number(e.target.value))
                            }
                        />
                    </Field>

                    <Field label="Tanggal Jatuh Tempo" error={invoiceForm.errors.tgl_jatuh_tempo}>
                        <Input
                            type="date"
                            value={invoiceForm.data.tgl_jatuh_tempo || ''}
                            onChange={(e) =>
                                invoiceForm.setData('tgl_jatuh_tempo', e.target.value)
                            }
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

                        <Button type="submit" disabled={invoiceForm.processing}>
                            Simpan Perubahan
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default InvoiceEditDialog;