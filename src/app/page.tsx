
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
    return promptInput.prompt;
  }
  // For any other object type
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
  if (error instanceof Error && error.message) {
    potentialMessageSource = error.message;
  }
  
  if (typeof potentialMessageSource === 'string') {
    return potentialMessageSource || "An unknown error occurred.";
  }

  if (typeof potentialMessageSource === 'object' && potentialMessageSource !== null) {
    // Check for direct {prompt: "string"} structure first
    if (Object.keys(potentialMessageSource).length === 1 &&
        Object.prototype.hasOwnProperty.call(potentialMessageSource, 'prompt') &&
        typeof potentialMessageSource.prompt === 'string') {
      return potentialMessageSource.prompt || "Error: Malformed prompt object in error.";
    }
    
    const nestedPrompt = findNestedPromptString(potentialMessageSource);
    if (nestedPrompt !== null) {
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
      return value.prompt;
    }
    return `[${fieldName}: UNEXPECTED_OBJECT_STRUCTURE_ENCOUNTERED]`;
  }
  return `[${fieldName}: UNKNOWN_DATA_TYPE_ENCOUNTERED]`;
}


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
    const safeUserPrompt = typeof userPrompt === 'string' ? userPrompt : '[Invalid User Prompt for Interpolation]';
    return template.replace(/\{\{prompt\}\}/g, safeUserPrompt);
  };

  const handleInteractiveSubmit = async (userInput: string | { prompt: string }) => {
    setIsLoading(true);
    
    let userPromptForState = getCleanedPromptString(userInput);
    userPromptForState = forceStringOrVerySpecificPlaceholder(userPromptForState, 'UserPrompt');

    try {
      const fullPromptA = interpolatePrompt(appConfig.promptATemplate, userPromptForState);
      const fullPromptB = interpolatePrompt(appConfig.promptBTemplate, userPromptForState);

      const responses = await compareResponses({
        promptA: fullPromptA,
        promptB: fullPromptB,
        systemInstruction: appConfig.systemInstruction,
        ...appConfig.apiConfig,
      });

      const evaluationResult = await evaluateResponse({
        prompt: userPromptForState, 
        responseA: forceStringOrVerySpecificPlaceholder(responses.responseA, 'RawResponseAForEval'), 
        responseB: forceStringOrVerySpecificPlaceholder(responses.responseB, 'RawResponseBForEval'),
      });
      
      let finalResponseA = forceStringOrVerySpecificPlaceholder(responses.responseA, 'ResponseA');
      let finalResponseB = forceStringOrVerySpecificPlaceholder(responses.responseB, 'ResponseB');
      let finalEvaluation = forceStringOrVerySpecificPlaceholder(evaluationResult.evaluation, 'Evaluation');

      // Final override checks
      if (typeof userPromptForState === 'object' && userPromptForState !== null) userPromptForState = "[Object detected in userPromptForState override]";
      if (typeof finalResponseA === 'object' && finalResponseA !== null) finalResponseA = "[Object detected in finalResponseA override]";
      if (typeof finalResponseB === 'object' && finalResponseB !== null) finalResponseB = "[Object detected in finalResponseB override]";
      if (typeof finalEvaluation === 'object' && finalEvaluation !== null) finalEvaluation = "[Object detected in finalEvaluation override]";
      
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

    for (let i = 0;0 && i < fileContent.length; i++) {
      const item = fileContent[i];
      
      let userPromptForState = getCleanedPromptString(item.prompt);
      userPromptForState = forceStringOrVerySpecificPlaceholder(userPromptForState, 'BatchItemPrompt');
      
      let itemIdForState = forceStringOrVerySpecificPlaceholder(String(item.id), 'BatchItemID');

      try {
        const fullPromptA = interpolatePrompt(appConfig.promptATemplate, userPromptForState);
        const fullPromptB = interpolatePrompt(appConfig.promptBTemplate, userPromptForState);

        const responses = await compareResponses({
          promptA: fullPromptA,
          promptB: fullPromptB,
          systemInstruction: appConfig.systemInstruction,
          ...appConfig.apiConfig,
        });
        
        const evaluationResult = await evaluateResponse({
          prompt: userPromptForState, 
          responseA: forceStringOrVerySpecificPlaceholder(responses.responseA, 'RawResponseAForBatchEval'),
          responseB: forceStringOrVerySpecificPlaceholder(responses.responseB, 'RawResponseBForBatchEval'),
        });

        let finalResponseA = forceStringOrVerySpecificPlaceholder(responses.responseA, 'BatchResponseA');
        let finalResponseB = forceStringOrVerySpecificPlaceholder(responses.responseB, 'BatchResponseB');
        let finalEvaluation = forceStringOrVerySpecificPlaceholder(evaluationResult.evaluation, 'BatchEvaluation');
        
        // Final override checks
        if (typeof itemIdForState === 'object' && itemIdForState !== null) itemIdForState = "[Object detected in itemIdForState override]";
        if (typeof userPromptForState === 'object' && userPromptForState !== null) userPromptForState = "[Object detected in batch userPromptForState override]";
        if (typeof finalResponseA === 'object' && finalResponseA !== null) finalResponseA = "[Object detected in finalResponseA for batch override]";
        if (typeof finalResponseB === 'object' && finalResponseB !== null) finalResponseB = "[Object detected in finalResponseB for batch override]";
        if (typeof finalEvaluation === 'object' && finalEvaluation !== null) finalEvaluation = "[Object detected in finalEvaluation for batch override]";
        
        results.push({
          id: itemIdForState,
          prompt: userPromptForState, 
          responseA: finalResponseA,
          responseB: finalResponseB,
          evaluation: finalEvaluation,
          timestamp: new Date(),
        });

      } catch (error) {
        let errorDescription = getSafeToastDescription(error);
        let errorForState = forceStringOrVerySpecificPlaceholder(errorDescription, 'BatchItemError');

        // Final override checks for error case values
        if (typeof itemIdForState === 'object' && itemIdForState !== null) itemIdForState = "[Object detected in itemIdForState (error path) override]";
        if (typeof userPromptForState === 'object' && userPromptForState !== null) userPromptForState = "[Object detected in batch userPromptForState (error path) override]";
        if (typeof errorForState === 'object' && errorForState !== null) errorForState = "[Object detected in errorForState override]";
        
        results.push({
          id: itemIdForState, 
          prompt: userPromptForState,
          error: errorForState, 
          timestamp: new Date(),
        });
        if (isClient) {
           toast({
            variant: "destructive",
            title: `Error processing item ${itemIdForState}`,
            description: errorForState, 
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


  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Sheet open={isConfigPanelOpen} onOpenChange={setIsConfigPanelOpen}>
        <AppHeader />
        <ConfigurationPanel
          config={appConfig}
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
    

    




    

    



    