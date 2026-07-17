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

interface Props {
  productId: number;
  manufacturingWorks: any[];
  availableWorks: any[];
  units: any[];
}

export default function ProductManufacturingSection({ productId, manufacturingWorks, availableWorks, units }: Props) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingWork, setEditingWork] = useState<any | null>(null);
  const [isCustomUnit, setIsCustomUnit] = useState(false);
  
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
    form.setData({
      product_id: productId,
      manufacturing_work_id: work.manufacturing_work_id.toString(),
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
              if (!open) { setEditingWork(null); form.reset(); form.clearErrors(); }
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
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Manufacturing Work</label>
                  <Select value={form.data.manufacturing_work_id} onValueChange={(val) => form.setData('manufacturing_work_id', val)}>
                    <SelectTrigger className='w-full'><SelectValue placeholder="Pilih work..." /></SelectTrigger>
                    <SelectContent>
                      {availableWorks.map((w) => (<SelectItem key={w.id} value={w.id.toString()}>{w.name}</SelectItem>))}
                    </SelectContent>
                  </Select>
                  <InputError message={form.errors.manufacturing_work_id as string} />
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