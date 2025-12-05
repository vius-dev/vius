'use client';

import { Article } from '@/types/article';
import ArticleCard from './ArticleCard';

interface ArticleListProps {
  articles: Article[];
  onArticleClick: (article: Article) => void;
}

export default function ArticleList({ articles, onArticleClick }: ArticleListProps) {
  if (articles.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-xl text-muted-foreground">
          No articles found in this section yet.
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Be the first to create one!
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 max-w-2xl mx-auto w-full">
      {articles.map((article) => (
        <ArticleCard
          key={article.id}
          article={article}
          onClick={() => onArticleClick(article)}
        />
      ))}
    </div>
  );
}
