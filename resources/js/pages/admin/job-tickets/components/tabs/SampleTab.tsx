import React from 'react';
import { toast } from 'sonner';
import type { JobTicket } from '../../types';
import SectionCard from '../SectionCard';
import WorkflowGate from '../WorkflowGate';

const SampleTab: React.FC<{ job: JobTicket }> = ({ job }) => {
  const designApproved = (job as any).workflow_status?.design_approved ?? false;

  if (!designApproved) {
return <WorkflowGate reason="Desain belum disetujui. Sampel terkunci." />;
}

  return (
    <div className="space-y-4">
      <SectionCard title="Informasi Sampel">
        <div>Jumlah: {job.samples?.[0]?.qty ?? 0}</div>
        <div>Status: {job.samples?.[0]?.status ?? 'pending'}</div>
      </SectionCard>

      <SectionCard title="Upload Foto Sampel">
        <div className="border border-dashed rounded-md p-6 text-center">Placeholder upload foto</div>
      </SectionCard>

      <SectionCard title="Aksi">
        <div className="flex gap-2">
          <button onClick={() => toast.success('Sampel disetujui')} className="btn btn-primary">ACC Sampel</button>
        </div>
      </SectionCard>
    </div>
  );
};

export default SampleTab;
