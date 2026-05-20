import { Head } from '@inertiajs/react';
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

type ReportStatus = 'penawaran' | 'sample' | 'produksi' | 'done';

type ReportRow = {
  id: string;
  jobNo: string;
  product: string;
  customer: string;
  status: ReportStatus;
  qty: number;
  price: number;
  hpp: number;
  date: string;
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

const SAMPLE_ROWS: ReportRow[] = [
  {
    id: '1',
    jobNo: 'VL-2026-001',
    product: 'Kemeja Seragam Kantor',
    customer: 'PT Sinar Mandiri',
    status: 'sample',
    qty: 120,
    price: 185000,
    hpp: 110000,
    date: '2026-05-10',
  },
  {
    id: '2',
    jobNo: 'VL-2026-002',
    product: 'Jersey Running Sublim',
    customer: 'Komunitas Lari Bandung',
    status: 'sample',
    qty: 75,
    price: 135000,
    hpp: 78000,
    date: '2026-05-11',
  },
  {
    id: '3',
    jobNo: 'VL-2026-003',
    product: 'T-Shirt Cotton Combed 30s',
    customer: 'Startup Kopi Nusa',
    status: 'produksi',
    qty: 200,
    price: 89000,
    hpp: 52000,
    date: '2026-05-12',
  },
  {
    id: '4',
    jobNo: 'VL-2026-004',
    product: 'Jaket Almamater',
    customer: 'SMA Negeri 5',
    status: 'penawaran',
    qty: 350,
    price: 245000,
    hpp: 158000,
    date: '2026-05-13',
  },
  {
    id: '5',
    jobNo: 'VL-2026-005',
    product: 'Polo Shirt Lacoste CVC',
    customer: 'Event Organizer Bali Fest',
    status: 'done',
    qty: 60,
    price: 125000,
    hpp: 72000,
    date: '2026-05-14',
  },
];

function formatIDR(value: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value);
}

function getPeriodLabel(value: string) {
  return PERIOD_OPTIONS.find((option) => option.value === value)?.label ?? value;
}

export default function Index() {
  const [periodType, setPeriodType] = useState<'daily' | 'monthly' | 'yearly'>('monthly');
  const [selectedDate, setSelectedDate] = useState('2026-05-14');
  const [selectedMonth, setSelectedMonth] = useState('2026-05');
  const [selectedYear, setSelectedYear] = useState('2026');
  const [selectedStatus, setSelectedStatus] = useState<'all' | ReportStatus>('all');

  const filteredRows = useMemo(() => {
    return SAMPLE_ROWS.filter((row) => {
      if (selectedStatus !== 'all' && row.status !== selectedStatus) {
        return false;
      }

      if (periodType === 'daily') {
        return row.date === selectedDate;
      }

      if (periodType === 'monthly') {
        return row.date.startsWith(selectedMonth);
      }

      if (periodType === 'yearly') {
        return row.date.startsWith(selectedYear);
      }

      return true;
    });
  }, [selectedStatus, selectedDate, selectedMonth, selectedYear, periodType]);

  const summary = useMemo(() => {
    const totals = filteredRows.reduce(
      (acc, row) => {
        const revenue = row.qty * row.price;
        const cost = row.qty * row.hpp;
        const gop = revenue - cost;

        acc.revenue += revenue;
        acc.cost += cost;
        acc.gop += gop;
        acc.qty += row.qty;

        return acc;
      },
      { revenue: 0, cost: 0, gop: 0, qty: 0 }
    );

    return {
      ...totals,
      margin: totals.revenue ? (totals.gop / totals.revenue) * 100 : 0,
      orders: filteredRows.length,
    };
  }, [filteredRows]);

  const resetFilters = () => {
    setPeriodType('monthly');
    setSelectedDate('2026-05-14');
    setSelectedMonth('2026-05');
    setSelectedYear('2026');
    setSelectedStatus('all');
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

                <div className="flex items-center">
                  <Button variant="outline" className="w-full" onClick={resetFilters}>
                    Reset filter
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Total Revenue</p>
              <p className="mt-4 text-3xl font-semibold tracking-tight text-slate-900">
                {formatIDR(summary.revenue)}
              </p>
              <p className="mt-2 text-sm text-slate-500">{summary.qty} pcs · {summary.orders} order</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Total HPP</p>
              <p className="mt-4 text-3xl font-semibold tracking-tight text-slate-900">
                {formatIDR(summary.cost)}
              </p>
              <p className="mt-2 text-sm text-slate-500">Cost of goods</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Gross Operating Profit</p>
              <p className="mt-4 text-3xl font-semibold tracking-tight text-slate-900">
                {formatIDR(summary.gop)}
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
                  {filteredRows.map((row) => {
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
                          <Badge className={`${STATUS_LABELS[row.status].className}`}>
                            {STATUS_LABELS[row.status].label}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-slate-900">{row.qty}</td>
                        <td className="px-6 py-4 text-slate-900">{formatIDR(row.price)}</td>
                        <td className="px-6 py-4 text-slate-900">{formatIDR(row.hpp)}</td>
                        <td className="px-6 py-4 font-semibold text-slate-900">{formatIDR(revenue)}</td>
                        <td className="px-6 py-4 text-slate-900">{formatIDR(cost)}</td>
                        <td className="px-6 py-4 font-semibold text-emerald-600">{formatIDR(gop)}</td>
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
