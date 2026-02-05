
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load .env.local
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Key in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testLogin() {
    console.log('Testing Supabase Connection & Login...');
    console.log('URL:', supabaseUrl);

    const email = 'demo@medicahub.cz';
    const password = '123456'; // Default from login form

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (error) {
        console.error('Login FAILED:', error.message);
    } else {
        console.log('Login SUCCESS!');
        console.log('User ID:', data.user?.id);
    }
}

testLogin();
