
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkColumns() {
    console.log('Checking columns in profiles table...');

    // We can't query information_schema easily with js client usually, 
    // but we can try to select one row and see properties
    const { data, error } = await supabase.from('profiles').select('*').limit(1);

    if (error) {
        console.error('Error fetching profiles:', error);
        return;
    }

    if (data && data.length > 0) {
        const row = data[0];
        console.log('Columns found:', Object.keys(row));
        console.log('theme exists:', 'theme' in row);
        console.log('inactivity_timeout_seconds exists:', 'inactivity_timeout_seconds' in row);
    } else {
        console.log('No profiles found to check columns.');
    }
}

checkColumns();
