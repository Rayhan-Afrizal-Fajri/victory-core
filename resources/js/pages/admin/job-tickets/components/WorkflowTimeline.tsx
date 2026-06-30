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
    steps: ['design_specs_completed'],
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
    <Card className="rounded-4xl py-0 overflow-hidden">
      <div className="overflow-x-auto no-scrollbar">
        <div className="flex min-w-max px-8 py-6 -pb-12">
          {workflowGroups.map((group, index) => {
            let progress = getGroupProgress(group, flags);
            let status = getGroupStatus(progress.percentage);
            let isLast = index === workflowGroups.length - 1;

            // if (index > 0) {
            //   const prevGroup = workflowGroups[index - 1];
            //   const prevProgress = getGroupProgress(prevGroup, flags);
            //   const prevStatus = getGroupStatus(prevProgress.percentage);

            //   if (prevStatus !== 'completed') {
            //     progress = {
            //       total: group.steps.length,
            //       completed: 0,
            //       percentage: 0,
            //     };
            //     status = 'pending'; 
            //   }
            // }

            return (
              <div
                key={group.key}
                className="relative flex flex-col items-center w-40"
              >
                {!isLast && (
                  <div className="absolute top-5 left-1/2 w-full h-1 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 transition-all duration-500"
                      style={{ width: `${progress.percentage}%` }}
                    />
                  </div>
                )}

                <div
                  className={`
                    relative z-10 w-10 h-10 rounded-full border-4 flex items-center justify-center
                    ${
                      status === 'completed'
                        ? 'bg-green-500 border-green-500 text-white'
                        : status === 'active'
                        ? 'border-green-500 text-green-500 bg-white'
                        : 'border-gray-300 text-gray-400 bg-white'
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

                <div className="mt-2 text-xs text-center w-28 leading-tight text-gray-700">
                  {group.label}
                </div>

                <div className="text-[10px] text-gray-500 mt-1">
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