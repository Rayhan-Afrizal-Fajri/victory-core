import { ClipboardList } from 'lucide-react';

import SectionCard from '@/pages/admin/job-tickets/components/SectionCard';
import EmptyState from '@/components/sample/empty-state';

const DesignSpecsReferenceCard = ({ job }: { job: any }) => {
    const specifications =
        job.specs ||
        [];

    return (
        <SectionCard title="Referensi Spesifikasi Artikel">
            {specifications.length === 0 ? (
                <EmptyState
                    icon={<ClipboardList className="size-5" />}
                    title="Belum ada spesifikasi artikel"
                    description="Spesifikasi yang diisi di Design Tab akan muncul di sini sebagai referensi purchasing."
                />
            ) : (
                <div className="grid gap-3 md:grid-cols-2">
                    {specifications.map((spec: any, index: number) => (
                        <div
                            key={spec.id || index}
                            className="rounded-2xl border bg-white p-4"
                        >
                            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                                {spec.jenis_spesifikasi || spec.type || `Spesifikasi ${index + 1}`}
                            </p>

                            <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-900">
                                {spec.value || spec.detail || '-'}
                            </p>
                        </div>
                    ))}
                </div>
            )}
        </SectionCard>
    );
};

export default DesignSpecsReferenceCard;