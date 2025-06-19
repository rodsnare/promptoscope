
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose } from '@/components/ui/sheet';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { AppConfig, EvaluationRunMode, ModelProcessingConfig, EvaluatorConfig, ApiConfig } from '@/types';

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
    const keys = name.split('.'); // e.g., "modelAConfig.systemInstruction" or "modelAConfig.apiConfig.temperature"

    onConfigChange(prevConfig => {
      const newConfig = JSON.parse(JSON.stringify(prevConfig)) as AppConfig; // Deep clone

      let currentLevel: any = newConfig;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!currentLevel[keys[i]]) currentLevel[keys[i]] = {}; // Create path if not exists
        currentLevel = currentLevel[keys[i]];
      }

      const finalKey = keys[keys.length - 1];
      const isApiNumberField = ['temperature', 'topK', 'maxOutputTokens'].includes(finalKey);

      if (isApiNumberField) {
        currentLevel[finalKey] = value === '' ? undefined : parseFloat(value);
      } else {
        currentLevel[finalKey] = value;
      }
      return newConfig;
    });
  };

  const handleRunModeChange = (newMode: EvaluationRunMode) => {
    onConfigChange({ ...config, runMode: newMode });
  };

  const renderModelConfigSection = (
    modelKey: 'modelAConfig' | 'modelBConfig',
    title: string,
    modelConfig: ModelProcessingConfig
  ) => (
    <>
      <div>
        <Label htmlFor={`${modelKey}.systemInstruction`} className="text-md font-semibold">System Instruction</Label>
        <Textarea
          id={`${modelKey}.systemInstruction`}
          name={`${modelKey}.systemInstruction`}
          value={String(modelConfig.systemInstruction ?? "")}
          onChange={handleInputChange}
          placeholder="e.g., You are a helpful AI assistant."
          className="mt-1 min-h-[80px] font-code"
          rows={3}
        />
      </div>
      <div>
        <Label htmlFor={`${modelKey}.promptTemplate`} className="text-md font-semibold">Prompt Template</Label>
        <Textarea
          id={`${modelKey}.promptTemplate`}
          name={`${modelKey}.promptTemplate`}
          value={String(modelConfig.promptTemplate ?? "")}
          onChange={handleInputChange}
          placeholder="e.g., User query: {{prompt}}"
          className="mt-1 min-h-[100px] font-code"
          rows={4}
        />
        <div className="text-sm text-muted-foreground mt-1">{'Use {{prompt}} to insert the user\'s original query.'}</div>
      </div>
      {renderApiConfigFields(`${modelKey}.apiConfig`, modelConfig.apiConfig)}
    </>
  );

  const renderApiConfigFields = (baseName: string, apiConf: ApiConfig) => (
    <div className="space-y-3 mt-3 pt-3 border-t">
      <h4 className="text-sm font-medium">API Parameters</h4>
      <div>
        <Label htmlFor={`${baseName}.temperature`}>Temperature</Label>
        <Input
          id={`${baseName}.temperature`}
          name={`${baseName}.temperature`}
          type="number"
          value={apiConf.temperature ?? ''}
          onChange={handleInputChange}
          step="0.1" min="0" max="2" placeholder="e.g., 0.7"
          className="mt-1 font-code"
        />
      </div>
      <div>
        <Label htmlFor={`${baseName}.topK`}>Top-K</Label>
        <Input
          id={`${baseName}.topK`}
          name={`${baseName}.topK`}
          type="number"
          value={apiConf.topK ?? ''}
          onChange={handleInputChange}
          step="1" min="1" placeholder="e.g., 40"
          className="mt-1 font-code"
        />
      </div>
      <div>
        <Label htmlFor={`${baseName}.maxOutputTokens`}>Max Output Tokens</Label>
        <Input
          id={`${baseName}.maxOutputTokens`}
          name={`${baseName}.maxOutputTokens`}
          type="number"
          value={apiConf.maxOutputTokens ?? ''}
          onChange={handleInputChange}
          step="1" min="1" placeholder="e.g., 1024"
          className="mt-1 font-code"
        />
      </div>
    </div>
  );


  if (!isClient) {
    return (
      <SheetContent className="w-full sm:max-w-lg md:max-w-xl flex flex-col" side="right">
        <SheetHeader>
          <SheetTitle className="font-headline">Configuration</SheetTitle>
          <SheetDescription>Loading configuration options...</SheetDescription>
        </SheetHeader>
        <div className="flex-grow p-4"><p>Loading...</p></div>
        <SheetFooter><SheetClose asChild><Button variant="outline">Close</Button></SheetClose></SheetFooter>
      </SheetContent>
    );
  }

  return (
    <SheetContent className="w-full sm:max-w-lg md:max-w-xl flex flex-col" side="right">
      <SheetHeader>
        <SheetTitle className="font-headline">Configuration</SheetTitle>
        <SheetDescription>
          Set evaluation mode, and configure prompts and API parameters for models and evaluator.
        </SheetDescription>
      </SheetHeader>
      <ScrollArea className="flex-grow p-1 pr-6">
        <div className="space-y-6 py-4">
          <div>
            <Label className="text-lg font-semibold">Evaluation Run Mode</Label>
            <RadioGroup
              value={config.runMode}
              onValueChange={(value) => handleRunModeChange(value as EvaluationRunMode)}
              className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2"
            >
              <div className="flex items-center space-x-2 p-2 border rounded-md hover:bg-accent/10">
                <RadioGroupItem value="a_vs_b" id="a_vs_b" />
                <Label htmlFor="a_vs_b" className="cursor-pointer">A vs B</Label>
              </div>
              <div className="flex items-center space-x-2 p-2 border rounded-md hover:bg-accent/10">
                <RadioGroupItem value="a_only" id="a_only" />
                <Label htmlFor="a_only" className="cursor-pointer">A Only</Label>
              </div>
              <div className="flex items-center space-x-2 p-2 border rounded-md hover:bg-accent/10">
                <RadioGroupItem value="b_only" id="b_only" />
                <Label htmlFor="b_only" className="cursor-pointer">B Only</Label>
              </div>
            </RadioGroup>
          </div>

          <Accordion type="multiple" defaultValue={['modelA', 'modelB', 'evaluator']} className="w-full">
            <AccordionItem value="modelA">
              <AccordionTrigger className="text-lg font-semibold">Model A Settings</AccordionTrigger>
              <AccordionContent className="space-y-4 pt-2">
                {renderModelConfigSection('modelAConfig', 'Model A', config.modelAConfig)}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="modelB">
              <AccordionTrigger className="text-lg font-semibold">Model B Settings</AccordionTrigger>
              <AccordionContent className="space-y-4 pt-2">
                {renderModelConfigSection('modelBConfig', 'Model B', config.modelBConfig)}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="evaluator">
              <AccordionTrigger className="text-lg font-semibold">Evaluator Settings</AccordionTrigger>
              <AccordionContent className="space-y-4 pt-2">
                <div>
                  <Label htmlFor="evaluatorConfig.evaluationPromptTemplate" className="text-md font-semibold">Evaluation Prompt Template</Label>
                  <Textarea
                    id="evaluatorConfig.evaluationPromptTemplate"
                    name="evaluatorConfig.evaluationPromptTemplate"
                    value={String(config.evaluatorConfig.evaluationPromptTemplate ?? "")}
                    onChange={handleInputChange}
                    placeholder="e.g., Evaluate Response A: {{responseA}} vs Response B: {{responseB}} for Prompt: {{prompt}}"
                    className="mt-1 min-h-[120px] font-code"
                    rows={5}
                  />
                  <div className="text-sm text-muted-foreground mt-1">{'Use {{prompt}}, {{responseA}}, and {{responseB}} (optional) placeholders.'}</div>
                </div>
                {renderApiConfigFields('evaluatorConfig.apiConfig', config.evaluatorConfig.apiConfig)}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </ScrollArea>
      <SheetFooter>
        <SheetClose asChild><Button variant="outline">Close</Button></SheetClose>
      </SheetFooter>
    </SheetContent>
  );
};

export default ConfigurationPanel;
