import { router } from "@inertiajs/react"
import { X, Shield } from "lucide-react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import type { RoleData, Permission } from "../types"

interface Props {
    open: boolean
    onClose: () => void
    role: RoleData | null
    permissions: Permission[]
}

export default function RoleFormModal({
    open,
    onClose,
    role,
    permissions
}: Props) {

    const [form, setForm] = useState(() => ({
        name: role?.name ?? "",
        // description: role?.description ?? "",
        permission_ids: role?.permissions?.map(p => p.id) ?? []
    }))

    useEffect(() => {

        if (!role) {
            setForm({
                name: "",
                // description: "",
                permission_ids: []
            })
            return
        }

        setForm({
            name: role.name,
            // description: role.description ?? "",
            permission_ids: role.permissions?.map(p => p.id) ?? []
        })

    }, [role])

    if (!open) return null

    const togglePermission = (id: number) => {

        if (form.permission_ids.includes(id)) {

            setForm({
                ...form,
                permission_ids: form.permission_ids.filter(p => p !== id)
            })

        } else {

            setForm({
                ...form,
                permission_ids: [...form.permission_ids, id]
            })

        }

    }

    const submit = (e: React.FormEvent) => {

        e.preventDefault()

        if (role) {
            router.put(`/roles/${role.id}`, form, {
                onSuccess: () => {
                    toast.success(`${form.name} berhasil diperbarui`);
                    onClose();
                },
                onError: (errors: Record<string, string>) => {
                    toast.error(Object.values(errors).join('\n'));
                },
            })
        } else {
            router.post(`/roles`, form, {
                onSuccess: () => {
                    toast.success(`${form.name} berhasil ditambahkan`);
                    onClose();
                },
                onError: (errors: Record<string, string>) => {
                    toast.error(Object.values(errors).join('\n'));
                },
            })
        }

    }

    const groupedPermissions = permissions.reduce((acc, perm) => {
        const group = perm.name.split('.')[0]

        if (!acc[group]) acc[group] = []
        acc[group].push(perm)

        return acc
    }, {} as Record<string, Permission[]>)

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={onClose}
        >

            <div
                className="bg-background rounded-2xl w-full max-w-3xl shadow-lg animate-in zoom-in-95"
                onClick={(e) => e.stopPropagation()}
            >

                {/* Header */}

                <div className="flex items-center justify-between px-6 py-4 border-b border-sidebar-border">

                    <div className="flex items-center gap-2">
                        <Shield className="size-5 text-primary" />
                        <h2 className="text-lg font-semibold">
                            {role ? "Edit Role" : "Tambah Role"}
                        </h2>
                    </div>

                    <X
                        className="size-5 cursor-pointer text-muted-foreground hover:text-foreground"
                        onClick={onClose}
                    />

                </div>

                {/* Form */}

                <form
                    onSubmit={submit}
                    className="p-6 space-y-5 max-h-[80vh] overflow-y-auto"
                >

                    {/* Name */}

                    <div>
                        <label className="text-sm font-medium">
                            Nama Role
                        </label>

                        <input
                            className="mt-1 w-full rounded-lg border border-sidebar-border px-3 py-2 text-sm"
                            placeholder="manager, admin, spv..."
                            value={form.name}
                            onChange={(e) =>
                                setForm({ ...form, name: e.target.value })
                            }
                        />
                    </div>

                    {/* Permissions */}

                    <div>

                        <div className="font-medium mb-3">
                            Permissions
                        </div>

                        <div className="grid md:grid-cols-3 gap-3">

                            {Object.entries(groupedPermissions).map(([group, perms]) => (
                                <div key={group} className="border rounded-xl p-3">

                                    <div className="font-semibold mb-2 capitalize">
                                        {group.replace('_', ' ')}
                                    </div>

                                    <div className="grid gap-2">

                                        {perms.map((perm) => {

                                            const checked = form.permission_ids.includes(perm.id)

                                            return (
                                                <div
                                                    key={perm.id}
                                                    onClick={() => togglePermission(perm.id)}
                                                    className={`cursor-pointer border rounded-lg px-3 py-2 text-sm flex items-center justify-between
                                                    ${checked
                                                            ? "border-primary bg-primary/5"
                                                            : "border-sidebar-border"
                                                        }`}
                                                >
                                                    <span>{perm.name.split('.')[1]} {perm.name.split('.')[2]}</span>

                                                    <input
                                                        type="checkbox"
                                                        checked={checked}
                                                        readOnly
                                                    />
                                                </div>
                                            )
                                        })}

                                    </div>

                                </div>
                            ))}

                        </div>

                    </div>

                    {/* Actions */}

                    <div className="flex justify-end gap-2 pt-4 border-t border-sidebar-border">

                        <Button
                            type="button"
                            variant="secondary"
                            onClick={onClose}
                        >
                            Batal
                        </Button>

                        <Button type="submit">
                            Simpan
                        </Button>

                    </div>

                </form>

            </div>

        </div>
    )
}