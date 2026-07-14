import { Head, useForm } from '@inertiajs/react';
import { useMemo, FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

// Import komponen hasil ekstrak
import OrderSummary from './components/order-summary';
import OrderItem from './components/order-item';
import CustomerSelector from './components/customer-selector';
import { emptyOrderRow, OrderData, Props } from './types';
import { store, update } from '@/routes/order-entry';

export default function Index({ nextJobTicket, customers, companyProfiles, editingJobTicket, customer, defaultSizeBreakdowns }: Props) {
  const isEditing = Boolean(editingJobTicket);

  const form = useForm({
    no_job_ticket: editingJobTicket?.no_job_ticket ?? nextJobTicket ?? 'VL-2026-001',
    customer_id: editingJobTicket?.customer_id ? String(editingJobTicket.customer_id) : customer?.id || '',
    company_profile_id: editingJobTicket?.company_profile_id ? String(editingJobTicket.company_profile_id) : '',
    sales_name: editingJobTicket?.sales_name ?? '',
    
    // Customer baru fields...
    new_customer_name: '',
    // ...
    
    deadline: editingJobTicket?.deadline ?? '',
    customer_notes: editingJobTicket?.customer_notes ?? '',
    orders: editingJobTicket?.orders?.length ? editingJobTicket.orders : [{ ...emptyOrderRow }],
  });

  const productNamesInUse = useMemo(() => {
    return form.data.orders.map((o) => o.requested_product_name?.trim().toLowerCase()).filter(Boolean);
  }, [form.data.orders]);

  const allOrdersApproved = useMemo(() => {
    // Pastikan orders ada
    if (!form.data.orders || form.data.orders.length === 0) return false;
    
    return form.data.orders.every((order) => 
      // Boolean(1) akan menjadi true
      Boolean(order.workflowStatus?.quotation_approved)
    );
  }, [form.data.orders]);

  // Handler Orders
  const handleUpdateOrder = (index: number, updatedOrder: OrderData) => {
    const nextOrders = [...form.data.orders];
    nextOrders[index] = updatedOrder;
    form.setData('orders', nextOrders);
  };

  const handleAddOrder = () => form.setData('orders', [...form.data.orders, { ...emptyOrderRow }]);
  
  const handleRemoveOrder = (index: number) => {
    const newOrders = form.data.orders.filter((_, idx) => idx !== index);
    form.setData('orders', newOrders.length ? newOrders : [{ ...emptyOrderRow }]);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // Logika Validasi (cek nama unik, cek jumlah size) tetap ada di sini
    // ...

    const url = isEditing && editingJobTicket ? update(editingJobTicket.id).url : store().url;
    const action = isEditing ? form.patch : form.post;

    action(url, {
      onSuccess: () => toast.success(`Purchase Order berhasil ${isEditing ? 'diperbarui' : 'dibuat'}.`),
      onError: (err) => toast.error(Object.values(err)[0] as string || 'Gagal menyimpan.'),
    });
  };

  return (
    <>
      <Head title={isEditing ? 'Edit Purchase Order' : 'Order Entry'} />

      <form onSubmit={handleSubmit} className="grid gap-6 xl:grid-cols-[1.85fr_1fr]">
        <div className="space-y-6">
          
          {/* SECTION 1: DATA PO */}
          <div className="rounded-sm border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-base font-semibold text-slate-800">1. Data Purchase Order</h3>
            {/* Render Input No PO, Deadline, Select Perusahaan di sini */}
            <CustomerSelector
              form={form}
              customers={customers}
              companyProfiles={companyProfiles}
              disabled={allOrdersApproved} // Tambahkan ini agar tidak bisa ganti customer
            />
          </div>

          {/* SECTION 2: LIST PESANAN */}
          <div className="rounded-sm border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-base font-semibold text-slate-800">2. Daftar Pesanan Produk</h3>
            
            <div className="space-y-6">
              {form.data.orders.map((order, idx) => {
                // Cek apakah spesifik pesanan ini sudah di-approve
                const isOrderApproved = Boolean(order.workflowStatus?.quotation_approved);

                return (
                  <OrderItem 
                    key={idx}
                    order={order}
                    oIndex={idx}
                    // Tidak bisa dihapus jika cuma 1 pesanan, ATAU jika sudah di-approve
                    isRemovable={form.data.orders.length > 1 && !isOrderApproved} 
                    isApproved={isOrderApproved} // Prop baru untuk disable input tertentu
                    productNamesInUse={productNamesInUse}
                    defaultSizeBreakdowns={defaultSizeBreakdowns}
                    onChange={(updated) => handleUpdateOrder(idx, updated)}
                    onRemove={() => handleRemoveOrder(idx)}
                  />
                )
              })}
            </div>

            <Button 
              disabled={allOrdersApproved} // Tombol tambah pesanan ter-disable
              type="button" 
              variant="outline" 
              className="mt-4 w-full border-dashed border-2 text-blue-600" 
              onClick={handleAddOrder}
            >
              + Tambah Pesanan Lainnya
            </Button>
          </div>

          {/* SECTION 3: NOTES */}
          <div className="rounded-sm border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-base font-semibold text-slate-800">3. Catatan Customer (Global)</h3>
            <Textarea 
              value={form.data.customer_notes} 
              onChange={(e) => form.setData('customer_notes', e.target.value)} 
            />
          </div>

          <Button type="submit" disabled={form.processing}>
            {isEditing ? 'Simpan Perubahan' : 'Buat Purchase Order'}
          </Button>
        </div>

        {/* SIDEBAR SUMMARY */}
        <OrderSummary orders={form.data.orders} />
      </form>
    </>
  );
}