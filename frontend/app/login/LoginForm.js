'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { useUi } from '@/components/UiProvider';
import AuthShell from '@/components/AuthShell';
import { Field, PasswordField, useFormState } from '@/components/Form';

// only allow redirects inside this app
export function safeNext(next) {
    return next && next.startsWith('/') && !next.startsWith('//') && !next.startsWith('/login') && !next.startsWith('/signup')
        ? next
        : '/';
}

export default function LoginForm() {
    const router = useRouter();
    const params = useSearchParams();
    const next = safeNext(params.get('next'));
    const { session, ready, login } = useAuth();
    const { toast } = useUi();
    const { submitting, errors, formError, run } = useFormState();
    const [values, setValues] = useState({ usernameOrEmail: '', password: '' });

    // already logged in, nothing to do here
    useEffect(() => {
        if (ready && session && !submitting) router.replace(next);
    }, [ready, session, submitting, router, next]);

    const set = (e) => setValues((v) => ({ ...v, [e.target.name]: e.target.value }));

    const onSubmit = (e) => {
        e.preventDefault();
        const clientErrors = {};
        if (!values.usernameOrEmail.trim()) clientErrors.usernameOrEmail = 'Please enter your username or email';
        if (!values.password) clientErrors.password = 'Please enter your password';
        run(async () => {
            const s = await login(values.usernameOrEmail.trim(), values.password);
            toast('Welcome back, ' + (s.name || s.username) + '!', 'success');
            router.replace(next);
        }, clientErrors);
    };

    return (
        <AuthShell
            heading="Welcome back"
            subheading="Log in to comment on posts, or to manage content as an admin."
            footer={
                <>
                    New to Blog App? <Link href={'/signup' + (next !== '/' ? '?next=' + encodeURIComponent(next) : '')}>Create an account</Link>
                </>
            }
        >
            <form onSubmit={onSubmit} noValidate>
                {formError && <div className="alert alert-error">{formError}</div>}
                <Field
                    label="Username or email"
                    name="usernameOrEmail"
                    value={values.usernameOrEmail}
                    onChange={set}
                    error={errors.usernameOrEmail}
                    autoComplete="username"
                    autoFocus
                />
                <PasswordField value={values.password} onChange={set} error={errors.password} autoComplete="current-password" />
                <button className="btn btn-primary btn-block" type="submit" disabled={submitting}>
                    {submitting ? 'Logging in...' : 'Log in'}
                </button>
            </form>
        </AuthShell>
    );
}
