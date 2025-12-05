'use client';

import { useState, useEffect } from 'react';
import { Comment } from '@/types/article';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquare, User, LogIn, Loader2, Heart, HeartCrack, Reply, ChevronDown, ChevronUp } from 'lucide-react';
import AuthModal from './AuthModal';
import { toast } from 'sonner';
import { CommentListSkeleton } from './CommentSkeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CommentSectionProps {
  articleId: string;
  initialCommentCount?: number;
}

const COMMENTS_PER_PAGE = 5;
const REPLIES_PER_PAGE = 3;

function CommentItem({
  comment,
  articleId,
  onReply,
  onReaction,
  depth = 0
}: {
  comment: Comment;
  articleId: string;
  onReply: (parentId: string, text: string, author: string) => Promise<void>;
  onReaction: (commentId: string, reactionType: 'like' | 'dislike') => Promise<void>;
  depth?: number;
}) {
  const { user, profile } = useAuth();
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [replies, setReplies] = useState<Comment[]>([]);
  const [showReplies, setShowReplies] = useState(false);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [hasMoreReplies, setHasMoreReplies] = useState(false);
  const [repliesPage, setRepliesPage] = useState(0);
  const [replyCount, setReplyCount] = useState(0);
  const [localLikes, setLocalLikes] = useState(comment.likes_count || 0);
  const [localDislikes, setLocalDislikes] = useState(comment.dislikes_count || 0);
  const [userReaction, setUserReaction] = useState<'like' | 'dislike' | null>(comment.user_reaction || null);
  const [reactionLoading, setReactionLoading] = useState(false);

  useEffect(() => {
    loadReplyCount();
  }, [comment.id]);

  const loadReplyCount = async () => {
    const { count } = await supabase
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .eq('parent_id', comment.id);
    setReplyCount(count || 0);
    setHasMoreReplies((count || 0) > 0);
  };

  const loadReplies = async (page: number = 0) => {
    setLoadingReplies(true);
    try {
      const from = page * REPLIES_PER_PAGE;
      const to = from + REPLIES_PER_PAGE - 1;

      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('parent_id', comment.id)
        .order('created_at', { ascending: true })
        .range(from, to);

      if (error) throw error;

      if (user) {
        const commentIds = data.map(c => c.id);
        if (commentIds.length > 0) {
          const { data: reactions } = await supabase
            .from('comment_reactions')
            .select('*')
            .eq('user_id', user.id)
            .in('comment_id', commentIds);

          data.forEach(c => {
            const reaction = reactions?.find(r => r.comment_id === c.id);
            (c as Comment).user_reaction = reaction?.reaction_type as 'like' | 'dislike' | null || null;
          });
        }
      }

      if (page === 0) {
        setReplies(data as Comment[] || []);
      } else {
        setReplies(prev => [...prev, ...(data as Comment[] || [])]);
      }
      setHasMoreReplies((data?.length || 0) === REPLIES_PER_PAGE);
      setRepliesPage(page);
    } catch (error) {
      console.error('Error loading replies:', error);
    } finally {
      setLoadingReplies(false);
    }
  };

  const handleToggleReplies = () => {
    if (!showReplies && replies.length === 0) {
      loadReplies(0);
    }
    setShowReplies(!showReplies);
  };

  const handleLoadMoreReplies = () => {
    loadReplies(repliesPage + 1);
  };

  const handleReplySubmit = async () => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    if (!replyText.trim()) return;

    setIsSubmitting(true);
    const authorName = profile?.display_name || user.email?.split('@')[0] || 'Anonymous';
    await onReply(comment.id, replyText, authorName);
    setReplyText('');
    setShowReplyForm(false);
    setIsSubmitting(false);

    await loadReplies(0);
    setShowReplies(true);
    setReplyCount(prev => prev + 1);
  };

  const handleReaction = async (type: 'like' | 'dislike') => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }

    setReactionLoading(true);

    if (userReaction === type) {
      if (type === 'like') setLocalLikes(prev => prev - 1);
      else setLocalDislikes(prev => prev - 1);
      setUserReaction(null);
    } else {
      if (userReaction === 'like') setLocalLikes(prev => prev - 1);
      if (userReaction === 'dislike') setLocalDislikes(prev => prev - 1);
      if (type === 'like') setLocalLikes(prev => prev + 1);
      else setLocalDislikes(prev => prev + 1);
      setUserReaction(type);
    }

    await onReaction(comment.id, type);
    setReactionLoading(false);
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  const maxDepth = 2;

  return (
    <div className={`space-y-2 p-4 rounded-lg bg-muted/50 ${depth > 0 ? 'ml-4 md:ml-8 border-l-2 border-primary/20' : ''}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="font-semibold text-sm">{comment.author}</span>
        </div>
        <span className="text-xs text-muted-foreground">
          {formatDate(comment.created_at)}
        </span>
      </div>
      <p className="text-sm leading-relaxed">{comment.text}</p>

      <div className="flex items-center gap-4 pt-2">
        <Button
          variant="ghost"
          size="sm"
          className={`h-8 px-2 ${userReaction === 'like' ? 'text-red-500' : ''}`}
          onClick={() => handleReaction('like')}
          disabled={reactionLoading}
        >
          <Heart className={`h-4 w-4 mr-1 ${userReaction === 'like' ? 'fill-current' : ''}`} />
          <span className="text-xs">{localLikes}</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className={`h-8 px-2 ${userReaction === 'dislike' ? 'text-gray-500' : ''}`}
          onClick={() => handleReaction('dislike')}
          disabled={reactionLoading}
        >
          <HeartCrack className={`h-4 w-4 mr-1 ${userReaction === 'dislike' ? 'fill-current' : ''}`} />
          <span className="text-xs">{localDislikes}</span>
        </Button>
        {depth < maxDepth && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2"
            onClick={() => setShowReplyForm(!showReplyForm)}
          >
            <Reply className="h-4 w-4 mr-1" />
            <span className="text-xs">Reply</span>
          </Button>
        )}
        {replyCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2"
            onClick={handleToggleReplies}
          >
            {showReplies ? <ChevronUp className="h-4 w-4 mr-1" /> : <ChevronDown className="h-4 w-4 mr-1" />}
            <span className="text-xs">{replyCount} {replyCount === 1 ? 'reply' : 'replies'}</span>
          </Button>
        )}
      </div>

      {showReplyForm && (
        <div className="mt-3 space-y-2">
          <Textarea
            placeholder="Write a reply..."
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            rows={2}
            className="resize-none text-sm"
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleReplySubmit}
              disabled={!replyText.trim() || isSubmitting}
            >
              {isSubmitting && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
              Reply
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => { setShowReplyForm(false); setReplyText(''); }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {showReplies && (
        <div className="mt-3 space-y-3">
          {loadingReplies && replies.length === 0 ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          ) : (
            <>
              {replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  articleId={articleId}
                  onReply={onReply}
                  onReaction={onReaction}
                  depth={depth + 1}
                />
              ))}
              {hasMoreReplies && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLoadMoreReplies}
                  disabled={loadingReplies}
                  className="w-full"
                >
                  {loadingReplies ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Load more replies
                </Button>
              )}
            </>
          )}
        </div>
      )}

      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
    </div>
  );
}

export default function CommentSection({ articleId, initialCommentCount = 0 }: CommentSectionProps) {
  const { user, profile } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(initialCommentCount);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'most-liked'>('newest');

  useEffect(() => {
    loadComments(0);
    loadTotalCount();
  }, [articleId, sortBy]);

  const loadTotalCount = async () => {
    const { count } = await supabase
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .eq('article_id', articleId)
      .is('parent_id', null);
    setTotalCount(count || 0);
  };

  const loadComments = async (pageNum: number) => {
    setLoading(true);
    try {
      const from = pageNum * COMMENTS_PER_PAGE;
      const to = from + COMMENTS_PER_PAGE - 1;

      let query = supabase
        .from('comments')
        .select('*')
        .eq('article_id', articleId)
        .is('parent_id', null);

      // Apply sorting
      if (sortBy === 'newest') {
        query = query.order('created_at', { ascending: false });
      } else if (sortBy === 'oldest') {
        query = query.order('created_at', { ascending: true });
      } else if (sortBy === 'most-liked') {
        query = query.order('likes_count', { ascending: false });
      }

      const { data, error } = await query.range(from, to);

      if (error) throw error;

      if (user && data && data.length > 0) {
        const commentIds = data.map(c => c.id);
        const { data: reactions } = await supabase
          .from('comment_reactions')
          .select('*')
          .eq('user_id', user.id)
          .in('comment_id', commentIds);

        data.forEach(c => {
          const reaction = reactions?.find(r => r.comment_id === c.id);
          (c as Comment).user_reaction = reaction?.reaction_type as 'like' | 'dislike' | null || null;
        });
      }

      if (pageNum === 0) {
        setComments(data as Comment[] || []);
      } else {
        setComments(prev => [...prev, ...(data as Comment[] || [])]);
      }
      setHasMore((data?.length || 0) === COMMENTS_PER_PAGE);
      setPage(pageNum);
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = () => {
    loadComments(page + 1);
  };

  const handleSubmit = async () => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }

    if (!commentText.trim()) return;

    setIsSubmitting(true);
    const authorName = profile?.display_name || user.email?.split('@')[0] || 'Anonymous';

    try {
      const { data, error } = await supabase
        .from('comments')
        .insert([{
          article_id: articleId,
          text: commentText,
          author: authorName,
          user_id: user.id,
          parent_id: null,
          likes_count: 0,
          dislikes_count: 0
        }])
        .select()
        .single();

      if (error) throw error;

      setComments(prev => [{ ...data, user_reaction: null } as Comment, ...prev]);
      setCommentText('');
      setTotalCount(prev => prev + 1);
      toast.success('Comment posted!', {
        description: 'Your comment has been added to the discussion.',
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to post comment', {
        description: 'Please try again later.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReply = async (parentId: string, text: string, author: string) => {
    if (!user) return;

    try {
      await supabase
        .from('comments')
        .insert([{
          article_id: articleId,
          text,
          author,
          user_id: user.id,
          parent_id: parentId,
          likes_count: 0,
          dislikes_count: 0
        }]);
    } catch (error) {
      console.error('Error adding reply:', error);
    }
  };

  const handleReaction = async (commentId: string, reactionType: 'like' | 'dislike') => {
    if (!user) return;

    try {
      const { data: existing } = await supabase
        .from('comment_reactions')
        .select('*')
        .eq('comment_id', commentId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        if (existing.reaction_type === reactionType) {
          await supabase
            .from('comment_reactions')
            .delete()
            .eq('id', existing.id);

          const field = reactionType === 'like' ? 'likes_count' : 'dislikes_count';
          const { data: comment } = await supabase
            .from('comments')
            .select(field)
            .eq('id', commentId)
            .single();

          await supabase
            .from('comments')
            .update({ [field]: Math.max(0, ((comment as any)?.[field] || 1) - 1) })
            .eq('id', commentId);
        } else {
          await supabase
            .from('comment_reactions')
            .update({ reaction_type: reactionType })
            .eq('id', existing.id);

          const oldField = existing.reaction_type === 'like' ? 'likes_count' : 'dislikes_count';
          const newField = reactionType === 'like' ? 'likes_count' : 'dislikes_count';

          const { data: comment } = await supabase
            .from('comments')
            .select(`${oldField}, ${newField}`)
            .eq('id', commentId)
            .single();

          await supabase
            .from('comments')
            .update({
              [oldField]: Math.max(0, ((comment as any)?.[oldField] || 1) - 1),
              [newField]: ((comment as any)?.[newField] || 0) + 1
            })
            .eq('id', commentId);
        }
      } else {
        await supabase
          .from('comment_reactions')
          .insert([{
            comment_id: commentId,
            user_id: user.id,
            reaction_type: reactionType
          }]);

        const field = reactionType === 'like' ? 'likes_count' : 'dislikes_count';
        const { data: comment } = await supabase
          .from('comments')
          .select(field)
          .eq('id', commentId)
          .single();

        await supabase
          .from('comments')
          .update({ [field]: ((comment as any)?.[field] || 0) + 1 })
          .eq('id', commentId);
      }
    } catch (error) {
      console.error('Error handling reaction:', error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Comments ({totalCount})
          </CardTitle>
          <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="most-liked">Most Liked</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          {user ? (
            <>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span>Commenting as <strong>{profile?.display_name || user.email?.split('@')[0]}</strong></span>
              </div>
              <Textarea
                placeholder="Share your thoughts..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                rows={4}
                className="resize-none"
              />
              <Button
                onClick={handleSubmit}
                disabled={!commentText.trim() || isSubmitting}
              >
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Post Comment
              </Button>
            </>
          ) : (
            <div className="text-center py-6 border rounded-lg bg-muted/30">
              <LogIn className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground mb-3">Sign in to join the conversation</p>
              <Button onClick={() => setAuthModalOpen(true)}>
                <LogIn className="h-4 w-4 mr-2" />
                Sign In to Comment
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-4 pt-4 border-t">
          {loading && comments.length === 0 ? (
            <CommentListSkeleton count={3} />
          ) : comments.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No comments yet. Be the first to share your thoughts!
            </p>
          ) : (
            <>
              {comments.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  articleId={articleId}
                  onReply={handleReply}
                  onReaction={handleReaction}
                />
              ))}
              {hasMore && (
                <Button
                  variant="outline"
                  onClick={handleLoadMore}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Load More Comments
                </Button>
              )}
            </>
          )}
        </div>
      </CardContent>
      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
    </Card>
  );
}
