import { createClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import ArticleCard from '@/components/ArticleCard';
import { Article } from '@/types/article';
import { Bookmark } from 'lucide-react';

export const metadata = {
    title: 'Saved Articles - Nius',
    description: 'Your saved articles for later reading',
};

export default async function SavedArticlesPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/');
    }

    const { data: bookmarks, error } = await supabase
        .from('bookmarks')
        .select(`
      id,
      created_at,
      articles (
        id,
        title,
        body,
        section,
        image_url,
        text_alignment,
        user_id,
        created_at,
        updated_at,
        likes_count,
        dislikes_count,
        tags,
        published,
        views_count,
        reading_time
      )
    `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching bookmarks:', error);
    }

    const articles = bookmarks?.map((bookmark: any) => bookmark.articles).filter(Boolean) || [];

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex items-center gap-3 mb-8">
                    <Bookmark className="h-8 w-8 text-primary" />
                    <h1 className="text-4xl font-bold">Saved Articles</h1>
                </div>

                {articles.length === 0 ? (
                    <div className="text-center py-16">
                        <Bookmark className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                        <h2 className="text-2xl font-semibold mb-2">No saved articles yet</h2>
                        <p className="text-muted-foreground">
                            Start bookmarking articles to read them later
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {articles.map((article: Article) => (
                            <ArticleCard
                                key={article.id}
                                article={article}
                                onClick={() => {
                                    window.location.href = `/article/${article.id}`;
                                }}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
