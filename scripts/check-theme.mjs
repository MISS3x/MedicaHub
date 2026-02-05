
import { createClient } from '@supabase/supabase-js';

// SENSITIVE KEYS (Local execution only)
const SUPABASE_URL = 'https://xihgbziwjronxhhuxtin.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpaGdieml3anJvbnhoaHV4dGluIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTk4NzU5MSwiZXhwIjoyMDg1NTYzNTkxfQ.mdIu2B80fgvxnoVDvgltMNRXk26hXW3mm__FNDdQUM8';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function checkThemeSettings() {
    console.log('Checking User Theme Settings...');

    const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, full_name, theme, dashboard_view_mode, inactivity_timeout_seconds')
        .limit(10);

    if (error) {
        console.error('Error fetching profiles:', error.message);
        return;
    }

    console.table(profiles);
}

checkThemeSettings();
