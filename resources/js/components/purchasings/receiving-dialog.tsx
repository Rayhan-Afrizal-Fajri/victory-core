import React from 'react';

import Field from '@/components/sample/field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

// 1. Tambahkan import fungsi-fungsi utilitas yang dibutuhkan
import { 
    getRemainingQty,
    getRequiredQty,
    getSampleReceivedQty,
    getProductionReceivedQty,
    getProgressPercentage,
    formatMaterialQty,
} from './purchasing-utils';
import FormattedNumberInput from '../ui/formatted-number-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import suppliers from '@/routes/suppliers';

const ReceivingDialog = ({
    open,
    onOpenChange,
    purchasing,
    job, // 2. Tambahkan prop job untuk kalkulasi sample & production
    form,
    onSubmit,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    purchasing: any | null;
    job: any; // Definisi tipe job
    form: any;
    onSubmit: (e: React.FormEvent) => void;
}) => {
    if (!purchasing) return null;

    const remainingQty = getRemainingQty(purchasing);
    
    // 3. Kalkulasi data sample dan production (Sama seperti di Table)
    const workflow = job?.workflow_status;
    const hasSample = Number(job?.sample_qty || 0) > 0;

    const sampleRequiredQty = getRequiredQty(purchasing, job, 'sample');
    const productionRequiredQty = getRequiredQty(purchasing, job, 'production');
    const sampleReceivedQty = getSampleReceivedQty(purchasing, job);
    const productionReceivedQty = getProductionReceivedQty(purchasing, job);
    
    const sampleProgress = getProgressPercentage(sampleReceivedQty, sampleRequiredQty);
    const productionProgress = getProgressPercentage(productionReceivedQty, productionRequiredQty);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>Receive Material</DialogTitle>
                    <DialogDescription>
                        Catat bahan yang diterima untuk kebutuhan sample dan production.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={onSubmit} className="space-y-4">
                    {/* 4. Perombakan Box Informasi Material */}
                    <div className="rounded-xl border bg-slate-50 p-4 space-y-4">
                        <div>
                            <p className="text-xs text-slate-500">Material</p>
                            <div className="flex justify-between items-start mt-1">
                                <p className="font-semibold text-slate-900">
                                    {purchasing.item || purchasing.item_bahan}
                                </p>
                                <div className="text-right">
                                    <p className="text-xs font-medium text-slate-700 bg-white px-2 py-1 rounded-md border shadow-sm">
                                        Total Sisa PO: <span className="text-red-600 font-bold">{remainingQty} {purchasing.unit}</span>
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Progress Bar Kebutuhan */}
                        <div className="space-y-3 pt-3 border-t border-slate-200">
                            {hasSample && sampleRequiredQty > 0 && (
                                <MiniProgressBar 
                                    label="Target Sample" 
                                    progress={sampleProgress} 
                                    text={`${formatMaterialQty(sampleReceivedQty)} / ${formatMaterialQty(sampleRequiredQty)} ${purchasing.unit}`} 
                                />
                            )}
                            {workflow?.sample_materials_ready == 1 && productionRequiredQty > 0 && (
                                <MiniProgressBar 
                                    label="Target Produksi" 
                                    progress={productionProgress} 
                                    text={`${formatMaterialQty(productionReceivedQty)} / ${formatMaterialQty(productionRequiredQty)} ${purchasing.unit}`} 
                                />
                            )}
                            {sampleRequiredQty <= 0 && productionRequiredQty <= 0 && (
                                <span className="text-xs text-slate-400 italic">Tidak ada target spesifik</span>
                            )}
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <Field label="Qty Diterima" error={form.errors.received_qty}>
                            <FormattedNumberInput
                                min={0}
                                value={form.data.received_qty}
                                onValueChange={(value) => form.setData('received_qty', value)}
                                placeholder='cth: 35.000'
                            />
                        </Field>

                        <Field label="Kondisi Barang" error={form.errors.item_condition}>
                            <Select
                                required={true}
                                value={form.data.item_condition} // Langsung gunakan state dari form
                                onValueChange={(value) =>
                                    form.setData('item_condition', value)
                                }
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Pilih kondisi barang" />
                                </SelectTrigger>

                                <SelectContent>
                                    <SelectItem value="good">Baik</SelectItem>
                                    <SelectItem value="damaged">Rusak</SelectItem>
                                    <SelectItem value="expired">Kedaluwarsa</SelectItem>
                                </SelectContent>
                            </Select>
                        </Field>

                        <Field label="Tanggal Terima" error={form.errors.received_at}>
                            <Input
                                type="date"
                                value={form.data.received_at}
                                onChange={(e) => form.setData('received_at', e.target.value)}
                            />
                        </Field>
                    </div>

                    <Field label="Catatan" error={form.errors.notes}>
                        <Textarea
                            rows={3}
                            value={form.data.notes}
                            onChange={(e) => form.setData('notes', e.target.value)}
                            placeholder="Catatan penerimaan material..."
                        />
                    </Field>

                    <div className="flex justify-end gap-2 border-t pt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Batal
                        </Button>

                        <Button type="submit" disabled={form.processing}>
                            Simpan Receiving
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

// 5. Salin komponen MiniProgressBar ke file ini agar bisa digunakan
function MiniProgressBar({ label, progress, text }: { label: string; progress: number; text: string }) {
    const isDone = progress >= 100;
    return (
        <div className="w-full">
            <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-slate-700">{label}</span>
                <span className="text-slate-600 font-semibold">{text} <span className="font-normal text-slate-400 ml-1">({Math.round(progress)}%)</span></span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                <div 
                    className={`h-full rounded-full transition-all ${isDone ? 'bg-emerald-500' : 'bg-amber-500'}`} 
                    style={{ width: `${progress}%` }} 
                />
            </div>
        </div>
    );
}

export default ReceivingDialog;