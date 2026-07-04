import { Head, useForm } from '@inertiajs/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { dashboard } from '@/routes';
import { store, update } from '@/routes/order-entry';
import { Textarea } from '@/components/ui/textarea';
import FormattedNumberInput from '@/components/ui/formatted-number-input';
import { toast } from 'sonner';
import { useCan } from '@/hooks/use-can';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Field from '@/components/sample/field';

type Customer = {
  id: number;
  name: string;
};

type CompanyProfile = {
  id: number;
  name: string;
  type: string;
};

type OrderData = {
  id?: number | null;
  requested_product_name: string;
  q: number;
  size_breakdowns: Array<{ color: string; size_label: string; fabric_spec: string; qty: number }>;
};

type EditingJobTicket = {
  id: number;
  no_job_ticket: string;
  customer_id: number | null;
  company_profile_id: number | null;
  sales_name: string | null;
  deadline: string;
  customer_notes: string;
  orders: OrderData[];
};

type Props = {
  nextJobTicket: string | null;
  customers: Customer[];
  companyProfiles: CompanyProfile[];
  editingJobTicket?: EditingJobTicket | null;
  customer: Customer | null;
  defaultSizeBreakdowns?: {
    color: string[];
    fabric: string[];
    size: string[];
  };
};

const emptySizeRow = { color: '', size_label: '', fabric_spec: '', qty: 1 };
const emptyOrderRow: OrderData = {
  id: null,
  requested_product_name: '',
  q: 0,
  size_breakdowns: [{ ...emptySizeRow }],
};

export default function Index({ nextJobTicket, customers, companyProfiles, editingJobTicket = null, customer = null, defaultSizeBreakdowns = { color: [], fabric: [], size: [] } }: Props) {
  const can = useCan();
  const isEditing = Boolean(editingJobTicket);

  const [customerMode, setCustomerMode] = useState<'existing' | 'new'>('existing');
  const [customerSearch, setCustomerSearch] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [customInputs, setCustomInputs] = useState<Record<string, { color: boolean; fabric_spec: boolean; size_label: boolean }>>({});

  const form = useForm({
    no_job_ticket: editingJobTicket?.no_job_ticket ?? nextJobTicket ?? 'VL-2026-001',
    customer_id: editingJobTicket?.customer_id ? String(editingJobTicket.customer_id) : customer?.id || '',
    company_profile_id: editingJobTicket?.company_profile_id ? String(editingJobTicket.company_profile_id) : '',
    sales_name: editingJobTicket?.sales_name ?? '',
    
    new_customer_name: '',
    new_customer_company: '',
    new_customer_email: '',
    new_customer_phone: '',
    new_customer_address: '',
    
    deadline: editingJobTicket?.deadline ?? '',
    customer_notes: editingJobTicket?.customer_notes ?? '',

    orders: editingJobTicket?.orders?.length ? editingJobTicket.orders : [{ ...emptyOrderRow }],
  });

  // Handle Customer Selection Dropdown
  useEffect(() => {
    if (!editingJobTicket?.customer_id) return;
    const existing = customers.find((c) => c.id === editingJobTicket.customer_id);
    if (existing) setCustomerSearch(existing.name);
  }, [editingJobTicket, customers]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredCustomers = useMemo(() => {
    const keyword = customerSearch.toLowerCase().trim();
    if (!keyword) return customers.slice(0, 20);
    return customers.filter((c) => c.name.toLowerCase().includes(keyword)).slice(0, 20);
  }, [customers, customerSearch]);

  const productNamesInUse = useMemo(() => {
    return form.data.orders
      .map((order) => order.requested_product_name?.trim().toLowerCase())
      .filter(Boolean);
  }, [form.data.orders]);

  const selectedCustomer = useMemo(() => {
    return customers.find((c) => String(c.id) === String(form.data.customer_id));
  }, [customers, form.data.customer_id]);

  // Handle Order Array Logic
  const handleAddOrder = () => {
    form.setData('orders', [...form.data.orders, { ...emptyOrderRow }]);
  };

  const handleRemoveOrder = (indexToRemove: number) => {
    const newOrders = form.data.orders.filter((_, idx) => idx !== indexToRemove);
    form.setData('orders', newOrders.length ? newOrders : [{ ...emptyOrderRow }]);
  };

  const updateOrder = (orderIndex: number, field: keyof OrderData, value: any) => {
    const nextOrders = [...form.data.orders];
    nextOrders[orderIndex] = { ...nextOrders[orderIndex], [field]: value };
    form.setData('orders', nextOrders);
  };

  const toggleCustomInput = (orderIndex: number, sizeIndex: number, field: 'color' | 'fabric_spec' | 'size_label') => {
    const key = `${orderIndex}-${sizeIndex}`;
    setCustomInputs((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: !prev[key]?.[field],
      },
    }));
  };

  const handleAddSize = (orderIndex: number) => {
    const nextOrders = [...form.data.orders];
    nextOrders[orderIndex].size_breakdowns.push({ ...emptySizeRow });
    form.setData('orders', nextOrders);
  };

  const handleRemoveSize = (orderIndex: number, sizeIndex: number) => {
    const nextOrders = [...form.data.orders];
    const filteredSizes = nextOrders[orderIndex].size_breakdowns.filter((_, i) => i !== sizeIndex);
    nextOrders[orderIndex].size_breakdowns = filteredSizes.length ? filteredSizes : [{ ...emptySizeRow }];
    form.setData('orders', nextOrders);
  };

  const updateSize = (orderIndex: number, sizeIndex: number, field: string, value: string | number) => {
    const nextOrders = [...form.data.orders];
    nextOrders[orderIndex].size_breakdowns[sizeIndex] = {
      ...nextOrders[orderIndex].size_breakdowns[sizeIndex],
      [field]: field === 'qty' ? Number(value) : value,
    };
    form.setData('orders', nextOrders);
  };

  // Submit Handler
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const duplicateProductNames = form.data.orders.filter((order, index, orders) => {
      const current = order.requested_product_name?.trim().toLowerCase();
      return current && orders.findIndex((item) => (item.requested_product_name?.trim().toLowerCase() || '') === current) !== index;
    });

    if (duplicateProductNames.length) {
      toast.error('Nama produk pada setiap pesanan harus unik.');
      return;
    }

    // Check sizes validation locally before send
    const invalidSizes = form.data.orders.some((order) => {
      const isSizeEmpty = order.size_breakdowns.length === 1 && !order.size_breakdowns[0].color && !order.size_breakdowns[0].size_label;
      const totalSizeQty = order.size_breakdowns.reduce((acc, curr) => acc + (curr.qty || 0), 0);
      return !isSizeEmpty && totalSizeQty !== Number(order.q);
    });

    if (invalidSizes) {
      toast.error('Gagal menyimpan. Terdapat detail size yang totalnya tidak sesuai dengan Quantity produk.');
      return;
    }

    form.transform((data) => ({
      ...data,
      customer_id: customerMode === 'existing' ? data.customer_id : null,
      new_customer_name: customerMode === 'new' ? data.new_customer_name : null,
    }));

    if (isEditing && editingJobTicket) {
      form.patch(update(editingJobTicket.id).url, {
        onSuccess: () => toast.success('Job Ticket berhasil diperbarui.'),
        onError: (err) => toast.error(Object.values(err)[0] as string || 'Gagal menyimpan perubahan.'),
      });
      return;
    }

    form.post(store().url, {
      onSuccess: () => toast.success('Job Ticket berhasil dibuat.'),
      onError: (err) => toast.error(Object.values(err)[0] as string || 'Gagal menyimpan order.'),
    });
  };

  // Summary Metrics
  const totalQtyAcrossOrders = form.data.orders.reduce((acc, curr) => acc + Number(curr.q || 0), 0);

  return (
    <>
      <Head title={isEditing ? 'Edit Job Ticket' : 'Order Entry'} />

      <form onSubmit={handleSubmit} className="grid gap-6 xl:grid-cols-[1.85fr_1fr]">
        <div className="space-y-6">
          
          {/* SECTION 1: DATA JOB TICKET */}
          <div className="rounded-sm border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-base font-semibold text-slate-800">1. Data Job Ticket</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>No Job Ticket *</Label>
                <Input readOnly value={form.data.no_job_ticket} required />
              </div>
              
              <div className="space-y-2">
                <Label>Deadline Job Ticket *</Label>
                <Input
                  type="date"
                  value={form.data.deadline}
                  onChange={(e) => form.setData('deadline', e.target.value)}
                  required
                />
              </div>

              {/* ... Bagian Dropdown Customer persis seperti sebelumnya ... */}
              <div className="space-y-2" ref={dropdownRef}>
                <Label>Customer / Brand *</Label>
                {customerMode === 'existing' ? (
                  <div className="relative">
                    <Input
                      readOnly={!can('dashboard.admin')}
                      value={selectedCustomer && !isDropdownOpen ? selectedCustomer.name : customerSearch}
                      onChange={(e) => { setCustomerSearch(e.target.value); setIsDropdownOpen(true); }}
                      onFocus={() => setIsDropdownOpen(true)}
                      placeholder="Cari customer..."
                      className="w-full"
                    />
                    {isDropdownOpen && (
                      <div className="absolute left-0 top-full z-50 mt-1 max-h-64 w-full overflow-y-auto rounded-md border border-slate-200 bg-white p-1 shadow-lg">
                        {/* Iterasi Map Customer sama persis seperti kode lama */}
                        {filteredCustomers.map((c) => (
                          <button
                            key={c.id} type="button"
                            onClick={() => { form.setData('customer_id', String(c.id)); setCustomerSearch(c.name); setIsDropdownOpen(false); }}
                            className="block w-full rounded-sm px-3 py-2 text-left text-sm hover:bg-slate-100"
                          >
                            {c.name}
                          </button>
                        ))}
                        {can('dashboard.admin') && (
                          <button
                            type="button"
                            onClick={() => { setCustomerMode('new'); form.setData('customer_id', ''); form.setData('new_customer_name', customerSearch); setIsDropdownOpen(false); }}
                            className="w-full px-3 py-2 text-left text-sm font-medium text-blue-600 bg-slate-50 mt-1"
                          >
                            + Buat Customer Baru
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="rounded-md border border-blue-200 bg-blue-50 p-4">
                    <div className="flex justify-between items-center mb-2">
                      <Label className="text-blue-900 font-semibold">Data Customer Baru</Label>
                      <Button type="button" variant="outline" size="sm" onClick={() => setCustomerMode('existing')}>Batal</Button>
                    </div>
                    <Input placeholder="Nama PIC" value={form.data.new_customer_name} onChange={e => form.setData('new_customer_name', e.target.value)} className="mb-2" />
                    <Input placeholder="Perusahaan" value={form.data.new_customer_company} onChange={e => form.setData('new_customer_company', e.target.value)} className="mb-2" />
                    <Input placeholder="Email" value={form.data.new_customer_email} onChange={e => form.setData('new_customer_email', e.target.value)} className="mb-2" />
                    <Input placeholder="Kontak" value={form.data.new_customer_phone} onChange={e => form.setData('new_customer_phone', e.target.value)} className="mb-2" />
                    <Textarea placeholder="Alamat" value={form.data.new_customer_address} onChange={e => form.setData('new_customer_address', e.target.value)} />
                  </div>
                )}
              </div>

              <Field label='Perusahaan *'>
                <Select value={form.data.company_profile_id || ''} onValueChange={(value) => form.setData('company_profile_id', value)}>
                  <SelectTrigger className="h-10 w-full border-slate-200 bg-white shadow-sm">
                    <SelectValue placeholder="Pilih perusahaan" />
                  </SelectTrigger>
                  <SelectContent>
                    {companyProfiles.map((option) => (
                      <SelectItem key={option.id} value={String(option.id)}>{option.name} - {option.type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <div className="space-y-2">
                <Label>Nama Sales *</Label>
                <Input
                  type="text"
                  value={form.data.sales_name}
                  onChange={(e) => form.setData('sales_name', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: LIST PESANAN */}
          <div className="rounded-sm border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-slate-800">2. Daftar Pesanan Produk</h3>
            </div>

            <div className="space-y-6">
              {form.data.orders.map((order, oIndex) => {
                const totalSizeQty = order.size_breakdowns.reduce((acc, curr) => acc + Number(curr.qty || 0), 0);
                const isSizeEmpty = order.size_breakdowns.length === 1 && !order.size_breakdowns[0].color && !order.size_breakdowns[0].size_label;
                const sizeIsValid = totalSizeQty === Number(order.q || 0);

                return (
                  <div key={oIndex} className="relative rounded-lg border border-slate-200 p-5 pt-7 bg-slate-50/50">
                    <span className="absolute top-2 left-3 text-xs font-bold text-slate-400">Pesanan #{oIndex + 1}</span>
                    
                    {form.data.orders.length > 1 && (
                      <Button type="button" variant="ghost" size="sm" className="absolute top-2 right-2 text-red-500 h-6 px-2 hover:bg-red-100" onClick={() => handleRemoveOrder(oIndex)}>
                        Hapus
                      </Button>
                    )}

                    <div className="grid gap-4 sm:grid-cols-[1.5fr_1fr] mt-2">
                      <div className="space-y-2">
                        <Label>Nama Produk / Artikel *</Label>
                        <Input
                          placeholder="cth. T-Shirt Oversize Hitam"
                          value={order.requested_product_name}
                          onChange={(e) => updateOrder(oIndex, 'requested_product_name', e.target.value)}
                          required
                        />
                        {productNamesInUse.filter((name) => name === order.requested_product_name?.trim().toLowerCase()).length > 1 && (
                          <p className="text-xs text-red-500">Nama produk harus unik antar pesanan.</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label>Quantity Produksi *</Label>
                        <FormattedNumberInput
                          value={order.q}
                          onValueChange={(val) => updateOrder(oIndex, 'q', val)}
                          placeholder="Jumlah"
                        />
                      </div>
                    </div>

                    <div className="mt-4 rounded-md border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="flex justify-between mb-3">
                        <Label className="text-xs font-semibold text-slate-600">Detail Ukuran / Size Breakdown</Label>
                        <Button type="button" variant="secondary" size="sm" className="h-7 text-xs" onClick={() => handleAddSize(oIndex)}>+ Tambah Size</Button>
                      </div>

                      <div className="space-y-2">
                        {order.size_breakdowns.map((size, sIndex) => {
                          const inputKey = `${oIndex}-${sIndex}`;
                          const isCustomColor =
                            Boolean(customInputs[inputKey]?.color) ||
                            (
                              !!size.color &&
                              !defaultSizeBreakdowns.color.includes(size.color)
                            );

                          const isCustomFabric =
                            Boolean(customInputs[inputKey]?.fabric_spec) ||
                            (
                              !!size.fabric_spec &&
                              !defaultSizeBreakdowns.fabric.includes(size.fabric_spec)
                            );

                          const isCustomSize =
                            Boolean(customInputs[inputKey]?.size_label) ||
                            (
                              !!size.size_label &&
                              !defaultSizeBreakdowns.size.includes(size.size_label)
                            );

                          return (
                            <div key={sIndex} className="grid gap-2 grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_100px_40px] items-start">
                              <div className="space-y-1">
                                {isCustomColor ? (
                                  <div className="flex items-center gap-2">
                                    <Input placeholder="Warna" value={size.color} onChange={(e) => updateSize(oIndex, sIndex, 'color', e.target.value)} />
                                    <Button type="button" variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={() => toggleCustomInput(oIndex, sIndex, 'color')}>List</Button>
                                  </div>
                                ) : (
                                  <div className="space-y-1">
                                    <Select value={size.color || ''} onValueChange={(value) => updateSize(oIndex, sIndex, 'color', value)}>
                                      <SelectTrigger className="h-10 w-full border-slate-200 bg-white shadow-sm">
                                        <SelectValue placeholder="Pilih warna" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {defaultSizeBreakdowns.color.map((option) => (
                                          <SelectItem key={option} value={option}>{option}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => toggleCustomInput(oIndex, sIndex, 'color')}>+ Custom</Button>
                                  </div>
                                )}
                              </div>

                              <div className="space-y-1">
                                {isCustomFabric ? (
                                  <div className="flex items-center gap-2">
                                    <Input placeholder="Fabric Spec (24s)" value={size.fabric_spec} onChange={(e) => updateSize(oIndex, sIndex, 'fabric_spec', e.target.value)} />
                                    <Button type="button" variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={() => toggleCustomInput(oIndex, sIndex, 'fabric_spec')}>List</Button>
                                  </div>
                                ) : (
                                  <div className="space-y-1">
                                    <Select value={size.fabric_spec || ''} onValueChange={(value) => updateSize(oIndex, sIndex, 'fabric_spec', value)}>
                                      <SelectTrigger className="h-10 w-full border-slate-200 bg-white shadow-sm">
                                        <SelectValue placeholder="Pilih fabric spec" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {defaultSizeBreakdowns.fabric.map((option) => (
                                          <SelectItem key={option} value={option}>{option}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => toggleCustomInput(oIndex, sIndex, 'fabric_spec')}>+ Custom</Button>
                                  </div>
                                )}
                              </div>

                              <div className="space-y-1">
                                {isCustomSize ? (
                                  <div className="flex items-center gap-2">
                                    <Input placeholder="Size (S/M/L)" value={size.size_label} onChange={(e) => updateSize(oIndex, sIndex, 'size_label', e.target.value)} />
                                    <Button type="button" variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={() => toggleCustomInput(oIndex, sIndex, 'size_label')}>List</Button>
                                  </div>
                                ) : (
                                  <div className="space-y-1">
                                    <Select value={size.size_label || ''} onValueChange={(value) => updateSize(oIndex, sIndex, 'size_label', value)}>
                                      <SelectTrigger className="h-10 w-full border-slate-200 bg-white shadow-sm">
                                        <SelectValue placeholder="Pilih size" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {defaultSizeBreakdowns.size.map((option) => (
                                          <SelectItem key={option} value={option}>{option}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => toggleCustomInput(oIndex, sIndex, 'size_label')}>+ Custom</Button>
                                  </div>
                                )}
                              </div>

                              <FormattedNumberInput value={size.qty} onValueChange={(val) => updateSize(oIndex, sIndex, 'qty', Number(val))} />
                              <Button type="button" variant="outline" size="icon" className="text-red-500" onClick={() => handleRemoveSize(oIndex, sIndex)}>×</Button>
                            </div>
                          );
                        })}
                      </div>
                      
                      <div className={`mt-3 rounded border p-2 text-xs ${isSizeEmpty || sizeIsValid ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>
                        Total Size Breakdown: <strong>{isSizeEmpty ? 0 : totalSizeQty}</strong> / <strong>{order.q || 0}</strong> {isSizeEmpty && <span className="italic">(Opsional)</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <Button type="button" variant="outline" className="mt-4 w-full border-dashed border-2 text-blue-600 hover:bg-blue-50" onClick={handleAddOrder}>
              + Tambah Pesanan Lainnya
            </Button>
          </div>

          {/* SECTION 3: CATATAN CUSTOMER */}
          <div className="rounded-sm border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-base font-semibold text-slate-800">3. Catatan Customer (Global)</h3>
            <Textarea
              value={form.data.customer_notes}
              onChange={(e) => form.setData('customer_notes', e.target.value)}
              placeholder="Tuliskan catatan khusus terkait instruksi packaging, warna jahitan, jadwal ambil, dll."
              className="min-h-32"
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button type="submit" disabled={form.processing} className="w-full sm:w-auto">
              {isEditing ? 'Simpan Perubahan Job Ticket' : 'Buat Job Ticket'}
            </Button>
          </div>
        </div>

        {/* SIDEBAR SUMMARY */}
        <aside className="space-y-6">
          <div className="rounded-sm border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500 mb-5">
              Ringkasan Job Ticket
            </p>

            <div className="space-y-3">
              <div className="rounded-lg bg-slate-50 px-4 py-3 border border-slate-100">
                <p className="text-xs text-slate-500 mb-1">Total Pesanan (Items)</p>
                <p className="text-lg font-bold text-slate-900">{form.data.orders.length} <span className="text-sm font-normal text-slate-600">Model Produk</span></p>
              </div>

              <div className="rounded-lg bg-emerald-50 px-4 py-3 border border-emerald-100">
                <p className="text-xs text-emerald-600 mb-1">Total Quantity Keseluruhan</p>
                <p className="text-lg font-bold text-emerald-900">{totalQtyAcrossOrders} <span className="text-sm font-normal">Pcs</span></p>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-xs font-semibold text-slate-500 mb-2">Daftar Produk:</p>
                <ul className="space-y-2">
                  {form.data.orders.map((o, idx) => (
                    <li key={idx} className="text-sm text-slate-700 flex justify-between">
                      <span className="truncate pr-4">• {o.requested_product_name || `Produk #${idx+1}`}</span>
                      <span className="font-medium whitespace-nowrap">{o.q || 0} pcs</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </aside>
      </form>
    </>
  );
}

Index.layout = {
  breadcrumbs: [{ title: 'Order Entry', href: dashboard() }],
  title: 'Order Entry',
};