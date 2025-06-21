import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;

console.log("🔑 Loaded API key in backend:", apiKey);

if (!apiKey) {
  throw new Error("GEMINI_API_KEY is missing. Check your .env file.");
}

const genAI = new GoogleGenerativeAI({
  apiKey,
});

export default genAI;
