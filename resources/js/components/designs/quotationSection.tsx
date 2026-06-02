import SectionCard from "@/pages/admin/job-tickets/components/SectionCard";
import { router, useForm } from "@inertiajs/react";
import { toast } from "sonner";
import { Input } from "../ui/input";
import Field from "../sample/field";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import formatRupiah from "../ui/format-rupiah";
import { useCan } from "@/hooks/use-can";

function QuotationSection({
    job,
    quotations,
}: {
    job: any;
    quotations: any[];
}) {
    const can = useCan();

    const quotationForm = useForm({
        valid_until: '',
        payment_terms:
            'Setelah sample approve, customer melakukan down payment sebesar 50% dari nilai order. Sisa pembayaran dilakukan sebelum pengiriman.',
        delivery_terms:
            'Estimasi delivery 10–14 hari kerja dari DP dan ACC sample.',
        notes:
            'Harga sudah termasuk bahan, proses produksi, dan packing. Harga belum termasuk delivery dan pajak.',
        tax: 0,
        delivery_cost: 0,
        fabric: '',
        print_method: '',
    });

    const approveForm = useForm({
        approved_by_name: job.customer?.name || job.customer?.company || '',
        signature: null as File | null,
        sample_invoice_amount: 0,
    });
    // const latestQuotation = quotations[0] || null;
    const canGenerate = Number(job.price_per_piece || 0) > 0 && can('quotation.generate');

    const submitGenerateQuotation = (e: React.FormEvent) => {
        e.preventDefault();

        quotationForm.post(`/pesanan/${job.id}/quotations/generate`, {
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
        //triger warning
        toast.warning(`Apakah Anda yakin ingin menghapus surat penawaran ini?`, {
        //   description: 'Data yang dihapus tidak dapat dikembalikan.',
          //main action
          action: {
            label: 'Hapus',
            onClick: () => {
              //excecute
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
                    Simpan harga jual final terlebih dahulu sebelum membuat surat penawaran.
                </div>
            )}

            {canGenerate && quotations.length === 0 && (
                <form onSubmit={submitGenerateQuotation} className="space-y-4 rounded-2xl border bg-white p-4">
                    <div>
                        <p className="font-semibold text-slate-900">
                            Generate Surat Penawaran
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                            Surat penawaran akan memakai harga jual final owner.
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
                            <Input
                                type="number"
                                min={0}
                                step={1000}
                                value={quotationForm.data.delivery_cost}
                                onChange={(e) =>
                                    quotationForm.setData('delivery_cost', Number(e.target.value))
                                }
                            />
                        </Field>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <Field label="Fabric" error={quotationForm.errors.fabric}>
                            <Input
                                value={quotationForm.data.fabric}
                                onChange={(e) =>
                                    quotationForm.setData('fabric', e.target.value)
                                }
                                placeholder="Contoh: Combed Premium 20s"
                            />
                        </Field>

                        <Field label="Print Method" error={quotationForm.errors.print_method}>
                            <Input
                                value={quotationForm.data.print_method}
                                onChange={(e) =>
                                    quotationForm.setData('print_method', e.target.value)
                                }
                                placeholder="Contoh: DTF / Plastisol / Bordir"
                            />
                        </Field>
                    </div>

                    <Field label="Payment Terms" error={quotationForm.errors.payment_terms}>
                        <Textarea
                            rows={3}
                            value={quotationForm.data.payment_terms}
                            onChange={(e) =>
                                quotationForm.setData('payment_terms', e.target.value)
                            }
                        />
                    </Field>

                    <Field label="Delivery Terms" error={quotationForm.errors.delivery_terms}>
                        <Textarea
                            rows={2}
                            value={quotationForm.data.delivery_terms}
                            onChange={(e) =>
                                quotationForm.setData('delivery_terms', e.target.value)
                            }
                        />
                    </Field>

                    <Field label="Notes" error={quotationForm.errors.notes}>
                        <Textarea
                            rows={3}
                            value={quotationForm.data.notes}
                            onChange={(e) =>
                                quotationForm.setData('notes', e.target.value)
                            }
                        />
                    </Field>

                    <div className="flex justify-end border-t pt-4">
                        <Button type="submit" disabled={quotationForm.processing}>
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
                                            onClick={() =>
                                                handleDeleteCustomer(quotation)
                                            }
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
                                        <Field label="Nominal Invoice Sample" error={approveForm.errors.sample_invoice_amount}>
                                            <Input
                                                type="number"
                                                min={0}
                                                step={1000}
                                                value={approveForm.data.sample_invoice_amount}
                                                onChange={(e) =>
                                                    approveForm.setData(
                                                        'sample_invoice_amount',
                                                        Number(e.target.value)
                                                    )
                                                }
                                                placeholder="Kosongkan/0 untuk default 3 pcs"
                                            />
                                            <p className="text-xs text-slate-500">
                                                Kosongkan/0 untuk default 3 pcs x harga jual.
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