import { router } from "@inertiajs/react"
import { Eye, EyeOff, KeyRound, X } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import type { UserData } from "../types"

interface Props {
    open: boolean
    onClose: () => void
    user: UserData | null
}

export default function PasswordModal({
    open,
    onClose,
    user
}: Props) {
    const [password, setPassword] = useState("")
    const [confirm, setConfirm] = useState("")
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [submitting, setSubmitting] = useState(false)

    if (!open || !user) return null

    const submit = (e: React.FormEvent) => {
        e.preventDefault()
        setErrors({})

        if (password.length < 8) {
            setErrors({ password: 'Password minimal 8 karakter.' })
            return
        }

        if (password !== confirm) {
            setErrors({ password_confirmation: 'Konfirmasi password tidak cocok.' })
            return
        }

        setSubmitting(true)
        router.put(`/users/${user.id}/password`, {
            password,
            password_confirmation: confirm
        }, {
            onSuccess: () => {
                toast.success(`Password untuk ${user.name} berhasil diperbarui`)
                setSubmitting(false)
                setPassword("")
                setConfirm("")
                onClose()
            },
            onError: (errs: Record<string, string>) => {
                setErrors(errs)
                setSubmitting(false)
                toast.error(Object.values(errs).join('\n') || 'Gagal mengubah password')
            },
        })
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={onClose}
        >
            <div
                className="bg-background rounded-2xl w-full max-w-md shadow-xl border border-border animate-in zoom-in-95"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                    <div className="flex items-center gap-2">
                        <KeyRound className="size-5 text-primary" />
                        <h2 className="text-base font-semibold text-foreground">
                            Ganti Password: {user.name}
                        </h2>
                    </div>

                    <X
                        className="size-5 cursor-pointer text-muted-foreground hover:text-foreground"
                        onClick={onClose}
                    />
                </div>

                {/* Form */}
                <form onSubmit={submit} className="p-6 space-y-4 text-xs">
                    <div>
                        <label className="text-xs font-semibold text-foreground">
                            Password Baru <span className="text-destructive">*</span>
                        </label>
                        <div className="relative mt-1.5">
                            <input
                                type={showPassword ? "text" : "password"}
                                className={`w-full rounded-lg border px-3 py-2 pr-10 text-xs bg-background text-foreground ${
                                    errors.password ? 'border-destructive ring-1 ring-destructive' : 'border-input focus:border-primary'
                                }`}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Minimal 8 karakter..."
                                required
                            />
                            <button
                                type="button"
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                            </button>
                        </div>
                        {errors.password && (
                            <p className="text-[11px] text-destructive mt-1 font-medium">
                                {errors.password}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="text-xs font-semibold text-foreground">
                            Konfirmasi Password Baru <span className="text-destructive">*</span>
                        </label>
                        <div className="relative mt-1.5">
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                className={`w-full rounded-lg border px-3 py-2 pr-10 text-xs bg-background text-foreground ${
                                    errors.password_confirmation ? 'border-destructive ring-1 ring-destructive' : 'border-input focus:border-primary'
                                }`}
                                value={confirm}
                                onChange={(e) => setConfirm(e.target.value)}
                                placeholder="Ulangi password baru..."
                                required
                            />
                            <button
                                type="button"
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                                {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                            </button>
                        </div>
                        {errors.password_confirmation && (
                            <p className="text-[11px] text-destructive mt-1 font-medium">
                                {errors.password_confirmation}
                            </p>
                        )}
                    </div>

                    <div className="flex justify-end gap-2 pt-3 border-t border-border">
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
                            {submitting ? "Memperbarui..." : "Update Password"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}