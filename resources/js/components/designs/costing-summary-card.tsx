import React, { useEffect } from "react";
import { formatCurrency } from "@/helpers/format";
import { useCan } from "@/hooks/use-can";
import SectionCard from "@/pages/admin/job-tickets/components/SectionCard";
import FormattedNumberInput from "../ui/formatted-number-input";
import { Button } from "../ui/button";
import { Pesanan } from "@/pages/admin/job-tickets/types";

function CostingSummaryCard({
    form,
    onSubmit,
    activeOrder
}: {
    form: any;
    onSubmit: (e: React.FormEvent) => void;
    activeOrder: Pesanan;
}) {
    const can = useCan();
    
    // 1. Ambil Quantity Order
    const orderQty = activeOrder?.quantity || 0;

    // 2. Kalkulasi Costing secara dinamis dari spesifikasi yang sudah diinput
    const materialCostPerPcs = activeOrder?.material_specs?.reduce(
        (sum, spec) => sum + (Number(spec.cost_per_pcs || spec.cost_per_piece) || 0), 0
    ) || 0;

    const manufacturingCostPerPcs = activeOrder?.manufacturing_specs?.reduce(
        (sum, spec) => sum + (Number(spec.cost_per_pcs) || 0), 0
    ) || 0;

    const hppPerPcs = materialCostPerPcs + manufacturingCostPerPcs;
    const totalHpp = hppPerPcs * orderQty;

    // 3. Kalkulasi Rekomendasi Harga (Rumus Margin: Harga = HPP / (1 - Margin%))
    const recommendations = {
        25: hppPerPcs / (1 - 0.25),
        30: hppPerPcs / (1 - 0.30),
        35: hppPerPcs / (1 - 0.35),
        40: hppPerPcs / (1 - 0.40),
    };

    // 4. Kalkulasi Profit aktual berdasarkan input user
    const ownerPrice = Number(form.data.harga_jual_per_pcs || 0);
    const profitPerPcs = Math.max(ownerPrice - hppPerPcs, 0);
    const totalSelling = ownerPrice * orderQty;
    const totalProfit = profitPerPcs * orderQty;
    const margin =
        ownerPrice > 0
            ? ((ownerPrice - hppPerPcs) / ownerPrice) * 100
            : 0;

    // 5. Sinkronisasi estimasi HPP ke Form untuk dikirim ke backend
    useEffect(() => {
        if (form.data.estimasi_hpp_per_pcs !== hppPerPcs) {
            form.setData('estimasi_hpp_per_pcs', hppPerPcs);
        }
    }, [hppPerPcs]);

    return (
        <SectionCard title="Costing Summary & Rekomendasi Harga Jual per pcs">
            <div className="grid gap-4 md:grid-cols-4">
                <SummaryBox
                    label="Bahan / pcs"
                    value={formatCurrency(materialCostPerPcs)}
                />
                <SummaryBox
                    label="Manufaktur / pcs"
                    value={formatCurrency(manufacturingCostPerPcs)}
                />
                <SummaryBox
                    label="Modal / HPP per pcs"
                    value={formatCurrency(hppPerPcs)}
                />
                <SummaryBox
                    label="Total Modal"
                    value={formatCurrency(totalHpp)}
                />
            </div>

            <div className="mt-5 rounded-2xl border bg-slate-50 p-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Rekomendasi Harga Jual
                </p>

                <div className="grid gap-3 md:grid-cols-4">
                    {[25, 30, 35, 40].map((marginValue) => (
                        <button
                            key={marginValue}
                            type="button"
                            disabled={form.processing || !can('costings.input_price') || activeOrder?.workflow_status?.quotation_created}
                            onClick={() =>
                                form.setData(
                                    'harga_jual_per_pcs',
                                    Math.ceil(recommendations[marginValue as keyof typeof recommendations] || 0)
                                )
                            }
                            className={`rounded-xl border p-4 text-left transition hover:border-slate-400 hover:bg-slate-50 ${form.processing || !can('costings.input_price') || activeOrder?.workflow_status?.quotation_created ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <p className="text-xs text-slate-500">
                                Margin {marginValue}%
                            </p>
                            <p className="mt-1 text-lg font-bold text-slate-900">
                                {formatCurrency(recommendations[marginValue as keyof typeof recommendations] || 0)}
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
                            disabled={form.processing || !can('costings.input_price') || activeOrder?.workflow_status?.quotation_created}
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
                        danger={margin < 25 && ownerPrice > 0}
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
                    <Button 
                        type="submit" 
                        disabled={form.processing || !can('costings.input_price') || activeOrder?.workflow_status?.quotation_created || form.data.harga_jual_per_pcs === 0}
                    >
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