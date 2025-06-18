
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { ProcessedBatchItem } from '@/types';
import { Bot, FileText, CheckSquare, AlertTriangle } from 'lucide-react';

// Helper to render AI-generated content (responseA, responseB, evaluation)
const renderAIOutput = (content: any): JSX.Element => {
  if (typeof content === 'string') {
    return <>{content || <span className="text-muted-foreground italic">No response</span>}</>;
  }
  if (content === null || content === undefined) {
    return <span className="text-muted-foreground italic">No response</span>;
  }
  // Check if content is an object and has a 'prompt' property that is a string
  if (typeof content === 'object' && Object.prototype.hasOwnProperty.call(content, 'prompt') && typeof content.prompt === 'string') {
    return <>{content.prompt || <span className="text-muted-foreground italic">Empty response value</span>}</>;
  }
  // Fallback for other types of objects or unhandled cases
  // console.warn('renderAIOutput: Rendering placeholder for unexpected object structure:', JSON.stringify(content));
  return <span className="text-destructive italic">[Object Content Received]</span>;
};

// Helper to render item ID
const renderItemID = (id: any): JSX.Element => {
  if (typeof id === 'string' || typeof id === 'number') {
    return <>{String(id)}</>;
  }
  if (id === null || id === undefined) {
    return <span className="text-muted-foreground italic">No ID</span>;
  }
  // Check if id is an object and has a 'prompt' property that is a string
  if (typeof id === 'object' && Object.prototype.hasOwnProperty.call(id, 'prompt') && typeof id.prompt === 'string') {
    return <>{id.prompt || <span className="text-muted-foreground italic">Empty ID value</span>}</>;
  }
  // Fallback for other types of objects or unhandled cases
  // console.warn('renderItemID: Rendering placeholder for unexpected ID structure:', JSON.stringify(id));
  return <span className="text-destructive italic">[Object ID]</span>;
};

// Helper to display the main batch item prompt
const getDisplayableBatchPrompt = (promptInput: any): JSX.Element => {
  // Prioritize checking for the specific object structure {prompt: "string"}
  if (typeof promptInput === 'object' && promptInput !== null && Object.prototype.hasOwnProperty.call(promptInput, 'prompt') && typeof promptInput.prompt === 'string') {
    return <>{promptInput.prompt || <span className="text-muted-foreground italic">No prompt provided</span>}</>;
  }
  // Then check if it's already a string
  if (typeof promptInput === 'string') {
    return <>{promptInput || <span className="text-muted-foreground italic">No prompt provided</span>}</>;
  }
  // Handle other unexpected object structures or types
  // console.warn('getDisplayableBatchPrompt: Rendering placeholder for unexpected object structure:', JSON.stringify(promptInput));
  return <span className="text-destructive italic">[Invalid Prompt Format]</span>;
};

// Helper to render error content safely
const renderErrorContent = (error: any): JSX.Element => {
  if (typeof error === 'string') {
    return <>{error || <span className="text-muted-foreground italic">Error occurred, no details.</span>}</>;
  }
  if (error === null || error === undefined) {
    return <span className="text-muted-foreground italic">Error occurred, no details.</span>;
  }
  if (typeof error === 'object' && Object.prototype.hasOwnProperty.call(error, 'prompt') && typeof error.prompt === 'string') {
    return <>{`Details: ${error.prompt}`}</>;
  }
  // console.warn('renderErrorContent: Rendering placeholder for unexpected error object structure:', JSON.stringify(error));
  return <span className="text-destructive italic">[Malformed error details]</span>;
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
