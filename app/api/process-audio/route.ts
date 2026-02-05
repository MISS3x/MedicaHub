
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
                    mimeType: "audio/webm", // Assuming webm from recorder
                    data: base64Audio
                }
            }
        ]);

        const transcript = result.response.text();

        // 5. Update Database
        const { error: updateError } = await supabase
            .from('voicelogs')
            .update({
                transcript: transcript,
                status: 'processed'
            })
            .eq('id', recordId);

        if (updateError) {
            console.error('Update error:', updateError);
            return NextResponse.json({ error: 'Failed to update transcript' }, { status: 500 });
        }

        return NextResponse.json({ success: true, transcript });

    } catch (error) {
        console.error('Processing error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
