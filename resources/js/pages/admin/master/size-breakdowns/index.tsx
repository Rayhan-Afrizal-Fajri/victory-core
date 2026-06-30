declare const route: (name: string, ...params: unknown[]) => string;

import { Head, router, useForm } from '@inertiajs/react';
import type { ReactNode } from 'react';
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
import AppLayout from '@/layouts/app-layout';

type DefaultSizeBreakdown = {
  id: number;
  type: 'color' | 'fabric' | 'size';
  label: string;
};

type Props = {
  defaultSizeBreakdowns: DefaultSizeBreakdown[];
};

export default function Index({ defaultSizeBreakdowns }: Props) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<DefaultSizeBreakdown | null>(null);

  const form = useForm({
    type: 'size' as 'color' | 'fabric' | 'size',
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

  const columns: DataTableColumn<DefaultSizeBreakdown>[] = [
    {
      header: 'Label',
      accessor: 'label',
      cell: (row) => <span className="font-medium text-slate-900">{row.label}</span>,
    },
    {
      header: 'Type',
      accessor: 'type',
      cell: (row) => (
        <Badge variant={row.type === 'size' ? 'default' : 'secondary'}>
          {row.type}
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

        <div className=" grid grid-cols-3 gap-2">
          {['color', 'fabric', 'size'].map((type) => {
            const data = filteredItems.filter((item) => item.type === type);
            return (
                <DataTable columns={columns} data={data} searchKeys={['label']}/>
            )
          })}
        </div>
      </div>
    </>
  );
}

Index.layout = (page: ReactNode) => <AppLayout title="" description="" information="" children={page} />;
