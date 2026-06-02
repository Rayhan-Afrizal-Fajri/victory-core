import { Head, router } from '@inertiajs/react';
import { BarChart3, TrendingUp, WalletCards } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { formatCurrency } from '@/helpers/format';

type ReportStatus = 'penawaran' | 'sample' | 'produksi' | 'done';

type ReportRow = {
  id: number;
  jobNo: string;
  product: string;
  customer: string;
  status: ReportStatus;
  statusLabel: string;
  qty: number;
  price: number;
  hpp: number;
  revenue: number;
  cost: number;
  gop: number;
  margin: number;
  date: string;
};

type Summary = {
  revenue: number;
  cost: number;
  gop: number;
  qty: number;
  orders: number;
  margin: number;
};

type ChartItem = {
  label: string;
  revenue?: number;
  cost?: number;
  gop?: number;
  margin?: number;
  orders?: number;
  customer?: string;
};

type PageProps = {
  filters: {
    period_type: 'daily' | 'monthly' | 'yearly';
    date: string;
    month: string;
    year: string;
    status: 'all' | ReportStatus;
  };
  rows: ReportRow[];
  summary: Summary;
  charts: {
    period_profitability: ChartItem[];
    top_gop_orders: ChartItem[];
    margin_by_status: ChartItem[];
  };
};

const PERIOD_OPTIONS = [
  { value: 'daily', label: 'Daily' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];

const STATUSES: Array<{ value: ReportStatus | 'all'; label: string }> = [
  { value: 'all', label: 'Semua Status' },
  { value: 'penawaran', label: 'Penawaran' },
  { value: 'sample', label: 'Sample' },
  { value: 'produksi', label: 'Produksi' },
  { value: 'done', label: 'Done' },
];

const STATUS_LABELS: Record<ReportStatus, { label: string; className: string }> = {
  penawaran: { label: 'PENAWARAN', className: 'bg-slate-100 text-slate-700' },
  sample: { label: 'SAMPLE', className: 'bg-amber-100 text-amber-700' },
  produksi: { label: 'PRODUKSI', className: 'bg-sky-100 text-sky-700' },
  done: { label: 'DONE', className: 'bg-emerald-100 text-emerald-700' },
};

function MiniBarChart({
  title,
  description,
  data,
  valueKey,
  formatValue = formatCurrency,
}: {
  title: string;
  description: string;
  data: ChartItem[];
  valueKey: keyof ChartItem;
  formatValue?: (value: number) => string;
}) {
  const maxValue = Math.max(
    ...data.map((item) => Number(item[valueKey] || 0)),
    1,
  );

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm w-full dark:border-slate-700 dark:bg-slate-950">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-900">{title}</p>
          <p className="mt-1 text-xs text-slate-500">{description}</p>
        </div>
        <BarChart3 className="size-5 text-slate-400" />
      </div>

      {data.length === 0 ? (
        <p className="text-sm text-slate-500">Belum ada data.</p>
      ) : (
        <div className="space-y-4">
          {data.map((item) => {
            const value = Number(item[valueKey] || 0);
            const percentage = Math.max((value / maxValue) * 100, 4);

            return (
              <div key={item.label} className="space-y-1">
                <div className="flex justify-between gap-3 text-xs">
                  <span className="font-medium text-slate-700">
                    {item.label}
                  </span>
                  <span className="text-slate-500">
                    {formatValue(value)}
                  </span>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-emerald-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>

                {item.customer && (
                  <p className="text-[11px] text-slate-400">
                    {item.customer}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ProfitabilityTrendChart({
  data,
}: {
  data: ChartItem[];
}) {
  const maxValue = Math.max(
    ...data.flatMap((item) => [
      Number(item.revenue || 0),
      Number(item.cost || 0),
      Number(item.gop || 0),
    ]),
    1,
  );

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2 w-full">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-900">
            Revenue vs HPP vs GOP
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Perbandingan revenue, cost, dan profit berdasarkan periode terpilih.
          </p>
        </div>
        <TrendingUp className="size-5 text-slate-400" />
      </div>

      {data.length === 0 ? (
        <p className="text-sm text-slate-500">Belum ada data.</p>
      ) : (
        <div className="space-y-5">
          {data.map((item) => (
            <div key={item.label} className="space-y-2">
              <div className="text-xs font-medium text-slate-700">
                {item.label}
              </div>

              <ChartMetricBar
                label="Revenue"
                value={Number(item.revenue || 0)}
                maxValue={maxValue}
                className="bg-blue-500"
              />

              <ChartMetricBar
                label="HPP"
                value={Number(item.cost || 0)}
                maxValue={maxValue}
                className="bg-red-400"
              />

              <ChartMetricBar
                label="GOP"
                value={Number(item.gop || 0)}
                maxValue={maxValue}
                className="bg-emerald-500"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ChartMetricBar({
  label,
  value,
  maxValue,
  className,
}: {
  label: string;
  value: number;
  maxValue: number;
  className: string;
}) {
  const percentage = Math.max((value / maxValue) * 100, 3);

  return (
    <div className="grid grid-cols-[70px_1fr_110px] items-center gap-3 text-xs">
      <span className="text-slate-500">{label}</span>

      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full ${className}`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      <span className="text-right font-medium text-slate-700">
        {formatCurrency(value)}
      </span>
    </div>
  );
}

export default function Index({
  filters,
  rows = [],
  summary,
  charts,
}: PageProps) {
  const [periodType, setPeriodType] = useState(filters.period_type || 'monthly');
  const [selectedDate, setSelectedDate] = useState(filters.date);
  const [selectedMonth, setSelectedMonth] = useState(filters.month);
  const [selectedYear, setSelectedYear] = useState(filters.year);
  const [selectedStatus, setSelectedStatus] = useState<'all' | ReportStatus>(filters.status || 'all');

  const applyFilters = () => {
    router.get(
      '/profit-loss-report',
      {
        period_type: periodType,
        date: selectedDate,
        month: selectedMonth,
        year: selectedYear,
        status: selectedStatus,
      },
      {
        preserveState: true,
        preserveScroll: true,
      },
    );
  };

  const resetFilters = () => {
    router.get(
      '/profit-loss-report',
      {
        period_type: 'monthly',
        month: new Date().toISOString().slice(0, 7),
        date: new Date().toISOString().slice(0, 10),
        year: String(new Date().getFullYear()),
        status: 'all',
      },
      {
        preserveState: false,
        preserveScroll: true,
      },
    );
  };

  return (
    <>
      <Head title="Profit & Loss Report" />

        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                  Filter periode & status
                </p>
                <h2 className="text-xl font-semibold text-slate-900">Lihat data berdasarkan periode</h2>
              </div>

              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:grid-cols-[repeat(4,minmax(0,220px))]">
                <div>
                  <Select value={periodType} onValueChange={(value) => setPeriodType(value as 'daily' | 'monthly' | 'yearly')}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Pilih periode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectContent>
                        <SelectGroup>
                            <SelectLabel>Periode</SelectLabel>

                            {PERIOD_OPTIONS.map((option) => (
                            <SelectItem
                                key={option.value}
                                value={option.value}
                            >
                                {option.label}
                            </SelectItem>
                            ))}
                        </SelectGroup>
                        </SelectContent>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  {periodType === 'daily' ? (
                    <Input
                      type="date"
                      value={selectedDate}
                      onChange={(event) => setSelectedDate(event.target.value)}
                    />
                  ) : periodType === 'monthly' ? (
                    <Input
                      type="month"
                      value={selectedMonth}
                      onChange={(event) => setSelectedMonth(event.target.value)}
                    />
                  ) : (
                    <Input
                      type="number"
                      min={2020}
                      max={2030}
                      value={selectedYear}
                      onChange={(event) => setSelectedYear(event.target.value)}
                      placeholder="2026"
                    />
                  )}
                </div>

                <div>
                  <Select value={selectedStatus} onValueChange={(value) => setSelectedStatus(value as 'all' | ReportStatus)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Pilih status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Status</SelectLabel>

                        <SelectItem value="all">
                        Semua Status
                        </SelectItem>

                        {STATUSES
                        .filter((status) => status.value !== 'all')
                        .map((option) => (
                            <SelectItem
                            key={option.value}
                            value={option.value}
                            >
                            {option.label}
                            </SelectItem>
                        ))}
                    </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="outline" className="w-full" onClick={resetFilters}>
                    Reset
                  </Button>

                  <Button className="w-full" onClick={applyFilters}>
                    Terapkan
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Total Revenue</p>
              <p className="mt-4 text-3xl font-semibold tracking-tight text-slate-900">
                {formatCurrency(summary.revenue)}
              </p>
              <p className="mt-2 text-sm text-slate-500">{summary.qty} pcs · {summary.orders} order</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Total HPP</p>
              <p className="mt-4 text-3xl font-semibold tracking-tight text-slate-900">
                {formatCurrency(summary.cost)}
              </p>
              <p className="mt-2 text-sm text-slate-500">Cost of goods</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Gross Operating Profit</p>
              <p className="mt-4 text-3xl font-semibold tracking-tight text-slate-900">
                {formatCurrency(summary.gop)}
              </p>
              <p className="mt-2 text-sm text-slate-500">Revenue - HPP</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Overall Margin</p>
              <p className="mt-4 text-3xl font-semibold tracking-tight text-slate-900">
                {summary.margin.toFixed(1)}%
              </p>
              <p className="mt-2 text-sm text-slate-500">{summary.margin >= 35 ? 'Healthy' : 'Review needed'}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <ProfitabilityTrendChart data={charts.period_profitability || []} />

            <div className="flex gap-4 w-full">
              <MiniBarChart
                title="Top 5 GOP Job Ticket"
                description="Job ticket dengan gross operating profit tertinggi."
                data={charts.top_gop_orders || []}
                valueKey="gop"
              />

              <MiniBarChart
                title="Margin by Status"
                description="Rata-rata margin berdasarkan status workflow."
                data={charts.margin_by_status || []}
                valueKey="margin"
                formatValue={(value) => `${value.toFixed(1)}%`}
              />
            </div>
          </div>

          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-0 text-left text-sm">
                <thead className="bg-slate-50 text-slate-700">
                  <tr>
                    <th className="whitespace-nowrap px-6 py-4 font-semibold">Job No</th>
                    <th className="whitespace-nowrap px-6 py-4 font-semibold">Produk / Customer</th>
                    <th className="whitespace-nowrap px-6 py-4 font-semibold">Status</th>
                    <th className="whitespace-nowrap px-6 py-4 font-semibold">Qty</th>
                    <th className="whitespace-nowrap px-6 py-4 font-semibold">Harga Jual</th>
                    <th className="whitespace-nowrap px-6 py-4 font-semibold">HPP</th>
                    <th className="whitespace-nowrap px-6 py-4 font-semibold">Revenue</th>
                    <th className="whitespace-nowrap px-6 py-4 font-semibold">Cost</th>
                    <th className="whitespace-nowrap px-6 py-4 font-semibold">GOP</th>
                    <th className="whitespace-nowrap px-6 py-4 font-semibold">Margin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {rows.map((row) => {
                    const revenue = row.qty * row.price;
                    const cost = row.qty * row.hpp;
                    const gop = revenue - cost;
                    const margin = revenue ? (gop / revenue) * 100 : 0;

                    return (
                      <tr key={row.id} className="even:bg-slate-50">
                        <td className="px-6 py-4 font-medium text-slate-900">{row.jobNo}</td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-900">{row.product}</div>
                          <div className="text-xs text-slate-500">{row.customer}</div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge className={`${STATUS_LABELS[row.status]?.className ?? 'bg-slate-100 text-slate-700'}`}>
                            {STATUS_LABELS[row.status]?.label ?? row.statusLabel}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-slate-900">{row.qty}</td>
                        <td className="px-6 py-4 text-slate-900">{formatCurrency(row.price)}</td>
                        <td className="px-6 py-4 text-slate-900">{formatCurrency(row.hpp)}</td>
                        <td className="px-6 py-4 font-semibold text-slate-900">{formatCurrency(revenue)}</td>
                        <td className="px-6 py-4 text-slate-900">{formatCurrency(cost)}</td>
                        <td className="px-6 py-4 font-semibold text-emerald-600">{formatCurrency(gop)}</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                            {margin.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
    </>
  );
}

Index.layout = (page: React.ReactNode) => (
    <AppLayout
        title="Profit & Loss Report"
        description="Estimasi profitabilitas per order. GOP = (Harga Jual - HPP) × Qty."
        information="FINANCE · GROSS OPERATING PROFIT"
    >
        {page}
    </AppLayout>
)
