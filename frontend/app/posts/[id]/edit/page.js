'use client';

import { useParams } from 'next/navigation';
import PostForm from '@/components/PostForm';
import { ErrorState, Loader } from '@/components/States';
import { useRequireAdmin } from '@/components/useRequireAdmin';

export default function EditPostPage() {
    const { id } = useParams();
    const access = useRequireAdmin();
    if (access === 'loading') return <Loader />;
    if (access === 'forbidden') return <ErrorState error={{ status: 403, message: 'Only admins can edit posts.' }} />;
    return <PostForm postId={id} />;
}
