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
import { useCan } from '@/hooks/use-can';

type SummaryCardData = {
  key: string;
  title: string;
  value: string | number;
  type: 'total' | 'active' | 'money' | 'warning';
};

type DeadlineOrder = {
  id: number;
  ticket: string;
  customer: string;
  product: string;
  status: string;
  deadline?: string;
  daysLeft: string;
};

type DashboardProps = {
  dashboard: {
    summaryCards: SummaryCardData[];
    statusItems: StatusDistributionItem[];
    deadlineOrders: DeadlineOrder[];
  };
};

const statusBadge = (status: string) => {
  const statusStyles: Record<string, string> = {
    Design: 'bg-blue-100 text-blue-800',
    Quotation: 'bg-amber-100 text-amber-800',
    'Sample Payment': 'bg-cyan-100 text-cyan-800',
    Purchasing: 'bg-violet-100 text-violet-800',
    Sample: 'bg-orange-100 text-orange-800',
    'Production Payment': 'bg-cyan-100 text-cyan-800',
    Produksi: 'bg-emerald-100 text-emerald-800',
    Packing: 'bg-purple-100 text-purple-800',
    Delivery: 'bg-green-100 text-green-800',
    Done: 'bg-slate-100 text-slate-800',
  };

  return (
    <Badge className={`${statusStyles[status] ?? 'bg-slate-100 text-slate-800'}`}>
      {status}
    </Badge>
  );
};

const getSummaryIcon = (type: SummaryCardData['type']) => {
  if (type === 'total') {
    return {
      icon: <Layers className="size-4" />,
      iconClassName: 'bg-blue-100/45 text-blue-600',
    };
  }

  if (type === 'active') {
    return {
      icon: <Package className="size-4" />,
      iconClassName: 'bg-amber-100/45 text-amber-800',
    };
  }

  if (type === 'money') {
    return {
      icon: <TrendingUp className="size-4" />,
      iconClassName: 'bg-emerald-100/45 text-emerald-800',
    };
  }

  return {
    icon: <AlertTriangle className="size-4" />,
    iconClassName: 'bg-red-100/45 text-red-700',
  };
};

export default function Dashboard({ dashboard }: DashboardProps) {
  const { user } = usePage().props as any;
  const can = useCan();

  const summaryCards = dashboard?.summaryCards || [];
  const statusItems = dashboard?.statusItems || [];
  const tableData = dashboard?.deadlineOrders || [];  

  const columns: DataTableColumn<DeadlineOrder>[] = [
    {
      header: 'No. Purchase Order',
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
          className={`font-semibold ${
            row.daysLeft.includes('Terlambat') || row.daysLeft === 'Hari ini' || row.daysLeft.includes('1 hari') || row.daysLeft.includes('2 hari')
              ? 'text-red-600'
              : 'text-slate-700'
          }`}
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
              {can('dashboard.admin') ? 'Ringkasan operasional dan progres produksi.' : 'Ringkasan pesanan Anda.'}
            </p>
          </div>
        </div>

        {can('order_entry.create') && (
          <Link href={orderEntry.index()} prefetch>
            <Button variant="default" className="hidden sm:inline-flex cursor-pointer">
              Buat Pesanan Baru
              <ArrowUpRight className="size-4" />
            </Button>
          </Link>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {summaryCards.map((card) => {
          const iconData = getSummaryIcon(card.type);

          return (
            <SummaryCard
              key={card.key}
              title={card.title}
              value={card.value}
              icon={iconData.icon}
              iconClassName={iconData.iconClassName}
            />
          );
        })}
      </div>

      <div className="flex gap-4 flex-col xl:flex-row">
        <StatusDistribution items={statusItems} />
        <DataTable
          title={can('dashboard.admin') ? "Deadline Terdekat" : "Pesanan Anda"}
          description="5 pesanan paling urgent"
          columns={columns}
          data={tableData}
          searchKeys={['ticket', 'customer', 'product', 'status', 'daysLeft']}
          pageSize={5}
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
