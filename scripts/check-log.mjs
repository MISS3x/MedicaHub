
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
    const { data } = await supabase.from('voicelogs').select('id, status, transcript').eq('id', '05dcd144-6bf0-416a-b935-ebfc6dc61ccf').single();
    console.log(JSON.stringify(data, null, 2));
}
check();
