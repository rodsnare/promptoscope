
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
      const { model, ...restOfConfig } = input.apiConfig;
      // Prepend 'googleai/' if it's not already there
      const prefixedModel = model && !model.startsWith('googleai/') ? `googleai/${model}` : model;

      // Clean the config to remove any null/undefined properties before passing to Genkit
      const cleanedApiConfig = Object.fromEntries(
        Object.entries(restOfConfig).filter(([_, v]) => v !== undefined && v !== null)
      );

      // Define a prompt dynamically. This pattern is more reliable for applying system instructions.
      const textGenPrompt = ai.definePrompt({
        name: 'runtimeTextGenerationPrompt',
        system: input.systemInstruction, // Use the dedicated 'system' parameter.
        prompt: input.prompt, // The prompt is already finalized, no templating needed here.
        model: prefixedModel,
        config: cleanedApiConfig,
      });

      // Call the newly defined prompt.
      const response = await textGenPrompt();
      
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
      console.error("Error in generateTextFlow's execution:", e);
      const errorMessage = e?.message ?? 'An unknown error occurred during the text generation flow.';
      return { text: '', error: String(errorMessage) };
    }
  }
);
