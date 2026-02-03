'use server'

import { createClient } from '@/utils/supabase/server'

export async function getAdminUsers() {
    const supabase = createClient()

    // Načíst data z VIEW (obsahuje už full_name a user_id)
    const { data, error } = await supabase
        .from('admin_app_management')
        .select('*')
        .order('email')

    if (error) {
        console.error('Error fetching admin data:', error)
        return []
    }

    return data || []
}

export async function toggleAppStatus(email: string, appCode: string, newStatus: boolean) {
    const supabase = createClient()

    const { error } = await supabase.rpc('toggle_app_for_email', {
        user_email: email,
        app_name: appCode,
        new_status: newStatus
    })

    if (error) {
        console.error('Error toggling app:', error)
        return { success: false, error: error.message }
    }

    return { success: true }
}

export async function updateCredits(email: string, newCredits: number) {
    const supabase = createClient()

    const { error } = await supabase.rpc('update_credits_by_email', {
        user_email: email,
        new_credits: newCredits
    })

    if (error) {
        return { success: false, error: error.message }
    }

    return { success: true }
}

export async function updateTier(email: string, newTier: string) {
    const supabase = createClient()

    const { error } = await supabase.rpc('update_tier_by_email', {
        user_email: email,
        new_tier: newTier
    })

    if (error) {
        return { success: false, error: error.message }
    }

    return { success: true }
}

export async function toggleBrain(email: string, newStatus: boolean) {
    const supabase = createClient()

    const { error } = await supabase.rpc('toggle_brain_by_email', {
        user_email: email,
        new_status: newStatus
    })

    if (error) {
        return { success: false, error: error.message }
    }

    return { success: true }
}

export async function deleteUserAccount(userId: string) {
    const supabase = createClient()

    const { error } = await supabase.rpc('delete_user_cascade', {
        target_user_id: userId
    })

    if (error) {
        console.error('Error deleting user:', error)
        return { success: false, error: error.message }
    }

    return { success: true }
}
