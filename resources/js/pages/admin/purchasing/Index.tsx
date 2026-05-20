import { Head, router, useForm } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import type { ReactNode} from 'react';
import { useMemo, useState } from 'react';
import { DataTable  } from '@/components/data-table';
import type {DataTableColumn} from '@/components/data-table';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { update as updatePurchasing } from '@/routes/purchasings';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value);
}

type PurchaseRow = {
  id: number;
  purchase_date: string;
  no_job_ticket: string;
  supplier: string;
  supplier_category: 'Bahan Baku' | 'Aksesoris' | 'CMT';
  item_name: string;
  qty: number;
  unit: 'kg' | 'yard' | 'roll' | 'pcs';
  unit_cost: number;
  is_received: boolean;
};

type JobTicketRef = {
  id: number;
  no_job_ticket: string;
};

type SupplierOption = {
  id: number;
  name: string;
  category: string;
};

const sampleJobTickets: JobTicketRef[] = [
  { id: 1, no_job_ticket: 'VL-2026-010' },
  { id: 2, no_job_ticket: 'VL-2026-011' },
  { id: 3, no_job_ticket: 'VL-2026-012' },
];

const sampleSuppliers: SupplierOption[] = [
  { id: 1, name: 'PT Bahan Prima', category: 'Bahan Baku' },
  { id: 2, name: 'CV Aksesoris Plus', category: 'Aksesoris' },
  { id: 3, name: 'Makloon Jahit Sejahtera', category: 'CMT' },
];

const samplePurchases: PurchaseRow[] = [
  {
    id: 1,
    purchase_date: '2026-05-14',
    no_job_ticket: 'VL-2026-010',
    supplier: 'PT Bahan Prima',
    supplier_category: 'Bahan Baku',
    item_name: 'Kain Cotton Combed',
    qty: 15,
    unit: 'kg',
    unit_cost: 45000,
    is_received: false,
  },
  {
    id: 2,
    purchase_date: '2026-05-15',
    no_job_ticket: 'VL-2026-011',
    supplier: 'CV Aksesoris Plus',
    supplier_category: 'Aksesoris',
    item_name: 'Kancing Plastik',
    qty: 1200,
    unit: 'pcs',
    unit_cost: 350,
    is_received: true,
  },
  {
    id: 3,
    purchase_date: '2026-05-16',
    no_job_ticket: 'VL-2026-012',
    supplier: 'Makloon Jahit Sejahtera',
    supplier_category: 'CMT',
    item_name: 'Jahit Makloon Jam',
    qty: 3,
    unit: 'roll',
    unit_cost: 1200000,
    is_received: false,
  },
];

export default function Index({ purchases = samplePurchases }: { purchases?: PurchaseRow[] }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'All' | 'Belum Datang' | 'Bahan Datang'>('All');
  const [supplierCategoryFilter, setSupplierCategoryFilter] = useState<'All' | 'Bahan Baku' | 'Aksesoris' | 'CMT'>('All');

  const purchaseForm = useForm({
    pesanan_id: '',
    supplier_id: '',
    item_name: '',
    qty: 0,
    unit: 'kg' as PurchaseRow['unit'],
    unit_cost: 0,
    tax_rate: 10,
  });

  const filteredPurchases = useMemo(() => {
    return purchases.filter((purchase) => {
      const statusLabel = purchase.is_received ? 'Bahan Datang' : 'Belum Datang';

      if (statusFilter !== 'All' && statusLabel !== statusFilter) {
        return false;
      }

      if (
        supplierCategoryFilter !== 'All' &&
        purchase.supplier_category !== supplierCategoryFilter
      ) {
        return false;
      }

      return true;
    });
  }, [purchases, statusFilter, supplierCategoryFilter]);

  const handleReceive = (purchase: PurchaseRow) => {
    router.patch(updatePurchasing(purchase.id).url, {
      is_received: true,
    });
  };

  const handleCreatePurchase = () => {
    const subtotal = purchaseForm.data.qty * purchaseForm.data.unit_cost;
    purchaseForm.post('/purchasings', {
      preserveScroll: true,
      data: {
        ...purchaseForm.data,
        subtotal,
      },
      onSuccess: () => {
        setIsDialogOpen(false);
        purchaseForm.reset();
      },
    });
  };

  const columns: DataTableColumn<PurchaseRow>[] = [
    {
      header: 'Purchase Date',
      accessor: 'purchase_date',
    },
    {
      header: 'Job Ticket',
      accessor: 'no_job_ticket',
    },
    {
      header: 'Supplier/Vendor',
      accessor: 'supplier',
      cell: (row) => (
        <div className="space-y-1">
          <p className="font-medium text-slate-900">{row.supplier}</p>
          <p className="text-xs text-slate-500">{row.supplier_category}</p>
        </div>
      ),
    },
    {
      header: 'Raw Item',
      accessor: 'item_name',
    },
    {
      header: 'Qty Purchased',
      accessor: 'qty',
      cell: (row) => (
        <span className="font-medium">
          {row.qty} {row.unit}
        </span>
      ),
    },
    {
      header: 'Unit Cost',
      accessor: 'unit_cost',
      cell: (row) => formatCurrency(row.unit_cost),
    },
    {
      header: 'Total Cost',
      accessor: 'unit_cost',
      cell: (row) => formatCurrency(row.qty * row.unit_cost),
    },
    {
      header: 'Arrival Status',
      accessor: 'is_received',
      cell: (row) => (
        <Badge
          className={row.is_received ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}
        >
          {row.is_received ? 'Bahan Datang' : 'Belum Datang'}
        </Badge>
      ),
    },
    {
      header: 'Action',
      accessor: 'id',
      cell: (row) => (
        <Button
          variant={row.is_received ? 'outline' : 'default'}
          size="sm"
          onClick={() => handleReceive(row)}
        >
          {row.is_received ? 'Sudah Diterima' : 'Terima Bahan'}
        </Button>
      ),
    },
  ];

  const unitSubtotal = purchaseForm.data.qty * purchaseForm.data.unit_cost;
  const taxAmount = Math.round((unitSubtotal * purchaseForm.data.tax_rate) / 100);
  const grandTotal = unitSubtotal + taxAmount;

  return (
    <>
      <Head title="Purchasing" />
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
              Purchasing · BOM Tracking
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Procurement & Material Cost</h1>
            <p className="max-w-2xl text-sm leading-6 text-slate-500">
              Lacak pengadaan bahan baku, aksesoris, dan makloon agar profit & loss tetap akurat.
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="default" className="inline-flex items-center gap-2">
                <Plus className="size-4" /> Buat Purchase
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Tambah Purchase Order</DialogTitle>
                <DialogDescription>
                  Input detail material, vendor, dan biaya untuk mengunci data procurement langsung ke Job Ticket.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4">
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-slate-700">Job Ticket</label>
                    <Select
                      value={String(purchaseForm.data.pesanan_id)}
                      onValueChange={(value) => purchaseForm.setData('pesanan_id', value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Pilih Job Ticket" />
                      </SelectTrigger>
                      <SelectContent>
                        {sampleJobTickets.map((job) => (
                          <SelectItem key={job.id} value={String(job.id)}>
                            {job.no_job_ticket}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <InputError message={purchaseForm.errors.pesanan_id as string} />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-slate-700">Supplier</label>
                    <Select
                      value={String(purchaseForm.data.supplier_id)}
                      onValueChange={(value) => purchaseForm.setData('supplier_id', value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Pilih Supplier" />
                      </SelectTrigger>
                      <SelectContent>
                        {sampleSuppliers.map((supplier) => (
                          <SelectItem key={supplier.id} value={String(supplier.id)}>
                            {supplier.name} · {supplier.category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <InputError message={purchaseForm.errors.supplier_id as string} />
                  </div>
                </div>

                <div className="grid gap-2">
                  <label className="text-sm font-medium text-slate-700">Nama Material</label>
                  <Input
                    value={purchaseForm.data.item_name}
                    onChange={(event) => purchaseForm.setData('item_name', event.target.value)}
                    className="w-full"
                  />
                </div>

                <div className="grid gap-2 sm:grid-cols-3">
                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-slate-700">Qty</label>
                    <Input
                      type="number"
                      value={String(purchaseForm.data.qty)}
                      onChange={(event) => purchaseForm.setData('qty', Number(event.target.value))}
                    />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-slate-700">Unit</label>
                    <Select
                      value={purchaseForm.data.unit}
                      onValueChange={(value) => purchaseForm.setData('unit', value as PurchaseRow['unit'])}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Pilih unit" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kg">kg</SelectItem>
                        <SelectItem value="yard">yard</SelectItem>
                        <SelectItem value="roll">roll</SelectItem>
                        <SelectItem value="pcs">pcs</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-slate-700">Harga / Unit</label>
                    <Input
                      type="number"
                      value={String(purchaseForm.data.unit_cost)}
                      onChange={(event) => purchaseForm.setData('unit_cost', Number(event.target.value))}
                    />
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="grid gap-2 text-sm text-slate-700">
                    <div className="flex items-center justify-between">
                      <span>Subtotal</span>
                      <strong>{formatCurrency(unitSubtotal)}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Tax ({purchaseForm.data.tax_rate}%)</span>
                      <strong>{formatCurrency(taxAmount)}</strong>
                    </div>
                    <div className="flex items-center justify-between text-slate-900">
                      <span>Grand Total</span>
                      <strong>{formatCurrency(grandTotal)}</strong>
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="secondary" onClick={() => setIsDialogOpen(false)}>
                  Batal
                </Button>
                <Button onClick={handleCreatePurchase}>Simpan Order</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="grid gap-2">
                <label className="text-sm font-medium text-slate-700">Filter Status Arrival</label>
                <Select
                  value={statusFilter}
                  onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All</SelectItem>
                    <SelectItem value="Belum Datang">Belum Datang</SelectItem>
                    <SelectItem value="Bahan Datang">Bahan Datang</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium text-slate-700">Filter Supplier Category</label>
                <Select
                  value={supplierCategoryFilter}
                  onValueChange={(value) => setSupplierCategoryFilter(value as typeof supplierCategoryFilter)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All</SelectItem>
                    <SelectItem value="Bahan Baku">Bahan Baku</SelectItem>
                    <SelectItem value="Aksesoris">Aksesoris</SelectItem>
                    <SelectItem value="CMT">CMT</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DataTable
              columns={columns}
              data={filteredPurchases}
              searchKeys={['no_job_ticket', 'supplier', 'item_name']}
              searchPlaceholder="Cari Job Ticket / Supplier / Item"
            />
          </CardContent>
        </Card>
      </div>
    </>
  );
}

Index.layout = (page: ReactNode) => (
  <AppLayout
    title=""
    description="Tracking biaya bahan dan vendor procurement untuk BOM dan perhitungan profit & loss."
    information="Procurement · BOM"
  >
    {page}
  </AppLayout>
);
