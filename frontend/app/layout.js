import './globals.css';
import { AuthProvider } from '@/components/AuthProvider';
import { UiProvider } from '@/components/UiProvider';
import Header from '@/components/Header';

export const metadata = {
    title: { default: 'Blog App', template: '%s · Blog App' },
    description: 'Read, write and discuss posts on Blog App.'
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body>
                <AuthProvider>
                    <UiProvider>
                        <Header />
                        <main className="container">{children}</main>
                        <footer className="site-footer">
                            <div className="container footer-inner">
                                <span>Blog App &middot; Next.js + Spring Boot</span>
                                <a href="/swagger-ui/index.html" target="_blank" rel="noopener noreferrer">
                                    API docs
                                </a>
                            </div>
                        </footer>
                    </UiProvider>
                </AuthProvider>
            </body>
        </html>
    );
}
