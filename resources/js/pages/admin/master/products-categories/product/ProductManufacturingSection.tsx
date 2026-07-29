import { useForm, router } from '@inertiajs/react';
import { Plus, Pencil, Trash2, GripVertical } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { FormattedNumberInput } from '@/components/ui/formatted-number-input';
import { Supplier } from '@/types';

interface Props {
  productId: number;
  manufacturingWorks: any[];
  suppliers: Supplier[];
  workOptions: any[];
  availableWorks: any[];
  units: any[];
}

export default function ProductManufacturingSection({ productId, manufacturingWorks, suppliers, workOptions, availableWorks, units }: Props) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCustomUnit, setIsCustomUnit] = useState(false);
  const [editingWork, setEditingWork] = useState<any | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');

  const selectedGroup = workOptions.find((w) => w.group_id === selectedGroupId);

  // Logic memetakan supplier options
  const availableSuppliersOptions = selectedGroup ? selectedGroup.variants.map((variant: any) => {
    if (variant.supplier_id === null) {
      return {
        id: 'internal',
        name: 'Internal (Dikerjakan Sendiri)'
      };
    } else {
      const supplier = suppliers.find(s => s.id === variant.supplier_id);
      return {
        id: variant.supplier_id.toString(),
        name: supplier ? (supplier.nama_perusahaan ?? 'Unknown Vendor') : 'Unknown Vendor'
      };
    }
  }) : [];

  const handleWorkGroupChange = (groupId: string) => {
    setSelectedGroupId(groupId);
    setSelectedSupplierId(''); // Reset pilihan supplier tiap ganti work group
    
    // Reset isi form
    form.setData((prevData) => ({
      ...prevData,
      manufacturing_work_id: '',
      default_supplier_id: '',
      default_unit: 'pcs',
      min_estimate: 0,
      max_estimate: 0,
      usage_note: '',
    }));
  };

  const handleSupplierChange = (supplierVal: string) => {
    setSelectedSupplierId(supplierVal);
    if (!selectedGroup) return;

    // Cari varian yang tepat berdasarkan pilihan (Internal = null, selain itu = angka supplier_id)
    const isInternal = supplierVal === 'internal';
    const variant = selectedGroup.variants.find((v: any) => 
      isInternal ? v.supplier_id === null : v.supplier_id?.toString() === supplierVal
    );

    if (variant) {
      // LAKUKAN SYNC DATA DI SINI
      form.setData((prev) => ({
        ...prev,
        manufacturing_work_id: variant.work_id.toString(), // Ini ID asli dari tabel works
        default_supplier_id: isInternal ? '' : supplierVal, // <--- TAMBAHKAN BARIS INI
        default_unit: variant.unit || 'pcs',
        min_estimate: Number(variant.min_estimate) || 0,
        max_estimate: Number(variant.max_estimate) || 0,
      }));
    }
  };
  
  // State dan Ref untuk Drag and Drop
  const [localWorks, setLocalWorks] = useState(manufacturingWorks);
  const [isOrderChanged, setIsOrderChanged] = useState(false);
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  // Sync local state ketika props manufacturingWorks berubah (misal setelah add/edit/delete/reorder)
  useEffect(() => {
    setLocalWorks(manufacturingWorks);
    setIsOrderChanged(false);
  }, [manufacturingWorks]);

  const formatIDR = (value: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);

  const form = useForm({
    product_id: productId,
    manufacturing_work_id: '',
    default_supplier_id: '',
    default_usage: 1,
    default_unit: 'pcs',
    min_estimate: 0,
    max_estimate: 0,
    usage_note: '',
    sort_order: manufacturingWorks.length + 1,
    is_required: true,
  });

  const handleSubmit = () => {
    if (editingWork) {
      form.put(route('product-manufacturing-works.update', editingWork.id), {
        onSuccess: () => {
          setIsDialogOpen(false);
          setEditingWork(null);
          form.reset();
          toast.success('Work berhasil diperbarui');
        },
      });
      return;
    }

    form.post(route('product-manufacturing-works.store'), {
      onSuccess: () => {
        setIsDialogOpen(false);
        form.reset();
        toast.success('Work berhasil ditambahkan');
      },
    });
  };

  const handleEdit = (work: any) => {
    setEditingWork(work);

    // Cari Work ini ada di Group mana dan Supplier yang mana
    let foundGroupId = '';
    let foundSupplierId = '';

    for (const group of workOptions) {
      const variant = group.variants.find((v: any) => v.work_id.toString() === work.manufacturing_work_id.toString());
      if (variant) {
        foundGroupId = group.group_id;
        foundSupplierId = variant.supplier_id === null ? 'internal' : variant.supplier_id.toString();
        break;
      }
    }

    setSelectedGroupId(foundGroupId);
    setSelectedSupplierId(foundSupplierId);

    form.setData({
      product_id: productId,
      manufacturing_work_id: work.manufacturing_work_id.toString(),
      // Gunakan foundSupplierId, bukan selectedSupplierId state
      default_supplier_id: foundSupplierId === 'internal' ? '' : foundSupplierId, // <--- PERBAIKI BARIS INI
      default_usage: work.default_usage,
      default_unit: work.default_unit || 'pcs',
      min_estimate: work.min_estimate || 0,
      max_estimate: work.max_estimate || 0,
      usage_note: work.usage_note || '',
      sort_order: work.sort_order,
      is_required: work.is_required,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (work: any) => {
    if (!confirm('Hapus work ini?')) return;
    router.delete(route('product-manufacturing-works.destroy', work.id), {
      onSuccess: () => toast.success('Work berhasil dihapus'),
    });
  };

  // Handler Drag & Drop
  const handleSort = () => {
    if (dragItem.current !== null && dragOverItem.current !== null) {
      const _localWorks = [...localWorks];
      // Hapus item dari index lama
      const draggedItemContent = _localWorks.splice(dragItem.current, 1)[0];
      // Masukkan item ke index baru
      _localWorks.splice(dragOverItem.current, 0, draggedItemContent);
      
      dragItem.current = null;
      dragOverItem.current = null;
      
      setLocalWorks(_localWorks);
      setIsOrderChanged(true); // Munculkan tombol simpan urutan
    }
  };

  const handleSaveOrder = () => {
    const orderedIds = localWorks.map(w => w.id);
    router.post(route('product-manufacturing-works.reorder'), { ordered_ids: orderedIds }, {
      preserveScroll: true,
      onSuccess: () => {
        toast.success('Urutan berhasil disimpan');
        setIsOrderChanged(false);
      }
    });
  };

  const toggleCustomUnit = () => {
    setIsCustomUnit((prev) => !(prev));
  }

  return (
    <Card>
      <CardHeader className={`flex justify-between space-y-0 pb-4 ${isOrderChanged ? 'flex-col sm:flex-col items-start sm:items-center' : 'items-center flex-row'}`}>
        <CardTitle className="text-lg">Proses Manufaktur & Vendor</CardTitle>
        <div className={`flex items-center gap-2 `}>
          {/* Tombol Simpan Urutan muncul jika posisi telah digeser */}
          {isOrderChanged && (
            <Button onClick={handleSaveOrder} size="sm" variant="default" className="bg-emerald-600 hover:bg-emerald-700">
              Simpan Urutan
            </Button>
          )}

          <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) { 
                setEditingWork(null); 
                setSelectedGroupId(''); 
                setSelectedSupplierId(''); // <--- Tambahkan reset ini
                form.reset(); 
                form.clearErrors(); 
              }
            }}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2"><Plus className="size-4" /> Tambah Work</Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl">
              <DialogHeader>
                <DialogTitle>{editingWork ? 'Edit Work' : 'Tambah Manufacturing Work'}</DialogTitle>
              </DialogHeader>
              
              {/* Form Inputs Tetap Sama... */}
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Manufacturing Work</label>
                    <Select value={selectedGroupId} onValueChange={handleWorkGroupChange}>
                      <SelectTrigger className='w-full'>
                        <SelectValue placeholder="Pilih jenis proses..." />
                      </SelectTrigger>
                      <SelectContent>
                        {workOptions.map((w) => (
                          <SelectItem key={w.group_id} value={w.group_id.toString()}>{w.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Pelaksana / Vendor</label>
                    <Select 
                      disabled={!selectedGroupId} 
                      value={selectedSupplierId} 
                      onValueChange={handleSupplierChange}
                    >
                      <SelectTrigger className='w-full'>
                        <SelectValue placeholder={!selectedGroupId ? "Pilih proses dulu..." : "Pilih pelaksana..."} />
                      </SelectTrigger>
                      <SelectContent>
                        {availableSuppliersOptions.map((opt: any) => (
                          <SelectItem key={opt.id} value={opt.id}>
                            {opt.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <InputError message={form.errors.manufacturing_work_id as string} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Default Usage</label>
                    <FormattedNumberInput value={form.data.default_usage} onValueChange={(val) => form.setData('default_usage', val)} />
                    <InputError message={form.errors.default_usage as string} />
                  </div>
                  {isCustomUnit ? (
                    <>
                    <div className='grid gap-2'>
                      <label className="text-sm font-medium">Satuan (Unit)</label>
                      <Input value={form.data.default_unit} onChange={(e) => form.setData('default_unit', e.target.value)} placeholder="kg, pcs, lusin" />
                      <InputError message={form.errors.default_unit as string} />
                    </div>
                    <div className="w-full col-span-2 flex justify-end">
                      <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={toggleCustomUnit}
                          className='flex justify-end w-fit'
                      >
                          + Pilih dari daftar
                      </Button>
                    </div>
                    </>
                  ) : (
                    <>
                    <div className='grid gap-2'>
                      <label className="text-sm font-medium">Satuan (Unit)</label>
                      <Select value={form.data.default_unit} onValueChange={(val) => form.setData('default_unit', val)}>
                        <SelectTrigger className='w-full'><SelectValue placeholder="Pilih satuan..." /></SelectTrigger>
                        <SelectContent>
                          {units.map((s) => (<SelectItem key={s.id} value={s.label}>{s.label ?? '-'}</SelectItem>))}
                        </SelectContent>
                      </Select>
                      <InputError message={form.errors.default_unit as string} />
                    </div>
                    <div className="w-full col-span-2 flex justify-end">
                      <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={toggleCustomUnit}
                          className='flex justify-end w-fit'
                      >
                          + Satuan Custom
                      </Button>
                    </div>
                    </>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Min Estimate (Cost)</label>
                    <FormattedNumberInput min={0} value={form.data.min_estimate} onValueChange={(val) => form.setData('min_estimate', val)} />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Max Estimate (Cost)</label>
                    <FormattedNumberInput min={0} value={form.data.max_estimate} onValueChange={(val) => form.setData('max_estimate', val)} />
                  </div>
                </div>

                <div className="grid gap-2">
                  <label className="text-sm font-medium">Catatan (Opsional)</label>
                  <Textarea value={form.data.usage_note} onChange={(e) => form.setData('usage_note', e.target.value)} rows={3} />
                </div>
              </div>

              <DialogFooter>
                <Button onClick={handleSubmit} disabled={form.processing}>{editingWork ? 'Update' : 'Add'}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      
      <CardContent>
        {localWorks.length === 0 ? (
          <p className="text-sm text-slate-500">Tidak ada manufacturing work yang ditambahkan.</p>
        ) : (
          <div className="space-y-3">
            {localWorks.map((work, index) => {
              const subtotal = work.default_usage * (work.max_estimate || 0);

              return (
                <div 
                  key={work.id} 
                  draggable // Mengaktifkan HTML5 Native Drag & Drop
                  onDragStart={(e) => (dragItem.current = index)}
                  onDragEnter={(e) => (dragOverItem.current = index)}
                  onDragEnd={handleSort}
                  onDragOver={(e) => e.preventDefault()}
                  className="flex flex-col rounded border border-slate-200 p-3 bg-slate-50/50 cursor-grab active:cursor-grabbing hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {/* Ikon Grip/Handle Untuk Menandakan Bisa Di-Drag */}
                      <div className="mt-1 flex items-center justify-center text-slate-400">
                        <GripVertical className="size-4" />
                      </div>

                      <div>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                          <span className="font-semibold text-slate-900">{work.work_name}</span>
                          {work.is_required && <Badge variant="default" className="text-[10px] h-4 px-1.5">Req</Badge>}
                          {work.process_behavior && <Badge variant="outline" className="text-[10px] h-4">{work.process_behavior}</Badge>}
                        </div>
                        <p className="text-xs text-slate-600 mt-1">
                          Supplier: <strong>{work.defaultSupplier?.nama_perusahaan ?? '-'}</strong>
                        </p>
                        <p className="text-xs text-slate-600 mt-1">
                          Volume: <strong>{work.default_usage} {work.default_unit}</strong>
                        </p>
                        <p className="text-xs text-slate-500">
                          Est Biaya: {formatIDR(work.min_estimate)} - {formatIDR(work.max_estimate)}
                        </p>
                        {work.usage_note && <p className="text-[11px] italic text-slate-500 mt-2">"{work.usage_note}"</p>}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleEdit(work)}>
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleDelete(work)}>
                          <Trash2 className="size-3.5 text-red-500" />
                        </Button>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider">Subtotal Max</p>
                        <p className="font-bold text-slate-900">{formatIDR(subtotal)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}