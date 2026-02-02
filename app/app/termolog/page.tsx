import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import TermoLogClient from './client-page'

export default async function TermoLogPage() {
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
        .from('termolog_entries')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('date', { ascending: false })

    // 3. Render Client Component
    return (
        <TermoLogClient
            initialEntries={entries || []}
            organizationId={profile.organization_id}
        />
    )
}
