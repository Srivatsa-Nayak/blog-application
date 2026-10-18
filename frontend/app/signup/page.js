import { Suspense } from 'react';
import { Loader } from '@/components/States';
import SignupForm from './SignupForm';

export const metadata = { title: 'Sign up' };

export default function SignupPage() {
    return (
        <Suspense fallback={<Loader />}>
            <SignupForm />
        </Suspense>
    );
}
