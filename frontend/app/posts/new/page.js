'use client';

import PostForm from '@/components/PostForm';
import { ErrorState, Loader } from '@/components/States';
import { useRequireAdmin } from '@/components/useRequireAdmin';

export default function NewPostPage() {
    const access = useRequireAdmin();
    if (access === 'loading') return <Loader />;
    if (access === 'forbidden') return <ErrorState error={{ status: 403, message: 'Only admins can write posts.' }} />;
    return <PostForm />;
}
