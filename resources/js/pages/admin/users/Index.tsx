import { Head, router } from '@inertiajs/react';
import { Plus, Search, Shield, Users } from 'lucide-react';
import type { ReactNode } from 'react';
import { useState } from 'react';

import AppLayout from '@/layouts/app-layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RoleData, UserData } from './types';

// Import komponen tab dan modal Anda
import UsersTab from './components/users-tab';
import RolesTab from './components/roles-tab';
import UserFormModal from './components/user-form-modal';
import RoleFormModal from './components/role-form-modal';
import { toast } from 'sonner';
import { useCan } from '@/hooks/use-can';

// Sesuaikan path import Anda jika berbeda
import { store as userStore, update as userUpdate, destroy as userDestroy } from '@/routes/users';

// --- TYPES ---
export type Permission = { id: number; name: string; description?: string; module?: string };
// export type RoleData = { id: number; name: string; description?: string; users_count?: number; permissions?: Permission[] };
// export type UserData = { id: number; name: string; username: string; email: string; phone?: string; status_aktif: boolean; roles?: RoleData[] };

interface Props {
    users: UserData[];
    roles: RoleData[];
    permissions: Permission[];
}

export default function Index({ users, roles, permissions }: Props) {
    const can = useCan();
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState('users');

    // State untuk Modal User
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserData | null>(null);

    // State untuk Modal Role
    const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
    const [selectedRole, setSelectedRole] = useState<RoleData | null>(null);

    // --- HANDLER USER ---
    const openCreateUser = () => { setSelectedUser(null); setIsUserModalOpen(true); };
    const openEditUser = (user: UserData) => { setSelectedUser(user); setIsUserModalOpen(true); };
    const handleDeleteUser = (user: UserData) => {
        if (confirm(`Yakin ingin menghapus user ${user.name}?`)) {
            router.delete(userDestroy(user.id), {
                onSuccess: () => toast.success('User berhasil dihapus')
            });
        }
    };

    // --- HANDLER ROLE ---
    const openCreateRole = () => { setSelectedRole(null); setIsRoleModalOpen(true); };
    const openEditRole = (role: RoleData) => { setSelectedRole(role); setIsRoleModalOpen(true); };
    const handleDeleteRole = (role: RoleData) => {
        if (confirm(`Yakin ingin menghapus role ${role.name}?`)) {
            router.delete(route('roles.destroy', role.id), {
                onSuccess: () => toast.success('Role berhasil dihapus')
            });
        }
    };

    // --- HELPER UNTUK ROLE PERMISSIONS ---
    const groupPermissions = (perms: Permission[]) => {
        const groups: Record<string, Permission[]> = {};
        perms.forEach(p => {
            const module = p.name.split('.')[0] || 'other';
            if (!groups[module]) groups[module] = [];
            groups[module].push(p);
        });
        return groups;
    };

    const formatModuleName = (name: string) => name.charAt(0).toUpperCase() + name.slice(1);

    return (
        <div className="space-y-6">

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-2 rounded-lg border shadow-sm">
                    <TabsList className="grid w-full sm:w-100 grid-cols-2">
                        <TabsTrigger value="users" className="flex items-center gap-2">
                            <Users className="h-4 w-4" /> Users
                        </TabsTrigger>
                        <TabsTrigger value="roles" className="flex items-center gap-2">
                            <Shield className="h-4 w-4" /> Roles & Permissions
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="users" className="m-0">
                    <UsersTab 
                        users={users} 
                        search={search}
                        openEdit={openEditUser}
                        onDelete={handleDeleteUser}
                    />
                </TabsContent>

                <TabsContent value="roles" className="m-0">
                    <RolesTab 
                        role={roles}
                        permissions={permissions}
                        search={search}
                        isOwner={false} // Sesuaikan logika IsOwner jika ada
                        openEdit={openEditRole}
                        onDelete={handleDeleteRole}
                        groupPermissions={groupPermissions}
                        formatModuleName={formatModuleName}
                    />
                </TabsContent>
            </Tabs>

            {/* Modal Forms */}
            <UserFormModal 
                open={isUserModalOpen} 
                onClose={() => setIsUserModalOpen(false)} 
                user={selectedUser} 
                roles={roles} 
            />
            
            <RoleFormModal 
                open={isRoleModalOpen} 
                onClose={() => setIsRoleModalOpen(false)} 
                role={selectedRole} 
                permissions={permissions} 
            />
        </div>
    );
}

Index.layout = (page: ReactNode) => (
    <AppLayout
        title="Users & Roles" 
        information="Admin · Access" 
        description="Kelola user, role, dan hak akses sistem."
        breadcrumbs={[
        {
            title: 'Master Users & Roles',
            href: '',
        },
    ]}
    >
        {page}
    </AppLayout>
);