'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from './AuthProvider';
import { useUi } from './UiProvider';
import { initials } from '@/lib/format';

export default function Header() {
    const pathname = usePathname();
    const router = useRouter();
    const { session, ready, isAdmin, logout } = useAuth();
    const { toast } = useUi();
    const [open, setOpen] = useState(false);

    // close the mobile menu after navigating
    useEffect(() => setOpen(false), [pathname]);

    const navLink = (href, label) => (
        <Link href={href} className={pathname === href ? 'active' : ''}>
            {label}
        </Link>
    );

    const onLogout = () => {
        logout();
        toast('You have been logged out.');
        router.push('/');
    };

    return (
        <header className="site-header">
            <div className="container header-inner">
                <Link href="/" className="brand" aria-label="Blog App home">
                    <span className="brand-mark" aria-hidden="true">B</span>
                    <span className="brand-name">Blog App</span>
                </Link>
                <button
                    className="nav-toggle"
                    aria-label="Toggle menu"
                    aria-expanded={open}
                    onClick={() => setOpen((o) => !o)}
                >
                    <span />
                    <span />
                    <span />
                </button>
                <nav className={'nav' + (open ? ' open' : '')}>
                    {navLink('/', 'Home')}
                    {isAdmin && navLink('/posts/new', 'Write')}
                    {isAdmin && navLink('/categories', 'Categories')}
                    {ready && session && (
                        <>
                            <span className="user-chip" title={session.email}>
                                <span className="avatar">{initials(session.name || session.username)}</span>
                                {session.username || session.email}
                                {isAdmin && <span className="badge-admin">Admin</span>}
                            </span>
                            <button className="linklike" onClick={onLogout}>
                                Log out
                            </button>
                        </>
                    )}
                    {ready && !session && (
                        <>
                            {navLink('/login', 'Log in')}
                            <Link href="/signup" className="btn btn-light btn-sm">
                                Sign up
                            </Link>
                        </>
                    )}
                </nav>
            </div>
        </header>
    );
}
