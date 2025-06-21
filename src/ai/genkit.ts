
import 'dotenv/config'; // Make sure environment variables are loaded
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [
    googleAI({ apiKey: process.env.GOOGLE_API_KEY }),
  ],
  model: 'gemini-1.5-flash-latest',
});
