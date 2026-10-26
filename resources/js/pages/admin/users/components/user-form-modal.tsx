import { router } from "@inertiajs/react"
import { X, UserPlus, UserCheck } from "lucide-react"
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
        email: "",
        password: "",
        role_id: "",
    }

    const [form, setForm] = useState(() => emptyForm)
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        if (!open) return

        setErrors({})
        if (user) {
            setForm({
                name: user.name,
                email: user.email,
                password: "",
                role_id: user.roles?.[0]?.id?.toString() || "",
            })
        } else {
            setForm(emptyForm)
        }
    }, [open, user])

    if (!open) return null

    const submit = (e: React.FormEvent) => {
        e.preventDefault()
        setErrors({})
        setSubmitting(true)

        const selectedRole = roles.find(r => r.id.toString() === form.role_id)
        const payload = {
            name: form.name,
            email: form.email,
            password: form.password,
            role_id: form.role_id,
            role: selectedRole?.name || "",
        }

        if (user) {
            router.put(`/users/${user.id}`, payload, {
                onSuccess: () => {
                    toast.success(`User ${form.name} berhasil diperbarui`)
                    setSubmitting(false)
                    onClose()
                },
                onError: (errs: Record<string, string>) => {
                    setErrors(errs)
                    setSubmitting(false)
                    toast.error(Object.values(errs).join('\n') || 'Gagal memperbarui user')
                },
            })
        } else {
            router.post(`/users`, payload, {
                onSuccess: () => {
                    toast.success(`User ${form.name} berhasil dibuat`)
                    setSubmitting(false)
                    onClose()
                },
                onError: (errs: Record<string, string>) => {
                    setErrors(errs)
                    setSubmitting(false)
                    toast.error(Object.values(errs).join('\n') || 'Gagal menambahkan user')
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
                className="bg-background rounded-2xl w-full max-w-lg shadow-xl border border-border animate-in zoom-in-95"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                    <div className="flex items-center gap-2">
                        {user ? (
                            <UserCheck className="size-5 text-primary" />
                        ) : (
                            <UserPlus className="size-5 text-primary" />
                        )}
                        <h2 className="text-base font-semibold text-foreground">
                            {user ? `Edit Pengguna: ${user.name}` : "Tambah Pengguna Baru"}
                        </h2>
                    </div>

                    <X
                        className="size-5 cursor-pointer text-muted-foreground hover:text-foreground"
                        onClick={onClose}
                    />
                </div>

                {/* Form */}
                <form onSubmit={submit} className="p-6 space-y-4">
                    {/* Name */}
                    <div>
                        <label className="text-xs font-semibold text-foreground">
                            Nama Lengkap <span className="text-destructive">*</span>
                        </label>
                        <input
                            className={`mt-1.5 w-full rounded-lg border px-3 py-2 text-xs bg-background text-foreground transition-colors ${
                                errors.name ? 'border-destructive ring-1 ring-destructive' : 'border-input focus:border-primary'
                            }`}
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            placeholder="Contoh: Rian Pratama"
                            required
                        />
                        {errors.name && (
                            <p className="text-[11px] text-destructive mt-1 font-medium">
                                {errors.name}
                            </p>
                        )}
                    </div>

                    {/* Email */}
                    <div>
                        <label className="text-xs font-semibold text-foreground">
                            Alamat Email <span className="text-destructive">*</span>
                        </label>
                        <input
                            type="email"
                            className={`mt-1.5 w-full rounded-lg border px-3 py-2 text-xs bg-background text-foreground transition-colors ${
                                errors.email ? 'border-destructive ring-1 ring-destructive' : 'border-input focus:border-primary'
                            }`}
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                            placeholder="rian@victorygarment.com"
                            required
                        />
                        {errors.email && (
                            <p className="text-[11px] text-destructive mt-1 font-medium">
                                {errors.email}
                            </p>
                        )}
                    </div>

                    {/* Password */}
                    <div>
                        <label className="text-xs font-semibold text-foreground">
                            Password {user ? "(Kosongkan jika tidak diubah)" : <span className="text-destructive">*</span>}
                        </label>
                        <input
                            type="password"
                            className={`mt-1.5 w-full rounded-lg border px-3 py-2 text-xs bg-background text-foreground transition-colors ${
                                errors.password ? 'border-destructive ring-1 ring-destructive' : 'border-input focus:border-primary'
                            }`}
                            value={form.password}
                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                            placeholder={user ? "Minimal 8 karakter..." : "Minimal 8 karakter..."}
                            required={!user}
                        />
                        {errors.password && (
                            <p className="text-[11px] text-destructive mt-1 font-medium">
                                {errors.password}
                            </p>
                        )}
                    </div>

                    {/* Role */}
                    <div>
                        <label className="text-xs font-semibold text-foreground">
                            Peran (Role) <span className="text-destructive">*</span>
                        </label>
                        <select
                            className={`mt-1.5 w-full rounded-lg border px-3 py-2 text-xs bg-background text-foreground transition-colors ${
                                errors.role_id || errors.role ? 'border-destructive ring-1 ring-destructive' : 'border-input focus:border-primary'
                            }`}
                            value={form.role_id}
                            onChange={(e) => setForm({ ...form, role_id: e.target.value })}
                            required
                        >
                            <option value="">-- Pilih Role Pengguna --</option>
                            {roles.map((role) => (
                                <option key={role.id} value={role.id}>
                                    {formatRoleName(role.name)}
                                </option>
                            ))}
                        </select>
                        {(errors.role_id || errors.role) && (
                            <p className="text-[11px] text-destructive mt-1 font-medium">
                                {errors.role_id || errors.role}
                            </p>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-2 pt-4 border-t border-border">
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
                            {submitting ? "Menyimpan..." : user ? "Simpan Perubahan" : "Simpan Pengguna"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}