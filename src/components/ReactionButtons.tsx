'use client';

import { useState, useOptimistic, startTransition } from 'react';
import { Button } from '@/components/ui/button';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { Article } from '@/types/article';
import { toggleArticleReaction } from '@/app/article/actions';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

interface ReactionButtonsProps {
    article: Article;
}

export default function ReactionButtons({ article }: ReactionButtonsProps) {
    const [loading, setLoading] = useState(false);

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

    const { user } = useAuth();

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
        <div className="flex items-center gap-2">
            <Button
                variant="ghost"
                size="sm"
                onClick={() => handleReaction('like')}
                disabled={loading}
                className={cn(
                    "gap-2 hover:text-green-600 hover:bg-green-50",
                    optimisticState.userReaction === 'like' && "text-green-600 bg-green-50"
                )}
            >
                <ThumbsUp className={cn("h-4 w-4", optimisticState.userReaction === 'like' && "fill-current")} />
                <span>{optimisticState.likes}</span>
            </Button>

            <Button
                variant="ghost"
                size="sm"
                onClick={() => handleReaction('dislike')}
                disabled={loading}
                className={cn(
                    "gap-2 hover:text-red-600 hover:bg-red-50",
                    optimisticState.userReaction === 'dislike' && "text-red-600 bg-red-50"
                )}
            >
                <ThumbsDown className={cn("h-4 w-4", optimisticState.userReaction === 'dislike' && "fill-current")} />
                <span>{optimisticState.dislikes}</span>
            </Button>
        </div>
    );
}
