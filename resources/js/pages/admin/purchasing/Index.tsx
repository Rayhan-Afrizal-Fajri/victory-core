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
import PurchasingFormDialog from '@/components/purchasings/purchasing-form-dialog';
import { Supplier } from '../job-tickets/types';
import EditPoDialog from '@/components/purchasings/edit-po-dialog';
import ReceivingDialog from '@/components/purchasings/receiving-dialog';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value);
}

type JobTicketRef = {
  id: number;
  no_job_ticket: string;
  customer: string;
};

type MaterialReceiving = {
  id: number;
  received_qty: number;
  qty_received?: number;
  received_at?: string;
  notes?: string;
  checked_by?: string;
};

type PurchaseRow = {
  id: number;
  pesanan_id: number;
  pesanan_material_spec_id?: number | null;
  source: 'bom' | 'manual';

  no_job_ticket?: string;
  customer?: string;

  supplier_id?: number | null;
  supplier?: Supplier | null;

  item_bahan: string;
  item?: string;

  qty_bahan: number;
  required_qty?: number;
  purchase_qty?: number;
  stock_qty?: number;
  leftover_qty?: number;

  satuan?: string;
  unit?: string;

  harga_satuan: number;
  total_harga: number;

  tgl_pembelian?: string | null;
  is_received: boolean;
  received_qty: number;
  remaining_qty: number;
  status: 'draft' | 'ordered' | 'partial_received' | 'received' | 'cancelled';
  notes?: string | null;

  material_receivings?: MaterialReceiving[];
};

type PageProps = {
  purchasings: PurchaseRow[];
  jobTickets: JobTicketRef[];
  suppliers: Supplier[];
};

export default function Index({
  purchasings = [],
  jobTickets = [],
  suppliers = [],
}: PageProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editingPurchasing, setEditingPurchasing] = useState<PurchaseRow | null>(null);
  const [editingPo, setEditingPo] = useState<PurchaseRow | null>(null);
  const [receivingOpen, setReceivingOpen] = useState(false);
  const [selectedPurchasing, setSelectedPurchasing] = useState<PurchaseRow | null>(null);

  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'ordered' | 'partial_received' | 'received' | 'cancelled'>('all');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'bom' | 'manual'>('all');

  const purchaseForm = useForm({
    pesanan_id: '',
    supplier_id: '',
    item_bahan: '',
    qty_bahan: 0,
    satuan: '',
    harga_satuan: 0,
    tgl_pembelian: '',
  });

  const poForm = useForm({
    supplier_id: null as number | null,
    stock_qty: 0,
    purchase_qty: 0,
    harga_satuan: 0,
    notes: '',
    tgl_pembelian: '',
  });

  const receivingForm = useForm({
    received_qty: 1,
    received_at: new Date().toISOString().slice(0, 10),
    notes: '',
  });

  const openCreatePurchasing = () => {
    setEditingPurchasing(null);

    purchaseForm.setData({
      pesanan_id: '',
      supplier_id: '',
      item_bahan: '',
      qty_bahan: 0,
      satuan: '',
      harga_satuan: 0,
      tgl_pembelian: '',
    });

    setCreateOpen(true);
  };

  const openEditManual = (purchase: PurchaseRow) => {
    setEditingPurchasing(purchase);

    purchaseForm.setData({
      pesanan_id: String(purchase.pesanan_id || ''),
      supplier_id: purchase.supplier_id ? String(purchase.supplier_id) : '',
      item_bahan: purchase.item_bahan || '',
      qty_bahan: Number(purchase.qty_bahan || 0),
      satuan: purchase.satuan || purchase.unit || '',
      harga_satuan: Number(purchase.harga_satuan || 0),
      tgl_pembelian: purchase.tgl_pembelian || '',
    });

    setCreateOpen(true);
  };

  const openEditPo = (purchase: PurchaseRow) => {
    setEditingPo(purchase);

    poForm.setData({
      supplier_id: purchase.supplier_id || null,
      stock_qty: Number(purchase.stock_qty || 0),
      purchase_qty: Number(purchase.purchase_qty || purchase.qty_bahan || 0),
      harga_satuan: Number(purchase.harga_satuan || 0),
      notes: purchase.notes || '',
      tgl_pembelian: purchase.tgl_pembelian || '',
    });
  };

  const openReceiving = (purchase: PurchaseRow) => {
    setSelectedPurchasing(purchase);
    receivingForm.setData({
      received_qty: Number(purchase.remaining_qty || 1),
      received_at: new Date().toISOString().slice(0, 10),
      notes: '',
    });
    setReceivingOpen(true);
  };

  const submitPurchasing = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingPurchasing) {
      purchaseForm.patch(`/purchasings/${editingPurchasing.id}`, {
        preserveScroll: true,
        onSuccess: () => {
          setCreateOpen(false);
          setEditingPurchasing(null);
          purchaseForm.reset();
        },
      });

      return;
    }

    purchaseForm.post(`/pesanan/${purchaseForm.data.pesanan_id}/purchasings`, {
      preserveScroll: true,
      onSuccess: () => {
        setCreateOpen(false);
        purchaseForm.reset();
      },
    });
  };

  const updatePoItem = (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingPo) return;

    poForm.patch(`/purchasings/${editingPo.id}/po`, {
      preserveScroll: true,
      onSuccess: () => {
        setEditingPo(null);
        poForm.reset();
      },
    });
  };

  const submitReceiving = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPurchasing) return;

    receivingForm.post(`/purchasings/${selectedPurchasing.id}/receivings`, {
      preserveScroll: true,
      onSuccess: () => {
        setReceivingOpen(false);
        setSelectedPurchasing(null);
        receivingForm.reset();
      },
    });
  };

  const markOrdered = (purchase: PurchaseRow) => {
    router.patch(
      `/purchasings/${purchase.id}/mark-ordered`,
      {},
      { preserveScroll: true },
    );
  };

  const deletePurchasing = (purchase: PurchaseRow) => {
    if (!confirm('Hapus purchasing item ini?')) return;

    router.delete(`/purchasings/${purchase.id}`, {
      preserveScroll: true,
    });
  };

  const deleteReceiving = (receiving: MaterialReceiving) => {
    if (!confirm('Hapus receiving ini?')) return;

    router.delete(`/material-receivings/${receiving.id}`, {
      preserveScroll: true,
    });
  };

  const filteredPurchases = useMemo(() => {
    return purchasings.filter((purchase) => {
      if (statusFilter !== 'all' && purchase.status !== statusFilter) {
        return false;
      }

      if (sourceFilter !== 'all' && purchase.source !== sourceFilter) {
        return false;
      }

      return true;
    });
  }, [purchasings, statusFilter, sourceFilter]);

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      draft: 'bg-slate-100 text-slate-700',
      ordered: 'bg-blue-100 text-blue-700',
      partial_received: 'bg-amber-100 text-amber-700',
      received: 'bg-emerald-100 text-emerald-700',
      cancelled: 'bg-red-100 text-red-700',
    };

    const labels: Record<string, string> = {
      draft: 'Draft',
      ordered: 'Ordered',
      partial_received: 'Partial',
      received: 'Received',
      cancelled: 'Cancelled',
    };

    return (
      <Badge className={styles[status] ?? 'bg-slate-100 text-slate-700'}>
        {labels[status] ?? status}
      </Badge>
    );
  };

  const columns: DataTableColumn<PurchaseRow>[] = [
    {
      header: 'Purchase Order',
      accessor: 'no_job_ticket',
      cell: (row) => (
        <div>
          <p className="font-medium text-slate-900">{row.no_job_ticket || '-'}</p>
          <p className="text-xs text-slate-500">{row.customer || '-'}</p>
        </div>
      ),
    },
    {
      header: 'Material',
      accessor: 'item_bahan',
      cell: (row) => (
        <div>
          <div className="flex items-center gap-2">
            <p className="font-medium text-slate-900">{row.item_bahan}</p>
            <Badge className={row.source === 'bom' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'}>
              {row.source === 'bom' ? 'BOM' : 'Manual'}
            </Badge>
          </div>
          <p className="text-xs text-slate-500">
            Required: {row.required_qty || 0} {row.unit || row.satuan || ''}
          </p>
        </div>
      ),
    },
    {
      header: 'Supplier',
      accessor: 'supplier',
      cell: (row) => (
        <div>
          <p className="font-medium text-slate-900">
            {row.supplier?.nama_perusahaan || row.supplier?.nama || '-'}
          </p>
          <p className="text-xs text-slate-500">
            {row.supplier?.kategori || '-'}
          </p>
        </div>
      ),
    },
    {
      header: 'Purchase Qty',
      accessor: 'purchase_qty',
      cell: (row) => (
        <span className="font-medium">
          {Number(row.purchase_qty || row.qty_bahan || 0)} {row.unit || row.satuan || ''}
        </span>
      ),
    },
    {
      header: 'Received',
      accessor: 'received_qty',
      cell: (row) => (
        <span>
          {Number(row.received_qty || 0)} / {Number(row.purchase_qty || row.qty_bahan || 0)} {row.unit || row.satuan || ''}
        </span>
      ),
    },
    {
      header: 'Total',
      accessor: 'total_harga',
      cell: (row) => formatCurrency(Number(row.total_harga || 0)),
    },
    {
      header: 'Status',
      accessor: 'status',
      cell: (row) => statusBadge(row.status),
    },
    // {
    //   header: 'Action',
    //   accessor: 'id',
    //   cell: (row) => (
    //     <div className="flex flex-wrap gap-2">
    //       {row.status === 'draft' && (
    //         <Button size="sm" variant="secondary" onClick={() => markOrdered(row)}>
    //           Mark Ordered
    //         </Button>
    //       )}

    //       {!['received', 'cancelled'].includes(row.status) && (
    //         <Button size="sm" onClick={() => openReceiving(row)}>
    //           Receiving
    //         </Button>
    //       )}

    //       <Button
    //         size="sm"
    //         variant="outline"
    //         onClick={() => {
    //           if (row.source === 'bom') {
    //             openEditPo(row);
    //             return;
    //           }

    //           openEditManual(row);
    //         }}
    //       >
    //         Edit
    //       </Button>

    //       {row.source === 'manual' && row.status === 'draft' && (
    //         <Button
    //           size="sm"
    //           variant="outline"
    //           className="border-red-200 text-red-700 hover:bg-red-50"
    //           onClick={() => deletePurchasing(row)}
    //         >
    //           Delete
    //         </Button>
    //       )}
    //     </div>
    //   ),
    // },
  ];

  return (
    <>
      <Head title="Purchasing" />

      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
              Purchasing · BOM/PO
            </p>

            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
              Purchasing Management
            </h1>

            <p className="max-w-2xl text-sm leading-6 text-slate-500">
              Kelola pembelian bahan dari BOM maupun item manual, update PO,
              dan catat material receiving.
            </p>
          </div>

          {/* <Button variant="default" className="inline-flex items-center gap-2" onClick={openCreatePurchasing}>
            <Plus className="size-4" />
            Tambah Item Manual
          </Button> */}
        </div>

        <Card>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-3">
              <div className="grid gap-2">
                <label className="text-sm font-medium text-slate-700">
                  Filter Status
                </label>

                <Select
                  value={statusFilter}
                  onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih status" />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="ordered">Ordered</SelectItem>
                    <SelectItem value="partial_received">Partial Received</SelectItem>
                    <SelectItem value="received">Received</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium text-slate-700">
                  Filter Source
                </label>

                <Select
                  value={sourceFilter}
                  onValueChange={(value) => setSourceFilter(value as typeof sourceFilter)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih source" />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="bom">BOM</SelectItem>
                    <SelectItem value="manual">Manual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DataTable
              columns={columns}
              data={filteredPurchases}
              searchKeys={['no_job_ticket', 'customer', 'item_bahan']}
              searchPlaceholder="Cari Purchase Order / Customer / Material"
            />
          </CardContent>
        </Card>
      </div>

      <PurchasingFormDialog
        open={createOpen}
        suppliers={suppliers}
        onOpenChange={(open) => {
          setCreateOpen(open);

          if (!open) {
            setEditingPurchasing(null);
            purchaseForm.reset();
          }
        }}
        form={purchaseForm}
        onSubmit={submitPurchasing}
        mode={editingPurchasing ? 'edit' : 'create'}
        jobTickets={jobTickets}
      />

      <EditPoDialog
        open={Boolean(editingPo)}
        onOpenChange={(open) => {
          if (!open) {
            setEditingPo(null);
            poForm.reset();
          }
        }}
        purchasing={editingPo}
        form={poForm}
        suppliers={suppliers}
        onSubmit={updatePoItem}
      />

      <ReceivingDialog
        open={receivingOpen}
        onOpenChange={(open) => {
          setReceivingOpen(open);

          if (!open) {
            setSelectedPurchasing(null);
            receivingForm.reset();
          }
        }}
        purchasing={selectedPurchasing}
        form={receivingForm}
        onSubmit={submitReceiving}
      />
    </>
  );
}

Index.layout = (page: ReactNode) => (
  <AppLayout
    title=""
    description="Tracking biaya bahan dan vendor procurement untuk BOM dan perhitungan profit & loss."
    information="Procurement · BOM"
    breadcrumbs={[
        {
            title: 'Purchasings',
            href: '',
        },
    ]}
  >
    {page}
  </AppLayout>
);
