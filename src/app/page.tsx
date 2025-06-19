
'use client';

import React, { useState, useEffect } from 'react';
import AppHeader from '@/components/AppHeader';
import ConfigurationPanel from '@/components/ConfigurationPanel';
import ModeSwitcher from '@/components/ModeSwitcher';
import InteractiveMode from '@/components/interactive/InteractiveMode';
import BatchMode from '@/components/batch/BatchMode';
import DownloadPanel from '@/components/DownloadPanel';
import { useToast } from "@/hooks/use-toast";
import { compareResponses } from '@/ai/flows/compare-responses';
import { evaluateResponse } from '@/ai/flows/evaluate-response';
import type { AppConfig, ApiConfig, ConversationTurn, ProcessedBatchItem, EvaluationMode, BatchFileItem } from '@/types';
import { Sheet } from '@/components/ui/sheet';

const initialApiConfig: ApiConfig = {
  temperature: 0.7,
  topK: 40,
  maxOutputTokens: 1024,
};

const initialAppConfig: AppConfig = {
  systemInstruction: 'You are a helpful AI assistant.',
  promptATemplate: 'User query: {{prompt}}\n\nRespond to the user query.',
  promptBTemplate: 'User query: {{prompt}}\n\nRespond to the user query, but try to be more concise.',
  apiConfig: initialApiConfig,
};

// Helper to recursively find a string value for a 'prompt' key
function findNestedPromptString(obj: any): string | null {
  if (typeof obj !== 'object' || obj === null) {
    return null;
  }

  if (Object.prototype.hasOwnProperty.call(obj, 'prompt') && typeof obj.prompt === 'string') {
    return obj.prompt;
  }

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const nestedResult = findNestedPromptString(obj[key]);
      if (nestedResult !== null) {
        return nestedResult;
      }
    }
  }
  return null;
}

function getCleanedPromptString(promptInput: any): string {
  if (promptInput === null || promptInput === undefined) {
    return "";
  }
  if (typeof promptInput === 'string') {
    return promptInput;
  }
  if (typeof promptInput === 'number' || typeof promptInput === 'boolean') {
    return String(promptInput);
  }
  if (
    typeof promptInput === 'object' &&
    promptInput !== null &&
    Object.keys(promptInput).length === 1 &&
    Object.prototype.hasOwnProperty.call(promptInput, 'prompt') &&
    typeof promptInput.prompt === 'string'
  ) {
    return promptInput.prompt || "";
  }
  
  if (typeof promptInput === 'object' && promptInput !== null) {
    return "[Invalid Prompt Structure]";
  }
  return String(promptInput);
}


function ensureStringContent(content: any, defaultString: string = "No content provided"): string {
  if (content === null || content === undefined) {
    return defaultString;
  }
  if (typeof content === 'string') {
    return content || defaultString;
  }
  if (typeof content === 'number' || typeof content === 'boolean') {
    return String(content);
  }
  if (
    typeof content === 'object' &&
    content !== null &&
    Object.keys(content).length === 1 &&
    Object.prototype.hasOwnProperty.call(content, 'prompt') &&
    typeof content.prompt === 'string'
  ) {
    return content.prompt || defaultString;
  }
  
  if (typeof content === 'object' && content !== null) {
     try {
        const stringified = JSON.stringify(content);
        if (stringified === '{}' && Object.keys(content).length > 0) {
          return `[Object Content (keys: ${Object.keys(content).join(', ')})]`;
        } else if (stringified === '{}' && Object.keys(content).length === 0) {
           return "[Empty Object Content]";
        }
        return stringified;
      } catch {
        return "[Unstringifiable Object Content]";
      }
  }
  return String(content) || defaultString;
}


const getSafeToastDescription = (error: any): string => {
  if (error === null || error === undefined) {
    return "An unknown error occurred.";
  }
  if (typeof error === 'string') return error || "An unknown error occurred.";
  if (typeof error === 'number' || typeof error === 'boolean') return String(error);

  let potentialMessageSource = error;
  if (error instanceof Error && typeof error.message === 'string') {
    potentialMessageSource = error.message;
  }
  
  if (typeof potentialMessageSource === 'string') {
    return potentialMessageSource || "An unknown error occurred.";
  }

  if (typeof potentialMessageSource === 'object' && potentialMessageSource !== null) {
    if (Object.keys(potentialMessageSource).length === 1 &&
        Object.prototype.hasOwnProperty.call(potentialMessageSource, 'prompt') &&
        typeof potentialMessageSource.prompt === 'string') {
      return potentialMessageSource.prompt || "Error: Malformed prompt object in error.";
    }
    
    const nestedPrompt = findNestedPromptString(potentialMessageSource);
    if (nestedPrompt !== null && typeof nestedPrompt === 'string') {
      return nestedPrompt || "Error: Empty nested prompt in error object.";
    }
    
    try {
      const stringified = JSON.stringify(potentialMessageSource);
      if (stringified === '{}' && Object.keys(potentialMessageSource).length > 0) {
        return `[Object Error (keys: ${Object.keys(potentialMessageSource).join(', ')})]`;
      } else if (stringified === '{}' && Object.keys(potentialMessageSource).length === 0) {
        return "[Empty Error Object]";
      }
      return stringified;
    } catch {
      return "[Unstringifiable Error Object]";
    }
  }
  
  const finalMessage = String(potentialMessageSource);
  return finalMessage || "An unknown error occurred.";
};

function forceStringOrVerySpecificPlaceholder(value: any, fieldName: string): string {
  if (value === null || value === undefined) {
    return `[${fieldName}: VALUE_IS_NULL_OR_UNDEFINED]`;
  }
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (typeof value === 'object') {
    if (Object.keys(value).length === 1 && Object.prototype.hasOwnProperty.call(value, 'prompt') && typeof value.prompt === 'string') {
      return value.prompt || `[${fieldName}: EMPTY_PROMPT_IN_OBJECT]`;
    }
    const keys = Object.keys(value);
    if (keys.length === 0) {
        return `[${fieldName}: UNEXPECTED_EMPTY_OBJECT_ENCOUNTERED]`;
    }
    return `[${fieldName}: UNEXPECTED_OBJECT_STRUCTURE_ENCOUNTERED (keys: ${keys.join(', ')})]`;
  }
  return `[${fieldName}: UNKNOWN_DATA_TYPE_ENCOUNTERED_(${typeof value})]`;
}

const getSafeConfigString = (value: any, fieldNameForPlaceholder: string): string => {
  if (value === null || value === undefined) {
    return ""; 
  }
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'object' &&
      value !== null && 
      Object.prototype.hasOwnProperty.call(value, 'prompt') &&
      typeof value.prompt === 'string' &&
      Object.keys(value).length === 1) {
    return value.prompt || `[${fieldNameForPlaceholder}_HAD_EMPTY_PROMPT_IN_OBJECT]`;
  }
  if (typeof value === 'object' && value !== null) { 
    const keys = Object.keys(value);
    if (keys.length === 0) {
      return `[${fieldNameForPlaceholder}_WAS_EMPTY_OBJECT]`;
    }
    return `[${fieldNameForPlaceholder}_WAS_UNEXPECTED_OBJECT_TYPE (keys: ${keys.join(', ')})]`;
  }
  return String(value);
};


export default function Home() {
  const [mode, setMode] = useState<EvaluationMode>('interactive');
  const [appConfig, setAppConfig] = useState<AppConfig>(initialAppConfig);
  const [isConfigPanelOpen, setIsConfigPanelOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [batchIsLoading, setBatchIsLoading] = useState(false);
  const [batchProgress, setBatchProgress] = useState(0);

  const [interactiveHistory, setInteractiveHistory] = useState<ConversationTurn[]>([]);
  const [batchResults, setBatchResults] = useState<ProcessedBatchItem[]>([]);

  const { toast } = useToast();

  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);

  const interpolatePrompt = (template: string, userPrompt: string): string => {
    return template.replace(/\{\{prompt\}\}/g, userPrompt);
  };

  const handleInteractiveSubmit = async (userInput: string | { prompt: string }) => {
    setIsLoading(true);
    
    let cleanedUserInput = getCleanedPromptString(userInput);
    let userPromptForState = forceStringOrVerySpecificPlaceholder(cleanedUserInput, 'UserPrompt_Interactive');

    try {
      const fullPromptA = interpolatePrompt(appConfig.promptATemplate, userPromptForState);
      const fullPromptB = interpolatePrompt(appConfig.promptBTemplate, userPromptForState);

      const responses = await compareResponses({
        promptA: fullPromptA,
        promptB: fullPromptB,
        systemInstruction: appConfig.systemInstruction,
        ...appConfig.apiConfig,
      });

      let finalResponseA = forceStringOrVerySpecificPlaceholder(responses.responseA, 'ResponseA_Interactive');
      let finalResponseB = forceStringOrVerySpecificPlaceholder(responses.responseB, 'ResponseB_Interactive');
      
      const evaluationResult = await evaluateResponse({
        prompt: userPromptForState,
        responseA: finalResponseA,
        responseB: finalResponseB,
      });
      
      let finalEvaluation = forceStringOrVerySpecificPlaceholder(evaluationResult.evaluation, 'Evaluation_Interactive');

      if (typeof userPromptForState === 'object' && userPromptForState !== null) userPromptForState = `[FINAL_OVERRIDE_USER_PROMPT_INTERACTIVE_WAS_OBJECT (${Object.keys(userPromptForState).join(',')})]`;
      if (typeof finalResponseA === 'object' && finalResponseA !== null) finalResponseA = `[FINAL_OVERRIDE_RESPONSE_A_INTERACTIVE_WAS_OBJECT (${Object.keys(finalResponseA).join(',')})]`;
      if (typeof finalResponseB === 'object' && finalResponseB !== null) finalResponseB = `[FINAL_OVERRIDE_RESPONSE_B_INTERACTIVE_WAS_OBJECT (${Object.keys(finalResponseB).join(',')})]`;
      if (typeof finalEvaluation === 'object' && finalEvaluation !== null) finalEvaluation = `[FINAL_OVERRIDE_EVALUATION_INTERACTIVE_WAS_OBJECT (${Object.keys(finalEvaluation).join(',')})]`;
      
      const newTurn: ConversationTurn = {
        id: crypto.randomUUID(),
        userPrompt: userPromptForState,
        responseA: finalResponseA,
        responseB: finalResponseB,
        evaluation: finalEvaluation,
        timestamp: new Date(),
      };
      setInteractiveHistory(prev => [newTurn, ...prev]);

    } catch (error) {
      if (isClient) {
        toast({
          variant: "destructive",
          title: "Evaluation Error",
          description: getSafeToastDescription(error),
        });
      }
    }
    setIsLoading(false);
  };

  const handleProcessBatch = async (fileContent: BatchFileItem[]) => {
    setBatchIsLoading(true);
    setBatchResults([]);
    setBatchProgress(0);
    const results: ProcessedBatchItem[] = [];

    for (let i = 0; i < fileContent.length; i++) {
      const item = fileContent[i];
      
      let cleanedItemPrompt = getCleanedPromptString(item.prompt);
      let promptForState = forceStringOrVerySpecificPlaceholder(cleanedItemPrompt, 'Prompt_BatchItem');
      let itemIdForState = forceStringOrVerySpecificPlaceholder(String(item.id), 'ID_BatchItem');


      try {
        const fullPromptA = interpolatePrompt(appConfig.promptATemplate, promptForState);
        const fullPromptB = interpolatePrompt(appConfig.promptBTemplate, promptForState);

        const responses = await compareResponses({
          promptA: fullPromptA,
          promptB: fullPromptB,
          systemInstruction: appConfig.systemInstruction,
          ...appConfig.apiConfig,
        });
        
        let finalResponseA = forceStringOrVerySpecificPlaceholder(responses.responseA, 'ResponseA_BatchItem');
        let finalResponseB = forceStringOrVerySpecificPlaceholder(responses.responseB, 'ResponseB_BatchItem');

        const evaluationResult = await evaluateResponse({
          prompt: promptForState,
          responseA: finalResponseA,
          responseB: finalResponseB,
        });

        let finalEvaluation = forceStringOrVerySpecificPlaceholder(evaluationResult.evaluation, 'Evaluation_BatchItem');
        
        if (typeof itemIdForState === 'object' && itemIdForState !== null) itemIdForState = `[FINAL_OVERRIDE_BATCH_ID_WAS_OBJECT (${Object.keys(itemIdForState).join(',')})]`;
        if (typeof promptForState === 'object' && promptForState !== null) promptForState = `[FINAL_OVERRIDE_BATCH_PROMPT_WAS_OBJECT (${Object.keys(promptForState).join(',')})]`;
        if (typeof finalResponseA === 'object' && finalResponseA !== null) finalResponseA = `[FINAL_OVERRIDE_BATCH_RSPA_WAS_OBJECT (${Object.keys(finalResponseA).join(',')})]`;
        if (typeof finalResponseB === 'object' && finalResponseB !== null) finalResponseB = `[FINAL_OVERRIDE_BATCH_RSPB_WAS_OBJECT (${Object.keys(finalResponseB).join(',')})]`;
        if (typeof finalEvaluation === 'object' && finalEvaluation !== null) finalEvaluation = `[FINAL_OVERRIDE_BATCH_EVAL_WAS_OBJECT (${Object.keys(finalEvaluation).join(',')})]`;
        
        results.push({
          id: itemIdForState,
          prompt: promptForState,
          responseA: finalResponseA,
          responseB: finalResponseB,
          evaluation: finalEvaluation,
          timestamp: new Date(),
        });

      } catch (error) {
        let errorDescriptionAttempt = getSafeToastDescription(error);
        let errorDescriptionForState = forceStringOrVerySpecificPlaceholder(errorDescriptionAttempt, 'ErrorDesc_BatchItem');
        
        if (typeof itemIdForState === 'object' && itemIdForState !== null) itemIdForState = `[FINAL_OVERRIDE_BATCH_ID_ERR_PATH_WAS_OBJECT (${Object.keys(itemIdForState).join(',')})]`;
        if (typeof promptForState === 'object' && promptForState !== null) promptForState = `[FINAL_OVERRIDE_BATCH_PROMPT_ERR_PATH_WAS_OBJECT (${Object.keys(promptForState).join(',')})]`;
        if (typeof errorDescriptionForState === 'object' && errorDescriptionForState !== null) errorDescriptionForState = `[FINAL_OVERRIDE_BATCH_ERR_DESC_WAS_OBJECT (${Object.keys(errorDescriptionForState).join(',')})]`;
        
        results.push({
          id: itemIdForState,
          prompt: promptForState,
          error: errorDescriptionForState,
          timestamp: new Date(),
        });
        if (isClient) {
           toast({
            variant: "destructive",
            title: `Error processing item ${itemIdForState}`,
            description: errorDescriptionForState,
          });
        }
      }
      setBatchProgress(((i + 1) / fileContent.length) * 100);
      setBatchResults([...results]); 
    }

    setBatchIsLoading(false);
     if (isClient) {
        toast({
          title: "Batch Processing Complete",
          description: `${results.length} prompts evaluated.`,
        });
      }
  };
  
  const sanitizedAppConfigForPanel: AppConfig = {
    systemInstruction: getSafeConfigString(appConfig.systemInstruction, 'SystemInstruction'),
    promptATemplate: getSafeConfigString(appConfig.promptATemplate, 'PromptATemplate'),
    promptBTemplate: getSafeConfigString(appConfig.promptBTemplate, 'PromptBTemplate'),
    apiConfig: {
        temperature: appConfig.apiConfig.temperature,
        topK: appConfig.apiConfig.topK,
        maxOutputTokens: appConfig.apiConfig.maxOutputTokens,
    },
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Sheet open={isConfigPanelOpen} onOpenChange={setIsConfigPanelOpen}>
        <AppHeader />
        <ConfigurationPanel
          config={sanitizedAppConfigForPanel}
          onConfigChange={setAppConfig}
        />
      </Sheet>

      <ModeSwitcher currentMode={mode} onModeChange={setMode} />

      <main className="flex-grow container mx-auto w-full max-w-7xl flex flex-col overflow-hidden">
        {mode === 'interactive' ? (
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

      <footer className="container mx-auto w-full max-w-7xl py-2 sticky bottom-0 bg-background/80 backdrop-blur-sm border-t">
         <DownloadPanel
            mode={mode}
            interactiveHistory={interactiveHistory}
            batchResults={batchResults}
            isDisabled={isLoading || batchIsLoading}
          />
      </footer>
    </div>
  );
}
    

    



