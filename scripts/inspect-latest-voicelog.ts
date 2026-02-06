
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function inspectLatestLog() {
    console.log('--- AUTHENTICATING AS DEMO USER ---');
    const { data: { session }, error: authError } = await supabase.auth.signInWithPassword({
        email: 'demo@medicahub.cz',
        password: '123456'
    });

    if (authError || !session) {
        console.error('❌ Auth Failed:', authError?.message);
        return;
    }
    console.log('✅ Authenticated as:', session.user.email);

    console.log('--- INSPECTING LATEST VOICELOG ---');

    // 1. Get latest record
    const { data: logs, error } = await supabase
        .from('voicelogs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

    if (error) {
        console.error('❌ DB Error:', error.message);
        return;
    }

    if (!logs || logs.length === 0) {
        console.log('⚠️ No voicelogs found.');
        return;
    }

    const log = logs[0];
    console.log('✅ Latest Record Found:');
    console.log('  ID:', log.id);
    console.log('  Created:', new Date(log.created_at).toLocaleString());
    console.log('  Status:', log.status);
    console.log('  Audio Path:', log.audio_path);
    console.log('  Transcript:', log.transcript ? 'YES (Length: ' + log.transcript.length + ')' : 'NO');
    console.log('  Cost:', log.cost_credits);

    // 2. Check if file exists in storage
    if (log.audio_path) {
        console.log('--- CHECKING STORAGE ---');
        // We can't easily check existence with download without auth, but we can try to list the folder
        const folder = log.audio_path.split('/')[0];
        console.log(`  Checking bucket 'voicelogs' folder '${folder}'...`);

        // As ANON, we might not be able to list, but let's try
        const { data: files, error: listError } = await supabase.storage.from('voicelogs').list(folder);

        if (listError) {
            console.error('  ❌ Storage List Error (Permissions?):', listError.message);
        } else {
            const fileExists = files.find(f => log.audio_path.endsWith(f.name));
            if (fileExists) {
                console.log('  ✅ Audio file CONFIRMED in storage:', fileExists.name, `(${fileExists.metadata?.size} bytes)`);
            } else {
                console.error('  ⚠️ File NOT found in storage listing. (Bucket may be empty or path wrong)');
                console.log('     Files found in folder:', files.map(f => f.name));
            }
        }
    }
}

inspectLatestLog();
