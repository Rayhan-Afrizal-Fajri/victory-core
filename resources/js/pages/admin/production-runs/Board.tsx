import React, { useState } from 'react';
import { router, useForm } from '@inertiajs/react';
import { AlertTriangle, CheckCircle2, Play, Clock, User, Package } from 'lucide-react';
import { toast } from 'sonner';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import Badge from '@/components/sample/badge';
import Field from '@/components/sample/field';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import FormattedNumberInput from '@/components/ui/formatted-number-input';

interface WorkerTask {
    id: string;
    status: string;
    sequence: number;
    work_name: string;
    quantity: number;
    started_at?: string;
    completed_at?: string;
    pesanan_manufacturing_spec: {
        id: string;
        vendor_id?: string;
    };
    production_run: {
        id: string;
        pesanan: {
            id: string;
            produk: string;
            requested_product_name: string;
            job_ticket: {
                id: string;
                no_job_ticket: string;
                deadline: string;
            };
        };
    };
}

interface QCTask {
    id: string;
    status: string;
    qc_status: string;
    sequence: number;
    work_name: string;
    quantity: number;
    checked_qty?: number;
    passed_qty?: number;
    defect_qty?: number;
    qc_notes?: string;
    corrective_action?: string;
    defect_reason?: string;
    completed_at?: string;
    pesanan_manufacturing_spec: {
        id: string;
        vendor_id?: string;
        vendor?: {
            name: string;
        };
    };
    production_run: {
        id: string;
        pesanan: {
            id: string;
            produk: string;
            requested_product_name: string;
            job_ticket: {
                id: string;
                no_job_ticket: string;
            };
        };
    };
}

type BoardProps = {
    workerTasks: WorkerTask[];
    qcTasks: QCTask[];
};

const statusClass: Record<string, string> = {
    pending: 'bg-slate-100 text-slate-700 border-slate-200',
    in_progress: 'bg-blue-100 text-blue-700 border-blue-200',
    completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
};

const qcStatusClass: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700 border-amber-200',
    passed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    conditionally_passed: 'bg-orange-100 text-orange-700 border-orange-200',
    failed: 'bg-red-100 text-red-700 border-red-200',
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

function isDeadlineClose(deadline: string): boolean {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const daysUntilDeadline = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilDeadline <= 3 && daysUntilDeadline >= 0;
}

function formatDeadline(deadline: string): string {
    return new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    }).format(new Date(deadline));
}

const ProductionBoard = ({ workerTasks, qcTasks }: BoardProps) => {
    const [activeTab, setActiveTab] = useState<'worker' | 'qc'>('worker');

    return (
        <div className="min-h-screen bg-slate-50 p-6">
            <div className="mx-auto max-w-7xl">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-900">Papan Kerja Produksi</h1>
                    <p className="mt-2 text-slate-600">Kelola tugas produksi dan QC dengan mudah</p>
                </div>

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'worker' | 'qc')}>
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="worker">
                            Antrean Kerja ({workerTasks.length})
                        </TabsTrigger>
                        <TabsTrigger value="qc">
                            Antrean QC ({qcTasks.length})
                        </TabsTrigger>
                    </TabsList>

                    {/* Worker Board Tab */}
                    <TabsContent value="worker" className="mt-6">
                        <WorkerBoard tasks={workerTasks} />
                    </TabsContent>

                    {/* QC Board Tab */}
                    <TabsContent value="qc" className="mt-6">
                        <QCBoard tasks={qcTasks} />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
};

function WorkerBoard({ tasks }: { tasks: WorkerTask[] }) {
    if (tasks.length === 0) {
        return (
            <div className="rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 p-12 text-center">
                <Package className="mx-auto h-12 w-12 text-slate-400" />
                <h3 className="mt-4 text-lg font-medium text-slate-600">Tidak ada tugas</h3>
                <p className="mt-1 text-sm text-slate-500">Semua tugas produksi telah selesai!</p>
            </div>
        );
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {tasks.map((task) => (
                <WorkerTaskCard key={task.id} task={task} />
            ))}
        </div>
    );
}

function WorkerTaskCard({ task }: { task: WorkerTask }) {

    const productName = task.production_run.pesanan.produk || task.production_run.pesanan.requested_product_name;
    const jobNo = task.production_run.pesanan.job_ticket.no_job_ticket;
    const deadline = task.production_run.pesanan.job_ticket.deadline;
    const isDeadlineNear = isDeadlineClose(deadline);

    const startProcess = () => {
        router.patch(
            `/production-run-processes/${task.id}/start`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => toast.success('Proses dimulai.'),
            },
        );
    };

    const completeProcess = () => {
        router.patch(
            `/production-run-processes/${task.id}/complete`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => toast.success('Proses selesai.'),
            },
        );
    };

    return (
        <Card className="overflow-hidden border-l-4 border-l-blue-500 transition-all hover:shadow-lg">
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                            {jobNo}
                        </p>
                        <CardTitle className="mt-1 text-lg line-clamp-2">
                            {task.sequence}. {task.work_name}
                        </CardTitle>
                    </div>
                    <Badge className={statusClass[task.status] || statusClass.pending}>
                        {task.status === 'pending' ? 'Menunggu' : 'Sedang Dikerjakan'}
                    </Badge>
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Product & Qty Info */}
                <div className="space-y-2 rounded-lg bg-slate-50 p-3">
                    <p className="text-sm text-slate-600">
                        <span className="font-semibold text-slate-900">{productName}</span>
                    </p>
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600">Kuantitas:</span>
                        <span className="font-bold text-slate-900">{task.quantity} pcs</span>
                    </div>
                </div>

                {/* Deadline */}
                <div className="flex items-center gap-2">
                    <Clock className={`h-4 w-4 ${isDeadlineNear ? 'text-red-500' : 'text-slate-400'}`} />
                    <span className={`text-sm ${isDeadlineNear ? 'font-semibold text-red-600' : 'text-slate-600'}`}>
                        {formatDeadline(deadline)}
                    </span>
                    {isDeadlineNear && (
                        <Badge className="bg-red-100 text-red-700 border-red-200 text-xs">
                            Segera
                        </Badge>
                    )}
                </div>

                {/* Time Info */}
                {task.started_at && (
                    <p className="text-xs text-slate-500">
                        Dimulai: {formatDateTime(task.started_at)}
                    </p>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                    {task.status === 'pending' && (
                        <Button
                            size="sm"
                            className="flex-1"
                            onClick={startProcess}
                        >
                            <Play className="mr-2 h-4 w-4" />
                            Mulai Kerjakan
                        </Button>
                    )}

                    {task.status === 'in_progress' && (
                        <Button
                            size="sm"
                            className="flex-1"
                            onClick={completeProcess}
                        >
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Selesaikan
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

function QCBoard({ tasks }: { tasks: QCTask[] }) {
    if (tasks.length === 0) {
        return (
            <div className="rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 p-12 text-center">
                <CheckCircle2 className="mx-auto h-12 w-12 text-slate-400" />
                <h3 className="mt-4 text-lg font-medium text-slate-600">Tidak ada tugas QC</h3>
                <p className="mt-1 text-sm text-slate-500">Semua tugas QC sudah diselesaikan!</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {tasks.map((task) => (
                <QCTaskCard key={task.id} task={task} />
            ))}
        </div>
    );
}

function QCTaskCard({ task }: { task: QCTask }) {
    console.log(task);
    const productName = task.production_run.pesanan.produk || task.production_run.pesanan.requested_product_name;
    const jobNo = task.production_run.pesanan.job_ticket.no_job_ticket;
    const vendorName = task.pesanan_manufacturing_spec.vendor?.name;
    const isExternalWork = !!task.pesanan_manufacturing_spec.vendor_id;

    const qcForm = useForm({
        checked_qty: Number(task.checked_qty || 0),
        passed_qty: Number(task.passed_qty || 0),
        defect_qty: Number(task.defect_qty || 0),
        qc_notes: task.qc_notes || '',
        defect_reason: task.defect_reason || '',
        corrective_action: task.corrective_action || '',
    });

    const clampQty = (value: number, min = 0, max = task.quantity) => {
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

    const submitQc = (e: React.FormEvent) => {
        e.preventDefault();

        qcForm.patch(`/production-run-processes/${task.id}/qc`, {
            preserveScroll: true,
            onSuccess: () => toast.success('QC berhasil disimpan.'),
        });
    };

    const checkedQty = Number(qcForm.data.checked_qty || 0);
    const passedQty = Number(qcForm.data.passed_qty || 0);
    const defectQty = Number(qcForm.data.defect_qty || 0);

    const qcInvalid =
        checkedQty <= 0 ||
        checkedQty > task.quantity ||
        passedQty < 0 ||
        defectQty < 0 ||
        passedQty + defectQty !== checkedQty;

    return (
        <Card className="overflow-hidden border-l-4 border-l-amber-500">
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                            {jobNo}
                        </p>
                        <CardTitle className="mt-1 text-lg">
                            {task.sequence}. {task.work_name}
                        </CardTitle>
                        <p className="mt-2 text-sm text-slate-600">
                            {productName}
                        </p>
                    </div>
                    <div className="flex flex-col gap-2">
                        {isExternalWork && vendorName && (
                            <div className="flex items-center gap-1">
                                <User className="h-3 w-3 text-slate-500" />
                                <span className="text-xs text-slate-600">{vendorName}</span>
                            </div>
                        )}
                    </div>
                </div>
            </CardHeader>

            <CardContent>
                <form onSubmit={submitQc} className="space-y-4">
                    {/* Qty Info */}
                    <div className="rounded-lg border bg-white p-3 text-xs text-slate-600">
                        Qty {task.work_name} yang dikerjakan:{' '}
                        <span className="font-semibold text-slate-900">
                            {task.quantity} pcs
                        </span>
                        . Checked qty tidak boleh melebihi jumlah ini.
                    </div>

                    {/* Qty Inputs */}
                    <div className="grid gap-3 md:grid-cols-3">
                        <Field label="Checked Qty" error={qcForm.errors.checked_qty}>
                            <FormattedNumberInput
                                value={qcForm.data.checked_qty}
                                max={task.quantity}
                                min={0}
                                onValueChange={setCheckedQty}
                                placeholder={`Maks ${task.quantity}`}
                            />
                        </Field>

                        <Field label="Passed Qty" error={qcForm.errors.passed_qty}>
                            <FormattedNumberInput
                                value={qcForm.data.passed_qty}
                                max={qcForm.data.checked_qty}
                                min={0}
                                onValueChange={setPassedQty}
                                placeholder={`Maks ${qcForm.data.checked_qty || task.quantity}`}
                            />
                        </Field>

                        <Field label="Defect Qty" error={qcForm.errors.defect_qty}>
                            <FormattedNumberInput
                                value={qcForm.data.defect_qty}
                                onValueChange={setDefectQty}
                                max={qcForm.data.checked_qty}
                                min={0}
                                placeholder={`Maks ${qcForm.data.checked_qty || task.quantity}`}
                            />
                        </Field>
                    </div>

                    {/* Defect Reason */}
                    {qcForm.data.defect_qty > 0 && (
                        <Field label="Penyebab Defect" error={qcForm.errors.defect_reason}>
                            <Textarea
                                rows={2}
                                value={qcForm.data.defect_reason}
                                onChange={(e) => qcForm.setData('defect_reason', e.target.value)}
                                placeholder="Jelaskan penyebab defect..."
                            />
                        </Field>
                    )}

                    {/* QC Notes */}
                    <Field label="Catatan QC" error={qcForm.errors.qc_notes}>
                        <Textarea
                            rows={2}
                            value={qcForm.data.qc_notes}
                            onChange={(e) => qcForm.setData('qc_notes', e.target.value)}
                            placeholder="Catatan umum QC..."
                        />
                    </Field>

                    {/* Corrective Action */}
                    <Field label="Tindakan Perbaikan" error={qcForm.errors.corrective_action}>
                        <Input
                            value={qcForm.data.corrective_action}
                            onChange={(e) =>
                                qcForm.setData('corrective_action', e.target.value)
                            }
                            placeholder="use_stock / repurchase / rework_only"
                        />
                    </Field>

                    {/* Validation Message */}
                    {qcInvalid && (
                        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
                            <AlertTriangle className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
                            <p className="text-xs text-red-700">
                                Checked qty wajib lebih dari 0, tidak boleh melebihi {task.quantity} pcs,
                                dan Passed + Defect harus sama dengan Checked.
                            </p>
                        </div>
                    )}

                    {/* Submit Button */}
                    <Button
                        type="submit"
                        disabled={qcForm.processing || qcInvalid}
                        className="w-full"
                    >
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Simpan QC
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}

export default ProductionBoard;
