'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function updateProfile(fullname: string) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Not authenticated' }
    }

    const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullname })
        .eq('id', user.id)

    if (error) {
        console.error('Profile update error:', error)
        return { error: error.message || 'Failed to update profile' }
    }

    revalidatePath('/settings')
    revalidatePath('/hub')
    return { error: null }
}

export async function updateSubscription(plan: 'free' | 'pro') {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    // Get org id handling
    const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
    if (!profile) throw new Error('No profile')

    // Update organizations table
    const { error } = await supabase
        .from('organizations')
        .update({ subscription_plan: plan })
        .eq('id', profile.organization_id)

    if (error) throw new Error(error.message)

    // When upgrading to PRO, add all PRO apps (top row)
    if (plan === 'pro') {
        const appsToAdd = ['voicelog', 'reporty', 'patients', 'sterilog'];

        for (const appCode of appsToAdd) {
            const { data: existingApp } = await supabase
                .from('active_apps')
                .select('*')
                .eq('organization_id', profile.organization_id)
                .eq('app_code', appCode)
                .single()

            if (!existingApp) {
                await supabase.from('active_apps').insert({
                    organization_id: profile.organization_id,
                    app_code: appCode,
                    created_at: new Date().toISOString()
                })
            }
        }
    }

    revalidatePath('/settings')
    revalidatePath('/hub')
}

export async function updateBilling(data: any) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    // Get org id
    const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
    if (!profile) throw new Error('No profile')

    // Upsert billing details
    const { error } = await supabase.from('billing_details').upsert({
        organization_id: profile.organization_id,
        ...data
    })

    if (error) throw new Error('Failed to update billing details')
    revalidatePath('/settings')
}

export async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    redirect('/login')
}

export async function deleteAccount() {
    const supabase = createClient()

    // Call the Postgres function we created
    const { error } = await supabase.rpc('delete_user_account')

    if (error) {
        console.error('Delete account error:', error)
        throw new Error('Failed to delete account')
    }

    // Sign out to clean up session on client side mostly
    await supabase.auth.signOut()

    redirect('/login?message=Ucet byl uspesne smazan')
}
