
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { ProcessedBatchItem } from '@/types';
import { Bot, FileText, CheckSquare, AlertTriangle } from 'lucide-react';

// Helper to render AI-generated content (responseA, responseB, evaluation)
const renderAIOutput = (content: any): string => {
  if (typeof content === 'object' && content !== null && Object.prototype.hasOwnProperty.call(content, 'prompt') && typeof content.prompt === 'string') {
    return content.prompt || "No response";
  }
  if (typeof content === 'string') {
    return content || "No response";
  }
  if (content === null || content === undefined) {
    return "No response";
  }
  // console.warn('renderAIOutput: Rendering placeholder for unexpected structure:', JSON.stringify(content));
  return "[Unsupported Content]";
};

// Helper to render item ID
const renderItemID = (id: any): string => {
  if (typeof id === 'string' || typeof id === 'number') {
    return String(id);
  }
  if (typeof id === 'object' && id !== null && Object.prototype.hasOwnProperty.call(id, 'prompt') && typeof id.prompt === 'string') {
    return id.prompt || "[Invalid ID format]";
  }
  if (id === null || id === undefined) {
    return "No ID";
  }
  // console.warn('renderItemID: Rendering placeholder for unexpected ID structure:', JSON.stringify(id));
  return "[Invalid ID]";
};

// Helper to display the main batch item prompt
const getDisplayableBatchPrompt = (promptInput: any): string => {
  if (typeof promptInput === 'object' && promptInput !== null && Object.prototype.hasOwnProperty.call(promptInput, 'prompt') && typeof promptInput.prompt === 'string') {
    return promptInput.prompt || "No prompt provided";
  }
  if (typeof promptInput === 'string') {
    return promptInput || "No prompt provided";
  }
  if (promptInput === null || promptInput === undefined) {
    return "No prompt provided";
  }
  // console.warn('getDisplayableBatchPrompt: Rendering placeholder for unexpected prompt structure:', JSON.stringify(promptInput));
  return "[Invalid Prompt Format]";
};

// Helper to render error content safely
const renderErrorContent = (error: any): string => {
  if (typeof error === 'object' && error !== null && Object.prototype.hasOwnProperty.call(error, 'prompt') && typeof error.prompt === 'string') {
    return error.prompt || "Error occurred, no details.";
  }
  if (typeof error === 'string') {
    return error || "Error occurred, no details.";
  }
  if (error === null || error === undefined) {
    return "Error occurred, no details.";
  }
  // console.warn('renderErrorContent: Rendering placeholder for unexpected error object structure:', JSON.stringify(error));
  return "[Malformed error details]";
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
            <span className="flex-grow">{renderErrorContent(item.error)}</span>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="flex items-center font-semibold mb-1 text-primary">
                  <Bot className="mr-2 h-5 w-5" /> Model A Response
                </h3>
                <div className="prose prose-sm max-w-none p-3 bg-background/50 rounded-md whitespace-pre-wrap font-body min-h-[50px]">
                  {renderAIOutput(item.responseA)}
                </div>
              </div>
              <div>
                <h3 className="flex items-center font-semibold mb-1 text-primary">
                  <Bot className="mr-2 h-5 w-5" /> Model B Response
                </h3>
                <div className="prose prose-sm max-w-none p-3 bg-background/50 rounded-md whitespace-pre-wrap font-body min-h-[50px]">
                  {renderAIOutput(item.responseB)}
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div>
              <h3 className="flex items-center font-semibold mb-1 text-accent">
                <CheckSquare className="mr-2 h-5 w-5" /> Evaluation
              </h3>
              <div className="prose prose-sm max-w-none p-3 bg-background/50 rounded-md whitespace-pre-wrap font-body min-h-[50px]">
                {renderAIOutput(item.evaluation)}
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
