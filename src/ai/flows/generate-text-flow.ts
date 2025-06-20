
'use server';
/**
 * @fileOverview A flow for generating text using a configured model.
 *
 * - generateText - A function that calls the Genkit AI to generate text.
 * - GenerateTextInput - The input type for the generateText function.
 * - GenerateTextOutput - The return type for the generateText function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { ApiConfig } from '@/types';

const GenerateTextInputSchema = z.object({
  prompt: z.string().describe('The prompt to send to the model.'),
  systemInstruction: z.string().optional().describe('System instruction for the LLM.'),
  apiConfig: z.custom<ApiConfig>().describe('API configuration for the LLM.'),
});
export type GenerateTextInput = z.infer<typeof GenerateTextInputSchema>;

const GenerateTextOutputSchema = z.object({
  text: z.string().describe('The generated text response from the model.'),
});
export type GenerateTextOutput = z.infer<typeof GenerateTextOutputSchema>;

export async function generateText(input: GenerateTextInput): Promise<GenerateTextOutput> {
  return generateTextFlow(input);
}

const generateTextFlow = ai.defineFlow(
  {
    name: 'generateTextFlow',
    inputSchema: GenerateTextInputSchema,
    outputSchema: GenerateTextOutputSchema,
  },
  async (input) => {
    const response = await ai.generate({
      prompt: input.prompt,
      systemInstruction: input.systemInstruction,
      config: input.apiConfig,
    });
    
    const textOutput = response.text === undefined || response.text === null ? "" : response.text;

    if (response.usage?.finishReason && response.usage.finishReason !== 'STOP' && response.usage.finishReason !== 'UNKNOWN') {
         let detail = `Text generation failed. Finish Reason: ${response.usage.finishReason}.`;
         if (response.usage.finishMessage) {
             detail += ` Message: ${response.usage.finishMessage}.`;
         }
         console.error(detail, "Input prompt:", input.prompt.substring(0,500), "Full response usage:", response.usage);
         throw new Error(detail);
    }
    
    return { text: textOutput };
  }
);
