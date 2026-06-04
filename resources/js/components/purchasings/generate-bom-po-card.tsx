import SectionCard from '@/pages/admin/job-tickets/components/SectionCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import FormattedNumberInput from '../ui/formatted-number-input';

function GenerateBomPoCard({
    job,
    form,
    onSubmit,
}: {
    job: any;
    form: any;
    onSubmit: (e: React.FormEvent) => void;
}) {

    const productionQty = Number(job.quantity || job.q || 0);
    const sampleQty = Number(job.sample_qty || 1);
    const totalPlannedQty = productionQty + sampleQty;

    return (
        <SectionCard title="Generate BOM / Purchase Order">
            <form onSubmit={onSubmit} className="space-y-4">
                <div>
                    <p className="font-semibold text-slate-900">
                        Generate purchasing dari BOM
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                        Sistem akan membuat daftar pembelian bahan dari spesifikasi Design untuk kebutuhan sample dan production sekaligus.
                    </p>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <InfoBox
                        label="Production Qty"
                        value={`${productionQty} pcs`}
                    />

                    <InfoBox
                        label="Sample Qty"
                        value={`${sampleQty} pcs`}
                    />

                    <InfoBox
                        label="Total Planned Qty"
                        value={`${totalPlannedQty} pcs`}
                    />
                </div>

                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                    Purchasing ini dibuat satu kali untuk kebutuhan sample dan production. Qty pembelian masih bisa diedit setelah BOM/PO digenerate.
                </div>

                <div className="flex justify-end border-t pt-4">
                    <Button type="submit" disabled={form.processing}>
                        Generate BOM / PO
                    </Button>
                </div>
            </form>
        </SectionCard>
    );
}

function InfoBox({
    label,
    value,
}: {
    label: string;
    value: React.ReactNode;
}) {
    return (
        <div className="rounded-xl border bg-white p-4">
            <p className="text-xs font-medium uppercase text-slate-500">
                {label}
            </p>
            <p className="mt-2 text-lg font-bold text-slate-900">
                {value}
            </p>
        </div>
    );
}

export default GenerateBomPoCard;