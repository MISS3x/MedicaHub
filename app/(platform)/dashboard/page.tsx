import { createClient } from "@/utils/supabase/server";
import { DashboardClient } from "./DashboardClient";

export default async function DashboardPage() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    let initialLayout = null;
    let profileData = null;
    let upcomingTasks: any[] = [];

    if (user) {
        try {
            // 1. Fetch Profile & Org ID
            const { data: profile } = await supabase
                .from("profiles")
                .select("dashboard_layout, is_pro, credits, organization_id")
                .eq("id", user.id)
                .single();

            if (profile) {
                profileData = profile;
                initialLayout = profile.dashboard_layout;

                // 2. Fetch Upcoming Tasks if Org ID exists
                if (profile.organization_id) {
                    const { data: tasks } = await supabase
                        .from("operational_tasks")
                        .select("id, title, due_date, status")
                        .eq("organization_id", profile.organization_id)
                        .eq("status", "pending")
                        .order("due_date", { ascending: true })
                        .limit(2);

                    if (tasks) upcomingTasks = tasks;
                }
            }
        } catch (e) {
            console.error("Error fetching dashboard data:", e);
        }
    }

    return (
        <main className="w-full h-screen overflow-hidden bg-white text-slate-900 relative selection:bg-blue-500/30">
            <DashboardClient
                initialLayout={initialLayout}
                userId={user?.id}
                isPro={profileData?.is_pro ?? false}
                credits={profileData?.credits ?? 0}
                tasks={upcomingTasks}
            />
        </main>
    )
}
