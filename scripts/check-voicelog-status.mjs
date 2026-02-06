
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Key');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkVoiceLogSetup() {
    console.log('Checking VoiceLog Setup...');

    // 1. Check Table Existence (by simple query)
    const { data: logs, error: tableError } = await supabase
        .from('voicelogs')
        .select('count', { count: 'exact', head: true });

    if (tableError) {
        console.error('❌ Table "voicelogs" MISSING or FAILING:', tableError.message);
    } else {
        console.log('✅ Table "voicelogs" exists.');
    }

    // 2. Check RPC Function (deduct_credits)
    // We try to call it with a dummy user ID to see if it exists
    // (It might error due to constraints, but "function not found" is what we look for)
    const { error: rpcError } = await supabase.rpc('deduct_credits', {
        p_user_id: '00000000-0000-0000-0000-000000000000',
        p_amount: 0
    });

    if (rpcError && rpcError.message.includes('function deduct_credits') && rpcError.message.includes('does not exist')) {
        console.error('❌ RPC Function "deduct_credits" MISSING.');
    } else {
        // If it errors with "UUID invalid" or similar, it means the function EXISTS.
        console.log('✅ RPC Function "deduct_credits" likely exists (or failed with expected error).');
        if (rpcError) console.log('   (RPC Response:', rpcError.message, ')');
    }

    // 3. Check Storage Bucket
    const { data: bucket, error: bucketError } = await supabase
        .storage
        .getBucket('voicelogs');

    if (bucketError) {
        console.error('❌ Storage Bucket "voicelogs" MISSING or FAILING:', bucketError.message);
    } else {
        console.log('✅ Storage Bucket "voicelogs" exists.');
    }
}

checkVoiceLogSetup();
