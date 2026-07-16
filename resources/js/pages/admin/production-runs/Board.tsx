import React, { useState, useMemo } from 'react';
import { router, useForm } from '@inertiajs/react';
import { AlertTriangle, CheckCircle2, Play, Clock, User, Package, Search, Filter, CalendarClock, Building2 } from 'lucide-react';
import { toast } from 'sonner';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import Badge from '@/components/sample/badge';
import Field from '@/components/sample/field';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import FormattedNumberInput from '@/components/ui/formatted-number-input';
import AppLayout from '@/layouts/app-layout';

// --- INTERFACES ---
interface Customer {
    nama?: string;
    nama_perusahaan?: string;
}

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
        type: 'sample' | 'production';
        pesanan: {
            id: string;
            produk: string;
            requested_product_name: string;
            job_ticket: {
                id: string;
                no_job_ticket: string;
                deadline: string;
                customer?: Customer;
            };
        };
    };
}

interface QcTask extends WorkerTask {
    qc_status: string;
    pesanan_manufacturing_spec: {
        id: string;
        vendor_id?: string;
        vendor?: {
            nama_perusahaan: string;
        };
    };
}

interface BoardProps {
    workerTasks: WorkerTask[];
    qcTasks: QcTask[];
}

export default function ProductionBoard({ workerTasks, qcTasks }: BoardProps) {
    // --- STATE FILTER ---
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState<'all' | 'sample' | 'production'>('all');

    // --- LOGIKA GROUPING & FILTERING ---
    const processAndGroupTasks = (tasks: any[]) => {
        // 1. Filter Data
        const filtered = tasks.filter((task) => {
            const pesanan = task.production_run?.pesanan;
            const jt = pesanan?.job_ticket;
            const cust = jt?.customer;
            const type = task.production_run?.type;

            // Filter Tipe Produksi
            if (typeFilter !== 'all' && type !== typeFilter) return false;

            // Filter Pencarian Text (Job Ticket, Produk, Customer)
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                const matchJT = jt?.no_job_ticket?.toLowerCase().includes(query);
                const matchProduct = (pesanan?.requested_product_name || pesanan?.produk || '').toLowerCase().includes(query);
                const matchCust = (cust?.nama || cust?.nama_perusahaan || '').toLowerCase().includes(query);
                
                if (!matchJT && !matchProduct && !matchCust) return false;
            }
            return true;
        });

        // 2. Group by Pesanan ID
        const groups: Record<string, {
            pesanan: any;
            type: string;
            tasks: any[];
        }> = {};

        filtered.forEach(task => {
            const pesanan = task.production_run?.pesanan;
            if (!pesanan) return;
            
            if (!groups[pesanan.id]) {
                groups[pesanan.id] = {
                    pesanan: pesanan,
                    type: task.production_run.type,
                    tasks: []
                };
            }
            groups[pesanan.id].tasks.push(task);
        });

        // Urutkan task di dalam masing-masing grup berdasarkan sequence
        Object.values(groups).forEach(group => {
            group.tasks.sort((a, b) => a.sequence - b.sequence);
        });

        return Object.values(groups);
    };

    const groupedWorkerTasks = useMemo(() => processAndGroupTasks(workerTasks), [workerTasks, searchQuery, typeFilter]);
    const groupedQcTasks = useMemo(() => processAndGroupTasks(qcTasks), [qcTasks, searchQuery, typeFilter]);

    return (
        <div className="container mx-auto p-6 max-w-7xl">
            <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Shop Floor Board</h1>
                    <p className="text-slate-500 mt-1">Pantau antrean kerja produksi dan kontrol kualitas per pesanan.</p>
                </div>

                {/* FILTER CONTROLS */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input 
                            placeholder="Cari No Ticket, Produk, Customer..." 
                            className="pl-9 w-full sm:w-64 bg-white"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <select 
                            className="flex h-10 w-full sm:w-40 items-center justify-between rounded-md border border-slate-200 bg-white pl-9 pr-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 cursor-pointer"
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value as any)}
                        >
                            <option value="all">Semua Tipe</option>
                            <option value="sample">Sample Saja</option>
                            <option value="production">Produksi Massal</option>
                        </select>
                    </div>
                </div>
            </div>

            <Tabs defaultValue="worker" className="w-full">
                <TabsList className="mb-6 grid w-full max-w-md grid-cols-1 sm:grid-cols-2 h-full">
                    <TabsTrigger value="worker" className="text-base font-medium">
                        Antrean Kerja
                        <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-700">
                            {workerTasks.length} Work
                        </Badge>
                    </TabsTrigger>
                    <TabsTrigger value="qc" className="text-base font-medium">
                        Antrean QC
                        <Badge variant="secondary" className="ml-2 bg-amber-100 text-amber-700">
                            {qcTasks.length} Work
                        </Badge>
                    </TabsTrigger>
                </TabsList>

                {/* TAB 1: WORKER BOARD */}
                <TabsContent value="worker" className="space-y-6">
                    {groupedWorkerTasks.length === 0 ? (
                        <EmptyStateCard icon={<Clock />} title="Tidak ada antrean kerja" message="Gunakan filter lain atau semua pekerjaan telah selesai." />
                    ) : (
                        groupedWorkerTasks.map((group) => (
                            <PesananContainer key={group.pesanan.id} group={group}>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-4">
                                    {group.tasks.map((task) => (
                                        <WorkerTaskCard key={task.id} task={task} />
                                    ))}
                                </div>
                            </PesananContainer>
                        ))
                    )}
                </TabsContent>

                {/* TAB 2: QC BOARD */}
                <TabsContent value="qc" className="space-y-6">
                    {groupedQcTasks.length === 0 ? (
                        <EmptyStateCard icon={<CheckCircle2 />} title="Tidak ada antrean QC" message="Gunakan filter lain atau semua pekerjaan telah diperiksa." />
                    ) : (
                        groupedQcTasks.map((group) => (
                            <PesananContainer key={group.pesanan.id} group={group} isQc>
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-4">
                                    {group.tasks.map((task) => (
                                        <QcTaskCard key={task.id} task={task} />
                                    ))}
                                </div>
                            </PesananContainer>
                        ))
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}

// --- KOMPONEN WADAH PESANAN (HIERARKI TERATAS) ---
function PesananContainer({ group, children, isQc = false }: { group: any, children: React.ReactNode, isQc?: boolean }) {
    const pesanan = group.pesanan;
    const jt = pesanan.job_ticket;
    const cust = jt?.customer;
    
    const productName = pesanan.requested_product_name || pesanan.produk || 'Produk Tidak Diketahui';
    const isSample = group.type === 'sample';
    
    const isUrgent = jt?.deadline
        ? new Date(jt.deadline).getTime() - new Date().getTime() < 3 * 24 * 60 * 60 * 1000
        : false;

    return (
        <Card className={`overflow-hidden border-l-4 ${isQc ? 'border-l-amber-500' : 'border-l-blue-600'} shadow-sm`}>
            <CardHeader className="bg-slate-50/50 pb-4 border-b">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    
                    {/* Info Utama: Job Ticket & Produk */}
                    <div>
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                            <Badge variant="outline" className="bg-white font-mono text-slate-600">
                                {jt?.no_job_ticket ?? 'NO-TICKET'}
                            </Badge>
                            <Badge variant="secondary" className={isSample ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'}>
                                {isSample ? 'Pembuatan Sample' : 'Produksi Massal'}
                            </Badge>
                            {isUrgent && (
                                <Badge variant="destructive" className="animate-pulse">URGENT</Badge>
                            )}
                        </div>
                        <CardTitle className="text-xl font-bold text-slate-800">
                            {productName}
                        </CardTitle>
                    </div>

                    {/* Info Pelengkap: Customer & Deadline */}
                    <div className="flex flex-col gap-1.5 text-sm md:text-right">
                        <div className="flex items-center md:justify-end gap-1.5 text-slate-600 font-medium">
                            <Building2 className="h-4 w-4 text-slate-400" />
                            {cust?.nama_perusahaan || cust?.nama || 'Customer Internal'}
                        </div>
                        <div className={`flex items-center md:justify-end gap-1.5 ${isUrgent ? 'text-red-600 font-semibold' : 'text-slate-500'}`}>
                            <CalendarClock className="h-4 w-4" />
                            Target Selesai: {jt?.deadline ? new Date(jt.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                        </div>
                    </div>

                </div>
            </CardHeader>
            <CardContent className="pt-2 pb-6 bg-slate-50/30">
                {children}
            </CardContent>
        </Card>
    );
}

// --- KOMPONEN KARTU WORKER (HIERARKI BAWAH) ---
function WorkerTaskCard({ task }: { task: WorkerTask }) {
    const isPending = task.status === 'pending';
    const isInProgress = task.status === 'in_progress';

    const handleStatusUpdate = (newStatus: 'in_progress' | 'completed') => {
        router.patch(
            route('production-processes.update', task.id),
            { status: newStatus },
            {
                preserveScroll: true,
                onSuccess: () => toast.success(`Status ${task.work_name} berhasil diperbarui.`),
            }
        );
    };

    return (
        <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                    <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">
                            Sequence {task.sequence.toString().padStart(2, '0')}
                        </span>
                        <h4 className="font-bold text-slate-800 leading-tight">{task.work_name}</h4>
                    </div>
                    <Badge variant={isPending ? 'secondary' : 'default'} className={isInProgress ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' : ''}>
                        {isPending ? 'Menunggu' : 'Dikerjakan'}
                    </Badge>
                </div>
                
                <div className="flex items-center gap-1.5 text-sm text-slate-600 mb-4 bg-slate-50 px-2 py-1.5 rounded-md border border-slate-100">
                    <Package className="h-4 w-4 text-slate-400" />
                    Target: <span className="font-semibold text-slate-900">{task.quantity} pcs</span>
                </div>

                {isPending && (
                    <Button onClick={() => handleStatusUpdate('in_progress')} className="w-full bg-blue-600 hover:bg-blue-700" size="sm">
                        <Play className="mr-2 h-3.5 w-3.5" /> Mulai Kerjakan
                    </Button>
                )}
                {isInProgress && (
                    <Button onClick={() => handleStatusUpdate('completed')} className="w-full bg-emerald-600 hover:bg-emerald-700" size="sm">
                        <CheckCircle2 className="mr-2 h-3.5 w-3.5" /> Selesaikan
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}

// --- KOMPONEN KARTU QC (HIERARKI BAWAH) ---
function QcTaskCard({ task }: { task: QcTask }) {
    const vendor = task.pesanan_manufacturing_spec?.vendor;
    const isExternal = !!task.pesanan_manufacturing_spec?.vendor_id;

    const qcForm = useForm({
        checked_qty: task.quantity,
        passed_qty: task.quantity,
        defect_qty: 0,
        qc_notes: '',
        defect_reason: '',
        corrective_action: '',
    });

    const handleDefectChange = (val: string) => {
        const defect = parseInt(val) || 0;
        const checked = qcForm.data.checked_qty || 0;
        qcForm.setData({ ...qcForm.data, defect_qty: defect, passed_qty: Math.max(0, checked - defect) });
    };

    const handleCheckedChange = (val: string) => {
        const checked = parseInt(val) || 0;
        const defect = qcForm.data.defect_qty || 0;
        qcForm.setData({ ...qcForm.data, checked_qty: checked, passed_qty: Math.max(0, checked - defect) });
    };

    const qcInvalid = qcForm.data.checked_qty <= 0 || qcForm.data.checked_qty > task.quantity || (qcForm.data.passed_qty + qcForm.data.defect_qty !== qcForm.data.checked_qty);

    const submitQc = (e: React.FormEvent) => {
        e.preventDefault();
        qcForm.post(route('production-processes.qc', task.id), {
            preserveScroll: true,
            onSuccess: () => toast.success('Hasil QC berhasil disimpan.'),
        });
    };

    return (
        <Card className="bg-white border-amber-200 shadow-sm flex flex-col">
            <CardHeader className="p-4 pb-2 border-b border-amber-100 bg-amber-50/30">
                <div className="flex justify-between items-start">
                    <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">
                            Form Quality Control
                        </span>
                        <h4 className="font-bold text-slate-800">{task.work_name}</h4>
                    </div>
                    <Badge variant="outline" className={`text-[10px] ${isExternal ? 'border-purple-200 bg-purple-50 text-purple-700' : 'border-blue-200 bg-blue-50 text-blue-700'}`}>
                        {isExternal ? vendor?.nama_perusahaan || 'Vendor Luar' : 'Tim Internal'}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="p-4 flex-1">
                <form onSubmit={submitQc} className="space-y-4">
                    <div className="grid grid-cols-3 gap-2">
                        <Field label="Diperiksa">
                            <FormattedNumberInput value={qcForm.data.checked_qty} onValueChange={handleCheckedChange} className="h-8 text-sm" />
                        </Field>
                        <Field label="Lulus">
                            <FormattedNumberInput value={qcForm.data.passed_qty} disabled className="h-8 text-sm bg-emerald-50 text-emerald-700 font-semibold" />
                        </Field>
                        <Field label="Defect">
                            <FormattedNumberInput value={qcForm.data.defect_qty} onValueChange={handleDefectChange} className={`h-8 text-sm ${qcForm.data.defect_qty > 0 ? 'bg-red-50 text-red-700 border-red-200' : ''}`} />
                        </Field>
                    </div>

                    {qcForm.data.defect_qty > 0 && (
                        <div className="rounded-md border border-red-100 bg-red-50/50 p-2.5 space-y-2.5">
                            <Field label="Penyebab Defect" error={qcForm.errors.defect_reason}>
                                <Input value={qcForm.data.defect_reason} onChange={(e) => qcForm.setData('defect_reason', e.target.value)} placeholder="Cth: Jahitan miring" required={qcForm.data.defect_qty > 0} className="h-8 text-sm" />
                            </Field>
                            <Field label="Tindakan" error={qcForm.errors.corrective_action}>
                                <Input value={qcForm.data.corrective_action} onChange={(e) => qcForm.setData('corrective_action', e.target.value)} placeholder="Cth: Rework" required={qcForm.data.defect_qty > 0} className="h-8 text-sm" />
                            </Field>
                        </div>
                    )}

                    {qcInvalid && (
                        <p className="text-[11px] text-red-600 leading-tight bg-red-50 p-1.5 rounded">
                            Checked qty wajib > 0, maks {task.quantity}, dan Passed + Defect = Checked.
                        </p>
                    )}

                    <Button type="submit" disabled={qcForm.processing || qcInvalid} className="w-full bg-slate-800 hover:bg-slate-900" size="sm">
                        <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> Simpan QC
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}

// --- HELPER COMPONENT ---
function EmptyStateCard({ icon, title, message }: { icon: React.ReactNode, title: string, message: string }) {
    return (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center text-slate-400">
            <div className="flex justify-center mb-3 [&>svg]:h-12 [&>svg]:w-12 [&>svg]:text-slate-300">
                {icon}
            </div>
            <h3 className="text-lg font-medium text-slate-700">{title}</h3>
            <p className="text-sm mt-1">{message}</p>
        </div>
    );
}

ProductionBoard.layout = (page: React.ReactElement<BoardProps>) => {
    
    return (
        <AppLayout
            title=""
            description=""
            information=""    
            breadcrumbs={[
                {
                    title: 'Worker Board',
                    href: '',
                },
            ]}
        >
            {page}
        </AppLayout>
    )
};