import type { Permission, RoleData } from "../types"
import RoleCard from "./role-card"
import { router } from "@inertiajs/react"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table"; // Pastikan path import benar
import type { DataTableColumn } from "@/components/data-table"

interface Props {
    role: RoleData[]
    permissions: Permission[]
    search: string
    isOwner: boolean
    openEdit: (role: RoleData) => void
    onDelete: (role: RoleData) => void
    groupPermissions: (perms: Permission[]) => Record<string, Permission[]>
    formatModuleName: (name: string) => string
}

export default function RolesTab({
    role,
    permissions,
    search,
    isOwner,
    openEdit,
    onDelete,
    groupPermissions,
    formatModuleName,
}: Props) {

    const formatRoleName = (name: string) => {
        const words = name.replace(/_/g, " ").split(" ")

        return words
            .map((w) => {
                if (w.toLowerCase() === "spv") return "SPV"
                return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
            })
            .join(" ")
    }

    // const grouped = groupPermissions(role.permissions || [])
    // const totalModules = Object.keys(groupPermissions(permissions)).length
    // const ownedModules = Object.keys(grouped).length

    const columns: DataTableColumn<RoleData>[] = [
        {
            header: 'Nama Role',
            accessor: 'name',
            cell: (row) => {
                // 1. Dapatkan object hasil grouping (pastikan array kosong jika permissions undefined)
                const grouped = groupPermissions(row.permissions || []);
                
                // 2. Ambil hanya nama modulnya (keys dari object)
                const modules = Object.keys(grouped);

                return (
                    <div>
                        <p className="font-medium text-slate-900">
                            {row.name.replace(/_/g, ' ').toUpperCase()}
                        </p>
                        
                        {/* 3. Render modules sebagai array of spans/badges */}
                        <div className="flex flex-wrap gap-1 mt-1.5">
                            {modules.length > 0 ? (
                                modules.map((module) => (
                                    <span 
                                        key={module} 
                                        className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600"
                                    >
                                        {formatModuleName(module)}
                                    </span>
                                ))
                            ) : (
                                <span className="text-xs text-slate-400 italic">
                                    Tidak ada akses
                                </span>
                            )}
                        </div>
                    </div>
                );
            }
        },
        {
            header: 'Action',
            accessor: 'id',
            cell: (row) => (
                <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => openEdit(row)}>
                        Edit
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => onDelete(row)}>
                        Hapus
                    </Button>
                </div>
            )
        },
    ];

    const filteredRole = role.filter(u => 
        u.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
            <DataTable
                columns={columns}
                data={filteredRole}
                searchKeys={['name']}
            />
        </div>
    )
}