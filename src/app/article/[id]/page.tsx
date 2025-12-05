import { Metadata } from 'next';
import { createClient } from '@/lib/supabase-server';
import ArticleView from '@/components/ArticleView';
import { notFound } from 'next/navigation';

interface ArticlePageProps {
    params: {
        id: string;
    };
}

// Generate metadata for SEO and social sharing
export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
    const supabase = await createClient();
    const { data: article } = await supabase
        .from('articles')
        .select('*')
        .eq('id', params.id)
        .single();

    if (!article) {
        return {
            title: 'Article Not Found',
        };
    }

    const description = article.body.substring(0, 160) + '...';
    const url = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://nius.com'}/article/${params.id}`;

    return {
        title: `${article.title} | Nius`,
        description,
        openGraph: {
            title: article.title,
            description,
            url,
            siteName: 'Nius',
            images: [
                {
                    url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://nius.com'}/api/og?title=${encodeURIComponent(article.title)}&section=${encodeURIComponent(article.section)}&date=${encodeURIComponent(article.created_at)}`,
                    width: 1200,
                    height: 630,
                    alt: article.title,
                },
            ],
            type: 'article',
            publishedTime: article.created_at,
            modifiedTime: article.updated_at,
            section: article.section,
        },
        twitter: {
            card: 'summary_large_image',
            title: article.title,
            description,
            images: [`${process.env.NEXT_PUBLIC_SITE_URL || 'https://nius.com'}/api/og?title=${encodeURIComponent(article.title)}&section=${encodeURIComponent(article.section)}&date=${encodeURIComponent(article.created_at)}`],
        },
    };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
    const supabase = await createClient();
    const { data: article, error } = await supabase
        .from('articles')
        .select('*')
        .eq('id', params.id)
        .single();

    if (error || !article) {
        notFound();
    }

    // Fetch comments count
    const { count: commentsCount } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('article_id', params.id);

    // Fetch user's reaction if logged in
    const { data: { user } } = await supabase.auth.getUser();
    let userReaction: 'like' | 'dislike' | null = null;

    if (user) {
        const { data: reaction } = await supabase
            .from('article_reactions')
            .select('reaction_type')
            .eq('article_id', params.id)
            .eq('user_id', user.id)
            .single();

        if (reaction) {
            userReaction = reaction.reaction_type as 'like' | 'dislike';
        }
    }

    const articleWithComments = {
        ...article,
        comments: [],
        user_reaction: userReaction
    };

    return (
        <div className="min-h-screen bg-background">
            <main className="container mx-auto px-4 py-8 md:py-12">
                <ArticleView
                    article={articleWithComments}
                    onBack={() => window.history.back()}
                />
            </main>
        </div>
    );
}
