import { router } from "@inertiajs/react"
import { X } from "lucide-react"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import type { UserData, RoleData } from "../types"

interface Props {
    open: boolean
    onClose: () => void
    user: UserData | null
    roles: RoleData[]
}

export default function UserFormModal({
    open,
    onClose,
    user,
    roles
}: Props) {

    const emptyForm = {
        name: "",
        username: "",
        email: "",
        password: "",
        phone: "",
        role_id: "",
        status_aktif: true
    }

    const [form, setForm] = useState(() => emptyForm)
    const [errors] = useState<Record<string, string>>({})

    useEffect(() => {
        if (!open) return

        if (user) {
            setForm({
                name: user.name,
                username: user.username,
                email: user.email,
                password: "",
                phone: user.phone || "",
                role_id: user.roles?.[0]?.id?.toString() || "",
                status_aktif: user.status_aktif ?? true
            })
        } else {
            setForm(emptyForm)
        }
    }, [open, user])

    if (!open) return null

    const submit = (e: React.FormEvent) => {

        e.preventDefault()

        if (user) {
            router.put(`/master/users/${user.id}`, form, {
                onSuccess: () => {
                    toast.success(`${form.name} berhasil diperbarui`);
                    onClose();
                },
                onError: (errors: Record<string, string>) => {
                    toast.error(Object.values(errors).join('\n'));
                },
            })
        } else {
            router.post(`/master/users`, form, {
                onSuccess: () => {
                    toast.success(`${form.name} berhasil diperbarui`);
                    onClose();
                },
                onError: (errors: Record<string, string>) => {
                    toast.error(Object.values(errors).join('\n'));
                },
            })
        }
    }

    const formatRoleName = (name: string) => {
        const words = name.replace(/_/g, " ").split(" ")
        return words
            .map((w) => {
                if (w.toLowerCase() === "spv") return "SPV"
                return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
            })
            .join(" ")
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={onClose}
        >

            <div
                className="bg-background rounded-2xl w-full max-w-2xl shadow-lg animate-in zoom-in-95"
                onClick={(e) => e.stopPropagation()}
            >

                {/* Header */}

                <div className="flex items-center justify-between px-6 py-4 border-b border-sidebar-border">

                    <h2 className="text-lg font-semibold">
                        {user ? `Edit ${user.name}` : "Tambah Pengguna"}
                    </h2>

                    <X
                        className="size-5 cursor-pointer text-muted-foreground hover:text-foreground"
                        onClick={onClose}
                    />

                </div>

                {/* Form */}

                <form onSubmit={submit} className="p-6 space-y-4">

                    {/* Name */}

                    <div>
                        <label className="text-sm font-medium">
                            Nama Lengkap
                        </label>

                        <input
                            className="mt-1 w-full rounded-lg border border-sidebar-border px-3 py-2 text-sm"
                            value={form.name}
                            onChange={(e) =>
                                setForm({ ...form, name: e.target.value })
                            }
                            placeholder="Nama lengkap..."
                        />

                        {errors.name && (
                            <p className="text-xs text-red-500 mt-1">
                                {errors.name}
                            </p>
                        )}
                    </div>

                    {/* Email */}

                    <div>
                        <label className="text-sm font-medium">
                            Email
                        </label>

                        <input
                            type="email"
                            className="mt-1 w-full rounded-lg border border-sidebar-border px-3 py-2 text-sm"
                            value={form.email}
                            onChange={(e) =>
                                setForm({ ...form, email: e.target.value })
                            }
                            placeholder="email@example.com"
                        />

                        {errors.email && (
                            <p className="text-xs text-red-500 mt-1">
                                {errors.email}
                            </p>
                        )}
                    </div>

                    {/* Username */}

                    <div>
                        <label className="text-sm font-medium">
                            Username
                        </label>

                        <input
                            className="mt-1 w-full rounded-lg border border-sidebar-border px-3 py-2 text-sm"
                            value={form.username}
                            onChange={(e) =>
                                setForm({ ...form, username: e.target.value })
                            }
                            placeholder="johndoe24"
                        />

                        {errors.username && (
                            <p className="text-xs text-red-500 mt-1">
                                {errors.username}
                            </p>
                        )}
                    </div>

                    {/* Password */}

                    {!user && (
                        <div>
                            <label className="text-sm font-medium">
                                Password
                            </label>

                            <input
                                type="password"
                                className="mt-1 w-full rounded-lg border border-sidebar-border px-3 py-2 text-sm"
                                value={form.password}
                                onChange={(e) =>
                                    setForm({ ...form, password: e.target.value })
                                }
                                placeholder="********"
                            />

                            {errors.password && (
                                <p className="text-xs text-red-500 mt-1">
                                    {errors.password}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Phone */}

                    <div>
                        <label className="text-sm font-medium">
                            No. Telepon
                        </label>

                        <input
                            className="mt-1 w-full rounded-lg border border-sidebar-border px-3 py-2 text-sm"
                            value={form.phone}
                            onChange={(e) =>
                                setForm({ ...form, phone: e.target.value })
                            }
                            placeholder="08123456789"
                        />
                    </div>

                    {/* Role */}

                    <div>
                        <label className="text-sm font-medium">
                            Role
                        </label>

                        <select
                            className="mt-1 w-full rounded-lg border border-sidebar-border px-3 py-2 text-sm"
                            value={form.role_id}
                            onChange={(e) =>
                                setForm({ ...form, role_id: e.target.value })
                            }
                        >
                            <option value="">
                                Pilih Role
                            </option>

                            {roles.map((role) => (
                                <option key={role.id} value={role.id}>
                                    {formatRoleName(role.name)}
                                </option>
                            ))}
                        </select>

                        {errors.role_id && (
                            <p className="text-xs text-red-500 mt-1">
                                {errors.role_id}
                            </p>
                        )}
                    </div>

                    {/* Status */}

                    <div className="flex items-center gap-2 pt-2">

                        <input
                            type="checkbox"
                            checked={form.status_aktif}
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    status_aktif: e.target.checked
                                })
                            }
                        />

                        <span className="text-sm">
                            Status Aktif
                        </span>

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