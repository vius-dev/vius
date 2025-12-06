'use client';

import { useState } from 'react';
import { TextAlignment } from '@/types/article';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  Image as ImageIcon,
  Hash,
  AlignLeft,
  Tags,
  CheckCircle2,
  LogIn,
  PenSquare,
  Globe,
  ChevronDown
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import RichTextEditor from './RichTextEditor';
import AuthModal from './AuthModal';
import { uploadArticleImage } from '@/lib/storage';
import TagInput from './TagInput';
import { toast } from 'sonner';

interface CreateArticleProps {
  onCreateArticle: (title: string, body: string, section: string, tags: string[], published: boolean, imageUrl?: string, textAlignment?: TextAlignment) => void;
}

export default function CreateArticle({ onCreateArticle }: CreateArticleProps) {
  const { user, profile } = useAuth();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [section, setSection] = useState('politics');
  const [imageUrl, setImageUrl] = useState('');
  const [textAlignment, setTextAlignment] = useState<TextAlignment>('left');
  const [tags, setTags] = useState<string[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Tools state
  const [showTagInput, setShowTagInput] = useState(false);

  const validate = () => {
    if (!title.trim()) {
      toast.error('Please enter a title');
      return false;
    }
    if (title.trim().length < 5) {
      toast.error('Title is too short');
      return false;
    }
    if (!body.trim()) {
      toast.error('Please write some content');
      return false;
    }
    return true;
  };

  const handleSubmit = async (published: boolean = true) => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }

    if (!validate()) return;

    setLoading(true);
    try {
      await onCreateArticle(title, body, section, tags, published, imageUrl || undefined, textAlignment);

      // Reset form
      setTitle('');
      setBody('');
      setSection('politics');
      setImageUrl('');
      setTags([]);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error(error);
      toast.error('Failed to post');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !e.target.files?.[0]) return;

    const file = e.target.files[0];
    const toastId = toast.loading('Uploading image...');

    try {
      const result = await uploadArticleImage(file, user.id);
      if (result) {
        setImageUrl(result.url);
        toast.success('Image attached', { id: toastId });
      } else {
        toast.error('Upload failed', { id: toastId });
      }
    } catch (error) {
      toast.error('Error uploading image', { id: toastId });
    }
  };

  if (!user) {
    return (
      <div className="w-full max-w-2xl mx-auto p-4 border rounded-xl bg-card shadow-sm text-center py-12">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <PenSquare className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-bold">Sign in to post</h3>
          <p className="text-muted-foreground max-w-xs mx-auto">
            Join the conversation and share your perspective with the world.
          </p>
          <Button onClick={() => setAuthModalOpen(true)}>
            <LogIn className="h-4 w-4 mr-2" />
            Sign In
          </Button>
        </div>
        <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
      </div>
    );
  }

  // Get User Initials
  const initials = profile?.display_name
    ? profile.display_name.substring(0, 2).toUpperCase()
    : user.email?.substring(0, 2).toUpperCase() || 'U';

  return (
    <div className="w-full max-w-2xl mx-auto bg-background border rounded-xl shadow-sm overflow-hidden pb-4">
      <div className="flex p-4 gap-4">
        <div className="shrink-0">
          <Avatar className="h-10 w-10">
            <AvatarImage src={profile?.avatar_url || undefined} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </div>

        <div className="flex-1 min-w-0 space-y-4">
          {/* Inputs */}
          <div className="space-y-2">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What's happening? (Title)"
              className="text-xl font-bold border-none shadow-none px-0 focus-visible:ring-0 h-auto placeholder:text-muted-foreground/50"
            />

            <div className="min-h-[150px]">
              <RichTextEditor
                value={body}
                onChange={setBody}
                placeholder="Share your perspective..."
                className="border-none shadow-none min-h-[150px] p-0 focus-visible:ring-0 [&_.ProseMirror]:px-0"
              />
            </div>

            {/* Media Preview */}
            {imageUrl && (
              <div className="relative mt-2 rounded-xl overflow-hidden border">
                <img src={imageUrl} alt="Preview" className="max-h-[300px] w-full object-cover" />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-8 w-8 rounded-full"
                  onClick={() => setImageUrl('')}
                >
                  <span className="sr-only">Remove</span>
                  ×
                </Button>
              </div>
            )}

            {/* Tags Preview */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {tags.map(tag => (
                  <div key={tag} className="bg-primary/10 text-primary px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                    #{tag}
                    <button
                      onClick={() => setTags(tags.filter(t => t !== tag))}
                      className="hover:text-primary/70"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Toolbar */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-1 text-primary">
              {/* Image Upload */}
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  onChange={handleImageUpload}
                  title="Add Image"
                />
                <Button variant="ghost" size="icon" className="h-9 w-9 text-primary hover:text-primary hover:bg-primary/10 rounded-full">
                  <ImageIcon className="h-5 w-5" />
                </Button>
              </div>

              {/* Tags Popover */}
              <Popover open={showTagInput} onOpenChange={setShowTagInput}>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9 text-primary hover:text-primary hover:bg-primary/10 rounded-full">
                    <Hash className="h-5 w-5" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-3" align="start">
                  <div className="space-y-2">
                    <h4 className="font-medium leading-none">Add Tags</h4>
                    <p className="text-xs text-muted-foreground">Press enter to add a tag</p>
                    <TagInput
                      value={tags}
                      onChange={setTags}
                      placeholder="politics, news, etc."
                    />
                  </div>
                </PopoverContent>
              </Popover>

              {/* Section Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-9 gap-1 text-primary hover:text-primary hover:bg-primary/10 rounded-full px-3">
                    <Globe className="h-4 w-4" />
                    <span className="text-sm font-medium capitalize">{section}</span>
                    <ChevronDown className="h-3 w-3 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem onClick={() => setSection('politics')}>Politics</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSection('elections')}>Elections</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSection('analysis')}>Analysis</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="flex items-center gap-3">
              {/* Character Count could go here */}
              <div className="py-2 border-l pl-3"></div>

              <Button
                variant="ghost"
                className="rounded-full text-muted-foreground hover:text-foreground"
                onClick={() => handleSubmit(false)}
                disabled={loading || !title || !body}
              >
                Draft
              </Button>

              <Button
                className="rounded-full px-6 font-bold"
                onClick={() => handleSubmit(true)}
                disabled={loading || !title || !body}
              >
                {loading ? 'Posting...' : 'Post'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {showSuccess && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-green-600 text-white px-6 py-2 rounded-full shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="h-4 w-4" />
          Posted successfully!
        </div>
      )}
    </div>
  );
}
