'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Article } from '@/types/article';
import { getRelatedArticles } from '@/app/article/actions';
import { useRouter } from 'next/navigation';
import { Sparkles, Clock } from 'lucide-react';

interface RelatedArticlesProps {
    articleId: string;
}

export default function RelatedArticles({ articleId }: RelatedArticlesProps) {
    const [articles, setArticles] = useState<Article[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchRelated = async () => {
            setLoading(true);
            try {
                const related = await getRelatedArticles(articleId, 5);
                setArticles(related);
            } catch (error) {
                console.error('Error fetching related articles:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchRelated();
    }, [articleId]);

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5" />
                        You might also like
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">Loading...</p>
                </CardContent>
            </Card>
        );
    }

    if (articles.length === 0) {
        return null;
    }

    const formatDate = (timestamp: string) => {
        return new Date(timestamp).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    You might also like
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {articles.map((article) => (
                    <div
                        key={article.id}
                        className="group cursor-pointer p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                        onClick={() => router.push(`/article/${article.id}`)}
                    >
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="text-xs">
                                    {article.section}
                                </Badge>
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Clock className="h-3 w-3" />
                                    {formatDate(article.created_at)}
                                </div>
                            </div>
                            <h3 className="font-semibold group-hover:text-primary transition-colors line-clamp-2">
                                {article.title}
                            </h3>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                                {article.body.substring(0, 120)}...
                            </p>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
