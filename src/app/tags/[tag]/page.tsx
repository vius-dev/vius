import { getArticlesByTag } from '@/app/tags/actions';
import { notFound } from 'next/navigation';
import ArticleList from '@/components/ArticleList';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tag } from 'lucide-react';
import { Metadata } from 'next';

interface TagPageProps {
    params: Promise<{
        tag: string;
    }>;
}

export async function generateMetadata(props: TagPageProps): Promise<Metadata> {
    const params = await props.params;
    const tagName = decodeURIComponent(params.tag);

    return {
        title: `#${tagName} | Nius`,
        description: `Browse articles tagged with #${tagName}`,
    };
}

export default async function TagPage(props: TagPageProps) {
    const params = await props.params;
    const tagName = decodeURIComponent(params.tag);
    const articles = await getArticlesByTag(tagName);

    if (!articles || articles.length === 0) {
        notFound();
    }

    return (
        <div className="min-h-screen bg-background">
            <main className="container mx-auto px-4 py-8 md:py-12">
                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-3xl">
                            <Tag className="h-8 w-8" />
                            #{tagName}
                        </CardTitle>
                        <p className="text-muted-foreground">
                            {articles.length} {articles.length === 1 ? 'article' : 'articles'} tagged with #{tagName}
                        </p>
                    </CardHeader>
                </Card>

                <ArticleList
                    articles={articles}
                    onArticleClick={(article) => {
                        // This will be handled client-side via router
                        window.location.href = `/article/${article.id}`;
                    }}
                />
            </main>
        </div>
    );
}
