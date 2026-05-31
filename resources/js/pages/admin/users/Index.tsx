import { Head, router, useForm } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import type { ReactNode} from 'react';
import { useMemo, useState } from 'react';

import { toast } from 'sonner';
import { DataTable  } from '@/components/data-table';
import type {DataTableColumn} from '@/components/data-table';

import InputError from '@/components/input-error';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';

import { store as userStore, update as userUpdate, destroy as userDestroy } from '@/routes/users';


type Role = {
    id: number;
    name: string;
};

type UserRow = {
    id: number;
    name: string;
    email: string;
    role: string;
    is_active: boolean;
};

type Props = {
    users: UserRow[];
    roles: Role[];
};

export default function Index({ users, roles }: Props) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<UserRow | null>(null);

    const defaultRole = roles[0]?.name ?? '';

    const form = useForm({
        name: '',
        email: '',
        password: '',
        role: defaultRole,
        is_active: true,
    });

    const filteredUsers = useMemo(() => users, [users]);

    const openCreate = () => {
        setEditingUser(null);

        form.reset();

        form.setData({
            name: '',
            email: '',
            password: '',
            role: defaultRole,
            is_active: true,
        });

        setIsDialogOpen(true);
    };

    const openEdit = (user: UserRow) => {
        setEditingUser(user);

        form.setData({
            name: user.name,
            email: user.email,
            password: '',
            role: user.role,
            is_active: user.is_active,
        });

        setIsDialogOpen(true);
    };

    const closeDialog = () => {
        setIsDialogOpen(false);
        form.clearErrors();
    };

    const handleSubmit = () => {
        if (editingUser) {
            form.put(userUpdate(editingUser.id).url, {
                preserveScroll: true,
                onSuccess: closeDialog,
            });

            return;
        }

        form.post(userStore().url, {
            preserveScroll: true,
            onSuccess: closeDialog,
        });
    };

    const toggleStatus = (user: UserRow) => {

        const nextStatus = !user.is_active;
        router.patch(
            userUpdate(user.id).url,
            {
                ...user,
                password: '',
                is_active: !user.is_active,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Status Updated', {
                        description: `User berhasil ${nextStatus == true ? "diaktifkan" : 'dinonaktifkan'}`,
                    });
                }
            },
        );
    };
    
    const handleDelete = (user: UserRow) => {
        // const confirmed = window.confirm(
        //     `Yakin ingin menghapus user "${user.name}"?`
        // );

        // if (!confirmed) {
        //     return;
        // }

        // router.delete(userDestroy(user.id).url, {
        //     preserveScroll: true,
        //     onSuccess: () => {
        //         toast.success('User deleted', {
        //             description: "User berhasil dihapus",
        //         });
        //     },
        //     onError: () => {
        //         toast.error('User failed deleted', {
        //             description: "User gagal dihapus",
        //         });
        //     }
        // })
        toast.warning('Yakin ingin menghapus user?', {
            description: 'Tindakan ini tidak dapat dibatalkan.',
            action: {
                label: 'Hapus',
                onClick: () => {
                    router.delete(userDestroy(user.id).url, {
                        preserveScroll: true,
                        onSuccess: () => {
                            toast.success('User deleted', {
                                description: "User berhasil dihapus",
                            });
                        },
                        onError: () => {
                            toast.error('User failed deleted', {
                                description: "User gagal dihapus",
                            });
                        }
                    });
                },
            },
        });
    }

    const roleBadge = (role: string) => {
        const colors: Record<string, string> = {
            'Customer Service': 'bg-cyan-100 text-cyan-800',
            Designer: 'bg-slate-100 text-slate-800',
            Owner: 'bg-amber-100 text-amber-800',
            Finance: 'bg-emerald-100 text-emerald-800',
            PPIC: 'bg-blue-100 text-blue-800',
            Produksi: 'bg-violet-100 text-violet-800',
        };

        return (
            <Badge className={colors[role] ?? 'bg-gray-100 text-gray-800'}>
                {role}
            </Badge>
        );
    };

    const columns: DataTableColumn<UserRow>[] = [
        {
            header: 'User Name',
            accessor: 'name',
            cell: (row) => (
                <span className="font-medium text-slate-900">
                    {row.name}
                </span>
            ),
        },
        {
            header: 'Email',
            accessor: 'email',
            cell: (row) => (
                <span className="text-slate-700">
                    {row.email}
                </span>
            ),
        },
        {
            header: 'Division',
            accessor: 'role',
            cell: (row) => roleBadge(row.role),
        },
        {
            header: 'Status',
            accessor: 'is_active',
            cell: (row) => (
                <Button
                    size="sm"
                    variant={row.is_active ? 'default' : 'outline'}
                    onClick={() => toggleStatus(row)}
                >
                    {row.is_active ? 'Active' : 'Inactive'}
                </Button>
            ),
        },
        {
            header: 'Action',
            accessor: 'id',
            cell: (row) => (
                <>
                <Button
                    size="sm"
                    className='mr-2'
                    variant="outline"
                    onClick={() => openEdit(row)}
                >
                    Edit
                </Button>
                <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(row)}
                >
                    Hapus
                </Button>
                </>
            ),
        },
    ];

    return (
        <>
            <Head title="Users & Roles" />

            <div className="space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                            Admin · Users
                        </p>

                        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
                            Users & Role Management
                        </h1>

                        <p className="max-w-2xl text-sm leading-6 text-slate-500">
                            Buat user baru dan tetapkan role standar Spatie
                            untuk membatasi akses di setiap divisi produksi.
                        </p>
                    </div>

                    <Dialog
                        open={isDialogOpen}
                        onOpenChange={setIsDialogOpen}
                    >
                        <DialogTrigger asChild>
                            <Button
                                onClick={openCreate}
                                className="inline-flex items-center gap-2"
                            >
                                <Plus className="size-4" />
                                Buat User
                            </Button>
                        </DialogTrigger>

                        <DialogContent className="max-w-2xl">
                            <DialogHeader>
                                <DialogTitle>
                                    {editingUser
                                        ? 'Edit User'
                                        : 'Buat User Baru'}
                                </DialogTitle>

                                <DialogDescription>
                                    Kelola informasi akses, role manufaktur,
                                    dan status user untuk sistem operasi
                                    lapangan.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="grid gap-4">
                                <div className="grid gap-2">
                                    <label className="text-sm font-medium">
                                        Nama
                                    </label>

                                    <Input
                                        value={form.data.name}
                                        onChange={(e) =>
                                            form.setData(
                                                'name',
                                                e.target.value
                                            )
                                        }
                                    />

                                    <InputError
                                        message={form.errors.name}
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <label className="text-sm font-medium">
                                        Email
                                    </label>

                                    <Input
                                        value={form.data.email}
                                        onChange={(e) =>
                                            form.setData(
                                                'email',
                                                e.target.value
                                            )
                                        }
                                    />

                                    <InputError
                                        message={form.errors.email}
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <label className="text-sm font-medium">
                                        Password
                                    </label>

                                    <Input
                                        type="password"
                                        value={form.data.password}
                                        placeholder={
                                            editingUser
                                                ? 'Kosongkan untuk tidak mengubah'
                                                : ''
                                        }
                                        onChange={(e) =>
                                            form.setData(
                                                'password',
                                                e.target.value
                                            )
                                        }
                                    />

                                    <InputError
                                        message={form.errors.password}
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <label className="text-sm font-medium">
                                        Role
                                    </label>

                                    <Select
                                        value={form.data.role}
                                        onValueChange={(value) =>
                                            form.setData(
                                                'role',
                                                value
                                            )
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Pilih role" />
                                        </SelectTrigger>

                                        <SelectContent>
                                            {roles.map((role) => (
                                                <SelectItem
                                                    key={role.id}
                                                    value={role.name}
                                                >
                                                    {role.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    <InputError
                                        message={form.errors.role}
                                    />
                                </div>
                            </div>

                            <DialogFooter>
                                <Button
                                    variant="secondary"
                                    onClick={closeDialog}
                                >
                                    Batal
                                </Button>

                                <Button
                                    onClick={handleSubmit}
                                    disabled={form.processing}
                                >
                                    {editingUser
                                        ? 'Simpan Perubahan'
                                        : 'Buat User'}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                <Card>
                    <CardContent>
                        <DataTable
                            columns={columns}
                            data={filteredUsers}
                            searchKeys={['name', 'email']}
                            searchPlaceholder="Cari nama atau email"
                        />
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

Index.layout = (page: ReactNode) => (
    <AppLayout
        title=""
        information="Admin · Users"
        description="Atur batasan akses dan role manufaktur untuk tim produksi, finance, dan service."
    >
        {page}
    </AppLayout>
);