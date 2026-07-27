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
import productMaterials from '@/routes/product-materials';

interface Props {
  productId: number;
  materials: any[]; // Sesuaikan tipe dengan schema Anda
  materialOptions: any[]; // Sesuaikan tipe dengan schema Anda
  suppliers: Supplier[];
  units: any[];
  availableMaterials: any[];
  type: 'bahan' | 'aksesoris';
  title: string;
}

export default function ProductMaterialSection({ productId, materials, availableMaterials, materialOptions, type, title, suppliers, units }: Props) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCustomUnit, setIsCustomUnit] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<any | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');

  const filteredMaterials = materials.filter((m) => m.type === type);
  const filteredAvailable = availableMaterials.filter((m) => m.category === type);
  const filteredMaterialOptions = materialOptions.filter((m) => m.category === type);

  const selectedGroup = filteredMaterialOptions.find((m) => m.group_id === selectedGroupId);

  const supplierType = type === 'bahan' ? 'Bahan Baku' : 'Aksesoris';
  const availableSuppliers = selectedGroup 
    ? suppliers.filter(s => selectedGroup.variants.some((v: any) => v.supplier_id === s.id))
    : [];

  const handleMaterialGroupChange = (groupId: string) => {
    setSelectedGroupId(groupId);
    
    // Reset seluruh form yang bergantung pada pilihan spesifik (karena belum pilih supplier)
    form.setData((prevData) => ({
      ...prevData,
      material_id: '', 
      default_supplier_id: '',
      default_usage: 0,
      default_unit: '',
      harga_ecer: 0,
      harga_roll: 0,
      notes: '',
    }));
  };

  const handleSupplierChange = (supplierId: string) => {
    if (!selectedGroup) return;

    // Cari data variasi (material asli) yang cocok dengan supplier ini
    const variant = selectedGroup.variants.find((v: any) => v.supplier_id?.toString() === supplierId);

    if (variant) {
      form.setData((prev) => ({
        ...prev,
        material_id: variant.material_id.toString(), // INI ID MATERIAL YANG BENAR!
        default_supplier_id: supplierId,
        default_usage: variant.default_usage || 0,
        default_unit: variant.unit || '',
        harga_ecer: variant.harga_ecer || 0,
        harga_roll: variant.harga_roll || 0,
        notes: variant.notes || '',
      }));
    } else {
      form.setData('default_supplier_id', supplierId);
    }
  };

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
      form.put(productMaterials.update(editingMaterial.id).url, {
        onSuccess: () => {
          setIsDialogOpen(false);
          setEditingMaterial(null);
          form.reset();
          toast.success('Material berhasil diperbarui');
        },
      });
      return;
    }

    form.post(productMaterials.store().url, {
      onSuccess: () => {
        setIsDialogOpen(false);
        form.reset();
        toast.success('Material berhasil ditambahkan');
      },
    });
  };

  //buat handleMateialChange agar ketika memilih material, default usage, default unit, harga ecer, harga roll, default supplier id otomatis terisi sesuai material yang dipilih
  const handleMaterialChange = (materialId: string) => {
    const selectedMaterial = materialOptions.find((m) => m.id.toString() === materialId);

    if (selectedMaterial) {
      // Gunakan callback (prevData) agar terhindar dari stale state
      form.setData((prevData) => ({
        ...prevData,
        material_id: materialId,
        // default_usage: selectedMaterial.default_usage || 0,
        // default_unit: selectedMaterial.unit || '',
        // harga_ecer: selectedMaterial.default_harga_ecer || 0,
        // harga_roll: selectedMaterial.default_harga_roll || 0,
        // default_supplier_id: selectedMaterial.default_vendor_id?.toString() || '',
        // notes: selectedMaterial.description?.toString() || '',
      }));

      // Filter suppliers based on the selected material's suppliers array's id
    } else {
      // Fallback jika material tidak ditemukan
      form.setData('material_id', materialId);
    }
  }

  const handleEdit = (material: any) => {
    setEditingMaterial(material);

    // Cari nama group (group_id) dari material yang sedang diedit berdasarkan material_id
    const group = filteredMaterialOptions.find(g => 
      g.variants.some((v: any) => v.material_id.toString() === material.material_id.toString())
    );

    if (group) {
      setSelectedGroupId(group.group_id);
    }

    form.setData({
      product_id: productId,
      material_id: material.material_id.toString(),
      type: material.type,
      default_usage: material.default_usage,
      default_unit: material.default_unit || '',
      default_supplier_id: material.default_supplier_id?.toString() || '',
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
    form.delete(productMaterials.destroy(material.id).url, {
      onSuccess: () => toast.success('Material berhasil dihapus'),
    });
  };

  const toggleCustomUnit = () => {
    setIsCustomUnit((prev) => !prev);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg">{title}</CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) { 
                setEditingMaterial(null); 
                setSelectedGroupId(''); // <--- Tambahkan ini
                form.reset(); 
                form.clearErrors(); 
            }
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
                  <Select value={selectedGroupId} onValueChange={(val) => {
                    // form.setData('material_id', val);
                    handleMaterialGroupChange(val);
                  }}>
                    <SelectTrigger className='w-full'><SelectValue placeholder="Pilih material..." /></SelectTrigger>
                    <SelectContent>
                      {filteredMaterialOptions.map((m) => (<SelectItem key={m.group_id} value={m.group_id.toString()}>{m.name}</SelectItem>))}
                    </SelectContent>
                  </Select>
                  <InputError message={form.errors.material_id as string} />
                </div>

                <div className="grid gap-2">
                  <label className="text-sm font-medium">Supplier</label>
                  <Select 
                    disabled={!selectedGroupId} // <--- Disabled jika material belum dipilih
                    value={form.data.default_supplier_id} 
                    onValueChange={handleSupplierChange}
                  >
                    <SelectTrigger className='w-full'>
                      <SelectValue placeholder={!selectedGroupId ? "Pilih material dulu..." : "Pilih supplier..."} />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSuppliers.map((s) => (
                        <SelectItem key={s.id} value={s.id.toString()}>
                          {s.nama_perusahaan ?? '-'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <InputError message={form.errors.default_supplier_id as string} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Penggunaan Default</label>
                  <FormattedNumberInput disabled={!form.data.material_id} value={form.data.default_usage} onValueChange={(val) => form.setData('default_usage', val)} placeholder='cth: 0.9' />
                  <InputError message={form.errors.default_usage as string} />
                </div>
                {isCustomUnit ? (
                    <>
                    <div className='grid gap-2'>
                      <label className="text-sm font-medium">Satuan (Unit)</label>
                      <Input disabled={!form.data.material_id} value={form.data.default_unit} onChange={(e) => form.setData('default_unit', e.target.value)} placeholder="kg, pcs, lusin" />
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
                      <Select disabled={!form.data.material_id} value={form.data.default_unit} onValueChange={(val) => form.setData('default_unit', val)}>
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
                  <label className="text-sm font-medium">Harga Ecer</label>
                  <FormattedNumberInput disabled={!form.data.material_id} value={form.data.harga_ecer} onValueChange={(val) => form.setData('harga_ecer', val)} />
                  <InputError message={form.errors.harga_ecer as string} />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Harga Roll / Grosir</label>
                  <FormattedNumberInput disabled={!form.data.material_id} value={form.data.harga_roll} onValueChange={(val) => form.setData('harga_roll', val)} />
                  <InputError message={form.errors.harga_roll as string} />
                </div>
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium">Catatan (Opsional)</label>
                <Textarea disabled={!form.data.material_id} value={form.data.notes} onChange={(e) => form.setData('notes', e.target.value)} rows={3} />
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