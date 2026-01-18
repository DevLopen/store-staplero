import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { saveUserSession, clearUserSession, getToken } from "@/utils/auth";

interface AuthContextType {
    isLoggedIn: boolean;
    isAdmin: boolean;
    userName: string;
    userEmail: string;
    login: (user: { name: string; email: string; isAdmin: boolean }, token: string) => void;
    logout: () => void;
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

    return (
        <AuthContext.Provider value={{ isLoggedIn, isAdmin, userName, userEmail, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within AuthProvider");
    return context;
};
