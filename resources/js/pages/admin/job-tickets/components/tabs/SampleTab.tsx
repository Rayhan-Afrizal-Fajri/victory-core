import React, { useState } from 'react';
import { router, useForm } from '@inertiajs/react';
import { toast } from 'sonner';

import type { JobTicket, Pesanan } from '../../types';
import WorkflowGate from '../WorkflowGate';

import SampleProgressStepper from '@/components/sample/sample-progress-stepper';
import SampleHistoryCard from '@/components/sample/sample-history-card';
import SampleGalleryCard from '@/components/sample/sample-gallery-card';
import SampleApprovalCard from '@/components/sample/sample-approval-card';
import SampleOverviewCard from '@/components/sample/sample-overview-card';
import SampleDeliveryCard from '@/components/sample/sample-delivery-card';

const SampleTab: React.FC<{ job: JobTicket }> = ({ job }) => {
    const [activeOrderIndex, setActiveOrderIndex] = useState<number>(0);
    const activeOrder: Pesanan = job?.orders?.[activeOrderIndex];

    const workflow = activeOrder?.workflow_status;
    const samples = activeOrder?.samples || [];
    const sample = samples[0] || null;

    const designApproved = workflow?.design_approved ?? false;
    const media = sample?.media || [];
    const delivery = sample?.delivery || null;

    const [revisionOpen, setRevisionOpen] = useState(false);
    const [rejectOpen, setRejectOpen] = useState(false);

    // Permissions based on workflow and sample status
    const canDeliver = Boolean(sample && sample.status === 'completed' && workflow?.sample_uploaded);
    const canMarkDelivered = Boolean(sample && sample.status === 'in_delivery');
    const canApprove = Boolean(sample && sample.status === 'delivered');

    const deliveryForm = useForm({
        courier_name: '',
        tracking_number: '',
        tracking_url: '',
        delivery_note: '',
    });

    const revisionForm = useForm({ customer_review_note: '' });
    const rejectForm = useForm({ customer_review_note: '' });

    // if (!designApproved && (!workflow?.sample_revision && !workflow?.sample_approved)) {
    //     return <WorkflowGate reason="Desain belum disetujui. Sampel terkunci." />;
    // }

    const editDeliveryForm = useForm({
        courier_name: delivery?.courier_name || '',
        tracking_number: delivery?.tracking_number || '',
        tracking_url: delivery?.tracking_url || '',
        delivery_note: delivery?.delivery_note || '',
    });

    const updateDelivery = (e: React.FormEvent) => {
        e.preventDefault();
        editDeliveryForm.patch(`/samples/${sample.id}/delivery`, {
            preserveScroll: true,
            onSuccess: () => toast.success('Data pengiriman sample diupdate.'),
        });
    };

    const cancelDelivery = () => {
        if (confirm('Yakin ingin membatalkan pengiriman ini?')) {
            router.delete(`/samples/${sample.id}/delivery`, {
                preserveScroll: true,
                onSuccess: () => toast.success('Pengiriman dibatalkan.'),
            });
        }
    };
    
    const canEditDelivery = Boolean(sample && sample.status === 'in_delivery');
    const canCancelDelivery = Boolean(sample && sample.status === 'in_delivery');

    // --- NEW ACTIONS: START & COMPLETE PRODUCTION ---
    const startProduction = () => {
        router.patch(`/samples/${sample.id}/start`, {}, {
            preserveScroll: true,
            onSuccess: () => toast.success('Produksi sample dimulai.'),
        });
    };

    const completeProduction = () => {
        router.patch(`/samples/${sample.id}/complete`, {}, {
            preserveScroll: true,
            onSuccess: () => toast.success('Produksi sample selesai.'),
        });
    };

    // Boleh menghapus foto selama sample belum disetujui (approved) atau dikirim
    const canDeleteMedia = Boolean(sample && sample.status !== 'approved' && sample.status !== 'delivered');

    const deleteMedia = (mediaId: number) => {
        if (confirm('Yakin ingin menghapus foto ini?')) {
            router.delete(`/samples/${mediaId}/media`, {
                preserveScroll: true,
                onSuccess: () => toast.success('Foto sample berhasil dihapus.'),
            });
        }
    };

    // --- EXISTING ACTIONS ---
    const submitDelivery = (e: React.FormEvent) => {
        e.preventDefault();
        deliveryForm.post(`/samples/${sample.id}/delivery`, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Data pengiriman sample berhasil disimpan.');
                deliveryForm.reset();
            },
        });
    };

    const markDelivered = () => {
        router.patch(`/samples/${sample.id}/mark-delivered`, {}, {
            preserveScroll: true,
            onSuccess: () => toast.success('Sample ditandai sudah diterima.'),
        });
    };

    const approveSample = () => {
        router.patch(`/samples/${sample.id}/approve`, {}, {
            preserveScroll: true,
            onSuccess: () => toast.success('Sample disetujui.'),
        });
    };

    const submitRevision = () => {
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
            {job.orders && job.orders.length > 1 && (
                <div className="mb-6 bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Pilih Produk Pesanan:</p>
                    <div className="flex gap-2 overflow-x-auto pb-2">
                        {job.orders.map((order, index) => (
                            <button
                                key={order.id}
                                onClick={() => setActiveOrderIndex(index)}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center whitespace-nowrap ${
                                    activeOrderIndex === index
                                        ? 'bg-blue-600 text-white shadow-sm'
                                        : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                                }`}
                            >
                                <span className={`mr-2 flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${activeOrderIndex === index ? 'bg-blue-500/50' : 'bg-slate-200'}`}>
                                    {index + 1}
                                </span>
                                {order.requested_product_name || order.product_name || `Produk #${index + 1}`}
                            </button>
                        ))}
                    </div>
                </div>
            )}
            <SampleProgressStepper workflow={workflow} sample={sample} />

            <div className="grid gap-6 xl:grid-cols-3">
                <div className="space-y-6 xl:col-span-2">
                    
                    {!sample && (!workflow?.sample_revision && !workflow?.sample_approved ) ? (
                        <WorkflowGate reason="Menunggu material sample diterima oleh gudang (Otomatis dibuat saat receiving)." />
                    ) : !designApproved && (!workflow?.sample_revision && !workflow?.sample_approved) ?(
                        <WorkflowGate reason="Desain belum disetujui. Sampel terkunci." />
                    ) : (
                        <>
                            {/* OVERVIEW SEKALIGUS TOMBOL ACTION PRODUKSI */}
                            <SampleOverviewCard 
                                sample={sample} 
                                activeOrder={activeOrder} 
                                onStart={startProduction}
                                onComplete={completeProduction}
                            />

                            {/* GALLERY MUNCUL JIKA SAMPLE SUDAH MULAI/SELESAI */}
                            {(workflow?.sample_started == true || workflow?.sample_completed == true) && (
                                <SampleGalleryCard
                                    media={media}
                                    sampleId={sample.id}
                                    canDeleteMedia={canDeleteMedia}
                                    onDeleteMedia={deleteMedia}
                                />
                            )}
                        </>
                    )}
                </div>

                <div className="space-y-6">
                    {sample && (
                        <>
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
                        </>
                    )}

                    {samples.length > 0 && (
                        <SampleHistoryCard samples={samples} />
                    )}
                </div>
            </div>
        </div>
    );
};

export default SampleTab;