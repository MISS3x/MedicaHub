import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import MedLogClient from './client-page'

// Force dynamic rendering because we are fetching specific user data and data changes often
export const dynamic = 'force-dynamic'

export default async function MedLogPage() {
    const supabase = createClient()

    // 1. Auth & Organization Check
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single()

    if (!profile?.organization_id) {
        return <div>Chyba: Žádná organizace.</div>
    }

    // 2. Load Data
    const { data: entries } = await supabase
        .from('medlog_entries')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('date', { ascending: false })

    // 3. Render Client Component
    return (
        <MedLogClient
            initialEntries={entries || []}
            organizationId={profile.organization_id}
        />
    )
}
