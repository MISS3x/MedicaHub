import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import EventLogClient from './client-page'
import { getTasks, initializeCategories, getCategories } from './actions'

// Ensure fresh data
export const dynamic = 'force-dynamic';

export default async function EventLogPage() {
    const supabase = createClient()

    // 1. Auth Check
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return redirect('/login')

    // 2. Get Organization ID
    const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single()

    if (!profile?.organization_id) {
        return <div>Chyba: Organizace nenalezena.</div>
    }

    // 3. Initialize & Fetch Data
    // We initialize categories first to safeguard defaults
    await initializeCategories(profile.organization_id);

    const [tasks, categories] = await Promise.all([
        getTasks(profile.organization_id),
        getCategories(profile.organization_id)
    ]);

    return (
        <EventLogClient
            initialTasks={tasks}
            initialCategories={categories}
            organizationId={profile.organization_id}
        />
    )
}
