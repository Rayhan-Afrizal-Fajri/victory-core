import { Head, Link, router } from "@inertiajs/react";
import { ArrowUpRight, Edit, Trash2, Printer } from "lucide-react";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import ProgressBar from "@/components/dashboard/progress-bar";
import { DataTable } from '@/components/data-table';
import type { DataTableColumn } from '@/components/data-table';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DeadlineBadge from "@/components/ui/deadline-badge";
import AppLayout from "@/layouts/app-layout";
import jobTickets from "@/routes/purchase-orders";
import orderEntry from "@/routes/order-entry";
import { toast } from "sonner";

type JobTicketData = {
  id: number;
  no_job_ticket: string;
  produk: string;
  customer: string;
  qty: number;
  deadline: string;
  status_divisi: string;
  acc_sample: boolean;
  sales_name: string;
  progress: number;
  current_step?: string;
  can_edit: boolean;
  can_delete: boolean;
};

const statusBadge = (status: string) => {
  const statusStyles: Record<string, string> = {
    'Order Entry': 'bg-slate-100 text-slate-800',
    'Penawaran': 'bg-amber-100 text-amber-800',
    'Quote': 'bg-amber-100 text-amber-800',
    'Sample': 'bg-orange-100 text-orange-800',
    'Blanks': 'bg-violet-100 text-violet-800',
    'CSA': 'bg-blue-100 text-blue-800',
    'Finance': 'bg-cyan-100 text-cyan-800',
    'Produksi': 'bg-indigo-100 text-indigo-800',
    'Pelunasan': 'bg-cyan-100 text-cyan-800',
    'Done': 'bg-slate-900 text-white',
    'Cancel': 'bg-red-100 text-red-800',
  };

  return (
    <Badge className={statusStyles[status] ?? 'bg-slate-100 text-slate-800'}>
      {status}
    </Badge>
  );
};

export default function Index({ orders }: { orders: JobTicketData[] }) {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [salesFilter, setSalesFilter] = useState<string>('all');

  const salesOptions = useMemo(() => {
    const list = orders.map((o) => o.sales_name).filter(Boolean);
    return Array.from(new Set(list)).sort();
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return orders.filter((ticket) => {
      if (statusFilter !== 'all') {
        const currentStep = (ticket.current_step || '').toLowerCase();
        const statusDivisi = (ticket.status_divisi || '').toLowerCase();
        const target = statusFilter.toLowerCase();

        if (target === 'done') {
          const isDone = currentStep === 'done' || statusDivisi === 'done' || ticket.progress >= 100;
          if (!isDone) return false;
        } else if (target === 'penawaran') {
          const isQuote =
            currentStep === 'penawaran' ||
            currentStep === 'quote' ||
            statusDivisi === 'penawaran' ||
            statusDivisi === 'quote';
          if (!isQuote) return false;
        } else {
          if (currentStep !== target && statusDivisi !== target) {
            return false;
          }
        }
      }

      if (salesFilter !== 'all') {
        if (ticket.sales_name !== salesFilter) {
          return false;
        }
      }

      return true;
    });
  }, [orders, statusFilter, salesFilter]);

  const deleteJobTicket = (ticket: JobTicketData) => {
    const confirmed = window.confirm(
      `Hapus Purchase Order ${ticket.no_job_ticket} beserta seluruh pesanan di dalamnya? Data yang dihapus tidak dapat dikembalikan.`
    );

    if (!confirmed) return;

    router.delete(jobTickets.destroy(ticket.id).url, {
      preserveScroll: true,
      onSuccess: () => {
        toast.success('Purchase Order berhasil dihapus.');
      },
    });
  };

  const columns: DataTableColumn<JobTicketData>[] = [
    {
      header: 'Purchase Order',
      accessor: 'no_job_ticket',
      className: 'w-[180px]',
      cell: (row) => (
        <div>
          <Link 
            href={jobTickets.show(row.id)} 
            className="font-medium text-blue-600 hover:text-blue-800 hover:underline transition-colors"
          >
            {row.no_job_ticket}
          </Link>
        </div>
      ),
    },
    {
      header: 'Produk / Customer',
      accessor: 'produk',
      cell: (row) => (
        <div className="space-y-1">
          <p className="font-medium text-slate-700 line-clamp-2">
            {row.produk}
          </p>
          <p className="text-xs text-slate-400">
            {row.customer}
          </p>
        </div>
      ),
    },
    {
      header: 'Total Qty',
      accessor: 'qty',
      className: 'w-[100px]',
      cell: (row) => (
        <span className="font-medium">
          {row.qty} pcs
        </span>
      ),
    },
    {
      header: 'Status Global',
      accessor: 'status_divisi',
      cell: (row) => statusBadge(row.current_step ?? 'Order Entry'),
    },
    {
      header: 'Nama Sales',
      accessor: 'sales_name',
      className: 'w-[100px]',
      cell: (row) => (
        <span className="font-medium">
          {row.sales_name}
        </span>
      ),
    },
    // {
    //   header: 'ACC Sample',
    //   accessor: 'acc_sample',
    //   cell: (row) => (
    //     <span
    //       className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
    //         row.acc_sample
    //           ? 'bg-emerald-100 text-emerald-700'
    //           : 'bg-amber-100 text-amber-700'
    //       }`}
    //     >
    //       {row.acc_sample ? 'All ACC' : 'Pending'}
    //     </span>
    //   ),
    // },
    {
      header: 'Avg Progress',
      accessor: 'progress',
      className: 'w-[240px]',
      sortable: false,
      cell: (row) => (
        <div className="space-y-1">
          <ProgressBar value={row.progress} showPercentage={true} />
          <p className="text-xs text-slate-400">
            {row.current_step}
          </p>
        </div>
      ),
    },
    {
      header: 'Deadline',
      accessor: 'deadline',
      className:'w-[125px]',
      cell: (row) => <DeadlineBadge deadline={row.deadline} />,
    },
    {
      header: 'Aksi',
      accessor: 'id',
      className: 'w-[220px]',
      sortable: false,
      cell: (row) => (
        <div className="flex flex-wrap items-center gap-2">
          {/* {row.can_edit && (
          )} */}
          <Link href={orderEntry.edit(row.id).url}>
            <Button type="button" size="sm" variant="outline">
              <Edit className="size-4" /> Edit
            </Button>
          </Link>

          {(row.current_step === 'Done' || row.status_divisi === 'Done' || row.progress >= 100) && (
            <a
              href={`/job-tickets/${row.id}/surat-jalan/print`}
              target="_blank"
              rel="noopener noreferrer"
              title="Cetak Surat Jalan Resmi"
            >
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="gap-1.5 border-blue-200 text-blue-600 hover:bg-blue-50 dark:border-blue-900/60 dark:text-blue-400"
              >
                <Printer className="size-3.5" /> Surat Jalan
              </Button>
            </a>
          )}

          {row.can_delete && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="border-red-200 text-red-600 hover:bg-red-50"
              onClick={() => deleteJobTicket(row)}
            >
              <Trash2 className="size-4" /> Hapus
            </Button>
          )}

          {!row.can_edit && !row.can_delete && row.current_step !== 'Done' && row.status_divisi !== 'Done' && row.progress < 100 && (
            <span className="text-xs text-slate-400">
              Terkunci (Sedang berjalan)
            </span>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <Head title="Purchase Orders" />
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Filter Status
              </label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="Done">Selesai (Done)</SelectItem>
                  <SelectItem value="Produksi">Produksi</SelectItem>
                  <SelectItem value="Order Entry">Order Entry</SelectItem>
                  <SelectItem value="Penawaran">Penawaran / Quote</SelectItem>
                  <SelectItem value="Sample">Sample</SelectItem>
                  <SelectItem value="Blanks">Blanks</SelectItem>
                  <SelectItem value="CSA">CSA</SelectItem>
                  <SelectItem value="Finance">Finance</SelectItem>
                  <SelectItem value="Pelunasan">Pelunasan</SelectItem>
                  <SelectItem value="Cancel">Dibatalkan (Cancel)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Filter Sales
              </label>
              <Select value={salesFilter} onValueChange={setSalesFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih sales" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Sales</SelectItem>
                  {salesOptions.map((sales) => (
                    <SelectItem key={sales} value={sales}>
                      {sales}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DataTable
            columns={columns}
            data={filteredOrders}
            searchKeys={['no_job_ticket', 'customer', 'produk', 'sales_name']}
          />
        </CardContent>
      </Card>
    </>
  );
}

Index.layout = (page: ReactNode) => {
  return (
    <AppLayout
      title="Purchase Order"
      description="Pilih tiket untuk membuka digital checklist dan detail multi-pesanan."
      information="Production · All Tickets"
      breadcrumbs={[
        {
          title: 'Purchase Order',
          href: jobTickets.index(),
        },
      ]}
      actions={
        <Link href={orderEntry.index()} prefetch>
          <Button variant="default" className="hidden sm:inline-flex cursor-pointer">
            Buat Purchase Order Baru
            <ArrowUpRight className="size-4" />
          </Button>
        </Link>
      }
    >
      {page}
    </AppLayout>
  );
};