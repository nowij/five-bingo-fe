import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    ReactNode,
} from 'react';
import { AuthUser } from '../types';

interface AuthContextValue {
    user: AuthUser | null;
    login: (data: AuthUser) => void;
    logout: () => void;
    loading: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser]       = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token    = localStorage.getItem('bingo_token');
        const nickname = localStorage.getItem('bingo_nickname');
        const userId   = localStorage.getItem('bingo_userId');
        if (token && nickname && userId) {
            setUser({ token, nickname, userId: Number(userId) });
        }
        setLoading(false);
    }, []);

    const login = (data: AuthUser) => {
        localStorage.setItem('bingo_token',    data.token);
        localStorage.setItem('bingo_nickname', data.nickname);
        localStorage.setItem('bingo_userId',   String(data.userId));
        setUser(data);
    };

    const logout = () => {
        localStorage.removeItem('bingo_token');
        localStorage.removeItem('bingo_nickname');
        localStorage.removeItem('bingo_userId');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
    return ctx;
}