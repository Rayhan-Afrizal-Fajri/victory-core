import { useForm } from '@inertiajs/react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { ProductManufacturingWork, ManufacturingWork } from '@/types';

interface Props {
  productId: number;
  manufacturingWorks: ProductManufacturingWork[];
  availableWorks: ManufacturingWork[];
}

export default function ProductManufacturingSection({ productId, manufacturingWorks, availableWorks }: Props) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingWork, setEditingWork] = useState<ProductManufacturingWork | null>(null);

  const form = useForm({
    product_id: productId,
    manufacturing_work_id: '',
    default_usage: 1,
    default_unit: 'pcs',
    usage_note: '',
    sort_order: manufacturingWorks.length,
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

  const handleEdit = (work: ProductManufacturingWork) => {
    setEditingWork(work);
    form.setData({
      product_id: productId,
      manufacturing_work_id: work.manufacturing_work_id.toString(),
      default_usage: work.default_usage,
      default_unit: work.default_unit || 'pcs',
      usage_note: work.usage_note || '',
      sort_order: work.sort_order,
      is_required: work.is_required,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (work: ProductManufacturingWork) => {
    if (!confirm('Hapus work ini?')) return;
    form.delete(route('product-manufacturing-works.destroy', work.id), {
      onSuccess: () => {
        toast.success('Work berhasil dihapus');
      },
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg">Manufacturing Works</CardTitle>
        <Dialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setEditingWork(null);
              form.reset();
              form.clearErrors();
            }
          }}
        >
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Plus className="size-4" /> Tambah Work
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>{editingWork ? 'Edit Work' : 'Tambah Manufacturing Work'}</DialogTitle>
              <DialogDescription>Tambahkan pekerjaan manufaktur untuk produk ini.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Manufacturing Work</label>
                <Select value={form.data.manufacturing_work_id} onValueChange={(val) => form.setData('manufacturing_work_id', val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih work..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableWorks.map((w) => (
                      <SelectItem key={w.id} value={w.id.toString()}>
                        {w.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <InputError message={form.errors.manufacturing_work_id as string} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Default Usage</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={form.data.default_usage}
                    onChange={(e) => form.setData('default_usage', parseFloat(e.target.value))}
                  />
                  <InputError message={form.errors.default_usage as string} />
                </div>

                <div className="grid gap-2">
                  <label className="text-sm font-medium">Unit</label>
                  <Input
                    value={form.data.default_unit}
                    onChange={(e) => form.setData('default_unit', e.target.value)}
                  />
                  <InputError message={form.errors.default_unit as string} />
                </div>
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium">Usage Note (Optional)</label>
                <Textarea
                  value={form.data.usage_note}
                  onChange={(e) => form.setData('usage_note', e.target.value)}
                  placeholder="Catatan tambahan untuk pekerjaan ini"
                  rows={3}
                />
                <InputError message={form.errors.usage_note as string} />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_required"
                  checked={form.data.is_required}
                  onChange={(e) => form.setData('is_required', e.target.checked)}
                />
                <label htmlFor="is_required" className="text-sm font-medium">
                  Required
                </label>
              </div>
            </div>

            <DialogFooter>
              <Button onClick={handleSubmit} disabled={form.processing}>
                {editingWork ? 'Update' : 'Add'} Work
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {manufacturingWorks.length === 0 ? (
          <p className="text-sm text-slate-500">Tidak ada manufacturing work yang ditambahkan.</p>
        ) : (
          <div className="space-y-2">
            {manufacturingWorks.map((work) => (
              <div key={work.id} className="flex items-center justify-between rounded border border-slate-200 p-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-900">{work.work_name}</span>
                    {work.is_required && <Badge variant="default" className="text-xs">Required</Badge>}
                  </div>
                  <p className="text-xs text-slate-500">
                    {work.default_usage} {work.default_unit || '-'}
                  </p>
                  {work.usage_note && <p className="text-xs text-slate-600 mt-1">{work.usage_note}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(work)}>
                    <Pencil className="size-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(work)}>
                    <Trash2 className="size-4 text-red-500" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
