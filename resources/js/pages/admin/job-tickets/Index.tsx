import { Head, Link, router } from "@inertiajs/react";
import { ArrowUpRight, Edit, Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import ProgressBar from "@/components/dashboard/progress-bar";
import { DataTable } from '@/components/data-table';
import type { DataTableColumn } from '@/components/data-table';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import DeadlineBadge from "@/components/ui/deadline-badge";
import AppLayout from "@/layouts/app-layout";
import jobTickets from "@/routes/job-tickets";
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
      className: 'w-[180px]',
      sortable: false,
      cell: (row) => (
        <div className="flex items-center gap-2">
          {/* {row.can_edit && (
          )} */}
          <Link href={orderEntry.edit(row.id).url}>
            <Button type="button" size="sm" variant="outline">
              <Edit className="size-4" /> Edit
            </Button>
          </Link>

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

          {!row.can_edit && !row.can_delete && (
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
      <DataTable
        columns={columns}
        data={orders}
        searchKeys={['no_job_ticket', 'customer', 'produk']}
      />
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