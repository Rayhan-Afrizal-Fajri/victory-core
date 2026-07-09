import {
    CheckCircle2,
    Clock,
    Edit,
    Trash2,
    XCircle,
} from 'lucide-react';

import Badge from '@/components/sample/badge';
import EmptyState from '@/components/sample/empty-state';
import formatRupiah from '@/components/ui/format-rupiah';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

import { paymentStatusClass } from './invoice-utils';
import { useCan } from '@/hooks/use-can';

const InvoicePaymentList = ({
    payments,
    rejectPaymentId,
    rejectPaymentForm,
    setRejectPaymentId,
    onVerifyPayment,
    onRejectPayment,
    onEditPayment,
    onDeletePayment,
}: {
    payments: any[];
    rejectPaymentId: number | null;
    rejectPaymentForm: any;
    setRejectPaymentId: (id: number | null) => void;
    onVerifyPayment: (paymentId: number) => void;
    onRejectPayment: (paymentId: number) => void;
    onEditPayment: (payment: any) => void;
    onDeletePayment: (payment: any) => void;
}) => {
    const can = useCan();

    if (payments.length === 0) {
        return (
            <EmptyState
                icon={<Clock className='size-5' />}
                title="Belum ada payment"
                description="Riwayat pembayaran invoice akan muncul di sini."
            />
        );
    }

    return (
        <div className="space-y-3">
            {payments.map((payment) => (
                <div key={payment.id} className="rounded-xl border p-3">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <div className="flex flex-wrap items-center gap-2">
                                <p className="font-semibold text-slate-900">
                                    {formatRupiah(payment.jumlah_bayar || payment.amount || 0)}
                                </p>

                                <Badge
                                    className={
                                        paymentStatusClass[payment.status || 'pending']
                                    }
                                >
                                    {payment.status || 'pending'}
                                </Badge>
                            </div>

                            <p className="mt-1 text-xs text-slate-500">
                                {payment.tgl_bayar || payment.date || '-'} •{' '}
                                {payment.metode_pembayaran || payment.method || '-'}
                            </p>

                            {payment.bukti_transfer_path && (
                                <a
                                    href={`/storage/${payment.bukti_transfer_path}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="mt-2 inline-block text-xs font-medium text-blue-600 hover:underline"
                                >
                                    Lihat bukti transfer
                                </a>
                            )}

                            {payment.rejection_note && (
                                <p className="mt-2 rounded-lg bg-red-50 p-2 text-xs text-red-700">
                                    {payment.rejection_note}
                                </p>
                            )}
                        </div>

                        {['pending', 'rejected'].includes(payment.status || 'pending') && (
                            <div className="flex shrink-0 flex-wrap gap-2">
                                {can('invoices.edit') && (
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={() => onEditPayment(payment)}
                                    >
                                        <Edit className="size-4" />
                                        Edit
                                    </Button>
                                )}

                                {can('invoices.delete') && (
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        className="border-red-200 text-red-700 hover:bg-red-50"
                                        onClick={() => onDeletePayment(payment)}
                                    >
                                        <Trash2 className="size-4" />
                                        Delete
                                    </Button>
                                )}

                                {can('invoices.verify') && payment.status === 'pending' && (
                                    <>
                                        <Button
                                            type="button"
                                            size="sm"
                                            className="bg-emerald-600 text-white hover:bg-emerald-700"
                                            onClick={() => onVerifyPayment(payment.id)}
                                        >
                                            <CheckCircle2 className="size-4" />
                                            Verify
                                        </Button>

                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            className="border-red-200 text-red-700 hover:bg-red-50"
                                            onClick={() => setRejectPaymentId(payment.id)}
                                        >
                                            <XCircle className="size-4" />
                                            Reject
                                        </Button>
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    {rejectPaymentId === payment.id && (
                        <div className="mt-3 space-y-2 rounded-xl border border-red-200 bg-red-50 p-3">
                            <Textarea
                                rows={2}
                                placeholder="Alasan payment ditolak..."
                                value={rejectPaymentForm.data.rejection_note}
                                onChange={(e) =>
                                    rejectPaymentForm.setData(
                                        'rejection_note',
                                        e.target.value
                                    )
                                }
                            />

                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setRejectPaymentId(null)}
                                >
                                    Batal
                                </Button>

                                <Button
                                    type="button"
                                    size="sm"
                                    className="bg-red-600 text-white hover:bg-red-700"
                                    disabled={rejectPaymentForm.processing}
                                    onClick={() => onRejectPayment(payment.id)}
                                >
                                    Tolak Payment
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export default InvoicePaymentList;