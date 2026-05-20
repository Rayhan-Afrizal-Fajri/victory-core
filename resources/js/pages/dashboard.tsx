import { Head, usePage, Link } from '@inertiajs/react';
import { Package, TrendingUp, AlertTriangle, Layers, ArrowUpRight } from 'lucide-react';
import DataTable from '@/components/dashboard/data-table';
import type {DataTableColumn} from '@/components/dashboard/data-table';
import StatusDistribution from '@/components/dashboard/status-distribution';
import type {StatusDistributionItem} from '@/components/dashboard/status-distribution';
import SummaryCard from '@/components/dashboard/summary-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { dashboard } from '@/routes';
import orderEntry from '@/routes/order-entry';

const summaryCards = [
  {
    title: 'Total Pesanan',
    value: 5,
    icon: <Layers className="size-4" />,
    iconClassName: 'bg-blue-100/45 text-blue-600',
  },
  {
    title: 'Pesanan Aktif',
    value: 4,
    icon: <Package className="size-4" />,
    iconClassName: 'bg-amber-100/45 text-amber-800',
  },
  {
    title: 'Total GOP',
    value: 'Rp 49.500.000',
    icon: <TrendingUp className="size-4" />,
    iconClassName: 'bg-emerald-100/45 text-emerald-800',
  },
  {
    title: 'Deadline < 3 hari',
    value: 1,
    icon: <AlertTriangle className="size-4" />,
    iconClassName: 'bg-red-100/45 text-red-700',
  },
];

const statusItems: StatusDistributionItem[] = [
  {
    label: 'Penawaran',
    count: 1,
    progress: 40,
    colorClass: 'bg-slate-900',
    chipClass: 'bg-slate-100 text-slate-700',
  },
  {
    label: 'Quote',
    count: 1,
    progress: 60,
    colorClass: 'bg-amber-500',
    chipClass: 'bg-amber-100 text-amber-700',
  },
  {
    label: 'Sample',
    count: 1,
    progress: 80,
    colorClass: 'bg-orange-500',
    chipClass: 'bg-orange-100 text-orange-700',
  },
  {
    label: 'Blanks',
    count: 0,
    progress: 10,
    colorClass: 'bg-violet-500',
    chipClass: 'bg-violet-100 text-violet-700',
  },
  {
    label: 'CSA',
    count: 0,
    progress: 10,
    colorClass: 'bg-fuchsia-500',
    chipClass: 'bg-fuchsia-100 text-fuchsia-700',
  },
  {
    label: 'Finance',
    count: 0,
    progress: 10,
    colorClass: 'bg-cyan-500',
    chipClass: 'bg-cyan-100 text-cyan-700',
  },
  {
    label: 'Produksi',
    count: 1,
    progress: 70,
    colorClass: 'bg-emerald-500',
    chipClass: 'bg-emerald-100 text-emerald-700',
  },
  {
    label: 'Pelunasan',
    count: 0,
    progress: 30,
    colorClass: 'bg-emerald-700',
    chipClass: 'bg-emerald-100 text-emerald-700',
  },
  {
    label: 'Done',
    count: 1,
    progress: 90,
    colorClass: 'bg-slate-500',
    chipClass: 'bg-slate-100 text-slate-700',
  },
];

const tableData = [
  {
    ticket: 'VL-2026-0002',
    customer: 'Yayasan SMA Negeri 1',
    product: 'Seragam Olahraga (1000 set)',
    status: 'Produksi',
    daysLeft: '2 hari',
  },
  {
    ticket: 'VL-2026-0003',
    customer: 'Komunitas Lari Senayan',
    product: 'Jersey Lari Sublim',
    status: 'Sample',
    daysLeft: '7 hari',
  },
  {
    ticket: 'VL-2026-0001',
    customer: 'PT Adidas Indonesia',
    product: 'Kaos Polo Custom Logo (Cotton Combed 30s)',
    status: 'Quote',
    daysLeft: '14 hari',
  },
  {
    ticket: 'VL-2026-0004',
    customer: 'PT Astra Honda Motor',
    product: 'Jaket Crew Karyawan',
    status: 'Penawaran',
    daysLeft: '30 hari',
  },
  {
    ticket: 'VL-2026-0005',
    customer: 'CV Tekstil Maju',
    product: 'Kaos Polo Bordir',
    status: 'Finance',
    daysLeft: '9 hari',
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

export default function Dashboard() {
    
    const {
        user
    } = usePage().props as any;

  const columns: DataTableColumn<(typeof tableData)[number]>[] = [
    {
      header: 'No. Job Ticket',
      accessor: 'ticket',
      className: 'w-[180px]',
    },
    {
      header: 'Customer / Produk',
      accessor: 'customer',
      cell: (row) => (
        <div className="space-y-1">
          <p className="font-medium text-slate-900">{row.customer}</p>
          <p className="text-sm text-slate-500">{row.product}</p>
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      className: 'w-[140px]',
      cell: (row) => statusBadge(row.status),
    },
    {
      header: 'Day Left',
      accessor: 'daysLeft',
      className: 'w-[120px] text-right',
      cell: (row) => (
        <span
          className={`font-semibold ${row.daysLeft.includes('2 hari') ? 'text-red-600' : 'text-slate-700'}`}
        >
          {row.daysLeft}
        </span>
      ),
    },
  ];

  return (
    <>
      <Head title="Dashboard" />

      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">Halo, {user.name} 👋</h1>
            <p className="text-sm text-slate-500">
              Ringkasan operasional dan progres produksi hari ini.
            </p>
          </div>
        </div>

        <Link href={orderEntry.index()} prefetch>
          <Button variant="default" className="hidden sm:inline-flex cursor-pointer">
            Buat Pesanan Baru
            <ArrowUpRight className="size-4" />
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {summaryCards.map((card) => (
          <SummaryCard
            key={card.title}
            title={card.title}
            value={card.value}
            icon={card.icon}
            iconClassName={card.iconClassName}
          />
        ))}
      </div>

      <div className="flex gap-4 flex-col xl:flex-row">
        <StatusDistribution items={statusItems} />
        <DataTable
          title="Deadline Terdekat"
          description="5 pesanan paling urgent"
          columns={columns}
          data={tableData}
          searchKeys={['ticket', 'customer', 'product', 'status', 'daysLeft']}
          pageSize={4}
        />
      </div>
    </>
  );
}

Dashboard.layout = {
  breadcrumbs: [
    {
      title: 'Dashboard',
      href: dashboard(),
    },
  ],
};
