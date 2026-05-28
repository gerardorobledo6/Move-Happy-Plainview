export const normalizeEmail = (email?: string | null): string => {
    return (email || "").trim().toLowerCase();
};
