'use client';

import { useState, useEffect } from 'react';
import { Article, TextAlignment } from '@/types/article';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { ArrowLeft, Clock, AlignLeft, AlignCenter, AlignRight, AlignJustify, BookOpen, Edit2, Trash2, MoreVertical, Eye } from 'lucide-react';
import ShareButton from './ShareButton';
import CommentSection from './CommentSection';
import { renderRichText } from './RichTextEditor';
import { toast } from 'sonner';
import ReadingProgress from './ReadingProgress';
import BookmarkButton from './BookmarkButton';
import EditArticleModal from './EditArticleModal';
import DeleteArticleDialog from './DeleteArticleDialog';
import ReactionButtons from './ReactionButtons';
import TagBadge from './TagBadge';
import DraftBadge from './DraftBadge';
import { publishArticle, unpublishArticle } from '@/app/drafts/actions';
import { useRouter } from 'next/navigation';
import RelatedArticles from './RelatedArticles';
import { trackArticleView } from '@/app/analytics/actions';

interface ArticleViewProps {
  article: Article;
  onBack: () => void;
  onEdit?: (article: Article) => void;
}

export default function ArticleView({ article, onBack, onEdit }: ArticleViewProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const isOwner = user && article.user_id === user.id;

  // Track article view
  useEffect(() => {
    trackArticleView(article.id);
  }, [article.id]);

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getReadingTime = (text: string) => {
    if (article.reading_time) return `${article.reading_time} min read`;
    const wordsPerMinute = 200;
    const words = text.split(/\s+/).length;
    const minutes = Math.ceil(words / wordsPerMinute);
    return `${minutes} min read`;
  };

  const getAlignmentClass = (alignment: TextAlignment) => {
    switch (alignment) {
      case 'center': return 'text-center';
      case 'right': return 'text-right';
      case 'justify': return 'text-justify';
      default: return 'text-left';
    }
  };

  const getAlignmentIcon = (alignment: TextAlignment) => {
    switch (alignment) {
      case 'center': return AlignCenter;
      case 'right': return AlignRight;
      case 'justify': return AlignJustify;
      default: return AlignLeft;
    }
  };



  const AlignIcon = getAlignmentIcon(article.text_alignment);

  return (
    <>
      <ReadingProgress />
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={onBack}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Articles
          </Button>
          <div className="flex items-center gap-2">
            {isOwner && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" title="Article Actions">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setEditModalOpen(true)}>
                    <Edit2 className="h-4 w-4 mr-2" />
                    Edit Article
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setDeleteDialogOpen(true)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Article
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            {isOwner && (
              <Button
                variant={article.published ? "outline" : "default"}
                size="sm"
                onClick={async () => {
                  setIsPublishing(true);
                  const success = article.published
                    ? await unpublishArticle(article.id)
                    : await publishArticle(article.id);

                  if (success) {
                    toast.success(article.published ? 'Article unpublished' : 'Article published!');
                    router.refresh();
                  } else {
                    toast.error('Failed to update article');
                  }
                  setIsPublishing(false);
                }}
                disabled={isPublishing}
              >
                {isPublishing ? 'Updating...' : (article.published ? 'Unpublish' : 'Publish')}
              </Button>
            )}
          </div>
        </div>

        {article.image_url && (
          <div className="relative w-full h-64 md:h-96 rounded-xl overflow-hidden">
            <img
              src={article.image_url}
              alt={article.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <div className="flex gap-2 mb-3">
                <Badge variant="secondary" className="bg-background/90 backdrop-blur-sm">
                  {article.section}
                </Badge>
                {!article.published && <DraftBadge />}
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight drop-shadow-lg">
                {article.title}
              </h1>
            </div>
          </div>
        )}

        <Card>
          {!article.image_url && (
            <CardHeader className="space-y-4">
              <div className="flex items-center flex-wrap gap-2">
                <Badge variant="secondary">{article.section}</Badge>
                {!article.published && <DraftBadge />}
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{formatDate(article.created_at)}</span>
                </div>
                <span className="text-muted-foreground">•</span>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <BookOpen className="h-4 w-4" />
                  <span>{getReadingTime(article.body)}</span>
                </div>
                <span className="text-muted-foreground">•</span>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Eye className="h-4 w-4" />
                  <span>{article.views_count || 0} views</span>
                </div>
                <span className="text-muted-foreground">•</span>
                <ReactionButtons article={article} />
                <span className="text-muted-foreground">•</span>
                <ShareButton title={article.title} variant="ghost" size="sm" />
                <BookmarkButton articleId={article.id} variant="ghost" size="sm" />
              </div>
              <CardTitle className="text-4xl font-bold leading-tight">
                {article.title}
              </CardTitle>
            </CardHeader>
          )}
          <CardContent className={article.image_url ? 'pt-6' : ''}>
            {article.image_url && (
              <div className="flex items-center flex-wrap gap-2 text-sm text-muted-foreground mb-6">
                <Clock className="h-4 w-4" />
                <span>{formatDate(article.created_at)}</span>
                <span className="mx-2">•</span>
                <BookOpen className="h-4 w-4" />
                <span>{getReadingTime(article.body)}</span>
                <span className="mx-2">•</span>
                <AlignIcon className="h-4 w-4" />
                <span className="capitalize">{article.text_alignment} aligned</span>
                <span className="mx-2">•</span>
                <ReactionButtons article={article} />
                <span className="mx-2">•</span>
                <ShareButton title={article.title} variant="ghost" size="sm" />
                <BookmarkButton articleId={article.id} variant="ghost" size="sm" />
              </div>
            )}

            {/* Tags Section */}
            {article.tags && article.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {article.tags.map((tag, index) => (
                  <TagBadge key={index} name={tag} />
                ))}
              </div>
            )}

            <div className="prose prose-lg max-w-none dark:prose-invert">
              <div className={`text-foreground leading-relaxed text-lg ${getAlignmentClass(article.text_alignment)}`}>
                {renderRichText(article.body)}
              </div>
            </div>
          </CardContent>
        </Card>

        <CommentSection
          articleId={article.id}
          initialCommentCount={article.comments?.length || 0}
        />
      </div>

      {/* Related Articles */}
      <RelatedArticles articleId={article.id} />

      {/* Edit and Delete Modals */}
      <EditArticleModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        article={article}
      />
      <DeleteArticleDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        article={article}
      />
    </>
  );
}
