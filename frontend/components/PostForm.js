'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Field, useFormState } from './Form';
import { ErrorState, Loader } from './States';
import { useUi } from './UiProvider';

const EMPTY = { title: '', description: '', content: '', categoryId: '' };

// Create (no postId) or edit an existing post. Admin only, the caller checks access.
export default function PostForm({ postId }) {
    const router = useRouter();
    const { toast } = useUi();
    const { submitting, errors, formError, run } = useFormState();
    const [values, setValues] = useState(EMPTY);
    const [categories, setCategories] = useState(null);
    const [loadError, setLoadError] = useState(null);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const [cats, post] = await Promise.all([
                    api('/category'),
                    postId ? api('/posts/' + encodeURIComponent(postId)) : Promise.resolve(null)
                ]);
                if (cancelled) return;
                setCategories(cats);
                if (post) {
                    setValues({
                        title: post.title,
                        description: post.description,
                        content: post.content,
                        categoryId: post.categoryId ? String(post.categoryId) : ''
                    });
                }
            } catch (error) {
                if (!cancelled) setLoadError(error);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [postId]);

    if (loadError) return <ErrorState error={loadError} />;
    if (!categories) return <Loader />;

    if (!categories.length) {
        return (
            <div className="card empty">
                <h2>Create a category first</h2>
                <p>Every post belongs to a category.</p>
                <Link className="btn btn-primary" href="/categories">
                    Manage categories
                </Link>
            </div>
        );
    }

    const set = (e) => setValues((v) => ({ ...v, [e.target.name]: e.target.value }));

    const validate = () => {
        const e = {};
        if (values.title.trim().length < 2) e.title = 'Post title should have at least 2 characters';
        if (!values.categoryId) e.categoryId = 'Please choose a category';
        if (values.description.trim().length < 10) e.description = 'Post description should have at least 10 characters';
        if (values.content.trim().length < 15) e.content = 'Post content should have at least 15 characters';
        return e;
    };

    const onSubmit = (e) => {
        e.preventDefault();
        run(async () => {
            const body = {
                title: values.title.trim(),
                description: values.description.trim(),
                content: values.content.trim(),
                categoryId: Number(values.categoryId)
            };
            const saved = await api(postId ? '/posts/' + postId : '/posts', { method: postId ? 'PUT' : 'POST', body });
            toast(postId ? 'Post updated.' : 'Post published.', 'success');
            router.push('/posts/' + saved.id);
        }, validate());
    };

    return (
        <form className="card form-card wide" onSubmit={onSubmit} noValidate>
            <h1>{postId ? 'Edit post' : 'Write a new post'}</h1>
            <p className="sub">{postId ? 'Update your post and save the changes.' : 'Share something with your readers.'}</p>
            {formError && <div className="alert alert-error">{formError}</div>}

            <Field label="Title" name="title" value={values.title} onChange={set} error={errors.title} placeholder="A catchy title" autoFocus />
            <Field label="Category" name="categoryId" error={errors.categoryId}>
                <select id="f-categoryId" name="categoryId" value={values.categoryId} onChange={set}>
                    <option value="">Choose a category</option>
                    {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                            {c.name}
                        </option>
                    ))}
                </select>
            </Field>
            <Field
                label="Short description"
                name="description"
                value={values.description}
                onChange={set}
                error={errors.description}
                hint="At least 10 characters. Shown on the post card."
                placeholder="One or two sentences about the post"
            />
            <Field
                as="textarea"
                className="tall"
                label="Content"
                name="content"
                value={values.content}
                onChange={set}
                error={errors.content}
                hint="At least 15 characters. Leave a blank line between paragraphs."
                placeholder="Write your post here."
            />
            <div className="form-actions">
                <Link className="btn btn-outline" href={postId ? '/posts/' + postId : '/'}>
                    Cancel
                </Link>
                <button className="btn btn-primary" type="submit" disabled={submitting}>
                    {submitting ? 'Saving...' : postId ? 'Save changes' : 'Publish'}
                </button>
            </div>
        </form>
    );
}
