
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
if (!apiKey) {
    console.error("❌ MISSING GEMINI API KEY");
    process.exit(1);
}

// Access the API via a simpler fetch to list models if SDK doesn't expose listModels easily on main class
// Actually SDK might not expose listModels directly on the client instance in some versions?
// Let's try to use the raw API endpoint with fetch to be sure.
async function listModels() {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.models) {
            console.log("Available Models:");
            data.models.forEach(m => {
                if (m.name.includes('flash') || m.name.includes('pro')) {
                    console.log(`- ${m.name} (${m.supportedGenerationMethods.join(', ')})`);
                }
            });
        } else {
            console.error("Error listing models:", data);
        }
    } catch (e) {
        console.error("Fetch error:", e);
    }
}

listModels();
