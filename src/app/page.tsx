
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
      if (typeof obj[key] === 'object' && obj[key] !== null) {
         const nestedResult = findNestedPromptString(obj[key]);
         if (nestedResult !== null) {
            return nestedResult;
         }
      }
    }
  }
  return null;
}

const getCleanedPromptString = (promptInput: any): string => {
  if (promptInput === null || promptInput === undefined) {
    return "";
  }
  if (typeof promptInput === 'string') {
    return promptInput;
  }
  if (typeof promptInput === 'number' || typeof promptInput === 'boolean') {
    return String(promptInput);
  }
  if (typeof promptInput === 'object') {
    // Specifically check for { prompt: "string_value" } and only that.
    if (
      Object.keys(promptInput).length === 1 &&
      Object.prototype.hasOwnProperty.call(promptInput, 'prompt') &&
      typeof promptInput.prompt === 'string'
    ) {
      return promptInput.prompt;
    }
    // For any other object type for a user prompt, consider it invalid.
    return "[Invalid Prompt Structure]";
  }
  // Fallback for other types (e.g. function, symbol) - should be rare for prompt inputs.
  return String(promptInput);
};


const ensureStringContent = (content: any, defaultString: string = "No content provided"): string => {
  if (content === null || content === undefined) {
    return defaultString;
  }
  if (typeof content === 'string') {
    return content || defaultString; // Ensure non-empty string if original string was empty
  }
  if (typeof content === 'number' || typeof content === 'boolean') {
    return String(content);
  }
  if (typeof content === 'object') {
    // Check for the specific {prompt: "string"} structure first
    if (
      Object.keys(content).length === 1 &&
      Object.prototype.hasOwnProperty.call(content, 'prompt') &&
      typeof content.prompt === 'string'
    ) {
      return content.prompt || defaultString; // Ensure non-empty string
    }
    // Try to stringify other objects
    try {
      const str = JSON.stringify(content);
      // Check if stringify resulted in "{}" for a non-empty object
      if (str === '{}' && Object.keys(content).length > 0) {
         return `[Object Content (keys: ${Object.keys(content).join(', ')})]`;
      } else if (str === '{}' && Object.keys(content).length === 0) {
         // Empty object
         return `[Empty Object Content]`;
      }
      return str;
    } catch (e) {
      return "[Unstringifiable Object Content]";
    }
  }
  // Fallback for any other type (e.g. function, symbol)
  return String(content); 
};


const getSafeToastDescription = (error: any): string => {
  if (error === null || error === undefined) {
    return "An unknown error occurred.";
  }
  if (typeof error === 'string') return error || "An unknown error occurred.";
  if (typeof error === 'number' || typeof error === 'boolean') return String(error);

  let potentialMessageSource = error;
  if (error instanceof Error && error.message) {
    // If error.message itself could be the problematic object
    if (typeof error.message === 'object' && error.message !== null) {
        potentialMessageSource = error.message;
    } else if (typeof error.message === 'string') {
        potentialMessageSource = error.message;
    } else { // error.message is some other primitive
        potentialMessageSource = String(error.message);
    }
  }
  
  // Now process potentialMessageSource
  if (typeof potentialMessageSource === 'string') {
    return potentialMessageSource || "An unknown error occurred.";
  }

  if (typeof potentialMessageSource === 'object' && potentialMessageSource !== null) {
    // Direct check for {prompt: "string"}
    if (
      Object.keys(potentialMessageSource).length === 1 &&
      Object.prototype.hasOwnProperty.call(potentialMessageSource, 'prompt') &&
      typeof potentialMessageSource.prompt === 'string'
    ) {
      return potentialMessageSource.prompt || "Error: Malformed prompt object in error.";
    }
    
    // Fallback to findNestedPromptString for more complex objects
    const nestedPrompt = findNestedPromptString(potentialMessageSource);
    if (nestedPrompt !== null) {
      return nestedPrompt || "Error: Empty nested prompt in error object.";
    }
    
    // Final attempt: JSON.stringify
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
  
  // Fallback for any other type, ensuring it's a string
  const finalMessage = String(potentialMessageSource);
  return finalMessage || "An unknown error occurred.";
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
    const safeUserPrompt = typeof userPrompt === 'string' ? userPrompt : '[Invalid User Prompt for Interpolation]';
    return template.replace(/\{\{prompt\}\}/g, safeUserPrompt);
  };

  const handleInteractiveSubmit = async (userInput: string | { prompt: string }) => {
    setIsLoading(true);
    let userPromptString = getCleanedPromptString(userInput);

    try {
      const fullPromptA = interpolatePrompt(appConfig.promptATemplate, userPromptString);
      const fullPromptB = interpolatePrompt(appConfig.promptBTemplate, userPromptString);

      const responses = await compareResponses({
        promptA: fullPromptA,
        promptB: fullPromptB,
        systemInstruction: appConfig.systemInstruction,
        ...appConfig.apiConfig,
      });

      const evaluationResult = await evaluateResponse({
        prompt: userPromptString,
        responseA: ensureStringContent(responses.responseA, "No response from Model A's source"),
        responseB: ensureStringContent(responses.responseB, "No response from Model B's source"),
      });
      
      let finalResponseA = ensureStringContent(responses.responseA, "No response from Model A");
      let finalResponseB = ensureStringContent(responses.responseB, "No response from Model B");
      let finalEvaluation = ensureStringContent(evaluationResult.evaluation, "No evaluation available");

      // Final override checks
      if (typeof userPromptString === 'object' && userPromptString !== null) userPromptString = "[Object detected in userPromptString override]";
      if (typeof finalResponseA === 'object' && finalResponseA !== null) finalResponseA = "[Object detected in finalResponseA override]";
      if (typeof finalResponseB === 'object' && finalResponseB !== null) finalResponseB = "[Object detected in finalResponseB override]";
      if (typeof finalEvaluation === 'object' && finalEvaluation !== null) finalEvaluation = "[Object detected in finalEvaluation override]";

      const newTurn: ConversationTurn = {
        id: crypto.randomUUID(),
        userPrompt: userPromptString,
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
      let userPromptString = getCleanedPromptString(item.prompt); 

      try {
        const fullPromptA = interpolatePrompt(appConfig.promptATemplate, userPromptString);
        const fullPromptB = interpolatePrompt(appConfig.promptBTemplate, userPromptString);

        const responses = await compareResponses({
          promptA: fullPromptA,
          promptB: fullPromptB,
          systemInstruction: appConfig.systemInstruction,
          ...appConfig.apiConfig,
        });
        
        const evaluationResult = await evaluateResponse({
          prompt: userPromptString, 
          responseA: ensureStringContent(responses.responseA, "No response from Model A's source for batch"),
          responseB: ensureStringContent(responses.responseB, "No response from Model B's source for batch"),
        });

        let finalResponseA = ensureStringContent(responses.responseA, "No response from Model A for batch");
        let finalResponseB = ensureStringContent(responses.responseB, "No response from Model B for batch");
        let finalEvaluation = ensureStringContent(evaluationResult.evaluation, "No evaluation available for batch");
        
        // Final override checks
        if (typeof userPromptString === 'object' && userPromptString !== null) userPromptString = "[Object detected in batch userPromptString override]";
        if (typeof finalResponseA === 'object' && finalResponseA !== null) finalResponseA = "[Object detected in finalResponseA for batch override]";
        if (typeof finalResponseB === 'object' && finalResponseB !== null) finalResponseB = "[Object detected in finalResponseB for batch override]";
        if (typeof finalEvaluation === 'object' && finalEvaluation !== null) finalEvaluation = "[Object detected in finalEvaluation for batch override]";

        results.push({
          id: String(item.id), 
          prompt: userPromptString, 
          responseA: finalResponseA,
          responseB: finalResponseB,
          evaluation: finalEvaluation,
          timestamp: new Date(),
        });

      } catch (error) {
        let errorString = getSafeToastDescription(error);
         // Final override check for errorString
        if (typeof errorString === 'object' && errorString !== null) errorString = "[Object detected in errorString override]";

        results.push({
          id: String(item.id), 
          prompt: userPromptString, 
          error: errorString, 
          timestamp: new Date(),
        });
        if (isClient) {
           toast({
            variant: "destructive",
            title: `Error processing item ${getCleanedPromptString(String(item.id))}`,
            description: errorString, 
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
    

    

