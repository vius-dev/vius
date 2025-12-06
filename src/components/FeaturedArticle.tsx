'use client';

import { useState, useOptimistic, startTransition } from 'react';
import { Article } from '@/types/article';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, MessageSquare, TrendingUp, BookOpen, Eye, HeartIcon, HeartCrackIcon, Pencil, Trash2, ThumbsUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import BookmarkButton from './BookmarkButton';
import { useAuth } from '@/context/AuthContext';
import { toggleArticleReaction } from '@/app/article/actions';
import { toast } from 'sonner';
import EditArticleModal from './EditArticleModal';
import DeleteArticleDialog from './DeleteArticleDialog';

interface FeaturedArticleProps {
  article: Article;
  onClick: () => void;
}

export default function FeaturedArticle({ article, onClick }: FeaturedArticleProps) {
  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getReadingTime = (text: string) => {
    if (article.reading_time) return `${article.reading_time} min`;
    const wordsPerMinute = 200;
    const words = text.split(/\s+/).length;
    const minutes = Math.ceil(words / wordsPerMinute);
    return `${minutes}m`;
  };

  const { user } = useAuth();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const isAuthor = user?.id === article.user_id;

  const [optimisticState, addOptimisticReaction] = useOptimistic(
    {
      likes: article.likes_count || 0,
      dislikes: article.dislikes_count || 0,
      userReaction: article.user_reaction,
    },
    (state, newReaction: 'like' | 'dislike') => {
      const isSameReaction = state.userReaction === newReaction;

      let newLikes = state.likes;
      let newDislikes = state.dislikes;

      if (isSameReaction) {
        // Removing reaction
        if (newReaction === 'like') newLikes--;
        else newDislikes--;
        return {
          likes: newLikes,
          dislikes: newDislikes,
          userReaction: null,
        };
      } else {
        // Changing or adding reaction
        if (state.userReaction === 'like') newLikes--;
        if (state.userReaction === 'dislike') newDislikes--;

        if (newReaction === 'like') newLikes++;
        else newDislikes++;

        return {
          likes: newLikes,
          dislikes: newDislikes,
          userReaction: newReaction,
        };
      }
    }
  );

  const handleReaction = async (type: 'like' | 'dislike') => {
    if (!user) {
      toast.error('Please log in to react to articles');
      return;
    }

    try {
      setLoading(true);
      startTransition(() => {
        addOptimisticReaction(type);
      });
      await toggleArticleReaction(article.id, type);
    } catch (error) {
      console.error('Error toggling reaction:', error);
      toast.error('Failed to update reaction. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div
        className="relative w-full h-[400px] md:h-[500px] rounded-2xl overflow-hidden cursor-pointer group"
        onClick={onClick}
      >
        {article.image_url ? (
          <img
            src={article.image_url}
            alt={article.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary to-secondary" />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

        <div className="absolute top-4 left-4 flex items-center gap-2">
          <Badge className="bg-secondary text-secondary-foreground">
            <TrendingUp className="h-3 w-3 mr-1" />
            Featured
          </Badge>
          <Badge variant="secondary" className="bg-background/90 backdrop-blur-sm">
            {article.section}
          </Badge>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
          <h2 className="text-2xl md:text-4xl font-bold text-white leading-tight mb-4 drop-shadow-lg group-hover:text-primary-foreground transition-colors">
            {article.title}
          </h2>
          <p className="text-white/80 text-sm md:text-base line-clamp-2 mb-6 max-w-3xl">
            {article.body.substring(0, 200)}...
          </p>

          <div className="flex items-center justify-between text-xs sm:text-sm text-white/90 w-full">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="hidden sm:inline">{formatDate(article.created_at)}</span>
              <span className="sm:hidden">{formatDate(article.created_at).replace(' ago', '')}</span>
            </div>
            <div className="flex items-center gap-1">
              <BookOpen className="h-4 w-4 sm:h-5 sm:w-5" />
              <span>{getReadingTime(article.body)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
              <span>{article.views_count || 0}</span>
            </div>
            <div className="flex items-center gap-1 hover:text-primary-foreground transition-colors cursor-pointer">
              <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5" />
              <span>{article.comments?.length || 0}</span>
            </div>
            <div
              className={cn(
                "flex items-center gap-1 hover:text-green-400 transition-colors cursor-pointer",
                optimisticState.userReaction === 'like' && "text-green-400"
              )}
              onClick={(e) => {
                e.stopPropagation();
                handleReaction('like');
              }}
            >
              <HeartIcon className={cn("h-4 w-4 sm:h-5 sm:w-5", optimisticState.userReaction === 'like' && "fill-current")} />
              <span>{optimisticState.likes}</span>
            </div>
            <div
              className={cn(
                "flex items-center gap-1 hover:text-red-400 transition-colors cursor-pointer",
                optimisticState.userReaction === 'dislike' && "text-red-400"
              )}
              onClick={(e) => {
                e.stopPropagation();
                handleReaction('dislike');
              }}
            >
              <HeartCrackIcon className={cn("h-4 w-4 sm:h-5 sm:w-5", optimisticState.userReaction === 'dislike')} />
              <span>{optimisticState.dislikes}</span>
            </div>
            <div onClick={(e) => e.stopPropagation()}>
              <BookmarkButton articleId={article.id} variant="ghost" size="sm" className="h-8 w-8 sm:h-9 sm:w-9 p-0 text-white hover:text-white/80 hover:bg-white/10" />
            </div>
            {isAuthor && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 sm:h-9 sm:w-9 hover:text-primary-foreground hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    setIsEditOpen(true);
                  }}
                >
                  <Pencil className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 sm:h-9 sm:w-9 hover:text-destructive hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    setIsDeleteOpen(true);
                  }}
                >
                  <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <EditArticleModal
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        article={article}
      />

      <DeleteArticleDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        article={article}
      />
    </>
  );
}
