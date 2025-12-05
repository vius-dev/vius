'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import ImageUpload from './ImageUpload';
import { uploadAvatar } from '@/lib/storage';

interface EditProfileModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    profile: {
        id: string;
        display_name?: string;
        bio?: string;
        location?: string;
        website?: string;
        twitter_handle?: string;
        avatar_url?: string;
    };
}

export default function EditProfileModal({ open, onOpenChange, profile }: EditProfileModalProps) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        display_name: profile.display_name || '',
        bio: profile.bio || '',
        location: profile.location || '',
        website: profile.website || '',
        twitter_handle: profile.twitter_handle || '',
        avatar_url: profile.avatar_url || '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setLoading(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    display_name: formData.display_name,
                    bio: formData.bio,
                    location: formData.location,
                    website: formData.website,
                    twitter_handle: formData.twitter_handle,
                    avatar_url: formData.avatar_url,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', user.id);

            if (error) throw error;

            toast.success('Profile updated!', {
                description: 'Your profile has been successfully updated.',
            });
            onOpenChange(false);

            // Refresh the page to show updated data
            window.location.reload();
        } catch (error) {
            console.error('Error updating profile:', error);
            toast.error('Failed to update profile', {
                description: 'Please try again later.',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Edit Profile</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <ImageUpload
                        label="Profile Picture"
                        currentImageUrl={formData.avatar_url}
                        onUpload={async (file) => {
                            if (!user) return null;
                            const result = await uploadAvatar(file, user.id);
                            if (result) {
                                setFormData({ ...formData, avatar_url: result.url });
                            }
                            return result;
                        }}
                        onRemove={() => {
                            setFormData({ ...formData, avatar_url: '' });
                        }}
                    />

                    <div className="space-y-2">
                        <Label htmlFor="display_name">Display Name</Label>
                        <Input
                            id="display_name"
                            value={formData.display_name}
                            onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                            placeholder="Your name"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="bio">Bio</Label>
                        <Textarea
                            id="bio"
                            value={formData.bio}
                            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                            placeholder="Tell us about yourself..."
                            rows={4}
                            className="resize-none"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="location">Location</Label>
                        <Input
                            id="location"
                            value={formData.location}
                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                            placeholder="City, Country"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="website">Website</Label>
                        <Input
                            id="website"
                            type="url"
                            value={formData.website}
                            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                            placeholder="https://yourwebsite.com"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="twitter_handle">Twitter Handle</Label>
                        <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">@</span>
                            <Input
                                id="twitter_handle"
                                value={formData.twitter_handle}
                                onChange={(e) => setFormData({ ...formData, twitter_handle: e.target.value.replace('@', '') })}
                                placeholder="username"
                            />
                        </div>
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
