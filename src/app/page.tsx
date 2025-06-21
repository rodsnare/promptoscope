
'use client';

import React, { useState, useEffect } from 'react';
import AppHeader from '@/components/AppHeader';
import ConfigurationPanel from '@/components/ConfigurationPanel';
import ModeSwitcher from '@/components/ModeSwitcher'; // This is for Interactive vs Batch UI
import InteractiveMode from '@/components/interactive/InteractiveMode';
import BatchMode from '@/components/batch/BatchMode';
import DownloadPanel from '@/components/DownloadPanel';
import { useToast } from "@/hooks/use-toast";
// import { compareResponses } from '@/ai/flows/compare-responses'; // Deprecated
import { evaluateResponse } from '@/ai/flows/evaluate-response';
import { generateText } from '@/ai/flows/generate-text-flow'; // Import the new flow
// import { ai } from '@/ai/genkit'; // No longer needed for direct model calls from client
import type { AppConfig, ConversationTurn, ProcessedBatchItem, EvaluationMode, BatchFileItem, EvaluationRunMode, ApiConfig, ModelProcessingConfig, EvaluatorConfig } from '@/types';
import { Sheet } from '@/components/ui/sheet';

const defaultApiConfig: ApiConfig = {
  model: 'googleai/gemini-1.5-flash-latest',
  temperature: 0.7,
  topK: 40,
  maxOutputTokens: 1024,
};

const initialModelAConfig: ModelProcessingConfig = {
  systemInstruction: 'You are Model A, a helpful AI assistant.',
  promptTemplate: 'User query: {{prompt}}\n\nRespond to the user query as Model A.',
  apiConfig: { ...defaultApiConfig },
};

const initialModelBConfig: ModelProcessingConfig = {
  systemInstruction: 'You are Model B, a concise AI assistant.',
  promptTemplate: 'User query: {{prompt}}\n\nRespond to the user query concisely as Model B.',
  apiConfig: { ...defaultApiConfig },
};

const initialEvaluatorConfig: EvaluatorConfig = {
  evaluationPromptTemplate: `You are an expert evaluator of LLM responses.
Original User Prompt: {{{prompt}}}
Response A: {{{responseA}}}
{{#if responseB}}
Response B: {{{responseB}}}
{{else}}
(Response B was not generated in this run)
{{/if}}
Based on the original prompt and the provided response(s), evaluate the quality of Response A. If Response B is present, compare Response A and Response B, and state which is better and why. Be specific.`,
  apiConfig: { ...defaultApiConfig, temperature: 0.5 }, // Evaluator might need different settings
};

const initialAppConfig: AppConfig = {
  runMode: 'a_vs_b',
  modelAConfig: initialModelAConfig,
  modelBConfig: initialModelBConfig,
  evaluatorConfig: initialEvaluatorConfig,
};

function getCleanedPromptString(promptInput: any): string {
  if (promptInput === null || promptInput === undefined) return "";
  if (typeof promptInput === 'string') return promptInput;
  if (typeof promptInput === 'number' || typeof promptInput === 'boolean') return String(promptInput);
  if (typeof promptInput === 'object' && Object.prototype.hasOwnProperty.call(promptInput, 'prompt') && typeof promptInput.prompt === 'string' && Object.keys(promptInput).length === 1) {
    return promptInput.prompt || "";
  }
  if (typeof promptInput === 'object' && promptInput !== null) return "[Invalid Prompt Structure]";
  return String(promptInput);
}

function forceStringOrVerySpecificPlaceholder(value: any, fieldName: string): string {
  if (value === null || value === undefined) return `[${fieldName}: VALUE_IS_NULL_OR_UNDEFINED]`;
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (typeof value === 'object') {
    if (Object.keys(value).length === 1 && Object.prototype.hasOwnProperty.call(value, 'prompt') && typeof value.prompt === 'string') {
      return value.prompt || `[${fieldName}: EMPTY_PROMPT_IN_OBJECT]`;
    }
    const keys = Object.keys(value);
    if (keys.length === 0) return `[${fieldName}: UNEXPECTED_EMPTY_OBJECT_ENCOUNTERED]`;
    return `[${fieldName}: UNEXPECTED_OBJECT_STRUCTURE_ENCOUNTERED (keys: ${keys.join(', ')})]`;
  }
  return `[${fieldName}: UNKNOWN_DATA_TYPE_ENCOUNTERED_(${typeof value})]`;
}

const getSafeToastDescription = (error: any): string => {
  console.error("Raw error object received by getSafeToastDescription:", error); // Log the raw error
  try {
    if (typeof error === 'string' && error.trim() !== '') {
      const msg = error.substring(0, 500);
      return msg + (error.length > 500 ? "..." : "");
    }
    if (error && typeof error.message === 'string' && error.message.trim() !== '') {
      const msg = error.message.substring(0, 500);
      return msg + (error.message.length > 500 ? "..." : "");
    }
    // Check for Genkit specific error structure if the above fails
    if (error && error.isGenkitError && error.data && typeof error.data.message === 'string' && error.data.message.trim() !== '') {
        const msg = error.data.message.substring(0,500);
        return msg + (error.data.message.length > 500 ? "..." : "");
    }
    // Attempt a more generic string conversion as a last resort for objects
    if (typeof error === 'object' && error !== null) {
        const genericMessage = String(error);
        if (genericMessage !== '[object Object]') { // Avoid unhelpful generic object string
            const msg = genericMessage.substring(0,500);
            return msg + (genericMessage.length > 500 ? "..." : "");
        }
    }
    return "An unexpected error occurred. Please check the browser console for more details.";
  } catch (e: any) {
    console.error("Error within getSafeToastDescription itself:", e);
    let recoveryMessage = "A critical error occurred while trying to display the original error. Check console.";
    if (e && typeof e.message === 'string') {
        recoveryMessage += ` (Processing error: ${e.message.substring(0,100)})`;
    }
    return recoveryMessage;
  }
};


export default function Home() {
  const [uiMode, setUiMode] = useState<EvaluationMode>('interactive'); // interactive vs batch
  const [appConfig, setAppConfig] = useState<AppConfig>(initialAppConfig);
  const [isConfigPanelOpen, setIsConfigPanelOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [batchIsLoading, setBatchIsLoading] = useState(false);
  const [batchProgress, setBatchProgress] = useState(0);

  const [interactiveHistory, setInteractiveHistory] = useState<ConversationTurn[]>([]);
  const [batchResults, setBatchResults] = useState<ProcessedBatchItem[]>([]);

  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);
  useEffect(() => { setIsClient(true); }, []);

  const interpolateTemplate = (template: string, userPrompt: string): string => {
    return template.replace(/\{\{prompt\}\}/g, userPrompt);
  };

  const handleInteractiveSubmit = async (userInput: string | { prompt: string }) => {
    setIsLoading(true);
    try {
      const cleanedUserPrompt = getCleanedPromptString(userInput);
      let userPromptForState = forceStringOrVerySpecificPlaceholder(cleanedUserPrompt, 'UserPrompt_Interactive');

      let responseA: string | null = null;
      let responseB: string | null = null;
      let evaluation: string | null = null;

      const { runMode, modelAConfig, modelBConfig, evaluatorConfig } = appConfig;

      if (runMode === 'a_only' || runMode === 'a_vs_b') {
        const fullPromptA = interpolateTemplate(modelAConfig.promptTemplate, userPromptForState);
        const genAResponse = await generateText({
          prompt: fullPromptA,
          systemInstruction: modelAConfig.systemInstruction,
          apiConfig: modelAConfig.apiConfig,
        });
        if (genAResponse.error) {
          if (isClient) toast({ variant: "destructive", title: "Model A Error", description: getSafeToastDescription(genAResponse.error) });
        } else {
          responseA = forceStringOrVerySpecificPlaceholder(genAResponse.text, 'ResponseA_Interactive');
        }
      }

      if (runMode === 'b_only' || runMode === 'a_vs_b') {
        const fullPromptB = interpolateTemplate(modelBConfig.promptTemplate, userPromptForState);
        const genBResponse = await generateText({
          prompt: fullPromptB,
          systemInstruction: modelBConfig.systemInstruction,
          apiConfig: modelBConfig.apiConfig,
        });
        if (genBResponse.error) {
          if (isClient) toast({ variant: "destructive", title: "Model B Error", description: getSafeToastDescription(genBResponse.error) });
        } else {
          responseB = forceStringOrVerySpecificPlaceholder(genBResponse.text, 'ResponseB_Interactive');
        }
      }
      
      if (responseA || responseB) {
        const evalResult = await evaluateResponse({
            prompt: userPromptForState, 
            responseA: responseA, 
            responseB: responseB, 
            evaluatorPromptTemplate: evaluatorConfig.evaluationPromptTemplate,
            evaluatorApiConfig: evaluatorConfig.apiConfig,
        });
        if (evalResult.error) {
          if (isClient) toast({ variant: "destructive", title: "Evaluation Error", description: getSafeToastDescription(evalResult.error) });
        } else {
          evaluation = forceStringOrVerySpecificPlaceholder(evalResult.evaluation, 'Evaluation_Interactive');
        }
      }
      
      const newTurn: ConversationTurn = {
        id: crypto.randomUUID(),
        userPrompt: userPromptForState,
        responseA,
        responseB,
        evaluation,
        timestamp: new Date(),
        runModeUsed: runMode,
      };
      setInteractiveHistory(prev => [newTurn, ...prev]);
    } catch (err) {
        if (isClient) toast({ variant: "destructive", title: "An Unexpected Error Occurred", description: getSafeToastDescription(err) });
        console.error("Caught error during interactive submission:", err);
    } finally {
        setIsLoading(false);
    }
  };

  const handleProcessBatch = async (fileContent: BatchFileItem[]) => {
    setBatchIsLoading(true);
    setBatchResults([]);
    setBatchProgress(0);
    const results: ProcessedBatchItem[] = [];
    const { runMode, modelAConfig, modelBConfig, evaluatorConfig } = appConfig;

    for (let i = 0; i < fileContent.length; i++) {
      const item = fileContent[i];
      let cleanedItemPrompt = getCleanedPromptString(item.prompt);
      let promptForState = forceStringOrVerySpecificPlaceholder(cleanedItemPrompt, 'Prompt_BatchItem');
      let itemIdForState = forceStringOrVerySpecificPlaceholder(String(item.id), 'ID_BatchItem');
      
      let responseA: string | null = null;
      let responseB: string | null = null;
      let evaluation: string | null = null;
      let processingError: string | undefined = undefined;
      
      try {
        if (runMode === 'a_only' || runMode === 'a_vs_b') {
          const fullPromptA = interpolateTemplate(modelAConfig.promptTemplate, promptForState);
          const genAResponse = await generateText({
            prompt: fullPromptA, systemInstruction: modelAConfig.systemInstruction, apiConfig: modelAConfig.apiConfig,
          });
          if (genAResponse.error) {
            processingError = `Model A Error: ${genAResponse.error}`;
            if (isClient) toast({ variant: "destructive", title: `Error on item ${itemIdForState}`, description: getSafeToastDescription(genAResponse.error) });
          } else {
            responseA = forceStringOrVerySpecificPlaceholder(genAResponse.text, 'ResponseA_BatchItem');
          }
        }

        if (!processingError && (runMode === 'b_only' || runMode === 'a_vs_b')) {
          const fullPromptB = interpolateTemplate(modelBConfig.promptTemplate, promptForState);
          const genBResponse = await generateText({
            prompt: fullPromptB, systemInstruction: modelBConfig.systemInstruction, apiConfig: modelBConfig.apiConfig,
          });
          if (genBResponse.error) {
            processingError = `Model B Error: ${genBResponse.error}`;
            if (isClient) toast({ variant: "destructive", title: `Error on item ${itemIdForState}`, description: getSafeToastDescription(genBResponse.error) });
          } else {
            responseB = forceStringOrVerySpecificPlaceholder(genBResponse.text, 'ResponseB_BatchItem');
          }
        }

        if (!processingError && (responseA || responseB)) {
          const evalResult = await evaluateResponse({
            prompt: promptForState, responseA, responseB,
            evaluatorPromptTemplate: evaluatorConfig.evaluationPromptTemplate,
            evaluatorApiConfig: evaluatorConfig.apiConfig,
          });
          if (evalResult.error) {
            if (isClient) toast({ variant: "destructive", title: `Evaluation error on item ${itemIdForState}`, description: getSafeToastDescription(evalResult.error) });
            evaluation = `Evaluation Error: ${evalResult.error}`;
          } else {
            evaluation = forceStringOrVerySpecificPlaceholder(evalResult.evaluation, 'Evaluation_BatchItem');
          }
        }
      } catch (err) {
        processingError = `A fatal error occurred processing this item: ${getSafeToastDescription(err)}`;
        if (isClient) toast({ variant: "destructive", title: `Fatal error on item ${itemIdForState}`, description: getSafeToastDescription(err) });
        console.error(`Caught fatal error processing batch item ${itemIdForState}:`, err);
      }
      
      results.push({
        id: itemIdForState, prompt: promptForState, 
        responseA, responseB, evaluation,
        error: processingError,
        timestamp: new Date(), runModeUsed: runMode,
      });

      setBatchProgress(((i + 1) / fileContent.length) * 100);
    }

    setBatchResults(results);
    setBatchIsLoading(false);
    if (isClient) {
      toast({ title: "Batch Processing Complete", description: `${results.length} prompts processed.` });
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Sheet open={isConfigPanelOpen} onOpenChange={setIsConfigPanelOpen}>
        <AppHeader runMode={appConfig.runMode} />
        <ConfigurationPanel
          config={appConfig} 
          onConfigChange={setAppConfig}
        />
      </Sheet>

      <ModeSwitcher currentMode={uiMode} onModeChange={setUiMode} />

      <main className="flex-grow container mx-auto w-full max-w-7xl flex flex-col overflow-hidden">
        {uiMode === 'interactive' ? (
          <InteractiveMode
            history={interactiveHistory}
            onSubmitPrompt={handleInteractiveSubmit}
            isLoading={isLoading}
          />
        ) : (
          <BatchMode
            batchResults={batchResults}
            onProcessBatch={handleProcessBatch}
            isLoading={batchIsLoading}
            progress={batchProgress}
          />
        )}
      </main>

      <DownloadPanel
        mode={uiMode}
        interactiveHistory={interactiveHistory}
        batchResults={batchResults}
        isDisabled={isLoading || batchIsLoading}
      />
    </div>
  );
}
