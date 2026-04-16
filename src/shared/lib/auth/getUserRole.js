export const getUserRole = (user) => {
    if (!user) return 'user';
    return user.raw_user_meta_data?.role || user.user_metadata?.role || 'user';
};

export const formatAuthUser = (user) => {
    if (!user) return null;
    return {
        email: user.email,
        role: getUserRole(user)
    };
};
