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
        .select('organization_id, full_name, dashboard_layout, credits, is_pro')
        .eq('id', user.id)
        .single()

    if (!profile?.organization_id) {
        // For new users, organization might not be created yet by trigger
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
                <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <div className="w-4 h-4 bg-blue-600 rounded-full animate-pulse"></div>
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mb-2">Nastavujeme váš účet...</h2>
                    <p className="text-slate-500 mb-6">
                        Váš účet se právě vytváří. Zkuste obnovit stránku za chvíli.
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors w-full"
                    >
                        Obnovit stránku
                    </button>
                </div>
            </div>
        )
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

    // 4. Fetch Upcoming Tasks
    const { data: tasks } = await supabase
        .from('operational_tasks')
        .select('id, title, due_date, status')
        .eq('organization_id', profile.organization_id)
        .eq('status', 'pending')
        .order('due_date', { ascending: true })
    const activeAppCodes = activeAppsData?.map(a => a.app_code) || []
    const isPro = profile.is_pro || organization?.subscription_plan === 'pro';
    const credits = profile.credits || 0;

    // TODO: Re-enable after confirming operational_tasks structure
    // const { data: tasks } = await supabase
    //     .from('operational_tasks')
    //     .select('id, title, due_date, status')
    //     .eq('organization_id', profile.organization_id)
    //     .eq('status', 'pending')
    //     .order('due_date', { ascending: true })
    //     .limit(5)

    return (
        <main className="w-full h-screen overflow-hidden bg-slate-950 text-white relative selection:bg-pink-500/30">
            <DashboardClient
                initialLayout={profile.dashboard_layout}
                userId={user.id}
                activeAppCodes={activeAppCodes}
                isPro={isPro}
                credits={credits}
                tasks={[]}
            />
        </main>
    )
}
