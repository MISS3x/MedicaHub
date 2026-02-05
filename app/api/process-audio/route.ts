
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');

export async function POST(req: NextRequest) {
    try {
        const { recordId } = await req.json();

        if (!recordId) {
            return NextResponse.json({ error: 'Record ID is required' }, { status: 400 });
        }

        const supabase = createClient();

        // 1. Fetch record metadata
        const { data: record, error: fetchError } = await supabase
            .from('voicelogs')
            .select('*')
            .eq('id', recordId)
            .single();

        if (fetchError || !record) {
            return NextResponse.json({ error: 'Record not found' }, { status: 404 });
        }

        // 2. Download audio file from Storage
        const { data: fileData, error: downloadError } = await supabase
            .storage
            .from('voicelogs')
            .download(record.audio_path);

        if (downloadError || !fileData) {
            return NextResponse.json({ error: 'Audio file not found' }, { status: 404 });
        }

        // 3. Convert Blob/File to Base64 for Gemini
        const arrayBuffer = await fileData.arrayBuffer();
        const base64Audio = Buffer.from(arrayBuffer).toString('base64');

        // 4. Call Gemini 1.5 Flash
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

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
                    mimeType: "audio/webm",
                    data: base64Audio
                }
            }
        ]);

        const response = await result.response;
        const transcript = response.text();
        const usage = response.usageMetadata;

        // --- COST CALCULATION ---
        // Pricing for Gemini 1.5 Flash (approx):
        // Input: $0.075 per 1M tokens
        // Output: $0.30 per 1M tokens
        // Exchange Rate: 1 USD = 24 CZK
        // 1 Credit = 1 CZK

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
            console.warn('Gemini returned empty transcript.');
        }

        // 5. Update Database (Transcript + Usage Stats)
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
            console.error('Database Update Error (Schema missing?):', updateError);
            return NextResponse.json({ error: 'Failed to update transcript in DB', details: updateError }, { status: 500 });
        }

        // 6. Deduct Credits (Safe RPC Call)
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { error: rpcError } = await supabase.rpc('deduct_credits', {
                    p_user_id: user.id,
                    p_amount: finalCost
                });

                if (rpcError) {
                    console.error('Credit Deduction Failed (RPC error):', rpcError);
                    // We do NOT fail the request here, because transcript was successful.
                    // We just log it. Admin can reconcile later.
                }
            }
        } catch (rpcErr) {
            console.error('Credit Deduction Exception:', rpcErr);
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

    } catch (error: any) {
        console.error('Processing error detailed:', error);
        return NextResponse.json({
            error: 'Internal processing error',
            details: error.message || String(error),
            stack: error.stack
        }, { status: 500 });
    }
}
