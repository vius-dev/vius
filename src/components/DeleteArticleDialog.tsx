'use client';

import { useState } from 'react';
import { Article } from '@/types/article';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface DeleteArticleDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    article: Article;
    onSuccess?: () => void;
}

export default function DeleteArticleDialog({ open, onOpenChange, article, onSuccess }: DeleteArticleDialogProps) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);

    const handleDelete = async () => {
        if (!user || user.id !== article.user_id) {
            toast.error('You are not authorized to delete this article');
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase
                .from('articles')
                .delete()
                .eq('id', article.id);

            if (error) throw error;

            toast.success('Article deleted', {
                description: 'Your article has been permanently deleted.',
            });
            onOpenChange(false);

            if (onSuccess) {
                onSuccess();
            } else {
                // Redirect to home page
                window.location.href = '/';
            }
        } catch (error) {
            console.error('Error deleting article:', error);
            toast.error('Failed to delete article', {
                description: 'Please try again later.',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription className="space-y-2">
                        <p>
                            This action cannot be undone. This will permanently delete your article:
                        </p>
                        <p className="font-semibold text-foreground">
                            "{article.title}"
                        </p>
                        <p>
                            All comments and associated data will also be removed.
                        </p>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(e) => {
                            e.preventDefault();
                            handleDelete();
                        }}
                        disabled={loading}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                        Delete Article
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
