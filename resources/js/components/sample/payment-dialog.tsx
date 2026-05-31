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

const PaymentDialog = ({
    open,
    onOpenChange,
    invoice,
    paymentForm,
    remainingPayment,
    onSubmitPayment,
    mode = 'create',
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    invoice: any;
    paymentForm: any;
    remainingPayment: number;
    onSubmitPayment: (e: React.FormEvent) => void;
    mode?: 'create' | 'edit';
}) => {

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>
                        {mode === 'edit' ? 'Edit Payment' : 'Submit Payment'}
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
                            <Input
                                type="number"
                                min={0}
                                step={1000}
                                value={paymentForm.data.jumlah_bayar}
                                onChange={(e) =>
                                    paymentForm.setData('jumlah_bayar', Number(e.target.value))
                                }
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