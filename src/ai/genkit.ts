
import 'dotenv/config'; // Make sure environment variables are loaded
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import next from '@genkit-ai/next';

export const ai = genkit({
  plugins: [
    next(),
    googleAI({ apiKey: process.env.GOOGLE_API_KEY }),
  ],
  model: 'gemini-1.5-flash-latest',
});
