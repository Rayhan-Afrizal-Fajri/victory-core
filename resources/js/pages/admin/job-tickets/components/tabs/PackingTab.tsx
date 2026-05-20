import React from 'react';
import { JobTicket } from '../../types';
import SectionCard from '../SectionCard';
import WorkflowGate from '../WorkflowGate';

const PackingTab: React.FC<{ job: JobTicket }> = ({ job }) => {
  const ws = (job as any).workflow_status ?? {};
  if (!ws.qc_completed) return <WorkflowGate reason="QC belum selesai. Packing terkunci." />;

  return (
    <div className="space-y-4">
      <SectionCard title="Packing Checklist">
        <div className="text-sm">Status packing: {job.packing ? 'In Progress' : 'Belum'}</div>
      </SectionCard>
    </div>
  );
};

export default PackingTab;
