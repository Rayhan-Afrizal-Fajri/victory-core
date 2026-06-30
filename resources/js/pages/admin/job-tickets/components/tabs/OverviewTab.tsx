import React, { useState } from 'react';
import type { JobTicket, Pesanan, WorkflowStatus } from '../../types';
import SectionCard from '../SectionCard';
import { getWorkflowProgress } from '@/components/job-tickets/utils';
import { Badge } from '@/components/ui/badge';
import { 
  AlertCircle, 
  CalendarClock, 
  CheckCircle2, 
  ChevronRight, 
  CircleDollarSign, 
  Hash, 
  Package, 
  Ruler, 
  User 
} from 'lucide-react';

type Props = {
    jobTicket: JobTicket;
    activePesanan: Pesanan;
};

// Helper untuk format rupiah
const formatIDR = (value?: number) => {
    if (value === undefined || value === null) return '-';
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(value);
};

// Logika dinamis untuk mendeteksi apa langkah (blocker) selanjutnya
const getPendingRequirements = (ws?: WorkflowStatus) => {
    const pending: string[] = [];
    if (!ws) return ['Inisialisasi pesanan belum selesai.'];

    if (!ws.design_uploaded) pending.push('Upload desain atau mockup produk (Tab Design).');
    else if (!ws.design_approved) pending.push('Tunggu persetujuan (approval) desain dari customer.');
    
    if (ws.design_approved && !ws.quotation_created) pending.push('Buat Quotation/Penawaran Harga (Tab Costing/Invoices).');
    else if (ws.quotation_created && !ws.quotation_approved) pending.push('Tunggu persetujuan Quotation dari customer.');
    
    if (ws.quotation_approved && !ws.sample_paid) pending.push('Tunggu pembayaran Invoice Sample / DP.');
    
    if (ws.sample_paid && (!ws.materials_purchased || !ws.materials_received)) {
        pending.push('Proses Purchasing dan Penerimaan Material Sample.');
    }

    if (ws.sample_materials_ready && !ws.sample_created) pending.push('Mulai produksi Sample.');
    else if (ws.sample_created && !ws.sample_approved) pending.push('Kirim & tunggu approval fisik Sample dari customer.');

    if (ws.sample_approved && !ws.production_dp_paid) pending.push('Tunggu pembayaran DP Produksi.');
    
    if (ws.production_dp_paid && !ws.production_started) pending.push('Mulai proses produksi massal (Tab Production).');
    else if (ws.production_started && !ws.production_completed) pending.push('Selesaikan tahapan produksi massal.');

    if (ws.production_completed && !ws.qc_completed) pending.push('Selesaikan Quality Control (QC).');
    if (ws.qc_completed && !ws.packing_completed) pending.push('Lakukan proses Packing.');
    if (ws.packing_completed && !ws.final_payment_paid) pending.push('Tunggu pelunasan (Final Payment).');
    if (ws.final_payment_paid && !ws.delivered) pending.push('Kirim barang ke customer (Delivery).');

    return pending;
};

const OverviewTab: React.FC<Props> = ({ jobTicket, activePesanan }) => {
    const [activeOrderIndex, setActiveOrderIndex] = useState<number>(0);
    const activeOrder: Pesanan | undefined = jobTicket?.orders?.[activeOrderIndex];

    // Progress dari pesanan spesifik yang sedang aktif
    const workflow = activeOrder.workflow_status;
    const progressData = getWorkflowProgress(workflow);
    const pendingTasks = getPendingRequirements(workflow);

    // Menghitung total size breakdown
    const totalSizeQty = activeOrder.size_breakdowns?.reduce((acc, curr) => acc + (curr.qty || 0), 0) || 0;

    return (
        <div className="space-y-6">
            {jobTicket.orders && jobTicket.orders.length > 1 && (
                <div className="mb-6 bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Pilih Produk Pesanan:</p>
                    <div className="flex gap-2 overflow-x-auto pb-2">
                        {jobTicket.orders.map((order, index) => (
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
            
            {/* ALERT PENDING REQUIREMENT - Jika pesanan belum Done */}
            {!workflow?.completed && pendingTasks.length > 0 && (
                <div className="flex gap-3 bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-lg items-start shadow-sm">
                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                        <p className="font-semibold text-sm mb-1 text-amber-900">Action Required (Pesanan Ini)</p>
                        <ul className="text-sm space-y-1">
                            {pendingTasks.slice(0, 2).map((task, idx) => (
                                <li key={idx} className="flex items-center gap-2">
                                    <ChevronRight className="w-4 h-4 text-amber-500" />
                                    {task}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                {/* KARTU 1: DATA PELANGGAN & JOB TICKET (GLOBAL) */}
                <SectionCard title="Informasi Global & Pelanggan" icon={<User className="w-4 h-4 text-white dark:text-black" />}>
                    <div className="space-y-3">
                        <div className="flex flex-col">
                            <span className="text-xs text-slate-500 font-medium">Perusahaan</span>
                            <span className="text-sm font-semibold text-slate-800">
                                {jobTicket.company_profile ? `${jobTicket.company_profile.company_name} — ${jobTicket.company_profile.company_type}` : jobTicket.customer?.name ?? '—'}
                            </span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs text-slate-500 font-medium">Customer / Brand</span>
                            <span className="text-sm font-semibold text-slate-800">
                                {jobTicket.customer?.company ? `${jobTicket.customer.name} — ${jobTicket.customer.company}` : jobTicket.customer?.name ?? '—'}
                            </span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs text-slate-500 font-medium">Kontak (Email / Telp)</span>
                            <span className="text-sm text-slate-700">
                                {jobTicket.customer?.email ?? '-'} <br /> 
                                {jobTicket.customer?.phone ?? '-'}
                            </span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs text-slate-500 font-medium">Deadline Job Ticket</span>
                            <span className="text-sm text-slate-700 flex items-center gap-2">
                                <CalendarClock className="w-4 h-4 text-slate-400" />
                                {jobTicket.deadline ?? 'Tidak ada deadline'}
                            </span>
                        </div>
                    </div>
                </SectionCard>

                {/* KARTU 2: DETAIL PESANAN AKTIF (LOKAL/SPESIFIK) */}
                <SectionCard title="Detail Pesanan Aktif" icon={<Package className="w-4 h-4 text-white dark:text-black" />}>
                    <div className="space-y-3">
                        <div className="flex flex-col">
                            <span className="text-xs text-slate-500 font-medium">Produk yang Diminta</span>
                            <span className="text-sm font-semibold text-slate-800">
                                {activeOrder.requested_product_name || activeOrder.product_name || '—'}
                            </span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs text-slate-500 font-medium">Artikel / Master Produk</span>
                            <span className="text-sm text-slate-700">
                                {activeOrder.product?.name ? (
                                    <Badge variant="outline" className="bg-slate-50 text-slate-600">
                                        {activeOrder.product.name}
                                    </Badge>
                                ) : (
                                    <span className="text-slate-400 italic text-xs">Belum di-sync (Tab Design)</span>
                                )}
                            </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="flex flex-col">
                                <span className="text-xs text-slate-500 font-medium">Qty Produksi</span>
                                <span className="text-sm font-medium text-slate-700">{activeOrder.quantity || 0} pcs</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs text-slate-500 font-medium">Qty Sample</span>
                                <span className="text-sm font-medium text-slate-700">{activeOrder.sample_qty || 0} pcs</span>
                            </div>
                        </div>
                    </div>
                </SectionCard>

                {/* KARTU 3: KOMERSIAL & SIZE BREAKDOWN */}
                <SectionCard title="Komersial & Ukuran" icon={<CircleDollarSign className="w-4 h-4 text-white dark:text-black" />}>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-2 pb-3 border-b border-slate-100">
                            <div className="flex flex-col">
                                <span className="text-xs text-slate-500 font-medium">Harga Jual (Est.)</span>
                                <span className="text-sm font-semibold text-slate-800">
                                    {formatIDR(activeOrder.price_per_piece)}
                                </span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs text-slate-500 font-medium">HPP (Est.)</span>
                                <span className="text-sm font-medium text-slate-600">
                                    {formatIDR(activeOrder.estimated_hpp_per_piece)}
                                </span>
                            </div>
                        </div>
                        
                        <div>
                            <span className="text-xs text-slate-500 font-medium flex items-center gap-1 mb-2">
                                <Ruler className="w-3 h-3" /> Size Breakdown 
                                <span className="ml-auto text-xs font-semibold">{totalSizeQty} / {activeOrder.quantity || 0}</span>
                            </span>
                            
                            {activeOrder.size_breakdowns && activeOrder.size_breakdowns.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                    {activeOrder.size_breakdowns.map((sb, idx) => (
                                        (sb.size_label || sb.color) ? (
                                            <Badge key={idx} variant="secondary" className="text-[10px] py-0 px-2 bg-slate-100 text-slate-700 border border-slate-200">
                                                {sb.color && <span className="mr-1 opacity-70">{sb.color}</span>}
                                                {sb.fabric_spec && <span className="mr-1 opacity-70">{sb.fabric_spec}</span>}
                                                <span className="font-bold">{sb.size_label || ''}</span> : {sb.qty}
                                            </Badge>
                                        ) : null
                                    ))}
                                </div>
                            ) : (
                                <span className="text-xs text-slate-400 italic">Tidak ada detail ukuran.</span>
                            )}
                        </div>
                    </div>
                </SectionCard>
            </div>

            {/* BARIS BAWAH: PROGRESS & CATATAN GLOBAL */}
            <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr] gap-6">
                <SectionCard title={`Progress Pesanan #${activeOrder.id}`} icon={<Hash className="w-4 h-4 text-white dark:text-black" />}>
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-700">Fase Saat Ini: <strong className="text-blue-700">{progressData.currentLabel}</strong></span>
                        <span className="text-sm font-bold text-slate-800">{progressData.percent}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-3 mb-4 overflow-hidden border border-slate-200">
                        <div 
                            className={`h-3 transition-all duration-1000 ${
                                progressData.percent >= 100 ? 'bg-green-500' : progressData.percent >= 50 ? 'bg-blue-500' : 'bg-slate-400'
                            }`} 
                            style={{ width: `${progressData.percent}%` }}
                        ></div>
                    </div>
                    {progressData.percent >= 100 && (
                        <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-2 rounded-md border border-green-100">
                            <CheckCircle2 className="w-4 h-4 text-white dark:text-black" /> Pesanan ini telah selesai.
                        </div>
                    )}
                </SectionCard>

                <SectionCard title="Catatan Customer (Global)" icon={<AlertCircle className="w-4 h-4 text-white dark:text-black" />}>
                    {jobTicket.customer_notes ? (
                        <p className="text-sm text-slate-600 whitespace-pre-line leading-relaxed">
                            {jobTicket.customer_notes}
                        </p>
                    ) : (
                        <p className="text-sm text-slate-400 italic">Tidak ada catatan global untuk Job Ticket ini.</p>
                    )}
                </SectionCard>
            </div>
            
        </div>
    );
};

export default OverviewTab;