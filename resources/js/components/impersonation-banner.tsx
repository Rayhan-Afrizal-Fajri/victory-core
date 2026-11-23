import { router, usePage } from '@inertiajs/react';
import { Eye, LogOut } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { ImpersonationState } from '@/types';

export function ImpersonationBanner() {
    const { impersonation } = usePage().props as {
        impersonation?: ImpersonationState | null;
    };
    const [stopping, setStopping] = useState(false);

    if (!impersonation?.is_active) {
        return null;
    }

    const handleStop = () => {
        if (stopping) return;
        setStopping(true);
        router.post(
            '/impersonate/stop',
            {},
            {
                onFinish: () => setStopping(false),
            },
        );
    };

    return (
        <div
            role="status"
            className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-2 border-b border-amber-300 bg-amber-50 px-4 py-2 text-amber-950 shadow-xs dark:border-amber-800/70 dark:bg-amber-950/90 dark:text-amber-100 md:px-6"
        >
            <div className="flex min-w-0 items-center gap-2.5">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-200/80 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                    <Eye className="h-4 w-4" aria-hidden="true" />
                </span>
                <div className="min-w-0 leading-tight">
                    <p className="truncate text-xs sm:text-sm">
                        Sedang melihat sebagai{' '}
                        <strong className="font-semibold">
                            {impersonation.target.name}
                        </strong>{' '}
                        <span className="capitalize">
                            ({impersonation.target.role.replace(/_/g, ' ')})
                        </span>
                    </p>
                    <p className="text-[11px] text-amber-800/90 dark:text-amber-200/80">
                        Mode hanya lihat (read-only): perubahan tidak bisa disimpan
                        <span className="mx-1.5 hidden sm:inline">·</span>
                        <span className="block sm:inline">
                            Anda: {impersonation.impersonator.name}
                        </span>
                    </p>
                </div>
            </div>

            <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={stopping}
                onClick={handleStop}
                className="h-8 shrink-0 cursor-pointer gap-1.5 border-amber-400 bg-amber-100/80 text-xs font-medium text-amber-950 hover:bg-amber-200 dark:border-amber-700 dark:bg-amber-900/70 dark:text-amber-100 dark:hover:bg-amber-800"
            >
                <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                <span>
                    {stopping ? 'Kembali...' : 'Kembali ke akun saya'}
                </span>
            </Button>
        </div>
    );
}

