import SectionCard from "@/pages/admin/job-tickets/components/SectionCard";
import { router, useForm } from "@inertiajs/react";
import { toast } from "sonner";
import { Input } from "../ui/input";
import Field from "../sample/field";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import formatRupiah from "../ui/format-rupiah";
import { useCan } from "@/hooks/use-can";
import FormattedNumberInput from "../ui/formatted-number-input";
import { Pesanan } from "@/pages/admin/job-tickets/types";
import { Info, Plus, Trash2, Undo2 } from "lucide-react";
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { useState } from "react";

const quillModules = {
    toolbar: [
        ['bold', 'italic', 'underline'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['clean']
    ],
};

function QuotationSection({
    job,
    quotations,
    form
}: {
    job: any;
    quotations: any[];
    form: any;
}) {
    const can = useCan();

    // State untuk mengontrol form Undo
    const [undoQuotationId, setUndoQuotationId] = useState<number | null>(null);

    const orders = (job?.orders ?? []) as Array<Pesanan & { harga_jual_per_pcs?: number | null }>;

    const defaultValidUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10);

    //inisiasi state sample qty
    const initialSampleQtys: Record<number, number> = {};
    orders.forEach((order: Pesanan) => {
        initialSampleQtys[order.id] = order.sample_qty || 1;
    });

    const initialSamplePrices: Record<number, number> = {};
    orders.forEach((order: Pesanan) => {
        initialSamplePrices[order.id] = order.sample_price_per_piece || 0;
    });

    const sampleInvoiceAmount = orders.reduce<number>((total, order) => {
        const unitPrice = Number(order.price_per_piece ?? 0);
        const sampleQty = Number(order.sample_qty ?? 1);

        return total + unitPrice * sampleQty;
    }, 0);

    const allPricesSet = orders.every((order) => Number(order.price_per_piece ?? 0) > 0);
    const needsQuotation = orders.some((order) => !order.workflow_status?.quotation_approved);
    const canGenerateQuotation = allPricesSet && needsQuotation && orders.every((order) => order.workflow_status?.price_approved);

    const defaultNotes = [
        'Setelah sample approve, customer melakukan down payment sebesar 50% dari nilai order. Sisa pembayaran dilakukan sebelum pengiriman.',
        'Estimasi delivery 10–14 hari kerja dari DP dan ACC sample.',
        'Harga sudah termasuk bahan, proses produksi, dan packaging. Harga belum termasuk delivery dan pajak.'
    ];

    const quotationForm = useForm({
        valid_until: defaultValidUntil,
        sample_qtys: initialSampleQtys,
        sample_prices: initialSamplePrices,
        notes: defaultNotes,
        tax: 0,
        delivery_cost: 0,
    });

    // Form khusus untuk Undo Approval
    const undoForm = useForm({
        reason: '',
    });

    const handleAddNote = () => {
        quotationForm.setData('notes', [...quotationForm.data.notes, '']);
    }

    const handleRemoveNote = (indexToRemove: number) => {
        const newNotes = quotationForm.data.notes.filter((_, idx) => idx !== indexToRemove);
        quotationForm.setData('notes', newNotes.length ? newNotes : ['']);
    };

    const handleNoteChange = (content: string, index: number) => {
        if (quotationForm.data.notes[index] !== content) {
            const newNotes = [...quotationForm.data.notes];
            newNotes[index] = content;
            quotationForm.setData('notes', newNotes);
        }
    };

    const approveForm = useForm({
        approved_by_name: job.customer?.name || job.customer?.company || '',
        signature: null as File | null,
        sample_invoice_amount: sampleInvoiceAmount,
    });

    const hasSellingPrice = job.orders && job.orders.length > 0 && job.orders.every((order: any) =>
        Number(order.price_per_piece || order.harga_jual_per_pcs) > 0
    );

    const canGenerate = hasSellingPrice && can('quotation.generate');

    const submitGenerateQuotation = (e: React.FormEvent) => {
        e.preventDefault();
        quotationForm.post(`/job-tickets/${job.id}/quotations/generate`, {
            preserveScroll: true,
        });
    };

    const approveQuotation = (quotation: any) => {
        approveForm.patch(`/quotations/${quotation.id}/approve`, {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => {
                approveForm.reset();
            },
        });
    };

    const submitUndoQuotation = (e: React.FormEvent, quotationId: number) => {
        e.preventDefault();
        undoForm.patch(`/quotations/${quotationId}/undo-approve`, {
            preserveScroll: true,
            onSuccess: () => {
                setUndoQuotationId(null);
                undoForm.reset();
            },
            onError: (err) => {
                toast.error(Object.values(err)[0] as string || 'Gagal membatalkan quotation. Pastikan syarat terpenuhi.');
            }
        });
    };

    const cancelUndo = () => {
        setUndoQuotationId(null);
        undoForm.reset();
        undoForm.clearErrors();
    };

    const handleDeleteCustomer = (quotation: any) => {
        toast.warning(`Apakah Anda yakin ingin menghapus surat penawaran ini?`, {
            action: {
                label: 'Hapus',
                onClick: () => {
                    router.delete(`/quotations/${quotation.id}`, {
                        preserveScroll: true,
                        onSuccess: () => {
                            toast.success('Quotation berhasil dihapus');
                        },
                    });
                },
            },
        });
    };

    return (
        <SectionCard title="Surat Penawaran / Quotation">
            {!canGenerate && can('quotation.generate') && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                    Semua pesanan dalam Purchase Order ini harus ditentukan harga jual finalnya terlebih dahulu sebelum membuat surat penawaran.
                </div>
            )}

            {canGenerateQuotation && (
                <form onSubmit={submitGenerateQuotation} className="space-y-4 rounded-2xl border bg-white p-4">
                    {/* ... BAGIAN FORM GENERATE QUOTATION (Tetap sama seperti aslinya) ... */}
                    <div>
                        <p className="font-semibold text-slate-900">
                            Generate Surat Penawaran
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                            Surat penawaran akan merangkum seluruh pesanan dengan memakai harga jual final.
                        </p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <Field label="Valid Until" error={quotationForm.errors.valid_until}>
                            <Input
                                type="date"
                                value={quotationForm.data.valid_until}
                                onChange={(e) =>
                                    quotationForm.setData('valid_until', e.target.value)
                                }
                            />
                        </Field>

                        <Field label="Delivery Cost" error={quotationForm.errors.delivery_cost}>
                            <FormattedNumberInput
                                value={quotationForm.data.delivery_cost}
                                onValueChange={(value) => quotationForm.setData('delivery_cost', value)}
                                placeholder='cth: 35.000'
                            />
                        </Field>
                        
                        <div className="col-span-2">
                            <div className="rounded-lg border border-sky-100 bg-sky-50 p-4 shadow-sm">
                                <div className="flex items-start gap-3">
                                    <Info className="mt-0.5 h-5 w-5 shrink-0 text-sky-600" />
                                    <div>
                                        <p className="text-sm font-semibold text-sky-900">
                                            Panduan Pengisian Sample
                                        </p>
                                        <ul className="mt-2 space-y-2 text-xs text-sky-800">
                                            <li className="flex items-start gap-2">
                                                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-500"></span>
                                                <span>
                                                    <strong>Sample Berbayar:</strong> Isi <em>Sample Qty</em> dan <em>Harga Sample</em>.
                                                </span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-500"></span>
                                                <span>
                                                    <strong>Sample Gratis:</strong> Isi <em>Sample Qty</em>, lalu kosongkan <em>Harga Sample</em> (atau isi 0).
                                                </span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-500"></span>
                                                <span>
                                                    <strong>Tanpa Sample:</strong> Kosongkan <em>Sample Qty</em>.
                                                </span>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="col-span-2 items-start grid gap-6 md:grid-cols-2">
                            {orders.map((order: Pesanan) => {
                                const isApproved = Boolean(order.workflow_status?.quotation_approved);

                                return (
                                    <div key={order.id} className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
                                        <div className="flex items-center justify-between">
                                            <h4 className="font-semibold text-slate-800">
                                                {order.requested_product_name || order.product_name}
                                            </h4>
                                            {isApproved && (
                                                <span className="rounded bg-emerald-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                                                    Approved
                                                </span>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <Field
                                                label="Sample Qty"
                                                error={quotationForm.errors[`sample_qtys.${order.id}` as keyof typeof quotationForm.errors]}
                                            >
                                                <FormattedNumberInput
                                                    value={isApproved ? 0 : (quotationForm.data.sample_qtys[order.id] || 0)}
                                                    onValueChange={(value) => {
                                                        quotationForm.setData('sample_qtys', {
                                                            ...quotationForm.data.sample_qtys,
                                                            [order.id]: Number(value)
                                                        });
                                                    }}
                                                    disabled={isApproved}
                                                    placeholder="cth: 1"
                                                />
                                            </Field>

                                            <Field
                                                label="Harga Sample"
                                                error={quotationForm.errors[`sample_prices.${order.id}` as keyof typeof quotationForm.errors]}
                                            >
                                                <FormattedNumberInput
                                                    value={isApproved ? 0 : (quotationForm.data.sample_prices?.[order.id] || 0)}
                                                    onValueChange={(value) => {
                                                        quotationForm.setData('sample_prices', {
                                                            ...quotationForm.data.sample_prices,
                                                            [order.id]: Number(value)
                                                        });
                                                    }}
                                                    disabled={isApproved || quotationForm.data.sample_qtys[order.id] === 0}
                                                    placeholder="cth: 150000"
                                                />
                                            </Field>
                                        </div>
                                        
                                        {isApproved && (
                                            <p className="text-[11px] leading-tight text-slate-500">
                                                Artikel ini sudah di-approve. Biaya sample otomatis Rp 0 agar tidak tertagih dua kali.
                                            </p>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-slate-700">Syarat & Ketentuan (Notes)</label>
                            <Button type="button" size="sm" variant="outline" onClick={handleAddNote}>
                                <Plus className="mr-2 size-4" /> Tambah Note
                            </Button>
                        </div>

                        {quotationForm.data.notes.map((note, index) => (
                            <div key={index} className="flex gap-2 items-start">
                                <div className="flex-1 bg-white">
                                    <ReactQuill 
                                        theme="snow"
                                        value={note}
                                        onChange={(content, delta, source) => {
                                            if (source === 'user') {
                                                handleNoteChange(content, index);
                                            }
                                        }}
                                        modules={quillModules}
                                        className="bg-white rounded-md"
                                    />
                                </div>
                                
                                <Button 
                                    type="button" 
                                    variant="destructive" 
                                    size="icon"
                                    className="mt-1"
                                    onClick={() => handleRemoveNote(index)}
                                >
                                    <Trash2 className="size-4" />
                                </Button>
                            </div>
                        ))}
                        {quotationForm.errors.notes && <p className="text-sm text-red-500">{quotationForm.errors.notes}</p>}
                    </div>

                    <div className="flex justify-end border-t pt-4">
                        <Button type="submit" disabled={quotationForm.processing || !hasSellingPrice}>
                            Generate Quotation
                        </Button>
                    </div>
                </form>
            )}

            <div className="mt-5 space-y-3">
                <p className="font-semibold text-slate-800">Riwayat Quotation</p>

                {quotations.length === 0 ? (
                    <p className="text-sm text-slate-500">
                        Belum ada surat penawaran.
                    </p>
                ) : (
                    quotations.map((quotation) => {
                        // 1. Fungsi penentuan warna dan teks bahasa Indonesia untuk badge
                        const getStatusBadge = (status: string) => {
                            switch (status) {
                                case 'approved': return { label: 'Disetujui', classes: 'bg-emerald-100 text-emerald-700' };
                                case 'rejected': return { label: 'Ditolak', classes: 'bg-red-100 text-red-700' };
                                case 'expired': return { label: 'Kadaluarsa', classes: 'bg-orange-100 text-orange-700' };
                                case 'sent': return { label: 'Dikirim', classes: 'bg-blue-100 text-blue-700' };
                                case 'draft':
                                default: return { label: 'Draft', classes: 'bg-slate-100 text-slate-700' };
                            }
                        };

                        const badge = getStatusBadge(quotation.status);
                        
                        // Variabel Guard
                        // True jika statusnya approved, rejected, atau expired (bukan draft/sent)
                        const isNotDraftOrSent = !['draft', 'sent'].includes(quotation.status); 
                        // True jika statusnya rejected atau expired
                        const isRejectedOrExpired = ['rejected', 'expired'].includes(quotation.status);

                        return (
                            <div key={quotation.id} className="rounded-2xl border bg-white p-4 shadow-sm">
                                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="font-semibold text-slate-900">
                                                {quotation.quotation_number}
                                            </p>
                                            {/* Render Badge Status */}
                                            <span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${badge.classes}`}>
                                                {badge.label}
                                            </span>
                                        </div>
                                        <p className="mt-1 text-xs text-slate-500">
                                            Valid until: {quotation.valid_until || '-'}
                                        </p>
                                        <p className="mt-2 text-sm font-bold text-slate-900">
                                            {formatRupiah(quotation.grand_total || 0)}
                                        </p>
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                        {/* Guard pada Button Hapus */}
                                        {(!quotation.approved_at && can('quotation.generate')) && (
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                disabled={isNotDraftOrSent} // Disabled jika selain draft & sent
                                                onClick={() => handleDeleteCustomer(quotation)}
                                            >
                                                Hapus
                                            </Button>
                                        )}

                                        <Button
                                            type="button"
                                            variant="secondary"
                                            onClick={() =>
                                                window.open(`/quotations/${quotation.id}/print`, '_blank')
                                            }
                                        >
                                            Lihat Surat Penawaran
                                        </Button>

                                        {/* Guard pada Button Approve */}
                                        {quotation.status !== 'approved' && can('quotation.approve') && (
                                            <Button
                                                type="button"
                                                onClick={() => approveQuotation(quotation)}
                                                disabled={approveForm.processing || isRejectedOrExpired} // Disabled jika expired/rejected
                                            >
                                                Approve & Generate Sample Invoice
                                            </Button>
                                        )}

                                        {/* Tombol Undo (Hanya tampil jika sudah approved) */}
                                        {quotation.status === 'approved' && can('quotation.approve') && (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                                                onClick={() => {
                                                    setUndoQuotationId(quotation.id);
                                                    undoForm.reset();
                                                }}
                                            >
                                                <Undo2 className="mr-2 size-4" />
                                                Batalkan (Undo)
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                {/* Form Tambahan untuk Approval */}
                                {/* Hanya tampilkan form ini jika status bukan approved dan bukan expired/rejected */}
                                {quotation.status !== 'approved' && !isRejectedOrExpired && (
                                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                                        {can('quotation.approve') && (
                                            <Field label="Nama Approver" error={approveForm.errors.approved_by_name}>
                                                <Input
                                                    value={approveForm.data.approved_by_name}
                                                    onChange={(e) =>
                                                        approveForm.setData('approved_by_name', e.target.value)
                                                    }
                                                    placeholder="Nama customer yang menyetujui"
                                                />
                                            </Field>
                                        )}
                                    </div>
                                )}

                                {/* Form Khusus untuk Undo Approval */}
                                {undoQuotationId === quotation.id && (
                                    <form onSubmit={(e) => submitUndoQuotation(e, quotation.id)} className="mt-4 space-y-3 rounded-lg border border-red-200 bg-red-50 p-4">
                                        <p className="text-sm font-semibold text-red-800">
                                            Konfirmasi Pembatalan Persetujuan Quotation
                                        </p>
                                        <Field label="Alasan Pembatalan" error={undoForm.errors.reason}>
                                            <Textarea
                                                value={undoForm.data.reason}
                                                onChange={(e) => undoForm.setData('reason', e.target.value)}
                                                placeholder="Jelaskan alasan mengapa persetujuan dibatalkan (min. 5 karakter)..."
                                                className="bg-white"
                                                required
                                            />
                                        </Field>
                                        <div className="flex justify-end gap-2 pt-2">
                                            <Button type="button" variant="ghost" onClick={cancelUndo}>
                                                Batal
                                            </Button>
                                            <Button type="submit" variant="destructive" disabled={undoForm.processing}>
                                                Konfirmasi Undo
                                            </Button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </SectionCard>
    );
}

export default QuotationSection;