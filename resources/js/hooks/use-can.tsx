import { usePage } from '@inertiajs/react';

export function useCan() {
    const { auth } = usePage().props as any;
    const userPermissions = auth.permissions || [];

    // return (permission: string) => {
    //     return auth?.permissions?.includes(permission);
    // };
    return function can(permissions: string | string[]): boolean {
        if (Array.isArray(permissions)) {
            return permissions.some((permission) => userPermissions.includes(permission));
        }

        return userPermissions.includes(permissions);
    }
}