'use client';

import ArticleList from '@/components/ArticleList';
import { useRouter } from 'next/navigation';
import { Article } from '@/types/article';

export default function FollowingFeedList({ articles }: { articles: any[] }) {
    const router = useRouter();

    return (
        <ArticleList
            articles={articles as Article[]}
            onArticleClick={(article) => router.push(`/article/${article.id}`)}
        />
    );
}
