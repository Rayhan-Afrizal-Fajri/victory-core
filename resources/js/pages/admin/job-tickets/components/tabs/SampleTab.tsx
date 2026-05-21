import React, { useEffect, useMemo, useState } from 'react';
import { router, useForm } from '@inertiajs/react';
import { toast } from 'sonner';
import { ReceiptText } from 'lucide-react';

import type { JobTicket } from '../../types';
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


const SampleTab: React.FC<{ job: JobTicket }> = ({ job }) => {
    const workflow = job.workflow_status;
    const designApproved = workflow?.design_approved ?? false;

    const samples = job.samples || [];
    const sample = samples[0] || null;
    
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

    const canCreateSample = designApproved && !workflow?.sample_approved;
    const canSubmitPayment = Boolean(sample && invoice && invoice.status_tagihan !== 'Paid');
    const canDeliver = Boolean(sample && workflow?.sample_paid && sample.status === 'paid');
    const canMarkDelivered = Boolean(sample && sample.status === 'in_delivery');
    const canApprove = Boolean(sample && sample.status === 'delivered');

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

        if (!sample) {
            toast.error('Sample belum tersedia.');
            return;
        }

        paymentForm.post(`/samples/${sample.id}/payments`, {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => {
                toast.success('Pembayaran sample berhasil dikirim dan menunggu verifikasi.');
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

        if (!sample) {
            toast.error('Sample belum tersedia.');
            return;
        }

        deliveryForm.post(`/samples/${sample.id}/delivery`, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Data pengiriman sample berhasil disimpan.');
                deliveryForm.reset();
            },
        });
    };

    const markDelivered = () => {
        if (!sample) {
            toast.error('Sample belum tersedia.');
            return;
        }

        router.patch(
            `/samples/${sample.id}/mark-delivered`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => toast.success('Sample ditandai sudah diterima.'),
            },
        );
    };

    const approveSample = () => {
        if (!sample) {
            toast.error('Sample belum tersedia.');
            return;
        }

        router.patch(
            `/samples/${sample.id}/approve`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => toast.success('Sample disetujui.'),
            },
        );
    };

    const submitRevision = () => {
        if (!sample) {
            toast.error('Sample belum tersedia.');
            return;
        }

        revisionForm.patch(`/samples/${sample.id}/revision`, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Revisi sample berhasil diminta.');
                revisionForm.reset();
                setRevisionOpen(false);
            },
        });
    };

    const submitReject = () => {
        if (!sample) {
            toast.error('Sample belum tersedia.');
            return;
        }

        rejectForm.patch(`/samples/${sample.id}/reject`, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Sample ditolak.');
                rejectForm.reset();
                setRejectOpen(false);
            },
        });
    };

    return (
        <div className="space-y-6">
            <SampleProgressStepper workflow={workflow} sample={sample} />

            <div className="grid gap-6 xl:grid-cols-3">
                <div className="space-y-6 xl:col-span-2">
                    {!sample && canCreateSample && (
                        <SampleCreateCard
                            form={sampleForm}
                            onSubmit={submitSample}
                        />
                    )}

                    {sample && <SampleOverviewCard sample={sample} />}

                    {sample && (
                        <SampleGalleryCard
                            media={media}
                            sampleId={sample.id}
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
                        deliveryForm={deliveryForm}
                        onSubmitDelivery={submitDelivery}
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

                    {samples.length > 1 && (
                        <SampleHistoryCard samples={samples} />
                    )}
                </div>
            </div>
        </div>
    );
};

export default SampleTab;