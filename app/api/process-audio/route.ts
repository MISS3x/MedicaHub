
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { GoogleAIFileManager } from "@google/generative-ai/server";
import fs from 'fs';
import path from 'path';
import os from 'os';

// Initialize Gemini
const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
if (!apiKey) {
    console.error("❌ MISSING GEMINI API KEY");
}
const genAI = new GoogleGenerativeAI(apiKey || 'dummy_key_to_prevent_init_crash');
const fileManager = new GoogleAIFileManager(apiKey || 'dummy_key_to_prevent_init_crash');

export const maxDuration = 300; // Allow up to 300 seconds (5 mins) for AI processing
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    console.log("🚀 [API] /api/process-audio started");
    try {
        const body = await req.json().catch(e => null);
        if (!body || !body.recordId) {
            console.error("❌ [API] Missing recordId in body");
            return NextResponse.json({ error: 'Record ID is required' }, { status: 400 });
        }
        const { recordId } = body;
        console.log(`📝 [API] Processing Record ID: ${recordId}`);

        // Debug API Key
        const keyStatus = apiKey ? `Present (Length: ${apiKey.length})` : "MISSING";
        console.log(`🔑 [API] Gemini API Key Status: ${keyStatus}`);

        if (!apiKey) {
            console.error("❌ [API] Server Configuration Error: Gemini API Key is missing.");
            return NextResponse.json({ error: 'Server Configuration Error: Gemini API Key is missing.' }, { status: 500 });
        }

        const supabase = createClient();

        // 1. Fetch record metadata
        console.log("🔍 [API] Fetching record metadata...");
        const { data: record, error: fetchError } = await supabase
            .from('voicelogs')
            .select('*')
            .eq('id', recordId)
            .single();

        if (fetchError || !record) {
            console.error("❌ [API] Record fetch failed:", fetchError);
            return NextResponse.json({ error: 'Record not found', details: fetchError }, { status: 404 });
        }
        console.log(`✅ [API] Record found. Audio path: ${record.audio_path}`);

        // 2. Download audio file from Storage
        console.log("⬇️ [API] Downloading audio file...");
        const { data: fileData, error: downloadError } = await supabase
            .storage
            .from('voicelogs')
            .download(record.audio_path);

        if (downloadError || !fileData) {
            console.error("❌ [API] Download failed:", downloadError);
            return NextResponse.json({ error: 'Audio file not found', details: downloadError }, { status: 404 });
        }
        console.log(`✅ [API] Audio downloaded. Size: ${fileData.size} bytes`);

        // 3. Save to Temp File (for File API)
        const arrayBuffer = await fileData.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Detect Extension
        let extension = 'webm';
        let mimeType = 'audio/webm';
        if (record.audio_path.endsWith('.mp4') || record.audio_path.endsWith('.m4a')) {
            extension = 'mp4';
            mimeType = 'audio/mp4';
        } else if (record.audio_path.endsWith('.mp3')) {
            extension = 'mp3';
            mimeType = 'audio/mp3';
        } else if (record.audio_path.endsWith('.wav')) {
            extension = 'wav';
            mimeType = 'audio/wav';
        } else if (record.audio_path.endsWith('.ogg')) {
            extension = 'ogg';
            mimeType = 'audio/ogg';
        }

        const tempFilePath = path.join(os.tmpdir(), `audio-${recordId}.${extension}`);
        fs.writeFileSync(tempFilePath, buffer);
        console.log(`✅ [API] Temp file written: ${tempFilePath}`);

        // 4. Upload to Gemini File API
        console.log("⬆️ [API] Uploading to Gemini File Manager...");
        const uploadResponse = await fileManager.uploadFile(tempFilePath, {
            mimeType: mimeType,
            displayName: `VoiceLog-${recordId}`
        });

        console.log(`✅ [API] File uploaded. URI: ${uploadResponse.file.uri}`);

        // 5. Call Gemini 2.0 Flash (as requested by user for higher limits)
        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash",
            safetySettings: [
                {
                    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
                    threshold: HarmBlockThreshold.BLOCK_NONE,
                },
                {
                    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                    threshold: HarmBlockThreshold.BLOCK_NONE,
                },
                {
                    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
                    threshold: HarmBlockThreshold.BLOCK_NONE,
                },
                {
                    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                    threshold: HarmBlockThreshold.BLOCK_NONE,
                },
            ]
        });

        const prompt = `
            Jsi lékařský asistent. Tvým úkolem je přesně přepsat tento audio záznam.
            Záznam je v čestině, může obsahovat latinské lékařské termíny.
            
            Pravidla:
            1. Přepis musí být doslovný, ale gramaticky správný.
            2. Lékařské termíny (latinské) piš správně.
            3. Text formátuj do odstavců, pokud je to vhodné.
            4. Nepřidávej žádné úvodní ani závěrečné fráze (jako "Zde je přepis..."), vrať POUZE text přepisu.
        `;

        console.log(`🤖 [API] Generating content with Gemini 2.0 Flash...`);

        try {
            const result = await model.generateContent([
                prompt,
                {
                    fileData: {
                        mimeType: uploadResponse.file.mimeType,
                        fileUri: uploadResponse.file.uri
                    }
                }
            ]);

            const response = await result.response;
            const transcript = response.text();
            const usage = response.usageMetadata;

            console.log("✅ [API] Gemini response received. Token usage:", usage);

            // Clean up temp file
            try {
                fs.unlinkSync(tempFilePath);
            } catch (e) { console.error("Could not delete temp file", e); }

            // --- COST CALCULATION ---
            // Pricing for Gemini 2.0 Flash (Approx - using 1.5 logic for now as placeholder or if similar)
            // Note: User mentioned "High limits" but exact per-token pricing for 2.0 Flash might vary. 
            // We'll stick to the previous estimation logic for consistency unless updated info is provided.
            const PRICE_PER_1M_INPUT_USD = 0.075;
            const PRICE_PER_1M_OUTPUT_USD = 0.30;
            const CZK_RATE = 24;

            const inputTokens = usage?.promptTokenCount || 0;
            const outputTokens = usage?.candidatesTokenCount || 0;

            const costUSD = (inputTokens / 1000000 * PRICE_PER_1M_INPUT_USD) +
                (outputTokens / 1000000 * PRICE_PER_1M_OUTPUT_USD);

            const costCZK = costUSD * CZK_RATE;
            // Round to 5 decimal places to avoid scientific notation issues in DB
            const finalCost = parseFloat(costCZK.toFixed(5));

            if (transcript.trim() === '') {
                console.warn('⚠️ [API] Gemini returned empty transcript.');
            }

            // 6. Update Database (Transcript + Usage Stats)
            const { error: updateError } = await supabase
                .from('voicelogs')
                .update({
                    transcript: transcript || '[Nerozpoznána žádná řeč]',
                    status: 'processed',
                    tokens_input: inputTokens,
                    tokens_output: outputTokens,
                    cost_credits: finalCost
                })
                .eq('id', recordId);

            if (updateError) {
                console.error('❌ [API] Database Update Error:', updateError);
                return NextResponse.json({ error: 'Failed to update transcript in DB', details: updateError }, { status: 500 });
            }

            // 7. Deduct Credits (Safe RPC Call)
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const { error: rpcError } = await supabase.rpc('deduct_credits', {
                        p_user_id: user.id,
                        p_amount: finalCost,
                        p_description: `Přepis audia (${record.duration_seconds}s)`,
                        p_app_id: 'voicelog'
                    });

                    if (rpcError) {
                        console.error('⚠️ [API] Credit Deduction Failed (RPC error):', rpcError);
                    }
                }
            } catch (rpcErr) {
                console.error('⚠️ [API] Credit Deduction Exception:', rpcErr);
            }

            return NextResponse.json({
                success: true,
                transcript,
                usage: {
                    input: inputTokens,
                    output: outputTokens,
                    cost: finalCost
                }
            });

        } catch (geminiError: any) {
            console.error("❌ [API] Gemini Generation Error:", geminiError);
            // Check for quota or API key specific errors
            return NextResponse.json({
                error: 'AI Generation Failed',
                details: geminiError.message,
                reason: 'Possible API Key issue or Quota exceeded'
            }, { status: 500 });
        }

    } catch (error: any) {
        console.error('❌ [API] Uncaught processing error:', error);
        return NextResponse.json({
            error: 'Internal processing error',
            details: error.message || String(error),
            stack: error.stack
        }, { status: 500 });
    }
}
