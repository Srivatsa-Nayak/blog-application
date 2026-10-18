'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { SESSION_KEY, loadSession, saveSession, tokenExpiry } from '@/lib/session';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const router = useRouter();
    const [session, setSession] = useState(null);
    // false until localStorage has been read, so pages do not redirect before we know who is logged in
    const [ready, setReady] = useState(false);

    useEffect(() => {
        setSession(loadSession());
        setReady(true);
        // keep tabs in sync when logging in or out in another tab
        const onStorage = (e) => {
            if (e.key === SESSION_KEY) setSession(loadSession());
        };
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, []);

    useEffect(() => {
        const onExpired = () => {
            saveSession(null);
            setSession(null);
            router.push('/login?next=' + encodeURIComponent(location.pathname + location.search));
        };
        window.addEventListener('auth:expired', onExpired);
        return () => window.removeEventListener('auth:expired', onExpired);
    }, [router]);

    const login = useCallback(async (usernameOrEmail, password) => {
        const res = await api('/auth/login', { method: 'POST', body: { usernameOrEmail, password } });
        const next = {
            accessToken: res.accessToken,
            name: res.name,
            username: res.username,
            email: res.email,
            roles: res.roles || [],
            expiresAt: tokenExpiry(res.accessToken)
        };
        saveSession(next);
        setSession(next);
        return next;
    }, []);

    const register = useCallback(
        async (data) => {
            await api('/auth/register', { method: 'POST', body: data });
            return login(data.username, data.password);
        },
        [login]
    );

    const logout = useCallback(() => {
        saveSession(null);
        setSession(null);
    }, []);

    const value = useMemo(
        () => ({
            session,
            ready,
            isAdmin: !!session?.roles?.includes('ROLE_ADMIN'),
            login,
            register,
            logout
        }),
        [session, ready, login, register, logout]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    return useContext(AuthContext);
}
