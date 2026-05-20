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
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetDescription
} from '@/components/ui/sheet';
import AppLayout from '@/layouts/app-layout';
import * as invoiceRoute from '@/routes/invoices';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value);
}

type Payment = {
  id: number;
  amount: number;
  method: string;
  reference: string;
  paid_at: string;
};

type JobTicket = {
  id: number;
  no_job_ticket: string;
  customer: string;
  harga_jual_per_pcs: number;
  qty_sample: number;
  total_price: number;
  production_progress: {
    acc_sample: boolean;
  };
};

type Invoice = {
  id: number;
  no_invoice: string;
  no_job_ticket: string;
  customer: string;
  pesanan_id: number;
  billing_type: 'Sample' | 'DP Produksi' | 'Pelunasan';
  total_amount: number;
  status: 'Unpaid' | 'Partially Paid' | 'Paid';
  due_date: string;
  payments: Payment[];
};

const sampleJobTickets: JobTicket[] = [
  {
    id: 1,
    no_job_ticket: 'VL-2026-010',
    customer: 'PT Nusantara Kreasi',
    harga_jual_per_pcs: 85000,
    qty_sample: 5,
    total_price: 18000000,
    production_progress: { acc_sample: true },
  },
  {
    id: 2,
    no_job_ticket: 'VL-2026-011',
    customer: 'CV Rajawali Apparel',
    harga_jual_per_pcs: 65000,
    qty_sample: 4,
    total_price: 9600000,
    production_progress: { acc_sample: false },
  },
  {
    id: 3,
    no_job_ticket: 'VL-2026-012',
    customer: 'PT Kain Indonesia',
    harga_jual_per_pcs: 120000,
    qty_sample: 6,
    total_price: 36000000,
    production_progress: { acc_sample: true },
  },
];

const sampleInvoices: Invoice[] = [
  {
    id: 1,
    no_invoice: 'INV-2026-001',
    no_job_ticket: 'VL-2026-010',
    customer: 'PT Nusantara Kreasi',
    pesanan_id: 1,
    billing_type: 'Sample',
    total_amount: 1275000,
    status: 'Paid',
    due_date: '2026-05-22',
    payments: [
      {
        id: 1,
        amount: 1275000,
        method: 'Transfer BCA',
        reference: 'TRX-5021',
        paid_at: '2026-05-18',
      },
    ],
  },
  {
    id: 2,
    no_invoice: 'INV-2026-002',
    no_job_ticket: 'VL-2026-011',
    customer: 'CV Rajawali Apparel',
    pesanan_id: 2,
    billing_type: 'DP Produksi',
    total_amount: 4800000,
    status: 'Partially Paid',
    due_date: '2026-05-30',
    payments: [
      {
        id: 2,
        amount: 2400000,
        method: 'Cash',
        reference: 'CASH-113',
        paid_at: '2026-05-17',
      },
    ],
  },
  {
    id: 3,
    no_invoice: 'INV-2026-003',
    no_job_ticket: 'VL-2026-012',
    customer: 'PT Kain Indonesia',
    pesanan_id: 3,
    billing_type: 'Pelunasan',
    total_amount: 36000000,
    status: 'Unpaid',
    due_date: '2026-06-10',
    payments: [],
  },
];

const filterOptions = ['All', 'Sample', 'DP Produksi', 'Pelunasan'] as const;
const paymentStatusOptions = ['All', 'Unpaid', 'Partially Paid', 'Paid'] as const;

export default function Index({ invoices = sampleInvoices }: { invoices?: Invoice[] }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [billingTypeFilter, setBillingTypeFilter] = useState<(typeof filterOptions)[number]>('All');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<(typeof paymentStatusOptions)[number]>('All');

  const invoiceForm = useForm({
    pesanan_id: '',
    billing_type: 'Sample',
    percentage: 50,
    total_amount: 0,
    note: '',
  });

  const paymentForm = useForm({
    amount: 0,
    method: 'Transfer BCA',
    reference: '',
  });

  const selectedJob = sampleJobTickets.find((job) => job.id === Number(invoiceForm.data.pesanan_id));

  useEffect(() => {
    if (!selectedJob) {
      invoiceForm.setData('total_amount', 0);

      return;
    }

    if (invoiceForm.data.billing_type === 'Sample') {
      invoiceForm.setData(
        'total_amount',
        selectedJob.harga_jual_per_pcs * selectedJob.qty_sample * 3,
      );

      return;
    }

    if (invoiceForm.data.billing_type === 'DP Produksi') {
      const amount = Math.round(
        selectedJob.total_price * (Number(invoiceForm.data.percentage) / 100),
      );
      invoiceForm.setData('total_amount', amount);

      return;
    }

    invoiceForm.setData('total_amount', selectedJob.total_price);
  }, [invoiceForm.data.billing_type, invoiceForm.data.pesanan_id, invoiceForm.data.percentage, selectedJob]);

  const filteredInvoices = useMemo(() => {
    return invoices
      .filter((invoiceItem) => {
        if (
          billingTypeFilter !== 'All' &&
          invoiceItem.billing_type !== billingTypeFilter
        ) {
          return false;
        }

        if (
          paymentStatusFilter !== 'All' &&
          invoiceItem.status !== paymentStatusFilter
        ) {
          return false;
        }

        return true;
      })
      .map((invoice) => ({ ...invoice }));
  }, [billingTypeFilter, paymentStatusFilter, invoices]);

  const handleInvoiceSubmit = () => {
    invoiceForm.post(invoiceRoute.store().url, {
      preserveScroll: true,
      onSuccess: () => {
        setIsDialogOpen(false);
        invoiceForm.reset();
      },
    });
  };

  const openPaymentSheet = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    paymentForm.reset();
    setPaymentOpen(true);
  };

  const remainingBalance = selectedInvoice
    ? selectedInvoice.total_amount -
      selectedInvoice.payments.reduce((sum, payment) => sum + payment.amount, 0)
    : 0;

  const handlePaymentSubmit = () => {
    if (!selectedInvoice) {
      return;
    }

    if (Number(paymentForm.data.amount) > remainingBalance) {
      return;
    }

    paymentForm.post(`/invoices/${selectedInvoice.id}/payments`, {
      preserveScroll: true,
      onSuccess: () => {
        setPaymentOpen(false);
        paymentForm.reset();
      },
    });
  };

  const statusBadge = (status: Invoice['status']) => {
    const styles: Record<string, string> = {
      Unpaid: 'bg-amber-100 text-amber-700',
      'Partially Paid': 'bg-cyan-100 text-cyan-800',
      Paid: 'bg-emerald-100 text-emerald-800',
    };

    return (
      <Badge className={styles[status]}> {status} </Badge>
    );
  };

  const typeBadge = (type: Invoice['billing_type']) => {
    const styles: Record<string, string> = {
      Sample: 'bg-amber-100 text-amber-800',
      'DP Produksi': 'bg-slate-100 text-slate-800',
      Pelunasan: 'bg-emerald-100 text-emerald-800',
    };

    return <Badge className={styles[type]}>{type}</Badge>;
  };

  const columns: DataTableColumn<Invoice>[] = [
    {
      header: 'Invoice No',
      accessor: 'no_invoice',
      cell: (row) => <span className="font-medium text-slate-900">{row.no_invoice}</span>,
    },
    {
      header: 'Job Ticket',
      accessor: 'no_job_ticket',
      cell: (row) => (
        <div className="space-y-1">
          <span className="font-medium text-slate-900">{row.no_job_ticket}</span>
        </div>
      ),
    },
    {
      header: 'Customer',
      accessor: 'customer',
      cell: (row) => <span className="font-medium text-slate-900">{row.customer}</span>,
    },
    {
      header: 'Billing Type',
      accessor: 'billing_type',
      cell: (row) => typeBadge(row.billing_type),
    },
    {
      header: 'Total Amount',
      accessor: 'total_amount',
      cell: (row) => <span className="font-semibold">{formatCurrency(row.total_amount)}</span>,
    },
    {
      header: 'Payment Status',
      accessor: 'status',
      cell: (row) => statusBadge(row.status),
    },
    {
      header: 'Due Date',
      accessor: 'due_date',
    },
    {
      header: 'Actions',
      accessor: 'id',
      cell: (row) => (
        <Button
          variant="outline"
          size="sm"
          className="px-3"
          onClick={() => openPaymentSheet(row)}
        >
          Bayar
        </Button>
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
              Progressive Billing
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-slate-500">
              Kelola invoice produksi dengan milestone, sample gating, dan pelacakan pembayaran progresif.
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="default" className="inline-flex items-center gap-2">
                <Plus className="size-4" /> Buat Invoice
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Buat Invoice Progresif</DialogTitle>
                <DialogDescription>
                  Pilih Job Ticket dan billing type untuk membuat invoice yang langsung terkait dengan BOM dan gate produksi.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-slate-700">Job Ticket</label>
                  <Select
                    value={String(invoiceForm.data.pesanan_id)}
                    onValueChange={(value) => invoiceForm.setData('pesanan_id', value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Pilih Job Ticket" />
                    </SelectTrigger>
                    <SelectContent>
                      {sampleJobTickets.map((ticket) => (
                        <SelectItem key={ticket.id} value={String(ticket.id)}>
                          {ticket.no_job_ticket} · {ticket.customer}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <InputError message={invoiceForm.errors.pesanan_id as string} />
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-slate-700">Billing Type</label>
                    <Select
                      value={invoiceForm.data.billing_type}
                      onValueChange={(value) => invoiceForm.setData('billing_type', value as Invoice['billing_type'])}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Jenis Billing" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Sample">Sample</SelectItem>
                        <SelectItem value="DP Produksi">DP Produksi</SelectItem>
                        <SelectItem value="Pelunasan">Pelunasan</SelectItem>
                      </SelectContent>
                    </Select>
                    <InputError message={invoiceForm.errors.billing_type as string} />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-slate-700">Jumlah Invoice</label>
                    <Input
                      type="number"
                      value={String(invoiceForm.data.total_amount)}
                      onChange={(event) =>
                        invoiceForm.setData('total_amount', Number(event.target.value))
                      }
                      className="w-full"
                    />
                    <InputError message={invoiceForm.errors.total_amount as string} />
                  </div>
                </div>

                {invoiceForm.data.billing_type === 'DP Produksi' && (
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <label className="text-sm font-medium text-slate-700">Persentase DP</label>
                      <Input
                        type="number"
                        value={String(invoiceForm.data.percentage)}
                        onChange={(event) =>
                          invoiceForm.setData('percentage', Number(event.target.value))
                        }
                        className="w-full"
                      />
                      <p className="text-xs text-slate-500">Default 50% dari total harga order.</p>
                    </div>
                    <div className="grid gap-2">
                      <label className="text-sm font-medium text-slate-700">Status Sample</label>
                      <span className={`rounded-md border px-3 py-2 text-sm ${selectedJob?.production_progress.acc_sample ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                        {selectedJob?.production_progress.acc_sample ? 'ACC Sample' : 'Belum ACC Sample'}
                      </span>
                    </div>
                  </div>
                )}

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between text-sm text-slate-600">
                    <span>Estimasi Jumlah Invoice</span>
                    <span className="font-semibold text-slate-900">{formatCurrency(invoiceForm.data.total_amount)}</span>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    Sample akan otomatis mengambil 3 x harga sample. DP Produksi hanya bisa dibuat setelah gate sample di-ACC.
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button variant="secondary" onClick={() => setIsDialogOpen(false)}>
                  Batal
                </Button>
                <Button
                  onClick={handleInvoiceSubmit}
                  disabled={
                    !invoiceForm.data.pesanan_id ||
                    (invoiceForm.data.billing_type === 'DP Produksi' && !selectedJob?.production_progress.acc_sample)
                  }
                >
                  Simpan Invoice
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-3">
              <div className="grid gap-2">
                <label className="text-sm font-medium text-slate-700">Filter Billing Type</label>
                <Select
                  value={billingTypeFilter}
                  onValueChange={(value) => setBillingTypeFilter(value as typeof billingTypeFilter)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih billing type" />
                  </SelectTrigger>
                  <SelectContent>
                    {filterOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium text-slate-700">Filter Status Pembayaran</label>
                <Select
                  value={paymentStatusFilter}
                  onValueChange={(value) => setPaymentStatusFilter(value as typeof paymentStatusFilter)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih status pembayaran" />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentStatusOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DataTable
              columns={columns}
              data={filteredInvoices}
              searchKeys={['no_invoice', 'no_job_ticket', 'customer']}
              searchPlaceholder="Cari Invoice / Job Ticket / Customer"
            />
          </CardContent>
        </Card>
      </div>

      <Sheet open={paymentOpen} onOpenChange={setPaymentOpen}>
        <SheetContent side="right" className="max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Catat Pembayaran</SheetTitle>
            <SheetDescription>
              Input pembayaran terbaru dan pantau timeline pembayaran untuk invoice.
            </SheetDescription>
          </SheetHeader>

          {selectedInvoice ? (
            <div className="space-y-6 px-4 pb-10">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Invoice</p>
                <h2 className="mt-2 text-xl font-semibold text-slate-900">{selectedInvoice.no_invoice}</h2>
                <p className="text-sm text-slate-600">{selectedInvoice.no_job_ticket} · {selectedInvoice.customer}</p>
                <div className="mt-4 grid gap-2 text-sm text-slate-500">
                  <div className="flex items-center justify-between">
                    <span>Total Tagihan</span>
                    <strong>{formatCurrency(selectedInvoice.total_amount)}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Sisa Pembayaran</span>
                    <strong>{formatCurrency(remainingBalance)}</strong>
                  </div>
                </div>
              </div>

              <div className="grid gap-3">
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-slate-700">Jumlah Pembayaran</label>
                  <Input
                    type="number"
                    value={String(paymentForm.data.amount)}
                    onChange={(event) =>
                      paymentForm.setData('amount', Number(event.target.value))
                    }
                    className="w-full"
                  />
                  <InputError message={paymentForm.errors.amount as string} />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-slate-700">Metode Pembayaran</label>
                  <Select
                    value={paymentForm.data.method}
                    onValueChange={(value) => paymentForm.setData('method', value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Pilih metode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Transfer BCA">Transfer BCA</SelectItem>
                      <SelectItem value="Cash">Cash</SelectItem>
                      <SelectItem value="Gopay">Gopay</SelectItem>
                      <SelectItem value="QRIS">QRIS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-slate-700">Referensi / Nomor Kwitansi</label>
                  <Input
                    value={paymentForm.data.reference}
                    onChange={(event) => paymentForm.setData('reference', event.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-slate-700">Upload Bukti Pembayaran</label>
                  <div className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-6 text-sm text-slate-500">
                    Placeholder upload file untuk bukti transfer / kwitansi.
                  </div>
                </div>
              </div>

              <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                <div className="flex items-center justify-between">
                  <span>Validasi Pembayaran</span>
                  <span className="font-semibold">{formatCurrency(remainingBalance - Number(paymentForm.data.amount))}</span>
                </div>
                {Number(paymentForm.data.amount) > remainingBalance && (
                  <p className="text-sm text-red-600">Jumlah pembayaran tidak boleh melebihi sisa tagihan.</p>
                )}
              </div>

              <div className="space-y-3">
                <p className="text-sm font-semibold text-slate-900">Timeline Pembayaran</p>
                <div className="space-y-3">
                  {selectedInvoice.payments.length === 0 ? (
                    <p className="text-sm text-slate-500">Belum ada pembayaran tercatat.</p>
                  ) : (
                    selectedInvoice.payments.map((payment) => (
                      <div key={payment.id} className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-semibold text-slate-900">{formatCurrency(payment.amount)}</p>
                          <span className="text-xs uppercase tracking-[0.2em] text-slate-500">{payment.paid_at}</span>
                        </div>
                        <p className="text-sm text-slate-600">{payment.method} • {payment.reference}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="secondary" onClick={() => setPaymentOpen(false)}>
                  Tutup
                </Button>
                <Button
                  disabled={
                    Number(paymentForm.data.amount) <= 0 ||
                    Number(paymentForm.data.amount) > remainingBalance
                  }
                  onClick={handlePaymentSubmit}
                >
                  Simpan Pembayaran
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-slate-600">
              Pilih invoice terlebih dahulu untuk mencatat pembayaran.
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}

Index.layout = (page: ReactNode) => (
  <AppLayout
    title=""
    description="Buat, filter, dan lacak pembayaran invoice produksi berdasarkan milestone produksi dan sample approval."
    information="Finance · Invoice Management"
    actions={null}
  >
    {page}
  </AppLayout>
);
