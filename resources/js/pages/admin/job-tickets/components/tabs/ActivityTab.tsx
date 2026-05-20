import React from 'react';
import { JobTicket } from '../../types';
import SectionCard from '../SectionCard';

const ActivityTab: React.FC<{ job: JobTicket }> = ({ job }) => {
  return (
    <div className="space-y-4">
      <SectionCard title="Activity Log">
        <ul className="space-y-2 text-sm">
          {(job.workflowHistories || []).map((a) => (
            <li key={a.id} className="border p-2 rounded-md">
              <div className="text-sm font-medium">{a.actor}</div>
              <div className="text-xs text-gray-600">{a.action} — {a.note}</div>
              <div className="text-xs text-gray-400">{a.created_at}</div>
            </li>
          ))}
        </ul>
      </SectionCard>
    </div>
  );
};

export default ActivityTab;
