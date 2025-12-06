import { supabase } from './supabase';

/**
 * Compress and resize image before upload
 */
async function compressImage(file: File, maxWidth: number = 1200, maxHeight: number = 800, quality: number = 0.8): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Calculate new dimensions
                if (width > height) {
                    if (width > maxWidth) {
                        height = height * (maxWidth / width);
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width = width * (maxHeight / height);
                        height = maxHeight;
                    }
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);

                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            resolve(blob);
                        } else {
                            reject(new Error('Failed to compress image'));
                        }
                    },
                    file.type,
                    quality
                );
            };
            img.onerror = () => reject(new Error('Failed to load image'));
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
    });
}

/**
 * Generate unique filename with timestamp
 */
function generateFileName(userId: string, originalName: string): string {
    const timestamp = Date.now();
    const extension = originalName.split('.').pop();
    const sanitized = originalName.replace(/[^a-zA-Z0-9]/g, '_');
    return `${userId}/${timestamp}_${sanitized}.${extension}`;
}

/**
 * Upload article image to Supabase Storage
 */
export async function uploadArticleImage(file: File, userId: string): Promise<{ url: string; path: string } | null> {
    try {
        // Compress image
        const compressedBlob = await compressImage(file);
        const compressedFile = new File([compressedBlob], file.name, { type: file.type });

        // Generate unique filename
        const filePath = generateFileName(userId, file.name);

        // Upload to Supabase Storage
        console.log('Uploading to bucket: article_images');
        const { data, error } = await supabase.storage
            .from('article_images')
            .upload(filePath, compressedFile, {
                cacheControl: '3600',
                upsert: false
            });

        if (error) throw error;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('article_images')
            .getPublicUrl(data.path);

        return {
            url: publicUrl,
            path: data.path
        };
    } catch (error) {
        console.error('Error uploading article image:', error);
        return null;
    }
}

/**
 * Upload user avatar to Supabase Storage
 */
export async function uploadAvatar(file: File, userId: string): Promise<{ url: string; path: string } | null> {
    try {
        // Compress image (smaller for avatars)
        const compressedBlob = await compressImage(file, 400, 400, 0.9);
        const compressedFile = new File([compressedBlob], file.name, { type: file.type });

        // Generate unique filename
        const filePath = generateFileName(userId, file.name);

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
            .from('avatars')
            .upload(filePath, compressedFile, {
                cacheControl: '3600',
                upsert: false
            });

        if (error) throw error;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(data.path);

        return {
            url: publicUrl,
            path: data.path
        };
    } catch (error) {
        console.error('Error uploading avatar:', error);
        return null;
    }
}

/**
 * Delete image from Supabase Storage
 */
export async function deleteImage(path: string, bucket: 'article_images' | 'avatars'): Promise<boolean> {
    try {
        const { error } = await supabase.storage
            .from(bucket)
            .remove([path]);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error deleting image:', error);
        return false;
    }
}

/**
 * Validate image file
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!validTypes.includes(file.type)) {
        return {
            valid: false,
            error: 'Invalid file type. Please upload a JPEG, PNG, WebP, or GIF image.'
        };
    }

    if (file.size > maxSize) {
        return {
            valid: false,
            error: 'File size too large. Maximum size is 5MB.'
        };
    }

    return { valid: true };
}
