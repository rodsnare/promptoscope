
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose } from '@/components/ui/sheet';
import type { AppConfig } from '@/types';

interface ConfigurationPanelProps {
  config: AppConfig;
  onConfigChange: (newConfig: AppConfig) => void;
}

const ensureStringForConfig = (content: any): string => {
  if (content === null || content === undefined) {
    return ""; 
  }
  if (typeof content === 'string') {
    return content;
  }
  if (typeof content === 'number' || typeof content === 'boolean') {
    return String(content);
  }
  
  if (
    typeof content === 'object' &&
    content !== null &&
    Object.keys(content).length === 1 &&
    Object.prototype.hasOwnProperty.call(content, 'prompt') &&
    typeof (content as { prompt: any }).prompt === 'string'
  ) {
    return (content as { prompt: string }).prompt;
  }
 
  if (typeof content === 'object' && content !== null) {
    try {
      const strVal = JSON.stringify(content);
      if (strVal === '{}' && Object.keys(content).length > 0) {
        return `[Complex Config Object: ${Object.keys(content).join(', ')}]`;
      } else if (strVal === '{}' && Object.keys(content).length === 0) {
        return "[Empty Config Object]";
      }
      return strVal; 
    } catch {
      return "[Unstringifiable Config Object]";
    }
  }
  return String(content); 
};


const ConfigurationPanel: React.FC<ConfigurationPanelProps> = ({ config, onConfigChange }) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name in config.apiConfig) {
      onConfigChange({
        ...config,
        apiConfig: {
          ...config.apiConfig,
          [name]: name === 'temperature' || name === 'topK' ? parseFloat(value) : parseInt(value, 10),
        },
      });
    } else {
      onConfigChange({ ...config, [name]: value });
    }
  };

  return (
    <SheetContent className="w-full sm:max-w-lg md:max-w-xl flex flex-col" side="right">
      <SheetHeader>
        <SheetTitle className="font-headline">Configuration</SheetTitle>
        <SheetDescription>
          Adjust system instructions, prompt templates, and API parameters for evaluations.
        </SheetDescription>
      </SheetHeader>
      {isClient ? (
        <ScrollArea className="flex-grow p-1 pr-6">
          <div className="space-y-6 py-4">
            <div>
              <Label htmlFor="systemInstruction" className="text-lg font-semibold">System Instruction</Label>
              <Textarea
                id="systemInstruction"
                name="systemInstruction"
                value={ensureStringForConfig(config.systemInstruction)}
                onChange={handleInputChange}
                placeholder="e.g., You are a helpful AI assistant."
                className="mt-1 min-h-[100px] font-code"
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="promptATemplate" className="text-lg font-semibold">Prompt A Template</Label>
              <Textarea
                id="promptATemplate"
                name="promptATemplate"
                value={ensureStringForConfig(config.promptATemplate)}
                onChange={handleInputChange}
                placeholder="e.g., User asks: {{prompt}}. Respond as Model A."
                className="mt-1 min-h-[100px] font-code"
                rows={4}
              />
              <p className="text-sm text-muted-foreground mt-1">Use `{{prompt}}` as a placeholder for the user's input.</p>
            </div>

            <div>
              <Label htmlFor="promptBTemplate" className="text-lg font-semibold">Prompt B Template</Label>
              <Textarea
                id="promptBTemplate"
                name="promptBTemplate"
                value={ensureStringForConfig(config.promptBTemplate)}
                onChange={handleInputChange}
                placeholder="e.g., User asks: {{prompt}}. Respond as Model B, more creatively."
                className="mt-1 min-h-[100px] font-code"
                rows={4}
              />
               <p className="text-sm text-muted-foreground mt-1">Use `{{prompt}}` as a placeholder for the user's input.</p>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">API Parameters</h3>
              <div>
                <Label htmlFor="temperature">Temperature</Label>
                <Input
                  id="temperature"
                  name="temperature"
                  type="number"
                  value={config.apiConfig.temperature}
                  onChange={handleInputChange}
                  step="0.1"
                  min="0"
                  max="2"
                  className="mt-1 font-code"
                />
              </div>
              <div>
                <Label htmlFor="topK">Top-K</Label>
                <Input
                  id="topK"
                  name="topK"
                  type="number"
                  value={config.apiConfig.topK}
                  onChange={handleInputChange}
                  step="1"
                  min="1"
                  className="mt-1 font-code"
                />
              </div>
              <div>
                <Label htmlFor="maxOutputTokens">Max Output Tokens</Label>
                <Input
                  id="maxOutputTokens"
                  name="maxOutputTokens"
                  type="number"
                  value={config.apiConfig.maxOutputTokens}
                  onChange={handleInputChange}
                  step="1"
                  min="1"
                  className="mt-1 font-code"
                />
              </div>
            </div>
          </div>
        </ScrollArea>
      ) : (
        <div className="flex-grow p-4">
          <p>Loading configuration...</p>
        </div>
      )}
      <SheetFooter>
        <SheetClose asChild>
          <Button variant="outline">Close</Button>
        </SheetClose>
      </SheetFooter>
    </SheetContent>
  );
};

export default ConfigurationPanel;


    