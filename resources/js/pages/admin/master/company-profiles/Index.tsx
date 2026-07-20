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
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import type { CompanyProfile } from '@/types';
import FormattedNumberInput from '@/components/ui/formatted-number-input';

type Props = {
  companyProfiles: CompanyProfile[];
};

export default function Index({ companyProfiles }: Props) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<CompanyProfile | null>(null);

  const profileForm = useForm({
    company_name: '',
    company_type: 'pkp' as 'pkp' | 'non_pkp',
    bank_type: '',
    tax_percentage: 0,
    account_number: '',
    account_name: '',
    address: '',
    swift_code: '',
  });

  const filteredProfiles = useMemo(() => companyProfiles, [companyProfiles]);

  const openEditDialog = (profile: CompanyProfile) => {
    setEditingProfile(profile);
    profileForm.setData({
      company_name: profile.company_name,
      company_type: profile.company_type,
      bank_type: profile.bank_type,
      tax_percentage: profile.tax_percentage || 0,
      account_number: profile.account_number,
      account_name: profile.account_name,
      address: profile.address,
      swift_code: profile.swift_code || '',
    });
    setIsDialogOpen(true);
  };

  const handleSubmitProfile = () => {
    if (editingProfile) {
      profileForm.put(route('company-profiles.update', editingProfile.id), {
        preserveScroll: true,
        onSuccess: () => {
          setIsDialogOpen(false);
          setEditingProfile(null);
          profileForm.reset();
          toast.success('Company profile berhasil diperbarui');
        },
      });
      return;
    }

    profileForm.post(route('company-profiles.store'), {
      preserveScroll: true,
      onSuccess: () => {
        setIsDialogOpen(false);
        profileForm.reset();
        toast.success('Company profile berhasil dibuat');
      },
    });
  };

  const handleDeleteProfile = (profile: CompanyProfile) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus company profile "${profile.company_name}"?`)) {
      return;
    }

    router.delete(route('company-profiles.destroy', profile.id), {
      preserveScroll: true,
      onSuccess: () => {
        toast.success('Company profile berhasil dihapus');
      },
    });
  };

  const columns: DataTableColumn<CompanyProfile>[] = [
    {
      header: 'Company Name',
      accessor: 'company_name',
      cell: (row) => <span className="font-medium text-slate-900">{row.company_name}</span>,
    },
    {
      header: 'Type',
      accessor: 'company_type',
      cell: (row) => (
        <Badge variant={row.company_type === 'pkp' ? 'default' : 'secondary'}>
          {row.company_type === 'pkp' ? 'PKP' : 'Non PKP'}
        </Badge>
      ),
    },
    {
      header: 'Bank',
      accessor: 'bank_type',
      cell: (row) => <span className="text-slate-700">{row.bank_type}</span>,
    },
    {
      header: 'Tax %',
      accessor: 'tax_percentage',
      cell: (row) => <span className="text-slate-700">{row.tax_percentage}%</span>,
    },
    {
      header: 'Account',
      accessor: 'account_number',
      sortable: false,
      cell: (row) => <span className="text-slate-700">{row.account_number}</span>,
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
          <Button variant="destructive" size="sm" onClick={() => handleDeleteProfile(row)}>
            <Trash2 className="size-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <Head title="Company Profiles" />
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Master Data</p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Company Profiles</h1>
            <p className="max-w-2xl text-sm leading-6 text-slate-500">
              Kelola data perusahaan yang digunakan pada dokumen dan purchase order.
            </p>
          </div>
          <Dialog
            open={isDialogOpen}
            onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) {
                setEditingProfile(null);
                profileForm.reset();
                profileForm.clearErrors();
              }
            }}
          >
            <DialogTrigger asChild>
              <Button variant="default" className="inline-flex items-center gap-2">
                <Plus className="size-4" /> Tambah Profil
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>{editingProfile ? 'Edit Company Profile' : 'Tambah Company Profile Baru'}</DialogTitle>
                <DialogDescription>
                  {editingProfile ? 'Perbarui data perusahaan.' : 'Tambahkan profil perusahaan baru untuk digunakan pada dokumen.'}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-slate-700">Nama Perusahaan</label>
                  <Input value={profileForm.data.company_name} onChange={(e) => profileForm.setData('company_name', e.target.value)} />
                  <InputError message={profileForm.errors.company_name as string} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-slate-700">Tipe Perusahaan</label>
                    <Select value={profileForm.data.company_type} onValueChange={(val) => profileForm.setData('company_type', val as 'pkp' | 'non_pkp')}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pkp">PKP</SelectItem>
                        <SelectItem value="non_pkp">Non PKP</SelectItem>
                      </SelectContent>
                    </Select>
                    <InputError message={profileForm.errors.company_type as string} />
                  </div>

                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-slate-700">Bank</label>
                    <Input value={profileForm.data.bank_type} onChange={(e) => profileForm.setData('bank_type', e.target.value)} />
                    <InputError message={profileForm.errors.bank_type as string} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-slate-700">Persentase Pajak</label>
                    <FormattedNumberInput value={profileForm.data.tax_percentage} onValueChange={(value) => profileForm.setData('tax_percentage', value)} />
                    <InputError message={profileForm.errors.tax_percentage as string} />
                  </div>

                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-slate-700">Nomor Rekening</label>
                    <Input value={profileForm.data.account_number} onChange={(e) => profileForm.setData('account_number', e.target.value)} />
                    <InputError message={profileForm.errors.account_number as string} />
                  </div>
                </div>

                <div className="grid gap-2">
                  <label className="text-sm font-medium text-slate-700">Nama Pemilik Rekening</label>
                  <Input value={profileForm.data.account_name} onChange={(e) => profileForm.setData('account_name', e.target.value)} />
                  <InputError message={profileForm.errors.account_name as string} />
                </div>

                <div className="grid gap-2">
                  <label className="text-sm font-medium text-slate-700">Alamat</label>
                  <Textarea value={profileForm.data.address} onChange={(e) => profileForm.setData('address', e.target.value)} />
                  <InputError message={profileForm.errors.address as string} />
                </div>

                <div className="grid gap-2">
                  <label className="text-sm font-medium text-slate-700">Swift Code</label>
                  <Input value={profileForm.data.swift_code} onChange={(e) => profileForm.setData('swift_code', e.target.value)} />
                  <InputError message={profileForm.errors.swift_code as string} />
                </div>
              </div>

              <DialogFooter>
                <Button onClick={handleSubmitProfile} disabled={profileForm.processing}>
                  {editingProfile ? 'Update' : 'Create'} Profile
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white">
          <DataTable columns={columns} data={filteredProfiles} />
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
            title: 'Master Company Profiles',
            href: '',
        },
    ]}
  >
    {page}
  </AppLayout>
);
