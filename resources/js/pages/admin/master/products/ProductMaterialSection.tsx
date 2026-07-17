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
import { FormattedNumberInput } from '@/components/ui/formatted-number-input';
import { Supplier } from '@/types';
import { Textarea } from '@/components/ui/textarea';

interface Props {
  productId: number;
  materials: any[]; // Sesuaikan tipe dengan schema Anda
  suppliers: Supplier[];
  availableMaterials: any[];
  type: 'bahan' | 'aksesoris';
  title: string;
}

export default function ProductMaterialSection({ productId, materials, availableMaterials, type, title, suppliers }: Props) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<any | null>(null);

  const filteredMaterials = materials.filter((m) => m.type === type);
  const filteredAvailable = availableMaterials.filter((m) => m.category === type);

  const formatIDR = (value: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);

  const form = useForm({
    product_id: productId,
    material_id: '',
    type: type,
    default_usage: 0,
    default_unit: '',
    default_supplier_id: '',
    harga_ecer: 0,
    harga_roll: 0,
    sort_order: filteredMaterials.length,
    is_required: true,
    notes: '',
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

  const handleEdit = (material: any) => {
    setEditingMaterial(material);
    form.setData({
      product_id: productId,
      material_id: material.material_id.toString(),
      type: material.type,
      default_usage: material.default_usage,
      default_unit: material.default_unit || '',
      default_supplier_id: material.default_supplier_id.toString() || '',
      harga_ecer: material.harga_ecer || 0,
      harga_roll: material.harga_roll || 0,
      sort_order: material.sort_order,
      is_required: material.is_required,
      notes: material.notes || '',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (material: any) => {
    if (!confirm('Hapus material ini?')) return;
    form.delete(route('product-materials.destroy', material.id), {
      onSuccess: () => toast.success('Material berhasil dihapus'),
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg">{title}</CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) { setEditingMaterial(null); form.reset(); form.clearErrors(); }
          }}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2"><Plus className="size-4" /> Tambah</Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>{editingMaterial ? 'Edit Material' : 'Tambah Material'}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Material</label>
                  <Select value={form.data.material_id} onValueChange={(val) => form.setData('material_id', val)}>
                    <SelectTrigger className='w-full'><SelectValue placeholder="Pilih material..." /></SelectTrigger>
                    <SelectContent>
                      {filteredAvailable.map((m) => (<SelectItem key={m.id} value={m.id.toString()}>{m.name}</SelectItem>))}
                    </SelectContent>
                  </Select>
                  <InputError message={form.errors.material_id as string} />
                </div>

                <div className="grid gap-2">
                  <label className="text-sm font-medium">Supplier</label>
                  <Select value={form.data.default_supplier_id} onValueChange={(val) => form.setData('default_supplier_id', val)}>
                    <SelectTrigger className='w-full'><SelectValue placeholder="Pilih supplier..." /></SelectTrigger>
                    <SelectContent>
                      {suppliers.map((s) => (<SelectItem key={s.id} value={s.id.toString()}>{s.nama_perusahaan ?? '-'}</SelectItem>))}
                    </SelectContent>
                  </Select>
                  <InputError message={form.errors.default_supplier_id as string} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Penggunaan Default</label>
                  <FormattedNumberInput value={form.data.default_usage} onValueChange={(val) => form.setData('default_usage', val)} placeholder='cth: 0.9' />
                  <InputError message={form.errors.default_usage as string} />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Satuan (Unit)</label>
                  <Input value={form.data.default_unit} onChange={(e) => form.setData('default_unit', e.target.value)} placeholder="kg, pcs, lusin" />
                  <InputError message={form.errors.default_unit as string} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Harga Ecer</label>
                  <FormattedNumberInput value={form.data.harga_ecer} onValueChange={(val) => form.setData('harga_ecer', val)} />
                  <InputError message={form.errors.harga_ecer as string} />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Harga Roll / Grosir</label>
                  <FormattedNumberInput value={form.data.harga_roll} onValueChange={(val) => form.setData('harga_roll', val)} />
                  <InputError message={form.errors.harga_roll as string} />
                </div>
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium">Catatan (Opsional)</label>
                <Textarea value={form.data.notes} onChange={(e) => form.setData('notes', e.target.value)} rows={3} />
              </div>
            </div>

            <DialogFooter>
              <Button onClick={handleSubmit} disabled={form.processing}>{editingMaterial ? 'Update' : 'Add'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      
      <CardContent>
        {filteredMaterials.length === 0 ? (
          <p className="text-sm text-slate-500">Tidak ada material {type} yang ditambahkan.</p>
        ) : (
          <div className="space-y-3">
            {filteredMaterials.map((material) => {
              const subtotal = material.default_usage * (material.harga_ecer || 0);

              // console.log(material);
              
              return (
                <div key={material.id} className="flex flex-col rounded border border-slate-200 p-3 bg-slate-50/50">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900">{material.material_name}</span>
                        {material.is_required && <Badge variant="default" className="text-[10px] h-4 px-1.5">Req</Badge>}
                      </div>
                      {material.defaultSupplier && (
                        <p className="text-xs text-slate-600 mt-1">
                          Supplier: <strong>{material.defaultSupplier.nama_perusahaan ?? '-'}</strong>
                        </p>
                      )}
                      <p className="text-xs text-slate-600 mt-1">
                        Pemakaian: <strong>{material.default_usage} {material.default_unit}</strong>
                      </p>
                      <p className="text-xs text-slate-500">
                        Harga Satuan: <strong>{formatIDR(material.harga_ecer)}</strong>
                      </p>
                      <p className="text-xs text-slate-500">
                        Catatan: <strong>{material.notes ?? '-'}</strong>
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleEdit(material)}><Pencil className="size-3.5" /></Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleDelete(material)}><Trash2 className="size-3.5 text-red-500" /></Button>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider">Subtotal</p>
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