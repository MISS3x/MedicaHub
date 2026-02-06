import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import SettingsClient from './client-page'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
    const supabase = createClient()

    // Auth Check
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    // Data Fetching
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

    if (!profile?.organization_id) return <div>Chyba: Žádná organizace.</div>

    const { data: organization } = await supabase.from('organizations').select('*').eq('id', profile.organization_id).single()
    const { data: billing } = await supabase.from('billing_details').select('*').eq('organization_id', profile.organization_id).single()

    // Fetch Credit History if organization exists
    let creditHistory = [];
    if (organization) {
        const { data } = await supabase
            .from('credit_transactions')
            .select('*')
            .eq('organization_id', organization.id)
            .order('created_at', { ascending: false })
            .limit(50);
        creditHistory = data || [];
    }

    return (
        <SettingsClient
            user={user}
            profile={profile}
            organization={organization}
            billing={billing}
            creditHistory={creditHistory}
        />
    )
}
