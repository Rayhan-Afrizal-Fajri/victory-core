import { usePage } from '@inertiajs/react';

export function useCan() {
    const { auth } = usePage().props as any;

    return (permission: string) => {
        return auth?.permissions?.includes(permission);
    };
}