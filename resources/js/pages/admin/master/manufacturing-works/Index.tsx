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
import AppLayout from '@/layouts/app-layout';
import type { ManufacturingWork, Supplier } from '@/types';
import FormattedNumberInput from '@/components/ui/formatted-number-input';

type Props = {
  works: ManufacturingWork[];
  suppliers: Supplier[];
};

export default function Index({ works, suppliers }: Props) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingWork, setEditingWork] = useState<ManufacturingWork | null>(null);

  const workForm = useForm({
    name: '',
    default_unit: '',
    process_behavior: '',
    default_vendor_id: '',
    default_min_estimate: 0,
    default_max_estimate: 0,
    is_active: true,
  });

  const filteredWorks = useMemo(() => works, [works]);

  const openEditDialog = (work: ManufacturingWork) => {
    setEditingWork(work);
    workForm.setData({
      name: work.name,
      default_unit: work.default_unit || '',
      process_behavior: work.process_behavior || '',
      default_vendor_id: work.vendor_id?.toString() || '',
      default_min_estimate: work.default_min_estimate,
      default_max_estimate: work.default_max_estimate,
      is_active: work.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleSubmitWork = () => {
    if (editingWork) {
      workForm.put(route('manufacturing-works.update', editingWork.id), {
        preserveScroll: true,
        onSuccess: () => {
          setIsDialogOpen(false);
          setEditingWork(null);
          workForm.reset();
          toast.success('Manufacturing work berhasil diperbarui');
        },
      });
      return;
    }

    workForm.post(route('manufacturing-works.store'), {
      preserveScroll: true,
      onSuccess: () => {
        setIsDialogOpen(false);
        workForm.reset();
        toast.success('Manufacturing work berhasil dibuat');
      },
    });
  };

  const handleDeleteWork = (work: ManufacturingWork) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus work "${work.name}"?`)) {
      return;
    }

    router.delete(route('manufacturing-works.destroy', work.id), {
      preserveScroll: true,
      onSuccess: () => {
        toast.success('Manufacturing work berhasil dihapus');
      },
    });
  };

  const columns: DataTableColumn<ManufacturingWork>[] = [
    {
      header: 'Work Name',
      accessor: 'name',
      cell: (row) => <span className="font-medium text-slate-900">{row.name}</span>,
    },
    {
      header: 'Default Unit',
      accessor: 'default_unit',
      cell: (row) => <span className="text-slate-700">{row.default_unit || '-'}</span>,
    },
    {
      header: 'Process Behavior',
      accessor: 'behavior',
      cell: (row) => <span className="text-slate-700">{row.behavior || '-'}</span>,
    },
    {
      header: 'Vendor',
      accessor: 'vendor_name',
      cell: (row) => <span className="text-slate-700">{row.vendor_name || '-'}</span>,
    },
    {
      header: 'Min Estimate',
      accessor: 'default_min_estimate',
      cell: (row) => <span className="text-slate-700">{row.default_min_estimate.toLocaleString()}</span>,
    },
    {
      header: 'Max Estimate',
      accessor: 'default_max_estimate',
      cell: (row) => <span className="text-slate-700">{row.default_max_estimate.toLocaleString()}</span>,
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
          <Button variant="destructive" size="sm" onClick={() => handleDeleteWork(row)}>
            <Trash2 className="size-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <Head title="Manufacturing Works" />
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
              Master Data
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
              Manufacturing Works
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-slate-500">
              Kelola jenis pekerjaan manufaktur seperti cutting, jahit, QC, sablon, dan lainnya.
            </p>
          </div>
          <Dialog
            open={isDialogOpen}
            onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) {
                setEditingWork(null);
                workForm.reset();
                workForm.clearErrors();
              }
            }}
          >
            <DialogTrigger asChild>
              <Button variant="default" className="inline-flex items-center gap-2">
                <Plus className="size-4" /> Tambah Work
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingWork ? 'Edit Manufacturing Work' : 'Tambah Manufacturing Work Baru'}</DialogTitle>
                <DialogDescription>
                  {editingWork ? 'Perbarui informasi pekerjaan manufaktur.' : 'Tambahkan jenis pekerjaan manufaktur baru.'}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4">
                <div className="flex w-full gap-4">
                  <div className="grid gap-2 w-full">
                    <label className="text-sm font-medium text-slate-700">Nama Work</label>
                    <Input
                      value={workForm.data.name}
                      onChange={(e) => workForm.setData('name', e.target.value)}
                      placeholder="Cutting, Jahit, QC, Sablon, etc"
                    />
                    <InputError message={workForm.errors.name as string} />
                  </div>
                  <div className="grid gap-2 w-1/2">
                    <label className="text-sm font-medium text-slate-700">Default Unit</label>
                    <Input
                      value={workForm.data.default_unit}
                      onChange={(e) => workForm.setData('default_unit', e.target.value)}
                      placeholder="pcs, set, etc"
                    />
                    <InputError message={workForm.errors.default_unit as string} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">

                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-slate-700">Process Behavior</label>
                    <Select value={workForm.data.process_behavior} onValueChange={(val) => workForm.setData('process_behavior', val)}>
                      <SelectTrigger className='w-full'>
                        <SelectValue placeholder="Pilih proses..." />
                      </SelectTrigger>
                      <SelectContent>
                          <SelectItem value="production_process">
                              Production Process
                          </SelectItem>
                          <SelectItem value="costing_only">
                              Costing Only
                          </SelectItem>
                      </SelectContent>
                    </Select>
                    <InputError message={workForm.errors.default_vendor_id as string} />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-slate-700">Default Vendor</label>
                    <Select value={workForm.data.default_vendor_id} onValueChange={(val) => workForm.setData('default_vendor_id', val)}>
                      <SelectTrigger className='w-full'>
                        <SelectValue placeholder="Pilih vendor..." />
                      </SelectTrigger>
                      <SelectContent className=''>
                        {suppliers.map((supplier) => (
                          <SelectItem key={supplier.id} value={supplier.id.toString()}>
                            {supplier.nama}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <InputError message={workForm.errors.default_vendor_id as string} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-slate-700">Min Estimate</label>
                    <FormattedNumberInput
                        value={workForm.data.default_min_estimate}
                        onValueChange={(value) => workForm.setData('default_min_estimate', value)}
                        placeholder='cth: 35.000'
                    />
                    <InputError message={workForm.errors.default_min_estimate as string} />
                  </div>

                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-slate-700">Max Estimate</label>
                    <FormattedNumberInput
                        value={workForm.data.default_max_estimate}
                        onValueChange={(value) => workForm.setData('default_max_estimate', value)}
                        placeholder='cth: 35.000'
                    />
                    <InputError message={workForm.errors.default_max_estimate as string} />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={workForm.data.is_active}
                    onChange={(e) => workForm.setData('is_active', e.target.checked)}
                  />
                  <label htmlFor="is_active" className="text-sm font-medium text-slate-700">
                    Active
                  </label>
                </div>
              </div>

              <DialogFooter>
                <Button onClick={handleSubmitWork} disabled={workForm.processing}>
                  {editingWork ? 'Update' : 'Create'} Work
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="bg-white rounded-lg border border-slate-200">
          <DataTable columns={columns} data={filteredWorks} />
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
            title: 'Manufacturing Works',
            href: '',
        },
    ]}
  >
    {page}
  </AppLayout>
);
