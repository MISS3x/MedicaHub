import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardClient } from '../dashboard/DashboardClient'

export const dynamic = 'force-dynamic';

export default async function HubPage() {
    const supabase = createClient()

    // 1. Check Auth
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return redirect('/login')

    // 2. Fetch Profile & Organization Data
    const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id, full_name, dashboard_layout')
        .eq('id', user.id)
        .single()

    if (!profile?.organization_id) {
        // Simple fallback
        return <div className="p-20 text-center text-slate-500">Chyba: Uživatel nemá přiřazenou organizaci.</div>
    }

    // 3. Subscription & Active Apps
    const { data: organization } = await supabase
        .from('organizations')
        .select('subscription_plan')
        .eq('id', profile.organization_id)
        .single()

    const { data: activeAppsData } = await supabase
        .from('active_apps')
        .select('app_code')
        .eq('organization_id', profile.organization_id)

    const activeAppCodes = activeAppsData?.map(a => a.app_code) || []
    const isPro = organization?.subscription_plan === 'pro';

    return (
        <main className="w-full h-screen overflow-hidden bg-slate-950 text-white relative selection:bg-pink-500/30">
            <DashboardClient
                initialLayout={profile.dashboard_layout}
                userId={user.id}
                activeAppCodes={activeAppCodes}
                isPro={isPro}
            />
        </main>
    )
}
