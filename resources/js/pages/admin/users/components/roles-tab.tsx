import { useMemo, useState } from "react"
import type { Permission, RoleData } from "../types"
import RoleCard from "./role-card"
import { router } from "@inertiajs/react"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Plus, Shield } from "lucide-react";
import { DataTable } from "@/components/data-table";
import type { DataTableColumn } from "@/components/data-table"
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Props {
    role: RoleData[]
    permissions: Permission[]
    search?: string
    isOwner: boolean
    openEdit: (role: RoleData) => void
    openCreate?: () => void
    onDelete: (role: RoleData) => void
    groupPermissions: (perms: Permission[]) => Record<string, Permission[]>
    formatModuleName: (name: string) => string
}

export default function RolesTab({
    role,
    permissions,
    search = '',
    isOwner,
    openEdit,
    openCreate,
    onDelete,
    groupPermissions,
    formatModuleName,
}: Props) {
    const [typeFilter, setTypeFilter] = useState<string>('all');
    const [userFilter, setUserFilter] = useState<string>('all');

    const displayRole = useMemo(() => {
        return role.filter((r) => {
            const isOwnerRole = r.name.toLowerCase() === 'owner';
            if (typeFilter === 'system' && !isOwnerRole) return false;
            if (typeFilter === 'custom' && isOwnerRole) return false;

            const userCount = r.users_count || 0;
            if (userFilter === 'has_users' && userCount <= 0) return false;
            if (userFilter === 'no_users' && userCount > 0) return false;

            if (search.trim()) {
                if (!r.name.toLowerCase().includes(search.toLowerCase())) return false;
            }

            return true;
        });
    }, [role, typeFilter, userFilter, search]);

    const columns: DataTableColumn<RoleData>[] = [
        {
            header: 'Nama Role',
            accessor: 'name',
            cell: (row) => {
                const grouped = groupPermissions(row.permissions || []);
                const modules = Object.keys(grouped);
                const isOwnerRole = row.name.toLowerCase() === 'owner';

                return (
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <Shield className={`size-4 ${isOwnerRole ? 'text-purple-600' : 'text-primary'}`} />
                            <p className="font-bold text-foreground text-xs uppercase font-mono">
                                {row.name.replace(/_/g, ' ')}
                            </p>
                            {isOwnerRole && (
                                <span className="bg-purple-100 text-purple-700 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                                    System Core
                                </span>
                            )}
                            <span className="text-[11px] text-muted-foreground">
                                ({row.users_count || 0} Pengguna)
                            </span>
                        </div>
                        
                        {/* Modules Badges */}
                        <div className="flex flex-wrap gap-1 mt-1">
                            {modules.length > 0 ? (
                                modules.map((module) => (
                                    <span 
                                        key={module} 
                                        className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium text-foreground border border-border/60"
                                    >
                                        {formatModuleName(module)}
                                    </span>
                                ))
                            ) : (
                                <span className="text-xs text-muted-foreground italic">
                                    Tidak ada hak akses
                                </span>
                            )}
                        </div>
                    </div>
                );
            }
        },
        {
            header: 'Total Akses',
            accessor: 'permissions',
            cell: (row) => (
                <span className="font-mono text-xs font-semibold text-foreground">
                    {row.permissions?.length || 0} / {permissions.length}
                </span>
            )
        },
        {
            header: 'Aksi',
            accessor: 'id',
            sortable: false,
            cell: (row) => {
                const isOwnerRole = row.name.toLowerCase() === 'owner';
                if (isOwnerRole) {
                    return (
                        <span className="text-[11px] text-muted-foreground italic">
                            Terkunci (System)
                        </span>
                    );
                }

                return (
                    <div className="flex items-center gap-1.5">
                        <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs px-2 gap-1 cursor-pointer"
                            onClick={() => openEdit(row)}
                            title="Edit Role & Permissions"
                        >
                            <Edit className="h-3 w-3" />
                            <span className="hidden sm:inline">Edit</span>
                        </Button>
                        <Button
                            size="sm"
                            variant="destructive"
                            className="h-7 text-xs px-2 gap-1 cursor-pointer"
                            onClick={() => onDelete(row)}
                            title="Hapus Role"
                        >
                            <Trash2 className="h-3 w-3" />
                            <span className="hidden sm:inline">Hapus</span>
                        </Button>
                    </div>
                );
            }
        },
    ];

    return (
        <Card>
            <CardContent className="space-y-4 pt-6">
                <div className="grid gap-3 md:grid-cols-2">
                    <div className="grid gap-2">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            Filter Tipe Role
                        </label>
                        <Select value={typeFilter} onValueChange={setTypeFilter}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Pilih tipe role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Tipe Role</SelectItem>
                                <SelectItem value="system">System Core (Owner)</SelectItem>
                                <SelectItem value="custom">Custom / Operasional</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            Filter Pengguna
                        </label>
                        <Select value={userFilter} onValueChange={setUserFilter}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Pilih status pengguna" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Role</SelectItem>
                                <SelectItem value="has_users">Ada Pengguna (&gt;0)</SelectItem>
                                <SelectItem value="no_users">Belum Ada Pengguna (0)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <DataTable
                    columns={columns}
                    data={displayRole}
                    searchKeys={['name']}
                    searchPlaceholder="Cari nama role..."
                />
            </CardContent>
        </Card>
    )
}