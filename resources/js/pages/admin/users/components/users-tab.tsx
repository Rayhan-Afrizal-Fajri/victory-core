import { router } from "@inertiajs/react"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table"; // Pastikan path import benar
import type { DataTableColumn } from "@/components/data-table"
import type { UserData } from "../types" // Sesuaikan path

interface Props {
    users: UserData[]
    search: string
    openEdit: (user: UserData) => void
    onDelete: (user: UserData) => void
}

export default function UsersTab({ users, search, openEdit, onDelete }: Props) {
    
    // Handler Switch Status
    const handleToggleStatus = (user: UserData, checked: boolean) => {
        router.patch(route('users.update-status', user.id), {
            status_aktif: checked
        }, {
            preserveScroll: true,
            onSuccess: () => toast.success(`Status ${user.name} berhasil diubah.`),
        });
    };

    const columns: DataTableColumn<UserData>[] = [
        {
            header: 'Nama',
            accessor: 'name',
            cell: (row) => (
                <div>
                    <p className="font-medium text-slate-900">{row.name}</p>
                    <p className="text-xs text-slate-500">{row.email}</p>
                </div>
            )
        },
        {
            header: 'Role',
            accessor: 'roles',
            cell: (row) => (
                <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                    {row.roles?.[0]?.name ? row.roles[0].name.replace(/_/g, ' ') : 'No Role'}
                </span>
            )
        },
        {
            header: 'Status',
            accessor: 'is_active',
            cell: (row) => (
                <div className="flex items-center gap-2">
                    <Switch
                        checked={Boolean(row.is_active)}
                        onCheckedChange={(checked) => handleToggleStatus(row, checked)}
                        className="data-[state=checked]:bg-emerald-500" 
                    />
                    <span className={`text-sm font-medium ${row.is_active ? 'text-emerald-700' : 'text-slate-500'}`}>
                        {row.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                </div>
            ),
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

    // Menerapkan fitur pencarian (search)
    const filteredUsers = users.filter(u => 
        u.name.toLowerCase().includes(search.toLowerCase()) || 
        u.email.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
            <DataTable
                columns={columns}
                data={filteredUsers}
                searchKeys={['name', 'email']}
            />
        </div>
    )
}