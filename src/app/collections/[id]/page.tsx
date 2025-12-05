import { createClient } from '@/lib/supabase-server';
import { notFound } from 'next/navigation';
import ArticleCard from '@/components/ArticleCard';
import { Article } from '@/types/article';
import { Folder, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default async function CollectionPage({ params }: { params: { id: string } }) {
    const supabase = await createClient();

    const { data: collection, error: collectionError } = await supabase
        .from('collections')
        .select('*')
        .eq('id', params.id)
        .single();

    if (collectionError || !collection) {
        notFound();
    }

    const { data: items, error: itemsError } = await supabase
        .from('collection_items')
        .select(`
      id,
      order,
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
        .eq('collection_id', params.id)
        .order('order', { ascending: true });

    const articles = items?.map((item: any) => item.articles).filter(Boolean) || [];

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-6xl mx-auto">
                <Link href="/collections">
                    <Button variant="ghost" className="mb-4">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Collections
                    </Button>
                </Link>

                <div className="flex items-center gap-3 mb-2">
                    <Folder className="h-8 w-8 text-primary" />
                    <h1 className="text-4xl font-bold">{collection.title}</h1>
                </div>

                {collection.description && (
                    <p className="text-muted-foreground mb-8">{collection.description}</p>
                )}

                {articles.length === 0 ? (
                    <div className="text-center py-16">
                        <Folder className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                        <h2 className="text-2xl font-semibold mb-2">No articles in this collection</h2>
                        <p className="text-muted-foreground">
                            Add articles to this collection to organize your reading
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
