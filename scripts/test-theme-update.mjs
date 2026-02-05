
import { createClient } from '@supabase/supabase-js';

// SENSITIVE KEYS (Local execution only)
const SUPABASE_URL = 'https://xihgbziwjronxhhuxtin.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpaGdieml3anJvbnhoaHV4dGluIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTk4NzU5MSwiZXhwIjoyMDg1NTYzNTkxfQ.mdIu2B80fgvxnoVDvgltMNRXk26hXW3mm__FNDdQUM8';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
const TARGET_ID = 'c12a250e-3453-412e-9fe3-34c318280a25';

async function testUpdate() {
    console.log(`Attempting to update theme for user ${TARGET_ID} to 'tron'...`);

    const { data, error } = await supabase
        .from('profiles')
        .update({ theme: 'tron' })
        .eq('id', TARGET_ID)
        .select();

    if (error) {
        console.error('Update Failed:', error.message);
    } else {
        console.log('Update Successful. New Data:', data);
    }
}

testUpdate();
