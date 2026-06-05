import { Head, router } from '@inertiajs/react';
import { BarChart3, TrendingUp, WalletCards } from 'lucide-react';
import React, { useMemo, useState } from 'react';
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
type ReportScope = 'sample' | 'production';

type CostBreakdownItem = {
  label: string;
  unit?: string;
  behavior?: string;
  cost_per_pcs: number;
  total: number;
};

type CostBreakdown = {
  materials: {
    bahan: {
      label: string;
      total: number;
      items: CostBreakdownItem[];
    };
    aksesoris: {
      label: string;
      total: number;
      items: CostBreakdownItem[];
    };
  };
  manufacturing: Array<{
    label: string;
    total: number;
    items: CostBreakdownItem[];
  }>;
  material_total: number;
  manufacturing_total: number;
  total: number;
};

type ReportRow = {
  id: string;
  orderId: number;
  jobNo: string;
  product: string;
  customer: string;
  scope: ReportScope;
  scopeLabel: string;
  qty: number;
  price: number;
  hpp: number;
  revenue: number;
  paidRevenue: number;
  cost: number;
  gop: number;
  margin: number;
  date: string;
  costBreakdown: CostBreakdown;
};

type Summary = {
  revenue: number;
  paidRevenue: number;
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
    scope: 'all' | ReportScope;
  };
  rows: ReportRow[];
  summary: Summary;
  charts: {
    period_profitability: ChartItem[];
    top_gop_orders: ChartItem[];
    margin_by_scope: ChartItem[];
  };
};

const PERIOD_OPTIONS = [
  { value: 'daily', label: 'Daily' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];

const SCOPES: Array<{ value: ReportScope | 'all'; label: string }> = [
  { value: 'all', label: 'Semua Scope' },
  { value: 'sample', label: 'Sample' },
  { value: 'production', label: 'Production' },
];

const SCOPE_LABELS: Record<ReportScope, { label: string; className: string }> = {
  sample: { label: 'SAMPLE', className: 'bg-amber-100 text-amber-700' },
  production: { label: 'PRODUCTION', className: 'bg-sky-100 text-sky-700' },
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
  // const [selectedStatus, setSelectedStatus] = useState<'all' | ReportStatus>(filters.status || 'all');
  const [selectedScope, setSelectedScope] = useState<'all' | ReportScope>(
    filters.scope || 'all',
  );

  const applyFilters = () => {
    router.get(
      '/profit-loss-report',
      {
        period_type: periodType,
        date: selectedDate,
        month: selectedMonth,
        year: selectedYear,
        scope: selectedScope,
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
        scope: 'all',
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
                  Filter periode & scope
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
                            <SelectItem key={option.value} value={option.value}>
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
                  <Select
                    value={selectedScope}
                    onValueChange={(value) => setSelectedScope(value as 'all' | ReportScope)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Pilih scope" />
                    </SelectTrigger>

                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Scope P&L</SelectLabel>

                        {SCOPES.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
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
                title="Margin by Scope"
                description="Rata-rata margin berdasarkan sample dan production."
                data={charts.margin_by_scope || []}
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
                    <th className="whitespace-nowrap px-6 py-4 font-semibold">Scope</th>
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

                    return (
                      <React.Fragment key={row.id}>
                        <tr className="even:bg-slate-50">
                          <td className="px-6 py-4 font-medium text-slate-900">{row.jobNo}</td>
                          <td className="px-6 py-4">
                            <div className="font-semibold text-slate-900">{row.product}</div>
                            <div className="text-xs text-slate-500">{row.customer}</div>
                          </td>
                          <td className="px-6 py-4">
                            <Badge className={`${SCOPE_LABELS[row.scope]?.className ?? 'bg-slate-100 text-slate-700'}`}>
                              {SCOPE_LABELS[row.scope]?.label ?? row.scopeLabel}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-slate-900">{row.qty}</td>
                          <td className="px-6 py-4 text-slate-900">{formatCurrency(row.price)}</td>
                          <td className="px-6 py-4 text-slate-900">{formatCurrency(row.hpp)}</td>
                          <td className="px-6 py-4 font-semibold text-slate-900">
                            {formatCurrency(row.revenue)}
                          </td>
                          <td className="px-6 py-4 text-slate-900">
                            {formatCurrency(row.cost)}
                          </td>
                          <td className="px-6 py-4 font-semibold text-emerald-600">
                            {formatCurrency(row.gop)}
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                              {row.margin.toFixed(1)}%
                            </span>
                          </td>
                        </tr>

                        <tr key={`${row.id}-detail`} className="bg-white">
                          <td colSpan={10} className="px-6 pb-5">
                            <CostBreakdownPanel row={row} />
                          </td>
                        </tr>
                      </React.Fragment>
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

function CostBreakdownPanel({ row }: { row: ReportRow }) {
  const materials = row.costBreakdown?.materials;
  const manufacturing = row.costBreakdown?.manufacturing || [];

  return (
    <div className="rounded-xl border bg-slate-50 p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
        Detail Biaya
      </p>

      <div className="grid gap-4 lg:grid-cols-3">
        <CostGroup
          title="Bahan"
          total={materials?.bahan?.total || 0}
          items={materials?.bahan?.items || []}
        />

        <CostGroup
          title="Aksesoris"
          total={materials?.aksesoris?.total || 0}
          items={materials?.aksesoris?.items || []}
        />

        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase text-slate-500">
            Manufaktur
          </p>

          {manufacturing.length === 0 ? (
            <p className="text-xs text-slate-500">Belum ada biaya manufaktur.</p>
          ) : (
            manufacturing.map((group) => (
              <div key={group.label} className="rounded-lg bg-white p-3">
                <div className="flex justify-between gap-3 text-xs">
                  <span className="font-semibold text-slate-700">
                    {group.label}
                  </span>
                  <span className="font-semibold text-slate-900">
                    {formatCurrency(group.total)}
                  </span>
                </div>

                <div className="mt-2 space-y-1">
                  {group.items.map((item) => (
                    <div
                      key={`${group.label}-${item.label}-${item.total}`}
                      className="flex justify-between gap-3 text-[11px] text-slate-500"
                    >
                      <span>
                        {item.label}
                        {item.behavior === 'costing_only' ? ' · costing only' : ''}
                      </span>
                      <span>{formatCurrency(item.total)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <MiniCostBox
          label="Total Material"
          value={row.costBreakdown.material_total}
        />
        <MiniCostBox
          label="Total Manufaktur"
          value={row.costBreakdown.manufacturing_total}
        />
        <MiniCostBox
          label="Total Cost"
          value={row.costBreakdown.total}
        />
      </div>
    </div>
  );
}

function CostGroup({
  title,
  total,
  items,
}: {
  title: string;
  total: number;
  items: CostBreakdownItem[];
}) {
  return (
    <div className="rounded-lg bg-white p-3">
      <div className="flex justify-between gap-3 text-xs">
        <span className="font-semibold uppercase text-slate-500">{title}</span>
        <span className="font-semibold text-slate-900">
          {formatCurrency(total)}
        </span>
      </div>

      <div className="mt-2 space-y-1">
        {items.length === 0 ? (
          <p className="text-[11px] text-slate-500">Belum ada item.</p>
        ) : (
          items.map((item) => (
            <div
              key={`${title}-${item.label}-${item.total}`}
              className="flex justify-between gap-3 text-[11px] text-slate-500"
            >
              <span>{item.label}</span>
              <span>{formatCurrency(item.total)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function MiniCostBox({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-lg border bg-white p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 font-semibold text-slate-900">
        {formatCurrency(value)}
      </p>
    </div>
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
