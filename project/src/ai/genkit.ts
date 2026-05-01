
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

export const ai = genkit({
  plugins: [
    googleAI({ 
      apiKey: process.env.GOOGLE_GENAI_API_KEY || process.env.GEMINI_API_KEY || 'AIzaSyBBH4hSK5XneJlpbUcqmO0O-BRB7s0HVh0' 
    })
  ],
  model: 'googleai/gemini-1.5-flash',
});
