import SectionCard from "@/pages/admin/job-tickets/components/SectionCard";
import Badge from "./badge";
import formatRupiah from "../ui/format-rupiah";
import { Button } from "../ui/button";
import {
    CheckCircle2,
    Clock,
    CreditCard,
    Eye,
    FileImage,
    PackageCheck,
    RefreshCcw,
    Truck,
    XCircle,
} from 'lucide-react';
import { useMemo, useState } from "react";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';

const statusLabel: Record<string, string> = {
    draft: 'Draft',
    waiting_payment: 'Menunggu Pembayaran',
    paid: 'Sudah Dibayar',
    in_delivery: 'Dalam Pengiriman',
    delivered: 'Sudah Diterima',
    approved: 'Disetujui',
    revision_needed: 'Butuh Revisi',
    rejected: 'Ditolak',
};

const statusClass: Record<string, string> = {
    draft: 'border-slate-200 bg-slate-100 text-slate-700',
    waiting_payment: 'border-amber-200 bg-amber-50 text-amber-700',
    paid: 'border-blue-200 bg-blue-50 text-blue-700',
    in_delivery: 'border-indigo-200 bg-indigo-50 text-indigo-700',
    delivered: 'border-purple-200 bg-purple-50 text-purple-700',
    approved: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    revision_needed: 'border-amber-200 bg-amber-50 text-amber-700',
    rejected: 'border-red-200 bg-red-50 text-red-700',
};

const invoiceStatusClass: Record<string, string> = {
    unpaid: 'border-red-200 bg-red-50 text-red-700',
    partially_paid: 'border-amber-200 bg-amber-50 text-amber-700',
    paid: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    cancelled: 'border-slate-200 bg-slate-100 text-slate-700',
};

function getInvoiceTotal(sample: any) {
    return Number(sample?.invoice?.total_tagihan || sample.invoice?.amount || 0);
}

function getVerifiedPaid(sample: any) {
    const payments = sample?.invoice?.payments || [];

    return payments
        .filter((payment: any) => payment.status === 'verified')
        .reduce((total: number, payment: any) => {
            return total + Number(payment.jumlah_bayar || 0);
        }, 0);
}

function getPaymentProgress(sample: any) {
    const total = getInvoiceTotal(sample);
    const paid = getVerifiedPaid(sample);

    if (!total || total <= 0) {
        return sample?.is_chargeable === false ? 100 : 0;
    }

    return Math.min(Math.max((paid / total) * 100, 0), 100);
}

function getSampleStatusIcon(status: string) {
    if (status === 'approved') return <CheckCircle2 className="size-4" />
    if (status === 'revision_needed') return <RefreshCcw className="size-4" />
    if (status === 'rejected') return <XCircle className="size-4" />
    if (status === 'in_delivery') return <Truck className="size-4" />
    if (status === 'delivered') return <PackageCheck className="size-4" />

    return <Clock className="size-4" />
}

const SampleHistoryCard = ({
    samples,
    activeSampleId,
} : {
    samples: any[];
    activeSampleId?: number | null
}) => {
    const [selectedSample, setSelectedSample] = useState<any | null>(null);

    const orderedSamples = useMemo(() => {
        return [...samples].sort((a, b) => {
            const revisionA = Number(a.revision_number ?? 0);
            const revisionB = Number(b.revision_number ?? 0);

            if (revisionA !== revisionB) {
                return revisionB - revisionA;
            }

            return Number(b.id ?? 0) - Number(a.id ?? 0);
        });
    }, [samples]);
    
    return (
        <>
            <SectionCard title="Riwayat Sample">
                <div className="space-y-3">
                    {orderedSamples.map((item, index) => {

                        const isActive = item.id === activeSampleId;
                        const invoice = item.invoice || null;
                        const paymentProgress = getPaymentProgress(item);
                        const totalInvoice = getInvoiceTotal(item);
                        const verifiedPaid = getVerifiedPaid(item);
                        const remainingPayment = Math.max(totalInvoice - verifiedPaid, 0);
                        const mediaCount = item.media?.length || 0;
                        const isLatest = index === 0;

                        return (
                            <div
                                key={item.id}
                                className={`rounded-2xl border p-4 transition ${
                                    isActive
                                        ? 'border-emerald-200 bg-emerald-50/70'
                                        : 'bg-white hover:bg-slate-50'
                                }`}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <p className="text-sm font-semibold text-slate-900">
                                                Sample #{item.revision_number ?? 0}
                                            </p>

                                            {isActive && (
                                                <Badge className="border-emerald-200 bg-emerald-100 text-emerald-700">
                                                    Active
                                                </Badge>
                                            )}

                                            {!isActive && isLatest && (
                                                <Badge className="border-blue-200 bg-blue-50 text-blue-700">
                                                    Latest
                                                </Badge>
                                            )}
                                        </div>

                                        <p className="mt-1 text-xs text-slate-500">
                                            Qty {item.qty} pcs • {formatRupiah(item.sample_price || 0)}
                                        </p>
                                    </div>

                                    <Badge
                                        className={
                                            statusClass[item.status] ||
                                            'border-slate-200 bg-slate-100 text-slate-700'
                                        }
                                    >
                                        <span className="inline-flex items-center gap-1">
                                            {getSampleStatusIcon(item.status)}
                                            {statusLabel[item.status] || item.status}
                                        </span>
                                    </Badge>
                                </div>

                                <div className="mt-4 grid gap-2 text-xs sm:grid-cols-3">
                                    <div className="rounded-xl border bg-white/80 p-3">
                                        <p className="text-slate-500">Invoice</p>
                                        <p className="mt-1 font-semibold text-slate-800">
                                            {invoice
                                                ? invoice.no_invoice || invoice.title || 'Invoice Sample'
                                                : item.is_chargeable === false
                                                    ? 'Tanpa Invoice'
                                                    : '-'}
                                        </p>

                                        {invoice && (
                                            <Badge
                                                className={`mt-2 ${
                                                    invoiceStatusClass[invoice.status_tagihan] ||
                                                    'border-slate-200 bg-slate-100 text-slate-700'
                                                }`}
                                            >
                                                {invoice.status_tagihan || '-'}
                                            </Badge>
                                        )}
                                    </div>

                                    <div className="rounded-xl border bg-white/80 p-3">
                                        <p className="text-slate-500">Payment</p>
                                        <p className="mt-1 font-semibold text-slate-800">
                                            {formatRupiah(verifiedPaid)}
                                        </p>

                                        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                                            <div
                                                className="h-full rounded-full bg-emerald-500"
                                                style={{ width: `${paymentProgress}%` }}
                                            />
                                        </div>

                                        <p
                                            className={`mt-1 ${
                                                remainingPayment <= 0
                                                    ? 'text-emerald-600'
                                                    : 'text-red-500'
                                            }`}
                                        >
                                            Sisa: {formatRupiah(remainingPayment)}
                                        </p>
                                    </div>

                                    <div className="rounded-xl border bg-white/80 p-3">
                                        <p className="text-slate-500">Media & Delivery</p>
                                        <div className="mt-1 flex flex-col gap-1 font-semibold text-slate-800">
                                            <span className="inline-flex items-center gap-1">
                                                <FileImage className="size-3.5 text-slate-400" />
                                                {mediaCount} foto
                                            </span>
                                            <span className="inline-flex items-center gap-1">
                                                <Truck className="size-3.5 text-slate-400" />
                                                {item.delivery?.status || 'Belum dikirim'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {item.customer_review_note && (
                                    <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                                        <p className="font-semibold">Catatan Customer</p>
                                        <p className="mt-1">{item.customer_review_note}</p>
                                    </div>
                                )}

                                <div className="mt-4 flex justify-end">
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="secondary"
                                        onClick={() => setSelectedSample(item)}
                                    >
                                        <Eye className="size-4" />
                                        Detail
                                    </Button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </SectionCard>

            <SampleHistoryDetailSheet
                sample={selectedSample}
                open={Boolean(selectedSample)}
                onOpenChange={(open) => {
                    if (!open) setSelectedSample(null);
                }}
            />
        </>
    );
};

function SampleHistoryDetailSheet({
    sample,
    open,
    onOpenChange,
}: {
    sample: any | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    if (!sample) return null;

    const invoice = sample.invoice || null;

    console.log(invoice, sample);
    const payments = invoice?.payments || [];
    const media = sample.media || [];
    const totalInvoice = getInvoiceTotal(sample);
    const verifiedPaid = getVerifiedPaid(sample);
    const remainingPayment = Math.max(totalInvoice - verifiedPaid, 0);
    const paymentProgress = getPaymentProgress(sample);

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="overflow-y-auto sm:max-w-xl lg:max-w-2xl">
                <SheetHeader className="border-b pb-4">
                    <SheetTitle>
                        Detail Sample #{sample.revision_number ?? 0}
                    </SheetTitle>
                    <SheetDescription>
                        Detail riwayat sample, invoice, payment, media, dan pengiriman.
                    </SheetDescription>
                </SheetHeader>

                <div className="space-y-5 py-5">
                    <div className="rounded-2xl border bg-white p-4">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="text-xs font-medium uppercase text-slate-400">
                                    Sample
                                </p>
                                <p className="mt-1 text-lg font-bold text-slate-900">
                                    Sample #{sample.revision_number ?? 0}
                                </p>
                                <p className="mt-1 text-xs text-slate-500">
                                    Qty {sample.qty} pcs • {formatRupiah(sample.sample_price || 0)}
                                </p>
                            </div>

                            <Badge
                                className={
                                    statusClass[sample.status] ||
                                    'border-slate-200 bg-slate-100 text-slate-700'
                                }
                            >
                                {statusLabel[sample.status] || sample.status}
                            </Badge>
                        </div>

                        {sample.catatan && (
                            <div className="mt-4 rounded-xl border bg-slate-50 p-3 text-sm text-slate-700">
                                <p className="mb-1 text-xs font-semibold uppercase text-slate-500">
                                    Catatan Internal
                                </p>
                                {sample.catatan}
                            </div>
                        )}

                        {sample.customer_review_note && (
                            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                                <p className="mb-1 text-xs font-semibold uppercase">
                                    Catatan Customer
                                </p>
                                {sample.customer_review_note}
                            </div>
                        )}
                    </div>

                    <div className="rounded-2xl border bg-white p-4">
                        <div className="mb-3 flex items-center gap-2">
                            <CreditCard className="size-4 text-slate-500" />
                            <p className="font-semibold text-slate-800">
                                Invoice & Payment
                            </p>
                        </div>

                        {!invoice ? (
                            <div className="rounded-xl border bg-slate-50 p-4 text-sm text-slate-600">
                                {sample.is_chargeable === false
                                    ? 'Sample ini dibuat tanpa invoice.'
                                    : 'Invoice belum tersedia.'}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="font-semibold text-slate-900">
                                            {invoice.no_invoice || invoice.title || 'Invoice Sample'}
                                        </p>
                                        <p className="mt-1 text-xs text-slate-500">
                                            Jatuh tempo: {invoice.tgl_jatuh_tempo || '-'}
                                        </p>
                                    </div>

                                    <Badge
                                        className={
                                            invoiceStatusClass[invoice.status_tagihan] ||
                                            'border-slate-200 bg-slate-100 text-slate-700'
                                        }
                                    >
                                        {invoice.status_tagihan || '-'}
                                    </Badge>
                                </div>

                                <div className="grid gap-3 sm:grid-cols-3">
                                    <SummaryBox
                                        label="Total"
                                        value={formatRupiah(totalInvoice)}
                                    />
                                    <SummaryBox
                                        label="Terbayar"
                                        value={formatRupiah(verifiedPaid)}
                                    />
                                    <SummaryBox
                                        label="Sisa"
                                        value={formatRupiah(remainingPayment)}
                                        danger={remainingPayment > 0}
                                    />
                                </div>

                                <div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-slate-500">
                                            Progress Payment
                                        </span>
                                        <span className="font-medium">
                                            {Math.round(paymentProgress)}%
                                        </span>
                                    </div>

                                    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                                        <div
                                            className="h-full rounded-full bg-emerald-500"
                                            style={{ width: `${paymentProgress}%` }}
                                        />
                                    </div>
                                </div>

                                {payments.length > 0 && (
                                    <div className="space-y-2">
                                        <p className="text-xs font-semibold uppercase text-slate-500">
                                            Riwayat Payment
                                        </p>

                                        {payments.map((payment: any) => (
                                            <div
                                                key={payment.id}
                                                className="rounded-xl border bg-slate-50 p-3"
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div>
                                                        <p className="font-semibold text-slate-900">
                                                            {formatRupiah(payment.jumlah_bayar || 0)}
                                                        </p>
                                                        <p className="mt-1 text-xs text-slate-500">
                                                            {payment.tgl_bayar || '-'} • {payment.metode_pembayaran || '-'}
                                                        </p>
                                                    </div>

                                                    <Badge>
                                                        {payment.status || 'pending'}
                                                    </Badge>
                                                </div>

                                                {payment.rejection_note && (
                                                    <p className="mt-2 rounded-lg bg-red-50 p-2 text-xs text-red-700">
                                                        {payment.rejection_note}
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="rounded-2xl border bg-white p-4">
                        <p className="mb-3 font-semibold text-slate-800">
                            Foto Sample
                        </p>

                        {media.length === 0 ? (
                            <div className="rounded-xl border bg-slate-50 p-4 text-sm text-slate-600">
                                Belum ada foto sample.
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-3">
                                {media.map((item: any) => (
                                    <a
                                        key={item.id}
                                        href={`/storage/${item.file_path}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="group overflow-hidden rounded-xl border bg-slate-100"
                                    >
                                        <img
                                            src={`/storage/${item.file_path}`}
                                            alt="Sample"
                                            className="aspect-square w-full object-cover transition group-hover:scale-105"
                                        />
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="rounded-2xl border bg-white p-4">
                        <p className="mb-3 font-semibold text-slate-800">
                            Delivery
                        </p>

                        {!sample.delivery ? (
                            <div className="rounded-xl border bg-slate-50 p-4 text-sm text-slate-600">
                                Sample belum dikirim.
                            </div>
                        ) : (
                            <div className="space-y-2 text-sm">
                                <InfoLine label="Courier" value={sample.delivery.courier_name || '-'} />
                                <InfoLine label="Resi" value={sample.delivery.tracking_number || '-'} />
                                <InfoLine label="Status" value={sample.delivery.status || '-'} />
                                <InfoLine label="Catatan" value={sample.delivery.delivery_note || '-'} />

                                {sample.delivery.tracking_url && (
                                    <a
                                        href={sample.delivery.tracking_url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-block text-sm font-medium text-blue-600 hover:underline"
                                    >
                                        Buka Tracking
                                    </a>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}

function SummaryBox({
    label,
    value,
    danger = false,
}: {
    label: string;
    value: React.ReactNode;
    danger?: boolean;
}) {
    return (
        <div className="rounded-xl border bg-slate-50 p-3">
            <p className="text-xs text-slate-500">{label}</p>
            <p className={`mt-1 font-semibold ${danger ? 'text-red-500' : 'text-slate-900'}`}>
                {value}
            </p>
        </div>
    );
}

function InfoLine({
    label,
    value,
}: {
    label: string;
    value: React.ReactNode;
}) {
    return (
        <div className="flex items-start justify-between gap-4 rounded-xl border bg-slate-50 p-3">
            <span className="text-slate-500">{label}</span>
            <span className="text-right font-medium text-slate-800">{value}</span>
        </div>
    );
}

export default SampleHistoryCard;