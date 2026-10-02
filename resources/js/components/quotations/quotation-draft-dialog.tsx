import { useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import formatRupiah from '@/components/ui/format-rupiah';

type DraftItem = {
    pesanan_id: number | null;
    item_name: string;
    fabric: string;
    print_method: string;
    quantity: number;
    price_per_pcs: number;
    sample_quantity: number;
    sample_price_per_pcs: number;
};

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    customers: any[];
    companyProfiles: any[];
    eligibleJobTickets: any[];
    initialJobTicket?: any | null;
    quotation?: any | null;
};

const emptyItem = (): DraftItem => ({
    pesanan_id: null,
    item_name: '',
    fabric: '',
    print_method: '',
    quantity: 1,
    price_per_pcs: 0,
    sample_quantity: 0,
    sample_price_per_pcs: 0,
});

function mapJobTicketItems(jobTicket: any): DraftItem[] {
    return (jobTicket?.orders || []).map((order: any) => ({
        pesanan_id: order.id,
        item_name: order.item_name || order.requested_product_name || order.product_name || `Pesanan #${order.id}`,
        fabric: order.fabric || order.material_specs?.find((spec: any) => spec.type === 'bahan')?.material_name || '',
        print_method: order.print_method || order.manufacturing_specs?.find((spec: any) => String(spec.work_name_snapshot || '').toLowerCase().includes('sablon'))?.work_name_snapshot || '',
        quantity: Number(order.quantity || order.q || 1),
        price_per_pcs: Number(order.price_per_pcs ?? order.price_per_piece ?? 0),
        sample_quantity: Number(order.sample_quantity ?? order.sample_qty ?? 0),
        sample_price_per_pcs: Number(order.sample_price_per_pcs ?? order.sample_price_per_piece ?? 0),
    }));
}

export default function QuotationDraftDialog({
    open,
    onOpenChange,
    customers,
    companyProfiles,
    eligibleJobTickets,
    initialJobTicket = null,
    quotation = null,
}: Props) {
    const form = useForm({
        job_ticket_id: null as number | null,
        customer_id: null as number | null,
        company_profile_id: null as number | null,
        customer_name: '',
        customer_company: '',
        customer_phone: '',
        customer_address: '',
        valid_until: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
        payment_terms: '',
        delivery_terms: '',
        notes: '',
        delivery_cost: 0,
        items: [emptyItem()] as DraftItem[],
    });

    useEffect(() => {
        if (!open) return;

        if (quotation) {
            const jobTicket = quotation.job_ticket || quotation.jobTicket;
            form.setData({
                job_ticket_id: quotation.job_ticket_id || null,
                customer_id: quotation.customer_id || jobTicket?.customer_id || null,
                company_profile_id: quotation.company_profile_id || jobTicket?.company_profile_id || companyProfiles[0]?.id || null,
                customer_name: quotation.customer_name_snapshot || jobTicket?.customer_nama_snapshot || quotation.customer?.nama || '',
                customer_company: quotation.customer_company_snapshot || jobTicket?.customer_perusahaan_snapshot || quotation.customer?.nama_perusahaan || '',
                customer_phone: quotation.customer_phone_snapshot || quotation.customer?.no_hp || '',
                customer_address: quotation.customer_address_snapshot || quotation.customer?.alamat_detail || '',
                valid_until: quotation.valid_until ? String(quotation.valid_until).slice(0, 10) : '',
                payment_terms: quotation.payment_terms || '',
                delivery_terms: quotation.delivery_terms || '',
                notes: quotation.notes || quotation.quotation_notes?.map((note: any) => note.notes).join('\n') || '',
                delivery_cost: Number(quotation.delivery_cost || 0),
                items: (quotation.items || []).map((item: any) => ({
                    pesanan_id: item.pesanan_id || null,
                    item_name: item.item_name || '',
                    fabric: item.fabric || '',
                    print_method: item.print_method || '',
                    quantity: Number(item.quantity || 1),
                    price_per_pcs: Number(item.price_per_pcs || 0),
                    sample_quantity: Number(item.sample_quantity || 0),
                    sample_price_per_pcs: Number(item.sample_price_per_pcs || 0),
                })),
            });
            return;
        }

        const jobTicket = initialJobTicket;
        form.setData({
            job_ticket_id: jobTicket?.id || null,
            customer_id: jobTicket?.customer_id || null,
            company_profile_id: jobTicket?.company_profile_id || companyProfiles[0]?.id || null,
            customer_name: jobTicket?.customer_name || jobTicket?.customer?.name || '',
            customer_company: jobTicket?.customer_company || jobTicket?.customer?.company || '',
            customer_phone: jobTicket?.customer?.phone || '',
            customer_address: jobTicket?.customer?.address || '',
            valid_until: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
            payment_terms: '',
            delivery_terms: '',
            notes: '',
            delivery_cost: 0,
            items: jobTicket ? mapJobTicketItems(jobTicket) : [emptyItem()],
        });
    }, [open, quotation?.id, initialJobTicket?.id]);

    const updateItem = (index: number, key: keyof DraftItem, value: string | number | null) => {
        const items = [...form.data.items];
        items[index] = { ...items[index], [key]: value };
        form.setData('items', items);
    };

    const chooseJobTicket = (value: string) => {
        const jobTicket = eligibleJobTickets.find((row) => String(row.id) === value);
        if (!jobTicket) return;
        form.setData({
            ...form.data,
            job_ticket_id: jobTicket.id,
            customer_id: jobTicket.customer_id || null,
            company_profile_id: jobTicket.company_profile_id || form.data.company_profile_id,
            customer_name: jobTicket.customer_name || '',
            customer_company: jobTicket.customer_company || '',
            items: mapJobTicketItems(jobTicket),
        });
    };

    const selectCustomer = (value: string) => {
        const customer = customers.find((row) => String(row.id) === value);
        if (!customer) {
            form.setData({ ...form.data, customer_id: null });
            return;
        }
        form.setData({
            ...form.data,
            customer_id: customer.id,
            customer_name: customer.name,
            customer_company: customer.company_name || '',
        });
    };

    const submit = (event: React.FormEvent) => {
        event.preventDefault();
        const url = quotation ? `/quotations/${quotation.id}` : '/quotations';
        const action = quotation ? form.patch : form.post;
        action(url, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(quotation ? 'Quotation draft diperbarui.' : 'Quotation draft berhasil dibuat.');
                onOpenChange(false);
                form.reset();
            },
        });
    };

    const subtotal = form.data.items.reduce(
        (sum, item) => sum + Number(item.quantity || 0) * Number(item.price_per_pcs || 0),
        0,
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[92vh] max-w-5xl overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{quotation ? 'Edit Quotation Draft' : 'Buat Quotation'}</DialogTitle>
                    <DialogDescription>
                        {quotation?.job_ticket_id
                            ? 'Perubahan dapat dilakukan sampai quotation disetujui.'
                            : 'Buat draft manual atau isi item dari PO yang belum memiliki quotation aktif.'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={submit} className="space-y-5">
                    {!initialJobTicket && !quotation?.job_ticket_id && (
                        <div className="space-y-2">
                            <Label>Sumber Data</Label>
                            <Select value={form.data.job_ticket_id ? String(form.data.job_ticket_id) : 'manual'} onValueChange={(value) => {
                                if (value === 'manual') {
                                    form.setData({ ...form.data, job_ticket_id: null, customer_id: null, customer_name: '', customer_company: '', items: [emptyItem()] });
                                } else {
                                    chooseJobTicket(value);
                                }
                            }}>
                                <SelectTrigger><SelectValue placeholder="Pilih sumber" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="manual">Input manual</SelectItem>
                                    {eligibleJobTickets.map((row) => (
                                        <SelectItem key={row.id} value={String(row.id)}>
                                            {row.no_job_ticket} · {row.customer_company || row.customer_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <div className="grid gap-4 md:grid-cols-2">
                        {!form.data.job_ticket_id && (
                            <div className="space-y-2">
                                <Label>Customer (Master)</Label>
                                <Select value={form.data.customer_id ? String(form.data.customer_id) : 'manual'} onValueChange={selectCustomer}>
                                    <SelectTrigger><SelectValue placeholder="Pilih customer atau isi manual" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="manual">Isi customer manual</SelectItem>
                                        {customers.map((customer) => (
                                            <SelectItem key={customer.id} value={String(customer.id)}>
                                                {customer.company_name ? `${customer.company_name} · ${customer.name}` : customer.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label>Perusahaan Penerbit</Label>
                            <Select value={form.data.company_profile_id ? String(form.data.company_profile_id) : ''} onValueChange={(value) => form.setData('company_profile_id', Number(value))}>
                                <SelectTrigger><SelectValue placeholder="Pilih perusahaan" /></SelectTrigger>
                                <SelectContent>
                                    {companyProfiles.map((profile) => (
                                        <SelectItem key={profile.id} value={String(profile.id)}>{profile.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Nama Customer</Label>
                            <Input value={form.data.customer_name} onChange={(event) => form.setData('customer_name', event.target.value)} disabled={Boolean(form.data.job_ticket_id || form.data.customer_id)} required />
                        </div>
                        <div className="space-y-2">
                            <Label>Nama Perusahaan Customer</Label>
                            <Input value={form.data.customer_company} onChange={(event) => form.setData('customer_company', event.target.value)} disabled={Boolean(form.data.job_ticket_id || form.data.customer_id)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Telepon</Label>
                            <Input value={form.data.customer_phone} onChange={(event) => form.setData('customer_phone', event.target.value)} disabled={Boolean(form.data.job_ticket_id || form.data.customer_id)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Berlaku Sampai</Label>
                            <Input type="date" value={form.data.valid_until} onChange={(event) => form.setData('valid_until', event.target.value)} />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <Label>Alamat Customer</Label>
                            <Textarea value={form.data.customer_address} onChange={(event) => form.setData('customer_address', event.target.value)} disabled={Boolean(form.data.job_ticket_id || form.data.customer_id)} />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold">Item Quotation</h3>
                            <Button type="button" variant="outline" size="sm" onClick={() => form.setData('items', [...form.data.items, emptyItem()])}>
                                <Plus className="mr-2 size-4" /> Tambah Item
                            </Button>
                        </div>
                        {form.data.items.map((item, index) => (
                            <div key={`${index}-${item.pesanan_id ?? 'manual'}`} className="space-y-3 rounded-md border p-4">
                                <div className="grid gap-3 md:grid-cols-[2fr_1fr_1fr_auto]">
                                    <div className="space-y-1"><Label>Artikel</Label><Input value={item.item_name} onChange={(event) => updateItem(index, 'item_name', event.target.value)} required /></div>
                                    <div className="space-y-1"><Label>Qty Produksi</Label><Input type="number" min="1" value={item.quantity} onChange={(event) => updateItem(index, 'quantity', Number(event.target.value))} required /></div>
                                    <div className="space-y-1"><Label>Harga / pcs</Label><Input type="number" min="0" value={item.price_per_pcs} onChange={(event) => updateItem(index, 'price_per_pcs', Number(event.target.value))} required /></div>
                                    <div className="flex items-end"><Button type="button" variant="ghost" size="icon" title="Hapus item" disabled={form.data.items.length <= 1} onClick={() => form.setData('items', form.data.items.filter((_, itemIndex) => itemIndex !== index))}><Trash2 className="size-4" /></Button></div>
                                    <div className="space-y-1"><Label>Qty Sample</Label><Input type="number" min="0" value={item.sample_quantity} onChange={(event) => updateItem(index, 'sample_quantity', Number(event.target.value))} /></div>
                                    <div className="space-y-1"><Label>Harga Sample / pcs</Label><Input type="number" min="0" value={item.sample_price_per_pcs} onChange={(event) => updateItem(index, 'sample_price_per_pcs', Number(event.target.value))} /></div>
                                    <div className="space-y-1"><Label>Bahan / Fabric</Label><Input value={item.fabric} onChange={(event) => updateItem(index, 'fabric', event.target.value)} /></div>
                                    <div className="space-y-1"><Label>Metode Print</Label><Input value={item.print_method} onChange={(event) => updateItem(index, 'print_method', event.target.value)} /></div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2"><Label>Payment Terms</Label><Textarea value={form.data.payment_terms} onChange={(event) => form.setData('payment_terms', event.target.value)} /></div>
                        <div className="space-y-2"><Label>Delivery Terms</Label><Textarea value={form.data.delivery_terms} onChange={(event) => form.setData('delivery_terms', event.target.value)} /></div>
                        <div className="space-y-2"><Label>Notes</Label><Textarea value={form.data.notes} onChange={(event) => form.setData('notes', event.target.value)} /></div>
                        <div className="space-y-2"><Label>Delivery Cost</Label><Input type="number" min="0" value={form.data.delivery_cost} onChange={(event) => form.setData('delivery_cost', Number(event.target.value))} /></div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
                        <div className="text-sm text-slate-600">Subtotal item: <strong className="text-slate-900">{formatRupiah(subtotal)}</strong></div>
                        <div className="flex gap-2">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
                            <Button type="submit" disabled={form.processing}>{quotation ? 'Simpan Perubahan' : 'Simpan Draft'}</Button>
                        </div>
                    </div>
                    {Object.keys(form.errors).length > 0 && (
                        <Alert variant="destructive">
                            <AlertDescription>
                                {String(Object.values(form.errors)[0])}
                            </AlertDescription>
                        </Alert>
                    )}
                </form>
            </DialogContent>
        </Dialog>
    );
}