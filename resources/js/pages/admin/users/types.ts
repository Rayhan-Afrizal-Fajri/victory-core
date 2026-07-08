export type Permission = {
    id: number
    name: string
}

export type RoleData = {
    id: number
    name: string
    description?: string
    permissions: Permission[]
    users_count: number
}

export type UserData = {
    id: number;
    name: string;
    email: string;
    roles: RoleData[];
    password?: string;
    is_active: boolean;
}

export type UserForm = {
    name: string
    username: string
    email: string
    password: string
    phone: string
    role_id: string
}

export type RoleForm = {
    name: string
    description: string
    permissions: Permission[]
}