'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { useUi } from '@/components/UiProvider';
import { Field, useFormState } from '@/components/Form';
import { ErrorState, Loader } from '@/components/States';
import { useRequireAdmin } from '@/components/useRequireAdmin';

const EMPTY = { id: null, name: '', description: '' };

export default function CategoriesPage() {
    const access = useRequireAdmin();
    if (access === 'loading') return <Loader />;
    if (access === 'forbidden') return <ErrorState error={{ status: 403, message: 'Only admins can manage categories.' }} />;
    return <Categories />;
}

function Categories() {
    const { toast, confirm } = useUi();
    const { submitting, errors, formError, run } = useFormState();
    const [categories, setCategories] = useState(null);
    const [loadError, setLoadError] = useState(null);
    const [values, setValues] = useState(EMPTY);
    const formRef = useRef(null);

    const load = useCallback(async () => {
        try {
            setCategories(await api('/category'));
        } catch (e) {
            setLoadError(e);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    if (loadError) return <ErrorState error={loadError} />;
    if (!categories) return <Loader />;

    const set = (e) => setValues((v) => ({ ...v, [e.target.name]: e.target.value }));
    const editing = values.id != null;

    const onSubmit = (e) => {
        e.preventDefault();
        const clientErrors = values.name.trim() ? null : { name: 'Please enter a name' };
        run(async () => {
            const body = { name: values.name.trim(), description: values.description.trim() };
            await api(editing ? '/category/' + values.id : '/category', { method: editing ? 'PUT' : 'POST', body });
            toast(editing ? 'Category updated.' : 'Category added.', 'success');
            setValues(EMPTY);
            await load();
        }, clientErrors);
    };

    const startEdit = (c) => {
        setValues({ id: c.id, name: c.name, description: c.description || '' });
        formRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const remove = async (c) => {
        const ok = await confirm({
            title: `Delete "${c.name}"?`,
            message: 'All posts in this category and their comments will be deleted too.'
        });
        if (!ok) return;
        try {
            await api('/category/' + c.id, { method: 'DELETE' });
            toast('Category deleted.', 'success');
            if (values.id === c.id) setValues(EMPTY);
            await load();
        } catch (e) {
            toast(e.message, 'error');
        }
    };

    return (
        <>
            <div className="page-head">
                <div>
                    <h1>Categories</h1>
                    <p>Organise posts into topics.</p>
                </div>
            </div>

            <form ref={formRef} className="card form-card wide flush" onSubmit={onSubmit} noValidate>
                <h3>{editing ? `Edit "${categories.find((c) => c.id === values.id)?.name || ''}"` : 'Add a category'}</h3>
                {formError && <div className="alert alert-error">{formError}</div>}
                <div className="form-row">
                    <Field label="Name" name="name" value={values.name} onChange={set} error={errors.name} placeholder="e.g. Technology" />
                    <Field
                        label="Description"
                        name="description"
                        value={values.description}
                        onChange={set}
                        error={errors.description}
                        placeholder="Optional"
                    />
                </div>
                <div className="form-actions">
                    {editing && (
                        <button type="button" className="btn btn-outline" onClick={() => setValues(EMPTY)}>
                            Cancel
                        </button>
                    )}
                    <button type="submit" className="btn btn-primary" disabled={submitting}>
                        {submitting ? 'Saving...' : editing ? 'Save changes' : 'Add category'}
                    </button>
                </div>
            </form>

            <div className="card table-card">
                {categories.length === 0 && (
                    <div className="empty">
                        <h2>No categories yet</h2>
                        <p>Add your first one above.</p>
                    </div>
                )}
                {categories.map((c) => (
                    <div className="cat-row" key={c.id}>
                        <div className="cat-info">
                            <strong>{c.name}</strong>
                            <p>{c.description || 'No description'}</p>
                        </div>
                        <div className="cat-actions">
                            <Link className="btn btn-outline btn-sm" href={'/?category=' + c.id}>
                                View posts
                            </Link>
                            <button className="btn btn-outline btn-sm" onClick={() => startEdit(c)}>
                                Edit
                            </button>
                            <button className="btn btn-danger btn-sm" onClick={() => remove(c)}>
                                Delete
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </>
    );
}
