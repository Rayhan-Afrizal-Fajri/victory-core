import React, { useEffect, useMemo, useState } from 'react';
import { router, useForm } from '@inertiajs/react';
import { toast } from 'sonner';
import { ReceiptText } from 'lucide-react';

import type { JobTicket, Payment } from '../../types';
import SectionCard from '../SectionCard';
import WorkflowGate from '../WorkflowGate';

import SampleProgressStepper from '@/components/sample/sample-progress-stepper';
import SampleHistoryCard from '@/components/sample/sample-history-card';
import SampleGalleryCard from '@/components/sample/sample-gallery-card';
import SampleApprovalCard from '@/components/sample/sample-approval-card';

import EmptyState from '@/components/sample/empty-state';
import SampleCreateCard from '@/components/sample/sample-create-card';
import SampleOverviewCard from '@/components/sample/sample-overview-card';
import SampleInvoicePaymentCard from '@/components/sample/sample-invoice-payment-card';
import SampleDeliveryCard from '@/components/sample/sample-delivery-card';
import PaymentDialog from '@/components/sample/payment-dialog';


const SampleTab: React.FC<{ job: JobTicket }> = ({ job }) => {
    const workflow = job.workflow_status;
    const designApproved = workflow?.design_approved ?? false;

    const samples = job.samples || [];

    const sortedSamples = [...samples].sort((a, b) => {
        const revisionA = Number(a.revision_number ?? 0);
        const revisionB = Number(b.revision_number ?? 0);

        if (revisionA !== revisionB) {
            return revisionB - revisionB;
        }

        return Number(b.id ?? 0) - Number(a.id ?? 0);
    });
    const latestSample = sortedSamples[0] ?? null;

    const approvedSample = sortedSamples.find((item) => item.status === 'approved') || null;
    
    const revisionSourceSample =
        sortedSamples.find((item) => item.status === 'revision_needed') || null;
    
    const activeSample =
        sortedSamples.find((item) => 
        [
            'draft',
            'waiting_payment',
            'paid',
            'in_delivery',
            'delivered',
        ].includes(item.status)
    ) || null;

    const sample = activeSample || approvedSample || revisionSourceSample || latestSample;
    
    const invoice = sample?.invoice || null;
    const payments = invoice?.payments || [];
    const media = sample?.media || [];
    const delivery = sample?.delivery || null;

    const [revisionOpen, setRevisionOpen] = useState(false);
    const [rejectOpen, setRejectOpen] = useState(false);
    const [rejectPaymentId, setRejectPaymentId] = useState<number | null>(null);

    const totalPaidVerified = useMemo(() => {
        return payments
            .filter((payment) => payment.status === 'verified')
            .reduce((total, payment) => total + Number(payment.jumlah_bayar || 0), 0);
    }, [payments]);

    const remainingPayment = Math.max(Number(invoice?.total_tagihan || invoice?.amount || 0) - totalPaidVerified, 0);

    const hasAnySample = sortedSamples.length > 0;
    
    const canCreateFirstSample = designApproved && !hasAnySample;

    const canCreateRevisionSample =
        designApproved &&
        Boolean(revisionSourceSample) &&
        !activeSample &&
        !workflow?.sample_approved;

    const canCreateSample = canCreateFirstSample || canCreateRevisionSample;

    const canSubmitPayment = Boolean(activeSample && invoice && invoice.status_tagihan !== 'paid');
    const canDeliver = Boolean(activeSample && workflow?.sample_paid && activeSample.status === 'paid');
    const canMarkDelivered = Boolean(activeSample && activeSample.status === 'in_delivery');
    const canApprove = Boolean(activeSample && activeSample.status === 'delivered');

    const sampleForm = useForm({
        qty: 1,
        sample_price: 0,
        catatan: '',
        is_chargeable: true,
        photos: [] as File[],
    });

    const paymentForm = useForm({
        tgl_bayar: new Date().toISOString().slice(0, 10),
        jumlah_bayar: remainingPayment || Number(invoice?.total_tagihan || 0),
        metode_pembayaran: '',
        bukti_transfer: null as File | null,
        catatan_finance: '',
    });

    const deliveryForm = useForm({
        courier_name: '',
        tracking_number: '',
        tracking_url: '',
        delivery_note: '',
    });

    const revisionForm = useForm({
        customer_review_note: '',
    });

    const rejectForm = useForm({
        customer_review_note: '',
    });

    const rejectPaymentForm = useForm({
        rejection_note: '',
    });

    useEffect(() => {
        if (invoice?.id) {
            paymentForm.setData('jumlah_bayar', remainingPayment || Number(invoice.total_tagihan || 0));
        }
    }, [invoice?.id, remainingPayment]);

    if (!designApproved) {
        return <WorkflowGate reason="Desain belum disetujui. Sampel terkunci." />;
    }

    const submitSample = (e: React.FormEvent) => {
        e.preventDefault();

        sampleForm.post(`/pesanan/${job.id}/samples`, {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => {
                toast.success('Sample berhasil dibuat dan invoice diproses.');
                sampleForm.reset();
            },
        });
    };

    const submitPayment = (e: React.FormEvent) => {
        e.preventDefault();

        if (!invoice) {
            toast.error('Invoice belum tersedia.');
            return;
        }

        paymentForm.post(`/invoices/${invoice.id}/payments`, {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => {
                toast.success('Pembayaran berhasil dikirim dan menunggu verifikasi.');
                paymentForm.reset();
            },
        });
    };

    const verifyPayment = (paymentId: number) => {
        router.patch(
            `/payments/${paymentId}/verify`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => toast.success('Payment berhasil diverifikasi.'),
            },
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

    const submitDelivery = (e: React.FormEvent) => {
        e.preventDefault();

        if (!activeSample) {
            toast.error('Sample belum tersedia.');
            return;
        }

        deliveryForm.post(`/samples/${activeSample.id}/delivery`, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Data pengiriman sample berhasil disimpan.');
                deliveryForm.reset();
            },
        });
    };

    const markDelivered = () => {
        if (!activeSample) {
            toast.error('Sample belum tersedia.');
            return;
        }

        router.patch(
            `/samples/${activeSample.id}/mark-delivered`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => toast.success('Sample ditandai sudah diterima.'),
            },
        );
    };

    const approveSample = () => {
        if (!activeSample) {
            toast.error('Sample belum tersedia.');
            return;
        }

        router.patch(
            `/samples/${activeSample.id}/approve`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => toast.success('Sample disetujui.'),
            },
        );
    };

    const submitRevision = () => {
        if (!activeSample) {
            toast.error('Sample belum tersedia.');
            return;
        }

        revisionForm.patch(`/samples/${activeSample.id}/revision`, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Revisi sample berhasil diminta.');
                revisionForm.reset();
                setRevisionOpen(false);
            },
        });
    };

    const submitReject = () => {
        if (!activeSample) {
            toast.error('Sample belum tersedia.');
            return;
        }

        rejectForm.patch(`/samples/${activeSample.id}/reject`, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Sample ditolak.');
                rejectForm.reset();
                setRejectOpen(false);
            },
        });
    };

    const editSampleForm = useForm({
        qty: sample?.qty || 1,
        sample_price: sample?.sample_price || 0,
        catatan: sample?.catatan || '',
        is_chargeable: sample?.is_chargeable ?? true,
    });

    useEffect(() => {
        if (sample?.id) {
            editSampleForm.setData({
                qty: sample.qty || 1,
                sample_price: sample.sample_price || 0,
                catatan: sample.catatan || '',
                is_chargeable: sample.is_chargeable ?? true,
            });
        }
    }, [sample?.id]);

    const updateSample = (e: React.FormEvent) => {
        e.preventDefault();

        if (!activeSample) {
            toast.error('Sample aktif belum tersedia');
            return;
        }

        editSampleForm.patch(`/samples/${activeSample.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Sample berhasil diperbarui');
            },
        });
    };

    const deleteSample = () => {
        if (!activeSample) {
            toast.error('Sample aktif belum tersedia.');
            return;
        }

        if (!confirm('Hapus sample ini? Data invoice dan payment pending juga akan ikut dihapus.')) {
            return;
        }

        router.delete(`/samples/${activeSample.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Sample behasil dihapus.');
            },
        });
    };

    /**
     * Payment handler
     */
    const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
    const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);

    const editPaymentForm = useForm({
        tgl_bayar: '',
        jumlah_bayar: 0,
        metode_pembayaran: '',
        bukti_transfer: null as File | null,
        catatan_finance: '',
    });

    useEffect(() => {
        if (editingPayment) {
            editPaymentForm.setData({
                tgl_bayar: editingPayment.tgl_bayar || new Date().toISOString().slice(0, 10),
                jumlah_bayar: Number(editingPayment.jumlah_bayar || 0),
                metode_pembayaran: editingPayment.metode_pembayaran || '',
                bukti_transfer: null,
                catatan_finance: editingPayment.catatan_finance || '',
            });
        }
    }, [editingPayment?.id]);

    const openEditPayment = (payment: Payment) => {
        setEditingPayment(payment);
        setPaymentDialogOpen(true);
    };

    const updatePayment = (e: React.FormEvent) => {
        e.preventDefault();

        if (!editingPayment) {
            toast.error('Payment belum dipilih.');
            return;
        }

        editPaymentForm.patch(`/payments/${editingPayment.id}`, {
            preserveScroll: true,
            forceFormData: true,
            method: 'patch',
            onSuccess: () => {
                toast.success('Payment berhasil diperbarui.');
                editPaymentForm.reset();
                setEditingPayment(null);
                setPaymentDialogOpen(false);
            },
        });
    };

    const deletePayment = (payment: Payment) => {
        if (!confirm('Hapus payment ini?')) {
            return;
        }

        router.delete(`/payments/${payment.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Payment berhasil dihapus.');
            },
        });
    };

    
    /**
     * Invoice handler
     */
    const editInvoiceForm = useForm({
        total_tagihan: Number(invoice?.total_tagihan || invoice?.amount || 0),
        tgl_jatuh_tempo: invoice?.tgl_jatuh_tempo || '',
    });

    useEffect(() => {
        if (invoice?.id) {
            editInvoiceForm.setData({
                total_tagihan: Number(invoice.total_tagihan || invoice.amount || 0),
                tgl_jatuh_tempo: invoice.tgl_jatuh_tempo || '',
            });
        }
    }, [invoice?.id]);

    const hasVerifiedPayment = payments.some((payment) => payment.status === 'verified');

    const canEditInvoice = Boolean(
        invoice &&
        !hasVerifiedPayment &&
        !['paid', 'Paid', 'cancelled', 'Cancelled'].includes(invoice?.status_tagihan?? '')
    );

    const canCancelInvoice = Boolean(
        invoice &&
        !hasVerifiedPayment &&
        !['paid', 'Paid', 'cancelled', 'Cancelled'].includes(invoice?.status_tagihan?? '')
    );

    const updateInvoice = (e: React.FormEvent) => {
        e.preventDefault();

        if (!invoice) {
            toast.error('Invoice belum tersedia');
            return;
        }

        editInvoiceForm.patch(`/invoices/${invoice.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Invoice berhasil diperbarui.');
            },
        });
    };

    const cancelInvoice = () => {
        if (!invoice) {
            toast.error('Invoice belum tersedia.');
            return;
        }

        if (!confirm('Batalkan invoice ini? Sample akan dianggap tanpa biaya dan bisa lanjut ke delivery')) {
            return;
        }

        router.patch(
            `/invoices/${invoice.id}/cancel`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Invoice berhasil dibatalkan.');
                },
            }
        );
    };

    /**
     * Delivery Handler
     */

    const editDeliveryForm = useForm({
        courier_name: delivery?.courier_name || '',
        tracking_number: delivery?.tracking_number || '',
        tracking_url: delivery?.tracking_url || '',
        delivery_note: delivery?.delivery_note || '',
    });

    useEffect(() => {
        if (delivery?.id) {
            editDeliveryForm.setData({
                courier_name: delivery.courier_name || '',
                tracking_number: delivery.tracking_number || '',
                tracking_url: delivery.tracking_url || '',
                delivery_note: delivery.delivery_note || ''
            });
        }
    }, [delivery?.id]);

    const canEditDelivery = Boolean(
        activeSample &&
        delivery &&
        activeSample.status === 'in_delivery' &&
        delivery.status !== 'delivered'
    );

    const canCancelDelivery = canEditDelivery;

    const updateDelivery = (e: React.FormEvent) => {
        e.preventDefault();

        if (!activeSample) {
            toast.error('Sample aktif belum tersedia');
            return;
        }

        editDeliveryForm.patch(`/samples/${activeSample.id}/delivery`, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Delivery sample berhasil diperbarui.');
            },
        });
    };

    const cancelDelivery = () => {
        if (!activeSample) {
            toast.error('Sample aktif belum tersedia.');
            return;
        }

        if (!confirm('Batalkan pengiriman sample ini? Sample akan kembali ke status paid.')) {
            return;
        }

        router.delete(`/samples/${activeSample.id}/delivery`, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Delivery sample berhasil dibatalkan.');
            },
        });
    };

    /**
     * Delete media sample
     */

    const canDeleteSampleMedia = Boolean(
        activeSample &&
        sample?.id === activeSample.id &&
        !['approved', 'rejected'].includes(activeSample.status)
    );

    const deleteSampleMedia = (mediaId: number) => {
        if (!confirm('Hapus foto sample ini?')) {
            return;
        }

        router.delete(`/samples/media/${mediaId}`, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Foto sample berhasil dihapus.');
            },
        });
    };

    return (
        <div className="space-y-6">
            <SampleProgressStepper workflow={workflow} sample={sample} />

            <div className="grid gap-6 xl:grid-cols-3">
                <div className="space-y-6 xl:col-span-2">
                    {canCreateSample && (
                        <SampleCreateCard
                            form={sampleForm}
                            onSubmit={submitSample}
                        />
                    )}

                    {sample && (
                        <SampleOverviewCard
                            sample={sample}
                            canEdit={Boolean(
                                activeSample &&
                                ['waiting_payment', 'paid'].includes(activeSample.status)
                            )}
                            canDelete={Boolean(
                                activeSample &&
                                ['waiting_payment', 'paid'].includes(activeSample.status)
                            )}
                            editForm={editSampleForm}
                            onUpdate={updateSample}
                            onDelete={deleteSample}
                        />
                    )}

                    {sample && (
                        <SampleGalleryCard
                            media={media}
                            sampleId={sample.id}
                            canDeleteMedia={canDeleteSampleMedia}
                            onDeleteMedia={deleteSampleMedia}
                        />
                    )}

                    {sample && invoice && (
                        <SampleInvoicePaymentCard
                            invoice={invoice}
                            payments={payments}
                            totalPaidVerified={totalPaidVerified}
                            remainingPayment={remainingPayment}
                            canSubmitPayment={canSubmitPayment}
                            paymentForm={paymentForm}
                            rejectPaymentForm={rejectPaymentForm}
                            rejectPaymentId={rejectPaymentId}
                            setRejectPaymentId={setRejectPaymentId}
                            onSubmitPayment={submitPayment}
                            onVerifyPayment={verifyPayment}
                            onRejectPayment={rejectPayment}
                            onEditPayment={openEditPayment}
                            onDeletePayment={deletePayment}
                            canEditInvoice={canEditInvoice}
                            canCancelInvoice={canCancelInvoice}
                            invoiceForm={editInvoiceForm}
                            onUpdateInvoice={updateInvoice}
                            onCancelInvoice={cancelInvoice}
                        />
                    )}

                    {sample && !invoice && sample.is_chargeable === false && (
                        <SectionCard title="Invoice Sample">
                            <EmptyState
                                icon={<ReceiptText className="size-5" />}
                                title="Sample tanpa invoice"
                                description="Sample ini dibuat tanpa biaya tambahan, sehingga bisa langsung masuk ke proses delivery."
                            />
                        </SectionCard>
                    )}
                </div>

                <div className="space-y-6">
                    <SampleDeliveryCard
                        sample={sample}
                        delivery={delivery}
                        canDeliver={canDeliver}
                        canMarkDelivered={canMarkDelivered}
                        canEditDelivery={canEditDelivery}
                        canCancelDelivery={canCancelDelivery}
                        deliveryForm={deliveryForm}
                        editDeliveryForm={editDeliveryForm}
                        onSubmitDelivery={submitDelivery}
                        onUpdateDelivery={updateDelivery}
                        onCancelDelivery={cancelDelivery}
                        onMarkDelivered={markDelivered}
                    />

                    <SampleApprovalCard
                        sample={sample}
                        canApprove={canApprove}
                        revisionOpen={revisionOpen}
                        rejectOpen={rejectOpen}
                        revisionForm={revisionForm}
                        rejectForm={rejectForm}
                        setRevisionOpen={setRevisionOpen}
                        setRejectOpen={setRejectOpen}
                        onApprove={approveSample}
                        onSubmitRevision={submitRevision}
                        onSubmitReject={submitReject}
                    />

                    {samples.length > 0 && (
                        <SampleHistoryCard samples={samples} activeSampleId={activeSample?.id} />
                    )}
                </div>
            </div>

            <PaymentDialog
                open={paymentDialogOpen}
                onOpenChange={(open) => {
                    setPaymentDialogOpen(open);

                    if (!open) {
                        setEditingPayment(null);
                        editPaymentForm.reset();
                    }
                }}
                invoice={invoice}
                paymentForm={editPaymentForm}
                remainingPayment={remainingPayment}
                onSubmitPayment={updatePayment}
                mode="edit"
            />
        </div>
    );
};

export default SampleTab;