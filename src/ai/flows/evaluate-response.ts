
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

// This schema defines the specific data structure for the evaluation prompt template.
const PromptInputDataSchema = z.object({
  prompt: z.string().describe('The original user prompt that was submitted to the models.'),
  responseA: z.string().nullable().describe('The response from model A. Can be null if not generated.'),
  responseB: z.string().nullable().describe('The response from model B. Can be null if not generated.'),
});

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
      const { model, ...restOfConfig } = input.evaluatorApiConfig;
      // Prepend 'googleai/' if it's not already there
      const prefixedModel = model && !model.startsWith('googleai/') ? `googleai/${model}` : model;

      // Clean the config to remove any null/undefined properties before passing to Genkit
      const cleanedEvaluatorApiConfig = Object.fromEntries(
        Object.entries(restOfConfig).filter(([_, v]) => v !== undefined && v !== null)
      );

      const evaluatorPrompt = ai.definePrompt({
          name: 'runtimeEvaluateResponsePrompt',
          // Use the new, more specific schema for the prompt's input.
          input: { schema: PromptInputDataSchema },
          // This output schema is for the prompt's structured output.
          output: { schema: z.object({ evaluation: z.string() }) },
          prompt: input.evaluatorPromptTemplate,
          model: prefixedModel, // Use prefixed model from config
          config: cleanedEvaluatorApiConfig, // Use the cleaned config
      });

      // Pass only the data that the prompt template requires.
      const evaluatorPromptResult = await evaluatorPrompt({
          prompt: input.prompt,
          responseA: input.responseA,
          responseB: input.responseB,
      });

      const output = evaluatorPromptResult.output;
      const rawText = evaluatorPromptResult.text; 
      const usage = evaluatorPromptResult.usage;

      if (output && typeof output.evaluation === 'string') {
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
          return { evaluation: '', error: detail };
      }
    } catch (e: any) {
      console.error("Error in evaluateResponseFlow's prompt execution or subsequent processing:", e); 
      const errorMessage = e?.message ?? 'An unknown error occurred during the evaluation flow.';
      return { evaluation: '', error: String(errorMessage) };
    }
  }
);
