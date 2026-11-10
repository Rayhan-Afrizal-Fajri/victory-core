import { router } from "@inertiajs/react"
import { useMemo, useState } from "react"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { KeyRound, Edit, Trash2, Plus } from "lucide-react";
import { DataTable } from "@/components/data-table";
import type { DataTableColumn } from "@/components/data-table"
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { UserData } from "../types"

interface Props {
    users: UserData[]
    search?: string
    openEdit: (user: UserData) => void
    openPassword?: (user: UserData) => void
    openCreate?: () => void
    onDelete: (user: UserData) => void
}

export default function UsersTab({ users, search = '', openEdit, openPassword, openCreate, onDelete }: Props) {
    const [roleFilter, setRoleFilter] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    const roleOptions = useMemo(() => {
        const rolesSet = new Set<string>();
        users.forEach((u) => {
            u.roles?.forEach((r) => {
                if (r.name) rolesSet.add(r.name);
            });
        });
        return Array.from(rolesSet).sort();
    }, [users]);

    // Handler Switch Status
    const handleToggleStatus = (user: UserData, checked: boolean) => {
        router.patch(`/users/${user.id}/toggle-status`, {
            is_active: checked
        }, {
            preserveScroll: true,
            onSuccess: () => toast.success(`Status ${user.name} berhasil diubah.`),
            onError: (errs) => toast.error(Object.values(errs).join('\n') || 'Gagal mengubah status'),
        });
    };

    const columns: DataTableColumn<UserData>[] = [
        {
            header: 'Nama',
            accessor: 'name',
            cell: (row) => (
                <div>
                    <p className="font-semibold text-foreground text-xs">{row.name}</p>
                    <p className="text-[11px] text-muted-foreground">{row.email}</p>
                </div>
            )
        },
        {
            header: 'Role',
            accessor: 'roles',
            cell: (row) => {
                const roleName = row.roles?.[0]?.name ? row.roles[0].name.replace(/_/g, ' ') : 'No Role';
                const isOwner = row.roles?.[0]?.name?.toLowerCase() === 'owner';
                return (
                    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold capitalize ${
                        isOwner
                            ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300'
                            : 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
                    }`}>
                        {roleName}
                    </span>
                );
            }
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
                        className="data-[state=checked]:bg-emerald-500 cursor-pointer" 
                    />
                    <span className={`text-xs font-semibold ${row.is_active ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                        {row.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                </div>
            ),
        },
        {
            header: 'Aksi',
            accessor: 'id',
            sortable: false,
            cell: (row) => (
                <div className="flex items-center gap-1.5">
                    <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs px-2 gap-1 cursor-pointer"
                        onClick={() => openEdit(row)}
                        title="Edit User"
                    >
                        <Edit className="h-3 w-3" />
                        <span className="hidden sm:inline">Edit</span>
                    </Button>

                    {openPassword && (
                        <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs px-2 gap-1 cursor-pointer"
                            onClick={() => openPassword(row)}
                            title="Ganti Password"
                        >
                            <KeyRound className="h-3 w-3" />
                            <span className="hidden sm:inline">Password</span>
                        </Button>
                    )}

                    <Button
                        size="sm"
                        variant="destructive"
                        className="h-7 text-xs px-2 gap-1 cursor-pointer"
                        onClick={() => onDelete(row)}
                        title="Hapus User"
                    >
                        <Trash2 className="h-3 w-3" />
                        <span className="hidden sm:inline">Hapus</span>
                    </Button>
                </div>
            )
        },
    ];

    const displayUsers = useMemo(() => {
        return users.filter((u) => {
            if (roleFilter !== 'all') {
                const hasRole = u.roles?.some((r) => r.name.toLowerCase() === roleFilter.toLowerCase());
                if (!hasRole) return false;
            }
            if (statusFilter !== 'all') {
                const isActive = Boolean(u.is_active);
                if (statusFilter === 'active' && !isActive) return false;
                if (statusFilter === 'inactive' && isActive) return false;
            }
            if (search.trim()) {
                const query = search.toLowerCase();
                const matchName = u.name.toLowerCase().includes(query);
                const matchEmail = u.email.toLowerCase().includes(query);
                if (!matchName && !matchEmail) return false;
            }
            return true;
        });
    }, [users, roleFilter, statusFilter, search]);

    return (
        <Card>
            <CardContent className="space-y-4 pt-6">
                <div className="grid gap-3 md:grid-cols-2">
                    <div className="grid gap-2">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            Filter Role
                        </label>
                        <Select value={roleFilter} onValueChange={setRoleFilter}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Pilih role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Role</SelectItem>
                                {roleOptions.map((role) => (
                                    <SelectItem key={role} value={role}>
                                        {role.replace(/_/g, ' ')}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            Filter Status
                        </label>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Pilih status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Status</SelectItem>
                                <SelectItem value="active">Aktif</SelectItem>
                                <SelectItem value="inactive">Nonaktif</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <DataTable
                    columns={columns}
                    data={displayUsers}
                    searchKeys={['name', 'email']}
                    searchPlaceholder="Cari nama atau email pengguna..."
                />
            </CardContent>
        </Card>
    )
}