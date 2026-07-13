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
import { CheckCircle2 } from 'lucide-react'; // Pastikan ikon ini di-import

const SampleTab: React.FC<{ job: JobTicket }> = ({ job }) => {
    const [activeOrderIndex, setActiveOrderIndex] = useState<number>(0);
    
    // Pastikan aman dengan default object/array
    const activeOrder: Pesanan | undefined = job?.orders?.[activeOrderIndex];
    const workflow = activeOrder?.workflow_status;
    const samples = activeOrder?.samples || [];
    const sample = samples[0]; 

    const designApproved = workflow?.design_approved ?? false;
    
    // PENGECEKAN UTAMA: Apakah pesanan ini butuh sample?
    // Mengubah nilai menjadi number untuk memastikannya. Jika null/undefined, dianggap 0.
    const isNoSample = Number(activeOrder?.sample_qty || 0) <= 0 && job.quotations?.length !== 0;
    
    // Gunakan ternary if biasa. Dijamin 100% aman dari error 'undefined'
    const media = sample ? sample.media : [];
    const delivery = sample ? sample.delivery : null;

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

    const editDeliveryForm = useForm({
        courier_name: delivery?.courier_name || '',
        tracking_number: delivery?.tracking_number || '',
        tracking_url: delivery?.tracking_url || '',
        delivery_note: delivery?.delivery_note || '',
    });

    const updateDelivery = (e: React.FormEvent) => {
        e.preventDefault();
        if (!sample) return; 
        editDeliveryForm.patch(`/samples/${sample.id}/delivery`, {
            preserveScroll: true,
            onSuccess: () => toast.success('Data pengiriman sample diupdate.'),
        });
    };

    const cancelDelivery = () => {
        if (!sample) return;
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
        if (!sample) return;
        router.patch(`/samples/${sample.id}/start`, {}, {
            preserveScroll: true,
            onSuccess: () => toast.success('Produksi sample dimulai.'),
        });
    };

    const completeProduction = () => {
        if (!sample) return;
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
        if (!sample) return;
        deliveryForm.post(`/samples/${sample.id}/delivery`, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Data pengiriman sample berhasil disimpan.');
                deliveryForm.reset();
            },
        });
    };

    const markDelivered = () => {
        if (!sample) return;
        router.patch(`/samples/${sample.id}/mark-delivered`, {}, {
            preserveScroll: true,
            onSuccess: () => toast.success('Sample ditandai sudah diterima.'),
        });
    };

    const approveSample = () => {
        if (!sample) return;
        router.patch(`/samples/${sample.id}/approve`, {}, {
            preserveScroll: true,
            onSuccess: () => toast.success('Sample disetujui.'),
        });
    };

    const submitRevision = () => {
        if (!sample) return;
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
        if (!sample) return;
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
                <div className="mb-6 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Pilih Produk Pesanan:</p>
                    <div className="flex gap-2 overflow-x-auto pb-2">
                        {job.orders.map((order, index) => (
                            <button
                                key={order.id}
                                onClick={() => setActiveOrderIndex(index)}
                                className={`flex items-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                                    activeOrderIndex === index
                                        ? 'bg-blue-600 text-white shadow-sm'
                                        : 'border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
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
            
            {/* Sembunyikan stepper jika tidak butuh sample untuk menghindari kebingungan UI */}
            {!isNoSample && <SampleProgressStepper workflow={workflow} sample={sample} />}

            <div className="grid gap-6 xl:grid-cols-3">
                <div className={`space-y-6 ${isNoSample || (!sample && (!workflow?.sample_revision && !workflow?.sample_approved)) || (!designApproved && (!workflow?.sample_revision && !workflow?.sample_approved)) ? 'col-span-3' : 'xl:col-span-2'}`}>
                    {/* LOGIKA PENGECEKAN UTAMA */}
                    {isNoSample ? (
                        <div className="flex flex-col items-center justify-center rounded-lg border border-emerald-100 bg-emerald-50 p-12 text-center shadow-sm">
                            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                                <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                            </div>
                            <h3 className="text-xl font-semibold text-emerald-900">Tahap Sample Dilewati</h3>
                            <p className="mt-2 max-w-md text-sm text-emerald-700">
                                Kebutuhan Sample Qty untuk pesanan ini adalah 0. Sistem otomatis meneruskan pesanan ini langsung ke tahap Produksi.
                            </p>
                        </div>
                    ) : !sample && (!workflow?.sample_revision && !workflow?.sample_approved) ? (
                        <WorkflowGate reason="Menunggu material sample diterima oleh gudang (Otomatis dibuat saat receiving)." />
                    ) : !designApproved && (!workflow?.sample_revision && !workflow?.sample_approved) ? (
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
                            {(sample && (workflow?.sample_started == true || workflow?.sample_completed == true)) && (
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
                    {/* Sembunyikan action cards jika isNoSample true, 
                        karena tidak ada pengiriman atau persetujuan yang bisa dilakukan lagi */}
                    {!isNoSample && sample && (
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

                    {/* HISTORY TETAP MUNCUL jika samples.length > 0 
                        Ini memungkinkan user tetap melihat riwayat sample jika sebelumnya 
                        pernah dibuat, lalu direvisi, lalu akhirnya memutuskan tidak buat sample (qty diubah jadi 0) */}
                    {samples.length > 0 && (
                        <SampleHistoryCard samples={samples} />
                    )}
                </div>
            </div>
        </div>
    );
};

export default SampleTab;