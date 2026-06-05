import React, { useState } from 'react';
import { router, useForm } from '@inertiajs/react';
import { CheckCircle2, PackageCheck, Play, Truck } from 'lucide-react';
import { toast } from 'sonner';

import SectionCard from '@/pages/admin/job-tickets/components/SectionCard';
import EmptyState from '@/components/sample/empty-state';
import Field from '@/components/sample/field';
import Badge from '@/components/sample/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import FormattedNumberInput from '../ui/formatted-number-input';

type ProductionRunBoardProps = {
    job: any;
    run: any | null;
    runType: 'sample' | 'production';
};

const statusClass: Record<string, string> = {
    draft: 'bg-slate-100 text-slate-700 border-slate-200',
    in_progress: 'bg-blue-100 text-blue-700 border-blue-200',
    waiting_qc: 'bg-amber-100 text-amber-700 border-amber-200',
    qc_completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    packed: 'bg-violet-100 text-violet-700 border-violet-200',
    in_delivery: 'bg-blue-100 text-blue-700 border-blue-200',
    delivered: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    approved: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    revision_needed: 'bg-amber-100 text-amber-700 border-amber-200',
    rejected: 'bg-red-100 text-red-700 border-red-200',
};

function formatDateTime(value?: string | null) {
    if (!value) return '-';

    return new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(value));
}

const ProductionRunBoard = ({ job, run, runType }: ProductionRunBoardProps) => {
    const ensureRunForm = useForm({
        quantity: Number((job as any).sample_qty || 3),
    });

    const packingForm = useForm({
        packing_notes: '',
    });

    const deliveryForm = useForm({
        courier_name: '',
        tracking_number: '',
        tracking_url: '',
        delivery_note: '',
    });

    const reviewForm = useForm({
        customer_review_note: '',
    });

    const ensureSampleRun = (e: React.FormEvent) => {
        e.preventDefault();

        const ensureRunUrl = runType === 'sample'
            ? `/pesanan/${job.id}/production-runs/sample/ensure`
            : `/pesanan/${job.id}/production-runs/production/ensure`;

        ensureRunForm.post(ensureRunUrl, {
            preserveScroll: true,
            onSuccess: () => toast.success(
                runType === 'sample'
                    ? 'Sample production run berhasil dibuat.'
                    : 'Production run berhasil dibuat.',
            ),
        });
    };

    const completePacking = (e: React.FormEvent) => {
        e.preventDefault();

        if (!run) return;

        packingForm.patch(`/production-runs/${run.id}/packing`, {
            preserveScroll: true,
            onSuccess: () => toast.success(
                runType === 'sample'
                    ? 'Packing sample selesai.'
                    : 'Packing production selesai.',
            ),
        });
    };

    const submitDelivery = (e: React.FormEvent) => {
        e.preventDefault();

        if (!run) return;

        deliveryForm.patch(`/production-runs/${run.id}/delivery`, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(
                    runType === 'sample'
                        ? 'Delivery sample berhasil disimpan.'
                        : 'Delivery production berhasil disimpan.'
                );
                deliveryForm.reset();
            },
        });
    };

    const markDelivered = () => {
        if (!run) return;

        router.patch(
            `/production-runs/${run.id}/mark-delivered`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => toast.success(
                    runType === 'sample'
                        ? 'Sample ditandai delivered.'
                        : 'Production ditandai delivered.'
                ),
            },
        );
    };

    const approveSample = () => {
        if (!run) return;

        router.patch(
            `/production-runs/${run.id}/approve-sample`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => toast.success('Sample disetujui.'),
            },
        );
    };

    const requestRevision = () => {
        if (!run) return;

        reviewForm.patch(`/production-runs/${run.id}/revision-sample`, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Revisi sample berhasil diminta.');
                reviewForm.reset();
            },
        });
    };

    const rejectSample = () => {
        if (!run) return;

        reviewForm.patch(`/production-runs/${run.id}/reject-sample`, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Sample ditolak.');
                reviewForm.reset();
            },
        });
    };

    const title = runType === 'sample' ? 'Sample Production' : 'Production';
    const createLabel = runType === 'sample' ? 'Create Sample Production' : 'Create Production';

    if (!run) {
        return (
            <SectionCard title={title}>
                <form onSubmit={ensureSampleRun} className="space-y-4">
                    <EmptyState
                        icon={<PackageCheck className="size-5" />}
                        title={title}
                        description={`Buat ${runType === 'sample' ? 'sample' : 'production'} run dari daftar manufaktur yang sudah ditentukan di Design Tab.`}
                    />

                    <div className="max-w-xs">
                        <Field label="Sample Qty" error={ensureRunForm.errors.quantity}>
                            <FormattedNumberInput
                                value={ensureRunForm.data.quantity}
                                onValueChange={(value) => ensureRunForm.setData('quantity', value)}
                                placeholder='cth: 5'
                            />
                        </Field>
                    </div>

                    <Button type="submit" disabled={ensureRunForm.processing}>
                        {createLabel}
                    </Button>
                </form>
            </SectionCard>
        );
    }

    function capitalizeWord(word: string) {
        if (!word) return "";
        return word.charAt(0).toUpperCase() + word.slice(1);
    }
    
    const workflow = job.workflow_status;
    
    const isFinalPaymentPaid =
        workflow?.final_payment_paid === true ||
        workflow?.final_payment_paid === 1 ||
        workflow?.final_payment_paid === '1';

    const processes = run.processes || [];
    const allQcPassed =
        processes.length > 0 &&
        processes.every((process: any) => process.status === 'completed' && process.qc_status === 'passed');

    const canPacking = allQcPassed && !run.packing_completed;
    const canDelivery =
        run.packing_completed &&
        !['in_delivery', 'delivered', 'approved'].includes(run.status) &&
        (
            runType === 'sample' ||
            isFinalPaymentPaid
        );
    const canMarkDelivered = run.status === 'in_delivery';
    const canReview = run.status === 'delivered';

    return (
        <div className="space-y-6">
            <SectionCard title={`${title} Overview`}>
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                        <p className="text-lg font-bold text-slate-900">
                            {title}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                            Qty: {run.quantity} pcs
                        </p>
                    </div>

                    <Badge className={statusClass[run.status] || statusClass.draft}>
                        {run.status}
                    </Badge>
                </div>
            </SectionCard>

            <SectionCard title="Production Process + QC">
                <div className="space-y-4">
                    {processes.map((process: any) => (
                        <ProductionProcessCard key={process.id} process={process} runQuantity={Number(run.quantity || 0)} />
                    ))}
                </div>
            </SectionCard>

            <SectionCard title={`Packing ${capitalizeWord(runType)}`}>
                {run.packing_completed ? (
                    <div className="rounded-xl border bg-emerald-50 p-4 text-sm text-emerald-700">
                        Packing sudah selesai.
                    </div>
                ) : canPacking ? (
                    <form onSubmit={completePacking} className="space-y-4">
                        <Field label="Packing Notes" error={packingForm.errors.packing_notes}>
                            <Textarea
                                rows={3}
                                value={packingForm.data.packing_notes}
                                onChange={(e) =>
                                    packingForm.setData('packing_notes', e.target.value)
                                }
                                placeholder={`Catatan packing ${runType}...`}
                            />
                        </Field>

                        <Button type="submit" disabled={packingForm.processing}>
                            <CheckCircle2 className="size-4" />
                            Complete Packing
                        </Button>
                    </form>
                ) : (
                    <p className="text-sm text-slate-500">
                        Packing bisa dilakukan setelah semua process QC passed.
                    </p>
                )}
            </SectionCard>

            <SectionCard title={`Delivery ${capitalizeWord(runType)}`}>
                {canDelivery && (
                    <form onSubmit={submitDelivery} className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <Field label="Courier" error={deliveryForm.errors.courier_name}>
                                <Input
                                    value={deliveryForm.data.courier_name}
                                    onChange={(e) =>
                                        deliveryForm.setData('courier_name', e.target.value)
                                    }
                                />
                            </Field>

                            <Field label="Tracking Number" error={deliveryForm.errors.tracking_number}>
                                <Input
                                    value={deliveryForm.data.tracking_number}
                                    onChange={(e) =>
                                        deliveryForm.setData('tracking_number', e.target.value)
                                    }
                                />
                            </Field>
                        </div>

                        <Field label="Tracking URL" error={deliveryForm.errors.tracking_url}>
                            <Input
                                value={deliveryForm.data.tracking_url}
                                onChange={(e) =>
                                    deliveryForm.setData('tracking_url', e.target.value)
                                }
                            />
                        </Field>

                        <Field label="Delivery Note" error={deliveryForm.errors.delivery_note}>
                            <Textarea
                                rows={3}
                                value={deliveryForm.data.delivery_note}
                                onChange={(e) =>
                                    deliveryForm.setData('delivery_note', e.target.value)
                                }
                            />
                        </Field>

                        <Button type="submit" disabled={deliveryForm.processing}>
                            <Truck className="size-4" />
                            Submit Delivery
                        </Button>
                    </form>
                )}

                {canMarkDelivered && (
                    <Button type="button" onClick={markDelivered}>
                        Mark Delivered
                    </Button>
                )}

                {['delivered', 'approved'].includes(run.status) && (
                    <div className="rounded-xl border bg-emerald-50 p-4 text-sm text-emerald-700">
                        {capitalizeWord(runType)} sudah delivered.
                    </div>
                )}

                {!canDelivery && !canMarkDelivered && !['delivered', 'approved'].includes(run.status) && (
                    <p className="text-sm text-slate-500">
                        Delivery bisa dilakukan setelah packing selesai{runType === 'production' ? ' dan pembayaran final dilakukan' : ''}.
                    </p>
                )}
            </SectionCard>

            {runType === 'sample' && (
                <SectionCard title="Sample Approval">
                    {canReview ? (
                        <div className="space-y-4">
                            <Field label="Catatan Customer" error={reviewForm.errors.customer_review_note}>
                                <Textarea
                                    rows={3}
                                    value={reviewForm.data.customer_review_note}
                                    onChange={(e) =>
                                        reviewForm.setData('customer_review_note', e.target.value)
                                    }
                                    placeholder="Catatan revisi/penolakan jika ada..."
                                />
                            </Field>

                            <div className="flex flex-wrap gap-2">
                                <Button type="button" onClick={approveSample}>
                                    Approve Sample
                                </Button>

                                <Button type="button" variant="outline" onClick={requestRevision}>
                                    Request Revision
                                </Button>

                                <Button
                                    type="button"
                                    variant="outline"
                                    className="border-red-200 text-red-700 hover:bg-red-50"
                                    onClick={rejectSample}
                                >
                                    Reject Sample
                                </Button>
                            </div>
                        </div>
                    ) : run.status === 'approved' ? (
                        <div className="rounded-xl border bg-emerald-50 p-4 text-sm text-emerald-700">
                            Sample sudah approved.
                        </div>
                    ) : (
                        <p className="text-sm text-slate-500">
                            Approval bisa dilakukan setelah sample delivered.
                        </p>
                    )}
                </SectionCard>
            )}
        </div>
    );
};

const ProductionProcessCard = ({ process, runQuantity }: { process: any; runQuantity: number }) => {
    const qcForm = useForm({
        checked_qty: Number(process.checked_qty || 0),
        passed_qty: Number(process.passed_qty || 0),
        defect_qty: Number(process.defect_qty || 0),
        qc_notes: process.qc_notes || '',
        corrective_action: process.corrective_action || '',
    });

    const clampQty = (value: number, min = 0, max = runQuantity) => {
        const number = Number(value || 0);

        if (Number.isNaN(number)) return min;

        return Math.min(Math.max(number, min), max);
    };

    const setCheckedQty = (value: number) => {
        const checkedQty = clampQty(value);

        const currentPassed = Number(qcForm.data.passed_qty || 0);
        const nextPassed = Math.min(currentPassed, checkedQty);
        const nextDefect = Math.max(checkedQty - nextPassed, 0);

        qcForm.setData({
            ...qcForm.data,
            checked_qty: checkedQty,
            passed_qty: nextPassed,
            defect_qty: nextDefect,
        });
    };

    const setPassedQty = (value: number) => {
        const checkedQty = clampQty(Number(qcForm.data.checked_qty || 0));
        const passedQty = clampQty(value, 0, checkedQty);
        const defectQty = Math.max(checkedQty - passedQty, 0);

        qcForm.setData({
            ...qcForm.data,
            passed_qty: passedQty,
            defect_qty: defectQty,
        });
    };

    const setDefectQty = (value: number) => {
        const checkedQty = clampQty(Number(qcForm.data.checked_qty || 0));
        const defectQty = clampQty(value, 0, checkedQty);
        const passedQty = Math.max(checkedQty - defectQty, 0);

        qcForm.setData({
            ...qcForm.data,
            defect_qty: defectQty,
            passed_qty: passedQty,
        });
    };

    const startProcess = () => {
        router.patch(
            `/production-run-processes/${process.id}/start`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => toast.success('Process dimulai.'),
            },
        );
    };

    const completeProcess = () => {
        router.patch(
            `/production-run-processes/${process.id}/complete`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => toast.success('Process selesai.'),
            },
        );
    };

    const submitQc = (e: React.FormEvent) => {
        e.preventDefault();

        qcForm.patch(`/production-run-processes/${process.id}/qc`, {
            preserveScroll: true,
            onSuccess: () => toast.success('QC berhasil disimpan.'),
        });
    };

    const checkedQty = Number(qcForm.data.checked_qty || 0);
    const passedQty = Number(qcForm.data.passed_qty || 0);
    const defectQty = Number(qcForm.data.defect_qty || 0);

    const qcInvalid =
        checkedQty <= 0 ||
        checkedQty > runQuantity ||
        passedQty < 0 ||
        defectQty < 0 ||
        passedQty + defectQty !== checkedQty;

    return (
        <div className="rounded-2xl border bg-white p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <p className="font-semibold text-slate-900">
                            {process.sequence}. {process.work_name}
                        </p>

                        <Badge className={statusClass[process.status] || statusClass.draft}>
                            {process.status}
                        </Badge>

                        <Badge
                            className={
                                process.qc_status === 'passed'
                                    ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                                    : process.qc_status === 'failed'
                                      ? 'bg-red-100 text-red-700 border-red-200'
                                      : 'bg-slate-100 text-slate-700 border-slate-200'
                            }
                        >
                            QC: {process.qc_status}
                        </Badge>
                    </div>

                    <div className="mt-3 grid gap-2 text-xs text-slate-500 md:grid-cols-3">
                        <ProcessTimeBox
                            label="Started"
                            value={formatDateTime(process.started_at)}
                            active={Boolean(process.started_at)}
                        />

                        <ProcessTimeBox
                            label="Completed"
                            value={formatDateTime(process.completed_at)}
                            active={Boolean(process.completed_at)}
                        />

                        <ProcessTimeBox
                            label="QC Checked"
                            value={formatDateTime(process.qc_checked_at)}
                            active={Boolean(process.qc_checked_at)}
                            note={process.qc_checked_by ? `by ${process.qc_checked_by}` : undefined}
                        />
                    </div>
                </div>

                <div className="flex gap-2">
                    {process.status === 'pending' && (
                        <Button type="button" size="sm" onClick={startProcess}>
                            <Play className="size-4" />
                            Start
                        </Button>
                    )}

                    {process.status === 'in_progress' && (
                        <Button type="button" size="sm" onClick={completeProcess}>
                            Complete
                        </Button>
                    )}
                </div>
            </div>

            {process.status === 'completed' && process.qc_status !== 'passed' && (
                <form onSubmit={submitQc} className="mt-4 space-y-4 rounded-xl border bg-slate-50 p-4">
                    <div className="rounded-lg border bg-white p-3 text-xs text-slate-600">
                        Qty {process.work_name} yang dikerjakan:{' '}
                        <span className="font-semibold text-slate-900">
                            {runQuantity} pcs
                        </span>
                        . Checked qty tidak boleh melebihi jumlah ini.
                    </div>
                    <div className="grid gap-4 md:grid-cols-3">
                        <Field label="Checked Qty" error={qcForm.errors.checked_qty}>
                            <FormattedNumberInput
                                value={qcForm.data.checked_qty}
                                max={runQuantity}
                                min={0}
                                onValueChange={setCheckedQty}
                                placeholder={`Maks ${runQuantity}`}
                            />
                        </Field>

                        <Field label="Passed Qty" error={qcForm.errors.passed_qty}>
                            <FormattedNumberInput
                                value={qcForm.data.passed_qty}
                                max={qcForm.data.checked_qty}
                                min={0}
                                onValueChange={setPassedQty}
                                placeholder={`Maks ${qcForm.data.checked_qty || runQuantity}`}
                            />
                        </Field>

                        <Field label="Defect Qty" error={qcForm.errors.defect_qty}>
                            <FormattedNumberInput
                                value={qcForm.data.defect_qty}
                                onValueChange={setDefectQty}
                                max={qcForm.data.checked_qty}
                                min={0}
                                placeholder={`Maks ${qcForm.data.checked_qty || runQuantity}`}
                            />
                        </Field>
                    </div>

                    <Field label="QC Notes" error={qcForm.errors.qc_notes}>
                        <Textarea
                            rows={2}
                            value={qcForm.data.qc_notes}
                            onChange={(e) => qcForm.setData('qc_notes', e.target.value)}
                        />
                    </Field>

                    <Field label="Corrective Action" error={qcForm.errors.corrective_action}>
                        <Input
                            value={qcForm.data.corrective_action}
                            onChange={(e) =>
                                qcForm.setData('corrective_action', e.target.value)
                            }
                            placeholder="use_stock / repurchase / rework_only"
                        />
                    </Field>
                    {qcInvalid && (
                        <p className="text-xs text-red-500">
                            Checked qty wajib lebih dari 0, tidak boleh melebihi {runQuantity} pcs,
                            dan Passed + Defect harus sama dengan Checked.
                        </p>
                    )}

                    <Button type="submit" disabled={qcForm.processing || qcInvalid}>
                        Submit QC
                    </Button>
                </form>
            )}
        </div>
    );
};

function ProcessTimeBox({
    label,
    value,
    active = false,
    note,
}: {
    label: string;
    value: string;
    active?: boolean;
    note?: string;
}) {
    return (
        <div
            className={`rounded-lg border p-3 ${
                active
                    ? 'border-emerald-200 bg-emerald-50'
                    : 'border-slate-200 bg-slate-50'
            }`}
        >
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                {label}
            </p>
            <p className={`mt-1 font-medium ${active ? 'text-emerald-700' : 'text-slate-500'}`}>
                {value}
            </p>
            {note && <p className="mt-1 text-[11px] text-slate-500">{note}</p>}
        </div>
    );
}

export default ProductionRunBoard;