import { Payment } from "@/pages/admin/job-tickets/types";
import { Clock, CreditCard, ReceiptText } from "lucide-react";
import Badge from "./badge";
import SectionCard from "@/pages/admin/job-tickets/components/SectionCard";
import InfoItem from "./info-item";
import formatRupiah from "../ui/format-rupiah";
import Field from "./field";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import EmptyState from "./empty-state";

const invoiceStatusClass: Record<string, string> = {
    Unpaid: 'bg-red-100 text-red-700 border-red-200',
    'Partially Paid': 'bg-amber-100 text-amber-700 border-amber-200',
    Paid: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    Cancelled: 'bg-slate-100 text-slate-700 border-slate-200',
};

const paymentStatusClass: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700 border-amber-200',
    verified: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    rejected: 'bg-red-100 text-red-700 border-red-200',
};

const SampleInvoicePaymentCard = ({
    invoice,
    payments,
    totalPaidVerified,
    remainingPayment,
    canSubmitPayment,
    paymentForm,
    rejectPaymentForm,
    rejectPaymentId,
    setRejectPaymentId,
    onSubmitPayment,
    onVerifyPayment,
    onRejectPayment,
}: {
    invoice: any;
    payments: Payment[];
    totalPaidVerified: number;
    remainingPayment: number;
    canSubmitPayment: boolean;
    paymentForm: any;
    rejectPaymentForm: any;
    rejectPaymentId: number | null;
    setRejectPaymentId: (id: number | null) => void;
    onSubmitPayment: (e: React.FormEvent) => void;
    onVerifyPayment: (paymentId: number) => void;
    onRejectPayment: (paymentId: number) => void;
}) => {
    return (
        <SectionCard title="Invoice & Payment Sample">
            <div className="rounded-2xl border bg-white p-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <ReceiptText className="size-5 text-slate-500" />
                            <p className="font-semibold text-slate-900">
                                {invoice.no_invoice || invoice.title}
                            </p>
                        </div>
                        <p className="mt-1 text-sm text-slate-500">
                            Jatuh tempo: {invoice.tgl_jatuh_tempo || '-'}
                        </p>
                    </div>

                    <Badge className={invoiceStatusClass[invoice.status_tagihan] || 'bg-slate-100 text-slate-700 border-slate-200'}>
                        {invoice.status_tagihan || invoice.status}
                    </Badge>
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-3">
                    <InfoItem label="Total Tagihan" value={formatRupiah(invoice.total_tagihan || invoice.amount)} />
                    <InfoItem label="Terverifikasi" value={formatRupiah(totalPaidVerified)} />
                    <InfoItem label="Sisa Tagihan" value={formatRupiah(remainingPayment)} />
                </div>
            </div>

            {canSubmitPayment && (
                <form onSubmit={onSubmitPayment} className="mt-4 space-y-4 rounded-2xl border bg-slate-50 p-4">
                    <div>
                        <p className="font-semibold text-slate-800">Submit Payment</p>
                        <p className="mt-1 text-xs text-slate-500">
                            Payment akan masuk sebagai pending sampai diverifikasi finance/admin.
                        </p>
                    </div>

                    <div className="grid gap-3 md:grid-cols-3">
                        <Field label="Tanggal Bayar" error={paymentForm.errors.tgl_bayar}>
                            <Input
                                type="date"
                                value={paymentForm.data.tgl_bayar}
                                onChange={(e) => paymentForm.setData('tgl_bayar', e.target.value)}
                            />
                        </Field>

                        <Field label="Jumlah Bayar" error={paymentForm.errors.jumlah_bayar}>
                            <Input
                                type="number"
                                value={paymentForm.data.jumlah_bayar}
                                onChange={(e) => paymentForm.setData('jumlah_bayar', Number(e.target.value))}
                            />
                        </Field>

                        <Field label="Metode" error={paymentForm.errors.metode_pembayaran}>
                            <Input
                                type="text"
                                placeholder="Transfer BCA / Mandiri / Cash"
                                value={paymentForm.data.metode_pembayaran}
                                onChange={(e) => paymentForm.setData('metode_pembayaran', e.target.value)}
                            />
                        </Field>
                    </div>

                    <Field label="Bukti Transfer" error={paymentForm.errors.bukti_transfer}>
                        <Input
                            type="file"
                            accept="image/*,.pdf"
                            onChange={(e) => paymentForm.setData('bukti_transfer', e.target.files?.[0] || null)}
                        />
                    </Field>

                    <Field label="Catatan" error={paymentForm.errors.catatan_finance}>
                        <Textarea
                            rows={2}
                            value={paymentForm.data.catatan_finance}
                            onChange={(e) => paymentForm.setData('catatan_finance', e.target.value)}
                            placeholder="Catatan tambahan pembayaran..."
                        />
                    </Field>

                    <Button type="submit" disabled={paymentForm.processing}>
                        <CreditCard className="mr-2 size-4" />
                        Submit Payment
                    </Button>
                </form>
            )}

            <div className="mt-4 rounded-2xl border bg-white p-4">
                <div className="mb-3 flex items-center justify-between">
                    <p className="font-semibold text-slate-800">Riwayat Payment</p>
                    <span className="text-xs text-slate-500">{payments.length} payment</span>
                </div>

                {payments.length === 0 ? (
                    <EmptyState
                        icon={<Clock className="size-5" />}
                        title="Belum ada payment"
                        description="Riwayat pembayaran sample akan muncul di sini."
                    />
                ) : (
                    <div className="space-y-3">
                        {payments.map((payment) => (
                            <div key={payment.id} className="rounded-xl border p-3">
                                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="font-semibold text-slate-900">
                                                {formatRupiah(payment.jumlah_bayar || 0)}
                                            </p>
                                            <Badge className={paymentStatusClass[payment.status || 'pending']}>
                                                {payment.status || 'pending'}
                                            </Badge>
                                        </div>
                                        <p className="mt-1 text-xs text-slate-500">
                                            {payment.tgl_bayar || '-'} • {payment.metode_pembayaran || '-'}
                                        </p>

                                        {payment.bukti_transfer_path && (
                                            <a
                                                href={`/storage/${payment.bukti_transfer_path}`}
                                                target="_blank"
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

                                    {payment.status === 'pending' && (
                                        <div className="flex shrink-0 gap-2">
                                            <Button
                                                type="button"
                                                size="sm"
                                                className="bg-emerald-600 text-white hover:bg-emerald-700"
                                                onClick={() => onVerifyPayment(payment.id)}
                                            >
                                                Verify
                                            </Button>
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="outline"
                                                className="border-red-200 text-red-700 hover:bg-red-50"
                                                onClick={() => setRejectPaymentId(payment.id)}
                                            >
                                                Reject
                                            </Button>
                                        </div>
                                    )}
                                </div>

                                {rejectPaymentId === payment.id && (
                                    <div className="mt-3 space-y-2 rounded-xl border border-red-200 bg-red-50 p-3">
                                        <Textarea
                                            rows={2}
                                            placeholder="Alasan payment ditolak..."
                                            value={rejectPaymentForm.data.rejection_note}
                                            onChange={(e) => rejectPaymentForm.setData('rejection_note', e.target.value)}
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
                )}
            </div>
        </SectionCard>
    );
};

export default SampleInvoicePaymentCard;
