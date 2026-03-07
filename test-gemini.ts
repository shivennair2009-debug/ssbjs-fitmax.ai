import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const apiKey = process.env.GEMINI_API_KEY;
console.log("Checking API key...");
if (!apiKey) {
    console.error("No API key found in .env.local!");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

async function test() {
    console.log("Attempting to call Gemini API...");
    try {
        const result = await model.generateContent("Hello! What model are you?");
        console.log("Success! Response:");
        console.log(result.response.text());
    } catch (e: any) {
        console.error("Failed!");
        console.error(e.message || e);
    }
}

test();
