import { Head, router } from '@inertiajs/react';
import { Plus, Search, Shield, Users } from 'lucide-react';
import type { ReactNode } from 'react';
import { useState } from 'react';

import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RoleData, UserData } from './types';

// Components & Modals
import UsersTab from './components/users-tab';
import RolesTab from './components/roles-tab';
import UserFormModal from './components/user-form-modal';
import RoleFormModal from './components/role-form-modal';
import PasswordModal from './components/password-modal';
import { toast } from 'sonner';
import { useCan } from '@/hooks/use-can';

import { destroy as userDestroy } from '@/routes/users';

// --- TYPES ---
export type Permission = { id: number; name: string; description?: string; module?: string };

interface Props {
    users: UserData[];
    roles: RoleData[];
    permissions: Permission[];
}

export default function Index({ users, roles, permissions }: Props) {
    const can = useCan();
    const [activeTab, setActiveTab] = useState('users');

    // State untuk Modal User
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserData | null>(null);

    // State untuk Modal Role
    const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
    const [selectedRole, setSelectedRole] = useState<RoleData | null>(null);

    // State untuk Modal Password
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [passwordUser, setPasswordUser] = useState<UserData | null>(null);

    // --- HANDLER USER ---
    const openCreateUser = () => { 
        setSelectedUser(null); 
        setIsUserModalOpen(true); 
    };
    
    const openEditUser = (user: UserData) => { 
        setSelectedUser(user); 
        setIsUserModalOpen(true); 
    };
    
    const openPasswordModal = (user: UserData) => {
        setPasswordUser(user);
        setIsPasswordModalOpen(true);
    };

    const handleDeleteUser = (user: UserData) => {
        if (confirm(`Yakin ingin menghapus user ${user.name}?`)) {
            router.delete(`/users/${user.id}`, {
                onSuccess: () => toast.success('User berhasil dihapus'),
                onError: (errs) => toast.error(Object.values(errs).join('\n') || 'Gagal menghapus user'),
            });
        }
    };

    // --- HANDLER ROLE ---
    const openCreateRole = () => { 
        setSelectedRole(null); 
        setIsRoleModalOpen(true); 
    };
    
    const openEditRole = (role: RoleData) => { 
        setSelectedRole(role); 
        setIsRoleModalOpen(true); 
    };
    
    const handleDeleteRole = (role: RoleData) => {
        if (confirm(`Yakin ingin menghapus role ${role.name}?`)) {
            router.delete(`/roles/${role.id}`, {
                onSuccess: () => toast.success('Role berhasil dihapus'),
                onError: (errs) => toast.error(Object.values(errs).join('\n') || 'Gagal menghapus role'),
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
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-card p-2 rounded-xl border shadow-xs">
                    <TabsList className="grid w-full sm:w-80 grid-cols-2">
                        <TabsTrigger value="users" className="flex items-center gap-2 cursor-pointer">
                            <Users className="h-4 w-4" /> Users ({users.length})
                        </TabsTrigger>
                        <TabsTrigger value="roles" className="flex items-center gap-2 cursor-pointer">
                            <Shield className="h-4 w-4" /> Roles ({roles.length})
                        </TabsTrigger>
                    </TabsList>

                    {/* ACTION BUTTON TO CREATE USER / ROLE */}
                    <div>
                        {activeTab === 'users' ? (
                            <Button
                                onClick={openCreateUser}
                                size="sm"
                                className="gap-2 cursor-pointer shadow-xs text-xs"
                            >
                                <Plus className="h-4 w-4" />
                                <span>Tambah Pengguna</span>
                            </Button>
                        ) : (
                            <Button
                                onClick={openCreateRole}
                                size="sm"
                                className="gap-2 cursor-pointer shadow-xs text-xs"
                            >
                                <Plus className="h-4 w-4" />
                                <span>Tambah Role Baru</span>
                            </Button>
                        )}
                    </div>
                </div>

                <TabsContent value="users" className="m-0">
                    <UsersTab 
                        users={users} 
                        openEdit={openEditUser}
                        openPassword={openPasswordModal}
                        openCreate={openCreateUser}
                        onDelete={handleDeleteUser}
                    />
                </TabsContent>

                <TabsContent value="roles" className="m-0">
                    <RolesTab 
                        role={roles}
                        permissions={permissions}
                        isOwner={false}
                        openEdit={openEditRole}
                        openCreate={openCreateRole}
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

            <PasswordModal
                open={isPasswordModalOpen}
                onClose={() => setIsPasswordModalOpen(false)}
                user={passwordUser}
            />
        </div>
    );
}

Index.layout = (page: ReactNode) => (
    <AppLayout
        title="Users & Roles" 
        information="Admin · Access Control" 
        description="Kelola akun pengguna, peran hak akses (roles), dan izin akses modul sistem."
        breadcrumbs={[
            {
                title: 'Master Users & Roles',
                href: '/users',
            },
        ]}
    >
        {page}
    </AppLayout>
);