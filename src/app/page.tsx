
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
  let result: string;

  if (promptInput === null || promptInput === undefined) {
    result = "";
  } else if (
    typeof promptInput === 'object' &&
    Object.keys(promptInput).length === 1 &&
    Object.prototype.hasOwnProperty.call(promptInput, 'prompt') &&
    typeof promptInput.prompt === 'string'
  ) {
    result = promptInput.prompt;
  } else if (typeof promptInput === 'string') {
    result = promptInput;
  } else if (typeof promptInput === 'number' || typeof promptInput === 'boolean') {
    result = String(promptInput);
  } else if (typeof promptInput === 'object') {
    // Fallback for other object structures after direct check
    result = "[Invalid Prompt Structure]"; 
  } else {
    result = String(promptInput); // Fallback for other types
  }

  // Final safety: ensure we are not returning an object by mistake.
  if (typeof result === 'object' && result !== null) {
      return "[Internal Sanitization Error: Prompt]";
  }
  return result;
};


const ensureStringContent = (content: any, defaultString: string = "No content provided"): string => {
  let result: string;

  if (content === null || content === undefined) {
    result = defaultString;
  } else if (
    typeof content === 'object' &&
    Object.keys(content).length === 1 &&
    Object.prototype.hasOwnProperty.call(content, 'prompt') &&
    typeof content.prompt === 'string'
   ) {
    result = content.prompt || defaultString;
  } else if (typeof content === 'string') {
    result = content || defaultString;
  } else if (typeof content === 'number' || typeof content === 'boolean') {
    result = String(content);
  } else if (typeof content === 'object') {
    // For other objects, try to stringify
    try {
      const str = JSON.stringify(content);
      if (str === '{}' && Object.keys(content).length === 0) {
         result = `[Empty Object Content]`;
      } else if (str === '{}' && Object.keys(content).length > 0) {
         result = `[Object Content (keys: ${Object.keys(content).join(', ')})]`;
      } else {
        result = str;
      }
    } catch (e) {
      result = "[Unstringifiable Object Content]";
    }
  } else {
    result = String(content); // Fallback for other types
  }

  // Final safety check
  if (typeof result === 'object' && result !== null) {
    return "[Internal Sanitization Error: Content]";
  }
  return result;
};


const getSafeToastDescription = (error: any): string => {
  let result: string;

  if (error === null || error === undefined) {
    result = "An unknown error occurred.";
  } else if (typeof error === 'string') {
    result = error;
  } else if (typeof error === 'number' || typeof error === 'boolean') {
    result = String(error);
  } else if (error instanceof Error) {
    let messageToDisplay: string | null = null;
    if (typeof error.message === 'object' && error.message !== null) {
        if (Object.keys(error.message).length === 1 && Object.prototype.hasOwnProperty.call(error.message, 'prompt') && typeof error.message.prompt === 'string') {
            messageToDisplay = error.message.prompt;
        } else {
            messageToDisplay = findNestedPromptString(error.message);
        }
    }
    
    if (messageToDisplay !== null) {
        result = messageToDisplay;
    } else if (typeof error.message === 'string') {
        result = error.message;
    } else if (typeof error.message === 'object' && error.message !== null) { 
        try {
            const stringifiedMessage = JSON.stringify(error.message);
            result = stringifiedMessage === '{}' ? "[Empty Error Message Object]" : stringifiedMessage;
        } catch {
            result = "Failed to stringify error.message object.";
        }
    } else {
        result = "Error message is of an unexpected type.";
    }
  } else if (typeof error === 'object') {
    if (Object.keys(error).length === 1 && Object.prototype.hasOwnProperty.call(error, 'prompt') && typeof error.prompt === 'string') {
        result = error.prompt;
    } else {
        const nestedPrompt = findNestedPromptString(error);
        if (nestedPrompt !== null) {
          result = nestedPrompt;
        } else {
          try {
            const stringifiedError = JSON.stringify(error);
            result = stringifiedError === '{}' ? "[Empty Error Object]" : stringifiedError;
          } catch {
            result = "Failed to stringify error object.";
          }
        }
    }
  } else {
    result = "An unknown error occurred."; 
  }

  // Final safety checks
  if (typeof result === 'object' && result !== null) {
      return "[Internal Sanitization Error: Toast]";
  }
  return result || "An unknown error occurred."; 
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
    const userPromptString = getCleanedPromptString(userInput);

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

      const newTurn: ConversationTurn = {
        id: crypto.randomUUID(),
        userPrompt: userPromptString,
        responseA: ensureStringContent(responses.responseA, "No response from Model A"),
        responseB: ensureStringContent(responses.responseB, "No response from Model B"),
        evaluation: ensureStringContent(evaluationResult.evaluation, "No evaluation available"),
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
      const userPromptString = getCleanedPromptString(item.prompt); 

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

        results.push({
          id: String(item.id), 
          prompt: userPromptString, 
          responseA: ensureStringContent(responses.responseA, "No response from Model A"),
          responseB: ensureStringContent(responses.responseB, "No response from Model B"),
          evaluation: ensureStringContent(evaluationResult.evaluation, "No evaluation available"),
          timestamp: new Date(),
        });

      } catch (error) {
        results.push({
          id: String(item.id), 
          prompt: userPromptString, 
          error: getSafeToastDescription(error), 
          timestamp: new Date(),
        });
        if (isClient) {
           toast({
            variant: "destructive",
            title: `Error processing item ${getCleanedPromptString(String(item.id))}`, // Ensure item.id is also cleaned for display if it could be an object
            description: getSafeToastDescription(error),
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
