
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
  error: z.string().optional().describe('An error message if the generation failed.'),
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
    try {
      // Clean the config to remove any null/undefined properties before passing to Genkit
      const cleanedApiConfig = Object.fromEntries(
        Object.entries(input.apiConfig).filter(([_, v]) => v !== undefined && v !== null)
      );

      const response = await ai.generate({
        prompt: input.prompt,
        systemInstruction: input.systemInstruction,
        config: cleanedApiConfig, // Use the cleaned config
      });
      
      const textOutput = (response && typeof response.text === 'string') ? response.text : "";

      if (response.usage?.finishReason && response.usage.finishReason !== 'STOP' && response.usage.finishReason !== 'UNKNOWN') {
           let detail = `Text generation failed. Finish Reason: ${response.usage.finishReason}.`;
           if (response.usage.finishMessage) {
               detail += ` Message: ${response.usage.finishMessage}.`;
           }
           console.error(detail, "Input prompt:", input.prompt.substring(0,500), "Full response usage:", response.usage);
           return { text: '', error: detail };
      }
      
      return { text: textOutput };
    } catch (e: any) {
      console.error("Error in generateTextFlow's ai.generate call or subsequent processing:", e);
      const errorMessage = e?.message ?? 'An unknown error occurred during the text generation flow.';
      return { text: '', error: String(errorMessage) };
    }
  }
);
