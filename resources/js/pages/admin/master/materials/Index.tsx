import { Head, router, useForm } from '@inertiajs/react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { ReactNode, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { DataTable } from '@/components/data-table';
import type { DataTableColumn } from '@/components/data-table';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea'; // Pastikan komponen ini tersedia
import FormattedNumberInput from '@/components/ui/formatted-number-input';
import AppLayout from '@/layouts/app-layout';
import type { Material, Supplier } from '@/types';
import { formatCurrency, formatDecimal } from '@/helpers/format';

interface Breakdown {
  id: number;
  label: string;
}

type Props = {
  materials: Material[];
  suppliers: Supplier[];
  colors: Breakdown[];
  units: Breakdown[];
};

export default function Index({ materials, suppliers, colors, units }: Props) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);

  // Inisialisasi semua field secara eksplisit
  const { data, setData, post, put, reset, clearErrors, errors, processing } = useForm({
    name: '',
    category: 'bahan' as 'bahan' | 'aksesoris',
    unit: '',
    default_color: '',
    default_vendor_id: '',
    default_harga_roll: 0,
    default_harga_ecer: 0,
    default_price_type: '',
    default_usage: '',
    description: '',
    is_active: true,
  });

  const filteredMaterials = useMemo(() => materials, [materials]);

  const openEditDialog = (material: Material) => {
    setEditingMaterial(material);
    
    // Perbaikan Error TS: Pastikan semua number / undefined dikonversi menjadi string
    // agar sesuai persis dengan state awal di useForm.
    setData({
      name: material.name,
      category: (material.category?.toLowerCase() === 'bahan baku' || material.category?.toLowerCase() === 'bahan') ? 'bahan' : 'aksesoris',
      unit: material.unit || '',
      default_color: material.default_color || '',
      default_vendor_id: material.default_vendor_id ? material.default_vendor_id.toString() : '',
      default_harga_ecer: material.default_harga_ecer || 0,
      default_harga_roll: material.default_harga_roll || 0,
      default_price_type: material.default_price_type || '',
      default_usage: material.default_usage ? material.default_usage.toString() : '',
      description: material.description || '',
      is_active: material.is_active,
    });
    
    setIsDialogOpen(true);
  };

  const handleSubmitMaterial = () => {
    if (editingMaterial) {
      put(route('materials.update', editingMaterial.id), {
        preserveScroll: true,
        onSuccess: () => {
          setIsDialogOpen(false);
          setEditingMaterial(null);
          reset();
          toast.success('Material berhasil diperbarui');
        },
      });
      return;
    }

    post(route('materials.store'), {
      preserveScroll: true,
      onSuccess: () => {
        setIsDialogOpen(false);
        reset();
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
    });
  };

  const categoryBadge = (category: string) => {
    const isBahan = category?.toLowerCase() === 'bahan' || category?.toLowerCase() === 'bahan baku';
    return (
      <Badge className={isBahan ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}>
        {isBahan ? 'Bahan Baku' : 'Aksesoris'}
      </Badge>
    );
  };

  const columns: DataTableColumn<Material>[] = [
    {
      header: 'Material Name',
      accessor: 'name',
      cell: (row) => <span className="font-medium text-slate-900">{row.name}</span>,
    },
    {
      header: 'Vendor',
      accessor: 'default_vendor_name',
      cell: (row) => <span className="font-medium text-slate-900">{row.default_vendor_name}</span>,
    },
    {
      header: 'Category',
      accessor: 'category',
      cell: (row) => categoryBadge(row.category),
    },
    {
      header: 'Penggunaan Default',
      accessor: 'default_usage',
      cell: (row) => <span className="text-slate-700">{formatDecimal(row.default_usage || 0)} {row.unit || 'unit'}</span>,
    },
    {
      header: 'Harga Default',
      accessor: 'default_harga_ecer',
      cell: (row) => (
        <div className='grid gap-2'>
          <div className="flex gap-1"><p className='text-xs text-slate-500'>Ecer: </p><span className="text-xs text-slate-700">{formatCurrency(row.default_harga_ecer || 0)}</span></div>
          <div className="flex gap-1"><p className='text-xs text-slate-500'>Roll: </p><span className="text-xs text-slate-700">{formatCurrency(row.default_harga_roll || 0)}</span></div>
        </div>
      ),
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
                reset();
                clearErrors();
              }
            }}
          >
            <DialogTrigger asChild>
              <Button variant="default" className="inline-flex items-center gap-2">
                <Plus className="size-4" /> Tambah Material
              </Button>
            </DialogTrigger>
            
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingMaterial ? 'Edit Material' : 'Tambah Material Baru'}</DialogTitle>
                <DialogDescription>
                  {editingMaterial ? 'Perbarui informasi material.' : 'Tambahkan material baru untuk digunakan dalam BOM.'}
                </DialogDescription>
              </DialogHeader>
              
              {/* Form Grid yang Sudah Diperbaiki */}
              <div className="grid gap-4 py-2">
                
                {/* Nama Material */}
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-slate-700">Nama Material</label>
                  <Input
                    value={data.name}
                    onChange={(e) => setData('name', e.target.value)}
                  />
                  <InputError message={errors.name} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Kategori */}
                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-slate-700">Kategori</label>
                    <Select value={data.category} onValueChange={(val) => setData('category', val as 'bahan' | 'aksesoris')}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bahan">Bahan Baku</SelectItem>
                        <SelectItem value="aksesoris">Aksesoris</SelectItem>
                      </SelectContent>
                    </Select>
                    <InputError message={errors.category} />
                  </div>

                  {/* Unit */}
                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-slate-700">Unit</label>
                    <Select value={data.unit} onValueChange={(val) => setData('unit', val)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Pilih unit..." />
                      </SelectTrigger>
                      <SelectContent>
                        {units.map((u) => (
                          <SelectItem key={u.id} value={u.label.toString()}>
                            {u.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <InputError message={errors.unit} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Default Vendor / Supplier */}
                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-slate-700">Default Supplier</label>
                    <Select value={data.default_vendor_id} onValueChange={(val) => setData('default_vendor_id', val)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Pilih supplier..." />
                      </SelectTrigger>
                      <SelectContent>
                        {suppliers.map((supplier) => (
                          <SelectItem key={supplier.id} value={supplier.id.toString()}>
                            {/* Sesuaikan "supplier.nama" atau "supplier.name" dengan isi modelmu */}
                            {/* @ts-ignore */}
                            {supplier.nama_perusahaan || supplier.nama} 
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <InputError message={errors.default_vendor_id} />
                  </div>

                  {/* Default Warna */}
                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-slate-700">Default Warna</label>
                    <Select value={data.default_color} onValueChange={(val) => setData('default_color', val)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Pilih warna..." />
                      </SelectTrigger>
                      <SelectContent>
                        {colors.map((color) => (
                          <SelectItem key={color.id} value={color.label.toString()}>
                            {color.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <InputError message={errors.default_color} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Harga Ecer */}
                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-slate-700">Default Harga Ecer</label>
                    <FormattedNumberInput
                      value={data.default_harga_ecer}
                      onValueChange={(value) => setData('default_harga_ecer', value)}
                      placeholder="cth: 35.000"
                    />
                    <InputError message={errors.default_harga_ecer} />
                  </div>

                  {/* Harga Roll */}
                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-slate-700">Default Harga Roll</label>
                    <FormattedNumberInput
                      value={data.default_harga_roll}
                      onValueChange={(value) => setData('default_harga_roll', value)}
                      placeholder="cth: 120.000"
                    />
                    <InputError message={errors.default_harga_roll} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Tipe Harga Default */}
                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-slate-700">Tipe Harga Default</label>
                    <Select value={data.default_price_type} onValueChange={(val) => setData('default_price_type', val)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Pilih Tipe Harga..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ecer">Ecer</SelectItem>
                        <SelectItem value="roll">Roll / Grosir</SelectItem>
                      </SelectContent>
                    </Select>
                    <InputError message={errors.default_price_type} />
                  </div>

                  {/* Default Usage */}
                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-slate-700">Default Penggunaan (Usage)</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={data.default_usage}
                      onChange={(e) => setData('default_usage', e.target.value)}
                      placeholder="cth: 0.5"
                    />
                    <InputError message={errors.default_usage} />
                  </div>
                </div>

                {/* Deskripsi */}
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-slate-700">Keterangan / Deskripsi</label>
                  <Textarea
                    value={data.description}
                    onChange={(e) => setData('description', e.target.value)}
                    placeholder="Catatan tambahan material..."
                  />
                  <InputError message={errors.description} />
                </div>

                {/* Status Aktif */}
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={data.is_active}
                    onChange={(e) => setData('is_active', e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 shadow-sm focus:ring-indigo-500"
                  />
                  <label htmlFor="is_active" className="text-sm font-medium text-slate-700">
                    Material Aktif
                  </label>
                </div>
              </div>

              <DialogFooter>
                <Button onClick={handleSubmitMaterial} disabled={processing}>
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

Index.layout = (page: ReactNode) => (
  <AppLayout
    title=""
    description="Kelola bahan baku dan aksesoris yang digunakan dalam produksi garment."
    information="Master Materials"
    breadcrumbs={[
      {
        title: 'Materials',
        href: '',
      },
    ]}
  >
    {page}
  </AppLayout>
);