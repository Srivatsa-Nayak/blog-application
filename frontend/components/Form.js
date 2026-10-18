'use client';

import { useState } from 'react';
import { ApiError } from '@/lib/api';

export function Field({ label, name, error, hint, children, as = 'input', ...props }) {
    const id = props.id || 'f-' + name;
    const Tag = as;
    return (
        <div className={'field' + (error ? ' has-error' : '')}>
            <label htmlFor={id}>{label}</label>
            {children || (
                <Tag
                    id={id}
                    name={name}
                    aria-invalid={!!error}
                    aria-describedby={error ? id + '-error' : undefined}
                    {...props}
                />
            )}
            {hint && !error && <div className="hint">{hint}</div>}
            {error && (
                <div className="error" id={id + '-error'}>
                    {error}
                </div>
            )}
        </div>
    );
}

export function PasswordField({ label = 'Password', name = 'password', error, hint, ...props }) {
    const [visible, setVisible] = useState(false);
    const id = 'f-' + name;
    return (
        <Field label={label} name={name} error={error} hint={hint}>
            <div className="password-wrap">
                <input
                    id={id}
                    name={name}
                    type={visible ? 'text' : 'password'}
                    aria-invalid={!!error}
                    aria-describedby={error ? id + '-error' : undefined}
                    {...props}
                />
                <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setVisible((v) => !v)}
                    aria-label={visible ? 'Hide password' : 'Show password'}
                >
                    {visible ? 'Hide' : 'Show'}
                </button>
            </div>
        </Field>
    );
}

// Tracks submit state plus field and form level errors for a form backed by the API.
export function useFormState() {
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState({});
    const [formError, setFormError] = useState('');

    const run = async (action, clientErrors) => {
        if (clientErrors && Object.keys(clientErrors).length) {
            setErrors(clientErrors);
            setFormError('');
            return;
        }
        setSubmitting(true);
        setErrors({});
        setFormError('');
        try {
            await action();
        } catch (error) {
            if (error instanceof ApiError && error.fields) {
                setErrors(error.fields);
            } else {
                setFormError(error?.message || 'Unexpected error.');
                if (!(error instanceof ApiError)) console.error(error);
            }
        } finally {
            setSubmitting(false);
        }
    };

    return { submitting, errors, formError, run, setErrors };
}
