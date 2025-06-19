import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {nextPlugin} from '@genkit-ai/next'; // Import the nextPlugin

export const ai = genkit({
  plugins: [
    nextPlugin(), // Initialize nextPlugin first
    googleAI(),
  ],
  model: 'googleai/gemini-2.0-flash',
});
