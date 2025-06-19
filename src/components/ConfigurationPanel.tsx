
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

  if (!isClient) {
    return (
      <SheetContent className="w-full sm:max-w-lg md:max-w-xl flex flex-col" side="right">
        <SheetHeader>
          <SheetTitle className="font-headline">Configuration</SheetTitle>
          <SheetDescription>
            Adjust system instructions, prompt templates, and API parameters for evaluations.
          </SheetDescription>
        </SheetHeader>
        <div className="flex-grow p-4">
          <p>Loading configuration...</p>
        </div>
        <SheetFooter>
          <SheetClose asChild>
            <Button variant="outline">Close</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    );
  }

  return (
    <SheetContent className="w-full sm:max-w-lg md:max-w-xl flex flex-col" side="right">
      <SheetHeader>
        <SheetTitle className="font-headline">Configuration</SheetTitle>
        <SheetDescription>
          Adjust system instructions, prompt templates, and API parameters for evaluations.
        </SheetDescription>
      </SheetHeader>
      <ScrollArea className="flex-grow p-1 pr-6">
        <div className="space-y-6 py-4">
          {/* System Instruction Section */}
          <div>
            <Label htmlFor="systemInstruction" className="text-lg font-semibold">System Instruction</Label>
            <Textarea
              id="systemInstruction"
              name="systemInstruction"
              value={String(config.systemInstruction ?? "")}
              onChange={handleInputChange}
              placeholder="e.g., You are a helpful AI assistant."
              className="mt-1 min-h-[100px] font-code"
              rows={4}
            />
            <p className="text-sm text-muted-foreground mt-1">Define the overall behavior and persona for the AI models.</p>
          </div>

          {/* Prompt A Template Section */}
          <div>
            <Label htmlFor="promptATemplate" className="text-lg font-semibold">Prompt A Template</Label>
            <Textarea
              id="promptATemplate"
              name="promptATemplate"
              value={String(config.promptATemplate ?? "")}
              onChange={handleInputChange}
              placeholder="e.g., User query: {{prompt}}. Respond as Model A."
              className="mt-1 min-h-[100px] font-code"
              rows={4}
            />
            {/* Using a div with explicit string expression for the descriptive text */}
            <div className="text-sm text-muted-foreground mt-1">{'A very simple text.'}</div>
          </div>
          
          {/* Prompt B Template Section (Commented out) */}
          {/*
          <div>
            <Label htmlFor="promptBTemplate" className="text-lg font-semibold">Prompt B Template</Label>
            <Textarea
              id="promptBTemplate"
              name="promptBTemplate"
              value={String(config.promptBTemplate ?? "")}
              onChange={handleInputChange}
              placeholder="e.g., User asks: {{prompt}}. Respond as Model B, more creatively."
              className="mt-1 min-h-[100px] font-code"
              rows={4}
            />
            <p className="text-sm text-muted-foreground mt-1">Enter the template for Prompt B. Use {{prompt}} for user input.</p>
          </div>
          */}
          
          {/* API Parameters Section (Commented out) */}
          {/*
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
          */}
        </div>
      </ScrollArea>
      <SheetFooter>
        <SheetClose asChild>
          <Button variant="outline">Close</Button>
        </SheetClose>
      </SheetFooter>
    </SheetContent>
  );
};

export default ConfigurationPanel;
