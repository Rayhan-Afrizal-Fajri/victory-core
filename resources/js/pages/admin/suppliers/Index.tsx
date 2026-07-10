import { Head, router, useForm } from '@inertiajs/react';
import { Plus, Eye, Pencil, Trash2 } from 'lucide-react';
import type { ReactNode} from 'react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { DataTable  } from '@/components/data-table';
import type {DataTableColumn} from '@/components/data-table';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { store as supplierStore, update as supplierUpdate, destroy as supplierDestroy } from '@/routes/suppliers';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';

type SupplierRow = {
  id: number;
  name: string;
  category: 'Bahan Baku' | 'Aksesoris' | 'CMT' | 'Makloon';
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

const sampleSuppliers: SupplierRow[] = [
  {
    id: 1,
    name: 'PT Bahan Prima',
    category: 'Bahan Baku',
    contact: '0812-3456-7890',
    address: 'Jl. Industri No. 7, Bekasi',
    total_orders: 12,
    order_history: [
      {
        id: 1,
        job_ticket: 'VL-2026-010',
        item_name: 'Kain Cotton Combed',
        quantity: 15,
        total_cost: 675000,
        status: 'Delivered',
      },
      {
        id: 2,
        job_ticket: 'VL-2026-014',
        item_name: 'Kain Twill',
        quantity: 10,
        total_cost: 520000,
        status: 'Ordered',
      },
    ],
  },
  {
    id: 2,
    name: 'CV Aksesoris Plus',
    category: 'Aksesoris',
    contact: '0821-1122-3344',
    address: 'Jl. Rajawali No. 9, Bandung',
    total_orders: 8,
    order_history: [
      {
        id: 3,
        job_ticket: 'VL-2026-011',
        item_name: 'Kancing Plastik',
        quantity: 1200,
        total_cost: 420000,
        status: 'Delivered',
      },
    ],
  },
  {
    id: 3,
    name: 'Makloon Jahit Sejahtera',
    category: 'Makloon',
    contact: '0838-5566-7788',
    address: 'Jl. Kapten Tendean No. 45, Solo',
    total_orders: 5,
    order_history: [
      {
        id: 4,
        job_ticket: 'VL-2026-012',
        item_name: 'Jahit Makloon',
        quantity: 3,
        total_cost: 3600000,
        status: 'Ordered',
      },
    ],
  },
];

type Props = {
  suppliers: SupplierRow[];
}

export default function Index({ suppliers }: Props) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierRow | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<SupplierRow | null>(null);

  const supplierForm = useForm({
    nama: '',
    kategori: 'Bahan Baku' as SupplierRow['category'],
    kontak: '',
    alamat: '',
  });

  const filteredSuppliers = useMemo(() => suppliers, [suppliers]);

  const openSupplierDetail = (supplier: SupplierRow) => {
    setSelectedSupplier(supplier);
    setIsSheetOpen(true);
  };

  const openEditDialog = (supplier: SupplierRow) => {
    setEditingSupplier(supplier);

    supplierForm.setData({
      nama: supplier.name,
      kategori: supplier.category,
      kontak: supplier.contact,
      alamat: supplier.address,
    });

    setIsDialogOpen(true);
  };


  const handleSubmitSupplier = () => {
    if (editingSupplier) {
      supplierForm.put(supplierUpdate(editingSupplier.id).url, {
        preserveScroll: true,

        onSuccess: () => {
          setIsDialogOpen(false);
          setEditingSupplier(null);
          supplierForm.reset();
          toast.success('Supplier berhasil diperbarui');
        }
      });

      return;
    }

    supplierForm.post(supplierStore().url, {
      preserveScroll: true,

      onSuccess: () => {
        setIsDialogOpen(false);
        supplierForm.reset();
        toast.success('Supplier berhasil dibuat');
      }
    });
  }

  const handleDeleteSupplier = (supplier: SupplierRow) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus supplier "${supplier.name}"?`)) {
      return;
    }

    router.delete(supplierDestroy(supplier.id).url, {
      preserveScroll: true,
      onSuccess: () => {
        toast.success('Supplier berhasil dihapus');
      }
    });
  }


  const categoryBadge = (category: SupplierRow['category']) => {
    const classes: Record<SupplierRow['category'], string> = {
      'Bahan Baku': 'bg-emerald-100 text-emerald-800',
      Aksesoris: 'bg-amber-100 text-amber-800',
      CMT: 'bg-sky-100 text-sky-800',
      Makloon: 'bg-violet-100 text-violet-800',
    };

    return <Badge className={classes[category]}>{category}</Badge>;
  };

  const columns: DataTableColumn<SupplierRow>[] = [
    {
      header: 'Vendor Name',
      accessor: 'name',
      cell: (row) => <span className="font-medium text-slate-900">{row.name}</span>,
    },
    {
      header: 'Category',
      accessor: 'category',
      cell: (row) => categoryBadge(row.category),
    },
    {
      header: 'Contact Number',
      accessor: 'contact',
    },
    {
      header: 'Address',
      accessor: 'address',
      cell: (row) => <span className="text-slate-700">{row.address}</span>,
    },
    {
      header: 'Action',
      accessor: 'id',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => openSupplierDetail(row)}
          >
            <Eye className="size-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => openEditDialog(row)}
          >
            <Pencil className="size-4" />
          </Button>

          <Button
            variant="destructive"
            size="sm"
            onClick={() => handleDeleteSupplier(row)}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <Head title="Suppliers & CMT Vendors" />
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
              Suppliers & CMT Vendors
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
              Suppliers & CMT Vendors
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-slate-500">
              Kelola vendor bahan baku, aksesoris, dan CMT dengan profil lengkap dan riwayat order.
            </p>
          </div>
          <div className="flex gap-3">
            <Dialog
              open={isDialogOpen}
              onOpenChange={(open) => {
                setIsDialogOpen(open);

                if (!open) {
                  setEditingSupplier(null);

                  supplierForm.reset();
                  supplierForm.clearErrors();
                }
              }}
            >
              <DialogTrigger asChild>
                <Button variant="default" className="inline-flex items-center gap-2">
                  <Plus className="size-4" /> Tambah Vendor
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingSupplier ? 'Edit Profil Vendor' : 'Tambah Profil Vendor Baru'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingSupplier
                      ? 'Perbarui informasi supplier.'
                      : 'Tambahkan profil vendor baru untuk bahan baku, aksesoris, atau CMT.'}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-slate-700">Nama Vendor</label>
                    <Input
                      value={supplierForm.data.nama}
                      onChange={(event) => supplierForm.setData('nama', event.target.value)}
                      className="w-full"
                    />
                    <InputError message={supplierForm.errors.nama as string} />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-slate-700">Kategori</label>
                    <Select
                      value={supplierForm.data.kategori}
                      onValueChange={(value) => supplierForm.setData('kategori', value as SupplierRow['category'])}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Pilih kategori" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Bahan Baku">Bahan Baku</SelectItem>
                        <SelectItem value="Aksesoris">Aksesoris</SelectItem>
                        <SelectItem value="CMT / Makloon">CMT / Makloon</SelectItem>
                      </SelectContent>
                    </Select>
                    <InputError message={supplierForm.errors.kategori as string} />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-slate-700">Kontak</label>
                    <Input
                      value={supplierForm.data.kontak}
                      onChange={(event) => supplierForm.setData('kontak', event.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-slate-700">Alamat</label>
                    <Textarea
                      value={supplierForm.data.alamat}
                      onChange={(event) => supplierForm.setData('alamat', event.target.value)}
                      rows={2}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="secondary" onClick={() => setIsDialogOpen(false)}>
                    Batal
                  </Button>
                  <Button onClick={handleSubmitSupplier}>
                    {editingSupplier ? 'Update Vendor' : 'Simpan Vendor'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card>
          <CardContent>
            <DataTable
              columns={columns}
              data={filteredSuppliers}
              searchKeys={['name', 'category', 'contact', 'address']}
              searchPlaceholder="Cari vendor atau kategori"
            />
          </CardContent>
        </Card>
      </div>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent side="right" className="max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Supplier Detail</SheetTitle>
            <SheetDescription>
              Lihat ringkasan kinerja vendor dan order history yang langsung terkait dengan purchasing.
            </SheetDescription>
          </SheetHeader>

          {selectedSupplier ? (
            <div className="space-y-6 px-4 pb-10">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{selectedSupplier.category}</p>
                    <h2 className="mt-2 text-2xl font-semibold text-slate-900">{selectedSupplier.name}</h2>
                    <p className="mt-1 text-sm text-slate-600">{selectedSupplier.contact}</p>
                    <p className="mt-1 text-sm text-slate-500">{selectedSupplier.address}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4 text-center">
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Total items ordered</p>
                    <p className="mt-2 text-3xl font-semibold text-slate-900">{selectedSupplier.total_orders}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-slate-900">Order History</h3>
                <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-4 py-3">Purchase Order</th>
                        <th className="px-4 py-3">Item</th>
                        <th className="px-4 py-3">Qty</th>
                        <th className="px-4 py-3">Total Cost</th>
                        <th className="px-4 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedSupplier.order_history.map((order) => (
                        <tr key={order.id} className="border-t border-slate-200">
                          <td className="px-4 py-3 text-slate-900">{order.job_ticket}</td>
                          <td className="px-4 py-3 text-slate-700">{order.item_name}</td>
                          <td className="px-4 py-3 text-slate-700">{order.quantity}</td>
                          <td className="px-4 py-3 text-slate-700">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(order.total_cost)}</td>
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
            <div className="p-6 text-center text-slate-600">Pilih vendor untuk melihat detail.</div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}

Index.layout = (page: ReactNode) => (
  <AppLayout
    title=""
    description="Kelola profil vendor eksternal, kategori bahan, dan histori order yang terhubung ke purchasing."
    information="Vendor Management"
  >
    {page}
  </AppLayout>
);
