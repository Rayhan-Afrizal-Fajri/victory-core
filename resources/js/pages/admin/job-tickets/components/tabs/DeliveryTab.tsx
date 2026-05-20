import React, { useState } from 'react';
import { toast } from 'sonner';
import type { JobTicket } from '../../types';
import SectionCard from '../SectionCard';
import WorkflowGate from '../WorkflowGate';

const DeliveryTab: React.FC<{ job: JobTicket }> = ({ job }) => {
  const ws = (job as any).workflow_status ?? {};

  if (!(ws.packing_completed && ws.final_payment_paid)) {
return <WorkflowGate reason="Packing belum selesai atau pembayaran akhir belum terverifikasi. Delivery terkunci." />;
}

  const [tracking, setTracking] = useState(job.delivery?.tracking_number ?? '');

  return (
    <div className="space-y-4">
      <SectionCard title="Pengiriman">
        <div className="space-y-2">
          <input value={tracking} onChange={(e) => setTracking(e.target.value)} className="w-full border rounded-md p-2" placeholder="No. resi manual" />
          <div className="flex gap-2">
            <button className="btn btn-primary" onClick={() => toast.success('Ditandai sebagai terkirim')}>Tandai Terkirim</button>
          </div>
        </div>
      </SectionCard>
    </div>
  );
};

export default DeliveryTab;
