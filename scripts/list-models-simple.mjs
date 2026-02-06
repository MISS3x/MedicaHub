
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

async function listModels() {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.models) {
            console.log("MODELS:");
            data.models.forEach(m => console.log(m.name));
        } else {
            console.error("Error:", data);
        }
    } catch (e) {
        console.error(e);
    }
}
listModels();
