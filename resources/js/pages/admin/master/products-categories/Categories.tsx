import { ReactNode, useState, FormEventHandler } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import ProductLayout from './layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import Badge from '@/components/sample/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { DataTable, DataTableColumn } from '@/components/data-table';
import { Pencil, Trash2 } from 'lucide-react';
import { store as CategoryStore, update as CategoryUpdate, destroy as CategoryDestroy } from '@/routes/product-categories';
import { Supplier } from '@/types';

// Sesuaikan tipe data dengan struktur tabel aslimu
interface Material {
  id: number;
  name: string;
  category: string;
  default_vendor: Supplier;
}

interface ManufacturingWork {
  id: number;
  name: string;
}

export interface ProductCategory {
  id: number;
  name: string;
  materials: { material_id: number; material: Material }[];
  manufacturing_works: { manufacturing_work_id: number; manufacturing_work: ManufacturingWork }[]; // Pastikan nama relasi sesuai response JSON controller
}

interface Props {
  categories: ProductCategory[];
  bahanMaterials: Material[];
  aksesorisMaterials: Material[];
  manufacturingWorks: ManufacturingWork[];
}



export default function Categories({ categories, bahanMaterials, aksesorisMaterials, manufacturingWorks }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const { data, setData, post, put, delete: destroy, processing, reset } = useForm({
    name: '',
    bahan_ids: [] as number[],
    aksesoris_ids: [] as number[],
    manufacturing_work_ids: [] as number[],
  });

  const openCreateDialog = () => {
    reset();
    setEditingId(null);
    setIsOpen(true);
  };

  const openEditDialog = (category: ProductCategory) => {
    reset();
    
    // Pisahkan ID bahan dan aksesoris berdasarkan category
    const bahanIds = category.materials
      .filter((m) => m.material.category === 'bahan')
      .map((m) => m.material_id);
      
    const aksesorisIds = category.materials
      .filter((m) => m.material.category === 'aksesoris')
      .map((m) => m.material_id);
      
    // Ambil ID manufacturing works
    // Note: Pastikan kamu menggunakan nama property JSON yang tepat, di model kamu menamainya manufacturingWork (singular)
    const workIds = (category.manufacturing_works || [])
      .map((w: any) => w.manufacturing_work_id);

    setData({
      name: category.name,
      bahan_ids: bahanIds,
      aksesoris_ids: aksesorisIds,
      manufacturing_work_ids: workIds,
    });
    
    setEditingId(category.id);
    setIsOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('Apakah kamu yakin ingin menghapus kategori ini?')) {
      router.delete(CategoryDestroy(id).url, {
            preserveScroll: true,
          });
    }
  };

  const handleSubmit: FormEventHandler = (e) => {
      e.preventDefault();

      if (editingId) {
          router.put(CategoryUpdate(editingId), data, {
              preserveScroll: true,
              onSuccess: () => setIsOpen(false),
          });
      } else {
          router.post(CategoryStore(), data, {
              preserveScroll: true,
              onSuccess: () => setIsOpen(false),
          });
      }
  };

  // Fungsi dinamis untuk handle perubahan nilai array checkbox
  const handleCheckboxChange = (
    field: 'bahan_ids' | 'aksesoris_ids' | 'manufacturing_work_ids',
    id: number,
    checked: boolean
  ) => {
    if (checked) {
      setData(field, [...data[field], id]);
    } else {
      setData(field, data[field].filter((val) => val !== id));
    }
  };

  // 1. Buat Helper Component untuk merender list yang dipotong
  const TruncatedList = ({ items, limit = 2 }: { items: string[], limit?: number }) => {
    if (!items || items.length === 0) {
      return <span className="italic text-slate-400">Belum ada data</span>;
    }

    const visibleItems = items.slice(0, limit);
    const hiddenCount = items.length - limit;

    return (
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-sm text-slate-600">
          {visibleItems.join(', ')}
        </span>
        
        {/* Jika ada sisa item, tampilkan Badge dan Tooltip */}
        {hiddenCount > 0 && (
          <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                {/* Bungkus dengan span agar bisa menerima 'ref' dari TooltipTrigger */}
                <span className="cursor-pointer inline-flex"> 
                  <Badge className="text-[10px] h-5 px-1.5 rounded-sm hover:bg-slate-200">
                    +{hiddenCount}
                  </Badge>
                </span>
              </TooltipTrigger>
              <TooltipContent className="max-w-75 p-3 shadow-md">
                {/* Menampilkan list lengkap di dalam tooltip */}
                <p className="text-sm text-slate-200 leading-relaxed">
                  <span className="font-semibold block mb-1 text-white">Daftar Lengkap:</span>
                  {items.join(', ')}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    );
  };

  const columns: DataTableColumn<ProductCategory>[] = [
    {
      header: 'Nama Kategori',
      accessor: 'name',
      cell: (row) => <span className="font-medium text-slate-900">{row.name}</span>,
    },
    {
    header: 'Default Material',
    accessor: 'materials',
    sortable: false,
    cell: (row) => {
      // Ambil nama material saja
      const materialsList = (row.materials || [])
        .map((item) => item.material?.name)
        .filter(Boolean);

      // Gunakan helper component, tampilkan maksimal 3 nama awal
      return <TruncatedList items={materialsList} limit={3} />;
    },
    },
    {
      header: 'Default Work',
      accessor: 'manufacturing_works', 
      sortable: false,
      cell: (row) => {
        // Ambil nama proses pekerjaan saja
        const worksList = (row.manufacturing_works || [])
          .map((item) => item.manufacturing_work?.name)
          .filter(Boolean);

        // Gunakan helper component, tampilkan maksimal 2 nama awal
        return <TruncatedList items={worksList} limit={2} />;
      },
    },
    {
      header: 'Action',
      accessor: 'id',
      sortable: false,
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => openEditDialog(row)}>
            <Pencil className="size-4" />
          </Button>
          <Button variant="destructive" size="sm" onClick={() => handleDelete(row.id)}>
            <Trash2 className="size-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <Head title="Master Categories" />
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
              Product Categories
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-slate-500">
              Kelola kategori produk dan atur default bahan, aksesoris, & proses pengerjaan.
            </p>
          </div>
          <Button onClick={openCreateDialog}>+ Tambah Kategori</Button>
        </div>

        <DataTable columns={columns} data={categories} searchKeys={['name']} />

      </div>

      {/* Dialog Form Create & Edit */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-175 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Kategori' : 'Tambah Kategori Baru'}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6 pt-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nama Kategori</Label>
              <Input
                id="name"
                value={data.name}
                onChange={(e) => setData('name', e.target.value)}
                placeholder="Contoh: T-Shirt Lengan Panjang"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Box Pilihan Bahan */}
              <div className="space-y-3 p-4 border rounded-md bg-slate-50">
                <Label className="text-base font-semibold">Pilih Bahan</Label>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                  {bahanMaterials.map((bahan) => {
                    return (
                    <div key={bahan.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`bahan-${bahan.id}`}
                        checked={data.bahan_ids.includes(bahan.id)}
                        onCheckedChange={(checked) => 
                          handleCheckboxChange('bahan_ids', bahan.id, checked === true)
                        }
                      />
                      <Label htmlFor={`bahan-${bahan.id}`} className="font-normal cursor-pointer">
                        {bahan.name} - {bahan.default_vendor.nama_perusahaan || bahan.default_vendor.nama || '-' }
                      </Label>
                    </div>
                  )
                  })}
                  {bahanMaterials.length === 0 && <span className="text-xs text-slate-500">Data bahan kosong.</span>}
                </div>
              </div>

              {/* Box Pilihan Aksesoris */}
              <div className="space-y-3 p-4 border rounded-md bg-slate-50">
                <Label className="text-base font-semibold">Pilih Aksesoris</Label>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                  {aksesorisMaterials.map((aksesoris) => (
                    <div key={aksesoris.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`aks-${aksesoris.id}`}
                        checked={data.aksesoris_ids.includes(aksesoris.id)}
                        onCheckedChange={(checked) => 
                          handleCheckboxChange('aksesoris_ids', aksesoris.id, checked === true)
                        }
                      />
                      <Label htmlFor={`aks-${aksesoris.id}`} className="font-normal cursor-pointer">
                        {aksesoris.name} - {aksesoris.default_vendor.nama_perusahaan || aksesoris.default_vendor.nama || '-' }
                      </Label>
                    </div>
                  ))}
                  {aksesorisMaterials.length === 0 && <span className="text-xs text-slate-500">Data aksesoris kosong.</span>}
                </div>
              </div>
            </div>

            {/* Box Pilihan Manufacturing Work */}
            <div className="space-y-3 p-4 border rounded-md bg-slate-50">
              <Label className="text-base font-semibold">Pilih Proses Pengerjaan (Manufacturing Works)</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-2">
                {manufacturingWorks.map((work) => (
                  <div key={work.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`work-${work.id}`}
                      checked={data.manufacturing_work_ids.includes(work.id)}
                      onCheckedChange={(checked) => 
                        handleCheckboxChange('manufacturing_work_ids', work.id, checked === true)
                      }
                    />
                    <Label htmlFor={`work-${work.id}`} className="font-normal cursor-pointer">
                      {work.name}
                    </Label>
                  </div>
                ))}
                {manufacturingWorks.length === 0 && <span className="text-xs text-slate-500">Data proses pengerjaan kosong.</span>}
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Batal
              </Button>
              <Button type='submit' variant="default" disabled={processing}>
                {processing ? 'Menyimpan...' : 'Simpan Kategori'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

// BUNGKUS DENGAN KEDUA LAYOUT
Categories.layout = (page: ReactNode) => (
  <AppLayout
    title="Master Products Management"
    description="Kelola data master produk & kategori"
    information="Master Product & Category"
    breadcrumbs={[
      { title: 'Product Categories', href: '' },
    ]}
  >
    <ProductLayout>{page}</ProductLayout>
  </AppLayout>
);