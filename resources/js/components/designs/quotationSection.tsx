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
import { Plus, Trash2 } from "lucide-react";
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

const quillModules = {
        toolbar: [
            ['bold', 'italic', 'underline'],
            [{list: 'ordered'}, {list: 'bullet'}],
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

    const orders = (job?.orders ?? []) as Array<Pesanan & { harga_jual_per_pcs?: number | null }>;

    const defaultValidUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10);

    //inisiasi state sample qty
    const initialSampleQtys: Record<number, number> = {};
    orders.forEach((order: Pesanan) => {
        initialSampleQtys[order.id] = order.sample_qty || 1;
    });

    const sampleInvoiceAmount = orders.reduce<number>((total, order) => {
        const unitPrice = Number(order.price_per_piece ?? 0);
        const sampleQty = Number(order.sample_qty ?? 1);

        return total + unitPrice * sampleQty;
    }, 0);

    const defaultNotes = [
        'Setelah sample approve, customer melakukan down payment sebesar 50% dari nilai order. Sisa pembayaran dilakukan sebelum pengiriman.',
        'Estimasi delivery 10–14 hari kerja dari DP dan ACC sample.',
        'Harga sudah termasuk bahan, proses produksi, dan packaging. Harga belum termasuk delivery dan pajak.'
    ];

    const quotationForm = useForm({
        valid_until: defaultValidUntil,
        sample_qtys: initialSampleQtys,
        notes: defaultNotes,

        // payment_terms:
        //     'Setelah sample approve, customer melakukan down payment sebesar 50% dari nilai order. Sisa pembayaran dilakukan sebelum pengiriman.',
        // delivery_terms:
        //     'Estimasi delivery 10–14 hari kerja dari DP dan ACC sample.',
        // notes:
        //     'Harga sudah termasuk bahan, proses produksi, dan packing. Harga belum termasuk delivery dan pajak.',
        tax: 0,
        delivery_cost: 0,
    });

    const handleAddNote = () => {
        quotationForm.setData('notes', [...quotationForm.data.notes, '']);
    }

    const handleRemoveNote = (indexToRemove: number) => {
        const newNotes = quotationForm.data.notes.filter((_,idx) => idx !== indexToRemove);
        quotationForm.setData('notes', newNotes.length ? newNotes : ['']);
    };

    const handleNoteChange = (content: string, index: number) => {
        // Hanya update jika isinya memang berbeda
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
    
    // Cek apakah setiap pesanan di dalam job ticket sudah memiliki harga jual final
    const hasSellingPrice = job.orders && job.orders.length > 0 && job.orders.every((order: any) =>
        Number(order.price_per_piece || order.harga_jual_per_pcs) > 0
    );

    const canGenerate = hasSellingPrice && can('quotation.generate');

    const submitGenerateQuotation = (e: React.FormEvent) => {
        e.preventDefault();
        // Route disesuaikan ke level Job Ticket
        quotationForm.post(`/job-tickets/${job.id}/quotations/generate`, {
            preserveScroll: true,
            onSuccess: () => toast.success('Surat penawaran berhasil dibuat.'),
        });
    };

    const approveQuotation = (quotation: any) => {
        approveForm.patch(`/quotations/${quotation.id}/approve`, {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => {
                toast.success('Quotation approved dan invoice sample dibuat.');
                approveForm.reset();
            },
        });
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
                    Semua pesanan dalam Job Ticket ini harus ditentukan harga jual finalnya terlebih dahulu sebelum membuat surat penawaran.
                </div>
            )}

            {canGenerate && quotations.length === 0 && (
                <form onSubmit={submitGenerateQuotation} className="space-y-4 rounded-2xl border bg-white p-4">
                    <div>
                        <p className="font-semibold text-slate-900">
                            Generate Surat Penawaran
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                            Surat penawaran akan merangkum seluruh pesanan dengan memakai harga jual final owner.
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
                        {/* Render Grid untuk Multi-Orders */}
                        <div className="grid gap-4 md:grid-cols-3 col-span-2 items-end">

                            {/* 2. Map orders di sini */}
                            {orders.map((order: Pesanan) => (
                                <Field 
                                    key={order.id} 
                                    label={`Sample Qty - ${order.requested_product_name || order.product_name}`} 
                                    // Error statenya akan berbentuk string dot notation, misal: sample_qtys.1
                                    error={quotationForm.errors[`sample_qtys.${order.id}` as keyof typeof quotationForm.errors]}
                                >
                                    <FormattedNumberInput
                                        value={quotationForm.data.sample_qtys[order.id] || 0}
                                        onValueChange={(value) => {
                                            // 3. Update spesifik properti di dalam object sample_qtys
                                            quotationForm.setData('sample_qtys', {
                                                ...quotationForm.data.sample_qtys,
                                                [order.id]: Number(value)
                                            });
                                        }}
                                        placeholder='cth: 1'
                                    />
                                </Field>
                            ))}
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
                                {/* Rich Text Editor */}
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
                                
                                {/* Tombol Hapus */}
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
                    quotations.map((quotation) => (
                        <div key={quotation.id} className="rounded-2xl border bg-white p-4">
                            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                <div>
                                    <p className="font-semibold text-slate-900">
                                        {quotation.quotation_number}
                                    </p>
                                    <p className="mt-1 text-xs text-slate-500">
                                        Valid until: {quotation.valid_until || '-'}
                                    </p>
                                    <p className="mt-2 text-sm font-bold text-slate-900">
                                        {formatRupiah(quotation.grand_total || 0)}
                                    </p>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    {!quotation.approved_at && can('quotation.generate') && (
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            disabled={quotation.status === 'approved'}
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

                                    {quotation.status !== 'approved' && can('quotation.approve') && (
                                        <Button
                                            type="button"
                                            onClick={() => approveQuotation(quotation)}
                                            disabled={approveForm.processing}
                                        >
                                            Approve & Generate Sample Invoice
                                        </Button>
                                    )}
                                </div>
                            </div>

                            {quotation.status !== 'approved' && (
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

                                    {can('quotation.generate') && (
                                        <Field label="Nominal Invoice Sample Total" error={approveForm.errors.sample_invoice_amount}>
                                            <FormattedNumberInput
                                                value={approveForm.data.sample_invoice_amount}
                                                onValueChange={(value) => approveForm.setData('sample_invoice_amount', value)}
                                                placeholder='cth: 35.000'
                                            />
                                            <p className="text-xs text-slate-500">
                                                Kosongkan/0 jika sample gratis.
                                            </p>
                                        </Field>
                                    )}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </SectionCard>
    );
}

export default QuotationSection;