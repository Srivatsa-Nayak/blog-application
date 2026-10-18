import { Suspense } from 'react';
import { Loader } from '@/components/States';
import LoginForm from './LoginForm';

export const metadata = { title: 'Log in' };

export default function LoginPage() {
    return (
        <Suspense fallback={<Loader />}>
            <LoginForm />
        </Suspense>
    );
}
