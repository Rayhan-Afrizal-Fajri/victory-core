import { Head, router, useForm } from '@inertiajs/react';
import { ReactNode, useMemo, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { DataTable, type DataTableColumn } from '@/components/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Eye, Pencil, Trash2 } from 'lucide-react';
import { store as customerStore, update as customerUpdate, destroy as customerDestroy } from '@/routes/customers';
import InputError from '@/components/input-error';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';

type CustomerRow = {
  id: number;
  name: string;
  contact: string;
  address: string;
  total_orders: number;
  order_history: {
    id: number;
    job_ticket: string;
    item_name: string;
    quantity: number;
    total_cost: number;
    status: 'Ordered' | 'Delivered';
  }[];
};

type Props = {
  customers: CustomerRow[];
};

export default function Index({ customers }: Props) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRow | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerRow | null>(null);

  const customerForm = useForm({
    nama: '',
    no_hp: '',
    alamat: '',
  });

  const filteredCustomers = useMemo(() => customers, [customers]);

  const openCustomerDetail = (customer: CustomerRow) => {
    setSelectedCustomer(customer);
    setIsSheetOpen(true);
  };

  const openEditDialog = (customer: CustomerRow) => {
    setEditingCustomer(customer);

    customerForm.setData({
      nama: customer.name,
      no_hp: customer.contact,
      alamat: customer.address,
    });

    setIsDialogOpen(true);
  };

  const handleSubmitCustomer = () => {
    if (editingCustomer) {
      customerForm.put(customerUpdate(editingCustomer.id).url, {
        preserveScroll: true,
        onSuccess: () => {
          setIsDialogOpen(false);
          setEditingCustomer(null);
          customerForm.reset();
          toast.success('Customer berhasil diperbarui');
        },
      });

      return;
    }

    customerForm.post(customerStore().url, {
      preserveScroll: true,
      onSuccess: () => {
        setIsDialogOpen(false);
        customerForm.reset();
        toast.success('Customer berhasil dibuat');
      },
    });
  };

  const handleDeleteCustomer = (customer: CustomerRow) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus customer "${customer.name}"?`)) {
      return;
    }

    router.delete(customerDestroy(customer.id).url, {
      preserveScroll: true,
      onSuccess: () => {
        toast.success('Customer berhasil dihapus');
      },
    });
  };

  const columns: DataTableColumn<CustomerRow>[] = [
    {
      header: 'Nama Pelanggan',
      accessor: 'name',
      cell: (row) => <span className="font-medium text-slate-900">{row.name}</span>,
    },
    {
      header: 'Kontak',
      accessor: 'contact',
    },
    {
      header: 'Alamat',
      accessor: 'address',
      cell: (row) => <span className="text-slate-700">{row.address}</span>,
    },
    {
      header: 'Total Pesanan',
      accessor: 'total_orders',
      cell: (row) => <span className="font-medium text-slate-900">{row.total_orders}</span>,
    },
    {
      header: 'Action',
      accessor: 'id',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => openCustomerDetail(row)}>
            <Eye className="size-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => openEditDialog(row)}>
            <Pencil className="size-4" />
          </Button>
          <Button variant="destructive" size="sm" onClick={() => handleDeleteCustomer(row)}>
            <Trash2 className="size-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <Head title="Customers" />
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Customers</p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Customers</h1>
            <p className="max-w-2xl text-sm leading-6 text-slate-500">
              Kelola profil pelanggan, data kontak, alamat, dan riwayat pesanan secara terpusat.
            </p>
          </div>
          <div className="flex gap-3">
            <Dialog
              open={isDialogOpen}
              onOpenChange={(open) => {
                setIsDialogOpen(open);

                if (!open) {
                  setEditingCustomer(null);
                  customerForm.reset();
                  customerForm.clearErrors();
                }
              }}
            >
              <DialogTrigger asChild>
                <Button variant="default" className="inline-flex items-center gap-2">
                  <Plus className="size-4" /> Tambah Customer
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-xl">
                <DialogHeader>
                  <DialogTitle>{editingCustomer ? 'Edit Customer' : 'Tambah Customer Baru'}</DialogTitle>
                  <DialogDescription>
                    {editingCustomer
                      ? 'Perbarui informasi pelanggan.'
                      : 'Tambahkan profil pelanggan baru untuk mempermudah penjualan dan pengelolaan order.'}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-slate-700">Nama Customer</label>
                    <Input
                      value={customerForm.data.nama}
                      onChange={(event) => customerForm.setData('nama', event.target.value)}
                      className="w-full"
                    />
                    <InputError message={customerForm.errors.nama as string} />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-slate-700">Kontak</label>
                    <Input
                      value={customerForm.data.no_hp}
                      onChange={(event) => customerForm.setData('no_hp', event.target.value)}
                    />
                    <InputError message={customerForm.errors.no_hp as string} />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-slate-700">Alamat</label>
                    <Textarea
                      value={customerForm.data.alamat}
                      onChange={(event) => customerForm.setData('alamat', event.target.value)}
                      rows={2}
                    />
                    <InputError message={customerForm.errors.alamat as string} />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="secondary" onClick={() => setIsDialogOpen(false)}>
                    Batal
                  </Button>
                  <Button onClick={handleSubmitCustomer}>{editingCustomer ? 'Update Customer' : 'Simpan Customer'}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card>
          <CardContent>
            <DataTable
              columns={columns}
              data={filteredCustomers}
              searchKeys={['name', 'contact', 'address']}
              searchPlaceholder="Cari customer atau kontak"
            />
          </CardContent>
        </Card>
      </div>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent side="right" className="max-w-2xl">
          <SheetHeader>
            <SheetTitle>Detail Customer</SheetTitle>
            <SheetDescription>Lihat ringkasan profil customer dan histori pesanan terbaru.</SheetDescription>
          </SheetHeader>

          {selectedCustomer ? (
            <div className="space-y-6 px-4 pb-10">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Customer</p>
                    <h2 className="mt-2 text-2xl font-semibold text-slate-900">{selectedCustomer.name}</h2>
                    <p className="mt-1 text-sm text-slate-600">{selectedCustomer.contact}</p>
                    <p className="mt-1 text-sm text-slate-500">{selectedCustomer.address}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4 text-center">
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Total orders</p>
                    <p className="mt-2 text-3xl font-semibold text-slate-900">{selectedCustomer.total_orders}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-slate-900">Order History</h3>
                <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-4 py-3">Job Ticket</th>
                        <th className="px-4 py-3">Item</th>
                        <th className="px-4 py-3">Qty</th>
                        <th className="px-4 py-3">Total Cost</th>
                        <th className="px-4 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedCustomer.order_history.map((order) => (
                        <tr key={order.id} className="border-t border-slate-200">
                          <td className="px-4 py-3 text-slate-900">{order.job_ticket}</td>
                          <td className="px-4 py-3 text-slate-700">{order.item_name}</td>
                          <td className="px-4 py-3 text-slate-700">{order.quantity}</td>
                          <td className="px-4 py-3 text-slate-700">
                            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(order.total_cost)}
                          </td>
                          <td className="px-4 py-3">
                            <Badge className={order.status === 'Delivered' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}>
                              {order.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <SheetFooter>
                <Button variant="secondary" onClick={() => setIsSheetOpen(false)}>
                  Tutup
                </Button>
              </SheetFooter>
            </div>
          ) : (
            <div className="p-6 text-center text-slate-600">Pilih customer untuk melihat detail.</div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}

Index.layout = (page: ReactNode) => (
  <AppLayout
    title=""
    description="Kelola profil pelanggan, kontak, dan histori pesanan secara terpusat."
    information="Customer Management"
  >
    {page}
  </AppLayout>
);
