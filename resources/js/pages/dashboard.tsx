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
    Design: 'bg-blue-500/15 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
    Quotation: 'bg-amber-500/15 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
    'Sample Payment': 'bg-cyan-500/15 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-400',
    Purchasing: 'bg-violet-500/15 text-violet-700 dark:bg-violet-500/20 dark:text-violet-400',
    Sample: 'bg-orange-500/15 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400',
    'Production Payment': 'bg-cyan-500/15 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-400',
    Produksi: 'bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
    Packing: 'bg-purple-500/15 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400',
    Delivery: 'bg-green-500/15 text-green-700 dark:bg-green-500/20 dark:text-green-400',
    Done: 'bg-muted text-muted-foreground',
  };

  return (
    <Badge className={`border-transparent rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusStyles[status] ?? 'bg-muted text-muted-foreground'}`}>
      {status}
    </Badge>
  );
};

const getSummaryIcon = (type: SummaryCardData['type']) => {
  if (type === 'total') {
    return {
      icon: <Layers className="size-4" />,
      iconClassName: 'bg-blue-500/15 text-blue-600 dark:bg-blue-500/25 dark:text-blue-400',
    };
  }

  if (type === 'active') {
    return {
      icon: <Package className="size-4" />,
      iconClassName: 'bg-amber-500/15 text-amber-600 dark:bg-amber-500/25 dark:text-amber-400',
    };
  }

  if (type === 'money') {
    return {
      icon: <TrendingUp className="size-4" />,
      iconClassName: 'bg-emerald-500/15 text-emerald-600 dark:bg-emerald-500/25 dark:text-emerald-400',
    };
  }

  return {
    icon: <AlertTriangle className="size-4" />,
    iconClassName: 'bg-red-500/15 text-red-600 dark:bg-red-500/25 dark:text-red-400',
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
        <div className="space-y-0.5">
          <p className="font-semibold text-foreground">{row.customer}</p>
          <p className="text-xs text-muted-foreground">{row.product}</p>
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
              ? 'text-destructive font-bold'
              : 'text-foreground/90'
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
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Halo, {user.name} 👋</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
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
