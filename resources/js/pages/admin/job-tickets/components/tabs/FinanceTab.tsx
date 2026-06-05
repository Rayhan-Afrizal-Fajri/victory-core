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

const FinanceTab: React.FC<{ job: JobTicket }> = ({ job }) => {
    const can = useCan();

    const workflow = job.workflow_status;
    const invoices = job.invoices || [];

    const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
    const [detailOpen, setDetailOpen] = useState(false);
    const [paymentOpen, setPaymentOpen] = useState(false);
    const [editInvoiceOpen, setEditInvoiceOpen] = useState(false);

    const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
    const [paymentDialogMode, setPaymentDialogMode] = useState<'create' | 'edit'>('create');
    const [rejectPaymentId, setRejectPaymentId] = useState<number | null>(null);

    const selectedPayments = selectedInvoice ? getInvoicePayments(selectedInvoice) : [];
    const selectedRemainingPayment = selectedInvoice ? getRemainingPayment(selectedInvoice) : 0;

    const summary = useMemo(() => {
        const activeInvoices = invoices.filter((invoice) => !isInvoiceCancelled(invoice));

        const totalInvoice = activeInvoices.reduce((total, invoice) => {
            return total + getInvoiceTotal(invoice);
        }, 0);

        const totalPaid = activeInvoices.reduce((total, invoice) => {
            return total + getVerifiedPaid(invoice);
        }, 0);

        return {
            totalInvoice,
            totalPaid,
            remaining: Math.max(totalInvoice - totalPaid, 0),
            progress: totalInvoice > 0 ? Math.min((totalPaid / totalInvoice) * 100, 100) : 0,
        };
    }, [invoices]);

    const groupedInvoices = useMemo(() => {
        return {
            sample: invoices.filter((invoice) => getInvoiceCategory(invoice) === 'sample'),
            production: invoices.filter((invoice) => getInvoiceCategory(invoice) === 'production'),
            final_billing: invoices.filter((invoice) => getInvoiceCategory(invoice) === 'final_billing'),
            other: invoices.filter((invoice) => getInvoiceCategory(invoice) === 'other'),
        };
    }, [invoices]);

    const paymentForm = useForm({
        tgl_bayar: new Date().toISOString().slice(0, 10),
        jumlah_bayar: selectedRemainingPayment,
        metode_pembayaran: '',
        bukti_transfer: null as File | null,
        catatan_finance: '',
    });

    const editInvoiceForm = useForm({
        total_tagihan: Number(selectedInvoice?.total_tagihan || selectedInvoice?.amount || 0),
        tgl_jatuh_tempo: selectedInvoice?.tgl_jatuh_tempo || '',
    });

    const rejectPaymentForm = useForm({
        rejection_note: '',
    });

    useEffect(() => {
        if (selectedInvoice?.id) {
            paymentForm.setData({
                tgl_bayar: new Date().toISOString().slice(0, 10),
                jumlah_bayar: selectedRemainingPayment,
                metode_pembayaran: '',
                bukti_transfer: null,
                catatan_finance: '',
            });

            editInvoiceForm.setData({
                total_tagihan: getInvoiceTotal(selectedInvoice),
                tgl_jatuh_tempo: selectedInvoice.tgl_jatuh_tempo || '',
            });
        }
    }, [selectedInvoice?.id, selectedRemainingPayment]);

    useEffect(() => {
        if (editingPayment) {
            paymentForm.setData({
                tgl_bayar: editingPayment.tgl_bayar || new Date().toISOString().slice(0, 10),
                jumlah_bayar: Number(editingPayment.jumlah_bayar || 0),
                metode_pembayaran: editingPayment.metode_pembayaran || '',
                bukti_transfer: null,
                catatan_finance: editingPayment.catatan_finance || '',
            });
        }
    }, [editingPayment?.id]);

    const openDetail = (invoice: any) => {
        setSelectedInvoice(invoice);
        setDetailOpen(true);
    };

    const openPayment = (invoice: any) => {
        setSelectedInvoice(invoice);
        setEditingPayment(null);
        setPaymentDialogMode('create');
        setPaymentOpen(true);
    };

    const openEditPayment = (payment: Payment) => {
        setEditingPayment(payment);
        setPaymentDialogMode('edit');
        setPaymentOpen(true);
    };

    const openEditInvoice = (invoice: any) => {
        setSelectedInvoice(invoice);
        setEditInvoiceOpen(true);
    };

    const canPayInvoice = (invoice: any) => {
        return !isInvoicePaid(invoice) && !isInvoiceCancelled(invoice);
    };

    const canEditInvoice = (invoice: any) => {
        return (
            !isInvoicePaid(invoice) &&
            !isInvoiceCancelled(invoice) &&
            !hasVerifiedPayment(invoice)
        );
    };

    const canCancelInvoice = (invoice: any) => {
        return (
            !isInvoicePaid(invoice) &&
            !isInvoiceCancelled(invoice) &&
            !hasVerifiedPayment(invoice)
        );
    };

    const submitPayment = (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedInvoice) {
            toast.error('Invoice belum dipilih.');
            return;
        }

        paymentForm.post(`/invoices/${selectedInvoice.id}/payments`, {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => {
                toast.success('Payment berhasil dikirim.');
                paymentForm.reset();
                setPaymentOpen(false);
                setEditingPayment(null);
            },
        });
    };

    const updatePayment = (e: React.FormEvent) => {
        e.preventDefault();

        if (!editingPayment) {
            toast.error('Payment belum dipilih.');
            return;
        }

        paymentForm.post(`/payments/${editingPayment.id}`, {
            preserveScroll: true,
            forceFormData: true,
            method: 'patch',
            onSuccess: () => {
                toast.success('Payment berhasil diperbarui.');
                paymentForm.reset();
                setPaymentOpen(false);
                setEditingPayment(null);
            },
        });
    };

    const verifyPayment = (paymentId: number) => {
        router.patch(
            `/payments/${paymentId}/verify`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Payment berhasil diverifikasi.');
                    setDetailOpen(false);
                },
            }
        );
    };

    const rejectPayment = (paymentId: number) => {
        rejectPaymentForm.patch(`/payments/${paymentId}/reject`, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Payment berhasil ditolak.');
                rejectPaymentForm.reset();
                setRejectPaymentId(null);
            },
        });
    };

    const deletePayment = (payment: Payment) => {
        if (!confirm('Hapus payment ini?')) return;

        router.delete(`/payments/${payment.id}`, {
            preserveScroll: true,
            onSuccess: () => toast.success('Payment berhasil dihapus.'),
        });
    };

    const updateInvoice = (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedInvoice) {
            toast.error('Invoice belum dipilih.');
            return;
        }

        editInvoiceForm.patch(`/invoices/${selectedInvoice.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Invoice berhasil diperbarui.');
                setEditInvoiceOpen(false);
            },
        });
    };

    const cancelInvoice = (invoice: any) => {
        if (!confirm('Batalkan invoice ini?')) return;

        router.patch(
            `/invoices/${invoice.id}/cancel`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => toast.success('Invoice berhasil dibatalkan.'),
            }
        );
    };

    const renderInvoiceGroup = (title: string, data: any[]) => {
        return (
            <SectionCard title={title}>
                {data.length === 0 ? (
                    <EmptyState
                        icon={<ReceiptText className="size-5" />}
                        title="Belum ada invoice"
                        description={`${title} belum tersedia.`}
                    />
                ) : (
                    <div className="grid gap-4 lg:grid-cols-2">
                        {data.map((invoice) => (
                            <InvoiceCard
                                key={invoice.id}
                                invoice={invoice}
                                // remainingPayment={getRemainingPayment(invoice)}
                                onDetail={openDetail}
                                onPay={openPayment}
                                onEdit={openEditInvoice}
                                onCancel={cancelInvoice}
                                canPay={canPayInvoice(invoice)}
                                canEdit={canEditInvoice(invoice)}
                                canCancel={canCancelInvoice(invoice)}
                            />
                        ))}
                    </div>
                )}
            </SectionCard>
        );
    };

    return (
        <div className="space-y-6">
            <SectionCard title="Ringkasan Finance">
                <div className="grid gap-4 md:grid-cols-3">
                    <SummaryBox
                        label="Total Invoice"
                        value={formatRupiah(summary.totalInvoice)}
                    />

                    <SummaryBox
                        label="Terverifikasi"
                        value={formatRupiah(summary.totalPaid)}
                    />

                    <SummaryBox
                        label="Outstanding"
                        value={formatRupiah(summary.remaining)}
                        danger={summary.remaining > 0}
                    />
                </div>

                <div className="mt-5">
                    <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Progress Payment</span>
                        <span className="font-medium text-slate-700">
                            {Math.round(summary.progress)}%
                        </span>
                    </div>

                    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                            className="h-full rounded-full bg-green-500"
                            style={{
                                width: `${summary.progress}%`,
                            }}
                        />
                    </div>
                </div>
            </SectionCard>

            {renderInvoiceGroup('Invoice Sample', groupedInvoices.sample)}

            {workflow?.sample_approved != false && (
                <>
                    {renderInvoiceGroup('Invoice Produksi', groupedInvoices.production)}
                    {renderInvoiceGroup('Final Billing', groupedInvoices.final_billing)}
                </>
            )}

            {groupedInvoices.other.length > 0 &&
                renderInvoiceGroup('Invoice Lainnya', groupedInvoices.other)}

            <InvoiceDetailSheet
                open={detailOpen}
                onOpenChange={setDetailOpen}
                invoice={selectedInvoice}
                canPay={selectedInvoice ? canPayInvoice(selectedInvoice) : false}
                canEdit={selectedInvoice ? canEditInvoice(selectedInvoice) : false}
                canCancel={selectedInvoice ? canCancelInvoice(selectedInvoice) : false}
                rejectPaymentId={rejectPaymentId}
                rejectPaymentForm={rejectPaymentForm}
                setRejectPaymentId={setRejectPaymentId}
                onPay={openPayment}
                onEdit={openEditInvoice}
                onCancel={cancelInvoice}
                onVerifyPayment={verifyPayment}
                onRejectPayment={rejectPayment}
                onEditPayment={openEditPayment}
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
                job={job}
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