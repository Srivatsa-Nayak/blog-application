import { ErrorState } from '@/components/States';

export default function NotFound() {
    return <ErrorState error={{ status: 404, message: 'This page does not exist.' }} />;
}
