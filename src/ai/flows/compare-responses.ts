
'use server';
/**
 * @fileOverview A flow to compare responses from two different prompts or model configurations.
 * THIS FLOW IS NO LONGER USED as of the new AppConfig structure.
 * Direct ai.generate calls are made in page.tsx based on runMode.
 * This file can be deprecated or removed. For now, it's left as is but unused.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Original Schemas - these are not aligned with the new AppConfig structure
const OriginalCompareResponsesInputSchema = z.object({
  promptA: z.string().describe('The first prompt to be evaluated.'),
  promptB: z.string().describe('The second prompt to be evaluated.'),
  systemInstruction: z.string().optional().describe('System instruction for the LLM.'),
  temperature: z.number().optional().describe('The temperature to use for the LLM.'),
  topK: z.number().optional().describe('The top-k parameter to use for the LLM.'),
  maxOutputTokens: z.number().optional().describe('The maximum number of output tokens to generate.'),
});
export type OriginalCompareResponsesInput = z.infer<typeof OriginalCompareResponsesInputSchema>;

const OriginalCompareResponsesOutputSchema = z.object({
  responseA: z.string().describe('The response from the first prompt.'),
  responseB: z.string().describe('The response from the second prompt.'),
});
export type OriginalCompareResponsesOutput = z.infer<typeof OriginalCompareResponsesOutputSchema>;

// The flow below is based on the old structure and is NOT USED with the new AppConfig.
export async function compareResponses(input: OriginalCompareResponsesInput): Promise<OriginalCompareResponsesOutput> {
  // This flow is deprecated. Direct ai.generate calls are made from page.tsx.
  console.warn("compareResponses flow is deprecated and should not be called directly with the new AppConfig structure.");
  
  // Fallback or error for unexpected calls
  const modelConfig = {
    temperature: input.temperature,
    topK: input.topK,
    maxOutputTokens: input.maxOutputTokens,
  };
  const systemInstruction = input.systemInstruction;

  const [responseA, responseB] = await Promise.all([
    ai.generate({
      prompt: input.promptA,
      config: modelConfig,
      systemInstruction: systemInstruction,
    }).then(res => res.text),
    ai.generate({
      prompt: input.promptB,
      config: modelConfig,
      systemInstruction: systemInstruction,
    }).then(res => res.text),
  ]);

  return {
    responseA: responseA!,
    responseB: responseB!,
  };
}

// The defineFlow below is also deprecated for the same reasons.
const compareResponsesFlow = ai.defineFlow(
  {
    name: 'compareResponsesFlow_DEPRECATED', // Renamed to indicate deprecation
    inputSchema: OriginalCompareResponsesInputSchema,
    outputSchema: OriginalCompareResponsesOutputSchema,
  },
  async input => {
    const modelConfig = {
      temperature: input.temperature,
      topK: input.topK,
      maxOutputTokens: input.maxOutputTokens,
    };
    const systemInstruction = input.systemInstruction;

    const [responseA, responseB] = await Promise.all([
      ai.generate({
        prompt: input.promptA,
        config: modelConfig,
        systemInstruction: systemInstruction,
      }).then(res => res.text),
      ai.generate({
        prompt: input.promptB,
        config: modelConfig,
        systemInstruction: systemInstruction,
      }).then(res => res.text),
    ]);

    return {
      responseA: responseA!,
      responseB: responseB!,
    };
  }
);
