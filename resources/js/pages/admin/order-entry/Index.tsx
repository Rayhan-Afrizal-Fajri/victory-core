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
import { Textarea } from '@/components/ui/textarea';

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

  const emptySizeRow = {
    color: '',
    size_label: '',
    qty: 1,
  };

  const form = useForm({
    no_job_ticket: nextJobTicket || 'VL-2026-001',
    customer_id: '',
    produk: '',
    requested_product_name: '',
    q: 0,
    qs: 3,
    deadline: '',
    harga_jual_per_pcs: 0,
    estimasi_hpp_per_pcs: 0,
    keterangan_tambahan: '',
    customer_notes: '',
    size_breakdowns: [{...emptySizeRow}],
  });

  //handle size breakdown
  const totalSizeQty = useMemo(() => {
    return form.data.size_breakdowns.reduce((total, row) => {
      return total + Number(row.qty || 0);
    }, 0);
  }, [form.data.size_breakdowns]);

  const sizeQtyIsValid = totalSizeQty === Number(form.data.q || 0);

  const handleAddSize = () => {
    form.setData('size_breakdowns', [
      ...form.data.size_breakdowns,
      { ...emptySizeRow },
    ]);
  };
  
  const isSizeBreakdownEmpty = useMemo(() => {
    return (
      form.data.size_breakdowns.length === 1 &&
      !form.data.size_breakdowns[0].color &&
      !form.data.size_breakdowns[0].size_label
    );
  }, [form.data.size_breakdowns]);

  const handleRemoveSize = (index: number) => {
    const nextRows = form.data.size_breakdowns.filter((_, i) => i !== index);

    form.setData(
      'size_breakdowns',
      nextRows.length > 0 ? nextRows : [{ ...emptySizeRow }]
    );
  };

  const handleSizeChange = (
    index: number,
    field: 'color' | 'size_label' | 'qty',
    value: string | number
  ) => {
    const nextRows = [...form.data.size_breakdowns];

    nextRows[index] = {
      ...nextRows[index],
      [field]: field === 'qty' ? Number(value) : value,
    };

    form.setData('size_breakdowns', nextRows);
  };

  //end of handle size breakdown

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
      requested_product_name: '',
      q: 1,
      qs: 3,
      deadline: '',
      harga_jual_per_pcs: 0,
      estimasi_hpp_per_pcs: 0,
      keterangan_tambahan: '',
      customer_notes: '',
      size_breakdowns: [{ ...emptySizeRow }],
    });

    setEdited(false);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // HANYA blokir jika size breakdown diisi, TETAPI qty-nya tidak match
    if (!isSizeBreakdownEmpty && !sizeQtyIsValid) {
      // (Opsional) Kamu bisa menambahkan toast.error('Total size tidak sesuai') di sini
      return;
    }

    // Gunakan transform untuk membersihkan data sebelum dikirim
    form.transform((data) => ({
      ...data,
      // Jika kosong, kirim array kosong agar backend tidak menerima data default
      size_breakdowns: isSizeBreakdownEmpty ? null : data.size_breakdowns,
    }));

    form.post(store().url, {
      preserveScroll: true,
    });
  };

  return (
    <>
      <Head title="Order Entry" />

      <form onSubmit={handleSubmit} className="grid gap-6 xl:grid-cols-[1.85fr_1fr]">
        <div className="space-y-6 rounded-sm border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-950">
          <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="jobNo">No Job Ticket *</Label>
                <Input
                  id="jobNo"
                  readOnly
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
            <Label htmlFor="product">Produk yang Diminta *</Label>
            <Input
              id="product"
              placeholder="cth. T-Shirt Oversize D&L Corps"
              value={form.data.requested_product_name}
              onChange={(event) =>
                form.setData('requested_product_name', event.target.value)
              }
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="qty">Total Quantity *</Label>
              <Input
                id="qty"
                type="number"
                min={1}
                value={form.data.q}
                onChange={(event) =>
                  form.setData('q', Number(event.target.value))
                }
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

          <div className="space-y-3 rounded-sm border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <Label>Detail Ukuran / Size Breakdown *</Label>
                <p className="mt-1 text-xs text-slate-500">
                  Customer bisa mengisi size custom seperti S, M, L, XL, All Size, atau ukuran lain.
                </p>
              </div>

              <Button type="button" variant="secondary" onClick={handleAddSize}>
                Tambah Size
              </Button>
            </div>

            <div className="space-y-2">
              {form.data.size_breakdowns.map((row, index) => (
                <div key={index} className="grid gap-2 grid-cols-[1fr_1fr_120px_44px]">
                  <Input
                    placeholder="Warna optional"
                    value={row.color}
                    onChange={(event) =>
                      handleSizeChange(index, 'color', event.target.value)
                    }
                  />

                  <Input
                    placeholder="Size, cth. S / M / XL / All Size"
                    value={row.size_label}
                    onChange={(event) =>
                      handleSizeChange(index, 'size_label', event.target.value)
                    }
                  />

                  <Input
                    type="number"
                    min={1}
                    value={row.qty}
                    onChange={(event) =>
                      handleSizeChange(index, 'qty', Number(event.target.value))
                    }
                  />

                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="text-red-600 hover:bg-red-50"
                    onClick={() => handleRemoveSize(index)}
                  >
                    ×
                  </Button>
                </div>
              ))}
            </div>

            <div
              className={`rounded-md border p-3 text-sm ${
                isSizeBreakdownEmpty || sizeQtyIsValid
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-amber-200 bg-amber-50 text-amber-700'
              }`}
            >
              Total size breakdown: <strong>{isSizeBreakdownEmpty ? 0 : totalSizeQty}</strong> /{' '}
              <strong>{form.data.q || 0}</strong>
              {isSizeBreakdownEmpty && <span className="ml-2 italic opacity-80">(Opsional)</span>}
            </div>

            {form.errors.size_breakdowns && (
              <p className="text-xs text-red-500">{form.errors.size_breakdowns}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Catatan</Label>
            <Textarea
              id="notes"
              value={form.data.customer_notes}
              onChange={(event) => form.setData('customer_notes', event.target.value)}
              placeholder="cth. Warna hitam, sablon depan besar, bahan jangan terlalu tipis..."
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
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
              Ringkasan Order
            </p>

            <div className="mt-5 space-y-4">
              <SummaryItem label="Produk" value={form.data.requested_product_name || '—'} />
              <SummaryItem label="Quantity" value={`${form.data.q || 0} pcs`} />
              <SummaryItem label="Total Size" value={`${totalSizeQty} pcs`} />
              <SummaryItem
                label="Validasi Size"
                value={isSizeBreakdownEmpty ? 'Opsional (Kosong)' : sizeQtyIsValid ? 'Sesuai' : 'Belum sesuai'}
                success={isSizeBreakdownEmpty ? true : sizeQtyIsValid}
              />
              <SummaryItem
                label="Sisa Hari"
                value={daysLeft === null ? '—' : `${daysLeft} hari`}
              />
            </div>
          </div>

          <div className="rounded-sm border border-slate-200 bg-white p-6 shadow-sm">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
              Catatan Flow
            </p>
            <div className="space-y-3 text-sm text-slate-600">
              <p>Customer hanya mengisi kebutuhan order.</p>
              <p>Designer akan memilih artikel master di Design Tab.</p>
              <p>Harga dan costing akan dihitung setelah artikel disinkronkan.</p>
            </div>
          </div>
        </aside>

        {/* <aside className="space-y-6">
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
        </aside> */}
      </form>
    </>
  );
}

function SummaryItem({
  label,
  value,
  success,
}: {
  label: string;
  value: React.ReactNode;
  success?: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
      <p className="text-sm font-medium text-slate-700">{label}</p>
      <p
        className={`text-sm font-semibold ${
          success === true ? 'text-emerald-700' : 'text-slate-900'
        }`}
      >
        {value}
      </p>
    </div>
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
