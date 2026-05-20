import React from 'react';
import type { JobTicket } from '../../types';
import SectionCard from '../SectionCard';
import WorkflowGate from '../WorkflowGate';

const QCTab: React.FC<{ job: JobTicket }> = ({ job }) => {
  const ws = (job as any).workflow_status ?? {};

  if (!ws.production_completed) {
return <WorkflowGate reason="Produksi belum selesai. QC terkunci." />;
}

  return (
    <div className="space-y-4">
      <SectionCard title="QC Checklist">
        <div className="text-sm">Reject count: {job.qc?.reject_count ?? 0}</div>
      </SectionCard>

      <SectionCard title="Foto QC">
        <div className="border border-dashed rounded-md p-6 text-center">Placeholder foto QC</div>
      </SectionCard>
    </div>
  );
};

export default QCTab;
