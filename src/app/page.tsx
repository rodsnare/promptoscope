
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

  const getCleanedPromptString = (promptInput: any): string => {
    if (promptInput === null || promptInput === undefined) {
      return "";
    }
    if (typeof promptInput === 'string') {
      return promptInput;
    }
    if (typeof promptInput === 'object' &&
        Object.keys(promptInput).length === 1 && 
        Object.prototype.hasOwnProperty.call(promptInput, 'prompt') &&
        typeof promptInput.prompt === 'string') {
      return promptInput.prompt;
    }
    return String(promptInput); 
  };
  
  const getSafeToastDescription = (error: any): string => {
    if (error instanceof Error) {
      if (typeof error.message === 'string') return error.message;
      try {
        return JSON.stringify(error.message);
      } catch {
        // Deliberately no console.log here
        return "Failed to stringify error message object.";
      }
    }
    if (typeof error === 'string') return error;
    try {
      return JSON.stringify(error);
    } catch {
      // Deliberately no console.log here
      return "An unknown error occurred.";
    }
  };

  const ensureStringContent = (content: any, defaultString: string = "No content provided"): string => {
    if (content === null || content === undefined) {
      return defaultString;
    }
    if (typeof content === 'string') {
      return content || defaultString; 
    }
    
    //This specific check for {prompt: "string"} should ideally be handled before calling ensureStringContent
    // if the source (like AI response) might directly be this object.
    // However, keeping it here for defense in depth.
    if (typeof content === 'object' &&
        content !== null && // Ensure content is not null
        Object.keys(content).length === 1 && 
        Object.prototype.hasOwnProperty.call(content, 'prompt') &&
        typeof content.prompt === 'string') {
      return content.prompt || defaultString; 
    }

    if (typeof content === 'object' && content !== null) {
      try {
        const str = JSON.stringify(content);
        return str === '{}' ? `[Empty Object]` : str;
      } catch (e) {
        return `[Unstringifiable Object]`;
      }
    }
    return String(content);
  };


  const interpolatePrompt = (template: string, userPrompt: string): string => {
    return template.replace(/\{\{prompt\}\}/g, userPrompt);
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

      // Aggressive pre-processing for AI direct output
      let finalResponseA = responses.responseA;
      if (typeof responses.responseA === 'object' && responses.responseA !== null && Object.keys(responses.responseA).length === 1 && 'prompt' in responses.responseA && typeof responses.responseA.prompt === 'string') {
        finalResponseA = responses.responseA.prompt;
      }

      let finalResponseB = responses.responseB;
      if (typeof responses.responseB === 'object' && responses.responseB !== null && Object.keys(responses.responseB).length === 1 && 'prompt' in responses.responseB && typeof responses.responseB.prompt === 'string') {
        finalResponseB = responses.responseB.prompt;
      }

      const evaluationResult = await evaluateResponse({
        prompt: userPromptString, 
        responseA: finalResponseA, 
        responseB: finalResponseB, 
      });

      let finalEvaluation = evaluationResult.evaluation;
      if (typeof evaluationResult.evaluation === 'object' && evaluationResult.evaluation !== null && Object.keys(evaluationResult.evaluation).length === 1 && 'prompt' in evaluationResult.evaluation && typeof evaluationResult.evaluation.prompt === 'string') {
        finalEvaluation = evaluationResult.evaluation.prompt;
      }

      const newTurn: ConversationTurn = {
        id: crypto.randomUUID(),
        userPrompt: userPromptString, 
        responseA: ensureStringContent(finalResponseA, "No response from Model A"),
        responseB: ensureStringContent(finalResponseB, "No response from Model B"),
        evaluation: ensureStringContent(finalEvaluation, "No evaluation available"),
        timestamp: new Date(),
      };
      setInteractiveHistory(prev => [newTurn, ...prev]);

    } catch (error) {
      // console.error("Error during interactive evaluation:", error); // Re-enable if needed for debugging
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
        
        // Aggressive pre-processing for AI direct output
        let finalResponseA = responses.responseA;
        if (typeof responses.responseA === 'object' && responses.responseA !== null && Object.keys(responses.responseA).length === 1 && 'prompt' in responses.responseA && typeof responses.responseA.prompt === 'string') {
          finalResponseA = responses.responseA.prompt;
        }

        let finalResponseB = responses.responseB;
        if (typeof responses.responseB === 'object' && responses.responseB !== null && Object.keys(responses.responseB).length === 1 && 'prompt' in responses.responseB && typeof responses.responseB.prompt === 'string') {
          finalResponseB = responses.responseB.prompt;
        }

        const evaluationResult = await evaluateResponse({
          prompt: userPromptString,
          responseA: finalResponseA, 
          responseB: finalResponseB, 
        });
        
        let finalEvaluation = evaluationResult.evaluation;
        if (typeof evaluationResult.evaluation === 'object' && evaluationResult.evaluation !== null && Object.keys(evaluationResult.evaluation).length === 1 && 'prompt' in evaluationResult.evaluation && typeof evaluationResult.evaluation.prompt === 'string') {
          finalEvaluation = evaluationResult.evaluation.prompt;
        }
        
        results.push({
          id: item.id, 
          prompt: userPromptString, 
          responseA: ensureStringContent(finalResponseA, "No response from Model A"),
          responseB: ensureStringContent(finalResponseB, "No response from Model B"),
          evaluation: ensureStringContent(finalEvaluation, "No evaluation available"),
          timestamp: new Date(),
        });

      } catch (error) {
        // console.error(`Error processing batch item ${item.id}:`, error); // Re-enable if needed for debugging
        results.push({
          id: item.id,
          prompt: userPromptString,
          error: ensureStringContent(getSafeToastDescription(error), "An error occurred during processing."), // Ensure error is also stringified
          timestamp: new Date(),
        });
        if (isClient) {
           toast({
            variant: "destructive",
            title: `Error processing item ${item.id}`,
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
    