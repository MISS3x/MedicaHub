
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { action, payload, timestamp } = body;

        console.log(`[VoiceMedica] Received Command: ${action}`, payload);

        // Here we can implement complex logic, e.g., interfacing with an LLM to parse intent 
        // if the command wasn't matched locally, or logging to a database.

        // For now, we just echo back success.

        return NextResponse.json({
            success: true,
            message: `Command verified: ${action}`,
            data: {
                processed_at: new Date().toISOString(),
                original_payload: payload
            }
        });

    } catch (error: any) {
        console.error("VoiceMedica Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
