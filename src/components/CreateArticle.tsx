'use client';

import { useState } from 'react';
import { TextAlignment } from '@/types/article';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PenSquare, CheckCircle2, AlignLeft, AlignCenter, AlignRight, AlignJustify, LogIn } from 'lucide-react';
import RichTextEditor from './RichTextEditor';
import AuthModal from './AuthModal';
import ImageUpload from './ImageUpload';
import { uploadArticleImage } from '@/lib/storage';
import TagInput from './TagInput';

interface CreateArticleProps {
  onCreateArticle: (title: string, body: string, section: string, tags: string[], published: boolean, imageUrl?: string, textAlignment?: TextAlignment) => void;
}

export default function CreateArticle({ onCreateArticle }: CreateArticleProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [section, setSection] = useState('politics');
  const [imageUrl, setImageUrl] = useState('');
  const [uploadedImagePath, setUploadedImagePath] = useState('');
  const [textAlignment, setTextAlignment] = useState<TextAlignment>('left');
  const [tags, setTags] = useState<string[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errors, setErrors] = useState<{ title?: string; body?: string }>({});
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const validate = () => {
    const newErrors: { title?: string; body?: string } = {};

    if (!title.trim()) {
      newErrors.title = 'Title is required';
    } else if (title.trim().length < 10) {
      newErrors.title = 'Title must be at least 10 characters';
    }

    if (!body.trim()) {
      newErrors.body = 'Article body is required';
    } else if (body.trim().length < 50) {
      newErrors.body = 'Article body must be at least 50 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent, published: boolean = true) => {
    e.preventDefault();

    if (!user) {
      setAuthModalOpen(true);
      return;
    }

    if (!validate()) return;

    onCreateArticle(title, body, section, tags, published, imageUrl || undefined, textAlignment);
    setTitle('');
    setBody('');
    setSection('politics');
    setImageUrl('');
    setUploadedImagePath('');
    setTextAlignment('left');
    setTags([]);
    setErrors({});
    setShowSuccess(true);

    setTimeout(() => setShowSuccess(false), 3000);
  };

  const alignmentOptions = [
    { value: 'left', icon: AlignLeft, label: 'Left' },
    { value: 'center', icon: AlignCenter, label: 'Center' },
    { value: 'right', icon: AlignRight, label: 'Right' },
    { value: 'justify', icon: AlignJustify, label: 'Justify' },
  ];

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-3xl">
              <PenSquare className="h-8 w-8" />
              Create New Article
            </CardTitle>
            <CardDescription>
              Sign in to share your political insights and analysis
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center py-12">
            <LogIn className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-6 text-center">
              You need to be signed in to create articles.
            </p>
            <Button onClick={() => setAuthModalOpen(true)} size="lg">
              <LogIn className="h-4 w-4 mr-2" />
              Sign In to Create
            </Button>
          </CardContent>
        </Card>
        <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-3xl">
            <PenSquare className="h-8 w-8" />
            Create New Article
          </CardTitle>
          <CardDescription>
            Share your political insights and analysis with our readers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="section">Section</Label>
                <Select value={section} onValueChange={setSection}>
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
                        variant={textAlignment === option.value ? 'default' : 'outline'}
                        size="icon"
                        onClick={() => setTextAlignment(option.value as TextAlignment)}
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
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
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
              currentImageUrl={imageUrl}
              onUpload={async (file) => {
                if (!user) return null;
                const result = await uploadArticleImage(file, user.id);
                if (result) {
                  setImageUrl(result.url);
                  setUploadedImagePath(result.path);
                }
                return result;
              }}
              onRemove={() => {
                setImageUrl('');
                setUploadedImagePath('');
              }}
            />


            <div className="space-y-2">
              <Label htmlFor="tags">Tags (optional)</Label>
              <TagInput
                value={tags}
                onChange={setTags}
                placeholder="Add tags to help readers find your article..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="body">Article Body</Label>
              <RichTextEditor
                value={body}
                onChange={(value) => {
                  setBody(value);
                  if (errors.body) setErrors({ ...errors, body: undefined });
                }}
                placeholder="Write your article content here... Use *italic*, **bold**, and &quot;quotes&quot; for formatting."
                rows={12}
                error={!!errors.body}
                textAlign={textAlignment}
              />
              {errors.body && (
                <p className="text-sm text-destructive">{errors.body}</p>
              )}
              <p className="text-sm text-muted-foreground">
                {body.length} characters
              </p>
            </div>


            <div className="flex items-center gap-4">
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={(e) => handleSubmit(e, false)}
              >
                Save as Draft
              </Button>
              <Button
                type="submit"
                size="lg"
                onClick={(e) => handleSubmit(e, true)}
              >
                Publish Article
              </Button>
              {showSuccess && (
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-medium">Article saved successfully!</span>
                </div>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
    </div>
  );
}
