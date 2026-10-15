import { Head, router, useForm } from '@inertiajs/react';
import { Plus, Pencil, Trash2, Eye, Loader2, AlertTriangle } from 'lucide-react';
import { ReactNode, useMemo, useState } from 'react';
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
import { formatCurrency } from '@/helpers/format';
import { store as ProductStore, update as ProductUpdate, destroy as ProductDestroy, show as ProductShow } from '@/routes/products';
import Select from 'react-select';

import ProductLayout from './layout';
import { ProductCategory } from './Categories';
import ImportConflictDialog, { ProductImportConflict } from './ImportConflictDialog';

type Props = {
  products: Product[];
  categories: ProductCategory[] | null;
  importConflicts?: ProductImportConflict[];
};

export default function Product({ products, categories, importConflicts = [] }: Props) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isConflictDialogOpen, setIsConflictDialogOpen] = useState(false);
  const [selectedConflictId, setSelectedConflictId] = useState<number | null>(null);

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const formData = new FormData();
      formData.append('file', e.target.files[0]);
      router.post('/products/import', formData as any, {
        preserveScroll: true,
        onStart: () => {
          setIsImporting(true);
        },
        onFinish: () => {
          setIsImporting(false);
          if (e.target) {
            e.target.value = '';
          }
        },
        onError: () => {
          toast.error('Gagal mengimport data produk.');
        },
      });
    }
  };

  const categoryOptions = categories?.map((p)=>({
        value: p.id.toString(),
        label: p.name,
    }))

  const productForm = useForm({
    name: '',
    product_category_id: '',
    description: '',
    is_active: true,
    is_pattern_available: false,
  });

  const filteredProducts = useMemo(() => products, [products]);

  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    productForm.setData({
      name: product.name,
      product_category_id: product.product_category_id ? product.product_category_id.toString() : '',
      description: product.description || '',
      is_active: product.is_active,
      is_pattern_available: product.is_pattern_available,
    });
    setIsDialogOpen(true);
  };

  const handleSubmitProduct = () => {
    if (editingProduct) {
      productForm.put(ProductUpdate(editingProduct.id).url, {
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

    productForm.post(ProductStore().url, {
      preserveScroll: true,
      onSuccess: () => {
        setIsDialogOpen(false);
        productForm.reset();
        toast.success('Produk berhasil dibuat');
      },
    });
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

    router.delete(ProductDestroy(product.id).url, {
      preserveScroll: true,
      onSuccess: () => {
        toast.success('Produk berhasil dihapus');
      },
    });
  };

  const conflictMap = useMemo(() => {
    const map = new Map<number, ProductImportConflict>();
    importConflicts.forEach((c) => {
      map.set(c.existing_product_id, c);
    });
    return map;
  }, [importConflicts]);

  const columns: DataTableColumn<Product>[] = [
    {
      header: 'Product Name',
      accessor: 'name',
      cell: (row) => {
        const conflict = conflictMap.get(row.id);
        return (
          <div className="flex flex-col gap-1 items-start">
            <span className="font-medium text-slate-900">{row.name}</span>
            {conflict && (
              <button
                type="button"
                onClick={() => {
                  setSelectedConflictId(conflict.id);
                  setIsConflictDialogOpen(true);
                }}
                className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors cursor-pointer"
                title="Produk ini memiliki pembaruan dari import Excel yang dapat ditinjau"
              >
                <AlertTriangle className="size-3 text-amber-600" />
                Diperbarui (Sheet #{conflict.sheet_index})
              </button>
            )}
          </div>
        );
      },
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
      sortable: false,
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
      header: 'Estimasi HPP',
      accessor: 'hpp',
      cell: (row) => {
        // Kalkulasi Total Estimasi
        const totalMaterialCost = row.materials
          .filter(m => m.type === 'bahan')
          .reduce((acc, curr) => acc + (curr.default_usage * (curr.harga_ecer || 0)), 0);

        const totalAccessoryCost = row.materials
          .filter(m => m.type === 'aksesoris')
          .reduce((acc, curr) => acc + (curr.default_usage * (curr.harga_ecer || 0)), 0);

        const totalManufacturingCost = row.manufacturing_works
          .reduce((acc, curr) => acc + (curr.default_usage * (curr.max_estimate || 0)), 0);

        const grandTotal = totalMaterialCost + totalAccessoryCost + totalManufacturingCost;

        return (
          <div className="font-semibold text-emerald-600">
            {formatCurrency(grandTotal)}
          </div>
        );
      },
    },
    {
      header: 'Action',
      accessor: 'id',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.get(ProductShow(row.id).url)}
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
          <Dialog
            open={isDialogOpen}
            onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) {
                setEditingProduct(null);
                productForm.reset();
                productForm.clearErrors();
              }
            }}
          >
            <div className="flex items-center gap-2">
              <Button variant="outline" asChild>
                <a href="/products/export-template">Download Template</a>
              </Button>
              <div className="relative">
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  disabled={isImporting}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                  onChange={handleImport}
                />
                <Button variant="outline" disabled={isImporting} className="inline-flex items-center gap-2">
                  {isImporting ? (
                    <>
                      <Loader2 className="size-4 animate-spin text-slate-600" />
                      <span>Mengimport...</span>
                    </>
                  ) : (
                    <span>Import Data</span>
                  )}
                </Button>
              </div>
              <DialogTrigger asChild>
                <Button variant="default" className="inline-flex items-center gap-2">
                  <Plus className="size-4" /> Tambah Produk
                </Button>
              </DialogTrigger>
            </div>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingProduct ? 'Edit Produk' : 'Tambah Produk Baru'}</DialogTitle>
                <DialogDescription>
                  {editingProduct ? 'Perbarui informasi produk.' : 'Tambahkan template produk/artikel baru.'}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-slate-700">Nama Produk</label>
                  <Input
                    value={productForm.data.name}
                    onChange={(e) => productForm.setData('name', e.target.value)}
                    placeholder="T-Shirt Oversize, Hoodie, etc"
                  />
                  <InputError message={productForm.errors.name as string} />
                </div>

                <div className="grid gap-2">
                  <label className="text-sm font-medium text-slate-700">Kategori (Opsional)</label>
                  <Select
                      className="text-sm"
                      classNamePrefix="select"
                      options={categoryOptions}
                      isClearable={true}
                      value={
                          categoryOptions?.find(
                              x => x.value === productForm.data.product_category_id) || null
                      }
                      onChange={(option) => {
                          productForm.setData(
                              "product_category_id",
                              option?.value ?? ""
                          )
                      }}
                      placeholder="Pilih kategori (opsional)..."
                      // isDisabled={Boolean(workflow.quotation_created)}
                      isSearchable={true}
                  />
                  <InputError message={productForm.errors.product_category_id as string} />
                </div>

                <div className="grid gap-2">
                  <label className="text-sm font-medium text-slate-700">Deskripsi (Optional)</label>
                  <Textarea
                    value={productForm.data.description}
                    onChange={(e) => productForm.setData('description', e.target.value)}
                    placeholder="Deskripsi produk, spesifikasi, fitur khusus, etc"
                    rows={4}
                  />
                  <InputError message={productForm.errors.description as string} />
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                      id="is_active"
                      checked={productForm.data.is_active}
                      onCheckedChange={(checked) => productForm.setData('is_active', checked)}
                  />
                  <label
                    htmlFor="is_active"
                    className="text-sm font-medium text-slate-700 cursor-pointer select-none"
                  >
                    Active
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                      id="is_pattern_available"
                      checked={productForm.data.is_pattern_available}
                      onCheckedChange={(checked) => productForm.setData('is_pattern_available', checked)}
                  />                  
                  <label 
                      htmlFor="is_pattern_available" 
                      className="text-sm font-medium text-slate-700 cursor-pointer select-none"
                  >
                      Pola Tersedia
                  </label>
              </div>
              </div>

              <DialogFooter>
                <Button onClick={handleSubmitProduct} disabled={productForm.processing}>
                  {editingProduct ? 'Update' : 'Create'} Produk
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {isImporting && (
          <div className="flex items-center gap-3.5 p-4 bg-blue-50/80 border border-blue-200 text-blue-900 rounded-lg shadow-xs animate-in fade-in duration-200">
            <Loader2 className="size-5 animate-spin text-blue-600 shrink-0" />
            <div className="space-y-0.5">
              <p className="text-sm font-semibold text-blue-900">
                Sedang memproses import data produk...
              </p>
              <p className="text-xs text-blue-700">
                Mohon tunggu beberapa saat. Sistem sedang membaca seluruh sheet Excel, memproses BOM (bahan baku, aksesoris, & manufaktur), serta menyinkronkan vendor.
              </p>
            </div>
          </div>
        )}

        {importConflicts.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-amber-50/90 border border-amber-200 text-amber-950 rounded-lg shadow-xs animate-in fade-in duration-200">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-md bg-amber-100 text-amber-700 shrink-0 mt-0.5">
                <AlertTriangle className="size-5" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-sm font-semibold text-amber-900">
                  Perhatian: Terdapat {importConflicts.length} Data Produk Diperbarui dari Import Excel
                </h4>
                <p className="text-xs text-amber-800 leading-relaxed max-w-3xl">
                  Sheet produk pada file Excel memiliki nama yang sama dengan produk yang sudah ada di database sehingga data bahan & manufaktur diperbarui. Anda dapat meninjau perbedaannya dan memilih apakah data tersebut <strong>tetap diperbarui</strong> atau <strong>dipisahkan menjadi produk baru tersendiri</strong>.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              <Button
                size="sm"
                onClick={() => {
                  setSelectedConflictId(null);
                  setIsConflictDialogOpen(true);
                }}
                className="bg-amber-600 hover:bg-amber-700 text-white shadow-xs text-xs h-9 px-4"
              >
                Tinjau {importConflicts.length} Produk Diperbarui
              </Button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg border border-slate-200">
          <DataTable 
            columns={columns}
            data={filteredProducts}
            searchKeys={['name', 'category']} 
            searchPlaceholder="Cari nama produk atau kategori..."
          />
        </div>

        <ImportConflictDialog
          open={isConflictDialogOpen}
          onOpenChange={setIsConflictDialogOpen}
          conflicts={importConflicts}
          selectedConflictId={selectedConflictId}
        />
      </div>
    </>
  );
}

// BUNGKUS DENGAN KEDUA LAYOUT DI SINI
Product.layout = (page: ReactNode) => (
  <AppLayout
    title="Master Products Management"
    description="Kelola data master produk & kategori"
    information="Master Product & Category"
    breadcrumbs={[
      {
        title: 'Master Products',
        href: '', 
      },
    ]}
  >
    <ProductLayout>{page}</ProductLayout>
  </AppLayout>
);