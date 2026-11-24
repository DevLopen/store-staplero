import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { saveUserSession, clearUserSession, getToken } from "@/utils/auth";

interface AuthContextType {
    isLoggedIn: boolean;
    isAdmin: boolean;
    userName: string;
    userEmail: string;
    login: (user: { name: string; email: string; isAdmin: boolean }, token: string) => void;
    logout: () => void;
    register: (firstName: string, lastName: string, email: string, password: string, language?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [userName, setUserName] = useState("");
    const [userEmail, setUserEmail] = useState("");

    useEffect(() => {
        const token = getToken();
        const loggedIn = localStorage.getItem("isLoggedIn") === "true";
        if (loggedIn && token) {
            // Sprawdź czy token JWT nie wygasł
            try {
                const payload = JSON.parse(atob(token.split(".")[1]));
                const isExpired = payload.exp && payload.exp * 1000 < Date.now();
                if (isExpired) {
                    clearUserSession();
                    return;
                }
            } catch {
                // Token ma nieprawidłowy format – wyczyść sesję
                clearUserSession();
                return;
            }
            setIsLoggedIn(true);
            setIsAdmin(localStorage.getItem("isAdmin") === "true");
            setUserName(localStorage.getItem("userName") || "");
            setUserEmail(localStorage.getItem("userEmail") || "");
        }
    }, []);

    const login = (user: { name: string; email: string; isAdmin: boolean }, token: string) => {
        saveUserSession(user, token);
        setIsLoggedIn(true);
        setIsAdmin(user.isAdmin);
        setUserName(user.name);
        setUserEmail(user.email);
    };

    const logout = () => {
        clearUserSession();
        setIsLoggedIn(false);
        setIsAdmin(false);
        setUserName("");
        setUserEmail("");
    };

    // Błąd z kodem z backendu (np. PASSWORD_LENGTH), żeby formularz pokazał tekst w języku strony
    const register = async (firstName: string, lastName: string, email: string, password: string, language?: string) => {
        const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
        let res: Response;
        try {
            res = await fetch(`${API_URL}/auth/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ firstName, lastName, email, password, language }),
            });
        } catch {
            throw Object.assign(new Error("Server not reachable"), { code: "NETWORK" });
        }
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            throw Object.assign(new Error(data.message || "Registration failed"), { code: data.code || (res.status === 429 ? "RATE_LIMITED" : "SERVER_ERROR") });
        }
        // automatyczne logowanie po rejestracji
        login(data.user, data.token);
    };

    return (
        <AuthContext.Provider value={{ isLoggedIn, isAdmin, userName, userEmail, login, logout, register }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within AuthProvider");
    return context;
};