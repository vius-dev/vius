'use client';

import { useState, useEffect } from 'react';
import { Bookmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface BookmarkButtonProps {
  articleId: string;
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showLabel?: boolean;
  className?: string;
}

export default function BookmarkButton({
  articleId,
  variant = 'ghost',
  size = 'icon',
  showLabel = false,
  className
}: BookmarkButtonProps) {
  const { user } = useAuth();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  // Check if article is bookmarked on mount
  useEffect(() => {
    if (!user) {
      setChecking(false);
      return;
    }

    checkBookmarkStatus();
  }, [user, articleId]);

  const checkBookmarkStatus = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('bookmarks')
        .select('id')
        .eq('user_id', user.id)
        .eq('article_id', articleId)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 is "not found" error, which is expected
        console.error('Error checking bookmark:', error);
      }

      setIsBookmarked(!!data);
    } catch (error) {
      console.error('Error checking bookmark:', error);
    } finally {
      setChecking(false);
    }
  };

  const handleToggleBookmark = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.error('Please sign in to bookmark articles');
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.rpc('toggle_bookmark', {
        p_user_id: user.id,
        p_article_id: articleId
      });

      if (error) throw error;

      // data returns true if bookmarked, false if unbookmarked
      setIsBookmarked(data);
      
      toast.success(data ? 'Article bookmarked' : 'Bookmark removed');
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      toast.error('Failed to update bookmark');
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <Button
        variant={variant}
        size={size}
        disabled
        className={className}
      >
        <Bookmark className="h-4 w-4" />
        {showLabel && <span className="ml-2">Bookmark</span>}
      </Button>
    );
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleToggleBookmark}
      disabled={loading}
      className={cn(
        isBookmarked && 'text-primary',
        className
      )}
      title={isBookmarked ? 'Remove bookmark' : 'Bookmark article'}
    >
      <Bookmark 
        className={cn(
          'h-4 w-4 transition-all',
          isBookmarked && 'fill-current'
        )} 
      />
      {showLabel && (
        <span className="ml-2">
          {isBookmarked ? 'Bookmarked' : 'Bookmark'}
        </span>
      )}
    </Button>
  );
}
