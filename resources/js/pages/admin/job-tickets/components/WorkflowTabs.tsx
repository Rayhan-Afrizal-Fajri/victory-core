import { Lock } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import type { DefaultSizeBreakdown, JobTicket, Pesanan, ProductOption, Supplier } from '../types';

import ActivityTab from './tabs/ActivityTab';
import DeliveryTab from './tabs/DeliveryTab';
import DesignTab from './tabs/DesignTab';
import FinanceTab from './tabs/FinanceTab';
import OverviewTab from './tabs/OverviewTab';
import PackingTab from './tabs/PackingTab';
import ProductionTab from './tabs/ProductionTab';
import PurchasingTab from './tabs/PurchasingTab';
import QCTab from './tabs/QCTab';
import SampleTab from './tabs/SampleTab';
import CostingTab from './tabs/CostingTab';
import { useCan } from '@/hooks/use-can';

export const WorkflowTabs: React.FC<{ 
    jobTicket: JobTicket;
    activePesanan: Pesanan;
    suppliers: Supplier[]; 
    productOptions: ProductOption[] | null;
    colors: DefaultSizeBreakdown[];
    units: DefaultSizeBreakdown[];
}> = ({ jobTicket, activePesanan, suppliers, productOptions, colors, units }) => {
    const can = useCan();

    // Membaca status workflow dari pesanan yang sedang aktif
    const ws = activePesanan.workflow_status ?? {};
  
    const locked = {
        purchasing: !ws.sample_paid && !ws.sample_revision,
        sample: !ws.sample_materials_ready && !ws.sample_created,
        productionInvoice: !ws.sample_approved,
        production: !(ws.production_materials_ready) && !ws.production_created,
        qc: !ws.production_completed,
        packing: !ws.qc_completed,
        delivery: !(ws.packing_completed && ws.final_payment_paid),
    };

    const tabs = [
        'overview',
        ...(can(['designs.upload', 'designs.approve', 'designs.revision', 'boms.sync', 'boms.create', 'boms.edit', 'boms.delete', 'manufactures.create', 'manufactures.edit', 'manufactures.delete']) ? ['design'] : []),
        ...(can(['costings.input_price', 'quotation.generate', 'quotation.print']) ? ['costing & quotation'] : []),
        ...(can(['invoices.show', 'invoices.print', 'invoices.pay', 'invoices.verify', 'invoices.edit', 'invoices.delete']) ? ['invoices'] : []),
        ...(can(['purchasings.generate', 'purchasings.create', 'purchasings.edit', 'purchasings.mark_ordered', 'purchasings.receive']) ? ['purchasing'] : []),
        ...(can(['samples.start', 'samples.complete', 'samples.packing', 'samples.delivery', 'samples.approve', 'samples.revision']) ? ['sample'] : []),
        ...(can(['productions.run', 'productions.packing', 'productions.delivery']) ? ['production'] : []),
        ...(can(['activities.view']) ? ['activity'] : []),
    ];

    // State untuk menyimpan tab yang aktif
    const [activeTab, setActiveTab] = useState<string>('overview');

    // Filter unpaid invoice
    const unpaidInvoices = jobTicket.invoices 
      ? jobTicket.invoices.filter((inv) => !['paid', 'Paid'].includes(inv.status_tagihan || inv.status || 'unpaid')) 
      : [];

    // Fungsi untuk menghitung task yang tertunda berdasarkan Workflow Status dan Permission
    const getPendingTasksCount = (tabName: string): number => {
        let count = 0;

        switch (tabName) {
            case 'design':
                if (!ws.design_uploaded && can(['designs.upload'])) count++;
                if (ws.design_uploaded && !ws.design_approved && can(['designs.approve'])) count++;
                if (ws.design_approved && !ws.article_synced && can(['boms.sync'])) count++;
                if (ws.article_synced && !ws.design_specs_completed && can(['boms.create', 'boms.edit'])) count++;
                break;

            case 'costing & quotation':
                if (ws.design_specs_completed && !ws.price_approved && can(['costings.input_price'])) count++;
                if (ws.price_approved && !ws.quotation_created && can(['quotation.generate'])) count++;
                if (ws.quotation_created && !ws.quotation_approved && can(['quotation.approve'])) count++;
                break;

            case 'invoices':
                // Jika memiliki permission untuk memverifikasi/membayar dan ada invoice tertunggak
                if (unpaidInvoices.length > 0 && can(['invoices.pay', 'invoices.verify'])) {
                    count += unpaidInvoices.length;
                }
                break;

            case 'purchasing':
                if (ws.quotation_created) {
                    // Kebutuhan sample
                    if (ws.sample_paid && !ws.purchasing_generated && can(['purchasings.generate'])) count++;
                    if (ws.purchasing_generated && !ws.sample_materials_ready && can(['purchasings.receive'])) count++;
                    // Kebutuhan produksi (jika DP sudah dibayar tapi bahan belum ready)
                    if (ws.sample_materials_ready && !ws.production_materials_ready && can(['purchasings.receive'])) count++;
                }
                break;

            case 'sample':
                if (ws.sample_materials_ready && !ws.sample_started && can(['samples.start'])) count++;
                if (ws.sample_started && !ws.sample_completed && can(['samples.complete'])) count++;
                if (ws.sample_completed && !ws.sample_uploaded && can(['samples.complete'])) count++; // Asumsi update foto proof pakai permission ini
                if (ws.sample_uploaded && !ws.sample_delivered && can(['samples.delivery'])) count++;
                if (ws.sample_delivered && !ws.sample_approved && can(['samples.approve'])) count++;
                break;

            case 'production':
                if (ws.production_materials_ready && !ws.production_started && can(['productions.run'])) count++;
                if (ws.production_started && !ws.production_completed && can(['productions.run'])) count++;
                if (ws.production_completed && !ws.qc_completed && can(['productions.run'])) count++; // QC diasumsikan di dalam team produksi
                if (ws.qc_completed && !ws.packing_completed && can(['productions.packing'])) count++;
                if (ws.packing_completed && ws.final_payment_paid && !ws.delivered && can(['productions.delivery'])) count++;
                break;

            default:
                break;
        }

        return count;
    };

    // Membaca Parameter URL saat pertama kali load
    useEffect(() => {
        const searchParams = new URLSearchParams(window.location.search);
        const tabParam = searchParams.get('tab');

        // Pastikan param tab valid (ada di dalam array permissions)
        if (tabParam && tabs.includes(tabParam)) {
            // Cek apakah tab tersebut terkunci
            const isLockedTab = tabParam !== 'invoices' && tabParam !== 'overview' && tabParam !== 'activity' && (locked as any)[tabParam];
            
            if (!isLockedTab) {
                setActiveTab(tabParam);
            } else {
                toast.error(`Tab ${tabParam} terkunci. Dialihkan ke overview.`);
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function handleLocked(name: string) {
        toast.error(`Tab terkunci: ${name}. Lengkapi langkah sebelumnya pada pesanan ini.`);
    }

    // Update state dan URL secara diam-diam (tanpa reload) ketika user pindah tab manual
    const handleTabChange = (value: string) => {
        setActiveTab(value);
        const url = new URL(window.location.href);
        url.searchParams.set('tab', value);
        window.history.replaceState({}, '', url); // Update URL parameter
    };

    return (
        <Tabs value={activeTab} onValueChange={handleTabChange} className="mt-4 w-full">
            <TabsList className='w-full justify-start overflow-x-auto overflow-y-hidden gap-2 h-full'>
                {tabs.map((t) => {
                    const isLockedTab = t !== 'invoices' && t !== 'overview' && t !== 'activity' && (locked as any)[t];
                    const pendingCount = getPendingTasksCount(t);
                    
                    return (
                        <TabsTrigger
                            key={t}
                            value={t}
                            onClick={(e: any) => {
                                if (isLockedTab) {
                                    e.preventDefault(); // Mencegah onValueChange terpanggil jika diklik
                                    handleLocked(t);
                                }
                            }}
                        >
                            <div className="flex items-center gap-2">
                                <span className="capitalize flex items-center">
                                    {t} 
                                    {/* Merender badge notifikasi jika ada tugas yang tertunda dan bukan tab yang dilock */}
                                    {pendingCount > 0 && !isLockedTab && (
                                        <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-sm">
                                            {pendingCount}
                                        </span>
                                    )}
                                </span>
                                {isLockedTab && <Lock size={14} className="text-gray-400" />}
                            </div>
                        </TabsTrigger>
                    );
                })}
            </TabsList>

            <TabsContent value="overview"><OverviewTab jobTicket={jobTicket} activePesanan={activePesanan} /></TabsContent>
            <TabsContent value="design"><DesignTab jobTicket={jobTicket} products={productOptions} suppliers={suppliers} colors={colors} units={units}/></TabsContent>
            <TabsContent value="costing & quotation"><CostingTab jobTicket={jobTicket} /></TabsContent>
            <TabsContent value="invoices"><FinanceTab jobTicket={jobTicket} /></TabsContent>
            <TabsContent value="purchasing"><PurchasingTab job={jobTicket} suppliers={suppliers} /></TabsContent>
            <TabsContent value="sample"><SampleTab job={jobTicket} /></TabsContent>
            <TabsContent value="production"><ProductionTab job={jobTicket} /></TabsContent>
            <TabsContent value="activity"><ActivityTab job={jobTicket} /></TabsContent>
        </Tabs>
    );
};

export default WorkflowTabs;