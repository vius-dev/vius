'use server';

import { createClient } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';

export async function blockUser(userIdToBlock: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error('Unauthorized');
    }

    if (user.id === userIdToBlock) {
        throw new Error('Cannot block yourself');
    }

    const { error } = await supabase
        .from('user_blocks')
        .insert({
            blocker_id: user.id,
            blocked_id: userIdToBlock
        });

    if (error) {
        console.error('Error blocking user:', error);
        throw new Error('Failed to block user');
    }

    revalidatePath('/profile');
    return { success: true };
}

export async function unblockUser(userIdToUnblock: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error('Unauthorized');
    }

    const { error } = await supabase
        .from('user_blocks')
        .delete()
        .eq('blocker_id', user.id)
        .eq('blocked_id', userIdToUnblock);

    // Wait, the syntax above was wrong in my thought process, let's correct it in the file.
    // .eq('blocked_id', userIdToUnblock)

    if (error) {
        console.error('Error unblocking user:', error);
        throw new Error('Failed to unblock user');
    }

    revalidatePath('/profile');
    return { success: true };
}

export async function getBlockedUsers() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    const { data, error } = await supabase
        .from('user_blocks')
        .select(`
      blocked_id,
      profiles:blocked_id (
        id,
        display_name,
        avatar_url
      )
    `)
        .eq('blocker_id', user.id);

    if (error) {
        console.error('Error fetching blocked users:', error);
        return [];
    }

    return data.map((item: any) => item.profiles);
}
