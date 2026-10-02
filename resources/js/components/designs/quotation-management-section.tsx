import { useState } from 'react';
import { router, useForm } from '@inertiajs/react';
import { Edit, FilePlus2, Link2, Printer, Trash2, Undo2 } from 'lucide-react';
import { toast } from 'sonner';

import { DataTable } from '@/components/data-table';
import type { DataTableColumn } from '@/components/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import SectionCard from '@/pages/admin/job-tickets/components/SectionCard';
import QuotationDraftDialog from '@/components/quotations/quotation-draft-dialog';
import { useCan } from '@/hooks/use-can';
import formatRupiah from '@/components/ui/format-rupiah';
import { Label } from '../ui/label';

type Props = {
    job: any;
    quotations: any[];
};

const statusClass: Record<string, string> = {
    draft: 'bg-amber-100 text-amber-800',
    sent: 'bg-blue-100 text-blue-800',
    approved: 'bg-emerald-100 text-emerald-800',
    rejected: 'bg-red-100 text-red-800',
    expired: 'bg-slate-200 text-slate-700',
};

function QuotationManagementSection({ job, quotations }: Props) {
    const can = useCan();
    const [createOpen, setCreateOpen] = useState(false);
    const [editingQuotation, setEditingQuotation] = useState<any | null>(null);
    const [attachOpen, setAttachOpen] = useState(false);
    const [selectedDraft, setSelectedDraft] = useState<any | null>(null);
    const attachForm = useForm({ items: [] as Array<{ id: number; pesanan_id: number | null }> });
    const companyProfileId = job.company_profile_id || job.company_profile?.id;
    const companyProfiles = job.available_company_profiles?.length
        ? job.available_company_profiles
        : companyProfileId ? [{
            id: companyProfileId,
            name: job.company_profile.company_name,
            type: job.company_profile.company_type,
            tax_percentage: job.company_profile.tax_percentage,
        }] : [];

    const openAttachDraft = (draft: any) => {
        const mappings = (draft.items || []).map((item: any) => {
            const matchingOrders = (job.orders || []).filter((order: any) =>
                String(order.requested_product_name || order.product_name || '').trim().toLowerCase()
                === String(item.item_name || '').trim().toLowerCase()
            );

            return {
                id: item.id,
                pesanan_id: item.pesanan_id || (matchingOrders.length === 1 ? matchingOrders[0].id : null),
            };
        });

        setSelectedDraft(draft);
        attachForm.setData('items', mappings);
        setCreateOpen(false);
    };

    const closeAttach = () => {
        setAttachOpen(false);
        setSelectedDraft(null);
        attachForm.reset();
    };

    const submitAttach = (event: React.FormEvent) => {
        event.preventDefault();
        if (!selectedDraft) return;
        if (attachForm.data.items.some((item) => !item.pesanan_id)) {
            toast.error('Pilih pesanan untuk setiap item quotation terlebih dahulu.');
            return;
        }

        attachForm.post(`/purchase-orders/${job.id}/quotations/${selectedDraft.id}/attach`, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Quotation draft berhasil dihubungkan ke PO.');
                setAttachOpen(false);
                setSelectedDraft(null);
                attachForm.reset();
            },
            onError: (errors) => toast.error(Object.values(errors)[0] as string || 'Gagal menghubungkan draft ke PO.'),
        });
    };

    const deleteQuotation = (quotation: any) => {
        if (!window.confirm(`Hapus quotation ${quotation.quotation_number}?`)) return;
        router.delete(`/quotations/${quotation.id}`, {
            preserveScroll: true,
            onSuccess: () => toast.success('Quotation berhasil dihapus.'),
        });
    };

    const approveQuotation = (quotation: any) => {
        router.patch(`/quotations/${quotation.id}/approve`, {
            approved_by_name: job.customer?.name || job.customer?.company || '',
        }, {
            preserveScroll: true,
            onSuccess: () => toast.success('Quotation disetujui.'),
        });
    };

    const undoApproval = (quotation: any) => {
        const reason = window.prompt('Alasan membatalkan approval quotation (minimal 5 karakter):');
        if (!reason || reason.trim().length < 5) return;

        router.patch(`/quotations/${quotation.id}/undo-approve`, { reason }, {
            preserveScroll: true,
            onSuccess: () => toast.success('Approval quotation dibatalkan.'),
            onError: (errors) => toast.error(Object.values(errors)[0] as string || 'Gagal membatalkan approval.'),
        });
    };

    const columns: DataTableColumn<any>[] = [
        {
            header: 'Nomor Quotation',
            accessor: 'quotation_number',
            cell: (row) => <span className="font-medium text-slate-900">{row.quotation_number}</span>,
        },
        {
            header: 'Tanggal',
            accessor: 'created_at',
            cell: (row) => row.created_at ? String(row.created_at).slice(0, 10) : '-',
        },
        {
            header: 'Item',
            accessor: 'items',
            sortable: false,
            cell: (row) => (
                <div className="max-w-56">
                    <p className="truncate">{row.items?.[0]?.item_name || '-'}</p>
                    {row.items?.length > 1 && <p className="text-xs text-slate-500">+{row.items.length - 1} item lainnya</p>}
                </div>
            ),
        },
        {
            header: 'Berlaku Sampai',
            accessor: 'valid_until',
            cell: (row) => row.valid_until ? String(row.valid_until).slice(0, 10) : '-',
        },
        {
            header: 'Total',
            accessor: 'grand_total',
            cell: (row) => <span className="font-semibold">{formatRupiah(row.grand_total || 0)}</span>,
        },
        {
            header: 'Status',
            accessor: 'status',
            cell: (row) => <Badge className={statusClass[row.status] || statusClass.draft}>{row.status || 'draft'}</Badge>,
        },
        {
            header: 'Aksi',
            accessor: 'id',
            sortable: false,
            className: 'min-w-[220px]',
            cell: (row) => (
                <div className="flex flex-wrap items-center gap-1">
                    <Button type="button" variant="outline" size="icon" title="Cetak quotation" onClick={() => window.open(`/quotations/${row.id}/print`, '_blank', 'noopener,noreferrer')}>
                        <Printer className="size-4" />
                    </Button>
                    {row.status !== 'approved' && (
                        <Button type="button" variant="outline" size="icon" title="Edit quotation" onClick={() => setEditingQuotation(row)}>
                            <Edit className="size-4" />
                        </Button>
                    )}
                    {row.status === 'draft' && can('quotation.approve') && (
                        <Button type="button" size="sm" onClick={() => approveQuotation(row)}>Approve</Button>
                    )}
                    {row.status === 'approved' && can('quotation.approve') && (
                        <Button type="button" variant="outline" size="icon" title="Undo approval" onClick={() => undoApproval(row)}>
                            <Undo2 className="size-4" />
                        </Button>
                    )}
                    {row.status !== 'approved' && can('quotation.generate') && (
                        <Button type="button" variant="ghost" size="icon" title="Hapus quotation" onClick={() => deleteQuotation(row)}>
                            <Trash2 className="size-4 text-red-600" />
                        </Button>
                    )}
                </div>
            ),
        },
    ];

    return (
        <>
            <SectionCard title="Surat Penawaran / Quotation">
                <div className="mb-4 flex flex-wrap justify-end gap-2">
                    {can('quotation.generate') && (
                        <Button type="button" onClick={() => setCreateOpen(true)}>
                            <FilePlus2 className="mr-2 size-4" /> Buat Quotation
                        </Button>
                    )}
                    {can('quotation.generate') && job.available_draft_quotations?.length > 0 && (
                        <Button type="button" variant="outline" onClick={() => setAttachOpen(true)}>
                            <Link2 className="mr-2 size-4" /> Pilih Quotation Draft
                        </Button>
                    )}
                </div>
                <DataTable
                    columns={columns}
                    data={quotations}
                    searchKeys={['quotation_number', 'status']}
                    searchPlaceholder="Cari nomor quotation atau status..."
                    emptyText="Belum ada quotation pada PO ini. Buat baru atau hubungkan draft yang tersedia."
                    pageSize={8}
                />
            </SectionCard>

            <QuotationDraftDialog
                open={createOpen || Boolean(editingQuotation)}
                onOpenChange={(open) => {
                    if (!open) {
                        setCreateOpen(false);
                        setEditingQuotation(null);
                    }
                }}
                customers={[]}
                companyProfiles={companyProfiles}
                eligibleJobTickets={[]}
                initialJobTicket={editingQuotation ? null : job}
                quotation={editingQuotation}
            />

            <Dialog open={attachOpen} onOpenChange={(open) => !open && closeAttach()}>
                <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Pilih Quotation Draft</DialogTitle>
                        <DialogDescription>
                            Pilih quotation draft milik customer yang sama dan petakan setiap item ke pesanan pada PO ini.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2">
                        <Label>Pilih Draft</Label>
                        <Select value={selectedDraft ? String(selectedDraft.id) : ''} onValueChange={(value) => {
                            const draft = job.available_draft_quotations.find((row: any) => String(row.id) === value);
                            if (draft) openAttachDraft(draft);
                        }}>
                            <SelectTrigger><SelectValue placeholder="Pilih nomor quotation draft" /></SelectTrigger>
                            <SelectContent>
                                {job.available_draft_quotations.map((draft: any) => (
                                    <SelectItem key={draft.id} value={String(draft.id)}>
                                        {draft.quotation_number} · {formatRupiah(draft.grand_total || 0)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    {selectedDraft && (
                        <form onSubmit={submitAttach} className="space-y-4">
                            <div className="rounded-md border bg-slate-50 p-3">
                                <p className="font-semibold">{selectedDraft.quotation_number}</p>
                                <p className="text-sm text-slate-600">{formatRupiah(selectedDraft.grand_total || 0)}</p>
                            </div>
                            {selectedDraft.items.map((item: any, index: number) => (
                                <div key={item.id} className="grid gap-3 sm:grid-cols-2 sm:items-center">
                                    <div>
                                        <p className="font-medium">{item.item_name}</p>
                                        <p className="text-xs text-slate-500">Qty {item.quantity} · {formatRupiah(item.price_per_pcs || 0)} / pcs</p>
                                    </div>
                                    <Select
                                        value={attachForm.data.items[index]?.pesanan_id ? String(attachForm.data.items[index].pesanan_id) : ''}
                                        onValueChange={(value) => {
                                            const mappings = [...attachForm.data.items];
                                            mappings[index] = { ...mappings[index], pesanan_id: Number(value) };
                                            attachForm.setData('items', mappings);
                                        }}
                                    >
                                        <SelectTrigger><SelectValue placeholder="Pilih pesanan PO" /></SelectTrigger>
                                        <SelectContent>
                                            {job.orders.map((order: any) => (
                                                <SelectItem key={order.id} value={String(order.id)}>
                                                    {order.requested_product_name || order.product_name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            ))}
                            <div className="flex justify-end gap-2 border-t pt-4">
                                <Button type="button" variant="outline" onClick={closeAttach}>Batal</Button>
                                <Button type="submit" disabled={attachForm.processing}>Hubungkan ke PO</Button>
                            </div>
                        </form>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}

export default QuotationManagementSection;