import { Head, router, useForm } from '@inertiajs/react';
import { Plus, Pencil, Trash2, Eye } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { DataTable } from '@/components/data-table';
import type { DataTableColumn } from '@/components/data-table';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import type { Product } from '@/types';
import { FormattedNumberInput } from '@/components/ui/formatted-number-input';

type Props = {
  products: Product[];
  materials: any[];
  works: any[];
};

export default function Index({ products, materials, works }: Props) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const productForm = useForm({
    name: '',
    category: '',
    description: '',
    is_active: true,
    is_pattern_available: false,
    materials: [] as any[],
    manufacturing_works: [] as any[],
  });

  const filteredProducts = useMemo(() => products, [products]);

  const openEditDialog = (product: any) => {
    // Jika Anda ingin Load full data relasi saat edit, pastikan index() me-load data tersebut.
    // Jika data pivot tidak di-load di index, Anda mungkin butuh Axios untuk fetch data detail produk terlebih dahulu, 
    // atau gunakan metode form kosong ini hanya untuk *Create*.
    setEditingProduct(product);
    productForm.setData({
      name: product.name,
      category: product.category || '',
      description: product.description || '',
      is_active: product.is_active,
      is_pattern_available: product.is_pattern_available,
      materials: product.product_materials || [], // Asumsi ada relation loaded, jika belum biarkan []
      manufacturing_works: product.product_manufacturing_works || [],
    });
    setIsDialogOpen(true);
  };

  const handleSubmitProduct = () => {
    if (editingProduct) {
      productForm.put(route('products.update', editingProduct.id), {
        preserveScroll: true,
        onSuccess: () => {
          setIsDialogOpen(false);
          setEditingProduct(null);
          productForm.reset();
          toast.success('Produk berhasil diperbarui');
        },
      });
      return;
    }

    productForm.post(route('products.store'), {
      preserveScroll: true,
      onSuccess: () => {
        setIsDialogOpen(false);
        productForm.reset();
        toast.success('Produk berhasil dibuat');
      },
    });
  };

  // Function Handler untuk menambah Baris Bahan
  const addMaterialRow = () => {
    productForm.setData('materials', [
      ...productForm.data.materials,
      { material_id: '', type: 'bahan', default_usage: 0, default_unit: '', harga_ecer: 0, harga_roll: 0, is_required: true }
    ]);
  };

  // Function Handler untuk menambah Baris Work
  const addWorkRow = () => {
    productForm.setData('manufacturing_works', [
      ...productForm.data.manufacturing_works,
      { manufacturing_work_id: '', default_usage: 1, default_unit: '', min_estimate: 0, max_estimate: 0, is_required: true }
    ]);
  };

  const handleToggleStatus = (product: Product, checked: boolean) => {
    router.patch(`/products/${product.id}/toggle-status`, {
      is_active: checked
    }, {
      preserveScroll: true,
      onSuccess: () => toast.success(`Status ${product.name} berhasil diubah.`),
      onError: () => toast.error('Gagal mengubah status.')
    });
  };

  const handleTogglePattern = (product: Product, checked: boolean) => {
    router.patch(`/products/${product.id}/toggle-pattern`, {
      is_pattern_available: checked
    }, {
      preserveScroll: true,
      onSuccess: () => toast.success(`Status pola ${product.name} berhasil diubah.`),
      onError: () => toast.error('Gagal mengubah status pola.')
    });
  };

  const handleDeleteProduct = (product: Product) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus produk "${product.name}"?`)) {
      return;
    }

    router.delete(route('products.destroy', product.id), {
      preserveScroll: true,
      onSuccess: () => {
        toast.success('Produk berhasil dihapus');
      },
    });
  };

  const columns: DataTableColumn<Product>[] = [
    {
      header: 'Product Name',
      accessor: 'name',
      cell: (row) => <span className="font-medium text-slate-900">{row.name}</span>,
    },
    {
      header: 'Category',
      accessor: 'category',
      cell: (row) => <span className="text-slate-700">{row.category || '-'}</span>,
    },
    {
      header: 'Bahan',
      accessor: 'materials_count',
      cell: (row) => <span className="text-slate-700 text-center">{row.materials_count}</span>,
    },
    {
      header: 'Aksesoris',
      accessor: 'accessories_count',
      cell: (row) => <span className="text-slate-700 text-center">{row.accessories_count}</span>,
    },
    {
      header: 'Manufaktur',
      accessor: 'manufacturing_count',
      cell: (row) => <span className="text-slate-700 text-center">{row.manufacturing_count}</span>,
    },
    {
      header: 'Status',
      accessor: 'is_active',
      cell: (row) => (
        <div className="flex items-center gap-2">
            <Switch
                checked={Boolean(row.is_active)}
                onCheckedChange={(checked) => handleToggleStatus(row, checked)}
                // Opsional: ganti warna switch khusus status
                className="data-[state=checked]:bg-emerald-500" 
            />
            <span className={`text-sm font-medium ${row.is_active ? 'text-emerald-700' : 'text-slate-500'}`}>
                {row.is_active ? 'Active' : 'Inactive'}
            </span>
        </div>
      ),
    },
    {
      header: 'Pola',
      accessor: 'is_pattern_available',
      cell: (row) => (
        <div className="flex items-center gap-2">
            <Switch
                checked={Boolean(row.is_pattern_available)}
                onCheckedChange={(checked) => handleTogglePattern(row, checked)}
                className='data-[state=checked]:bg-emerald-500'
            />
            <span className={`text-sm font-medium ${row.is_pattern_available ? 'text-emerald-700' : 'text-slate-500'}`}>
                {row.is_pattern_available ? 'Tersedia' : 'Tidak Tersedia'}
            </span>
        </div>
      ),
    },
    {
      header: 'Action',
      accessor: 'id',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.get(route('products.show', row.id))}
          >
            <Eye className="size-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => openEditDialog(row)}>
            <Pencil className="size-4" />
          </Button>
          <Button variant="destructive" size="sm" onClick={() => handleDeleteProduct(row)}>
            <Trash2 className="size-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <Head title="Master Products" />
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
              Master Data
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
              Products & Articles
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-slate-500">
              Kelola template produk/artikel garment beserta komponen bahan, aksesoris, dan manufaktur.
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) { setEditingProduct(null); productForm.reset(); }
          }}>
            <DialogTrigger asChild>
              <Button variant="default" className="inline-flex items-center gap-2">
                <Plus className="size-4" /> Tambah Produk
              </Button>
            </DialogTrigger>
            <DialogContent className="w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingProduct ? 'Edit Produk' : 'Tambah Produk Baru'}</DialogTitle>
              </DialogHeader>
              
              <div className="grid gap-6 py-4">
                {/* 1. INFORMASI UTAMA */}
                <div className="grid grid-cols-2 gap-4 border-b pb-4">
                  <div className="col-span-2 md:col-span-1">
                    <label className="text-sm font-medium">Nama Produk</label>
                    <Input value={productForm.data.name} onChange={(e) => productForm.setData('name', e.target.value)} />
                    <InputError message={productForm.errors.name as string} />
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <label className="text-sm font-medium">Kategori</label>
                    <Input value={productForm.data.category} onChange={(e) => productForm.setData('category', e.target.value)} />
                  </div>
                </div>

                {/* 2. TABEL BAHAN & MATERIAL */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-md font-semibold">Komponen Bahan & Aksesoris</h3>
                    <Button type="button" variant="outline" size="sm" onClick={addMaterialRow}>+ Tambah Bahan</Button>
                  </div>
                  <div className="border rounded-md p-3 space-y-3 bg-slate-50">
                    {productForm.data.materials.map((mat, index) => (
                      <div key={index} className="grid grid-cols-6 gap-2 items-center bg-white p-2 rounded border">
                        <div className="col-span-2">
                          <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                            value={mat.material_id}
                            onChange={(e) => {
                                const newMats = [...productForm.data.materials];
                                newMats[index].material_id = e.target.value;
                                productForm.setData('materials', newMats);
                            }}
                          >
                            <option value="">Pilih Bahan...</option>
                            {materials.map((m) => (<option key={m.id} value={m.id}>{m.name}</option>))}
                          </select>
                        </div>
                        <div className="col-span-1">

                          <FormattedNumberInput 
                              placeholder="Usage" 
                              value={mat.default_usage} 
                              allowDecimal={true} // Aktifkan jika usage memperbolehkan desimal (misal 0.5 kg)
                              onValueChange={(value) => {
                                  const newMats = [...productForm.data.materials];
                                  newMats[index].default_usage = value;
                                  productForm.setData('materials', newMats);
                              }} 
                          />
                        </div>
                        <div className="col-span-1">
                          <FormattedNumberInput 
                              placeholder="Harga Ecer" 
                              value={mat.harga_ecer} 
                              allowDecimal={true} // Aktifkan jika harga memperbolehkan desimal
                              onValueChange={(value) => {
                                  const newMats = [...productForm.data.materials];
                                  newMats[index].harga_ecer = value;
                                  productForm.setData('materials', newMats);
                              }} 
                          />
                        </div>
                        <div className="col-span-1">
                          <FormattedNumberInput 
                              placeholder="Harga Roll" 
                              value={mat.harga_roll} 
                              allowDecimal={true} // Aktifkan jika harga memperbolehkan desimal
                              onValueChange={(value) => {
                                  const newMats = [...productForm.data.materials];
                                  newMats[index].harga_roll = value;
                                  productForm.setData('materials', newMats);
                              }} 
                          />
                        </div>
                        <div className="col-span-1 flex justify-end">
                           <Button type="button" variant="destructive" size="icon" onClick={() => {
                               const newMats = productForm.data.materials.filter((_, i) => i !== index);
                               productForm.setData('materials', newMats);
                           }}><Trash2 className="size-4" /></Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. TABEL MANUFAKTUR */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-md font-semibold">Proses Manufaktur</h3>
                    <Button type="button" variant="outline" size="sm" onClick={addWorkRow}>+ Tambah Proses</Button>
                  </div>
                  <div className="border rounded-md p-3 space-y-3 bg-slate-50">
                    {productForm.data.manufacturing_works.map((work, index) => (
                      <div key={index} className="grid grid-cols-5 gap-2 items-center bg-white p-2 rounded border">
                        <div className="col-span-2">
                          <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                            value={work.manufacturing_work_id}
                            onChange={(e) => {
                                const newWorks = [...productForm.data.manufacturing_works];
                                newWorks[index].manufacturing_work_id = e.target.value;
                                productForm.setData('manufacturing_works', newWorks);
                            }}
                          >
                            <option value="">Pilih Proses...</option>
                            {works.map((w) => (<option key={w.id} value={w.id}>{w.name}</option>))}
                          </select>
                        </div>
                        <div className="col-span-1">
                          <Input type="number" placeholder="Min Est" value={work.min_estimate} 
                             onChange={(e) => {
                                 const newWorks = [...productForm.data.manufacturing_works];
                                 newWorks[index].min_estimate = parseFloat(e.target.value);
                                 productForm.setData('manufacturing_works', newWorks);
                             }} />
                        </div>
                        <div className="col-span-1">
                           <Input type="number" placeholder="Max Est" value={work.max_estimate} 
                             onChange={(e) => {
                                 const newWorks = [...productForm.data.manufacturing_works];
                                 newWorks[index].max_estimate = parseFloat(e.target.value);
                                 productForm.setData('manufacturing_works', newWorks);
                             }} />
                        </div>
                        <div className="col-span-1 flex justify-end">
                           <Button type="button" variant="destructive" size="icon" onClick={() => {
                               const newWorks = productForm.data.manufacturing_works.filter((_, i) => i !== index);
                               productForm.setData('manufacturing_works', newWorks);
                           }}><Trash2 className="size-4" /></Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button onClick={handleSubmitProduct} disabled={productForm.processing}>
                  {editingProduct ? 'Simpan Perubahan' : 'Buat Produk'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="bg-white rounded-lg border border-slate-200">
          <DataTable 
            columns={columns}
            data={filteredProducts}
            searchKeys={['name', 'category']} 
            searchPlaceholder="Cari nama produk atau kategori..."
          />
        </div>
      </div>
    </>
  );
}

Index.layout = (page) => <AppLayout children={page} />;
