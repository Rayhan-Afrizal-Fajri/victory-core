import SectionCard from '@/pages/admin/job-tickets/components/SectionCard';
import formatRupiah from '@/components/ui/format-rupiah';
import {
    getReceivedQty,
    getRemainingQty,
    getPurchasingTotal,
    getRequiredQty,
    getSampleReceivedQty,
    getProductionReceivedQty,
    getProgressPercentage,
} from './purchasing-utils';
import { JobTicket } from '@/pages/admin/job-tickets/types';

const PurchasingSummaryCard = ({ purchasings, job }: { purchasings: any[]; job: any }) => {
    const totalItems = purchasings.length;
    const workflow = job.workflow_status;

    const totalCost = purchasings.reduce((total, item) => {
        return total + getPurchasingTotal(item);
    }, 0);

    const receivedItems = purchasings.filter((item) => {
        return item.is_received || item.status === 'received';
    }).length;

    const totalQty = purchasings.reduce((total, item) => {
        return total + Number(item.purchase_qty || item.ordered_qty || item.qty_bahan || 0);
    }, 0);

    const sampleQtyOrder = Number(job.sample_qty || 0);
    const productionQtyOrder = Number(job.quantity || job.q || 0);

    const totalSampleRequiredQty = purchasings.reduce((total, item) => {
        return total + getRequiredQty(item, job, 'sample');
    }, 0);

    const totalProductionRequiredQty = purchasings.reduce((total, item) => {
        return total + getRequiredQty(item, job, 'production');
    }, 0);

    const totalSampleReceivedQty = purchasings.reduce((total, item) => {
        return total + getSampleReceivedQty(item, job);
    }, 0);

    const totalProductionReceivedQty = purchasings.reduce((total, item) => {
        return total + getProductionReceivedQty(item, job);
    }, 0);

    const sampleProgress = Math.round(
        getProgressPercentage(totalSampleReceivedQty, totalSampleRequiredQty)
    );

    const productionProgress = Math.round(
        getProgressPercentage(totalProductionReceivedQty, totalProductionRequiredQty)
    );

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

            <div className="mt-5 grid gap-4 md:grid-cols-2">
                {/* Muncul jika sample BELUM ready, ATAU jika production SUDAH ready (semua selesai) */}
                {(workflow.sample_materials_ready == 0 || workflow.production_materials_ready == 1) && (
                    <ReceivingProgressBox
                        title="Progress Material Sample"
                        description={
                            workflow?.sample_materials_ready
                                ? 'Material untuk sample sudah cukup.'
                                : 'Material untuk sample belum cukup.'
                        }
                        received={totalSampleReceivedQty}
                        required={totalSampleRequiredQty}
                        progress={sampleProgress}
                        ready={Boolean(workflow?.sample_materials_ready)}
                    />
                )}

                {/* Muncul pokoknya asal sample SUDAH ready */}
                {workflow.sample_materials_ready == 1 && (
                    <ReceivingProgressBox
                        title="Progress Material Production"
                        description={
                            workflow?.production_materials_ready
                                ? 'Material untuk produksi sudah cukup.'
                                : 'Material untuk produksi belum cukup.'
                        }
                        received={totalProductionReceivedQty}
                        required={totalProductionRequiredQty}
                        progress={productionProgress}
                        ready={Boolean(workflow?.production_materials_ready)}
                    />
                )}
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

function ReceivingProgressBox({
    title,
    description,
    received,
    required,
    progress,
    ready,
}: {
    title: string;
    description: string;
    received: number;
    required: number;
    progress: number;
    ready: boolean;
}) {
    return (
        <div
            className={`rounded-2xl border p-4 ${
                ready
                    ? 'border-emerald-200 bg-emerald-50'
                    : 'border-amber-200 bg-amber-50'
            }`}
        >
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-sm font-semibold text-slate-900">
                        {title}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                        {description}
                    </p>
                </div>

                <span
                    className={`rounded-full px-2 py-1 text-xs font-semibold ${
                        ready
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-amber-100 text-amber-700'
                    }`}
                >
                    {progress}%
                </span>
            </div>

            <div className="mt-4">
                <div className="flex justify-between text-xs text-slate-500">
                    <span>
                        Received {formatQty(received)}
                    </span>
                    <span>
                        Required {formatQty(required)}
                    </span>
                </div>

                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/80">
                    <div
                        className={`h-full rounded-full transition-all ${
                            ready ? 'bg-emerald-500' : 'bg-amber-500'
                        }`}
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>
        </div>
    );
}

function formatQty(value: number) {
    return Number(value || 0).toLocaleString('id-ID', {
        maximumFractionDigits: 2,
    });
}

export default PurchasingSummaryCard;