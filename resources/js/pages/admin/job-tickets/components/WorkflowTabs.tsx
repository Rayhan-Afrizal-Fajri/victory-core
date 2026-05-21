import { Lock } from 'lucide-react';
import React from 'react';
import { toast } from 'sonner';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import type { JobTicket } from '../types';

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
import { WorkflowTimeline } from './WorkflowTimeline';

const tabs = [
  'overview',
  'design',
  'sample',
  'finance',
  'purchasing',
  'production',
  'qc',
  'packing',
  'delivery',
  'activity',
] as const;

export const WorkflowTabs: React.FC<{ job: JobTicket }> = ({ job }) => {
  const ws = (job as any).workflow_status ?? (job as any).workflowFlags ?? {};
  const locked = {
    sample: !ws.design_approved,
    productionInvoice: !ws.sample_approved,
    purchasing: !ws.production_dp_paid,
    production: !(ws.sample_approved && ws.production_dp_paid && ws.materials_distributed),
    qc: !ws.production_completed,
    packing: !ws.qc_completed,
    delivery: !(ws.packing_completed && ws.final_payment_paid),
  };

  function handleLocked(name: string) {
    toast.error('Tab terkunci: ' + name + '. Lengkapi langkah sebelumnya.');
  }

  return (
    
    <Tabs defaultValue="overview" className="mt-4 w-full">
        <TabsList className='w-full justify-between'>
            {tabs.map((t) => (
            <TabsTrigger
                key={t}
                value={t}
                disabled={
                (t === 'sample' && locked.sample) ||
                (t === 'purchasing' && locked.purchasing) ||
                (t === 'production' && locked.production) ||
                (t === 'qc' && locked.qc) ||
                (t === 'packing' && locked.packing) ||
                (t === 'delivery' && locked.delivery)
                }
                onClick={(e: any) => {
                const isLocked = e.currentTarget.disabled;

                if (isLocked) {
                    e.preventDefault();
                    handleLocked(t);
                }
                }}
            >
                <div className="flex items-center gap-2">
                <span className="capitalize">{t}</span>
                {((t === 'sample' && locked.sample) || (t === 'purchasing' && locked.purchasing) || (t === 'production' && locked.production) || (t === 'qc' && locked.qc) || (t === 'packing' && locked.packing) || (t === 'delivery' && locked.delivery)) && (
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
            <DesignTab job={job} />
        </TabsContent>
        <TabsContent value="sample">
            <SampleTab job={job} />
        </TabsContent>
        <TabsContent value="finance">
            <FinanceTab job={job} />
        </TabsContent>
        <TabsContent value="purchasing">
            <PurchasingTab job={job} />
        </TabsContent>
        <TabsContent value="production">
            <ProductionTab job={job} />
        </TabsContent>
        <TabsContent value="qc">
            <QCTab job={job} />
        </TabsContent>
        <TabsContent value="packing">
            <PackingTab job={job} />
        </TabsContent>
        <TabsContent value="delivery">
            <DeliveryTab job={job} />
        </TabsContent>
        <TabsContent value="activity">
            <ActivityTab job={job} />
        </TabsContent>
    </Tabs>
  );
};

export default WorkflowTabs;
