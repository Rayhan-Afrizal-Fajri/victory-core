import React from 'react';
import type { JobTicket } from '../../types';
import SectionCard from '../SectionCard';
import WorkflowGate from '../WorkflowGate';

const PurchasingTab: React.FC<{ job: JobTicket }> = ({ job }) => {
  const verified = (job as any).workflow_status?.production_dp_paid ?? false;

  if (!verified) {
return <WorkflowGate reason="Pembayaran produksi belum diverifikasi. Purchasing terkunci." />;
}

  return (
    <div className="space-y-4">
      <SectionCard title="Daftar Material">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-500">
              <th>Material</th>
              <th>Supplier</th>
              <th>Ordered</th>
              <th>Received</th>
              <th>Sisa</th>
            </tr>
          </thead>
          <tbody>
            {(job.purchasings || []).map((p) => (
              <tr key={p.id} className="border-t">
                <td className="py-2">{p.item}</td>
                <td className="py-2">{p.supplier}</td>
                <td className="py-2">{p.ordered_qty}</td>
                <td className="py-2">{p.received_qty}</td>
                <td className="py-2">{p.ordered_qty - (p.received_qty || 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </SectionCard>
    </div>
  );
};

export default PurchasingTab;
