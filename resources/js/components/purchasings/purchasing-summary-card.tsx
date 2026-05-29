import SectionCard from '@/pages/admin/job-tickets/components/SectionCard';
import formatRupiah from '@/components/ui/format-rupiah';
import {
    getReceivedQty,
    getRemainingQty,
    getPurchasingTotal,
} from './purchasing-utils';

const PurchasingSummaryCard = ({ purchasings }: { purchasings: any[] }) => {
    const totalItems = purchasings.length;

    const totalCost = purchasings.reduce((total, item) => {
        return total + getPurchasingTotal(item);
    }, 0);

    const receivedItems = purchasings.filter((item) => {
        return item.is_received || item.status === 'received';
    }).length;

    const totalQty = purchasings.reduce((total, item) => {
        return total + Number(item.qty_bahan || 0);
    }, 0);

    const totalReceivedQty = purchasings.reduce((total, item) => {
        return total + getReceivedQty(item);
    }, 0);

    const totalRemainingQty = purchasings.reduce((total, item) => {
        return total + getRemainingQty(item);
    }, 0);

    const progress = totalItems > 0 ? Math.round((receivedItems / totalItems) * 100) : 0;

    return (
        <SectionCard title="Ringkasan Purchasing">
            <div className="grid gap-4 md:grid-cols-4">
                <SummaryBox label="Total Item" value={`${totalItems} item`} />
                <SummaryBox label="Total Estimasi" value={formatRupiah(totalCost)} />
                <SummaryBox label="Material Received" value={`${receivedItems}/${totalItems}`} />
                <SummaryBox label="Sisa Qty" value={totalRemainingQty} danger={totalRemainingQty > 0} />
            </div>

            <div className="mt-5">
                <div className="flex justify-between text-xs">
                    <span className="text-slate-500">
                        Progress Receiving Qty: {totalReceivedQty}/{totalQty}
                    </span>
                    <span className="font-medium text-slate-700">{progress}%</span>
                </div>

                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                        className="h-full rounded-full bg-green-500 transition-all"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>
        </SectionCard>
    );
};

function SummaryBox({
    label,
    value,
    danger = false,
}: {
    label: string;
    value: React.ReactNode;
    danger?: boolean;
}) {
    return (
        <div className="rounded-2xl border bg-white p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                {label}
            </p>
            <p className={`mt-1 text-lg font-bold ${danger ? 'text-red-500' : 'text-slate-900'}`}>
                {value}
            </p>
        </div>
    );
}

export default PurchasingSummaryCard;