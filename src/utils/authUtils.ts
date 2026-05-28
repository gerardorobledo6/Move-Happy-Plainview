export const normalizeEmail = (email?: string | null): string => {
    return (email || "").trim().toLowerCase();
};

export const isAdmin = (user: any): boolean => {
    if (!user) return false;
    return normalizeEmail(user.email) === "admin@movehappy.com" || user.role === "ADMIN";
};
