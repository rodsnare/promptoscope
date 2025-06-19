
'use server';

/**
 * @fileOverview Evaluates responses given a prompt, model outputs, and evaluator configuration.
 *
 * - evaluateResponse - A function that handles the evaluation process.
 * - EvaluateResponseInput - The input type for the evaluateResponse function.
 * - EvaluateResponseOutput - The return type for the evaluateResponse function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { ApiConfig } from '@/types'; // Import ApiConfig

const EvaluateResponseInputSchema = z.object({
  prompt: z.string().describe('The original user prompt that was submitted to the models.'),
  responseA: z.string().nullable().describe('The response from model A. Can be null if not generated.'),
  responseB: z.string().nullable().describe('The response from model B. Can be null if not generated.'),
  evaluatorPromptTemplate: z.string().describe('The prompt template for the evaluator LLM.'),
  evaluatorApiConfig: z.custom<ApiConfig>().describe('API configuration for the evaluator LLM.'),
});
export type EvaluateResponseInput = z.infer<typeof EvaluateResponseInputSchema>;

const EvaluateResponseOutputSchema = z.object({
  evaluation: z.string().describe('The evaluation of the responses from the evaluator LLM.'),
});
export type EvaluateResponseOutput = z.infer<typeof EvaluateResponseOutputSchema>;

export async function evaluateResponse(input: EvaluateResponseInput): Promise<EvaluateResponseOutput> {
  return evaluateResponseFlow(input);
}

// This prompt is now defined dynamically within the flow based on the input template
// const staticEvaluatorPrompt = ai.definePrompt({ ... });

const evaluateResponseFlow = ai.defineFlow(
  {
    name: 'evaluateResponseFlow',
    inputSchema: EvaluateResponseInputSchema,
    outputSchema: EvaluateResponseOutputSchema,
  },
  async (input) => {
    // Create a dynamic prompt instance for evaluation
    const evaluatorPrompt = ai.definePrompt({
        name: 'runtimeEvaluateResponsePrompt', // Give it a unique name for potential tracing
        input: { schema: EvaluateResponseInputSchema }, // It still takes the full input for templating
        output: { schema: EvaluateResponseOutputSchema },
        prompt: input.evaluatorPromptTemplate, // Use the template passed in the input
        config: input.evaluatorApiConfig, // Use the API config passed in the input
    });

    // Call the dynamic prompt with the necessary parts of the input for templating
    const { output } = await evaluatorPrompt({
        prompt: input.prompt, // userPrompt for the template
        responseA: input.responseA,
        responseB: input.responseB,
        // These are not directly used by the template but are part of the input schema
        evaluatorPromptTemplate: input.evaluatorPromptTemplate, 
        evaluatorApiConfig: input.evaluatorApiConfig,
    });
    return output!;
  }
);
