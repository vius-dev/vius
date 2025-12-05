import { createClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import CollectionsList from '@/components/CollectionsList';

export const metadata = {
    title: 'My Collections - Nius',
    description: 'Organize your articles into collections',
};

export default async function CollectionsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/');
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-6xl mx-auto">
                <CollectionsList />
            </div>
        </div>
    );
}
