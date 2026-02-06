
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumns() {
    console.log("Checking 'voicelogs' table structure...");

    // Try to select the new columns. If they don't exist, Supabase/Postgrest usually returns an error.
    const { data, error } = await supabase
        .from('voicelogs')
        .select('id, tokens_input, cost_credits')
        .limit(1);

    if (error) {
        console.error("❌ Column Check Failed:", error.message);
        console.log("👉 DIAGNOSIS: The database is missing the new columns. YOU MUST RUN THE SQL SCRIPT.");
    } else {
        console.log("✅ Columns exist. The table schema is correct.");
    }
}

checkColumns();
