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
import type { ProductMaterial, Material } from '@/types';
import FormattedNumberInput from '@/components/ui/formatted-number-input';

interface Props {
  productId: number;
  materials: ProductMaterial[];
  availableMaterials: Material[];
  type: 'bahan' | 'aksesoris';
  title: string;
}

export default function ProductMaterialSection({ productId, materials, availableMaterials, type, title }: Props) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<ProductMaterial | null>(null);

  const filteredMaterials = materials.filter((m) => m.type === type);
  const filteredAvailable = availableMaterials.filter((m) => m.category === type);

  const form = useForm({
    product_id: productId,
    material_id: '',
    type: type,
    default_usage: 0,
    default_unit: '',
    sort_order: filteredMaterials.length,
    is_required: true,
  });

  const handleSubmit = () => {
    if (editingMaterial) {
      form.put(route('product-materials.update', editingMaterial.id), {
        onSuccess: () => {
          setIsDialogOpen(false);
          setEditingMaterial(null);
          form.reset();
          toast.success('Material berhasil diperbarui');
        },
      });
      return;
    }

    form.post(route('product-materials.store'), {
      onSuccess: () => {
        setIsDialogOpen(false);
        form.reset();
        toast.success('Material berhasil ditambahkan');
      },
    });
  };

  const handleEdit = (material: ProductMaterial) => {
    setEditingMaterial(material);
    form.setData({
      product_id: productId,
      material_id: material.material_id.toString(),
      type: material.type,
      default_usage: material.default_usage,
      default_unit: material.default_unit || '',
      sort_order: material.sort_order,
      is_required: material.is_required,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (material: ProductMaterial) => {
    if (!confirm('Hapus material ini?')) return;
    form.delete(route('product-materials.destroy', material.id), {
      onSuccess: () => {
        toast.success('Material berhasil dihapus');
      },
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg">{title}</CardTitle>
        <Dialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setEditingMaterial(null);
              form.reset();
              form.clearErrors();
            }
          }}
        >
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Plus className="size-4" /> Tambah
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>{editingMaterial ? 'Edit Material' : 'Tambah Material'}</DialogTitle>
              <DialogDescription>Tambahkan material {type} untuk produk ini.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Material</label>
                <Select value={form.data.material_id} onValueChange={(val) => form.setData('material_id', val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih material..." />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredAvailable.map((m) => (
                      <SelectItem key={m.id} value={m.id.toString()}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <InputError message={form.errors.material_id as string} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Default Usage</label>
                   <FormattedNumberInput
                      value={form.data.default_usage}
                      onValueChange={(value) => form.setData('default_usage', value)}
                      placeholder='cth: 0,9'
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
                {editingMaterial ? 'Update' : 'Add'} Material
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {filteredMaterials.length === 0 ? (
          <p className="text-sm text-slate-500">Tidak ada material {type} yang ditambahkan.</p>
        ) : (
          <div className="space-y-2">
            {filteredMaterials.map((material) => (
              <div key={material.id} className="flex items-center justify-between rounded border border-slate-200 p-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-900">{material.material_name}</span>
                    {material.is_required && <Badge variant="default" className="text-xs">Required</Badge>}
                  </div>
                  <p className="text-xs text-slate-500">
                    {material.default_usage} {material.default_unit || '-'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(material)}>
                    <Pencil className="size-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(material)}>
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
