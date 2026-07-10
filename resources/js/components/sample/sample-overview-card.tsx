import SectionCard from "@/pages/admin/job-tickets/components/SectionCard";
import { Button } from "../ui/button";
import { PlayCircle, CheckCircle2 } from "lucide-react";
import formatRupiah from "../ui/format-rupiah";

const SampleOverviewCard = ({
    sample,
    activeOrder,
    onStart,
    onComplete
} : {
    sample: any;
    activeOrder: any;
    onStart: () => void;
    onComplete: () => void;
}) => {
    return (
        <SectionCard title={`Detail Sample ${activeOrder?.requested_product_name || activeOrder?.product_name || 'Unknown'} #${sample.revision_number || 1}`}>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <InfoItem label="Status" value={<span className="capitalize">{sample.status.replace('_', ' ')}</span>} />
                <InfoItem label="Quantity" value={`${sample.qty} Pcs`} />
                <InfoItem label="Biaya" value={sample.is_chargeable ? formatRupiah(sample.sample_price) : 'Gratis'} />
                <InfoItem label="Dibuat Pada" value={new Date(sample.created_sample_at).toLocaleDateString('id-ID')} />
            </div>

            {/* ACTION BUTTONS BERDASARKAN STATUS */}
            <div className="mt-4 flex gap-3 border-t pt-4">
                {sample.status === 'draft' && (
                    <Button onClick={onStart} className="w-full bg-blue-600 hover:bg-blue-700">
                        <PlayCircle className="mr-2 size-4" /> Mulai Produksi Sample
                    </Button>
                )}

                {sample.status === 'in_production' && (
                    <Button onClick={onComplete} className="w-full bg-emerald-600 hover:bg-emerald-700">
                        <CheckCircle2 className="mr-2 size-4" /> Selesaikan Produksi Sample
                    </Button>
                )}
            </div>
        </SectionCard>
    );
};

const InfoItem = ({ label, value }: { label: string; value: React.ReactNode }) => {
    return (
        <div className="rounded-xl border bg-slate-50 p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
            <p className="mt-1 font-semibold text-slate-900">{value}</p>
        </div>
    );
};

export default SampleOverviewCard;