import React from 'react';
import { JobTicket } from '../../types';
import SectionCard from '../SectionCard';

const OverviewTab: React.FC<{ job: JobTicket }> = ({ job }) => {
  const progress = job.productionProgress?.percent ?? (job as any).progressPercent ?? 0;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SectionCard title="Ringkasan">
          <div className="text-sm text-gray-700">Pelanggan: {job.customer?.name || job.customer?.company}</div>
          <div className="text-sm text-gray-700">Produk: {job.product_name}</div>
          <div className="text-sm text-gray-700">Deadline: {job.deadline ?? '—'}</div>
        </SectionCard>
        <SectionCard title="Langkah Aktif">
          <div className="text-sm text-gray-700">Lihat timeline untuk langkah saat ini.</div>
        </SectionCard>
        <SectionCard title="Komersial">
          <div className="text-sm text-gray-700">Progress: {progress}%</div>
        </SectionCard>
      </div>

      <SectionCard title="Persyaratan Tertunda">
        <div className="text-sm text-gray-600">Tidak ada persyaratan kritis saat ini.</div>
      </SectionCard>
    </div>
  );
};

export default OverviewTab;
