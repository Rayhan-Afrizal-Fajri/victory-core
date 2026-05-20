import React, { useState } from 'react';
import { JobTicket } from '../../types';
import SectionCard from '../SectionCard';
import WorkflowGate from '../WorkflowGate';

const ProductionTab: React.FC<{ job: JobTicket }> = ({ job }) => {
  const ws = (job as any).workflow_status ?? {};
  if (!(ws.sample_approved && ws.production_dp_paid && ws.materials_distributed)) {
    return <WorkflowGate reason="Produksi terkunci. Pastikan sampel disetujui, pembayaran produksi terverifikasi, dan distribusi material selesai." />;
  }

  const [checklist, setChecklist] = useState(job.productionProgress?.checklist || ['Potong', 'Sewing', 'Finishing']);
  const [progress, setProgress] = useState(job.productionProgress?.percent ?? 0);

  return (
    <div className="space-y-4">
      <SectionCard title="Checklist Produksi">
        <ul className="space-y-2">
          {checklist.map((c: string, idx: number) => (
            <li key={idx} className="flex items-center gap-2">
              <input type="checkbox" />
              <span>{c}</span>
            </li>
          ))}
        </ul>
        <div className="mt-2 text-sm">Progress: {progress}%</div>
      </SectionCard>

      <SectionCard title="Catatan Internal">
        <textarea className="w-full border rounded-md p-2" rows={4} />
      </SectionCard>
    </div>
  );
};

export default ProductionTab;
