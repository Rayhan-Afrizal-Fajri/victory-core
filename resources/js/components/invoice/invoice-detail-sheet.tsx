import {
    CreditCard,
    Edit,
    FileText,
    Printer,
    XCircle,
} from 'lucide-react';

import Badge from '@/components/sample/badge';
import InfoItem from '@/components/sample/info-item';
import formatRupiah from '@/components/ui/format-rupiah';
import { Button } from '@/components/ui/button';

import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';

import InvoicePaymentList from './invoice-payment-list';

import {
    getInvoiceNumber,
    getInvoicePayments,
    getPaymentProgress,
    getInvoiceStatusLabel,
    getInvoiceTotal,
    getRemainingPayment,
    getVerifiedPaid,
    invoiceStatusClass,
} from './invoice-utils';
import { useCan } from '@/hooks/use-can';

const InvoiceDetailSheet = ({
    open,
    onOpenChange,
    invoice,
    canPay,
    canEdit,
    canCancel,
    rejectPaymentId,
    rejectPaymentForm,
    setRejectPaymentId,
    onPay,
    onEdit,
    onCancel,
    onVerifyPayment,
    onRejectPayment,
    onEditPayment,
    onDeletePayment,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    invoice: any | null;
    canPay: boolean;
    canEdit: boolean;
    canCancel: boolean;
    rejectPaymentId: number | null;
    rejectPaymentForm: any;
    setRejectPaymentId: (id: number | null) => void;
    onPay: (invoice: any) => void;
    onEdit: (invoice: any) => void;
    onCancel: (invoice: any) => void;
    onVerifyPayment: (paymentId: number) => void;
    onRejectPayment: (paymentId: number) => void;
    onEditPayment: (payment: any) => void;
    onDeletePayment: (payment: any) => void;
}) => {
    const can = useCan();

    if (!invoice) return null;
    

    const status = invoice.status_tagihan || invoice.status;
    const payments = getInvoicePayments(invoice);
    const total = getInvoiceTotal(invoice);
    const paid = getVerifiedPaid(invoice);
    const remaining = getRemainingPayment(invoice);
    const progress = getPaymentProgress(invoice);

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="overflow-y-auto sm:max-w-xl lg:max-w-2xl">
                <SheetHeader className="border-b pb-4">
                    <SheetTitle className="flex items-center gap-2">
                        <FileText className="size-5 text-slate-500" />
                        {getInvoiceNumber(invoice)}
                    </SheetTitle>

                    <SheetDescription>
                        Detail invoice, status pembayaran, dan riwayat payment.
                    </SheetDescription>
                </SheetHeader>

                <div className="space-y-5 py-5">
                    <div className="rounded-2xl border bg-white p-4">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-xs font-medium uppercase text-slate-400">
                                    Invoice
                                </p>

                                <p className="mt-1 font-semibold text-slate-900">
                                    {getInvoiceNumber(invoice)}
                                </p>

                                <p className="mt-1 text-xs text-slate-500">
                                    Jatuh tempo: {invoice.tgl_jatuh_tempo || invoice.issued_at || '-'}
                                </p>
                            </div>

                            <Badge
                                className={
                                    invoiceStatusClass[status] ||
                                    'bg-slate-100 text-slate-700 border-slate-200'
                                }
                            >
                                {getInvoiceStatusLabel(status)}
                            </Badge>
                        </div>

                        <div className="mt-5 grid gap-3 sm:grid-cols-3">
                            <InfoItem label="Total Tagihan" value={formatRupiah(total)} />
                            <InfoItem label="Terverifikasi" value={formatRupiah(paid)} />
                            <InfoItem label="Sisa Tagihan" value={formatRupiah(remaining)} />
                        </div>

                        <div className="mt-5">
                            <div className="flex justify-between text-xs">
                                <span className="text-slate-500">
                                    Progress pembayaran
                                </span>

                                <span className="font-medium text-slate-700">
                                    {Math.round(progress)}%
                                </span>
                            </div>

                            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                                <div
                                    className="h-full rounded-full bg-green-500 transition-all duration-500"
                                    style={{
                                        width: `${progress}%`,
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border bg-white p-4">
                        <div className="mb-3 flex items-center justify-between gap-3">
                            <div>
                                <p className="font-semibold text-slate-800">
                                    Riwayat Payment
                                </p>

                                <p className="mt-1 text-xs text-slate-500">
                                    Payment pending perlu diverifikasi finance/admin.
                                </p>
                            </div>

                            <span className="text-xs text-slate-500">
                                {payments.length} payment
                            </span>
                        </div>

                        <InvoicePaymentList
                            payments={payments}
                            rejectPaymentId={rejectPaymentId}
                            rejectPaymentForm={rejectPaymentForm}
                            setRejectPaymentId={setRejectPaymentId}
                            onVerifyPayment={onVerifyPayment}
                            onRejectPayment={onRejectPayment}
                            onEditPayment={onEditPayment}
                            onDeletePayment={onDeletePayment}
                        />
                    </div>

                    <div className="sticky bottom-0 border-t bg-white px-6 py-4">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <p className="text-xs text-slate-500">Sisa Tagihan</p>
                                <p
                                    className={`font-bold ${
                                        remaining <= 0 ? 'text-green-600' : 'text-red-500'
                                    }`}
                                >
                                    {formatRupiah(remaining)}
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={() =>
                                        window.open(`/invoices/${invoice.id}/print`, '_blank')
                                    }
                                >
                                    <Printer className="size-4" />
                                    Cetak
                                </Button>

                                {canEdit && (
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        onClick={() => onEdit(invoice)}
                                    >
                                        <Edit className="size-4" />
                                        Edit
                                    </Button>
                                )}

                                {canCancel && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="border-red-200 text-red-700 hover:bg-red-50"
                                        onClick={() => onCancel(invoice)}
                                    >
                                        <XCircle className="size-4" />
                                        Cancel
                                    </Button>
                                )}

                                {canPay && (
                                    <Button type="button" onClick={() => onPay(invoice)}>
                                        <CreditCard className="size-4" />
                                        Input Pembayaran
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
};

export default InvoiceDetailSheet;