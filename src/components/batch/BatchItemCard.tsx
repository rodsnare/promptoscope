
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { ProcessedBatchItem } from '@/types';
import { Bot, FileText, CheckSquare, AlertTriangle } from 'lucide-react';

// Helper for AI responses, evaluation & error - expects data to be pre-cleaned to string in page.tsx
const renderCleanedString = (content: string | undefined | null, defaultText: string = "N/A"): string => {
  return content && typeof content === 'string' && content.trim() ? content : defaultText;
};

// Robust helper for Item ID as it comes from file upload
const renderItemID = (id: any): string => {
  if (typeof id === 'string' || typeof id === 'number') {
    return String(id);
  }
  if (id === null || id === undefined) {
    return "No ID";
  }
  if (typeof id === 'object' && id.hasOwnProperty('prompt') && typeof id.prompt === 'string') {
    return id.prompt || "[Invalid ID format]";
  }
  // console.warn('renderItemID: Rendering placeholder for unexpected ID structure:', JSON.stringify(id));
  return "[Invalid ID]";
};

// Robust helper for the main batch item prompt, as it comes from file upload
const getDisplayableBatchPrompt = (promptInput: any): string => {
  if (typeof promptInput === 'string') {
    return promptInput || "No prompt provided";
  }
  if (promptInput === null || promptInput === undefined) {
    return "No prompt provided";
  }
  if (typeof promptInput === 'object' && promptInput.hasOwnProperty('prompt') && typeof promptInput.prompt === 'string') {
    return promptInput.prompt || "No prompt provided";
  }
  // console.warn('getDisplayableBatchPrompt: Rendering placeholder for unexpected prompt structure:', JSON.stringify(promptInput));
  return "[Invalid Prompt Format]";
};


interface BatchItemCardProps {
  item: ProcessedBatchItem;
}

const BatchItemCard: React.FC<BatchItemCardProps> = ({ item }) => {
  return (
    <Card className="mb-6 shadow-lg bg-card/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center text-lg font-semibold">
          <FileText className="mr-2 h-5 w-5 text-primary" />
          Prompt ID: {renderItemID(item.id)}
        </CardTitle>
        <CardDescription className="pt-1 font-code text-sm whitespace-pre-wrap">
          {getDisplayableBatchPrompt(item.prompt)}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {item.error ? (
          <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-md text-destructive flex items-start">
            <AlertTriangle className="h-5 w-5 mr-2 mt-0.5 shrink-0" />
            <span className="flex-grow">{renderCleanedString(item.error, "Error occurred, no details.")}</span>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="flex items-center font-semibold mb-1 text-primary">
                  <Bot className="mr-2 h-5 w-5" /> Model A Response
                </h3>
                <div className="prose prose-sm max-w-none p-3 bg-background/50 rounded-md whitespace-pre-wrap font-body min-h-[50px]">
                  {renderCleanedString(item.responseA, "No response from Model A")}
                </div>
              </div>
              <div>
                <h3 className="flex items-center font-semibold mb-1 text-primary">
                  <Bot className="mr-2 h-5 w-5" /> Model B Response
                </h3>
                <div className="prose prose-sm max-w-none p-3 bg-background/50 rounded-md whitespace-pre-wrap font-body min-h-[50px]">
                  {renderCleanedString(item.responseB, "No response from Model B")}
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div>
              <h3 className="flex items-center font-semibold mb-1 text-accent">
                <CheckSquare className="mr-2 h-5 w-5" /> Evaluation
              </h3>
              <div className="prose prose-sm max-w-none p-3 bg-background/50 rounded-md whitespace-pre-wrap font-body min-h-[50px]">
                {renderCleanedString(item.evaluation, "No evaluation")}
              </div>
            </div>
          </>
        )}
      </CardContent>
      <CardFooter>
        <p className="text-xs text-muted-foreground">
          Processed on: {new Date(item.timestamp).toLocaleString()}
        </p>
      </CardFooter>
    </Card>
  );
};

export default BatchItemCard;
