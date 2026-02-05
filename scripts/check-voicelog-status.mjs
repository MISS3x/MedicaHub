
import { createClient } from '@supabase/supabase-js';

// SENSITIVE KEYS (Local execution only) - same keys as before
const SUPABASE_URL = 'https://xihgbziwjronxhhuxtin.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpaGdieml3anJvbnhoaHV4dGluIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTk4NzU5MSwiZXhwIjoyMDg1NTYzNTkxfQ.mdIu2B80fgvxnoVDvgltMNRXk26hXW3mm__FNDdQUM8';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function checkVoiceLogStatus() {
    console.log('Checking VoiceLog Entries Status...');

    const { data: entries, error } = await supabase
        .from('voicelogs')
        .select('id, created_at, status, transcript, audio_path')
        .order('created_at', { ascending: false })
        .limit(10);

    if (error) {
        console.error('Error fetching VoiceLog entries:', error.message);
        return;
    }

    console.table(entries);
}

checkVoiceLogStatus();
