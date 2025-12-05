'use server';

import { createClient } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';

export async function getNotificationSettings() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

    if (error && error.code !== 'PGRST116') {
        console.error('Error fetching settings:', error);
        return null;
    }

    // If no settings exist, return default
    if (!data) {
        return {
            email_notifications: true,
            theme: 'system'
        };
    }

    return data;
}

export async function updateNotificationSettings(settings: { email_notifications?: boolean; theme?: string }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error('Unauthorized');
    }

    const { error } = await supabase
        .from('user_settings')
        .upsert({
            user_id: user.id,
            ...settings,
            updated_at: new Date().toISOString()
        });

    if (error) {
        console.error('Error updating settings:', error);
        throw new Error('Failed to update settings');
    }

    revalidatePath('/settings');
    return { success: true };
}
