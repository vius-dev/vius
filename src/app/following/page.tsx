import { getFollowingArticles } from './actions';
import FollowingFeedList from './FollowingFeedList';
import { Card, CardContent } from '@/components/ui/card';
import { Users } from 'lucide-react';
import SuggestedUsers from '@/components/SuggestedUsers';

export default async function FollowingFeedPage() {
    const articles = await getFollowingArticles();

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row gap-8">
                <div className="flex-1 space-y-6">
                    <div className="flex items-center gap-2 mb-6">
                        <Users className="h-6 w-6" />
                        <h1 className="text-2xl font-bold">Following Feed</h1>
                    </div>

                    {articles.length === 0 ? (
                        <Card>
                            <CardContent className="py-12 text-center text-muted-foreground">
                                <p>No articles from people you follow yet.</p>
                                <p className="text-sm mt-2">Follow some users to see their posts here!</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <FollowingFeedList articles={articles} />
                    )}
                </div>

                <div className="w-full md:w-80 space-y-6">
                    <SuggestedUsers />
                </div>
            </div>
        </div>
    );
}
