export type User = {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    email_verified_at: string | null;
    two_factor_enabled?: boolean;
    created_at: string;
    updated_at: string;
    [key: string]: unknown;
};

export type Auth = {
    user: User;
};

export type ImpersonationPerson = {
    id: number;
    name: string;
    email: string;
    role: string;
};

export type ImpersonationState = {
    is_active: boolean;
    impersonator: ImpersonationPerson;
    target: ImpersonationPerson;
};

export type TwoFactorSetupData = {
    svg: string;
    url: string;
};

export type TwoFactorSecretKey = {
    secretKey: string;
};
