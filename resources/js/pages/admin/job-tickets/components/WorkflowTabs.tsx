import { Lock } from 'lucide-react';
import React from 'react';
import { toast } from 'sonner';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import type { JobTicket, ProductOption, Supplier } from '../types';

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

const tabs = [
  'overview',
  'design',
  'invoices',
  'purchasing',
  'sample',
  'production',
  'activity',
] as const;

export const WorkflowTabs: React.FC<{ job: JobTicket, suppliers: Supplier[], productOptions: ProductOption[] | null }> = ({ job, suppliers, productOptions }) => {
  const ws = (job as any).workflow_status ?? (job as any).workflowFlags ?? {};
  const locked = {
    purchasing: !ws.sample_paid,
    sample: !ws.materials_received,
    productionInvoice: !ws.sample_approved,
    production: !(ws.sample_approved && ws.production_dp_paid && ws.materials_received),
    qc: !ws.production_completed,
    packing: !ws.qc_completed,
    delivery: !(ws.packing_completed && ws.final_payment_paid),
  };

  function handleLocked(name: string) {
    toast.error('Tab terkunci: ' + name + '. Lengkapi langkah sebelumnya.');
  }

  const unpaidInvoices = job.invoices ? job.invoices.filter((inv: any) => !['paid', 'Paid'].includes(inv.status_tagihan || inv.status)) : [];

  return (
    
    <Tabs defaultValue="overview" className="mt-4 w-full">
        <TabsList className='w-full justify-between'>
            {tabs.map((t) => (
            <TabsTrigger
                key={t}
                value={t}
                // disabled={
                // (t === 'sample' && locked.sample) ||
                // (t === 'purchasing' && locked.purchasing) ||
                // (t === 'production' && locked.production) ||
                // (t === 'qc' && locked.qc) ||
                // (t === 'packing' && locked.packing) ||
                // (t === 'delivery' && locked.delivery)
                // }
                onClick={(e: any) => {
                const isLocked = e.currentTarget.disabled;

                if (isLocked) {
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
                                {unpaidInvoices.length || 0}
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

        <TabsContent value="overview">
            <OverviewTab job={job} />
        </TabsContent>
        <TabsContent value="design">
            <DesignTab job={job} products={productOptions} suppliers={suppliers} />
        </TabsContent>
        <TabsContent value="invoices">
            <FinanceTab job={job} />
        </TabsContent>
        <TabsContent value="purchasing">
            <PurchasingTab job={job} suppliers={suppliers} />
        </TabsContent>
        <TabsContent value="sample">
            <SampleTab job={job} />
        </TabsContent>
        <TabsContent value="production">
            <ProductionTab job={job} />
        </TabsContent>
        <TabsContent value="activity">
            <ActivityTab job={job} />
        </TabsContent>
    </Tabs>
  );
};

export default WorkflowTabs;
