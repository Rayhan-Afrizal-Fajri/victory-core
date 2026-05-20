import { CheckCircle2, Clock, Lock, Circle } from 'lucide-react';
import React from 'react';
import { toast } from 'sonner';
import type { JobTicket } from '../types';

const ICON_SIZE = 18;

const stepsOrder = [
  'Order Entry',
  'Design',
  'Design Approval',
  'Sample',
  'Sample Payment',
  'Sample Delivery',
  'Sample Approval',
  'Production Invoice',
  'Production Payment',
  'Purchasing',
  'Material Receiving',
  'Material Distribution',
  'Production',
  'Quality Control',
  'Packing',
  'Final Billing',
  'Delivery',
  'Done',
];

function getStepStatus(step: string, ws: JobTicket['workflow_status'] | undefined) {
  const flags = ws || {};

  switch (step) {
    case 'Order Entry':
      return flags.design_approved ? 'completed' : 'active';
    case 'Design':
      return flags.design_uploaded ? 'completed' : 'active';
    case 'Design Approval':
      return flags.design_approved ? 'completed' : 'pending';
    case 'Sample':
      if (!flags.design_approved) {
return 'locked';
}

      return flags.sample_created ? (flags.sample_approved ? 'completed' : 'active') : 'active';
    case 'Sample Payment':
      return flags.sample_paid ? 'completed' : 'pending';
    case 'Sample Approval':
      return flags.sample_approved ? 'completed' : 'pending';
    case 'Production Invoice':
      return flags.sample_approved ? (flags.production_invoice_created ? 'active' : 'pending') : 'locked';
    case 'Production Payment':
      return flags.production_dp_paid ? 'completed' : 'pending';
    case 'Purchasing':
      return flags.production_dp_paid ? 'active' : 'locked';
    case 'Material Receiving':
      return flags.materials_received ? 'completed' : 'pending';
    case 'Material Distribution':
      return flags.materials_distributed ? 'completed' : 'pending';
    case 'Production':
      if (!(flags.sample_approved && flags.production_dp_paid && flags.materials_distributed)) {
return 'locked';
}

      return flags.production_completed ? 'completed' : 'active';
    case 'Quality Control':
      return flags.production_completed ? (flags.qc_completed ? 'completed' : 'active') : 'locked';
    case 'Packing':
      return flags.qc_completed ? (flags.packing_completed ? 'completed' : 'active') : 'locked';
    case 'Final Billing':
      return flags.packing_completed ? 'active' : 'pending';
    case 'Delivery':
      return flags.packing_completed && flags.final_payment_paid ? (flags.delivered ? 'completed' : 'active') : 'locked';
    case 'Done':
      return flags.completed ? 'completed' : 'pending';
    default:
      return 'pending';
  }
}

export const WorkflowTimeline: React.FC<{ job: JobTicket }> = ({ job }) => {
  const flags = job.workflow_status;

  return (
    <div className="overflow-x-auto py-4">
      <div className="flex md:flex-col flex-row gap-6 items-center min-w-max">
        {stepsOrder.map((s) => {
          const status = getStepStatus(s, flags);

          return (
            <div key={s} className="flex flex-col items-center text-center w-36">
              <div
                className={`p-3 rounded-full border ${
                  status === 'completed' ? 'bg-green-50 border-green-200' : status === 'active' ? 'bg-yellow-50 border-yellow-200' : status === 'locked' ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-100'
                }`}
                onClick={() => {
                  if (status === 'locked') {
                    toast.error('Langkah terkunci: ' + s);
                  }
                }}
              >
                {status === 'completed' && <CheckCircle2 size={ICON_SIZE} className="text-green-600" />}
                {status === 'active' && <Clock size={ICON_SIZE} className="text-yellow-600" />}
                {status === 'locked' && <Lock size={ICON_SIZE} className="text-gray-500" />}
                {status === 'pending' && <Circle size={ICON_SIZE} className="text-gray-400" />}
              </div>
              <div className="mt-2 text-xs text-gray-600">{s}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WorkflowTimeline;
