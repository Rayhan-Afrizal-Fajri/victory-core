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
    getInvoiceDpPercentage,
    getInvoiceDpRemaining,
    getInvoiceDpTotal,
    getInvoiceNumber,
    getPaymentProgress,
    getInvoiceStatusLabel,
    getInvoiceTotal,
    getRemainingPayment,
    getVerifiedPaid,
    invoiceStatusClass,
    isInvoiceCancelled,
    isInvoiceDpPaid,
    isInvoicePaid,
    isProductionInvoice,
} from './invoice-utils';
import { useCan } from '@/hooks/use-can';
import { Payment } from '@/pages/admin/job-tickets/types';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '../ui/dropdown-menu';

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

    const isProd = isProductionInvoice(invoice);
    const dpPercentage = isProd ? getInvoiceDpPercentage(invoice) : 50;
    const settlementPercentage = 100 - dpPercentage;
    const dpTotal = isProd ? getInvoiceDpTotal(invoice) : 0;
    const dpRemaining = isProd ? getInvoiceDpRemaining(invoice) : 0;
    const dpFulfilled = isProd ? isInvoiceDpPaid(invoice) : false;

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

                <div className="mt-2 flex items-center justify-between text-xs">
                    <p
                        className={`font-semibold ${
                            remaining <= 0 ? 'text-green-600' : 'text-red-500'
                        }`}
                    >
                        Sisa: {formatRupiah(remaining)}
                    </p>
                    {isProd && (
                        <span className="text-[11px] text-slate-500">
                            DP {dpPercentage}%: {formatRupiah(dpTotal)}
                        </span>
                    )}
                </div>

                {isProd && (
                    <div className="mt-2 rounded-lg border border-slate-100 bg-slate-50/70 p-2 text-xs">
                        <div className="flex items-center justify-between">
                            <span className="text-slate-600">Syarat DP ({dpPercentage}%)</span>
                            <span
                                className={`font-medium ${
                                    dpFulfilled ? 'text-emerald-600' : 'text-amber-700'
                                }`}
                            >
                                {dpFulfilled ? '✓ Terpenuhi' : `Kurang ${formatRupiah(dpRemaining)}`}
                            </span>
                        </div>
                    </div>
                )}
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

                {isProd ? (
                    <>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    className="min-w-27.5 flex-1"
                                >
                                    <Printer className="size-4" />
                                    Cetak
                                </Button>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                    onClick={() =>
                                        window.open(
                                            `/invoices/${invoice.id}/print?document=dp`,
                                            '_blank'
                                        )
                                    }
                                >
                                    Cetak DP ({dpPercentage}%)
                                </DropdownMenuItem>

                                <DropdownMenuItem
                                    onClick={() =>
                                        window.open(
                                            `/invoices/${invoice.id}/print?document=settlement`,
                                            '_blank'
                                        )
                                    }
                                >
                                    Cetak Pelunasan ({settlementPercentage}%)
                                </DropdownMenuItem>

                                <DropdownMenuItem
                                    onClick={() =>
                                        window.open(
                                            `/invoices/${invoice.id}/print?document=full`,
                                            '_blank'
                                        )
                                    }
                                >
                                    Cetak Invoice Keseluruhan
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </>
                ) : (
                    <Button type="button" variant="secondary" className="min-w-27.5 flex-1" onClick={() => window.open(`/invoices/${invoice.id}/print`, '_blank')}>
                        <Printer className="size-4" /> Cetak
                    </Button>
                )}

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

                {can('invoices.pay') && onPay && !isInvoicePaid(invoice) && !isInvoiceCancelled(invoice) && (
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