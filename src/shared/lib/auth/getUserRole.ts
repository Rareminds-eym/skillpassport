interface User {
    email: string;
    raw_user_meta_data?: { role?: string };
    user_metadata?: { role?: string };
}

interface AuthUser {
    email: string;
    role: string;
}

export const getUserRole = (user: User | null): string => {
    if (!user) return 'user';
    return user.raw_user_meta_data?.role || user.user_metadata?.role || 'user';
};

export const formatAuthUser = (user: User | null): AuthUser | null => {
    if (!user) return null;
    return {
        email: user.email,
        role: getUserRole(user)
    };
};
