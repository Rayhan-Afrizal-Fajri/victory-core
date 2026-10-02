import { Head, router } from '@inertiajs/react';
import { Edit, Eye, Plus, Printer, Trash2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { toast } from 'sonner';

import { DataTable } from '@/components/data-table';
import type { DataTableColumn } from '@/components/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import AppLayout from '@/layouts/app-layout';
import QuotationDraftDialog from '@/components/quotations/quotation-draft-dialog';
import { useCan } from '@/hooks/use-can';
import { Quotation } from '../job-tickets/types';

type QuotationRow = Quotation & {
  job_ticket_id?: number | null;
};

type Props = {
  quotations: QuotationRow[];
  customers: any[];
  companyProfiles: any[];
  eligibleJobTickets: any[];
};

const currencyFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat('id-ID', {
  maximumFractionDigits: 0,
});

const formatCurrency = (value?: number | null) =>
  currencyFormatter.format(Number(value ?? 0));

const formatNumber = (value?: number | null) =>
  numberFormatter.format(Number(value ?? 0));

const formatDate = (value?: string | null) => {
  if (!value) return '-';

  const normalized = value.includes('T') ? value.split('T')[0] : value;
  const date = new Date(`${normalized}T00:00:00`);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const getStatusClass = (status?: string) => {
  switch (status?.toLowerCase()) {
    case 'approved':
      return 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100';
    case 'rejected':
      return 'bg-red-100 text-red-800 hover:bg-red-100';
    case 'expired':
      return 'bg-slate-200 text-slate-700 hover:bg-slate-200';
    case 'sent':
      return 'bg-blue-100 text-blue-800 hover:bg-blue-100';
    case 'draft':
    default:
      return 'bg-amber-100 text-amber-800 hover:bg-amber-100';
  }
};

const getSourceLabel = (sourceType: Quotation['source_type']) => {
  return sourceType === 'manual' ? 'Manual' : 'Job Ticket';
};

export default function Index({ quotations, customers, companyProfiles, eligibleJobTickets }: Props) {
  const can = useCan();
  const [selectedQuotation, setSelectedQuotation] = useState<QuotationRow | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [draftDialogOpen, setDraftDialogOpen] = useState(false);
  const [editingQuotation, setEditingQuotation] = useState<QuotationRow | null>(null);

  const openQuotationDetail = (quotation: QuotationRow) => {
    setSelectedQuotation(quotation);
    setIsSheetOpen(true);
  };

  const openCreate = () => {
    setEditingQuotation(null);
    setDraftDialogOpen(true);
  };

  const openEdit = (quotation: QuotationRow) => {
    setSelectedQuotation(quotation);
    setIsSheetOpen(false);
    setEditingQuotation(quotation);
    setDraftDialogOpen(true);
  };

  const handlePrint = (quotation: QuotationRow) => {
    window.open(`/quotations/${quotation.id}/print`, '_blank', 'noopener,noreferrer');
  };

  const handleDelete = (quotation: QuotationRow) => {
    if (quotation.status?.toLowerCase() === 'approved') {
      toast.warning('Quotation yang sudah disetujui tidak dapat dihapus.');
      return;
    }

    toast.warning(`Hapus quotation ${quotation.quotation_number}?`, {
      description: 'Data quotation yang dihapus tidak dapat dikembalikan.',
      action: {
        label: 'Hapus',
        onClick: () => {
          router.delete(`/quotations/${quotation.id}`, {
            preserveScroll: true,
            onSuccess: () => {
              setSelectedQuotation(null);
              setIsSheetOpen(false);
            },
          });
        },
      },
    });
  };

  const columns: DataTableColumn<QuotationRow>[] = [
    {
      header: 'Quotation',
      accessor: 'quotation_number',
      cell: (row) => (
        <div className="flex flex-col gap-1">
          <span className="font-medium text-slate-900">{row.quotation_number}</span>
          <span className="text-xs text-slate-500">
            {getSourceLabel(row.source_type)}
          </span>
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      cell: (row) => (
        <Badge className={getStatusClass(row.status)}>
          {row.status || '-'}
        </Badge>
      ),
    },
    {
      header: 'Berlaku Sampai',
      accessor: 'valid_until',
      cell: (row) => (
        <span className="text-slate-700">{formatDate(row.valid_until)}</span>
      ),
    },
    {
      header: 'Quantity',
      accessor: 'quantity',
      cell: (row) => (
        <span className="font-medium text-slate-900">
          {formatNumber(row.quantity)} pcs
        </span>
      ),
    },
    {
      header: 'Subtotal',
      accessor: 'subtotal',
      cell: (row) => (
        <span className="text-slate-700">{formatCurrency(row.subtotal)}</span>
      ),
    },
    {
      header: 'Grand Total',
      accessor: 'grand_total',
      cell: (row) => (
        <span className="font-semibold text-slate-900">
          {formatCurrency(row.grand_total)}
        </span>
      ),
    },
    {
      header: 'Action',
      accessor: 'id',
      sortable: false,
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            title="Lihat detail"
            onClick={() => openQuotationDetail(row)}
          >
            <Eye className="size-4" />
          </Button>

          {row.status?.toLowerCase() !== 'approved' && can('quotation.generate') && (
            <Button variant="outline" size="sm" title="Edit draft quotation" onClick={() => openEdit(row)}>
              <Edit className="size-4" />
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            title="Cetak quotation"
            onClick={() => handlePrint(row)}
          >
            <Printer className="size-4" />
          </Button>

          {row.status?.toLowerCase() !== 'approved' && can('quotation.generate') && (
            <Button
              variant="destructive"
              size="sm"
              title="Hapus quotation"
              onClick={() => handleDelete(row)}
            >
              <Trash2 className="size-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <Head title="Quotations" />

      <div className="space-y-6">
        {/* <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
              Quotation Management
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
              Surat Penawaran
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-slate-500">
              Kelola surat penawaran, status quotation, periode berlaku, dan nilai
              transaksi secara terpusat.
            </p>
          </div>
        </div> */}

        <Card>
          <CardContent>
            {can('quotation.generate') && (
              <div className="mb-4 flex justify-end">
                <Button onClick={openCreate}>
                  <Plus className="mr-2 size-4" /> Buat Quotation
                </Button>
              </div>
            )}
            <DataTable
              columns={columns}
              data={quotations}
              searchKeys={['quotation_number', 'status', 'source_type', 'customer_company_snapshot', 'customer_name_snapshot']}
              searchPlaceholder="Cari nomor quotation atau status"
            />
          </CardContent>
        </Card>
      </div>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent side="right" className="max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Detail Quotation</SheetTitle>
            <SheetDescription>
              Lihat detail surat penawaran dan informasi nilainya.
            </SheetDescription>
          </SheetHeader>

          {selectedQuotation ? (
            <div className="space-y-6 px-4 pb-10">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                      Quotation
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                      {selectedQuotation.quotation_number}
                    </h2>
                    <p className="mt-2 text-sm text-slate-500">
                      Sumber: {getSourceLabel(selectedQuotation.source_type)}
                    </p>
                  </div>

                  <Badge className={getStatusClass(selectedQuotation.status)}>
                    {selectedQuotation.status || '-'}
                  </Badge>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                    Berlaku Sampai
                  </p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">
                    {formatDate(selectedQuotation.valid_until)}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                    Job Ticket
                  </p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">
                    {selectedQuotation.job_ticket_id ?? '-'}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-slate-900">Nilai Quotation</h3>
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                  <table className="min-w-full text-sm">
                    <tbody>
                      <tr className="border-b border-slate-200">
                        <td className="px-4 py-3 text-slate-500">Quantity</td>
                        <td className="px-4 py-3 text-right font-medium text-slate-900">
                          {formatNumber(selectedQuotation.quantity)} pcs
                        </td>
                      </tr>
                      <tr className="border-b border-slate-200">
                        <td className="px-4 py-3 text-slate-500">Harga / pcs</td>
                        <td className="px-4 py-3 text-right font-medium text-slate-900">
                          {formatCurrency(selectedQuotation.price_per_pcs)}
                        </td>
                      </tr>
                      <tr className="border-b border-slate-200">
                        <td className="px-4 py-3 text-slate-500">Subtotal</td>
                        <td className="px-4 py-3 text-right font-medium text-slate-900">
                          {formatCurrency(selectedQuotation.subtotal)}
                        </td>
                      </tr>
                      <tr className="border-b border-slate-200">
                        <td className="px-4 py-3 text-slate-500">Tax</td>
                        <td className="px-4 py-3 text-right font-medium text-slate-900">
                          {formatCurrency(selectedQuotation.tax)}
                        </td>
                      </tr>
                      <tr className="border-b border-slate-200">
                        <td className="px-4 py-3 text-slate-500">Delivery Cost</td>
                        <td className="px-4 py-3 text-right font-medium text-slate-900">
                          {formatCurrency(selectedQuotation.delivery_cost)}
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-4 font-semibold text-slate-900">Grand Total</td>
                        <td className="px-4 py-4 text-right text-lg font-semibold text-slate-900">
                          {formatCurrency(selectedQuotation.grand_total)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-slate-900">Ketentuan</h3>
                <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                      Payment Terms
                    </p>
                    <p className="mt-1 whitespace-pre-line text-sm text-slate-700">
                      {selectedQuotation.payment_terms || '-'}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                      Delivery Terms
                    </p>
                    <p className="mt-1 whitespace-pre-line text-sm text-slate-700">
                      {selectedQuotation.delivery_terms || '-'}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                      Notes
                    </p>
                    <p className="mt-1 whitespace-pre-line text-sm text-slate-700">
                      {selectedQuotation.notes || '-'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-slate-900">Approval</h3>
                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                        Approved By
                      </p>
                      <p className="mt-1 text-sm text-slate-700">
                        {selectedQuotation.approved_by_name || '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                        Approved At
                      </p>
                      <p className="mt-1 text-sm text-slate-700">
                        {formatDate(selectedQuotation.approved_at)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <SheetFooter className="gap-2 sm:justify-between">
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => handlePrint(selectedQuotation)}>
                    <Printer className="mr-2 size-4" />
                    Cetak
                  </Button>

                  {selectedQuotation.status?.toLowerCase() !== 'approved' && (
                    <Button
                      variant="destructive"
                      onClick={() => handleDelete(selectedQuotation)}
                    >
                      <Trash2 className="mr-2 size-4" />
                      Hapus
                    </Button>
                  )}
                </div>

                <Button variant="secondary" onClick={() => setIsSheetOpen(false)}>
                  Tutup
                </Button>
              </SheetFooter>
            </div>
          ) : (
            <div className="p-6 text-center text-slate-600">
              Pilih quotation untuk melihat detail.
            </div>
          )}
        </SheetContent>
      </Sheet>

      <QuotationDraftDialog
        open={draftDialogOpen}
        onOpenChange={(open) => {
          setDraftDialogOpen(open);
          if (!open) setEditingQuotation(null);
        }}
        customers={customers}
        companyProfiles={companyProfiles}
        eligibleJobTickets={eligibleJobTickets}
        quotation={editingQuotation}
      />
    </>
  );
}

Index.layout = (page: ReactNode) => (
  <AppLayout
    title="Surat Penawaran"
    description="Kelola surat penawaran secara manual melalui fitur ini."
    information="Quotation Management"
    breadcrumbs={[
      {
        title: 'Quotations',
        href: '',
      },
    ]}
  >
    {page}
  </AppLayout>
);
