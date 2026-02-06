import { createClient } from '@/utils/supabase/server';
import { SurveyDashboardClient } from './SurveyDashboardClient';

export const metadata = {
    title: 'Admin - Průzkum | MedicaHub',
};

// Force dynamic rendering to always fetch fresh data
export const dynamic = 'force-dynamic';

export default async function SurveyAdminPage() {
    const supabase = createClient();

    // Fetch Results
    const { data: results, error: resultsError } = await supabase
        .from('survey_results')
        .select('*')
        .order('created_at', { ascending: false });

    // Fetch Leads (Beta Requests)
    const { data: leads, error: leadsError } = await supabase
        .from('beta_requests')
        .select('*')
        .order('created_at', { ascending: false });

    if (resultsError || leadsError) {
        return (
            <div className="p-10 text-center text-red-500">
                Chyba při načítání dat.
                <pre className="text-xs text-slate-400 mt-2">{JSON.stringify(resultsError || leadsError, null, 2)}</pre>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50/50 pb-20 pt-20">
            <SurveyDashboardClient results={results || []} leads={leads || []} />
        </div>
    );
}
