import {
    CreditCard,
    Edit,
    Eye,
    Printer,
    XCircle,
} from 'lucide-react';

import Badge from '@/components/sample/badge';
import formatRupiah from '@/components/ui/format-rupiah';
import { Button } from '@/components/ui/button';

import {
    getInvoiceCategoryLabel,
    getInvoiceNumber,
    getPaymentProgress,
    getInvoiceStatusLabel,
    getInvoiceTotal,
    getRemainingPayment,
    getVerifiedPaid,
    invoiceStatusClass,
    isInvoiceCancelled,
    isInvoicePaid,
} from './invoice-utils';
import { useCan } from '@/hooks/use-can';
import { Payment } from '@/pages/admin/job-tickets/types';

const InvoiceCard = ({
    invoice,
    onDetail,
    onPay,
    onEdit,
    onCancel,
    canPay = false,
    canEdit = false,
    canCancel = false,
}: {
    invoice: any;
    onDetail: (invoice: any) => void;
    onPay?: (invoice: any) => void;
    onEdit?: (invoice: any) => void;
    onCancel?: (invoice: any) => void;
    canPay?: boolean;
    canEdit?: boolean;
    canCancel?: boolean;
}) => {
    const can = useCan();

    const total = getInvoiceTotal(invoice);
    const paid = getVerifiedPaid(invoice);
    const remaining = getRemainingPayment(invoice);
    const progress = getPaymentProgress(invoice);
    const status = invoice.status_tagihan || invoice.status;

    const unverifiedPayment = invoice.payments?.filter((payment: Payment) => payment.status === 'pending') || [];

    return (
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900">
                            {getInvoiceNumber(invoice)}
                        </h3>

                        <Badge className="border-slate-200 bg-slate-100 text-slate-700">
                            {getInvoiceCategoryLabel(invoice)}
                        </Badge>
                    </div>

                    <p className="mt-1 text-xs font-light text-slate-500">
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

            <div className="mt-4">
                <div className="flex items-start justify-between gap-4">
                    <p className="text-xs font-light text-slate-500">
                        Terbayar: {formatRupiah(paid)}
                    </p>

                    <p className="text-xs font-semibold text-slate-900">
                        {formatRupiah(total)}
                    </p>
                </div>

                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                        className="h-full rounded-full bg-green-500 transition-all duration-500"
                        style={{
                            width: `${progress}%`,
                        }}
                    />
                </div>

                <p
                    className={`mt-2 text-xs font-semibold ${
                        remaining <= 0 ? 'text-green-600' : 'text-red-500'
                    }`}
                >
                    Sisa: {formatRupiah(remaining)}
                </p>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
                <Button
                    type="button"
                    variant="secondary"
                    className="min-w-27.5 flex-1"
                    onClick={() => onDetail(invoice)}
                >
                    <Eye className="size-4" />
                    Detail
                    {unverifiedPayment.length > 0 && (
                        <span className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                            {unverifiedPayment.length || 0}
                        </span>
                    )}
                </Button>

                <Button
                    type="button"
                    variant="secondary"
                    className="min-w-27.5 flex-1"
                    onClick={() => window.open(`/invoices/${invoice.id}/print`, '_blank')}
                >
                    <Printer className="size-4" />
                    Cetak
                </Button>

                {canEdit && can('payment.verify') && onEdit && !isInvoicePaid(invoice) && !isInvoiceCancelled(invoice) && (
                    <Button
                        type="button"
                        variant="secondary"
                        className="min-w-27.5 flex-1"
                        onClick={() => onEdit(invoice)}
                    >
                        <Edit className="size-4" />
                        Edit
                    </Button>
                )}

                {/* {canCancel && onCancel && !isInvoicePaid(invoice) && !isInvoiceCancelled(invoice) && (
                    <Button
                        type="button"
                        variant="outline"
                        className="min-w-27.5 flex-1 border-red-200 text-red-700 hover:bg-red-50"
                        onClick={() => onCancel(invoice)}
                    >
                        <XCircle className="size-4" />
                        Cancel
                    </Button>
                )} */}

                {canPay && onPay && !isInvoicePaid(invoice) && !isInvoiceCancelled(invoice) && (
                    <Button
                        type="button"
                        className="min-w-27.5 flex-1"
                        onClick={() => onPay(invoice)}
                    >
                        <CreditCard className="size-4" />
                        Bayar
                    </Button>
                )}
            </div>
        </div>
    );
};

export default InvoiceCard;