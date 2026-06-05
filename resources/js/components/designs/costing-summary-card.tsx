import { formatCurrency } from "@/helpers/format";
import { useCan } from "@/hooks/use-can";
import SectionCard from "@/pages/admin/job-tickets/components/SectionCard";
import FormattedNumberInput from "../ui/formatted-number-input";
import { Button } from "../ui/button";

function CostingSummaryCard({
    orderQty,
    summary,
    form,
    onSubmit,
    job
}: {
    orderQty: number;
    summary: any;
    form: any;
    onSubmit: (e: React.FormEvent) => void;
    job?: any
}) {
    const can = useCan();
    const ownerPrice = Number(form.data.harga_jual_per_pcs || 0);
    const profitPerPcs = Math.max(ownerPrice - summary.hppPerPcs, 0);
    const totalSelling = ownerPrice * orderQty;
    const totalProfit = profitPerPcs * orderQty;
    const margin =
        ownerPrice > 0
            ? ((ownerPrice - summary.hppPerPcs) / ownerPrice) * 100
            : 0;

    return (
        <SectionCard title="Costing Summary & Rekomendasi Harga Jual per pcs">
            <div className="grid gap-4 md:grid-cols-4">
                <SummaryBox
                    label="Bahan / pcs"
                    value={formatCurrency(summary.materialCostPerPcs)}
                />
                <SummaryBox
                    label="Manufaktur / pcs"
                    value={formatCurrency(summary.manufacturingCostPerPcs)}
                />
                <SummaryBox
                    label="Modal / HPP per pcs"
                    value={formatCurrency(summary.hppPerPcs)}
                />
                <SummaryBox
                    label="Total Modal"
                    value={formatCurrency(summary.totalHpp)}
                />
            </div>

            <div className="mt-5 rounded-2xl border bg-slate-50 p-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Rekomendasi Harga Jual
                </p>

                <div className="grid gap-3 md:grid-cols-4">
                    {[25, 30, 35, 40].map((margin) => (
                        <button
                            key={margin}
                            type="button"
                            disabled={!can('design.set_selling_price')}
                            onClick={() =>
                                form.setData(
                                    'harga_jual_per_pcs',
                                    Math.ceil(summary.recommendations[margin] || 0)
                                )
                            }
                            className="cursor-pointer rounded-xl border bg-white p-4 text-left transition hover:border-slate-400 hover:bg-slate-50"
                        >
                            <p className="text-xs text-slate-500">
                                Margin {margin}%
                            </p>
                            <p className="mt-1 text-lg font-bold text-slate-900">
                                {formatCurrency(summary.recommendations[margin] || 0)}
                            </p>
                        </button>
                    ))}
                </div>
            </div>

            <form onSubmit={onSubmit} className="mt-5 space-y-4 rounded-2xl border bg-white p-4">
                <div>
                    <p className="font-semibold text-slate-900">
                        Harga Jual Final Owner
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                        Harga ini akan digunakan untuk generate surat penawaran.
                    </p>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">
                            Harga Jual / pcs
                        </label>
                        <FormattedNumberInput
                            value={form.data.harga_jual_per_pcs}
                            disabled={!can('design.set_selling_price')}
                            onValueChange={(value) => form.setData('harga_jual_per_pcs', value)}
                            placeholder='cth: 35.000'
                        />
                        {form.errors.harga_jual_per_pcs && (
                            <p className="text-xs text-red-500">
                                {form.errors.harga_jual_per_pcs}
                            </p>
                        )}
                    </div>

                    <SummaryBox
                        label="Estimasi Margin"
                        value={`${Math.max(margin, 0).toFixed(1)}%`}
                        danger={margin < 25}
                    />

                    <SummaryBox
                        label="Profit / pcs"
                        value={formatCurrency(profitPerPcs)}
                    />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <SummaryBox
                        label="Total Penawaran"
                        value={formatCurrency(totalSelling)}
                    />
                    <SummaryBox
                        label="Estimasi Total Profit"
                        value={formatCurrency(totalProfit)}
                    />
                </div>

                <div className="flex justify-end border-t pt-4">
                    <Button type="submit" disabled={form.processing || !can('design.set_selling_price') || job?.workflow_status?.quotation_created}>
                        Simpan Harga Jual Final
                    </Button>
                </div>
            </form>
        </SectionCard>
    );
}

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
        <div className="rounded-xl border bg-white p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                {label}
            </p>
            <p
                className={`mt-1 text-lg font-bold ${
                    danger ? 'text-red-500' : 'text-slate-900'
                }`}
            >
                {value}
            </p>
        </div>
    );
}

export default CostingSummaryCard;