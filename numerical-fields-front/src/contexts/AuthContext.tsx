import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { jwtDecode } from "jwt-decode";


interface AuthContextType {
    token: string | null;
    login: (token: string) => void;
    logout: () => void;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({children}: {children: ReactNode}) => {
    const [token, setToken] = useState<string | null>(null);

    useEffect(() => {
        const savedToken = localStorage.getItem("admin_token");
        if(!savedToken) return;
        
        try {
            const decoded: any = jwtDecode(savedToken);
            // Check if token is expired
            if (decoded.exp * 1000 > Date.now()) {
                setToken(savedToken);
            } else {
                localStorage.removeItem('admin_token');
            }
        } catch (error) {
            localStorage.removeItem('admin_token');
        }
    }, []);

    const login = (newToken: string) => {
        setToken(newToken);
        localStorage.setItem('admin_token', newToken);
    };

    const logout = () => {
        setToken(null);
        localStorage.removeItem('admin_token');
    };

    return (
        <AuthContext.Provider value={{
            token,
            login,
            logout,
            isAuthenticated: !!token
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};