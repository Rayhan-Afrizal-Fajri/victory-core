import { Head, router, useForm } from '@inertiajs/react';
import { Plus, Eye, Pencil, Trash2 } from 'lucide-react';
import type { ReactNode} from 'react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { DetailSheet } from '@/components/crud/detail-sheet';
import { FormDialog } from '@/components/crud/form-dialog';
import { DataTable  } from '@/components/data-table';
import type {DataTableColumn} from '@/components/data-table';
import { CustomerDetail } from '@/components/forms/customer/customer-detail';
import { CustomerForm } from '@/components/forms/customer/customer-form';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Card, CardContent } from '@/components/ui/card';
import { store as customerStore, update as customerUpdate, destroy as customerDestroy } from '@/routes/customers';
import { Textarea } from '@/components/ui/textarea';

type CustomerRow = {
  id: number;
  name: string;
  position: string;
  company_name: string;
  contact: string;
  province: string;
  city: string;
  district: string;
  village: string;
  postal_code: string;
  detail_address: string;
  address_merge: string;
  total_orders: number;
  order_history: {
    id: number;
    job_ticket: string;
    item_names: string;
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
    jabatan: '',
    nama_perusahaan: '',
    no_hp: '',
    provinsi: '',
    kota: '',
    kecamatan: '',
    kelurahan: '',
    kode_pos: '',
    alamat_detail: '',
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
      jabatan: customer.position,
      nama_perusahaan: customer.company_name,
      no_hp: customer.contact,
      alamat_detail: customer.detail_address,
      provinsi: customer.province,
      kota: customer.city,
      kecamatan: customer.district,
      kelurahan: customer.village,
      kode_pos: customer.postal_code,
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
          // toast.success('Customer berhasil diperbarui');
        },
      });

      return;
    }

    customerForm.post(customerStore().url, {
      preserveScroll: true,
      onSuccess: () => {
        setIsDialogOpen(false);
        customerForm.reset();
        // toast.success('Customer berhasil dibuat');
      },
    });
  };

  // const handleDeleteCustomer = (customer: CustomerRow) => {
  //   if (!confirm(`Apakah Anda yakin ingin menghapus customer "${customer.name}"?`)) {
  //     return;
  //   }

  //   router.delete(customerDestroy(customer.id).url, {
  //     preserveScroll: true,
  //     onSuccess: () => {
  //       toast.success('Customer berhasil dihapus');
  //     },
  //   });
  // };

  const handleDeleteCustomer = (customer: CustomerRow) => {
    //triger warning
    toast.warning(`Apakah Anda yakin ingin menghapus customer "${customer.name}"?`, {
      description: 'Data yang dihapus tidak dapat dikembalikan.',
      //main action
      action: {
        label: 'Hapus',
        onClick: () => {
          //excecute
          router.delete(customerDestroy(customer.id).url, {
            preserveScroll: true,
            onSuccess: () => {
              // toast.success('Customer berhasil dihapus');
            },
          });
        },
      },
    });
  };

  const columns: DataTableColumn<CustomerRow>[] = [
    {
      header: 'Nama Pelanggan',
      accessor: 'name',
      cell: (row) =>(
                      <div className="flex flex-col gap-1">
                        <span className="font-medium text-slate-900">{row.name}</span>
                        <span className="font-regular text-slate-600 text-sm">{row.position}</span>
                      </div>
                    ),
    },
    {
      header: 'Nama Perusahaan',
      accessor: 'company_name',
      cell: (row) => <span className="font-medium text-slate-900">{row.company_name}</span>,
    },
    {
      header: 'Kontak',
      accessor: 'contact',
      sortable: false,
    },
    {
      header: 'Alamat',
      accessor: 'address',
      sortable: false,
      cell: (row) => (
        <span className="text-slate-700">
          {row.detail_address}
          {row.village ? `, Kelurahan ${row.village}` : ''}
          {row.district ? `, Kecamatan ${row.district}` : ''}
          {row.city ? `, Kabupaten/Kota ${row.city}` : ''}
          {row.province ? `, Provinsi ${row.province}` : ''}
          {row.postal_code ? ` ${row.postal_code}` : ''}
        </span>
      )
    },
    {
      header: 'Total Pesanan',
      accessor: 'total_orders',
      cell: (row) => <span className="font-medium text-slate-900">{row.total_orders}</span>,
    },
    {
      header: 'Action',
      accessor: 'id',
      sortable: false,
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

            <FormDialog
              isButtonAdd={true}
              open={isDialogOpen}
              onOpenChange={setIsDialogOpen}
              title={
                editingCustomer
                  ? 'Edit Customer'
                  : 'Tambah Customer'
              }
              description="Kelola data customer"
              submitLabel={
                editingCustomer
                  ? 'Update Customer'
                  : 'Simpan Customer'
              }
              loading={customerForm.processing}
              onSubmit={handleSubmitCustomer}
            >
              <CustomerForm form={customerForm}/>
            </FormDialog>
          </div>
        </div>

        <Card>
          <CardContent>
            <DataTable
              columns={columns}
              data={filteredCustomers}
              searchKeys={['name', 'contact', 'detail_address']}
              searchPlaceholder="Cari customer atau kontak"
            />
          </CardContent>
        </Card>
      </div>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent side="right" className="max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Detail Customer</SheetTitle>
            <SheetDescription>Lihat ringkasan profil customer dan histori pesanan terbaru.</SheetDescription>
          </SheetHeader>

          {selectedCustomer ? (
            <div className="space-y-6 px-4 pb-10">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-950">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Customer</p>
                    <h2 className="mt-2 text-2xl font-semibold text-slate-900">{selectedCustomer.name}</h2>
                    <p className="mt-1 text-sm text-slate-600">{selectedCustomer.contact}</p>
                    <p className="mt-1 text-sm text-slate-500">{selectedCustomer.detail_address}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4 text-center dark:bg-slate-900">
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">Total orders</p>
                    <p className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">{selectedCustomer.total_orders}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-slate-900">Order History</h3>
                <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-950">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                      <tr>
                        <th className="px-4 py-3">Purchase Order</th>
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
                          <td className="px-4 py-3 text-slate-700">{order.item_names}</td>
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
      {/* <DetailSheet
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        title="Detail Customer"
        description="Lihat detail customer"
      >
        {selectedCustomer && (
          <CustomerDetail
            customer={selectedCustomer}
            onClose={() => setIsSheetOpen(false)}
          />
        )}
      </DetailSheet> */}
    </>
  );
}

Index.layout = (page: ReactNode) => (
  <AppLayout
    title=""
    description="Kelola profil pelanggan, kontak, dan histori pesanan secara terpusat."
    information="Customer Management"
    breadcrumbs={[
        {
          title: 'Master Customers',
            href: '',
        },
    ]}
  >
    {page}
  </AppLayout>
);
