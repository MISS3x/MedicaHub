
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import fs from 'fs';

// Load env
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
// IMPROVEMENT: If you have a SERVICE_ROLE key in .env.local, use it!
// But usually it's not there. We'll try with ANON. 
// If RLS blocks us, we might need the user's session or a service key.
// Let's check if we have a service key in env var (sometimes called SUPABASE_SERVICE_ROLE_KEY)
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const targetKey = supabaseServiceKey || supabaseKey;
const role = supabaseServiceKey ? 'service_role' : 'anon';

console.log(`Using Supabase Key: ${role}`);

if (!supabaseUrl || !targetKey) {
    console.error('Missing Supabase Config');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, targetKey);

const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
if (!apiKey) {
    console.error("❌ MISSING GEMINI API KEY");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function processPendingLogs() {
    console.log("🔍 Searching for PENDING voicelogs...");

    const { data: logs, error } = await supabase
        .from('voicelogs')
        .select('*')
        .eq('status', 'pending');

    if (error) {
        console.error("Error fetching logs:", error);
        return;
    }

    console.log(`Found ${logs.length} pending logs.`);

    for (const record of logs) {
        console.log(`\n▶ Processing Record: ${record.id} (${record.audio_path})`);

        // 1. Download audio
        const { data: fileData, error: downloadError } = await supabase
            .storage
            .from('voicelogs')
            .download(record.audio_path);

        if (downloadError) {
            console.error(`   ❌ Download Failed: ${downloadError.message}`);

            // Special check: Does bucket exist?
            // If download failed, maybe we can't proceed.
            continue;
        }

        console.log(`   ✅ Audio Downloaded (${fileData.size} bytes)`);

        // 2. Prepare for Gemini
        const arrayBuffer = await fileData.arrayBuffer();
        const base64Audio = Buffer.from(arrayBuffer).toString('base64');

        // Mime type guess
        let mimeType = 'audio/webm';
        if (record.audio_path.endsWith('.mp4')) mimeType = 'audio/mp4';
        else if (record.audio_path.endsWith('.mp3')) mimeType = 'audio/mp3';
        else if (record.audio_path.endsWith('.wav')) mimeType = 'audio/wav';
        else if (record.audio_path.endsWith('.ogg')) mimeType = 'audio/ogg'; // Common for browser mic

        console.log(`   🚀 Sending to Gemini (Model: gemini-1.5-flash)...`);

        try {
            const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
            const prompt = `
                Jsi lékařský asistent. Tvým úkolem je přesně přepsat tento audio záznam.
                Záznam je v čestině, může obsahovat latinské lékařské termíny.
                
                Pravidla:
                1. Přepis musí být doslovný, ale gramaticky správný.
                2. Lékařské termíny (latinské) piš správně.
                3. Text formátuj do odstavců, pokud je to vhodné.
                4. Nepřidávej žádné úvodní ani závěrečné fráze (jako "Zde je přepis..."), vrať POUZE text přepisu.
            `;

            const result = await model.generateContent([
                prompt,
                {
                    inlineData: {
                        mimeType: mimeType,
                        data: base64Audio
                    }
                }
            ]);

            const response = await result.response;
            const transcript = response.text();

            console.log(`   ✅ Transcript Received: "${transcript.substring(0, 50)}..."`);

            // Usage stats
            const usage = response.usageMetadata;
            const inputTokens = usage?.promptTokenCount || 0;
            const outputTokens = usage?.candidatesTokenCount || 0;

            // Cost logic
            const PRICE_PER_1M_INPUT_USD = 0.075;
            const PRICE_PER_1M_OUTPUT_USD = 0.30;
            const CZK_RATE = 24;
            const costUSD = (inputTokens / 1000000 * PRICE_PER_1M_INPUT_USD) +
                (outputTokens / 1000000 * PRICE_PER_1M_OUTPUT_USD);
            const finalCost = parseFloat((costUSD * CZK_RATE).toFixed(5));

            // 3. Update DB
            const { error: updateError } = await supabase
                .from('voicelogs')
                .update({
                    transcript: transcript || '[Nerozpoznána žádná řeč]',
                    status: 'processed',
                    tokens_input: inputTokens,
                    tokens_output: outputTokens,
                    cost_credits: finalCost
                })
                .eq('id', record.id);

            if (updateError) {
                console.error(`   ❌ Database Update Failed: ${updateError.message}`);
            } else {
                console.log(`   ✅ Record UPDATED successfully! (Cost: ${finalCost} CZK)`);
            }

            // 4. Try to deduct credits (if we have access to backend function)
            // Note: If running as anon/service_role without being 'the user', this RPC might fail 
            // if it relies on auth.uid(). But our RPC uses p_user_id param, so it *might* work 
            // if we are service_role. If anon, it might fail RLS/security.
            // Let's try it but not block.
            try {
                const { error: rpcError } = await supabase.rpc('deduct_credits', {
                    p_user_id: record.user_id,
                    p_amount: finalCost,
                    p_description: `Manuální přepis audia (${record.duration_seconds || '?'}s)`,
                    p_app_id: 'voicelog'
                });
                if (rpcError) console.log(`   ⚠️ Credit deduction failed (expected if not admin): ${rpcError.message}`);
                else console.log(`   💰 Credits deducted.`);
            } catch (e) {
                console.log(`   ⚠️ Credit deduction skipped.`);
            }

        } catch (geminiError) {
            console.error(`   ❌ Gemini Error:`, geminiError.message);
            // Optionally set status to 'error'
            await supabase.from('voicelogs').update({ status: 'error', transcript: `Error: ${geminiError.message}` }).eq('id', record.id);
        }
    }
}

processPendingLogs();
