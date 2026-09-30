import SectionCard from "@/pages/admin/job-tickets/components/SectionCard";
import { AlertCircle, CheckCircle, PackageCheck, Truck, Scissors, FileImage } from "lucide-react";

const SampleProgressStepper = ({
    workflow,
    sample,
}: {
    workflow: any;
    sample: any;
}) => {
    const steps = [
        {
            title: 'Created',
            description: 'Sample diinisiasi',
            icon: <PackageCheck className="size-5" />,
            active: workflow?.sample_created,
        },
        {
            title: 'Started',
            description: 'Produksi berjalan',
            icon: <Scissors className="size-5" />,
            active: workflow?.sample_started,
        },
        {
            title: 'Completed',
            description: 'Produksi selesai',
            icon: <CheckCircle className="size-5" />,
            active: workflow?.sample_completed,
        },
        {
            title: 'Gallery',
            description: 'Foto diupload',
            icon: <FileImage className="size-5" />,
            active: workflow?.sample_uploaded,
        },
        {
            title: 'Delivery',
            description: 'Sample dikirim',
            icon: <Truck className="size-5" />,
            active: workflow?.sample_delivered,
        },
        {
            title: 'Approval',
            description: 'Customer approve',
            icon: <CheckCircle className="size-5" />,
            active: workflow?.sample_approved,
        },
    ];

    return (
        <SectionCard title="Progress Sample">
            <div className="grid gap-3 grid-cols-2 md:grid-cols-6">
                {steps.map((step, index) => (
                    <div
                        key={step.title}
                        className={`relative rounded-2xl border p-4 transition ${
                            step.active
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                                : 'border-slate-100 bg-white text-slate-400'
                        }`}
                    >
                        <div className="mb-3 flex items-center justify-between">
                            <div className={`rounded-xl p-2 ${step.active ? 'bg-emerald-100' : 'bg-slate-100'}`}>
                                {step.icon}
                            </div>
                        </div>
                        <p className="text-sm font-semibold">{step.title}</p>
                    </div>
                ))}
            </div>

            {sample?.status === 'revision_needed' && (
                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                    <div className="flex gap-2">
                        <AlertCircle className="mt-0.5 size-4 shrink-0" />
                        <div>
                            <p className="font-semibold">Sample membutuhkan revisi.</p>
                            <p className="mt-1">Selesaikan proses baru berdasarkan catatan customer.</p>
                        </div>
                    </div>
                </div>
            )}
        </SectionCard>
    );
};

export default SampleProgressStepper;