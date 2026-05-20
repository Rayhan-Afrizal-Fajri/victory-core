import { Head, Link } from "@inertiajs/react";
import { ArrowUpRight} from "lucide-react";
import type { ReactNode } from "react";
import ProgressBar from "@/components/dashboard/progress-bar";
import {
  DataTable
  
} from '@/components/data-table';
import type {DataTableColumn} from '@/components/data-table';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import DeadlineBadge from "@/components/ui/deadline-badge";
import AppLayout from "@/layouts/app-layout";
import jobTickets from "@/routes/job-tickets";
import orderEntry from "@/routes/order-entry";

type Order = {
  id: number;
  no_job_ticket: string;
  produk: string;
  customer: string;
  qty: number;
  deadline: string;
  status_divisi: string;
  acc_sample: boolean;
  progress: number;
};

const orders: Order[] = [
  {
    id: 1,
    no_job_ticket: 'VL-2026-001',
    produk: 'Polo Shirt Event',
    customer: 'PT Maju Bersama',
    qty: 120,
    deadline: '2026-05-18',
    status_divisi: 'Produksi',
    acc_sample: true,
    progress: 75,
  },
  {
    id: 2,
    no_job_ticket: 'VL-2026-002',
    produk: 'Kemeja Lapangan',
    customer: 'CV Sinar Abadi',
    qty: 80,
    deadline: '2026-05-15',
    status_divisi: 'Sample',
    acc_sample: false,
    progress: 25,
  },
  {
    id: 3,
    no_job_ticket: 'VL-2026-003',
    produk: 'Hoodie Komunitas',
    customer: 'Komunitas Vespa',
    qty: 200,
    deadline: '2026-05-13',
    status_divisi: 'Done',
    acc_sample: true,
    progress: 100,
  },
];

const statusBadge = (status: string) => {
  const statusStyles: Record<string, string> = {
    Produksi: 'bg-emerald-100 text-emerald-800',
    Sample: 'bg-orange-100 text-orange-800',
    Quote: 'bg-amber-100 text-amber-800',
    Penawaran: 'bg-slate-100 text-slate-800',
    Finance: 'bg-cyan-100 text-cyan-800',
    Pelunasan: 'bg-emerald-100 text-emerald-800',
    Done: 'bg-slate-100 text-slate-800',
  };

  return (
    <Badge className={`${statusStyles[status] ?? 'bg-slate-100 text-slate-800'}`}>
      {status}
    </Badge>
  );
};

const columns: DataTableColumn<Order>[] = [
  {
    header: 'Job Ticket',
    accessor: 'no_job_ticket',

    className: 'w-[180px]',

    cell: (row) => (
      <div>
        {/* Menggunakan route() bawaan Laravel via Inertia */}
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
    header: 'Customer / Produk',
    accessor: 'produk',

    cell: (row) => (
      <div className="space-y-1">
        <p className="font-medium text-slate-700">
          {row.produk}
        </p>

        <p className="text-xs text-slate-400">
          {row.customer}
        </p>
      </div>
    ),
  },

  {
    header: 'Qty',
    accessor: 'qty',
    className: 'w-[100px]',
    cell: (row) => (
      <span className="font-medium">
        {row.qty} pcs
      </span>
    ),
  },

  {
    header: 'Status',
    accessor: 'status_divisi',
    cell: (row) => (
      statusBadge(row.status_divisi)
    ),
  },

  {
    header: 'ACC Sample',
    accessor: 'acc_sample',
    cell: (row) => (
      <span
        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
          row.acc_sample
            ? 'bg-emerald-100 text-emerald-700'
            : 'bg-amber-100 text-amber-700'
        }`}
      >
        {row.acc_sample ? 'ACC' : 'Pending'}
      </span>
    ),
  },

  {
    header: 'Progress',
    accessor: 'progress',
    className: 'w-[220px]',
    cell: (row) => (
      <ProgressBar value={row.progress} showPercentage={true} />
    ),
  },

  {
    header: 'Deadline',
    accessor: 'deadline',
    cell: (row) => (
      <DeadlineBadge deadline={row.deadline} />
    ),
  },
];




export default function Index({ orders }: { orders: Order[] }) {
    return (
        <>
            <Head title="Job Tickets" />
            <DataTable
                columns={columns}
                data={orders}
                searchKeys={['no_job_ticket', 'customer']}
            />

        </>
    )
}

Index.layout = (page: ReactNode) => {
  return (
    <AppLayout
        title="Job Tickets"
        description="Pilih tiket untuk membuka digital checklist produksi."
        information="Production · All Tickets"
        breadcrumbs={[
              {
                  title: 'Job Tickets',
                  href: jobTickets.index(), // Atau menggunakan objek route Anda jika berbeda
              },
          ]}

        actions={
            <Link href={orderEntry.index()} prefetch>
              <Button variant="default" className="hidden sm:inline-flex cursor-pointer">
                Buat Pesanan Baru
                <ArrowUpRight className="size-4" />
              </Button>
            </Link>
        }
    >
        {page}
    </AppLayout>
)
};