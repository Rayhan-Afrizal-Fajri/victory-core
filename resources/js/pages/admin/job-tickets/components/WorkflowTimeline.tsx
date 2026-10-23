import { CheckCircle2 } from 'lucide-react';
import React from 'react';
import type { JobTicket, Pesanan, WorkflowStatus } from '../types';
import { Card } from '@/components/ui/card';

const workflowGroups = [
  {
    key: 'order_entry',
    label: 'Order Entry',
    steps: ['pesanan_id'],
  },
  {
    key: 'design',
    label: 'Design Specs',
    steps: ['design_uploaded', 'design_approved', 'article_synced'],
  },
  {
    key: 'costing',
    label: 'Costing',
    steps: ['design_specs_completed', 'price_approved'],
  },
  {
    key: 'quotation',
    label: 'Quotation',
    steps: ['quotation_created', 'quotation_approved'],
  },
  {
    key: 'invoice_sample',
    label: 'Invoice Sample',
    steps: ['sample_paid'],
  },
  {
    key: 'sample_purchasing',
    label: 'Sample Purchasings',
    steps: ['sample_materials_ready'],
  },
  {
    key: 'sample',
    label: 'Sample',
    steps: ['sample_created', 'sample_delivered', 'sample_approved'],
  },
  {
    key: 'production_payment',
    label: 'Production Payment',
    steps: ['production_invoice_created', 'production_dp_paid'],
  },
  {
    key: 'production_purchasing',
    label: 'Production Purchasings',
    steps: ['production_materials_ready'],
  },
  {
    key: 'production',
    label: 'Production',
    steps: ['production_started', 'production_completed', 'qc_completed', 'packing_completed'],
  },
  {
    key: 'final_billing',
    label: 'Final Billing',
    steps: ['final_payment_paid'],
  },
  {
    key: 'delivery',
    label: 'Delivery',
    steps: ['delivered'],
  },
  {
    key: 'done',
    label: 'Done',
    steps: ['completed'],
  },
];

function getGroupProgress(
  group: typeof workflowGroups[number],
  flags?: WorkflowStatus | null
) {
  const total = group.steps.length;

  const completed = group.steps.filter((step) => {
    // Casting step sebagai keyof WorkflowStatus
    return flags?.[step as keyof WorkflowStatus];
  }).length;

  return {
    total,
    completed,
    percentage: (completed / total) * 100,
  };
}

function getGroupStatus(percentage: number) {
  if (percentage >= 100) return 'completed';
  if (percentage > 0) return 'active';
  return 'pending';
}

export const WorkflowTimeline: React.FC<{ 
  jobTicket: JobTicket;
  activePesanan: Pesanan;
}> = ({ jobTicket, activePesanan }) => {
  
  // Mengambil parameter flags dari pesanan yang sedang aktif
  const flags = activePesanan.workflow_status;

  return (
    <Card className="rounded-2xl border border-border/70 bg-card py-0 overflow-hidden shadow-xs">
      <div className="overflow-x-auto no-scrollbar">
        <div className="flex min-w-max px-8 py-6">
          {workflowGroups.map((group, index) => {
            let progress = getGroupProgress(group, flags);
            let status = getGroupStatus(progress.percentage);
            let isLast = index === workflowGroups.length - 1;

            return (
              <div
                key={group.key}
                className="relative flex flex-col items-center w-40"
              >
                {!isLast && (
                  <div className="absolute top-5 left-1/2 w-full h-1 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-500"
                      style={{ width: `${progress.percentage}%` }}
                    />
                  </div>
                )}

                <div
                  className={`
                    relative z-10 w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all
                    ${
                      status === 'completed'
                        ? 'bg-emerald-500 border-emerald-500 text-white shadow-xs'
                        : status === 'active'
                        ? 'border-emerald-500 text-emerald-500 bg-card shadow-xs ring-4 ring-emerald-500/10'
                        : 'border-border text-muted-foreground bg-muted/50'
                    }
                  `}
                >
                  {status === 'completed' ? (
                    <CheckCircle2 size={18} />
                  ) : (
                    <span className="text-xs font-semibold">
                      {index + 1}
                    </span>
                  )}
                </div>

                <div className="mt-2.5 text-xs text-center w-28 leading-tight font-medium text-foreground/90">
                  {group.label}
                </div>

                <div className="text-[10px] text-muted-foreground mt-1 font-medium">
                  {progress.completed}/{progress.total}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
};

export default WorkflowTimeline;