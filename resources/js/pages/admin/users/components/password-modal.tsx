import { router } from "@inertiajs/react"
import { Eye, EyeOff, X } from "lucide-react"
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
    const [errors] = useState<Record<string, string>>({})
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    if (!open || !user) return null

    const submit = (e: React.FormEvent) => {

        e.preventDefault()

        router.put(`/master/users/${user.id}/password`, {
            password,
            password_confirmation: confirm
        }, {
            onSuccess: () => {
                toast.success(`password berhasil diperbarui`);
                onClose();
            },
            onError: (errors: Record<string, string>) => {
                toast.error(Object.values(errors).join('\n'));
            },
        })
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={onClose}
        >

            <div
                className="bg-background rounded-2xl w-full max-w-md shadow-lg animate-in zoom-in-95"
                onClick={(e) => e.stopPropagation()}
            >

                {/* Header */}

                <div className="flex items-center justify-between px-6 py-4 border-b border-sidebar-border">

                    <h2 className="text-lg font-semibold">
                        Ubah Password
                    </h2>

                    <X
                        className="size-5 cursor-pointer text-muted-foreground hover:text-foreground"
                        onClick={onClose}
                    />

                </div>

                {/* Form */}

                <form onSubmit={submit} className="p-6 space-y-4">

                    <div className="text-sm text-muted-foreground">
                        Password untuk <b>{user.name}</b>
                    </div>

                    {/* Password */}

                    <div>
                        <label className="text-sm font-medium">
                            Password Baru
                        </label>

                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                className="mt-1 w-full rounded-lg border border-sidebar-border px-3 py-2 text-sm"
                                placeholder="********"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <button 
                                type='button'
                                onClick={() => setShowPassword(!showPassword)}
                                className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground cursor-pointer hover:text-foreground'>
                                {showPassword ? (
                                    <EyeOff className='w-4 h-4' />
                                ) : (
                                    <Eye className='w-4 h-4' /> 
                                )}
                            </button>
                        </div>

                        {errors.password && (
                            <p className="text-xs text-red-500 mt-1">
                                {errors.password}
                            </p>
                        )}
                    </div>

                    {/* Confirm */}

                    <div>
                        <label className="text-sm font-medium">
                            Konfirmasi Password
                        </label>

                        <div className="relative">
                            <input
                                type={showConfirmPassword ? 'text' : 'password'}
                                className="mt-1 w-full rounded-lg border border-sidebar-border px-3 py-2 text-sm"
                                placeholder="********"
                                value={confirm}
                                onChange={(e) => setConfirm(e.target.value)}
                            />
                            <button 
                                type='button'
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground cursor-pointer hover:text-foreground'>
                                {showConfirmPassword ? (
                                    <EyeOff className='w-4 h-4' />
                                ) : (
                                    <Eye className='w-4 h-4' /> 
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Actions */}

                    <div className="flex justify-end gap-2 pt-4 border-t border-sidebar-border">

                        <Button
                            type="button"
                            variant="secondary"
                            onClick={onClose}
                            className="cursor-pointer"
                        >
                            Batal
                        </Button>

                        <Button type="submit" className="cursor-pointer">
                            Update Password
                        </Button>

                    </div>

                </form>

            </div>

        </div>
    )
}