import { Head, router, useForm } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import type { ReactNode} from 'react';
import { useEffect, useMemo, useState } from 'react';
import { DataTable  } from '@/components/data-table';
import type {DataTableColumn} from '@/components/data-table';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import InvoiceDetailSheet from '@/components/invoice/invoice-detail-sheet';
import PaymentDialog from '@/components/sample/payment-dialog';
import InvoiceEditDialog from '@/components/invoice/invoice-edit-dialog';
import FormattedNumberInput from '@/components/ui/formatted-number-input';
import { Invoice } from '../job-tickets/types';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value);
}


type PageProps = {
    invoices: Invoice[];
};


export default function Index({
    invoices = [],
}: PageProps) {
  const [createOpen, setCreateOpen] = useState(false);

  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentDialogMode, setPaymentDialogMode] = useState<'create' | 'edit'>('create');
  const [editingPayment, setEditingPayment] = useState<any | null>(null);

  const [editInvoiceOpen, setEditInvoiceOpen] = useState(false);
  const [rejectPaymentId, setRejectPaymentId] = useState<number | null>(null);

  const [categoryFilter, setCategoryFilter] = useState<'all' | 'sample' | 'production'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unpaid' | 'partially_paid' | 'paid' | 'cancelled'>('all');

  const createInvoiceForm = useForm({
      pesanan_id: '',
      kategori_invoice: 'sample',
      title: '',
      total_tagihan: 0,
      tgl_jatuh_tempo: '',
  });

  const editInvoiceForm = useForm({
      title: '',
      total_tagihan: 0,
      tgl_jatuh_tempo: '',
  });

  const paymentForm = useForm({
      tgl_bayar: new Date().toISOString().slice(0, 10),
      jumlah_bayar: 0,
      metode_pembayaran: '',
      bukti_transfer: null as File | null,
      catatan_finance: '',
  });

  const rejectPaymentForm = useForm({
      rejection_note: '',
  });

  function getInvoiceTotal(invoice: any) {
      return Number(invoice?.total_tagihan || invoice?.amount || 0);
  }

  function getVerifiedPaid(invoice: any) {
      return (invoice?.payments || [])
          .filter((payment: any) => payment.status === 'verified')
          .reduce((total: number, payment: any) => {
              return total + Number(payment.jumlah_bayar || payment.amount || 0);
          }, 0);
  }

  function getRemainingPayment(invoice: any) {
      return Math.max(getInvoiceTotal(invoice) - getVerifiedPaid(invoice), 0);
  }

  function isInvoiceCancelled(invoice: any) {
      return ['cancelled', 'Cancelled'].includes(invoice?.status_tagihan || invoice?.status);
  }

  function isInvoicePaid(invoice: any) {
      return ['paid', 'Paid'].includes(invoice?.status_tagihan || invoice?.status);
  }

  function hasVerifiedPayment(invoice: any) {
      return (invoice?.payments || []).some((payment: any) => payment.status === 'verified');
  }

  function canPayInvoice(invoice: any) {
      return !isInvoiceCancelled(invoice) && getRemainingPayment(invoice) > 0;
  }

  function canEditInvoice(invoice: any) {
      return !isInvoiceCancelled(invoice) && !hasVerifiedPayment(invoice);
  }

  function canCancelInvoice(invoice: any) {
      return !isInvoiceCancelled(invoice) && !hasVerifiedPayment(invoice);
  }

//   const selectedJob = eligibleJobTickets.find((ticket) => {
//       return ticket.id === Number(createInvoiceForm.data.pesanan_id);
//   });

//   const availableCategories = selectedJob?.available_invoice_categories || [];

//   useEffect(() => {
//       if (!selectedJob) {
//           createInvoiceForm.setData('total_tagihan', 0);
//           return;
//       }

//       const selectedCategory = availableCategories.find((category) => {
//           return category.value === createInvoiceForm.data.kategori_invoice;
//       });

//       createInvoiceForm.setData(
//           'total_tagihan',
//           Number(selectedCategory?.default_amount || 0)
//       );
//   }, [
//       createInvoiceForm.data.pesanan_id,
//       createInvoiceForm.data.kategori_invoice,
//   ]);

//   const submitCreateInvoice = (e: React.FormEvent) => {
//     e.preventDefault();

//     createInvoiceForm.post('/invoices', {
//         preserveScroll: true,
//         onSuccess: () => {
//             setCreateOpen(false);
//             createInvoiceForm.reset();
//         },
//     });
//   };

  const openDetail = (invoice: Invoice) => {
      setSelectedInvoice(invoice);
      setDetailOpen(true);
  };

  const openPayment = (invoice: Invoice) => {
      setSelectedInvoice(invoice);
      setPaymentDialogMode('create');
      setEditingPayment(null);
      paymentForm.reset();
      paymentForm.setData('jumlah_bayar', getRemainingPayment(invoice));
      setPaymentOpen(true);
  };

  const submitPayment = (e: React.FormEvent) => {
      e.preventDefault();

      if (!selectedInvoice) return;

      paymentForm.post(`/invoices/${selectedInvoice.id}/payments`, {
          preserveScroll: true,
          forceFormData: true,
          onSuccess: () => {
              setPaymentOpen(false);
              paymentForm.reset();
          },
      });
  };

  const openEditPayment = (payment: any) => {
      setEditingPayment(payment);
      setPaymentDialogMode('edit');

      paymentForm.setData({
          tgl_bayar: payment.tgl_bayar || payment.date || '',
          jumlah_bayar: Number(payment.jumlah_bayar || payment.amount || 0),
          metode_pembayaran: payment.metode_pembayaran || payment.method || '',
          bukti_transfer: null,
          catatan_finance: payment.catatan_finance || '',
      });

      setPaymentOpen(true);
  };

  const updatePayment = (e: React.FormEvent) => {
      e.preventDefault();

      if (!editingPayment) return;

      paymentForm.post(`/payments/${editingPayment.id}`, {
          preserveScroll: true,
          forceFormData: true,
          method: 'patch',
          onSuccess: () => {
              setPaymentOpen(false);
              setEditingPayment(null);
              paymentForm.reset();
          },
      });
  };

  const verifyPayment = (paymentId: number) => {
      router.patch(
          `/payments/${paymentId}/verify`,
          {},
          {
              preserveScroll: true,
              onSuccess: () => {
                  setDetailOpen(false);
              },
          },
      );
  };

  const rejectPayment = (paymentId: number) => {
      rejectPaymentForm.patch(`/payments/${paymentId}/reject`, {
          preserveScroll: true,
          onSuccess: () => {
              setRejectPaymentId(null);
              rejectPaymentForm.reset();
          },
      });
  };

  const deletePayment = (payment: any) => {
      router.delete(`/payments/${payment.id}`, {
          preserveScroll: true,
      });
  };

  const openEditInvoice = (invoice: Invoice) => {
      setSelectedInvoice(invoice);

      editInvoiceForm.setData({
          title: invoice.title || '',
          total_tagihan: Number(invoice.total_tagihan || 0),
          tgl_jatuh_tempo: invoice.tgl_jatuh_tempo || '',
      });

      setEditInvoiceOpen(true);
  };

  const updateInvoice = (e: React.FormEvent) => {
      e.preventDefault();

      if (!selectedInvoice) return;

      editInvoiceForm.patch(`/invoices/${selectedInvoice.id}`, {
          preserveScroll: true,
          onSuccess: () => {
              setEditInvoiceOpen(false);
              editInvoiceForm.reset();
          },
      });
  };

  const cancelInvoice = (invoice: Invoice) => {
      if (!confirm('Batalkan invoice ini?')) return;

      router.patch(
          `/invoices/${invoice.id}/cancel`,
          {},
          {
              preserveScroll: true,
              onSuccess: () => {
                  setDetailOpen(false);
              },
          },
      );
  };

  const filteredInvoices = useMemo(() => {
      return invoices.filter((invoice) => {
          if (categoryFilter !== 'all' && invoice.kategori_invoice !== categoryFilter) {
              return false;
          }

          if (statusFilter !== 'all' && invoice.status_tagihan !== statusFilter) {
              return false;
          }

          return true;
      });
  }, [invoices, categoryFilter, statusFilter]);

  const statusBadge = (status: string) => {
      const styles: Record<string, string> = {
          unpaid: 'bg-amber-100 text-amber-700',
          partially_paid: 'bg-cyan-100 text-cyan-800',
          paid: 'bg-emerald-100 text-emerald-800',
          cancelled: 'bg-slate-100 text-slate-700',
      };

      const labels: Record<string, string> = {
          unpaid: 'Belum Lunas',
          partially_paid: 'Sebagian',
          paid: 'Lunas',
          cancelled: 'Dibatalkan',
      };

      return (
          <Badge className={styles[status] ?? 'bg-slate-100 text-slate-700'}>
              {labels[status] ?? status}
          </Badge>
      );
    };

  const columns: DataTableColumn<Invoice>[] = [
      {
          header: 'Invoice',
          accessor: 'no_invoice',
          cell: (row) => (
              <button
                  type="button"
                  onClick={() => openDetail(row)}
                  className="font-medium text-blue-600 hover:underline"
              >
                  {row.no_invoice}
              </button>
          ),
      },
      {
          header: 'Purchase Order',
          accessor: 'no_job_ticket',
          cell: (row) => (
              <div>
                  <p className="font-medium text-slate-900">
                      {row.jobTicket?.no_job_ticket || '-'}
                  </p>
                  <p className="text-xs text-slate-500">
                      {row.jobTicket?.customer?.company || row.jobTicket?.customer?.name || '-'}
                  </p>
              </div>
          ),
      },
      {
          header: 'Kategori',
          accessor: 'kategori_invoice',
          cell: (row) => (
              <Badge>
                  {row.kategori_invoice === 'sample' ? 'Sample' : 'Production'}
              </Badge>
          ),
      },
      {
          header: 'Total',
          accessor: 'total_tagihan',
          cell: (row) => (
              <span className="font-semibold">
                  {formatCurrency(Number(row.total_tagihan || 0))}
              </span>
          ),
      },
      {
          header: 'Status',
          accessor: 'status_tagihan',
          cell: (row) => statusBadge(row.status_tagihan as any),
      },
      {
          header: 'Due Date',
          accessor: 'tgl_jatuh_tempo',
          cell: (row) => row.tgl_jatuh_tempo || '-',
      },
      {
          header: 'Actions',
          accessor: 'id',
          cell: (row) => (
              <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => openDetail(row)}>
                      Detail
                  </Button>

                  {canPayInvoice(row) && (
                      <Button size="sm" onClick={() => openPayment(row)}>
                          Bayar
                      </Button>
                  )}
              </div>
          ),
      },
  ];

  return (
    <>
      <Head title="Invoices & Payments" />

      <div className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                      Invoices & Payments
                  </p>

                  <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
                      Invoice Management
                  </h1>

                  <p className="max-w-2xl text-sm leading-6 text-slate-500">
                      Kelola invoice sample dan production, input payment,
                      verify payment, cancel invoice, dan pantau status pembayaran.
                  </p>
              </div>

              {/* <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                  <DialogTrigger asChild>
                      <Button variant="default" className="inline-flex items-center gap-2">
                          <Plus className="size-4" />
                          Buat Invoice
                      </Button>
                  </DialogTrigger>

                  <DialogContent className="max-w-xl">
                      <DialogHeader>
                          <DialogTitle>Buat Invoice Manual</DialogTitle>
                          <DialogDescription>
                              Buat invoice untuk Purchase Order yang belum memiliki invoice aktif.
                          </DialogDescription>
                      </DialogHeader>

                      <form onSubmit={submitCreateInvoice} className="space-y-4">
                          <div className="grid gap-2">
                              <label className="text-sm font-medium text-slate-700">
                                  Purchase Order
                              </label>

                              <Select
                                  value={createInvoiceForm.data.pesanan_id}
                                  onValueChange={(value) => {
                                      createInvoiceForm.setData('pesanan_id', value);

                                      const ticket = eligibleJobTickets.find((item) => {
                                          return item.id === Number(value);
                                      });

                                      const firstCategory =
                                          ticket?.available_invoice_categories?.[0];

                                      if (firstCategory) {
                                          createInvoiceForm.setData(
                                              'kategori_invoice',
                                              firstCategory.value,
                                          );

                                          createInvoiceForm.setData(
                                              'total_tagihan',
                                              firstCategory.default_amount,
                                          );
                                      }
                                  }}
                              >
                                  <SelectTrigger className="w-full">
                                      <SelectValue placeholder="Pilih Purchase Order" />
                                  </SelectTrigger>

                                  <SelectContent>
                                      {eligibleJobTickets.length === 0 ? (
                                          <SelectItem value="empty" disabled>
                                              Tidak ada Purchase Order eligible
                                          </SelectItem>
                                      ) : (
                                          eligibleJobTickets.map((ticket) => (
                                              <SelectItem
                                                  key={ticket.id}
                                                  value={String(ticket.id)}
                                              >
                                                  {ticket.no_job_ticket} · {ticket.customer}
                                              </SelectItem>
                                          ))
                                      )}
                                  </SelectContent>
                              </Select>

                              <InputError message={createInvoiceForm.errors.pesanan_id} />
                          </div>

                          <div className="grid gap-2">
                              <label className="text-sm font-medium text-slate-700">
                                  Kategori Invoice
                              </label>

                              <Select
                                  value={createInvoiceForm.data.kategori_invoice}
                                  disabled={!selectedJob}
                                  onValueChange={(value) => {
                                      createInvoiceForm.setData('kategori_invoice', value);

                                      const category = availableCategories.find((item) => {
                                          return item.value === value;
                                      });

                                      if (category) {
                                          createInvoiceForm.setData(
                                              'total_tagihan',
                                              category.default_amount,
                                          );
                                      }
                                  }}
                              >
                                  <SelectTrigger className="w-full">
                                      <SelectValue placeholder="Pilih kategori" />
                                  </SelectTrigger>

                                  <SelectContent>
                                      {availableCategories.map((category) => (
                                          <SelectItem
                                              key={category.value}
                                              value={category.value}
                                          >
                                              {category.label}
                                          </SelectItem>
                                      ))}
                                  </SelectContent>
                              </Select>

                              <InputError message={createInvoiceForm.errors.kategori_invoice} />
                          </div>

                          <div className="grid gap-2">
                              <label className="text-sm font-medium text-slate-700">
                                  Judul Invoice
                              </label>

                              <Input
                                  value={createInvoiceForm.data.title}
                                  onChange={(event) =>
                                      createInvoiceForm.setData('title', event.target.value)
                                  }
                                  placeholder="Opsional"
                              />
                          </div>

                          <div className="grid gap-2">
                              <label className="text-sm font-medium text-slate-700">
                                  Total Tagihan
                              </label>
                              <FormattedNumberInput
                                    value={createInvoiceForm.data.total_tagihan}
                                    onValueChange={(value) => createInvoiceForm.setData('total_tagihan', value)}
                                    placeholder='cth: 35.000'
                                />

                              <InputError message={createInvoiceForm.errors.total_tagihan} />
                          </div>

                          <div className="grid gap-2">
                              <label className="text-sm font-medium text-slate-700">
                                  Jatuh Tempo
                              </label>

                              <Input
                                  type="date"
                                  value={createInvoiceForm.data.tgl_jatuh_tempo}
                                  onChange={(event) =>
                                      createInvoiceForm.setData(
                                          'tgl_jatuh_tempo',
                                          event.target.value,
                                      )
                                  }
                              />
                          </div>

                          <div className="rounded-xl border bg-slate-50 p-4">
                              <div className="flex items-center justify-between text-sm text-slate-600">
                                  <span>Estimasi Total</span>
                                  <span className="font-semibold text-slate-900">
                                      {formatCurrency(
                                          Number(createInvoiceForm.data.total_tagihan || 0),
                                      )}
                                  </span>
                              </div>

                              <p className="mt-2 text-xs text-slate-500">
                                  Invoice hanya dapat dibuat untuk kategori yang belum memiliki invoice aktif.
                              </p>
                          </div>

                          <DialogFooter>
                              <Button
                                  type="button"
                                  variant="secondary"
                                  onClick={() => setCreateOpen(false)}
                              >
                                  Batal
                              </Button>

                              <Button
                                  type="submit"
                                  disabled={
                                      createInvoiceForm.processing ||
                                      !createInvoiceForm.data.pesanan_id ||
                                      !createInvoiceForm.data.kategori_invoice ||
                                      Number(createInvoiceForm.data.total_tagihan) <= 0
                                  }
                              >
                                  Simpan Invoice
                              </Button>
                          </DialogFooter>
                      </form>
                  </DialogContent>
              </Dialog> */}
          </div>

          <Card>
              <CardContent className="space-y-4">
                  <div className="grid gap-3 md:grid-cols-3">
                      <div className="grid gap-2">
                          <label className="text-sm font-medium text-slate-700">
                              Filter Kategori
                          </label>

                          <Select
                              value={categoryFilter}
                              onValueChange={(value) =>
                                  setCategoryFilter(value as typeof categoryFilter)
                              }
                          >
                              <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Pilih kategori" />
                              </SelectTrigger>

                              <SelectContent>
                                  <SelectItem value="all">All</SelectItem>
                                  <SelectItem value="sample">Sample</SelectItem>
                                  <SelectItem value="produksi">Production</SelectItem>
                              </SelectContent>
                          </Select>
                      </div>

                      <div className="grid gap-2">
                          <label className="text-sm font-medium text-slate-700">
                              Filter Status
                          </label>

                          <Select
                              value={statusFilter}
                              onValueChange={(value) =>
                                  setStatusFilter(value as typeof statusFilter)
                              }
                          >
                              <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Pilih status" />
                              </SelectTrigger>

                              <SelectContent>
                                  <SelectItem value="all">All</SelectItem>
                                  <SelectItem value="unpaid">Belum Lunas</SelectItem>
                                  <SelectItem value="partially_paid">Sebagian</SelectItem>
                                  <SelectItem value="paid">Lunas</SelectItem>
                                  <SelectItem value="cancelled">Dibatalkan</SelectItem>
                              </SelectContent>
                          </Select>
                      </div>
                  </div>

                  <DataTable
                      columns={columns}
                      data={filteredInvoices}
                      searchKeys={['no_invoice', 'no_invoice']}
                      searchPlaceholder="Cari invoice / Purchase Order"
                  />
              </CardContent>
          </Card>
      </div>

      <InvoiceDetailSheet
          open={detailOpen}
          onOpenChange={setDetailOpen}
          invoice={selectedInvoice}
          canPay={selectedInvoice ? canPayInvoice(selectedInvoice) : false}
          canEdit={selectedInvoice ? canEditInvoice(selectedInvoice) : false}
          canCancel={selectedInvoice ? canCancelInvoice(selectedInvoice) : false}
          rejectPaymentId={rejectPaymentId}
          rejectPaymentForm={rejectPaymentForm}
          setRejectPaymentId={setRejectPaymentId}
          onPay={openPayment}
          onEdit={openEditInvoice}
          onCancel={cancelInvoice}
          onVerifyPayment={verifyPayment}
          onRejectPayment={rejectPayment}
          onEditPayment={openEditPayment}
          onDeletePayment={deletePayment}
      />

      <PaymentDialog
          open={paymentOpen}
          onOpenChange={(open) => {
              setPaymentOpen(open);

              if (!open) {
                  setEditingPayment(null);
                  paymentForm.reset();
              }
          }}
          invoice={selectedInvoice}
          paymentForm={paymentForm}
          remainingPayment={selectedInvoice ? getRemainingPayment(selectedInvoice) : 0}
          onSubmitPayment={
              paymentDialogMode === 'edit' ? updatePayment : submitPayment
          }
          mode={paymentDialogMode}
      />

      <InvoiceEditDialog
          open={editInvoiceOpen}
          onOpenChange={(open) => {
              setEditInvoiceOpen(open);

              if (!open) {
                  editInvoiceForm.reset();
              }
          }}
          invoice={selectedInvoice}
          invoiceForm={editInvoiceForm}
          onSubmit={updateInvoice}
      />
    </>
);
}

Index.layout = (page: ReactNode) => (
  <AppLayout
    title=""
    description="Buat, filter, dan lacak pembayaran invoice produksi berdasarkan milestone produksi dan sample approval."
    information="Finance · Invoice Management"
    actions={null}
    breadcrumbs={[
        {
            title: 'Invoices',
            href: '',
        },
    ]}
  >
    {page}
  </AppLayout>
);
