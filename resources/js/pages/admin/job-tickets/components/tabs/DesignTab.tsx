import React, { useState } from 'react';
import { JobTicket } from '../../types';
import SectionCard from '../SectionCard';
import { toast } from 'sonner';
import { router } from '@inertiajs/react';

const DesignTab: React.FC<{ job: JobTicket }> = ({ job }) => {
  const initialApproved = (job as any).workflow_status?.design_approved ?? false;
  const [approved, setApproved] = useState(initialApproved);

  function handleApprove() {
    if (!job.id) return;
    router.patch(`/job-tickets/${job.id}/design-approve`, {}, {
      onSuccess: () => {
        setApproved(true);
        toast.success('Desain disetujui');
      },
      onError: () => {
        toast.error('Gagal menyetujui desain');
      }
    });
  }

  function handleReject() {
    // reject not yet implemented on backend — dummy for now
    setApproved(false);
    toast.success('Desain ditolak (dummy)');
  }

  return (
    <div className="space-y-4">
      <SectionCard title="Upload Desain">
        <div className="border border-dashed rounded-md p-6 text-center">Placeholder upload desain</div>
      </SectionCard>

      <SectionCard title="Preview & Riwayat">
        <div className="text-sm text-gray-700">Riwayat revisi:</div>
        <ul className="text-sm list-disc pl-5">
          {(job.designs || []).map((d) => (
            <li key={d.id} className="text-gray-600">{d.created_at} — {d.note}</li>
          ))}
        </ul>
      </SectionCard>

      <SectionCard title="Aksi">
        {!approved ? (
          <div className="flex gap-2">
            <button className="btn btn-primary" onClick={handleApprove}>Setujui</button>
            <button className="btn btn-outline" onClick={handleReject}>Tolak</button>
          </div>
        ) : (
          <div className="text-sm text-green-700">Desain sudah disetujui</div>
        )}
      </SectionCard>
    </div>
  );
};

export default DesignTab;
