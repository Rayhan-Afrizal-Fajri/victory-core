import SectionCard from "@/pages/admin/job-tickets/components/SectionCard";
import Badge from "./badge";
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

const SampleHistoryCard = ({ samples }: { samples: any[] }) => {
    return (
        <SectionCard title="Riwayat Sample">
            <div className="space-y-3">
                {samples.map((item) => (
                    <div key={item.id} className="rounded-xl border bg-white p-3">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="text-sm font-semibold text-slate-900">
                                    Sample #{item.revision_number ?? 0}
                                </p>
                                <p className="mt-1 text-xs text-slate-500">
                                    Qty {item.qty} pcs • {formatRupiah(item.sample_price)}
                                </p>
                            </div>
                            <Badge>
                                {statusLabel[item.status] || item.status}
                            </Badge>
                        </div>

                        {item.customer_review_note && (
                            <p className="mt-2 rounded-lg bg-amber-50 p-2 text-xs text-amber-800">
                                {item.customer_review_note}
                            </p>
                        )}
                    </div>
                ))}
            </div>
        </SectionCard>
    );
};

export default SampleHistoryCard