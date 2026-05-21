import React, { useEffect, useMemo, useState } from 'react';
import { router, useForm } from '@inertiajs/react';
import { toast } from 'sonner';
import {
    CheckCircle,
    CreditCard,
    PackageCheck,
    Truck,
    Upload,
    XCircle,
} from 'lucide-react';

import type { JobTicket } from '../../types';
import SectionCard from '../SectionCard';
import WorkflowGate from '../WorkflowGate';
import { Button } from '@/components/ui/button';
import FormImageUpload from '@/components/ui/form-image';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const formatRupiah = (value: number) =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(value || 0);

const SampleTab: React.FC<{ job: JobTicket }> = ({ job }) => {
    const workflow = (job as any).workflow_status;
    const designApproved = workflow?.design_approved ?? false;

    const samples = (job as any).samples || [];
    const sample = samples[0] || null;

    const invoice = sample?.invoice || null;
    const media = sample?.media || [];
    const delivery = sample?.delivery || null;

    const [revisionOpen, setRevisionOpen] = useState(false);

    const sampleForm = useForm({
        qty: 1,
        sample_price: 0,
        catatan: '',
        is_chargeable: true,
        photos: [] as File[],
    });

    const paymentForm = useForm({
        tgl_bayar: new Date().toISOString().slice(0, 10),
        jumlah_bayar: invoice?.total_tagihan ?? 0,
        metode_pembayaran: '',
        bukti_transfer: null as File | null,
        catatan_finance: '',
    });

    useEffect(() => {
        if (invoice?.total_tagihan) {
          paymentForm.setData('jumlah_bayar', Number(invoice.total_taighan));
        }
    }, [invoice?.id]);

    const deliveryForm = useForm({
        courier_name: '',
        tracking_number: '',
        tracking_url: '',
        delivery_note: '',
    });

    const revisionForm = useForm({
        customer_review_note: '',
    });

    if (!designApproved) {
        return (
            <WorkflowGate reason="Desain belum disetujui. Sampel terkunci." />
        );
    }

    const submitSample = (e: React.FormEvent) => {
        e.preventDefault();

        sampleForm.post(`/pesanan/${job.id}/samples`, {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => {
                toast.success('Sample berhasil dibuat.');
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
                toast.success('Pembayaran sample berhasil dikirim.');
                paymentForm.reset();
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

        router.patch(`/samples/${sample.id}/mark-delivered`, {}, {
            preserveScroll: true,
            onSuccess: () => toast.success('Sample ditandai sudah diterima.'),
        });
    };

    const approveSample = () => {

        if (!sample) {
            toast.error('Sample belum tersedia.');
            return;
        }
        router.patch(`/samples/${sample.id}/approve`, {}, {
            preserveScroll: true,
            onSuccess: () => toast.success('Sample disetujui.'),
        });
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

    return (
        <div className="space-y-6">
            <SectionCard title="Progress Sample">
                <div className="grid gap-3 md:grid-cols-4">
                    <StepCard
                        icon={<PackageCheck className="size-5" />}
                        title="Sample Created"
                        active={workflow?.sample_created}
                    />
                    <StepCard
                        icon={<CreditCard className="size-5" />}
                        title="Sample Paid"
                        active={workflow?.sample_paid}
                    />
                    <StepCard
                        icon={<Truck className="size-5" />}
                        title="Delivered"
                        active={workflow?.sample_delivered}
                    />
                    <StepCard
                        icon={<CheckCircle className="size-5" />}
                        title="Approved"
                        active={workflow?.sample_approved}
                    />
                </div>
            </SectionCard>

            {!sample && (
                <SectionCard title="Buat Sample">
                    <form onSubmit={submitSample} className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <label className="text-sm font-medium">
                                    Qty Sample
                                </label>
                                <Input
                                    type="number"
                                    min={1}
                                    className="mt-1 w-full rounded-md border-slate-300 text-sm shadow-sm"
                                    value={sampleForm.data.qty}
                                    onChange={(e) =>
                                        sampleForm.setData(
                                            'qty',
                                            Number(e.target.value),
                                        )
                                    }
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium">
                                    Harga Sample
                                </label>
                                <Input
                                    type="number"
                                    min={0}
                                    className="mt-1 w-full rounded-md border-slate-300 text-sm shadow-sm"
                                    value={sampleForm.data.sample_price}
                                    onChange={(e) =>
                                        sampleForm.setData(
                                            'sample_price',
                                            Number(e.target.value),
                                        )
                                    }
                                />
                            </div>
                        </div>

                        <label className="flex items-center gap-2 text-sm">
                            <input
                                type="checkbox"
                                checked={sampleForm.data.is_chargeable}
                                onChange={(e) =>
                                    sampleForm.setData(
                                        'is_chargeable',
                                        e.target.checked,
                                    )
                                }
                            />
                            Generate invoice sample untuk customer
                        </label>

                        <div>
                            <label className="text-sm font-medium">
                                Catatan Sample
                            </label>
                            <Textarea
                                rows={3}
                                className="mt-1 w-full rounded-md border-slate-300 text-sm shadow-sm"
                                value={sampleForm.data.catatan}
                                onChange={(e) =>
                                    sampleForm.setData(
                                        'catatan',
                                        e.target.value,
                                    )
                                }
                            />
                        </div>

                        <FormImageUpload
                            label="Upload Foto Sample"
                            hint="Upload foto sample yang akan direview customer."
                            onChange={(file) =>
                                sampleForm.setData('photos', file ? [file] : [])
                            }
                            error={(sampleForm.errors as any).photos}
                        />

                        <Button
                            type="submit"
                            disabled={sampleForm.processing}
                        >
                            <Upload className="mr-2 size-4" />
                            Create Sample & Generate Invoice
                        </Button>
                    </form>
                </SectionCard>
            )}

            {sample && (
                <SectionCard title={`Sample #${sample.revision_number ?? 0}`}>
                    <div className="grid gap-4 md:grid-cols-3">
                        <InfoItem label="Qty" value={`${sample.qty} pcs`} />
                        <InfoItem
                            label="Harga"
                            value={formatRupiah(sample.sample_price)}
                        />
                        <InfoItem label="Status" value={sample.status} />
                    </div>

                    {sample.catatan && (
                        <div className="mt-4 rounded-md bg-slate-50 p-3 text-sm text-slate-700">
                            {sample.catatan}
                        </div>
                    )}
                </SectionCard>
            )}

            {sample && media.length > 0 && (
                <SectionCard title="Foto Sample">
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                        {media.map((item: any) => (
                            <img
                                key={item.id}
                                src={`/storage/${item.file_path}`}
                                alt="Sample"
                                className="aspect-square rounded-lg border object-cover"
                            />
                        ))}
                    </div>
                </SectionCard>
            )}

            {sample && invoice && (
                <SectionCard title="Invoice & Payment Sample">
                    <div className="rounded-lg border bg-slate-50 p-4">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="font-semibold">
                                    {invoice.no_invoice}
                                </p>
                                <p className="text-sm text-slate-500">
                                    Total Tagihan:{' '}
                                    {formatRupiah(invoice.total_tagihan)}
                                </p>
                            </div>

                            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                                {invoice.status_tagihan}
                            </span>
                        </div>

                        {invoice.status_tagihan !== 'Paid' && (
                            <form
                                onSubmit={submitPayment}
                                className="mt-4 space-y-3 border-t pt-4"
                            >
                                <div className="grid gap-3 md:grid-cols-3">
                                    <input
                                        type="date"
                                        className="rounded-md border-slate-300 text-sm"
                                        value={paymentForm.data.tgl_bayar}
                                        onChange={(e) =>
                                            paymentForm.setData(
                                                'tgl_bayar',
                                                e.target.value,
                                            )
                                        }
                                    />

                                    <input
                                        type="number"
                                        className="rounded-md border-slate-300 text-sm"
                                        value={paymentForm.data.jumlah_bayar}
                                        onChange={(e) =>
                                            paymentForm.setData(
                                                'jumlah_bayar',
                                                Number(e.target.value),
                                            )
                                        }
                                    />

                                    <input
                                        type="text"
                                        placeholder="Metode pembayaran"
                                        className="rounded-md border-slate-300 text-sm"
                                        value={
                                            paymentForm.data.metode_pembayaran
                                        }
                                        onChange={(e) =>
                                            paymentForm.setData(
                                                'metode_pembayaran',
                                                e.target.value,
                                            )
                                        }
                                    />
                                </div>

                                <input
                                    type="file"
                                    accept="image/*,.pdf"
                                    onChange={(e) =>
                                        paymentForm.setData(
                                            'bukti_transfer',
                                            e.target.files?.[0] || null,
                                        )
                                    }
                                />

                                <Button
                                    type="submit"
                                    disabled={paymentForm.processing}
                                >
                                    Submit Payment
                                </Button>
                            </form>
                        )}
                    </div>
                </SectionCard>
            )}

            {sample && workflow?.sample_paid && sample.status === 'paid' && (
                <SectionCard title="Delivery Sample">
                    <form onSubmit={submitDelivery} className="space-y-3">
                        <div className="grid gap-3 md:grid-cols-3">
                            <input
                                type="text"
                                placeholder="Jasa kirim"
                                className="rounded-md border-slate-300 text-sm"
                                value={deliveryForm.data.courier_name}
                                onChange={(e) =>
                                    deliveryForm.setData(
                                        'courier_name',
                                        e.target.value,
                                    )
                                }
                            />

                            <input
                                type="text"
                                placeholder="Nomor resi"
                                className="rounded-md border-slate-300 text-sm"
                                value={deliveryForm.data.tracking_number}
                                onChange={(e) =>
                                    deliveryForm.setData(
                                        'tracking_number',
                                        e.target.value,
                                    )
                                }
                            />

                            <input
                                type="text"
                                placeholder="Tracking URL"
                                className="rounded-md border-slate-300 text-sm"
                                value={deliveryForm.data.tracking_url}
                                onChange={(e) =>
                                    deliveryForm.setData(
                                        'tracking_url',
                                        e.target.value,
                                    )
                                }
                            />
                        </div>

                        <textarea
                            rows={3}
                            placeholder="Catatan pengiriman"
                            className="w-full rounded-md border-slate-300 text-sm"
                            value={deliveryForm.data.delivery_note}
                            onChange={(e) =>
                                deliveryForm.setData(
                                    'delivery_note',
                                    e.target.value,
                                )
                            }
                        />

                        <Button
                            type="submit"
                            disabled={deliveryForm.processing}
                        >
                            Mark as Shipped
                        </Button>
                    </form>
                </SectionCard>
            )}

            {sample && sample.status === 'in_delivery' && (
                <SectionCard title="Status Pengiriman">
                    <div className="space-y-3 rounded-lg border bg-slate-50 p-4 text-sm">
                        <p>Courier: {delivery?.courier_name ?? '-'}</p>
                        <p>Resi: {delivery?.tracking_number ?? '-'}</p>

                        {delivery?.tracking_url && (
                            <a
                                href={delivery.tracking_url}
                                target="_blank"
                                className="text-blue-600 hover:underline"
                            >
                                Buka Tracking
                            </a>
                        )}

                        <div>
                            <Button type="button" onClick={markDelivered}>
                                Mark as Delivered
                            </Button>
                        </div>
                    </div>
                </SectionCard>
            )}

            {sample && sample.status === 'delivered' && (
                <SectionCard title="Approval Sample">
                    <div className="space-y-4">
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                className="bg-emerald-600 text-white hover:bg-emerald-700"
                                onClick={approveSample}
                            >
                                <CheckCircle className="mr-2 size-4" />
                                Approve Sample
                            </Button>

                            <Button
                                type="button"
                                variant="outline"
                                className="border-amber-200 text-amber-700 hover:bg-amber-50"
                                onClick={() => setRevisionOpen(true)}
                            >
                                Request Revision
                            </Button>

                            <Button
                                type="button"
                                variant="outline"
                                className="border-red-200 text-red-700 hover:bg-red-50"
                            >
                                <XCircle className="mr-2 size-4" />
                                Reject
                            </Button>
                        </div>

                        {revisionOpen && (
                            <div className="space-y-2 rounded-lg border bg-amber-50 p-4">
                                <label className="text-sm font-medium text-amber-900">
                                    Catatan Revisi Sample
                                </label>

                                <textarea
                                    rows={3}
                                    className="w-full rounded-md border-amber-200 text-sm"
                                    value={
                                        revisionForm.data.customer_review_note
                                    }
                                    onChange={(e) =>
                                        revisionForm.setData(
                                            'customer_review_note',
                                            e.target.value,
                                        )
                                    }
                                />

                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setRevisionOpen(false)}
                                    >
                                        Batal
                                    </Button>

                                    <Button
                                        type="button"
                                        onClick={submitRevision}
                                        disabled={revisionForm.processing}
                                    >
                                        Kirim Revisi
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </SectionCard>
            )}
        </div>
    );
};

const StepCard = ({
    title,
    icon,
    active,
}: {
    title: string;
    icon: React.ReactNode;
    active: boolean;
}) => {
    return (
        <div
            className={`rounded-xl border p-4 ${
                active
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                    : 'border-slate-200 bg-white text-slate-500'
            }`}
        >
            <div className="mb-2">{icon}</div>
            <p className="text-sm font-semibold">{title}</p>
        </div>
    );
};

const InfoItem = ({ label, value }: { label: string; value: string }) => {
    return (
        <div className="rounded-lg border bg-white p-3">
            <p className="text-xs text-slate-500">{label}</p>
            <p className="font-semibold text-slate-800">{value}</p>
        </div>
    );
};

export default SampleTab;