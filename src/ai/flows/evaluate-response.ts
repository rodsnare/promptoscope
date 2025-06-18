'use server';

/**
 * @fileOverview Evaluates a response given a prompt and two model outputs.
 *
 * - evaluateResponse - A function that handles the evaluation process.
 * - EvaluateResponseInput - The input type for the evaluateResponse function.
 * - EvaluateResponseOutput - The return type for the evaluateResponse function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EvaluateResponseInputSchema = z.object({
  prompt: z.string().describe('The prompt that was submitted to the models.'),
  responseA: z.string().describe('The response from model A.'),
  responseB: z.string().describe('The response from model B.'),
});
export type EvaluateResponseInput = z.infer<typeof EvaluateResponseInputSchema>;

const EvaluateResponseOutputSchema = z.object({
  evaluation: z.string().describe('The evaluation of the responses.'),
});
export type EvaluateResponseOutput = z.infer<typeof EvaluateResponseOutputSchema>;

export async function evaluateResponse(input: EvaluateResponseInput): Promise<EvaluateResponseOutput> {
  return evaluateResponseFlow(input);
}

const prompt = ai.definePrompt({
  name: 'evaluateResponsePrompt',
  input: {schema: EvaluateResponseInputSchema},
  output: {schema: EvaluateResponseOutputSchema},
  prompt: `You are an expert evaluator of LLM responses. You are given a prompt and two responses, one from model A and one from model B. You should evaluate the responses and provide a detailed explanation of which response is better and why.\n\nPrompt: {{{prompt}}}\nResponse A: {{{responseA}}}\nResponse B: {{{responseB}}}`,
});

const evaluateResponseFlow = ai.defineFlow(
  {
    name: 'evaluateResponseFlow',
    inputSchema: EvaluateResponseInputSchema,
    outputSchema: EvaluateResponseOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
