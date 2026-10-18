'use client';

import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { formatDate, plural, readingTime } from '@/lib/format';
import { useAuth } from '@/components/AuthProvider';
import { ErrorState, Loader } from '@/components/States';

const PAGE_SIZE = 9;
const SORTS = {
    newest: { label: 'Newest first', sortBy: 'id', sortDir: 'desc' },
    oldest: { label: 'Oldest first', sortBy: 'id', sortDir: 'asc' },
    title: { label: 'Title A-Z', sortBy: 'title', sortDir: 'asc' }
};

export default function HomePage() {
    // useSearchParams needs a Suspense boundary in the App Router
    return (
        <Suspense fallback={<Loader />}>
            <Home />
        </Suspense>
    );
}

function Home() {
    const router = useRouter();
    const params = useSearchParams();
    const { session, isAdmin } = useAuth();

    const page = Math.max(parseInt(params.get('page') || '1', 10) || 1, 1);
    const categoryId = params.get('category');
    const sortKey = SORTS[params.get('sort')] ? params.get('sort') : 'newest';

    const [data, setData] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        let cancelled = false;
        const sort = SORTS[sortKey];
        setData(null);
        setError(null);
        (async () => {
            try {
                const categoriesReq = api('/category');
                let posts;
                let pageInfo = null;
                if (categoryId) {
                    // the by-category endpoint is not paged, so sort on the client
                    posts = await api('/posts/category/' + encodeURIComponent(categoryId));
                    posts.sort((a, b) => {
                        const cmp = sort.sortBy === 'title' ? a.title.localeCompare(b.title) : a.id - b.id;
                        return sort.sortDir === 'desc' ? -cmp : cmp;
                    });
                } else {
                    pageInfo = await api(
                        `/posts?pageNo=${page - 1}&pageSize=${PAGE_SIZE}&sortBy=${sort.sortBy}&sortDir=${sort.sortDir}`
                    );
                    posts = pageInfo.content;
                }
                const categories = await categoriesReq;
                if (!cancelled) setData({ posts, pageInfo, categories });
            } catch (e) {
                if (!cancelled) setError(e);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [page, categoryId, sortKey]);

    const href = (changes) => {
        const p = new URLSearchParams(params.toString());
        Object.entries(changes).forEach(([k, v]) => (v == null ? p.delete(k) : p.set(k, v)));
        if (p.get('sort') === 'newest') p.delete('sort');
        const qs = p.toString();
        return '/' + (qs ? '?' + qs : '');
    };

    const activeCategory = data?.categories.find((c) => String(c.id) === String(categoryId));
    const firstName = (session?.name || session?.username || '').split(' ')[0];

    return (
        <>
            <section className="hero">
                <h1>{session ? `Welcome back, ${firstName}` : 'Ideas worth reading.'}</h1>
                <p>
                    {categoryId ? (
                        <>
                            Posts in <strong>{activeCategory?.name || 'this category'}</strong>.
                        </>
                    ) : (
                        'Stories, tutorials and notes from the Blog App community.'
                    )}
                </p>
                <div className="hero-actions">
                    {isAdmin && (
                        <>
                            <Link className="btn btn-light" href="/posts/new">
                                Write a post
                            </Link>
                            <Link className="btn btn-ghost" href="/categories">
                                Manage categories
                            </Link>
                        </>
                    )}
                    {!session && (
                        <Link className="btn btn-light" href="/signup">
                            Join the conversation
                        </Link>
                    )}
                </div>
            </section>

            {error && <ErrorState error={error} />}
            {!error && !data && <Loader />}
            {data && (
                <>
                    <div className="toolbar">
                        <div className="chips">
                            <Link className={'chip' + (categoryId ? '' : ' active')} href={href({ category: null, page: null })}>
                                All
                            </Link>
                            {data.categories.map((c) => (
                                <Link
                                    key={c.id}
                                    className={'chip' + (String(c.id) === String(categoryId) ? ' active' : '')}
                                    href={href({ category: c.id, page: null })}
                                    title={c.description || ''}
                                >
                                    {c.name}
                                </Link>
                            ))}
                        </div>
                        <select
                            className="select"
                            aria-label="Sort posts"
                            value={sortKey}
                            onChange={(e) => router.push(href({ sort: e.target.value, page: null }))}
                        >
                            {Object.entries(SORTS).map(([key, s]) => (
                                <option key={key} value={key}>
                                    {s.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {data.posts.length ? (
                        <div className="grid">
                            {data.posts.map((post) => (
                                <PostCard key={post.id} post={post} />
                            ))}
                        </div>
                    ) : (
                        <div className="card empty">
                            <h2>No posts yet</h2>
                            <p>{isAdmin ? 'Write the first one!' : 'Check back soon.'}</p>
                            {isAdmin && (
                                <Link className="btn btn-primary" href="/posts/new">
                                    Write a post
                                </Link>
                            )}
                        </div>
                    )}

                    {data.pageInfo && data.pageInfo.totalPages > 1 && (
                        <div className="pagination">
                            {page > 1 && (
                                <Link className="btn btn-outline btn-sm" href={href({ page: page - 1 })}>
                                    &larr; Previous
                                </Link>
                            )}
                            <span>
                                Page {page} of {data.pageInfo.totalPages}
                            </span>
                            {!data.pageInfo.last && (
                                <Link className="btn btn-outline btn-sm" href={href({ page: page + 1 })}>
                                    Next &rarr;
                                </Link>
                            )}
                        </div>
                    )}
                </>
            )}
        </>
    );
}

function PostCard({ post }) {
    const comments = (post.comments || []).length;
    return (
        <Link className="card post-card" href={'/posts/' + post.id}>
            <div className="meta">
                {post.categoryName && <span className="tag">{post.categoryName}</span>}
                {post.createdAt && <span>{formatDate(post.createdAt)}</span>}
            </div>
            <h2>{post.title}</h2>
            <p>{post.description}</p>
            <div className="meta">
                <span>{readingTime(post.content)}</span>
                <span className="dot">{plural(comments, 'comment')}</span>
            </div>
        </Link>
    );
}
