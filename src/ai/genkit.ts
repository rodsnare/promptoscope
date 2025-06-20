
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
// Removed: import {nextPlugin} from '@genkit-ai/next';

export const ai = genkit({
  plugins: [
    // Removed: nextPlugin(),
    googleAI(),
  ],
  model: 'googleai/gemini-2.0-flash',
});
