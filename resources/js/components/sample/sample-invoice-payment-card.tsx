import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  CreditCard,
  Edit,
  Eye,
  FileText,
  Printer,
  ReceiptText,
  Trash2,
  XCircle,
} from 'lucide-react';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

import { Payment } from '@/pages/admin/job-tickets/types';
import SectionCard from '@/pages/admin/job-tickets/components/SectionCard';
import Badge from './badge';
import InfoItem from './info-item';
import EmptyState from './empty-state';
import formatRupiah from '../ui/format-rupiah';

import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';

import PaymentDialog from './payment-dialog';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import Field from './field';
import { Input } from '../ui/input';
import FormattedNumberInput from '../ui/formatted-number-input';

const invoiceStatusClass: Record<string, string> = {
  unpaid: 'bg-red-100 text-red-700 border-red-200',
  Unpaid: 'bg-red-100 text-red-700 border-red-200',
  partially_paid: 'bg-amber-100 text-amber-700 border-amber-200',
  'Partially Paid': 'bg-amber-100 text-amber-700 border-amber-200',
  paid: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  Paid: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  cancelled: 'bg-slate-100 text-slate-700 border-slate-200',
  Cancelled: 'bg-slate-100 text-slate-700 border-slate-200',
};

const paymentStatusClass: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700 border-amber-200',
  verified: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  rejected: 'bg-red-100 text-red-700 border-red-200',
};

function getInvoiceStatusLabel(status?: string) {
  if (status === 'paid' || status === 'Paid') return 'Lunas';
  if (status === 'partially_paid' || status === 'Partially Paid') return 'Sebagian';
  if (status === 'unpaid' || status === 'Unpaid') return 'Belum Lunas';
  if (status === 'cancelled' || status === 'Cancelled') return 'Dibatalkan';

  return status || '-';
}

function getInvoiceProgress(total: number, paid: number) {
  if (!total || total <= 0) return 0;

  const progress = (paid / total) * 100;

  return Math.min(Math.max(progress, 0), 100);
}

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
  onEditPayment,
  onDeletePayment,
  canEditInvoice,
  canCancelInvoice,
  invoiceForm,
  onUpdateInvoice,
  onCancelInvoice,
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
  onEditPayment: (payment: Payment) => void;
  onDeletePayment: (payment: Payment) => void;
  canEditInvoice: boolean;
  canCancelInvoice: boolean;
  invoiceForm: any;
  onUpdateInvoice: (e: React.FormEvent) => void;
  onCancelInvoice: () => void;
}) => {
  const [openDetail, setOpenDetail] = useState(false);
  const [openPayment, setOpenPayment] = useState(false);

  const totalInvoice = Number(invoice.total_tagihan || invoice.amount || 0);

  const paymentProgress = useMemo(() => {
    return getInvoiceProgress(totalInvoice, totalPaidVerified);
  }, [totalInvoice, totalPaidVerified]);

  const canPay = canSubmitPayment && remainingPayment > 0;

  const handleSubmitPayment = (e: React.FormEvent) => {
    onSubmitPayment(e);
  };

  const [openInvoiceEdit, setOpenInvoiceEdit] = useState(false);

  return (
    <SectionCard title="Invoice & Payment Sample">
      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <ReceiptText className="size-5 text-slate-500" />
              <h3 className="text-sm font-bold text-slate-900">
                {invoice.no_invoice || invoice.title || 'Invoice Sample'}
              </h3>
            </div>

            <p className="mt-1 text-xs font-light text-slate-500">
              Jatuh tempo: {invoice.tgl_jatuh_tempo || '-'}
            </p>
          </div>

          <Badge
            className={
              invoiceStatusClass[invoice.status_tagihan] ||
              'bg-slate-100 text-slate-700 border-slate-200'
            }
          >
            {getInvoiceStatusLabel(invoice.status_tagihan || invoice.status)}
          </Badge>
        </div>

        <div className="mt-4">
          <div className="flex items-start justify-between gap-4">
            <p className="text-xs font-light text-slate-500">
              Terbayar: {formatRupiah(totalPaidVerified)}
            </p>

            <p className="text-xs font-semibold text-slate-900">
              {formatRupiah(totalInvoice)}
            </p>
          </div>

          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-green-500 transition-all duration-500"
              style={{
                width: `${paymentProgress}%`,
              }}
            />
          </div>

          <p
            className={`mt-2 text-xs font-semibold ${
              remainingPayment <= 0 ? 'text-green-600' : 'text-red-500'
            }`}
          >
            Sisa: {formatRupiah(remainingPayment)}
          </p>
        </div>

        <div className="mt-4 grid gap-2 md:grid-cols-5">
          <Button
            type="button"
            variant="secondary"
            className="w-full flex-1 min-w-30"
            onClick={() => setOpenDetail(true)}
          >
            <Eye className="size-4" />
            Detail
          </Button>

          <Button
            type="button"
            variant="secondary"
            className="w-full flex-1 min-w-30"
            onClick={() => window.open(`/invoice/${invoice.id}/print`, '_blank')}
          >
            <Printer className="size-4" />
            Cetak
          </Button>

          {canEditInvoice && (
            <Button
              type="button"
              variant="secondary"
              className="w-full flex-1 min-w-30"
              onClick={() => setOpenInvoiceEdit(true)}
            >
              <Edit className="size-4" />
              Edit
            </Button>
          )}

          {canCancelInvoice && (
            <Button
              type="button"
              variant="outline"
              className="w-full flex-1 min-w-30 border-red-200 text-red-700 hover:bg-red-50"
              onClick={onCancelInvoice}
            >
              <XCircle className="size-4" />
              Cancel
            </Button>
          )}

          {canPay && (
            <Button
              type="button"
              className="w-full flex-1 min-w-30"
              onClick={() => setOpenPayment(true)}
            >
              <CreditCard className="size-4" />
              Bayar
            </Button>
          )}
        </div>
      </div>

      <InvoiceDetailSheet
        open={openDetail}
        onOpenChange={setOpenDetail}
        invoice={invoice}
        payments={payments}
        totalInvoice={totalInvoice}
        totalPaidVerified={totalPaidVerified}
        remainingPayment={remainingPayment}
        paymentProgress={paymentProgress}
        canPay={canPay}
        onOpenPayment={() => setOpenPayment(true)}
        rejectPaymentForm={rejectPaymentForm}
        rejectPaymentId={rejectPaymentId}
        setRejectPaymentId={setRejectPaymentId}
        onVerifyPayment={onVerifyPayment}
        onRejectPayment={onRejectPayment}
        onEditPayment={onEditPayment}
        onDeletePayment={onDeletePayment}
        canEditInvoice={canEditInvoice}
        canCancelInvoice={canCancelInvoice}
        onEditInvoice={() => setOpenInvoiceEdit(true)}
        onCancelInvoice={onCancelInvoice}
      />

      <PaymentDialog
        open={openPayment}
        onOpenChange={setOpenPayment}
        invoice={invoice}
        paymentForm={paymentForm}
        remainingPayment={remainingPayment}
        onSubmitPayment={handleSubmitPayment}
        mode="create"
      />

      <InvoiceEditDialog
          open={openInvoiceEdit}
          onOpenChange={setOpenInvoiceEdit}
          invoice={invoice}
          invoiceForm={invoiceForm}
          onSubmit={onUpdateInvoice}
        />
    </SectionCard>
  );
};

function InvoiceDetailSheet({
  open,
  onOpenChange,
  invoice,
  payments,
  totalInvoice,
  totalPaidVerified,
  remainingPayment,
  paymentProgress,
  canPay,
  onOpenPayment,
  rejectPaymentForm,
  rejectPaymentId,
  setRejectPaymentId,
  onVerifyPayment,
  onRejectPayment,
  onEditPayment,
  onDeletePayment,
  canEditInvoice,
  canCancelInvoice,
  onEditInvoice,
  onCancelInvoice
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: any;
  payments: Payment[];
  totalInvoice: number;
  totalPaidVerified: number;
  remainingPayment: number;
  paymentProgress: number;
  canPay: boolean;
  onOpenPayment: () => void;
  rejectPaymentForm: any;
  rejectPaymentId: number | null;
  setRejectPaymentId: (id: number | null) => void;
  onVerifyPayment: (paymentId: number) => void;
  onRejectPayment: (paymentId: number) => void;
  onEditPayment: (payment: Payment) => void;
  onDeletePayment: (payment: Payment) => void;
  canEditInvoice: boolean;
  canCancelInvoice: boolean;
  onEditInvoice: () => void;
  onCancelInvoice: () => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side='right' className="sm:max-w-xl lg:max-w-2xl overflow-y-auto">
        <SheetHeader className="border-b pb-4">
          <SheetTitle className="flex items-center gap-2">
            <FileText className="size-5 text-slate-500" />
            {invoice.no_invoice || invoice.title || 'Detail Invoice'}
          </SheetTitle>

          <SheetDescription>
            Detail invoice sample, status pembayaran, dan riwayat payment.
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
                  {invoice.no_invoice || invoice.title || '-'}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Jatuh tempo: {invoice.tgl_jatuh_tempo || '-'}
                </p>
              </div>

              <Badge
                className={
                  invoiceStatusClass[invoice.status_tagihan] ||
                  'bg-slate-100 text-slate-700 border-slate-200'
                }
              >
                {getInvoiceStatusLabel(invoice.status_tagihan || invoice.status)}
              </Badge>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <InfoItem label="Total Tagihan" value={formatRupiah(totalInvoice)} />
              <InfoItem
                label="Terverifikasi"
                value={formatRupiah(totalPaidVerified)}
              />
              <InfoItem
                label="Sisa Tagihan"
                value={formatRupiah(remainingPayment)}
              />
            </div>

            <div className="mt-5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Progress pembayaran</span>
                <span className="font-medium text-slate-700">
                  {Math.round(paymentProgress)}%
                </span>
              </div>

              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-green-500 transition-all duration-500"
                  style={{
                    width: `${paymentProgress}%`,
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
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-slate-900">
                            {formatRupiah(payment.jumlah_bayar || 0)}
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
                          {payment.tgl_bayar || '-'} •{' '}
                          {payment.metode_pembayaran || '-'}
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
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => onEditPayment(payment)}
                          >
                            <Edit className="size-4" />
                            Edit
                          </Button>

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

                          {payment.status === 'pending' && (
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
            )}
          </div>

          <div className="sticky bottom-0 border-t bg-white px-6 py-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs text-slate-500">Sisa Tagihan</p>
                <p
                  className={`font-bold ${
                    remainingPayment <= 0 ? 'text-green-600' : 'text-red-500'
                  }`}
                >
                  {formatRupiah(remainingPayment)}
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() =>
                    window.open(`/invoice/${invoice.id}/print`, '_blank')
                  }
                >
                  <Printer className="size-4" />
                  Cetak
                </Button>

                {canEditInvoice && (
                  <Button type="button" variant="secondary" onClick={onEditInvoice}>
                    <Edit className="size-4" />
                    Edit
                  </Button>
                )}

                {canCancelInvoice && (
                  <Button
                    type="button"
                    variant="outline"
                    className="border-red-200 text-red-700 hover:bg-red-50"
                    onClick={onCancelInvoice}
                  >
                    <XCircle className="size-4" />
                    Cancel
                  </Button>
                )}

                {canPay && (
                  <Button type="button" onClick={onOpenPayment}>
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
}

function InvoiceEditDialog({
  open,
  onOpenChange,
  invoice,
  invoiceForm,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: any;
  invoiceForm: any;
  onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Edit Invoice Sample</DialogTitle>
          <DialogDescription>
            Edit nominal dan jatuh tempo invoice selama belum ada payment terverifikasi.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="rounded-2xl border bg-slate-50 p-4">
            <p className="text-xs text-slate-500">Invoice</p>
            <p className="mt-1 font-semibold text-slate-900">
              {invoice?.no_invoice || invoice?.title || '-'}
            </p>
          </div>

          <Field label="Total Tagihan" error={invoiceForm.errors.total_tagihan}>
            <FormattedNumberInput
                value={invoiceForm.data.total_tagihan}
                onValueChange={(value) => invoiceForm.setData('total_tagihan', value)}
                placeholder='cth: 35.000'
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
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
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
}


export default SampleInvoicePaymentCard;