export const SESSION_KEY = 'blogapp.session';

// The logged in user is kept in localStorage so it survives page reloads.
export function loadSession() {
    try {
        const session = JSON.parse(localStorage.getItem(SESSION_KEY));
        if (session && session.expiresAt > Date.now()) return session;
    } catch {
        // storage unavailable or corrupted
    }
    return null;
}

export function saveSession(session) {
    try {
        if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
        else localStorage.removeItem(SESSION_KEY);
    } catch {
        // storage unavailable, the session lives for this page only
    }
}

// Reads the expiry from the JWT payload so the UI logs out when the token does.
export function tokenExpiry(token) {
    try {
        const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
        return payload.exp * 1000;
    } catch {
        return Date.now() + 60 * 60 * 1000;
    }
}
