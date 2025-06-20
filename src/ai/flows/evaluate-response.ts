
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
  error: z.string().optional().describe('An error message if the evaluation failed.'),
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
          // This output schema is for the prompt's structured output.
          output: { schema: z.object({ evaluation: z.string() }) },
          prompt: input.evaluatorPromptTemplate,
          config: input.evaluatorApiConfig,
      });

      const evaluatorPromptResult = await evaluatorPrompt({
          prompt: input.prompt,
          responseA: input.responseA,
          responseB: input.responseB,
          evaluatorPromptTemplate: input.evaluatorPromptTemplate, 
          evaluatorApiConfig: input.evaluatorApiConfig, 
      });

      const output = evaluatorPromptResult.output;
      const rawText = evaluatorPromptResult.text; 
      const usage = evaluatorPromptResult.usage;

      if (output && typeof output.evaluation === 'string') {
          // Success case, conform to flow's output schema.
          return { evaluation: output.evaluation };
      } else {
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
          console.error(
              "Evaluator LLM response issue.",
              { output, rawText, usage, input, detailMessage: detail } 
          );
          // Return error in the response object
          return { evaluation: '', error: detail };
      }
    } catch (e: any) {
      // Log the full error server-side for detailed debugging
      console.error("Error in evaluateResponseFlow's prompt execution or subsequent processing:", e); 
      // Return the error message in the output object instead of throwing
      const errorMessage = e?.message ?? 'An unknown error occurred during the evaluation flow.';
      return { evaluation: '', error: String(errorMessage) };
    }
  }
);
