import { Head, useForm } from '@inertiajs/react';
import { useMemo, useState  } from 'react';
import type {FormEvent} from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { dashboard } from '@/routes';
import { show as jobTicketShow } from '@/routes/job-tickets';
import { store, update } from '@/routes/order-entry';

function formatIDR(value: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value);
}

function calculateDaysLeft(deadline: string) {
  if (!deadline) {
    return null;
  }

  const due = new Date(deadline);

  if (Number.isNaN(due.getTime())) {
    return null;
  }

  const now = new Date();
  const diff = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  return diff;
}

type Customer = {
  id: number;
  name: string;
}

type Props = {
  nextJobTicket: string | null;
  customers: Customer[];
}

export default function Index({ nextJobTicket, customers }: Props) {

  const form = useForm({
    no_job_ticket: nextJobTicket || 'VL-2026-001',
    customer_id: '',
    produk: '',
    q: 0,
    qs: 3,
    deadline: '',
    harga_jual_per_pcs: 0,
    estimasi_hpp_per_pcs: 0,
    keterangan_tambahan: '',
  });

  const [edited, setEdited] = useState(false);

  const samplePrice = useMemo(
      () => form.data.harga_jual_per_pcs * form.data.qs,
      [form.data.harga_jual_per_pcs, form.data.qs]
  );
  const gopPerUnit = useMemo(
      () => Math.max(form.data.harga_jual_per_pcs - form.data.estimasi_hpp_per_pcs, 0),
      [form.data.harga_jual_per_pcs, form.data.estimasi_hpp_per_pcs]
  );
  const gopTotal = useMemo(
      () => gopPerUnit * form.data.q,
      [gopPerUnit, form.data.q]
  );
  const daysLeft = useMemo(
      () => calculateDaysLeft(form.data.deadline),
      [form.data.deadline]
  );
  const margin = useMemo(() => {
    if (!form.data.harga_jual_per_pcs || form.data.harga_jual_per_pcs <= 0) {
      return 0;
    }

    return Math.max(((form.data.harga_jual_per_pcs - form.data.estimasi_hpp_per_pcs) / form.data.harga_jual_per_pcs) * 100, 0);
  }, [form.data.harga_jual_per_pcs, form.data.estimasi_hpp_per_pcs]);

  const handleReset = () => {
    form.reset();

    form.setData({
      no_job_ticket: nextJobTicket || 'VL-2026-001',
      customer_id: '',
      produk: '',
      q: 0,
      qs: 3,
      deadline: '',
      harga_jual_per_pcs: 0,
      estimasi_hpp_per_pcs: 0,
      keterangan_tambahan: '',
    });

    setEdited(false);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (edited) {
      return;
    }

    form.post(store().url, {
      preserveScroll: true,
    });
  };

  return (
    <>
      <Head title="Order Entry" />

      <form onSubmit={handleSubmit} className="grid gap-6 xl:grid-cols-[1.85fr_1fr]">
        <div className="space-y-6 rounded-sm border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="jobNo">No Job Ticket *</Label>
              <Input
                id="jobNo"
                placeholder="VL-2026-009"
                value={form.data.no_job_ticket}
                onChange={(event) => form.setData('no_job_ticket', event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer">Customer / Brand *</Label>
              <Select
                value={form.data.customer_id}
                onValueChange={(value) => form.setData('customer_id', value)}
              >
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder="Pilih Customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((cust) => (
                    <SelectItem key={cust.id} value={cust.id.toString()}>
                      {cust.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="product">Produk / Tipe Garment *</Label>
            <Input
              id="product"
              placeholder="cth. Kemeja Seragam Kantor"
              value={form.data.produk}
              onChange={(event) => form.setData('produk', event.target.value)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="qty">Quantity (Qty) *</Label>
              <Input
                id="qty"
                type="number"
                min={0}
                value={form.data.q}
                onChange={(event) => form.setData('q', Number(event.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deadline">Deadline *</Label>
              <Input
                id="deadline"
                type="date"
                value={form.data.deadline}
                onChange={(event) => form.setData('deadline', event.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="hargaJual">Harga Jual (per pcs) *</Label>
              <Input
                id="hargaJual"
                type="number"
                min={0}
                step={1000}
                value={form.data.harga_jual_per_pcs}
                onChange={(event) => form.setData('harga_jual_per_pcs', Number(event.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hpp">Estimasi HPP (per pcs) *</Label>
              <Input
                id="hpp"
                type="number"
                min={0}
                step={1000}
                value={form.data.estimasi_hpp_per_pcs}
                onChange={(event) => form.setData('estimasi_hpp_per_pcs', Number(event.target.value))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Catatan / Spek</Label>
            <textarea
              id="notes"
              value={form.data.keterangan_tambahan}
              onChange={(event) => form.setData('keterangan_tambahan', event.target.value)}
              placeholder="cth. Bahan oxford warna navy, bordir logo dada kiri..."
              className="min-h-36 w-full rounded-sm border border-slate-200 bg-transparent px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button type="submit" className="w-full sm:w-auto">
              Simpan Order
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              onClick={handleReset}
            >
              Reset Form
            </Button>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-sm border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
                  Auto-calculations
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Diperbarui realtime dari input.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-700">Harga Sample (3×)</p>
                </div>
                <p className="text-sm font-semibold text-slate-900">{formatIDR(samplePrice)}</p>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-700">Sisa Hari</p>
                </div>
                <p className="text-sm font-semibold text-slate-900">
                  {daysLeft === null ? '—' : `${daysLeft} hari`}
                </p>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-700">GOP / unit</p>
                </div>
                <p className="text-sm font-semibold text-slate-900">{formatIDR(gopPerUnit)}</p>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-700">GOP Total</p>
                </div>
                <p className="text-sm font-semibold text-slate-900">{formatIDR(gopTotal)}</p>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-700">Margin</p>
                </div>
                <p
                  className={`text-sm font-semibold ${margin >= 25 ? 'text-emerald-700' : margin >= 10 ? 'text-amber-700' : 'text-rose-600'}`}
                >
                  {margin.toFixed(0)}%
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-sm border border-slate-200 bg-white p-6 shadow-sm">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
              Formula
            </p>
            <div className="space-y-3 text-sm text-slate-600">
              <p>Sample = Harga Jual × 3</p>
              <p>GOP = (Harga Jual − HPP) × Qty</p>
              <p>Sisa Hari = Deadline − Hari Ini</p>
            </div>
          </div>
        </aside>
      </form>
    </>
  );
}

Index.layout = {
  breadcrumbs: [
    {
      title: 'Order Entry',
      href: dashboard(),
    },
  ],
  title: 'Order Entry',
  description: 'Form input pesanan masuk. Sistem akan otomatis menghitung harga sample, sisa hari, dan estimasi profit.',
  information: 'CS ROLE · ORDER INTAKE',
};
