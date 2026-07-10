import { Lock } from 'lucide-react';
import React from 'react';
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
import SampleTab1 from './tabs/SampleTab1';

// const tabs = [
//   'overview',
//   'design',
//   'costing & quotation',
//   'invoices',
//   'purchasing',
//   'sample',
//   'production',
//   'activity',
// ] as const;

export const WorkflowTabs: React.FC<{ 
  jobTicket: JobTicket;
  activePesanan: Pesanan;
  suppliers: Supplier[]; 
  productOptions: ProductOption[] | null;
  colors: DefaultSizeBreakdown[];
  units: DefaultSizeBreakdown[];
}> = ({ jobTicket, activePesanan, suppliers, productOptions, colors, units }) => {
    const can = useCan();

    const tabs = [
        'overview',
        ...(can([
            'designs.upload', 'designs.approve', 'designs.revision', 
            'boms.sync', 'boms.create', 'boms.edit', 'boms.delete', 
            'manufactures.create', 'manufactures.edit', 'manufactures.delete'
        ]) ? ['design'] : []),
        ...(can([
            'costings.input_price', 'quotation.generate', 'quotation.print'
        ]) ? ['costing & quotation'] : []),
        ...(can([
            'invoices.show',
            'invoices.print',
            'invoices.pay',
            'invoices.verify',
            'invoices.edit',
            'invoices.delete',
        ]) ? ['invoices'] : []),
        ...(can([
            'purchasings.generate',
            'purchasings.create',
            'purchasings.edit',
            'purchasings.mark_ordered',
            'purchasings.receive',
        ]) ? ['purchasing'] : []),
        ...(can([
            'samples.start',
            'samples.complete',
            'samples.packing',
            'samples.delivery',
            'samples.approve',
            'samples.revision',
        ]) ? ['sample'] : []),
        ...(can([
            'productions.run',
            'productions.packing',
            'productions.delivery',
        ]) ? ['production'] : []),
        ...(can([
            'activities.view',
        ]) ? ['activity'] : []),
    ]
  
  // Membaca status workflow dari pesanan yang sedang aktif
  const ws = activePesanan.workflow_status ?? {};
  
  const locked = {
    purchasing: !ws.sample_paid && !ws.sample_revision,
    sample: !ws.sample_materials_ready,
    productionInvoice: !ws.sample_approved,
    production: !(ws.production_materials_ready),
    qc: !ws.production_completed,
    packing: !ws.qc_completed,
    delivery: !(ws.packing_completed && ws.final_payment_paid),
  };

  function handleLocked(name: string) {
    toast.error(`Tab terkunci: ${name}. Lengkapi langkah sebelumnya pada pesanan ini.`);
  }

  // Invoice sekarang membaca dari JobTicket (Global)
  const unpaidInvoices = jobTicket.invoices 
    ? jobTicket.invoices.filter((inv) => !['paid', 'Paid'].includes(inv.status_tagihan || inv.status || 'unpaid')) 
    : [];

  return (
    <Tabs defaultValue="overview" className="mt-4 w-full">
        <TabsList className='w-full justify-start overflow-x-auto overflow-y-hidden gap-2 h-full'>
            {tabs.map((t) => (
            <TabsTrigger
                key={t}
                value={t}
                onClick={(e: any) => {
                  // Tab invoice tidak dikunci per pesanan karena sifatnya global
                  const isLockedTab = t !== 'invoices' && t !== 'overview' && t !== 'activity' && (locked as any)[t];
                  
                  if (isLockedTab) {
                      e.preventDefault();
                      handleLocked(t);
                  }
                }}
            >
                <div className="flex items-center gap-2">
                <span className="capitalize">
                    {t} 
                    {t === 'invoices' && (
                        // badge jumlah invoice atau yang belum dibayar
                        unpaidInvoices.length > 0 && (
                            <span className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                                {unpaidInvoices.length}
                            </span>
                        )
                    )}
                </span>
                {((t === 'sample' && locked.sample) || (t === 'purchasing' && locked.purchasing) || (t === 'production' && locked.production) ) && (
                    <Lock size={14} className="text-gray-400" />
                )}
                </div>
            </TabsTrigger>
            ))}
        </TabsList>

        {/* Pastikan untuk menyesuaikan props di masing-masing Tab component ini
            nantinya agar bisa menerima `jobTicket` dan `activePesanan` 
        */}
        <TabsContent value="overview">
            <OverviewTab jobTicket={jobTicket} activePesanan={activePesanan} />
        </TabsContent>
        <TabsContent value="design">
            <DesignTab jobTicket={jobTicket} products={productOptions} suppliers={suppliers} colors={colors} units={units}/>
        </TabsContent>
        <TabsContent value="costing & quotation">
            <CostingTab jobTicket={jobTicket} />
        </TabsContent>
        <TabsContent value="invoices">
            <FinanceTab jobTicket={jobTicket} />
        </TabsContent>
        <TabsContent value="purchasing">
            <PurchasingTab job={jobTicket} suppliers={suppliers} />
        </TabsContent>
        <TabsContent value="sample">
            <SampleTab job={jobTicket} />
        </TabsContent>
        <TabsContent value="production">
            <ProductionTab job={jobTicket} />
        </TabsContent>
        <TabsContent value="activity">
            <ActivityTab job={jobTicket} />
        </TabsContent>
    </Tabs>
  );
};

export default WorkflowTabs;