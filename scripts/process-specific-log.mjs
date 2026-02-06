
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import fs from 'fs';

// Load env
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Use Service Role Key for Admin Access!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase Config');
    process.exit(1);
}

console.log(`Using Supabase Key: ${supabaseServiceKey.substring(0, 10)}...`);

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
if (!apiKey) {
    console.error("❌ MISSING GEMINI API KEY");
    process.exit(1);
}
console.log(`Using Gemini Key: ${apiKey.substring(0, 5)}...`);

const genAI = new GoogleGenerativeAI(apiKey);

const TARGET_ID = '05dcd144-6bf0-416a-b935-ebfc6dc61ccf';

async function processSpecificLog() {
    console.log(`🔍 Searching for log ID: ${TARGET_ID}...`);

    const { data: record, error } = await supabase
        .from('voicelogs')
        .select('*')
        .eq('id', TARGET_ID)
        .single();

    if (error || !record) {
        console.error("Error fetching (or not found). check RLS or ID:", error);
        return;
    }

    console.log(`Found record. Status: ${record.status}`);
    console.log(`Audio Path: ${record.audio_path}`);

    // 1. Download audio
    const { data: fileData, error: downloadError } = await supabase
        .storage
        .from('voicelogs')
        .download(record.audio_path);

    if (downloadError) {
        console.error(`   ❌ Download Failed: ${downloadError.message}`);
        return;
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

    console.log(`   🚀 Sending to Gemini (Model: gemini-1.5-flash-001)...`);

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

    } catch (geminiError) {
        console.error(`   ❌ Gemini Error:`, geminiError);
        console.error(geminiError.message);
    }

    console.log("🏁 SCRIPT FINISHED");
}

processSpecificLog();
