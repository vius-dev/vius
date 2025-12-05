'use client';

import { useState, useEffect } from 'react';
import { Article, TextAlignment } from '@/types/article';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, AlignLeft, AlignCenter, AlignRight, AlignJustify } from 'lucide-react';
import { toast } from 'sonner';
import RichTextEditor from './RichTextEditor';
import ImageUpload from './ImageUpload';
import { uploadArticleImage } from '@/lib/storage';

interface EditArticleModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    article: Article;
    onSuccess?: () => void;
}

export default function EditArticleModal({ open, onOpenChange, article, onSuccess }: EditArticleModalProps) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: article.title,
        body: article.body,
        section: article.section,
        image_url: article.image_url || '',
        text_alignment: article.text_alignment,
    });
    const [errors, setErrors] = useState<{ title?: string; body?: string }>({});

    // Reset form when article changes
    useEffect(() => {
        setFormData({
            title: article.title,
            body: article.body,
            section: article.section,
            image_url: article.image_url || '',
            text_alignment: article.text_alignment,
        });
        setErrors({});
    }, [article]);

    const validate = () => {
        const newErrors: { title?: string; body?: string } = {};

        if (!formData.title.trim()) {
            newErrors.title = 'Title is required';
        } else if (formData.title.trim().length < 10) {
            newErrors.title = 'Title must be at least 10 characters';
        }

        if (!formData.body.trim()) {
            newErrors.body = 'Article body is required';
        } else if (formData.body.trim().length < 50) {
            newErrors.body = 'Article body must be at least 50 characters';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user || user.id !== article.user_id) {
            toast.error('You are not authorized to edit this article');
            return;
        }

        if (!validate()) return;

        setLoading(true);
        try {
            const { calculateReadingTime } = await import('@/lib/reading-time');
            const readingTime = calculateReadingTime(formData.body);

            const { error } = await supabase
                .from('articles')
                .update({
                    title: formData.title,
                    body: formData.body,
                    section: formData.section,
                    image_url: formData.image_url || null,
                    text_alignment: formData.text_alignment,
                    reading_time: readingTime,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', article.id);

            if (error) throw error;

            toast.success('Article updated!', {
                description: 'Your article has been successfully updated.',
            });
            onOpenChange(false);

            if (onSuccess) {
                onSuccess();
            } else {
                // Refresh the page to show updated data
                window.location.reload();
            }
        } catch (error) {
            console.error('Error updating article:', error);
            toast.error('Failed to update article', {
                description: 'Please try again later.',
            });
        } finally {
            setLoading(false);
        }
    };

    const alignmentOptions = [
        { value: 'left', icon: AlignLeft, label: 'Left' },
        { value: 'center', icon: AlignCenter, label: 'Center' },
        { value: 'right', icon: AlignRight, label: 'Right' },
        { value: 'justify', icon: AlignJustify, label: 'Justify' },
    ];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Edit Article</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="section">Section</Label>
                            <Select
                                value={formData.section}
                                onValueChange={(value) => setFormData({ ...formData, section: value })}
                            >
                                <SelectTrigger id="section">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="politics">Politics</SelectItem>
                                    <SelectItem value="elections">Elections</SelectItem>
                                    <SelectItem value="analysis">Analysis</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Text Alignment</Label>
                            <div className="flex gap-1">
                                {alignmentOptions.map((option) => {
                                    const Icon = option.icon;
                                    return (
                                        <Button
                                            key={option.value}
                                            type="button"
                                            variant={formData.text_alignment === option.value ? 'default' : 'outline'}
                                            size="icon"
                                            onClick={() => setFormData({ ...formData, text_alignment: option.value as TextAlignment })}
                                            title={option.label}
                                        >
                                            <Icon className="h-4 w-4" />
                                        </Button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="title">Article Title</Label>
                        <Input
                            id="title"
                            placeholder="Enter a compelling headline..."
                            value={formData.title}
                            onChange={(e) => {
                                setFormData({ ...formData, title: e.target.value });
                                if (errors.title) setErrors({ ...errors, title: undefined });
                            }}
                            className={errors.title ? 'border-destructive' : ''}
                        />
                        {errors.title && (
                            <p className="text-sm text-destructive">{errors.title}</p>
                        )}
                    </div>

                    <ImageUpload
                        label="Featured Image (optional)"
                        currentImageUrl={formData.image_url}
                        onUpload={async (file) => {
                            if (!user) return null;
                            const result = await uploadArticleImage(file, user.id);
                            if (result) {
                                setFormData({ ...formData, image_url: result.url });
                            }
                            return result;
                        }}
                        onRemove={() => {
                            setFormData({ ...formData, image_url: '' });
                        }}
                    />

                    <div className="space-y-2">
                        <Label htmlFor="body">Article Body</Label>
                        <RichTextEditor
                            value={formData.body}
                            onChange={(value) => {
                                setFormData({ ...formData, body: value });
                                if (errors.body) setErrors({ ...errors, body: undefined });
                            }}
                            placeholder="Write your article content here..."
                            rows={12}
                            error={!!errors.body}
                            textAlign={formData.text_alignment}
                        />
                        {errors.body && (
                            <p className="text-sm text-destructive">{errors.body}</p>
                        )}
                        <p className="text-sm text-muted-foreground">
                            {formData.body.length} characters
                        </p>
                    </div>

                    <div className="flex gap-2 justify-end pt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                            Save Changes
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
