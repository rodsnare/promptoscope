
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

const evaluateResponseFlow = ai.defineFlow(
  {
    name: 'evaluateResponseFlow',
    inputSchema: EvaluateResponseInputSchema,
    outputSchema: EvaluateResponseOutputSchema,
  },
  async (input) => {
    try {
      const evaluatorPrompt = ai.definePrompt({
          name: 'runtimeEvaluateResponsePrompt',
          input: { schema: EvaluateResponseInputSchema },
          output: { schema: EvaluateResponseOutputSchema },
          prompt: input.evaluatorPromptTemplate,
          config: input.evaluatorApiConfig,
      });

      const evaluatorPromptResult = await evaluatorPrompt({
          prompt: input.prompt,
          responseA: input.responseA,
          responseB: input.responseB,
          evaluatorPromptTemplate: input.evaluatorPromptTemplate, // Pass through, though prompt object uses its own copy
          evaluatorApiConfig: input.evaluatorApiConfig, // Pass through for prompt object
      });

      const output = evaluatorPromptResult.output;
      const rawText = evaluatorPromptResult.text; // Use .text for raw string
      const usage = evaluatorPromptResult.usage;

      if (output && typeof output.evaluation === 'string') {
          return output;
      } else {
          // This case means the LLM responded, but not in the expected structured format, or evaluation was empty
          const message = "Evaluator LLM response issue.";
          console.error(
              message,
              { output, rawText, usage, input } // Log for debugging
          );
          let detail = "Evaluator LLM response did not conform to the expected schema or was empty.";
          if (rawText) {
              detail += ` Raw response snippet: ${rawText.substring(0, 200)}${rawText.length > 200 ? '...' : ''}`;
          }
          if (usage?.finishReason && usage.finishReason !== 'STOP') {
               detail += ` Finish Reason: ${usage.finishReason}.`;
               if (usage.finishMessage) {
                   detail += ` Message: ${usage.finishMessage}.`;
               }
          } else if (!output) {
              detail += " The structured output was not generated."
          }
          throw new Error(detail);
      }
    } catch (e: any) {
      console.error("Error in evaluateResponseFlow's prompt execution or subsequent processing:", e);
      let simpleErrorMessage = "Unknown error in evaluation flow execution.";
      if (e && typeof e.message === 'string') {
        simpleErrorMessage = e.message;
      } else if (typeof e === 'string') {
        simpleErrorMessage = e;
      }
      // Ensure the message is definitely a string
      simpleErrorMessage = String(simpleErrorMessage);
      throw new Error(`Evaluation Flow Failed: ${simpleErrorMessage.substring(0, 300)}`);
    }
  }
);
