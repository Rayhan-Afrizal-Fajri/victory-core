import React from 'react';
import { JobTicket } from '../types';
import StatusBadge from './StatusBadge';

export const JobTicketHeader: React.FC<{ job: JobTicket }> = ({ job }) => {
  const progress = job.productionProgress?.percent ?? (job as any).progressPercent ?? 0;
  const priority = job.productionProgress?.prioritas ?? (job as any).priority;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <div className="text-sm text-gray-500">No. Job</div>
        <div className="text-lg font-bold">{job.order_number}</div>
        <div className="text-sm text-gray-600">{job.customer?.name || job.customer?.company} • {job.product_name}</div>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right">
          <div className="text-sm text-gray-500">Deadline</div>
          <div className="font-medium">{job.deadline ?? '—'}</div>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500">Progress</div>
          <div className="w-40 bg-gray-100 rounded-full h-3 overflow-hidden">
            <div className="h-3 bg-green-500" style={{ width: `${progress}%` }} />
          </div>
          <div className="text-xs text-gray-600 mt-1">{progress}%</div>
        </div>
        <div>
          <div className="text-sm text-gray-500">Prioritas</div>
          <StatusBadge label={priority ?? 'Normal'} variant={priority === 'High' || priority === 'Urgent' ? 'warning' : 'default'} />
        </div>
        <div>
          <div className="text-sm text-gray-500">Status</div>
          <StatusBadge label={job.status ?? 'Aktif'} variant={job.status === 'Done' ? 'success' : 'info'} />
        </div>
      </div>
    </div>
  );
};

export default JobTicketHeader;
