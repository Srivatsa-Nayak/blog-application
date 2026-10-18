'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { useUi } from '@/components/UiProvider';
import AuthShell from '@/components/AuthShell';
import { Field, PasswordField, useFormState } from '@/components/Form';
import { safeNext } from '../login/LoginForm';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// mirrors the rules on RegisterDto so most mistakes are caught before the request
function validate(v) {
    const e = {};
    if (!v.name.trim()) e.name = 'Please enter your name';
    if (v.username.trim().length < 3 || v.username.trim().length > 50) e.username = 'Username should have 3 to 50 characters';
    else if (/\s/.test(v.username.trim())) e.username = 'Username cannot contain spaces';
    if (!EMAIL.test(v.email.trim())) e.email = 'Please enter a valid email address';
    if (v.password.length < 6) e.password = 'Password should have at least 6 characters';
    if (v.confirmPassword !== v.password) e.confirmPassword = 'Passwords do not match';
    return e;
}

export default function SignupForm() {
    const router = useRouter();
    const params = useSearchParams();
    const next = safeNext(params.get('next'));
    const { session, ready, register } = useAuth();
    const { toast } = useUi();
    const { submitting, errors, formError, run } = useFormState();
    const [values, setValues] = useState({ name: '', username: '', email: '', password: '', confirmPassword: '' });

    useEffect(() => {
        if (ready && session && !submitting) router.replace(next);
    }, [ready, session, submitting, router, next]);

    const set = (e) => setValues((v) => ({ ...v, [e.target.name]: e.target.value }));

    const onSubmit = (e) => {
        e.preventDefault();
        run(async () => {
            await register({
                name: values.name.trim(),
                username: values.username.trim(),
                email: values.email.trim(),
                password: values.password
            });
            toast('Welcome to Blog App, ' + values.name.trim().split(' ')[0] + '!', 'success');
            router.replace(next);
        }, validate(values));
    };

    return (
        <AuthShell
            heading="Create your account"
            subheading="It only takes a minute. You can comment as soon as you're in."
            footer={
                <>
                    Already have an account? <Link href={'/login' + (next !== '/' ? '?next=' + encodeURIComponent(next) : '')}>Log in</Link>
                </>
            }
        >
            <form onSubmit={onSubmit} noValidate>
                {formError && <div className="alert alert-error">{formError}</div>}
                <Field label="Full name" name="name" value={values.name} onChange={set} error={errors.name} autoComplete="name" autoFocus />
                <div className="form-row">
                    <Field label="Username" name="username" value={values.username} onChange={set} error={errors.username} autoComplete="username" />
                    <Field label="Email" name="email" type="email" value={values.email} onChange={set} error={errors.email} autoComplete="email" />
                </div>
                <div className="form-row">
                    <PasswordField
                        value={values.password}
                        onChange={set}
                        error={errors.password}
                        hint="At least 6 characters."
                        autoComplete="new-password"
                    />
                    <PasswordField
                        label="Confirm password"
                        name="confirmPassword"
                        value={values.confirmPassword}
                        onChange={set}
                        error={errors.confirmPassword}
                        autoComplete="new-password"
                    />
                </div>
                <button className="btn btn-primary btn-block" type="submit" disabled={submitting}>
                    {submitting ? 'Creating account...' : 'Create account'}
                </button>
            </form>
        </AuthShell>
    );
}
