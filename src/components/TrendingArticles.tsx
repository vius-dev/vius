'use client';

import { useEffect, useState } from 'react';
import { Article } from '@/types/article';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, MessageSquare, Eye, Flame } from 'lucide-react';
import { getTrendingArticles } from '@/app/trending/actions';

interface TrendingArticlesProps {
  onArticleClick: (article: Article) => void;
  showHeader?: boolean;
  limit?: number;
}

export default function TrendingArticles({ onArticleClick, showHeader = true, limit = 5 }: TrendingArticlesProps) {
  const [trendingArticles, setTrendingArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrending = async () => {
      setLoading(true);
      try {
        const articles = await getTrendingArticles(limit);
        setTrendingArticles(articles);
      } catch (error) {
        console.error('Error fetching trending articles:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrending();
  }, [limit]);

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5 text-secondary" />
            Trending Now
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  if (trendingArticles.length === 0) return null;

  const content = (
    <div className="space-y-4">
      {trendingArticles.map((article, index) => (
        <div
          key={article.id}
          className="flex gap-3 cursor-pointer group"
          onClick={() => onArticleClick(article)}
        >
          <div className="flex items-center gap-1">
            <span className="text-2xl font-bold text-muted-foreground/50 group-hover:text-primary transition-colors">
              {index + 1}
            </span>
            {index === 0 && <Flame className="h-4 w-4 text-orange-500" />}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
              {article.title}
            </h4>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs px-1.5 py-0">
                {article.section}
              </Badge>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Eye className="h-3 w-3" />
                <span>{article.views_count || 0}</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <MessageSquare className="h-3 w-3" />
                <span>{article.comments?.length || 0}</span>
              </div>
            </div>
          </div>
          {article.image_url && (
            <img
              src={article.image_url}
              alt=""
              className="w-16 h-16 rounded object-cover shrink-0"
            />
          )}
        </div>
      ))}
    </div>
  );

  if (!showHeader) {
    return content;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <TrendingUp className="h-5 w-5 text-secondary" />
          Trending Now
        </CardTitle>
      </CardHeader>
      <CardContent>
        {content}
      </CardContent>
    </Card>
  );
}
