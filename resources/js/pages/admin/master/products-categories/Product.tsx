import { Head, router, useForm } from '@inertiajs/react';
import { Plus, Pencil, Trash2, Eye } from 'lucide-react';
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

type Props = {
  products: Product[];
  categories: ProductCategory[] | null;
};

export default function Product({ products, categories }: Props) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

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
      product_category_id: product.product_category_id.toString() || undefined,
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
            <DialogTrigger asChild>
              <Button variant="default" className="inline-flex items-center gap-2">
                <Plus className="size-4" /> Tambah Produk
              </Button>
            </DialogTrigger>
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
                  <label className="text-sm font-medium text-slate-700">Kategori</label>
                  <Select
                      className="text-sm"
                      classNamePrefix="select"
                      options={categoryOptions}
                      value={
                          categoryOptions?.find(
                              x => x.value === productForm.data.product_category_id)
                      }
                      onChange={(option) => {
                          productForm.setData(
                              "product_category_id",
                              option?.value ?? ""
                          )
                      }}
                      placeholder="Pilih produk..."
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