import Link from 'next/link';

export function Loader() {
    return <div className="loader" aria-label="Loading" />;
}

export function ErrorState({ error, title }) {
    const heading = title || (error?.status === 404 ? 'Not found' : error?.status === 403 ? 'Access denied' : 'Something went wrong');
    return (
        <div className="card empty">
            <h2>{heading}</h2>
            <p>{error?.message || 'Unknown error'}</p>
            <Link className="btn btn-primary" href="/">
                Back to home
            </Link>
        </div>
    );
}
