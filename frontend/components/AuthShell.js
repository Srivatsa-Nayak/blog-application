import Link from 'next/link';

// Two column layout shared by the login and sign up pages.
export default function AuthShell({ heading, subheading, children, footer }) {
    return (
        <div className="auth-shell card">
            <aside className="auth-aside">
                <Link href="/" className="auth-brand">
                    <span className="brand-mark" aria-hidden="true">B</span>
                    <span>Blog App</span>
                </Link>
                <div>
                    <h2>Read, write and discuss.</h2>
                    <p>Join a community of curious people sharing what they learn.</p>
                </div>
                <ul className="auth-points">
                    <li>Browse posts by category</li>
                    <li>Comment on articles you enjoy</li>
                    <li>Admins publish and curate content</li>
                </ul>
            </aside>
            <section className="auth-main">
                <h1>{heading}</h1>
                <p className="sub">{subheading}</p>
                {children}
                {footer && <p className="form-foot">{footer}</p>}
            </section>
        </div>
    );
}
