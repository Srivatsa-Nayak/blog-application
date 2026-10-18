'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from './AuthProvider';

// Sends anonymous visitors to the login page. Returns 'loading', 'forbidden' or 'ok'.
export function useRequireAdmin() {
    const { session, ready, isAdmin } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (ready && !session) router.replace('/login?next=' + encodeURIComponent(pathname));
    }, [ready, session, router, pathname]);

    if (!ready || !session) return 'loading';
    return isAdmin ? 'ok' : 'forbidden';
}
