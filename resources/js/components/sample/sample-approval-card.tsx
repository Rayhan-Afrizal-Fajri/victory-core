import SectionCard from "@/pages/admin/job-tickets/components/SectionCard";
import EmptyState from "./empty-state";
import { CheckCircle, XCircle } from "lucide-react";
import { Button } from "../ui/button";
import Field from "./field";
import { Textarea } from "../ui/textarea";

const SampleApprovalCard = ({
    sample,
    canApprove,
    revisionOpen,
    rejectOpen,
    revisionForm,
    rejectForm,
    setRevisionOpen,
    setRejectOpen,
    onApprove,
    onSubmitRevision,
    onSubmitReject,
}: {
    sample: any;
    canApprove: boolean;
    revisionOpen: boolean;
    rejectOpen: boolean;
    revisionForm: any;
    rejectForm: any;
    setRevisionOpen: (value: boolean) => void;
    setRejectOpen: (value: boolean) => void;
    onApprove: () => void;
    onSubmitRevision: () => void;
    onSubmitReject: () => void;
}) => {
    return (
        <SectionCard title="Approval Sample">
            {!sample && (
                <EmptyState
                    icon={<CheckCircle className="size-5" />}
                    title="Approval belum tersedia"
                    description="Approval terbuka setelah sample diterima customer."
                />
            )}

            {sample && !canApprove && sample.status !== 'approved' && sample.status !== 'revision_needed' && sample.status !== 'rejected' && (
                <div className="rounded-xl border bg-slate-50 p-4 text-sm text-slate-600">
                    Approval akan aktif setelah sample telah diterima customer.
                </div>
            )}

            {sample?.status === 'approved' && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                    <p className="font-semibold">Sample sudah disetujui.</p>
                    <p className="mt-1">Workflow bisa lanjut ke proses berikutnya.</p>
                </div>
            )}

            {sample?.status === 'revision_needed' && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                    <p className="font-semibold">Customer meminta revisi sample.</p>
                    <p className="mt-1">{sample.customer_review_note || 'Tidak ada catatan.'}</p>
                </div>
            )}

            {sample?.status === 'rejected' && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    <p className="font-semibold">Sample ditolak.</p>
                    <p className="mt-1">{sample.customer_review_note || 'Tidak ada catatan.'}</p>
                </div>
            )}

            {canApprove && (
                <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                        <Button
                            type="button"
                            className="bg-emerald-600 text-white hover:bg-emerald-700"
                            onClick={onApprove}
                        >
                            <CheckCircle className="mr-2 size-4" />
                            Approve Sample
                        </Button>

                        <Button
                            type="button"
                            variant="outline"
                            className="border-amber-200 text-amber-700 hover:bg-amber-50"
                            onClick={() => {
                                setRevisionOpen(true);
                                setRejectOpen(false);
                            }}
                        >
                            Request Revision
                        </Button>

                        <Button
                            type="button"
                            variant="outline"
                            className="border-red-200 text-red-700 hover:bg-red-50"
                            onClick={() => {
                                setRejectOpen(true);
                                setRevisionOpen(false);
                            }}
                        >
                            <XCircle className="mr-2 size-4" />
                            Reject
                        </Button>
                    </div>

                    {revisionOpen && (
                        <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
                            <Field label="Catatan Revisi Sample" error={revisionForm.errors.customer_review_note}>
                                <Textarea
                                    rows={3}
                                    value={revisionForm.data.customer_review_note}
                                    onChange={(e) => revisionForm.setData('customer_review_note', e.target.value)}
                                    placeholder="Jelaskan revisi sample yang diminta customer..."
                                />
                            </Field>

                            <div className="flex gap-2">
                                <Button type="button" variant="outline" onClick={() => setRevisionOpen(false)}>
                                    Batal
                                </Button>
                                <Button type="button" disabled={revisionForm.processing} onClick={onSubmitRevision}>
                                    Kirim Revisi
                                </Button>
                            </div>
                        </div>
                    )}

                    {rejectOpen && (
                        <div className="space-y-3 rounded-xl border border-red-200 bg-red-50 p-4">
                            <Field label="Alasan Sample Ditolak" error={rejectForm.errors.customer_review_note}>
                                <Textarea
                                    rows={3}
                                    value={rejectForm.data.customer_review_note}
                                    onChange={(e) => rejectForm.setData('customer_review_note', e.target.value)}
                                    placeholder="Jelaskan alasan sample ditolak..."
                                />
                            </Field>

                            <div className="flex gap-2">
                                <Button type="button" variant="outline" onClick={() => setRejectOpen(false)}>
                                    Batal
                                </Button>
                                <Button
                                    type="button"
                                    className="bg-red-600 text-white hover:bg-red-700"
                                    disabled={rejectForm.processing}
                                    onClick={onSubmitReject}
                                >
                                    Tolak Sample
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </SectionCard>
    );
};

export default SampleApprovalCard;