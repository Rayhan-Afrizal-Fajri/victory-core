import React from 'react';
import { CreditCard } from 'lucide-react';

import Field from './field';
import formatRupiah from '../ui/format-rupiah';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { getInvoiceCategoryLabel } from '../invoice/invoice-utils';
import FormattedNumberInput from '../ui/formatted-number-input';

const PaymentDialog = ({
    open,
    onOpenChange,
    invoice,
    paymentForm,
    remainingPayment,
    onSubmitPayment,
    mode = 'create',
    job,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    invoice: any;
    paymentForm: any;
    remainingPayment: number;
    onSubmitPayment: (e: React.FormEvent) => void;
    mode?: 'create' | 'edit';
    job?: any;
}) => {

    const categoryLabel = getInvoiceCategoryLabel(invoice);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>
                        {mode === 'edit' ? 'Edit Payment' : 'Submit Payment'} {categoryLabel && <span className="text-sm text-slate-500">({categoryLabel})</span>}
                    </DialogTitle>

                    <DialogDescription>
                        {mode === 'edit'
                            ? 'Perbarui data payment. Payment rejected akan kembali menjadi pending setelah diedit.'
                            : (
                                <>
                                    Payment untuk invoice{' '}
                                    <span className="font-medium text-slate-700">
                                        {invoice?.no_invoice || invoice?.title || '-'}
                                    </span>{' '}
                                    akan masuk sebagai pending sampai diverifikasi finance/admin.
                                </>
                            )}
                    </DialogDescription>
                    {categoryLabel === 'Production' && (
                        <p className="mt-2 rounded-md bg-yellow-50 p-2 text-sm text-yellow-700 border border-yellow-200">
                            Untuk pembayaran produksi, minimal jumlah bayar adalah 50% dari sisa tagihan.
                        </p>
                    )}
                </DialogHeader>

                <form onSubmit={onSubmitPayment} className="space-y-4">
                    <div className="rounded-2xl border bg-slate-50 p-4">
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-slate-500">Sisa Tagihan</p>
                            <p className="font-bold text-red-500">
                                {formatRupiah(remainingPayment)}
                            </p>
                        </div>
                    </div>
                    {invoice?.kategori_invoice === 'production' && !job?.workflow_status?.production_dp_paid && (
                        <div className="rounded-2xl border bg-slate-50 p-4">
                            <div className="flex items-center justify-between">
                                <p className="text-sm text-slate-500">Minimal Bayar</p>
                                <p className="font-bold text-red-500">
                                    {formatRupiah(remainingPayment * 0.5)}
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="grid gap-3 md:grid-cols-3">
                        <Field label="Tanggal Bayar" error={paymentForm.errors.tgl_bayar}>
                            <Input
                                type="date"
                                value={paymentForm.data.tgl_bayar}
                                onChange={(e) =>
                                    paymentForm.setData('tgl_bayar', e.target.value)
                                }
                            />
                        </Field>

                        <Field label="Jumlah Bayar" error={paymentForm.errors.jumlah_bayar}>
                            <FormattedNumberInput
                                min={0}
                                value={paymentForm.data.jumlah_bayar}
                                onValueChange={(value) => paymentForm.setData('jumlah_bayar', value)}
                                placeholder='cth: 35.000'
                            />
                        </Field>

                        <Field
                            label="Metode"
                            error={paymentForm.errors.metode_pembayaran}
                        >
                            <Input
                                type="text"
                                placeholder="Transfer BCA / Mandiri / Cash"
                                value={paymentForm.data.metode_pembayaran}
                                onChange={(e) =>
                                    paymentForm.setData('metode_pembayaran', e.target.value)
                                }
                            />
                        </Field>
                    </div>

                    <Field label="Bukti Transfer" error={paymentForm.errors.bukti_transfer}>
                        <Input
                            type="file"
                            accept="image/*,.pdf"
                            onChange={(e) =>
                                paymentForm.setData(
                                    'bukti_transfer',
                                    e.target.files?.[0] || null
                                )
                            }
                        />

                        {mode === 'edit' && (
                            <p className="mt-1 text-xs text-slate-500">
                                Kosongkan jika tidak ingin mengganti bukti transfer.
                            </p>
                        )}
                    </Field>

                    <Field label="Catatan" error={paymentForm.errors.catatan_finance}>
                        <Textarea
                            rows={3}
                            value={paymentForm.data.catatan_finance}
                            onChange={(e) =>
                                paymentForm.setData('catatan_finance', e.target.value)
                            }
                            placeholder="Catatan tambahan pembayaran..."
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

                        <Button type="submit" disabled={paymentForm.processing}>
                            <CreditCard className="mr-2 size-4" />
                            {mode === 'edit' ? 'Update Payment' : 'Submit Payment'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default PaymentDialog;