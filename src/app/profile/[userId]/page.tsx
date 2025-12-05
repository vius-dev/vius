import { Metadata } from 'next';
import { createClient } from '@/lib/supabase-server';
import { notFound } from 'next/navigation';
import ProfileView from '@/components/ProfileView';
import { getFollowStatus, getFollowCounts } from '../actions';

interface ProfilePageProps {
    params: Promise<{
        userId: string;
    }>;
}

export async function generateMetadata(props: ProfilePageProps): Promise<Metadata> {
    const params = await props.params;
    const { userId } = params;
    const supabase = await createClient();
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (!profile) {
        return {
            title: 'Profile Not Found',
        };
    }

    return {
        title: `${profile.display_name || 'User'} - Profile`,
        description: profile.bio || `View ${profile.display_name || 'User'}'s profile on Nius`,
    };
}

export default async function ProfilePage(props: ProfilePageProps) {
    const params = await props.params;
    const { userId } = params;
    const supabase = await createClient();
    const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (error || !profile) {
        notFound();
    }

    // Fetch user's articles
    const { data: articles } = await supabase
        .from('articles')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    // Fetch user's comments
    const { data: comments } = await supabase
        .from('comments')
        .select('*, articles(title)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

    // Fetch follow status and counts
    const isFollowing = await getFollowStatus(userId);
    const followCounts = await getFollowCounts(userId);

    return (
        <div className="min-h-screen bg-background">
            <main className="container mx-auto px-4 py-8 md:py-12">
                <ProfileView
                    profile={profile}
                    articles={articles || []}
                    comments={comments || []}
                    initialIsFollowing={isFollowing}
                    followCounts={followCounts}
                />
            </main>
        </div>
    );
}
