import React, { useEffect, useMemo, useState } from 'react';
import { router, useForm } from '@inertiajs/react';
import { CreditCard, ReceiptText } from 'lucide-react';
import { toast } from 'sonner';

import type { JobTicket, Payment } from '../../types';
import SectionCard from '../SectionCard';

import EmptyState from '@/components/sample/empty-state';
import InvoiceCard from '@/components/invoice/invoice-card';
import InvoiceDetailSheet from '@/components/invoice/invoice-detail-sheet';
import InvoiceEditDialog from '@/components/invoice/invoice-edit-dialog';
import PaymentDialog from '@/components/sample/payment-dialog';

import formatRupiah from '@/components/ui/format-rupiah';

import {
    getInvoiceCategory,
    getInvoiceCategoryLabel,
    getInvoicePayments,
    getInvoiceTotal,
    getRemainingPayment,
    getVerifiedPaid,
    hasVerifiedPayment,
    isInvoiceCancelled,
    isInvoicePaid,
} from '@/components/invoice/invoice-utils';
import { useCan } from '@/hooks/use-can';

const FinanceTab: React.FC<{ jobTicket: JobTicket }> = ({ jobTicket }) => {
    const can = useCan();

    // PERBAIKAN: Mengambil workflow status representatif (dari order pertama)
    // Karena saat ini Invoice adalah level Job Ticket, asumsinya semua order punya status yang sejalan terkait finance.
    const representativeOrder = jobTicket.orders && jobTicket.orders.length > 0 ? jobTicket.orders[0] : null;
    const workflow = representativeOrder?.workflow_status;

    const invoices = jobTicket.invoices || [];

    const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
    const [detailOpen, setDetailOpen] = useState(false);
    const [paymentOpen, setPaymentOpen] = useState(false);
    const [editInvoiceOpen, setEditInvoiceOpen] = useState(false);

    const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
    const [paymentDialogMode, setPaymentDialogMode] = useState<'create' | 'edit'>('create');
    const [rejectPaymentId, setRejectPaymentId] = useState<number | null>(null);

    const paymentForm = useForm({
        tgl_bayar: new Date().toISOString().slice(0, 10),
        jumlah_bayar: 0,
        metode_pembayaran: 'transfer',
        bukti_transfer: null as File | null,
        catatan_finance: '',
    });

    const editInvoiceForm = useForm({
        total_tagihan: 0,
        tgl_jatuh_tempo: '',
    });

    const rejectPaymentForm = useForm({
        rejection_note: '',
    });

    const totalInvoice = useMemo(() => {
        return invoices.reduce((sum, inv) => {
            if (isInvoiceCancelled(inv)) return sum;
            return sum + getInvoiceTotal(inv);
        }, 0);
    }, [invoices]);

    const totalPaid = useMemo(() => {
        return invoices.reduce((sum, inv) => sum + getVerifiedPaid(inv), 0);
    }, [invoices]);

    const totalUnpaid = Math.max(totalInvoice - totalPaid, 0);

    const handleOpenDetail = (invoice: any) => {
        setSelectedInvoice(invoice);
        setDetailOpen(true);
    };

    const handleOpenPayment = (invoice: any) => {
        setSelectedInvoice(invoice);
        setEditingPayment(null);
        setPaymentDialogMode('create');

        paymentForm.setData({
            tgl_bayar: new Date().toISOString().slice(0, 10),
            jumlah_bayar: getRemainingPayment(invoice),
            metode_pembayaran: 'transfer',
            bukti_transfer: null,
            catatan_finance: '',
        });

        setPaymentOpen(true);
    };

    const handleOpenEditPayment = (payment: any) => {
        setEditingPayment(payment);
        setPaymentDialogMode('edit');

        paymentForm.setData({
            tgl_bayar: payment.tgl_bayar
                ? new Date(payment.tgl_bayar).toISOString().slice(0, 10)
                : new Date().toISOString().slice(0, 10),
            jumlah_bayar: Number(payment.jumlah_bayar) || 0,
            metode_pembayaran: payment.metode_pembayaran || 'transfer',
            bukti_transfer: null,
            catatan_finance: payment.catatan_finance || '',
        });

        setPaymentOpen(true);
    };

    const handleOpenEditInvoice = (invoice: any) => {
        setSelectedInvoice(invoice);

        editInvoiceForm.setData({
            total_tagihan: Number(invoice.total_tagihan) || 0,
            tgl_jatuh_tempo: invoice.tgl_jatuh_tempo
                ? new Date(invoice.tgl_jatuh_tempo).toISOString().slice(0, 10)
                : '',
        });

        setEditInvoiceOpen(true);
    };

    const updateInvoice = (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedInvoice) return;

        editInvoiceForm.patch(`/invoices/${selectedInvoice.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Invoice berhasil diupdate');
                setEditInvoiceOpen(false);
            },
        });
    };

    const cancelInvoice = (invoice: any) => {
        toast.warning(
            `Apakah Anda yakin ingin membatalkan invoice ${invoice.no_invoice}?`,
            {
                action: {
                    label: 'Batalkan Invoice',
                    onClick: () => {
                        router.post(
                            `/invoices/${invoice.id}/cancel`,
                            {},
                            {
                                preserveScroll: true,
                                onSuccess: () => {
                                    toast.success('Invoice berhasil dibatalkan');
                                    setDetailOpen(false);
                                },
                            }
                        );
                    },
                },
            }
        );
    };

    const submitPayment = (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedInvoice) return;

        paymentForm.post(`/invoices/${selectedInvoice.id}/payments`, {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => {
                toast.success('Pembayaran berhasil disubmit');
                setPaymentOpen(false);
                paymentForm.reset();
            },
        });
    };

    const updatePayment = (e: React.FormEvent) => {
        e.preventDefault();

        if (!editingPayment) return;

        paymentForm.post(`/payments/${editingPayment.id}`, {
            preserveScroll: true,
            forceFormData: true,
            data: {
                ...paymentForm.data,
                _method: 'PATCH',
            } as any,
            onSuccess: () => {
                toast.success('Pembayaran berhasil diupdate');
                setPaymentOpen(false);
                setEditingPayment(null);
                paymentForm.reset();
            },
        });
    };

    const verifyPayment = (paymentId: number) => {
        toast.warning('Verifikasi pembayaran ini?', {
            action: {
                label: 'Ya, Verifikasi',
                onClick: () => {
                    router.patch(
                        `/payments/${paymentId}/verify`,
                        {},
                        {
                            preserveScroll: true,
                            onSuccess: () => {
                                toast.success('Pembayaran terverifikasi');
                            },
                        }
                    );
                },
            },
        });
    };

    const rejectPayment = (paymentId: number) => {
        rejectPaymentForm.post(`/payments/${paymentId}/reject`, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Pembayaran ditolak');
                setRejectPaymentId(null);
                rejectPaymentForm.reset();
            },
        });
    };

    const deletePayment = (payment: any) => {
        toast.error('Hapus data pembayaran ini?', {
            action: {
                label: 'Hapus',
                onClick: () => {
                    router.delete(`/payments/${payment.id}`, {
                        preserveScroll: true,
                        onSuccess: () => {
                            toast.success('Pembayaran berhasil dihapus');
                        },
                    });
                },
            },
        });
    };

    const selectedRemainingPayment = selectedInvoice
        ? getRemainingPayment(selectedInvoice)
        : 0;

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
                <SummaryBox
                    label="Total Invoice"
                    value={formatRupiah(totalInvoice)}
                />
                <SummaryBox
                    label="Total Terbayar"
                    value={formatRupiah(totalPaid)}
                />
                <SummaryBox
                    label="Sisa Tagihan"
                    value={formatRupiah(totalUnpaid)}
                    danger={totalUnpaid > 0}
                />
            </div>

            <SectionCard title="Daftar Invoice (Sample & Produksi)">
                <div className="space-y-4">
                    {/* // PERBAIKAN PADA LOGIC CEK STATUS (opsional, karena tombol dipindah ke list table jika dibutuhkan,
                        namun kode asli tidak memiliki tombol create invoice disini. Jadi kita pertahankan saja isi datanya)
                    */}
                    {!workflow?.quotation_approved && (
                        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                            Invoice Sample otomatis dibuat ketika Anda meng-approve Quotation di tab Costing.
                        </div>
                    )}
                    
                    {/* PERBAIKAN: Pastikan check length dari array invoices, bukan fallback jobTicket.invoices */}
                    {invoices.length === 0 ? (
                        <EmptyState
                            icon={<ReceiptText className="size-8" />}
                            title="Belum ada tagihan"
                            description="Invoice belum dibuat untuk pesanan ini."
                        />
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2">
                            {invoices.map((invoice: any) => (
                                <InvoiceCard
                                    key={invoice.id}
                                    invoice={invoice}
                                    onDetail={handleOpenDetail}
                                    onPay={handleOpenPayment}
                                    onEdit={handleOpenEditInvoice}
                                    onCancel={cancelInvoice}
                                    canPay={can('payment.create')}
                                    canEdit={can('invoice.edit')}
                                    canCancel={can('invoice.cancel')}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </SectionCard>

            <InvoiceDetailSheet
                open={detailOpen}
                onOpenChange={setDetailOpen}
                invoice={selectedInvoice}
                canPay={can('payment.create')}
                canEdit={can('invoice.edit')}
                canCancel={can('invoice.cancel')}
                rejectPaymentId={rejectPaymentId}
                rejectPaymentForm={rejectPaymentForm}
                setRejectPaymentId={setRejectPaymentId}
                onPay={(invoice) => {
                    setDetailOpen(false);
                    setTimeout(() => handleOpenPayment(invoice), 300);
                }}
                onEdit={(invoice) => {
                    setDetailOpen(false);
                    setTimeout(() => handleOpenEditInvoice(invoice), 300);
                }}
                onCancel={(invoice) => {
                    setDetailOpen(false);
                    setTimeout(() => cancelInvoice(invoice), 300);
                }}
                onVerifyPayment={(paymentId) => {
                    setDetailOpen(false);
                    setTimeout(() => verifyPayment(paymentId), 300);
                }}
                onRejectPayment={rejectPayment}
                onEditPayment={handleOpenEditPayment}
                onDeletePayment={deletePayment}
            />

            <PaymentDialog
                open={paymentOpen}
                onOpenChange={(open) => {
                    setPaymentOpen(open);

                    if (!open) {
                        setEditingPayment(null);
                        paymentForm.reset();
                    }
                }}
                invoice={selectedInvoice}
                paymentForm={paymentForm}
                remainingPayment={selectedRemainingPayment}
                onSubmitPayment={paymentDialogMode === 'edit' ? updatePayment : submitPayment}
                mode={paymentDialogMode}
                job={jobTicket}
            />

            <InvoiceEditDialog
                open={editInvoiceOpen}
                onOpenChange={setEditInvoiceOpen}
                invoice={selectedInvoice}
                invoiceForm={editInvoiceForm}
                onSubmit={updateInvoice}
            />
        </div>
    );
};

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
        <div className="rounded-2xl border bg-white p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                {label}
            </p>
            <p className={`mt-1 text-lg font-bold ${danger ? 'text-red-500' : 'text-slate-900'}`}>
                {value}
            </p>
        </div>
    );
}

export default FinanceTab;