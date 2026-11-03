import { router } from "@inertiajs/react"
import { X, Shield, CheckSquare, Square } from "lucide-react"
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
        permission_ids: role?.permissions?.map(p => p.id) ?? []
    }))
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        if (!open) return

        setErrors({})
        if (!role) {
            setForm({
                name: "",
                permission_ids: []
            })
            return
        }

        setForm({
            name: role.name,
            permission_ids: role.permissions?.map(p => p.id) ?? []
        })
    }, [open, role])

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

    const toggleGroupAll = (groupPerms: Permission[]) => {
        const groupIds = groupPerms.map(p => p.id)
        const isAllSelected = groupIds.every(id => form.permission_ids.includes(id))

        if (isAllSelected) {
            setForm({
                ...form,
                permission_ids: form.permission_ids.filter(id => !groupIds.includes(id))
            })
        } else {
            const merged = Array.from(new Set([...form.permission_ids, ...groupIds]))
            setForm({
                ...form,
                permission_ids: merged
            })
        }
    }

    const selectAllPermissions = () => {
        setForm({
            ...form,
            permission_ids: permissions.map(p => p.id)
        })
    }

    const clearAllPermissions = () => {
        setForm({
            ...form,
            permission_ids: []
        })
    }

    const submit = (e: React.FormEvent) => {
        e.preventDefault()
        setErrors({})
        setSubmitting(true)

        if (role) {
            router.put(`/roles/${role.id}`, form, {
                onSuccess: () => {
                    toast.success(`Role ${form.name} berhasil diperbarui`)
                    setSubmitting(false)
                    onClose()
                },
                onError: (errs: Record<string, string>) => {
                    setErrors(errs)
                    setSubmitting(false)
                    toast.error(Object.values(errs).join('\n') || 'Gagal memperbarui role')
                },
            })
        } else {
            router.post(`/roles`, form, {
                onSuccess: () => {
                    toast.success(`Role ${form.name} berhasil ditambahkan`)
                    setSubmitting(false)
                    onClose()
                },
                onError: (errs: Record<string, string>) => {
                    setErrors(errs)
                    setSubmitting(false)
                    toast.error(Object.values(errs).join('\n') || 'Gagal menambahkan role')
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
                className="bg-background rounded-2xl w-full max-w-3xl shadow-xl border border-border animate-in zoom-in-95 flex flex-col max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
                    <div className="flex items-center gap-2">
                        <Shield className="size-5 text-primary" />
                        <h2 className="text-base font-semibold text-foreground">
                            {role ? `Edit Role: ${role.name}` : "Tambah Role Baru"}
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
                    className="p-6 space-y-5 overflow-y-auto grow"
                >
                    {/* Name */}
                    <div>
                        <label className="text-xs font-semibold text-foreground">
                            Nama Role <span className="text-destructive">*</span>
                        </label>
                        <input
                            className={`mt-1.5 w-full rounded-lg border px-3 py-2 text-xs bg-background text-foreground transition-colors ${
                                errors.name ? 'border-destructive ring-1 ring-destructive' : 'border-input focus:border-primary'
                            }`}
                            placeholder="Contoh: manager, supervisor, finance, cutting..."
                            value={form.name}
                            onChange={(e) =>
                                setForm({ ...form, name: e.target.value.toLowerCase().replace(/\s+/g, '_') })
                            }
                            required
                        />
                        {errors.name && (
                            <p className="text-[11px] text-destructive mt-1 font-medium">
                                {errors.name}
                            </p>
                        )}
                        <p className="text-[10px] text-muted-foreground mt-1">
                            Gunakan huruf kecil atau underscore (contoh: <code>admin_workshop</code>)
                        </p>
                    </div>

                    {/* Permissions */}
                    <div>
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                            <div>
                                <span className="text-xs font-semibold text-foreground block">
                                    Hak Akses (Permissions)
                                </span>
                                <span className="text-[11px] text-muted-foreground">
                                    {form.permission_ids.length} dari {permissions.length} akses dipilih
                                </span>
                            </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={selectAllPermissions}
                                    className="h-7 text-[11px] px-2 cursor-pointer"
                                >
                                    Pilih Semua
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={clearAllPermissions}
                                    className="h-7 text-[11px] px-2 cursor-pointer"
                                >
                                    Batal Semua
                                </Button>
                            </div>
                        </div>

                        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
                            {Object.entries(groupedPermissions).map(([group, perms]) => {
                                const groupIds = perms.map(p => p.id)
                                const isGroupAll = groupIds.every(id => form.permission_ids.includes(id))

                                return (
                                    <div key={group} className="border border-border rounded-xl p-3 bg-muted/20 space-y-2">
                                        <div className="flex items-center justify-between pb-1 border-b border-border/60">
                                            <span className="font-semibold text-xs capitalize text-foreground">
                                                {group.replace('_', ' ')}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => toggleGroupAll(perms)}
                                                className="text-[10px] text-primary hover:underline font-medium cursor-pointer"
                                            >
                                                {isGroupAll ? "Batal" : "Semua"}
                                            </button>
                                        </div>

                                        <div className="space-y-1.5">
                                            {perms.map((perm) => {
                                                const checked = form.permission_ids.includes(perm.id)
                                                const actionName = perm.name.split('.').slice(1).join(' ') || perm.name

                                                return (
                                                    <div
                                                        key={perm.id}
                                                        onClick={() => togglePermission(perm.id)}
                                                        className={`cursor-pointer border rounded-lg px-2.5 py-1.5 text-xs flex items-center justify-between transition-colors ${
                                                            checked
                                                                ? "border-primary bg-primary/10 text-primary font-medium"
                                                                : "border-border/60 hover:bg-muted/40 text-muted-foreground"
                                                        }`}
                                                    >
                                                        <span className="capitalize">{actionName}</span>
                                                        <input
                                                            type="checkbox"
                                                            checked={checked}
                                                            onChange={() => {}}
                                                            className="h-3.5 w-3.5 rounded text-primary"
                                                        />
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-2 pt-4 border-t border-border shrink-0">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={onClose}
                            className="text-xs cursor-pointer"
                        >
                            Batal
                        </Button>
                        <Button
                            type="submit"
                            size="sm"
                            disabled={submitting}
                            className="text-xs cursor-pointer"
                        >
                            {submitting ? "Menyimpan..." : role ? "Simpan Perubahan" : "Simpan Role"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}