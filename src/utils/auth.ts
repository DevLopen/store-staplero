export const saveUserSession = (user: { name: string; email: string; isAdmin: boolean }, token: string) => {
    localStorage.setItem("token", token);
    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("userName", user.name);
    localStorage.setItem("userEmail", user.email);
    localStorage.setItem("isAdmin", user.isAdmin.toString());
};

export const clearUserSession = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("userName");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("isAdmin");
};

export const getToken = (): string | null => {
    return localStorage.getItem("token");
};
