import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardClient } from './DashboardClient'
import { OrgWaitingScreen } from './OrgWaitingScreen'

export const dynamic = 'force-dynamic';

export default async function HubPage() {
    const supabase = createClient()

    // 1. Check Auth
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return redirect('/login')

    let initialLayout = null;
    let profileData = null;
    let upcomingTasks: any[] = [];
    let activeAppCodes: string[] = [];

    if (user) {
        try {
            // 1. Fetch Profile & Org with brain_enabled, credits, subscription_plan from organizations
            const { data: profile } = await supabase
                .from("profiles")
                .select(`
                    dashboard_layout, 
                    dashboard_view_mode,
                    dashboard_view_mode_mobile,
                    dashboard_view_mode_desktop,
                    organization_id,
                    organizations!inner(brain_enabled, credits, subscription_plan)
                `)
                .eq("id", user.id)
                .single();

            if (!profile?.organization_id) {
                return <OrgWaitingScreen />
            }

            if (profile) {
                profileData = profile;
                initialLayout = profile.dashboard_layout;
                // Type safety for view mode (default 'nodes')
                const viewMode = (profile as any).dashboard_view_mode || 'nodes';

                // 2. Fetch Active Apps (only enabled ones)
                if (profile.organization_id) {
                    const { data: apps } = await supabase
                        .from("active_apps")
                        .select("app_code")
                        .eq("organization_id", profile.organization_id)
                        .eq("is_enabled", true);

                    if (apps) {
                        activeAppCodes = apps.map(a => a.app_code);
                    }

                    // 3. Fetch Upcoming Tasks
                    const { data: tasks } = await supabase
                        .from("operational_tasks")
                        .select("id, title, due_date, status")
                        .eq("organization_id", profile.organization_id)
                        .eq("status", "pending")
                        .order("due_date", { ascending: true })
                        .limit(2);

                    if (tasks) upcomingTasks = tasks;
                    else upcomingTasks = [];

                    // 4. Fetch Recent TermoLog entries (last 2 temps)
                    const { data: recentTemps } = await supabase
                        .from("termolog_entries")
                        .select("value, recorded_at")
                        .eq("organization_id", profile.organization_id)
                        .order("recorded_at", { ascending: false })
                        .limit(2);

                    // 5. Fetch Recent MedLog entries (last 2 meds)
                    const { data: recentMeds } = await supabase
                        .from("medlog_entries")
                        .select("medication_name, administered_at")
                        .eq("organization_id", profile.organization_id)
                        .order("administered_at", { ascending: false })
                        .limit(2);

                    // Store in variables to pass to client
                    (profileData as any).recentTemps = recentTemps || [];
                    (profileData as any).recentMeds = recentMeds || [];
                    (profileData as any).viewMode = viewMode;
                }
            }
        } catch (e) {
            console.error("Error fetching dashboard data:", e);
        }
    }

    // Extract organization data safely
    const orgData = (profileData as any)?.organizations;
    const tier = orgData?.subscription_plan || 'free';
    const credits = orgData?.credits || 0;
    const brainEnabled = orgData?.brain_enabled ?? false;
    const initialViewMode = (profileData as any)?.viewMode || 'nodes';

    return (
        <main className="w-full h-screen overflow-hidden bg-background text-foreground relative selection:bg-blue-500/30">
            <DashboardClient
                initialLayout={initialLayout}
                initialViewModeMobile={(profileData as any)?.dashboard_view_mode_mobile || 'nodes'}
                initialViewModeDesktop={(profileData as any)?.dashboard_view_mode_desktop || 'nodes'}
                userId={user?.id}
                activeAppCodes={activeAppCodes}
                isPro={tier === 'pro'}
                credits={credits}
                brainEnabled={brainEnabled}
                tasks={upcomingTasks}
                recentTemps={(profileData as any)?.recentTemps || []}
                recentMeds={(profileData as any)?.recentMeds || []}
            />
        </main>
    )
}
