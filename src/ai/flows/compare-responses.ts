'use server';
/**
 * @fileOverview A flow to compare responses from two different prompts or model configurations.
 *
 * - compareResponses - A function that takes two prompts and returns their responses for comparison.
 * - CompareResponsesInput - The input type for the compareResponses function.
 * - CompareResponsesOutput - The return type for the compareResponses function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CompareResponsesInputSchema = z.object({
  promptA: z.string().describe('The first prompt to be evaluated.'),
  promptB: z.string().describe('The second prompt to be evaluated.'),
  systemInstruction: z.string().optional().describe('System instruction for the LLM.'),
  temperature: z.number().optional().describe('The temperature to use for the LLM.'),
  topK: z.number().optional().describe('The top-k parameter to use for the LLM.'),
  maxOutputTokens: z.number().optional().describe('The maximum number of output tokens to generate.'),
});
export type CompareResponsesInput = z.infer<typeof CompareResponsesInputSchema>;

const CompareResponsesOutputSchema = z.object({
  responseA: z.string().describe('The response from the first prompt.'),
  responseB: z.string().describe('The response from the second prompt.'),
});
export type CompareResponsesOutput = z.infer<typeof CompareResponsesOutputSchema>;

export async function compareResponses(input: CompareResponsesInput): Promise<CompareResponsesOutput> {
  return compareResponsesFlow(input);
}

const compareResponsesFlow = ai.defineFlow(
  {
    name: 'compareResponsesFlow',
    inputSchema: CompareResponsesInputSchema,
    outputSchema: CompareResponsesOutputSchema,
  },
  async input => {
    // Define a shared configuration object with optional parameters
    const sharedConfig = {
      temperature: input.temperature,
      topK: input.topK,
      maxOutputTokens: input.maxOutputTokens,
      systemInstruction: input.systemInstruction
    };

    const [responseA, responseB] = await Promise.all([
      ai.generate({
        prompt: input.promptA,
        config: sharedConfig,
      }).then(res => res.text),
      ai.generate({
        prompt: input.promptB,
        config: sharedConfig,
      }).then(res => res.text),
    ]);

    return {
      responseA: responseA!,
      responseB: responseB!,
    };
  }
);
