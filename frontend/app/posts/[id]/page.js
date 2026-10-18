'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { formatDate, initials, plural, readingTime, toParagraphs } from '@/lib/format';
import { useAuth } from '@/components/AuthProvider';
import { useUi } from '@/components/UiProvider';
import { Field, useFormState } from '@/components/Form';
import { ErrorState, Loader } from '@/components/States';

export default function PostPage() {
    const { id } = useParams();
    const router = useRouter();
    const { isAdmin } = useAuth();
    const { toast, confirm } = useUi();
    const [post, setPost] = useState(null);
    const [error, setError] = useState(null);

    const load = useCallback(async () => {
        try {
            setPost(await api('/posts/' + encodeURIComponent(id)));
        } catch (e) {
            setError(e);
        }
    }, [id]);

    useEffect(() => {
        load();
    }, [load]);

    useEffect(() => {
        if (post) document.title = post.title + ' · Blog App';
    }, [post]);

    if (error) return <ErrorState error={error} />;
    if (!post) return <Loader />;

    const deletePost = async () => {
        const ok = await confirm({
            title: 'Delete this post?',
            message: 'The post and all of its comments will be permanently removed.'
        });
        if (!ok) return;
        try {
            await api('/posts/' + post.id, { method: 'DELETE' });
            toast('Post deleted.', 'success');
            router.push('/');
        } catch (e) {
            toast(e.message, 'error');
        }
    };

    return (
        <>
            <Link className="back-link" href="/">
                &larr; All posts
            </Link>
            <article className="card article">
                <div className="meta">
                    {post.categoryName && (
                        <Link className="tag" href={'/?category=' + post.categoryId}>
                            {post.categoryName}
                        </Link>
                    )}
                    {post.createdAt && <span>{formatDate(post.createdAt)}</span>}
                    <span className="dot">{readingTime(post.content)}</span>
                </div>
                <h1>{post.title}</h1>
                <p className="lead">{post.description}</p>
                <hr className="divider" />
                <div className="body">
                    {toParagraphs(post.content).map((p, i) => (
                        <p key={i}>{p}</p>
                    ))}
                </div>
                {isAdmin && (
                    <>
                        <hr className="divider" />
                        <div className="article-actions">
                            <Link className="btn btn-outline btn-sm" href={'/posts/' + post.id + '/edit'}>
                                Edit post
                            </Link>
                            <button className="btn btn-danger btn-sm" onClick={deletePost}>
                                Delete post
                            </button>
                        </div>
                    </>
                )}
            </article>
            <Comments post={post} onChange={load} />
        </>
    );
}

function Comments({ post, onChange }) {
    const { session, isAdmin } = useAuth();
    const pathname = usePathname();
    const comments = [...(post.comments || [])].sort((a, b) => a.id - b.id);

    return (
        <section className="card comments" id="comments">
            <h2>{plural(comments.length, 'Comment')}</h2>
            {comments.length === 0 && <p className="muted">No comments yet. Be the first!</p>}
            {comments.map((c) => (
                <CommentItem key={c.id} postId={post.id} comment={c} canModerate={isAdmin} onChange={onChange} />
            ))}
            {session ? (
                <CommentForm postId={post.id} session={session} onPosted={onChange} />
            ) : (
                <div className="alert alert-info comment-login">
                    <Link href={'/login?next=' + encodeURIComponent(pathname)}>Log in</Link> or{' '}
                    <Link href={'/signup?next=' + encodeURIComponent(pathname)}>create an account</Link> to join the discussion.
                </div>
            )}
        </section>
    );
}

function CommentItem({ postId, comment, canModerate, onChange }) {
    const { toast, confirm } = useUi();
    const [editing, setEditing] = useState(false);
    const [body, setBody] = useState(comment.body);
    const { submitting, errors, formError, run } = useFormState();

    const remove = async () => {
        if (!(await confirm({ title: 'Delete this comment?', message: 'This cannot be undone.' }))) return;
        try {
            await api(`/posts/${postId}/comments/${comment.id}`, { method: 'DELETE' });
            toast('Comment deleted.', 'success');
            onChange();
        } catch (e) {
            toast(e.message, 'error');
        }
    };

    const save = (e) => {
        e.preventDefault();
        const clientErrors = body.trim().length < 10 ? { body: 'Comment should have at least 10 characters' } : null;
        run(async () => {
            await api(`/posts/${postId}/comments/${comment.id}`, {
                method: 'PUT',
                body: { name: comment.name, email: comment.email, body: body.trim() }
            });
            toast('Comment updated.', 'success');
            setEditing(false);
            onChange();
        }, clientErrors);
    };

    return (
        <div className="comment">
            <span className="avatar">{initials(comment.name)}</span>
            <div className="comment-main">
                <div className="comment-head">
                    <span>
                        <strong>{comment.name}</strong>
                        {comment.createdAt && <span className="muted small"> &middot; {formatDate(comment.createdAt)}</span>}
                    </span>
                    {canModerate && !editing && (
                        <span className="comment-actions">
                            <button className="btn btn-outline btn-sm" onClick={() => setEditing(true)}>
                                Edit
                            </button>
                            <button className="btn btn-danger btn-sm" onClick={remove}>
                                Delete
                            </button>
                        </span>
                    )}
                </div>
                {editing ? (
                    <form onSubmit={save} noValidate className="comment-edit">
                        {formError && <div className="alert alert-error">{formError}</div>}
                        <Field
                            as="textarea"
                            label="Edit comment"
                            name="body"
                            id={'edit-' + comment.id}
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            error={errors.body}
                            autoFocus
                        />
                        <div className="form-actions">
                            <button
                                type="button"
                                className="btn btn-outline btn-sm"
                                onClick={() => {
                                    setEditing(false);
                                    setBody(comment.body);
                                }}
                            >
                                Cancel
                            </button>
                            <button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>
                                {submitting ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                    </form>
                ) : (
                    <p className="comment-body">{comment.body}</p>
                )}
            </div>
        </div>
    );
}

function CommentForm({ postId, session, onPosted }) {
    const { toast } = useUi();
    const { submitting, errors, formError, run } = useFormState();
    const [values, setValues] = useState({ name: session.name || session.username || '', email: session.email || '', body: '' });

    const set = (e) => setValues((v) => ({ ...v, [e.target.name]: e.target.value }));

    const onSubmit = (e) => {
        e.preventDefault();
        const clientErrors = {};
        if (!values.name.trim()) clientErrors.name = 'Please enter your name';
        if (!values.email.trim()) clientErrors.email = 'Please enter your email';
        if (values.body.trim().length < 10) clientErrors.body = 'Comment should have at least 10 characters';
        run(async () => {
            await api(`/posts/${postId}/comments`, {
                method: 'POST',
                body: { name: values.name.trim(), email: values.email.trim(), body: values.body.trim() }
            });
            toast('Comment posted.', 'success');
            setValues((v) => ({ ...v, body: '' }));
            await onPosted();
        }, clientErrors);
    };

    return (
        <form onSubmit={onSubmit} noValidate className="comment-form">
            <h3>Leave a comment</h3>
            {formError && <div className="alert alert-error">{formError}</div>}
            <div className="form-row">
                <Field label="Name" name="name" id="c-name" value={values.name} onChange={set} error={errors.name} />
                <Field label="Email" name="email" id="c-email" type="email" value={values.email} onChange={set} error={errors.email} />
            </div>
            <Field
                as="textarea"
                label="Comment"
                name="body"
                id="c-body"
                value={values.body}
                onChange={set}
                error={errors.body}
                placeholder="Share your thoughts (at least 10 characters)"
            />
            <div className="form-actions">
                <button className="btn btn-primary" type="submit" disabled={submitting}>
                    {submitting ? 'Posting...' : 'Post comment'}
                </button>
            </div>
        </form>
    );
}
