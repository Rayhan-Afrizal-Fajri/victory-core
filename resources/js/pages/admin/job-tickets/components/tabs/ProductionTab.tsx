import React, { useState, useEffect, useMemo } from 'react';
import { router, useForm } from '@inertiajs/react';
import { toast } from 'sonner';
import { 
    AlertTriangle, 
    CheckCircle2, 
    PackageCheck, 
    Play, 
    Truck, 
    Package,
    Settings2,
    Info,
    History,
    ChevronUp,
    ChevronDown,
    RefreshCcw
} from 'lucide-react';

import type { JobTicket, Pesanan } from '../../types';
import WorkflowGate from '../WorkflowGate';
import Badge from '@/components/sample/badge';
import Field from '@/components/sample/field';
import EmptyState from '@/components/sample/empty-state';
import FormattedNumberInput from '@/components/ui/formatted-number-input';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useCan } from '@/hooks/use-can';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

// --- UTILITY ---
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
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    }).format(new Date(value));
}

// --- MAIN COMPONENT ---
const ProductionTab: React.FC<{ job: JobTicket }> = ({ job }) => {
    const can = useCan();
    const [activeOrderIndex, setActiveOrderIndex] = useState<number>(0);
    
    const activeOrder: Pesanan | undefined = job?.orders?.[activeOrderIndex];
    const workflow = activeOrder?.workflow_status;
    const run = (activeOrder as any)?.production_run;  

    // --- FORMS ---
    const ensureRunForm = useForm({
        quantity: Number(activeOrder?.quantity || 0),
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

    useEffect(() => {
        if (!run) return;
        deliveryForm.setData({
            courier_name: run.courier_name ?? '',
            tracking_number: run.tracking_number ?? '',
            tracking_url: run.tracking_url ?? '',
            delivery_note: run.delivery_note ?? '',
        });
    }, [run?.id, run?.courier_name, run?.tracking_number, run?.tracking_url, run?.delivery_note]);

    // --- ACTIONS ---
    const ensureProductionRun = (e: React.FormEvent) => {
        e.preventDefault();
        ensureRunForm.post(`/pesanan/${job.id}/production-runs/production/ensure`, {  
            preserveScroll: true,
            onSuccess: () => toast.success('Production run berhasil dibuat.'),  
        });
    };

    const completePacking = (e: React.FormEvent) => {
        e.preventDefault();
        if (!run) return;
        packingForm.patch(`/production-runs/${run.id}/packing`, {  
            preserveScroll: true,
            onSuccess: () => toast.success('Packing production selesai.'),  
        });
    };

    const submitDelivery = (e: React.FormEvent) => {
        e.preventDefault();
        if (!run) return;
        deliveryForm.patch(`/production-runs/${run.id}/delivery`, {  
            preserveScroll: true,
            onSuccess: () => toast.success('Delivery production berhasil disimpan.'),  
        });
    };

    const markDelivered = () => {
        if (!run) return;
        router.patch(`/production-runs/${run.id}/mark-delivered`, {}, {  
            preserveScroll: true,
            onSuccess: () => toast.success('Production ditandai delivered.'),  
        });
    };

    // --- DATA FILTERING (PENGGANTI LOGIKA CONTROLLER) ---
    const processes = run?.processes ?? [];  
    const orderDefects = job.defect_histories?.filter((d: any) => d.pesanan_id === activeOrder?.id) || [];  

    // 1. Worker Tasks: Status Pending atau In Progress
    const workerTasks = processes.filter((p: any) => ['pending', 'in_progress'].includes(p.status));
    
    // 2. QC Tasks: Status Completed TAPI QC belum selesai
    const qcTasks = processes.filter((p: any) => p.status === 'completed' && ['pending', 'conditionally_passed', 'failed'].includes(p.qc_status));
    
    // 3. Completed Tasks: Status Completed dan QC sudah selesai
    const completedTasks = processes.filter((p: any) => p.status === 'completed' && p.qc_status === 'passed');

    // --- LOGIC GATES & PERMISSIONS ---
    const allQcPassed = processes.length > 0 && processes.every((p: any) => p.status === 'completed' && p.qc_status === 'passed');  
    const canPacking = allQcPassed && !run?.packing_completed;  
    const canDelivery = run?.packing_completed && !['in_delivery', 'delivered', 'approved'].includes(run?.status ?? '');  
    const canMarkDelivered = run?.status === 'in_delivery';  
    const isDeliverySubmitted = run?.status === 'in_delivery';  
    const isDelivered = ['delivered', 'approved'].includes(run?.status ?? '');  

    return (
        <div className="space-y-6">
            {/* TAB SELECTOR */}
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

            {/* WORKFLOW GATES */}
            {!workflow?.sample_approved ? (
                <WorkflowGate reason="Sample belum disetujui. Production terkunci." />
            ) : (!workflow?.production_materials_ready || !workflow?.materials_received) && !workflow.production_started ? (
                <WorkflowGate reason="Material produksi belum cukup diterima." />
            ) : !run ? (
                /* EMPTY STATE: BELUM ADA PRODUCTION RUN */
                <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                    <form onSubmit={ensureProductionRun} className="mx-auto max-w-sm space-y-6">
                        <EmptyState
                            icon={<Settings2 className="size-8 text-blue-500" />}
                            title="Mulai Produksi Massal"
                            description="Buat production run berdasarkan spesifikasi manufaktur yang telah disetujui pada tahap desain."  
                        />
                        <Button type="submit" disabled={ensureRunForm.processing} className="w-full bg-blue-600 hover:bg-blue-700">
                            <PackageCheck className="mr-2 size-4" />
                            Buat Production Run
                        </Button>
                    </form>
                </div>
            ) : (
                /* GRID LAYOUT ALA SAMPLE TAB */
                <div className="grid gap-6 xl:grid-cols-3">
                    
                    {/* KIRI: OVERVIEW & PROCESSES (col-span-2) */}
                    <div className="space-y-6 xl:col-span-2">
                        
                        {/* OVERVIEW CARD */}
                        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="text-lg font-bold text-slate-900">Production Overview</h3>
                                    </div>
                                    <p className="text-sm text-slate-500">
                                        Target Qty: <span className="font-semibold text-slate-700">{processes[0]?.quantity || activeOrder?.quantity} pcs</span>  
                                    </p>
                                </div>
                                <Badge className={`px-3 py-1 text-sm font-medium ${statusClass[run.status ?? ''] || statusClass.draft}`}>  
                                    Status: {run.status?.toUpperCase() || 'DRAFT'}
                                </Badge>
                            </div>
                        </div>

                        {/* PRODUCTION PROCESS LIST (SPLIT INTO TABS) */}
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
                            <h3 className="mb-4 text-base font-bold text-slate-800 flex items-center">
                                <Settings2 className="mr-2 h-5 w-5 text-slate-500"/>
                                Tahapan Produksi & QC
                            </h3>

                            <Tabs defaultValue="worker" className="w-full">
                                <TabsList className="mb-6 grid w-full md:max-w-150 grid-cols-3 h-auto min-h-10">
                                    <TabsTrigger value="worker" className="text-sm font-medium py-2">
                                        Kerja
                                        <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-700 border-none">{workerTasks.length}</Badge>
                                    </TabsTrigger>
                                    <TabsTrigger value="qc" className="text-sm font-medium py-2">
                                        QC
                                        <Badge variant="secondary" className="ml-2 bg-amber-100 text-amber-700 border-none">{qcTasks.length}</Badge>
                                    </TabsTrigger>
                                    <TabsTrigger value="completed" className="text-sm font-medium py-2">
                                        Selesai
                                        <Badge variant="secondary" className="ml-2 bg-emerald-100 text-emerald-700 border-none">{completedTasks.length}</Badge>
                                    </TabsTrigger>
                                </TabsList>
                                
                                {/* TAB 1: PEKERJA */}
                                <TabsContent value="worker">
                                    {workerTasks.length === 0 ? (
                                        <EmptyState icon={<Play />} title="Kosong" description="Tidak ada proses yang sedang menunggu atau dikerjakan." />
                                    ) : (
                                        <div className="space-y-4 grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                            {workerTasks.map((process: any) => (
                                                <WorkerTaskCard key={process.id} allProcesses={processes} process={process} />
                                            ))}
                                        </div>
                                    )}
                                </TabsContent>

                                {/* TAB 2: QC */}
                                <TabsContent value="qc">
                                    {qcTasks.length === 0 ? (
                                        <EmptyState icon={<AlertTriangle />} title="Kosong" description="Tidak ada antrean QC saat ini." />
                                    ) : (
                                        <div className="space-y-4 grid grid-cols-1 gap-4 mt-4">
                                            {qcTasks.map((process: any) => (
                                                <QcTaskCard key={process.id} allProcesses={processes} process={process} runQuantity={Number(process.quantity || 0)} />
                                            ))}
                                        </div>
                                    )}
                                </TabsContent>

                                {/* TAB 3: SELESAI */}
                                <TabsContent value="completed">
                                    {completedTasks.length === 0 ? (
                                        <EmptyState icon={<CheckCircle2 />} title="Kosong" description="Belum ada proses yang selesai QC." />
                                    ) : (
                                        <div className="space-y-4 grid grid-cols-1 gap-4 mt-4 opacity-75 grayscale-30">
                                            {completedTasks.map((process: any) => (
                                                <QcTaskCard key={process.id} allProcesses={processes} process={process} runQuantity={Number(process.quantity || 0)} isReadOnly />
                                            ))}
                                        </div>
                                    )}
                                </TabsContent>
                            </Tabs>
                        </div>
                    </div>

                    {/* KANAN: ACTION CARDS (PACKING & DELIVERY) */}
                    <div className="space-y-6">
                        {/* PACKING CARD */}
                        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                            <h3 className="mb-4 text-base font-bold text-slate-800 flex items-center border-b pb-3">
                                <Package className="mr-2 h-5 w-5 text-slate-500"/>
                                Packing Production
                            </h3>

                            {run.packing_completed ? (  
                                <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-700 flex items-start">
                                    <CheckCircle2 className="mr-2 h-5 w-5 shrink-0" />
                                    <div>
                                        <p className="font-semibold">Packing Selesai</p>
                                        {run.packing_notes && <p className="mt-1 text-emerald-600 text-xs italic">Catatan: {run.packing_notes}</p>}
                                    </div>
                                </div>
                            ) : canPacking ? (  
                                <form onSubmit={completePacking} className="space-y-4">
                                    <Field label="Packing Notes" error={packingForm.errors.packing_notes}>  
                                        <Textarea
                                            rows={3}
                                            value={packingForm.data.packing_notes}
                                            onChange={(e) => packingForm.setData('packing_notes', e.target.value)}  
                                            placeholder="Tambahkan catatan packing jika ada..."
                                            className="text-sm bg-slate-50"
                                        />
                                    </Field>
                                    <Button type="submit" disabled={packingForm.processing || !can('productions.packing')} className="w-full">  
                                        <CheckCircle2 className="mr-2 size-4" /> Complete Packing
                                    </Button>
                                </form>
                            ) : (
                                <div className="flex items-center rounded-lg border border-slate-100 bg-slate-50 p-3 text-sm text-slate-500">
                                    <Info className="mr-2 h-4 w-4 shrink-0 text-slate-400" />
                                    Packing dapat dilakukan setelah semua proses dinyatakan Lulus QC.  
                                </div>
                            )}
                        </div>

                        {/* DELIVERY CARD */}
                        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                            <h3 className="mb-4 text-base font-bold text-slate-800 flex items-center border-b pb-3">
                                <Truck className="mr-2 h-5 w-5 text-slate-500"/>
                                Delivery Production
                            </h3>

                            <form onSubmit={submitDelivery} className="space-y-4">
                                <div className="space-y-3">
                                    <Field label="Kurir Pengiriman" error={deliveryForm.errors.courier_name}>  
                                        <Input readOnly={isDeliverySubmitted || isDelivered} disabled={!can('productions.delivery')} value={deliveryForm.data.courier_name} onChange={(e) => deliveryForm.setData('courier_name', e.target.value)} placeholder="Ex: JNE, Lalamove, Internal" className="text-sm" />
                                    </Field>
                                    <Field label="Nomor Resi / Tracking" error={deliveryForm.errors.tracking_number}>  
                                        <Input readOnly={isDeliverySubmitted || isDelivered} disabled={!can('productions.delivery')} value={deliveryForm.data.tracking_number} onChange={(e) => deliveryForm.setData('tracking_number', e.target.value)} className="text-sm" />
                                    </Field>
                                    <Field label="URL Lacak (Opsional)" error={deliveryForm.errors.tracking_url}>  
                                        <Input readOnly={isDeliverySubmitted || isDelivered} disabled={!can('productions.delivery')} value={deliveryForm.data.tracking_url} onChange={(e) => deliveryForm.setData('tracking_url', e.target.value)} className="text-sm" />
                                    </Field>
                                    <Field label="Catatan Pengiriman" error={deliveryForm.errors.delivery_note}>  
                                        <Textarea readOnly={isDeliverySubmitted || isDelivered} disabled={!can('productions.delivery')} rows={2} value={deliveryForm.data.delivery_note} onChange={(e) => deliveryForm.setData('delivery_note', e.target.value)} className="text-sm" />
                                    </Field>
                                </div>

                                {canDelivery && (  
                                    <Button type="submit" disabled={deliveryForm.processing || !can('productions.delivery')} className="w-full bg-slate-800 hover:bg-slate-900">  
                                        <Truck className="mr-2 size-4" /> Submit Delivery
                                    </Button>
                                )}
                            </form>

                            {canMarkDelivered && (  
                                <Button type="button" onClick={markDelivered} disabled={deliveryForm.processing || !can('productions.delivery')} className="w-full mt-3 bg-emerald-600 hover:bg-emerald-700">  
                                    <CheckCircle2 className="mr-2 size-4" /> Mark as Delivered
                                </Button>
                            )}

                            {isDelivered && (  
                                <div className="mt-4 rounded-lg border border-emerald-100 bg-emerald-50 p-3 text-center text-sm font-medium text-emerald-700">
                                    Produksi Telah Diterima (Delivered)  
                                </div>
                            )}

                            {!canDelivery && !canMarkDelivered && !isDelivered && (  
                                <div className="mt-4 flex items-start rounded-lg border border-slate-100 bg-slate-50 p-3 text-xs text-slate-500">
                                    <Info className="mr-2 h-4 w-4 shrink-0 text-slate-400" />
                                    Delivery baru bisa diproses setelah tahapan Packing selesai dilakukan.  
                                </div>
                            )}
                        </div>

                        {/* DEFECT HISTORY */}
                        {orderDefects.length > 0 && (
                            <DefectHistoryTable defects={orderDefects} processes={processes} />  
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

// --- SUB-COMPONENTS ---

// 1. Worker Task Card (Untuk Start/Complete Pekerjaan)
function WorkerTaskCard({ allProcesses, process }: {allProcesses: any[]; process: any }) {
    const isPending = process.status === 'pending';
    const isInProgress = process.status === 'in_progress';

    const previousProcess = allProcesses.find(
        (p) => p.sequence === process.sequence - 1
    );

    const canStart =
        !previousProcess ||
        (
            previousProcess.status === 'completed' &&
            (
                previousProcess.qc_status === 'passed' ||
                previousProcess.passed_qty > 0
            )
        );

    const [open, setOpen] = useState(false);

    const form = useForm({
        worker_qty: 1,
    });

    const startProcess = () => {
        form.patch(`/production-run-processes/${process.id}/start`, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Proses dimulai.');
                setOpen(false);
            },
        });
    };

    const completeProcess = () => {
        router.patch(
            `/production-run-processes/${process.id}/complete`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => toast.success('Proses selesai.'),
            }
        );
    };

    return (
        <>
            <div className="rounded-xl border border-slate-200 bg-white p-4 transition-shadow hover:shadow-sm">
                <div className="mb-3 flex items-start justify-between">
                    <div>
                        <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Sequence {process.sequence.toString().padStart(2, '0')}
                        </span>

                        <h4 className="font-bold leading-tight text-slate-800">
                            {process.work_name}
                        </h4>
                    </div>

                    <Badge
                        variant={isPending ? 'secondary' : 'default'}
                        className={
                            isInProgress
                                ? 'border-blue-200 bg-blue-100 text-blue-700'
                                : ''
                        }
                    >
                        {isPending ? 'Menunggu' : 'Dikerjakan'}
                    </Badge>
                </div>

                <div className="mb-2 flex items-center gap-1.5 rounded-md border border-slate-100 bg-slate-50 px-2 py-1.5 text-sm text-slate-600">
                    <Package className="h-4 w-4 text-slate-400" />
                    Target:
                    <span className="font-semibold text-slate-900">
                        {process.quantity} pcs
                    </span>
                </div>

                {process.worker_qty && (
                    <div className="mb-4 text-sm text-slate-500">
                        Jumlah pekerja:
                        <span className="ml-1 font-semibold">
                            {process.worker_qty} orang
                        </span>
                    </div>
                )}

                {isPending && (
                    <Button
                        onClick={() => setOpen(true)}
                        className="w-full bg-blue-600 hover:bg-blue-700"
                        size="sm"
                        disabled={!canStart}
                    >
                        <Play className="mr-2 h-3.5 w-3.5" />
                        Mulai Kerjakan
                    </Button>
                )}
                {!canStart && (
                    <p className="mt-2 text-xs text-amber-600">
                        Menunggu proses sebelumnya.
                    </p>
                )}

                {isInProgress && (
                    <Button
                        onClick={completeProcess}
                        className="w-full bg-emerald-600 hover:bg-emerald-700"
                        size="sm"
                    >
                        <CheckCircle2 className="mr-2 h-3.5 w-3.5" />
                        Selesaikan
                    </Button>
                )}
            </div>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Mulai Proses</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Jumlah Pekerja
                            </label>

                            <Input
                                type="number"
                                min={1}
                                value={form.data.worker_qty}
                                onChange={(e) =>
                                    form.setData(
                                        'worker_qty',
                                        Number(e.target.value)
                                    )
                                }
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setOpen(false)}
                        >
                            Batal
                        </Button>

                        <Button
                            onClick={startProcess}
                            disabled={form.processing}
                        >
                            Mulai Proses
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

// 2. QC Task Card (Menampilkan Form QC)
function QcTaskCard({ allProcesses, process, runQuantity, isReadOnly = false }: { allProcesses: any[]; process: any; runQuantity: number; isReadOnly?: boolean }) {
    const [showHistory, setShowHistory] = useState(false);

    // 1. KALKULASI BATAS MAKSIMAL (WIP LIMIT) DARI PROSES SEBELUMNYA
    const availableQty = useMemo(() => {
        if (process.sequence === 1) return Number(process.quantity || 0);
        const prevProcess = allProcesses?.find(p => p.sequence === process.sequence - 1);
        return prevProcess ? Number(prevProcess.passed_qty || 0) : Number(process.quantity || 0);
    }, [process.sequence, process.quantity, allProcesses]);

    // 2. TENTUKAN MODE FORM (Initial vs Rework)
    const currentChecked = Number(process.checked_qty || 0);
    const currentDefect = Number(process.defect_qty || 0);
    
    // Sisa yang belum pernah di-QC sama sekali
    const remainingInitial = Math.max(availableQty - currentChecked, 0); 
    
    // Mode apa yang aktif?
    const formMode = remainingInitial > 0 ? 'initial_check' : (currentDefect > 0 ? 'rework_check' : 'done');
    const maxInputQty = formMode === 'initial_check' ? remainingInitial : currentDefect;

    console.log(currentDefect);

    const qcForm = useForm({  
        qc_type: formMode, // 'initial_check' | 'rework_check'
        checked_qty: 0,  
        passed_qty: 0,  
        defect_qty: 0,  
        qc_notes: '',  
        corrective_action: '',  
        defect_reason: '',  
    });

    const clampQty = (value: number, min = 0, max = maxInputQty) => {  
        const num = Number(value || 0);  
        if (Number.isNaN(num)) return min;  
        return Math.min(Math.max(num, min), max);  
    };

    const setCheckedQty = (value: number) => {  
        const checkedQty = clampQty(value);  
        const currentPassed = Number(qcForm.data.passed_qty || 0);  
        const nextPassed = Math.min(currentPassed, checkedQty);  
        const nextDefect = Math.max(checkedQty - nextPassed, 0);  
        qcForm.setData({ ...qcForm.data, checked_qty: checkedQty, passed_qty: nextPassed, defect_qty: nextDefect });  
    };

    const setPassedQty = (value: number) => {  
        const checkedQty = clampQty(Number(qcForm.data.checked_qty || 0));  
        const passedQty = clampQty(value, 0, checkedQty);  
        const defectQty = Math.max(checkedQty - passedQty, 0);  
        qcForm.setData({ ...qcForm.data, passed_qty: passedQty, defect_qty: defectQty });  
    };

    const setDefectQty = (value: number) => {  
        const checkedQty = clampQty(Number(qcForm.data.checked_qty || 0));  
        const defectQty = clampQty(value, 0, checkedQty);  
        const passedQty = Math.max(checkedQty - defectQty, 0);  
        qcForm.setData({ ...qcForm.data, defect_qty: defectQty, passed_qty: passedQty });  
    };

    const submitQc = (e: React.FormEvent) => {  
        e.preventDefault();
        // Pastikan mengirim tipe yang benar sebelum submit
        qcForm.transform((data) => ({ ...data, qc_type: formMode }));
        
        qcForm.patch(`/production-run-processes/${process.id}/qc`, {  
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Hasil QC berhasil disimpan.');
                qcForm.reset(); // Kosongkan form setelah berhasil
            },  
        });
    };

    const qcInvalid = qcForm.data.checked_qty <= 0 || qcForm.data.checked_qty > maxInputQty || (qcForm.data.passed_qty + qcForm.data.defect_qty !== qcForm.data.checked_qty);

    return (
        <div className={`rounded-xl border bg-white p-4 flex flex-col ${isReadOnly ? 'border-emerald-200 shadow-none' : 'border-amber-200 shadow-sm'}`}>
            
            {/* --- HEADER CARD --- */}
            <div className="flex justify-between items-start mb-3 border-b pb-3">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold uppercase text-slate-400 bg-slate-100 px-2 py-0.5 rounded">Seq {process.sequence}</span>
                        <h4 className="font-bold text-slate-800">{process.work_name}</h4>
                    </div>
                    <p className="text-xs text-slate-500">
                        Progres: <span className="font-bold text-emerald-600">{process.passed_qty || 0} Lulus</span> / {availableQty} Tersedia
                    </p>
                </div>
            </div>

            {/* --- RIWAYAT QC (ACCORDION) --- */}
            {process.qc_logs && process.qc_logs.length > 0 && (
                <div className="mb-4 rounded-lg border border-slate-200 overflow-hidden">
                    <button 
                        type="button" 
                        onClick={() => setShowHistory(!showHistory)} 
                        className="w-full bg-slate-50 px-3 py-2 flex justify-between items-center text-xs font-semibold text-slate-600 hover:bg-slate-100"
                    >
                        <span className="flex items-center gap-1.5"><History className="size-3.5"/> Lihat Riwayat QC ({process.qc_logs.length} Log)</span>
                        {showHistory ? <ChevronUp className="size-4"/> : <ChevronDown className="size-4"/>}
                    </button>
                    
                    {showHistory && (
                        <div className="p-3 bg-white">
                            <table className="w-full text-xs text-left">
                                <thead className="text-slate-500 border-b">
                                    <tr>
                                        <th className="pb-1 font-medium">Tipe</th>
                                        <th className="pb-1 font-medium text-center">Cek</th>
                                        <th className="pb-1 font-medium text-center text-emerald-600">Pass</th>
                                        <th className="pb-1 font-medium text-center text-red-600">Defect</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {process.qc_logs.map((log: any) => (
                                        <tr key={log.id} className="text-slate-700">
                                            <td className="py-1.5">
                                                {log.qc_type === 'initial_check' 
                                                    ? <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-[10px]">Initial</span>
                                                    : <span className="bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded text-[10px]">Rework</span>
                                                }
                                            </td>
                                            <td className="py-1.5 text-center font-medium">{log.checked_qty}</td>
                                            <td className="py-1.5 text-center text-emerald-600">{log.passed_qty}</td>
                                            <td className="py-1.5 text-center text-red-600">{log.defect_qty}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* --- SMART FORM QC --- */}
            {!isReadOnly && formMode !== 'done' && (
                <form onSubmit={submitQc} className="space-y-4 mt-auto">
                    
                    {/* INFO ALERT DINAMIS */}
                    <div className={`flex items-center gap-2 rounded-lg p-2.5 border text-xs mb-3 ${formMode === 'initial_check' ? 'bg-amber-50 border-amber-100 text-amber-700' : 'bg-purple-50 border-purple-100 text-purple-700'}`}>
                        {formMode === 'initial_check' ? <AlertTriangle className="size-4 shrink-0" /> : <RefreshCcw className="size-4 shrink-0" />}
                        <p>
                            {formMode === 'initial_check' 
                                ? <>Cek Awal (Initial): Tersedia <b>{maxInputQty} pcs</b> belum diperiksa.</>
                                : <>Cek Ulang (Rework): Terdapat <b>{maxInputQty} pcs</b> defect yang butuh re-check.</>
                            }
                        </p>
                    </div>

                    <div className="grid gap-3 md:grid-cols-3">
                        <Field label="Diperiksa" error={qcForm.errors.checked_qty}>
                            <FormattedNumberInput value={qcForm.data.checked_qty} max={maxInputQty} min={0} onValueChange={setCheckedQty} className="h-9" />
                        </Field>
                        <Field label="Lulus" error={qcForm.errors.passed_qty}>
                            <FormattedNumberInput value={qcForm.data.passed_qty} max={qcForm.data.checked_qty} min={0} onValueChange={setPassedQty} className="h-9 bg-emerald-50 text-emerald-700 font-semibold" />
                        </Field>
                        <Field label="Cacat" error={qcForm.errors.defect_qty}>
                            <FormattedNumberInput value={qcForm.data.defect_qty} max={qcForm.data.checked_qty} min={0} onValueChange={setDefectQty} className={`h-9 ${qcForm.data.defect_qty > 0 ? 'bg-red-50 text-red-700' : ''}`} />
                        </Field>
                    </div>

                    {/* Alasan & Tindakan (Hanya muncul jika ada Defect) */}
                    {qcForm.data.defect_qty > 0 && (
                        <div className="grid gap-3 md:grid-cols-2 bg-red-50 p-3 rounded-lg border border-red-100">
                            <Field label="Penyebab Defect" error={qcForm.errors.defect_reason}>
                                <Input value={qcForm.data.defect_reason} onChange={(e) => qcForm.setData('defect_reason', e.target.value)} placeholder="Contoh: Jahitan miring" className="h-8 text-xs bg-white" />
                            </Field>
                            <Field label="Tindakan (Corrective)" error={qcForm.errors.corrective_action}>
                                <Input value={qcForm.data.corrective_action} onChange={(e) => qcForm.setData('corrective_action', e.target.value)} placeholder="Contoh: Jahit ulang" className="h-8 text-xs bg-white" />
                            </Field>
                        </div>
                    )}

                    <Button type="submit" disabled={qcForm.processing || qcInvalid} className={`w-full ${formMode === 'initial_check' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-purple-600 hover:bg-purple-700'}`}>
                        {formMode === 'initial_check' ? 'Simpan Cek Awal' : 'Simpan Cek Rework'}
                    </Button>
                </form>
            )}

            {!isReadOnly && formMode === 'done' && (
                <div className="mt-auto bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-semibold p-3 rounded-lg text-center flex justify-center items-center gap-2">
                    <CheckCircle2 className="size-4" /> Proses QC 100% Selesai
                </div>
            )}
        </div>
    );
}

// 3. ProcessTimeBox Helper
function ProcessTimeBox({ label, value, active = false, note }: { label: string; value: string; active?: boolean; note?: string }) {  
    return (
        <div className={`rounded-lg border p-2.5 ${active ? 'border-emerald-200 bg-emerald-50/50' : 'border-slate-200 bg-slate-50/50'}`}>  
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</p>  
            <p className={`mt-0.5 font-medium ${active ? 'text-emerald-700' : 'text-slate-600'}`}>{value}</p>  
            {note && <p className="mt-0.5 text-[10px] text-slate-400">{note}</p>}  
        </div>
    );
}

// 4. DefectHistoryTable
function DefectHistoryTable({ defects, processes }: { defects: any[], processes: any[] }) {  
    return (
        <div className="mt-6 overflow-hidden rounded-xl border border-red-200 bg-red-50/30">  
            <div className="flex items-center border-b border-red-200 bg-red-50 px-4 py-3">  
                <AlertTriangle className="mr-2 size-4 text-red-600" />  
                <h4 className="text-sm font-bold text-red-800">Riwayat Temuan Defect QC</h4>  
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                    <thead className="border-b border-red-100 bg-white text-slate-500">  
                        <tr>
                            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">Tanggal</th>  
                            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">Tahap Proses</th>  
                            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-center">Qty Defect</th>  
                            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">Penyebab</th>  
                            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">Tindakan</th>  
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-red-50 bg-white/50">  
                        {defects.map((defect) => {  
                            const processName = processes.find(p => p.id === defect.production_run_process_id)?.work_name || 'Proses tidak diketahui';  
                            return (
                                <tr key={defect.id} className="hover:bg-red-50/40 transition-colors">  
                                    <td className="px-4 py-3 whitespace-nowrap text-xs">{formatDateTime(defect.created_at)}</td>  
                                    <td className="px-4 py-3 font-medium text-slate-800">{processName}</td>  
                                    <td className="px-4 py-3 text-center text-red-600 font-bold">{defect.defect_qty} pcs</td>  
                                    <td className="px-4 py-3 text-xs">{defect.defect_reason}</td>  
                                    <td className="px-4 py-3 text-xs">{defect.corrective_action}</td>  
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default ProductionTab;