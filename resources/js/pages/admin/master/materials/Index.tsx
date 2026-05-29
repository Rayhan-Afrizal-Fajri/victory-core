import { Head, router, useForm } from '@inertiajs/react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { DataTable } from '@/components/data-table';
import type { DataTableColumn } from '@/components/data-table';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import type { Material, Supplier } from '@/types';

type Props = {
  materials: Material[];
  suppliers: Supplier[];
};

export default function Index({ materials, suppliers }: Props) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);

  const materialForm = useForm({
    name: '',
    category: 'bahan' as 'bahan' | 'aksesoris',
    unit: '',
    default_supplier_id: '',
    harga_ecer: 0,
    harga_roll: 0,
    roll_qty: '',
    roll_unit: '',
    is_active: true,
  });

  const filteredMaterials = useMemo(() => materials, [materials]);

  const openEditDialog = (material: Material) => {
    setEditingMaterial(material);
    materialForm.setData({
      name: material.name,
      category: material.category,
      unit: material.unit || '',
      default_supplier_id: material.supplier_id?.toString() || '',
      harga_ecer: material.harga_ecer,
      harga_roll: material.harga_roll,
      roll_qty: material.roll_qty?.toString() || '',
      roll_unit: material.roll_unit || '',
      is_active: material.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleSubmitMaterial = () => {
    if (editingMaterial) {
      materialForm.put(route('materials.update', editingMaterial.id), {
        preserveScroll: true,
        onSuccess: () => {
          setIsDialogOpen(false);
          setEditingMaterial(null);
          materialForm.reset();
          toast.success('Material berhasil diperbarui');
        },
      });
      return;
    }

    materialForm.post(route('materials.store'), {
      preserveScroll: true,
      onSuccess: () => {
        setIsDialogOpen(false);
        materialForm.reset();
        toast.success('Material berhasil dibuat');
      },
    });
  };

  const handleDeleteMaterial = (material: Material) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus material "${material.name}"?`)) {
      return;
    }

    router.delete(route('materials.destroy', material.id), {
      preserveScroll: true,
      onSuccess: () => {
        toast.success('Material berhasil dihapus');
      },
    });
  };

  const categoryBadge = (category: 'bahan' | 'aksesoris') => {
    const classes: Record<'bahan' | 'aksesoris', string> = {
      bahan: 'bg-emerald-100 text-emerald-800',
      aksesoris: 'bg-amber-100 text-amber-800',
    };
    return <Badge className={classes[category]}>{category === 'bahan' ? 'Bahan' : 'Aksesoris'}</Badge>;
  };

  const columns: DataTableColumn<Material>[] = [
    {
      header: 'Material Name',
      accessor: 'name',
      cell: (row) => <span className="font-medium text-slate-900">{row.name}</span>,
    },
    {
      header: 'Category',
      accessor: 'category',
      cell: (row) => categoryBadge(row.category),
    },
    {
      header: 'Unit',
      accessor: 'unit',
      cell: (row) => <span className="text-slate-700">{row.unit || '-'}</span>,
    },
    {
      header: 'Supplier',
      accessor: 'supplier_name',
      cell: (row) => <span className="text-slate-700">{row.supplier_name || '-'}</span>,
    },
    {
      header: 'Harga Ecer',
      accessor: 'harga_ecer',
      cell: (row) => <span className="text-slate-700">Rp {row.harga_ecer.toLocaleString()}</span>,
    },
    {
      header: 'Harga Roll',
      accessor: 'harga_roll',
      cell: (row) => <span className="text-slate-700">Rp {row.harga_roll.toLocaleString()}</span>,
    },
    {
      header: 'Status',
      accessor: 'is_active',
      cell: (row) => (
        <Badge variant={row.is_active ? 'default' : 'secondary'}>
          {row.is_active ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      header: 'Action',
      accessor: 'id',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => openEditDialog(row)}>
            <Pencil className="size-4" />
          </Button>
          <Button variant="destructive" size="sm" onClick={() => handleDeleteMaterial(row)}>
            <Trash2 className="size-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <Head title="Master Materials" />
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
              Master Data
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
              Materials & Components
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-slate-500">
              Kelola bahan baku dan aksesoris yang digunakan dalam produksi garment.
            </p>
          </div>
          <Dialog
            open={isDialogOpen}
            onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) {
                setEditingMaterial(null);
                materialForm.reset();
                materialForm.clearErrors();
              }
            }}
          >
            <DialogTrigger asChild>
              <Button variant="default" className="inline-flex items-center gap-2">
                <Plus className="size-4" /> Tambah Material
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingMaterial ? 'Edit Material' : 'Tambah Material Baru'}</DialogTitle>
                <DialogDescription>
                  {editingMaterial ? 'Perbarui informasi material.' : 'Tambahkan material baru untuk digunakan dalam BOM.'}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-slate-700">Nama Material</label>
                  <Input
                    value={materialForm.data.name}
                    onChange={(e) => materialForm.setData('name', e.target.value)}
                  />
                  <InputError message={materialForm.errors.name as string} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-slate-700">Kategori</label>
                    <Select value={materialForm.data.category} onValueChange={(val) => materialForm.setData('category', val as 'bahan' | 'aksesoris')}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bahan">Bahan</SelectItem>
                        <SelectItem value="aksesoris">Aksesoris</SelectItem>
                      </SelectContent>
                    </Select>
                    <InputError message={materialForm.errors.category as string} />
                  </div>

                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-slate-700">Unit</label>
                    <Input
                      value={materialForm.data.unit}
                      onChange={(e) => materialForm.setData('unit', e.target.value)}
                      placeholder="meter, pcs, kg, etc"
                    />
                    <InputError message={materialForm.errors.unit as string} />
                  </div>
                </div>

                <div className="grid gap-2">
                  <label className="text-sm font-medium text-slate-700">Default Supplier</label>
                  <Select value={materialForm.data.default_supplier_id} onValueChange={(val) => materialForm.setData('default_supplier_id', val)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih supplier..." />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id.toString()}>
                          {supplier.nama}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <InputError message={materialForm.errors.default_supplier_id as string} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-slate-700">Harga Ecer</label>
                    <Input
                      type="number"
                      value={materialForm.data.harga_ecer}
                      onChange={(e) => materialForm.setData('harga_ecer', parseFloat(e.target.value))}
                    />
                    <InputError message={materialForm.errors.harga_ecer as string} />
                  </div>

                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-slate-700">Harga Roll</label>
                    <Input
                      type="number"
                      value={materialForm.data.harga_roll}
                      onChange={(e) => materialForm.setData('harga_roll', parseFloat(e.target.value))}
                    />
                    <InputError message={materialForm.errors.harga_roll as string} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-slate-700">Roll Qty</label>
                    <Input
                      type="number"
                      value={materialForm.data.roll_qty}
                      onChange={(e) => materialForm.setData('roll_qty', e.target.value)}
                    />
                    <InputError message={materialForm.errors.roll_qty as string} />
                  </div>

                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-slate-700">Roll Unit</label>
                    <Input
                      value={materialForm.data.roll_unit}
                      onChange={(e) => materialForm.setData('roll_unit', e.target.value)}
                    />
                    <InputError message={materialForm.errors.roll_unit as string} />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={materialForm.data.is_active}
                    onChange={(e) => materialForm.setData('is_active', e.target.checked)}
                  />
                  <label htmlFor="is_active" className="text-sm font-medium text-slate-700">
                    Active
                  </label>
                </div>
              </div>

              <DialogFooter>
                <Button onClick={handleSubmitMaterial} disabled={materialForm.processing}>
                  {editingMaterial ? 'Update' : 'Create'} Material
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="bg-white rounded-lg border border-slate-200">
          <DataTable columns={columns} data={filteredMaterials} />
        </div>
      </div>
    </>
  );
}

Index.layout = (page) => <AppLayout children={page} />;
