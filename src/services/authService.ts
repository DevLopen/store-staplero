export interface LoginData {
    email: string;
    password: string;
}

export interface RegisterData {
    name: string;
    email: string;
    password: string;
}

export interface User {
    name: string;
    email: string;
    isAdmin: boolean;
}

export interface AuthResponse {
    user: User;
    token: string;
}

const API_URL = import.meta.env.VITE_API_URL;

export const loginUser = async (data: LoginData): Promise<AuthResponse> => {
    const res = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });

    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Login failed");
    }

    return res.json();
};

export const registerUser = async (data: RegisterData): Promise<AuthResponse> => {
    const res = await fetch(`${API_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });

    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Registration failed");
    }

    return res.json();
};

export const fetchMe = async (token: string): Promise<User> => {
    const res = await fetch(`${API_URL}/me`, {
        headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Fetch user failed");
    }

    const data = await res.json();
    return data.user;
};
