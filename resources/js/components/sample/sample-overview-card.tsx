import SectionCard from "@/pages/admin/job-tickets/components/SectionCard";
import formatRupiah from "../ui/format-rupiah";

const statusLabel: Record<string, string> = {
    draft: 'Draft',
    waiting_payment: 'Menunggu Pembayaran',
    paid: 'Sudah Dibayar',
    in_delivery: 'Dalam Pengiriman',
    delivered: 'Sudah Diterima',
    approved: 'Disetujui',
    revision_needed: 'Butuh Revisi',
    rejected: 'Ditolak',
};

const SampleOverviewCard = ({ sample }: { sample: any }) => {
    return (
        <SectionCard title={`Sample #${sample.revision_number ?? 0}`}>
            <div className="grid gap-4 md:grid-cols-3">
                <InfoItem label="Qty" value={`${sample.qty} pcs`} />
                <InfoItem label="Harga" value={formatRupiah(sample.sample_price)} />
                <InfoItem label="Status" value={statusLabel[sample.status] || sample.status} />
            </div>

            {sample.catatan && (
                <div className="mt-4 rounded-xl border bg-slate-50 p-4 text-sm text-slate-700">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Catatan internal/sample
                    </p>
                    {sample.catatan}
                </div>
            )}

            {sample.customer_review_note && (
                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide">
                        Catatan customer
                    </p>
                    {sample.customer_review_note}
                </div>
            )}
        </SectionCard>
    );
};

const InfoItem = ({ label, value }: { label: string; value: React.ReactNode }) => {
    return (
        <div className="rounded-xl border bg-white p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                {label}
            </p>
            <p className="mt-1 font-semibold text-slate-900">{value}</p>
        </div>
    );
};

export default SampleOverviewCard