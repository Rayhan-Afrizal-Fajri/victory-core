import SectionCard from "@/pages/admin/job-tickets/components/SectionCard";
import formatRupiah from "../ui/format-rupiah";
import { useState } from "react";
import { Button } from "../ui/button";
import { Edit, Trash2 } from "lucide-react";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import Field from "./field";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";

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

const SampleOverviewCard = ({
    sample,
    canEdit = false,
    canDelete = false,
    editForm,
    onUpdate,
    onDelete
} : {
    sample: any;
    canEdit?: boolean;
    canDelete?: boolean;
    editForm?: any;
    onUpdate?: (e: React.FormEvent) => void;
    onDelete?: () => void;
}) => {
    const [editOpen, setEditOpen] = useState(false);

    return (
        <>
            <SectionCard title={`Sample #${sample.revision_number ?? 0}`}>
                <div className="flex flex-col gap-4">
                    <div className="flex items-start justify-between gap-3">
                        <div className="grid flex-1 gap-4 md:grid-cols-3">
                            <InfoItem label="Qty" value={`${sample.qty} pcs`} />
                            <InfoItem label="Harga" value={formatRupiah(sample.sample_price)} />
                            <InfoItem label="Status" value={statusLabel[sample.status] || sample.status} />
                        </div>

                        {(canEdit || canDelete) && (
                            <div className="flex shrink-0 gap-2">
                                {canEdit && (
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setEditOpen(true)}
                                    >
                                        <Edit className="size-4" />
                                        Edit
                                    </Button>
                                )}

                                {canDelete && (
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        className="border-red-200 text-red-700 hover:bg-red-50"
                                        onClick={onDelete}
                                    >
                                        <Trash2 className="size-4" />
                                        Delete
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>

                    {sample.catatan && (
                        <div className="rounded-xl border bg-slate-50 p-4 text-sm text-slate-700">
                            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Catatan internal/sample
                            </p>
                            {sample.catatan}
                        </div>
                    )}

                    {sample.customer_review_note && (
                        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                            <p className="mb-1 text-xs font-semibold uppercase tracking-wide">
                                Catatan customer
                            </p>
                            {sample.customer_review_note}
                        </div>
                    )}
                </div>
            </SectionCard>

            {editForm && onUpdate && (
                <Dialog open={editOpen} onOpenChange={setEditOpen}>
                    <DialogContent className="sm:max-w-xl">
                        <DialogHeader>
                            <DialogTitle>Edit Sample</DialogTitle>
                            <DialogDescription>
                                Edit data sample selama belum masuk proses delivery atau approval.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={onUpdate} className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <Field label="Qty Sample" error={editForm.errors.qty}>
                                    <Input
                                        type="number"
                                        min={1}
                                        value={editForm.data.qty}
                                        onChange={(e) => editForm.setData('qty', Number(e.target.value))}
                                    />
                                </Field>

                                <Field label="Harga Sample" error={editForm.errors.sample_price}>
                                    <Input
                                        type="number"
                                        min={0}
                                        value={editForm.data.sample_price}
                                        onChange={(e) => editForm.setData('sample_price', Number(e.target.value))}
                                    />
                                </Field>
                            </div>

                            <label className="flex items-start gap-3 rounded-xl border p-4 text-sm">
                                <input
                                    type="checkbox"
                                    className="mt-1"
                                    checked={editForm.data.is_chargeable}
                                    onChange={(e) => editForm.setData('is_chargeable', e.target.checked)}
                                />
                                <span>
                                    <span className="block font-medium text-slate-800">
                                        Sample dikenakan biaya / invoice
                                    </span>
                                    <span className="text-xs text-slate-500">
                                        Jika dimatikan, invoice sample akan dibatalkan dan sample dianggap paid.
                                    </span>
                                </span>
                            </label>

                            <Field label="Catatan Sample" error={editForm.errors.catatan}>
                                <Textarea
                                    rows={3}
                                    value={editForm.data.catatan}
                                    onChange={(e) => editForm.setData('catatan', e.target.value)}
                                />
                            </Field>

                            <div className="flex justify-end gap-2 border-t pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setEditOpen(false)}
                                >
                                    Batal
                                </Button>

                                <Button type="submit" disabled={editForm.processing}>
                                    Simpan Perubahan
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            )}
        </>
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

export default SampleOverviewCard;