import SectionCard from "@/pages/admin/job-tickets/components/SectionCard";
import { AlertCircle, CheckCircle, CreditCard, PackageCheck, Truck } from "lucide-react";

const SampleProgressStepper = ({
    workflow,
    sample,
}: {
    workflow: any;
    sample: any;
}) => {
    const steps = [
        {
            title: 'Sample Created',
            description: 'Sample dibuat',
            icon: <PackageCheck className="size-5" />,
            active: workflow?.sample_created,
        },
        {
            title: 'Payment',
            description: 'Invoice lunas',
            icon: <CreditCard className="size-5" />,
            active: workflow?.sample_paid,
        },
        {
            title: 'Delivery',
            description: 'Sample diterima',
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
            <div className="grid gap-3 md:grid-cols-4">
                {steps.map((step, index) => (
                    <div
                        key={step.title}
                        className={`relative rounded-2xl border p-4 transition ${
                            step.active
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                                : 'border-slate-200 bg-white text-slate-500'
                        }`}
                    >
                        <div className="mb-3 flex items-center justify-between">
                            <div
                                className={`rounded-xl p-2 ${
                                    step.active ? 'bg-emerald-100' : 'bg-slate-100'
                                }`}
                            >
                                {step.icon}
                            </div>
                            <span className="text-xs font-semibold">
                                Step {index + 1}
                            </span>
                        </div>
                        <p className="text-sm font-semibold">{step.title}</p>
                        <p className="mt-1 text-xs opacity-80">{step.description}</p>
                    </div>
                ))}
            </div>

            {sample?.status === 'revision_needed' && (
                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                    <div className="flex gap-2">
                        <AlertCircle className="mt-0.5 size-4 shrink-0" />
                        <div>
                            <p className="font-semibold">Sample membutuhkan revisi.</p>
                            <p className="mt-1">
                                Buat sample revisi baru berdasarkan catatan customer.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </SectionCard>
    );
};

export default SampleProgressStepper;