declare const route: (name: string, ...params: unknown[]) => string;

import { Head, router, useForm } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { Plus, Pencil, Trash2, Save } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { DataTable } from '@/components/data-table';
import type { DataTableColumn } from '@/components/data-table';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';

type DefaultSizeBreakdown = {
  id: number;
  type: 'color' | 'fabric' | 'size' | 'unit';
  label: string;
  sequence: number;
};

type Props = {
  defaultSizeBreakdowns: DefaultSizeBreakdown[];
};

export default function Index({ defaultSizeBreakdowns }: Props) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<DefaultSizeBreakdown | null>(null);

  // State untuk Drag & Drop
  const [localBreakdowns, setLocalBreakdowns] = useState<DefaultSizeBreakdown[]>(defaultSizeBreakdowns);
  const [changedTypes, setChangedTypes] = useState<Set<string>>(new Set());

  // Sinkronisasi local state saat props data berubah (misal setelah tambah/edit/hapus)
  useEffect(() => {
    setLocalBreakdowns(defaultSizeBreakdowns);
    setChangedTypes(new Set());
  }, [defaultSizeBreakdowns]);

  const form = useForm({
    type: 'size' as 'color' | 'fabric' | 'size' | 'unit',
    label: '',
  });

  const filteredItems = useMemo(() => defaultSizeBreakdowns, [defaultSizeBreakdowns]);

  const openEditDialog = (item: DefaultSizeBreakdown) => {
    setEditingItem(item);
    form.setData({
      type: item.type,
      label: item.label,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (editingItem) {
      form.put(route('size-breakdowns.update', editingItem.id), {
        preserveScroll: true,
        onSuccess: () => {
          setIsDialogOpen(false);
          setEditingItem(null);
          form.reset();
          toast.success('Default size breakdown berhasil diperbarui');
        },
      });
      return;
    }

    form.post(route('size-breakdowns.store'), {
      preserveScroll: true,
      onSuccess: () => {
        setIsDialogOpen(false);
        form.reset();
        toast.success('Default size breakdown berhasil dibuat');
      },
    });
  };

  const handleDelete = (item: DefaultSizeBreakdown) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus "${item.label}"?`)) {
      return;
    }

    router.delete(route('size-breakdowns.destroy', item.id), {
      preserveScroll: true,
      onSuccess: () => {
        toast.success('Default size breakdown berhasil dihapus');
      },
    });
  };

  // --- HANDLER REORDER ---
  const handleReorder = (type: string, newData: DefaultSizeBreakdown[]) => {
    setLocalBreakdowns((prev) => {
      // Ambil data tipe lain yang tidak digeser
      const otherTypes = prev.filter((item) => item.type !== type);
      // Gabungkan dengan data baru dari tabel yang digeser
      return [...otherTypes, ...newData];
    });

    // Tandai bahwa tabel tipe ini sudah digeser urutannya
    setChangedTypes((prev) => new Set(prev).add(type));
  };

  const handleSaveOrder = (type: string) => {
    // Ambil semua ID berdasarkan tipe (sesuai urutan state terbaru)
    const orderedIds = localBreakdowns
      .filter((item) => item.type === type)
      .map((item) => item.id);

    router.post(
      route('size-breakdowns.reorder'), 
      { type, ordered_ids: orderedIds }, 
      {
        preserveScroll: true,
        onSuccess: () => {
          toast.success(`Urutan ${type} berhasil disimpan`);
          setChangedTypes((prev) => {
            const newSet = new Set(prev);
            newSet.delete(type); // Hilangkan tombol simpan urutan untuk tipe ini
            return newSet;
          });
        },
      }
    );
  };

  const columns: DataTableColumn<DefaultSizeBreakdown>[] = [
    {
      header: 'Label',
      accessor: 'label',
      sortable: false,
      cell: (row) => <span className="font-medium text-slate-900">{row.label}</span>,
    },
    {
      header: 'Type',
      accessor: 'type',
      sortable: false,
      cell: (row) => (
        <Badge variant={row.type === 'size' ? 'default' : 'secondary'}>
          {row.type}
        </Badge>
      ),
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
          <Button variant="destructive" size="sm" onClick={() => handleDelete(row)}>
            <Trash2 className="size-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <Head title="Default Size Breakdowns" />
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Master Data</p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Default Size Breakdowns</h1>
            <p className="max-w-2xl text-sm leading-6 text-slate-500">
              Kelola daftar default ukuran, warna, dan material yang sering dipakai.
            </p>
          </div>
          <Dialog
            open={isDialogOpen}
            onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) {
                setEditingItem(null);
                form.reset();
                form.clearErrors();
              }
            }}
          >
            <DialogTrigger asChild>
              <Button variant="default" className="inline-flex items-center gap-2">
                <Plus className="size-4" /> Tambah Item
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl">
              <DialogHeader>
                <DialogTitle>{editingItem ? 'Edit Default Size Breakdown' : 'Tambah Default Size Breakdown'}</DialogTitle>
                <DialogDescription>
                  {editingItem ? 'Perbarui item default breakdown.' : 'Tambahkan item default breakdown baru.'}
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-[0.5fr_2fr] gap-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-slate-700">Type</label>
                  <Select value={form.data.type} onValueChange={(val) => form.setData('type', val as 'color' | 'fabric' | 'size')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="color">Color</SelectItem>
                      <SelectItem value="fabric">Fabric</SelectItem>
                      <SelectItem value="size">Size</SelectItem>
                      <SelectItem value="unit">Unit</SelectItem>
                    </SelectContent>
                  </Select>
                  <InputError message={form.errors.type as string} />
                </div>

                <div className="grid gap-2">
                  <label className="text-sm font-medium text-slate-700">Label</label>
                  <Input value={form.data.label} onChange={(e) => form.setData('label', e.target.value)} />
                  <InputError message={form.errors.label as string} />
                </div>
              </div>

              <DialogFooter>
                <Button onClick={handleSubmit} disabled={form.processing}>
                  {editingItem ? 'Update' : 'Create'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {['color', 'fabric', 'size', 'unit'].map((type) => {
            // Gunakan localBreakdowns agar urutan UI bereaksi seketika
            const data = localBreakdowns.filter((item) => item.type === type);
            const isChanged = changedTypes.has(type);

            return (
              <div key={type} className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-700">
                    {type}
                  </h3>
                  {/* Tombol Simpan Urutan muncul hanya untuk tabel yang digeser */}
                  {isChanged && (
                    <Button 
                      size="sm" 
                      onClick={() => handleSaveOrder(type)} 
                      className="h-8 gap-2 bg-emerald-600 hover:bg-emerald-700"
                    >
                      <Save className="size-3.5" /> Simpan Urutan
                    </Button>
                  )}
                </div>
                
                <DataTable 
                  columns={columns} 
                  data={data} 
                  searchKeys={['label']} 
                  enableReorder={true} // Aktifkan fitur reorder dari DataTable
                  onReorder={(newData) => handleReorder(type, newData as DefaultSizeBreakdown[])} 
                />
              </div>
            )
          })}
        </div>
      </div>
    </>
  );
}

Index.layout = (page: ReactNode) => (
  <AppLayout
    title=""
    description=""
    information=""
    breadcrumbs={[
        {
            title: 'Master Size Breakdowns',
            href: '',
        },
    ]}
  >
    {page}
  </AppLayout>
);