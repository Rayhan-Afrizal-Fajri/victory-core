import type { Permission, RoleData } from "../types"
import RoleCard from "./role-card"
import { router } from "@inertiajs/react"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Plus, Shield } from "lucide-react";
import { DataTable } from "@/components/data-table";
import type { DataTableColumn } from "@/components/data-table"

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

    const displayRole = search.trim()
        ? role.filter(u => 
            u.name.toLowerCase().includes(search.toLowerCase())
          )
        : role;

    return (
        <div className="rounded-xl border bg-card shadow-xs overflow-hidden">
            <DataTable
                columns={columns}
                data={displayRole}
                searchKeys={['name']}
                searchPlaceholder="Cari nama role..."
            />
        </div>
    )
}