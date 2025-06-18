
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { ProcessedBatchItem } from '@/types';
import { Bot, FileText, CheckSquare, AlertTriangle } from 'lucide-react';

interface BatchItemCardProps {
  item: ProcessedBatchItem;
}

const BatchItemCard: React.FC<BatchItemCardProps> = ({ item }) => {
  let displayPromptContent: string | JSX.Element;
  const itemPromptValue = item.prompt;

  if (typeof itemPromptValue === 'object' && itemPromptValue !== null && 'prompt' in itemPromptValue && typeof (itemPromptValue as any).prompt === 'string') {
    displayPromptContent = (itemPromptValue as any).prompt;
    if (!displayPromptContent) {
      displayPromptContent = <span className="text-muted-foreground italic">No prompt provided</span>;
    }
  } else if (typeof itemPromptValue === 'string') {
    displayPromptContent = itemPromptValue || <span className="text-muted-foreground italic">No prompt provided</span>;
  } else {
    console.warn(`BatchItemCard: item.prompt is an unexpected type for ID ${item.id}. Value:`, itemPromptValue);
    displayPromptContent = <span className="text-muted-foreground italic">Invalid prompt format</span>;
  }

  const renderPotentiallyObjectContent = (content: any, fieldName: string) => {
    if (typeof content === 'object' && content !== null) {
      if ('prompt' in content && typeof content.prompt === 'string' && Object.keys(content).length === 1) {
         console.warn(`BatchItemCard: item.${fieldName} was an object {prompt: string} for ID ${item.id}. Rendering inner prompt.`);
        return content.prompt;
      }
      console.warn(`BatchItemCard: item.${fieldName} is an unexpected object for ID ${item.id}. Content:`, JSON.stringify(content));
      return <span className="text-destructive italic">[Malformed ${fieldName} Object]</span>;
    }
    return content || <span className="text-muted-foreground italic">No response</span>;
  };

  return (
    <Card className="mb-6 shadow-lg bg-card/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center text-lg font-semibold">
          <FileText className="mr-2 h-5 w-5 text-primary" />
          Prompt ID: {item.id}
        </CardTitle>
        <CardDescription className="pt-1 font-code text-sm">{displayPromptContent}</CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {item.error ? (
          <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-md text-destructive flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2" />
            <span>Error: {item.error}</span>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="flex items-center font-semibold mb-1 text-primary">
                  <Bot className="mr-2 h-5 w-5" /> Model A Response
                </h3>
                <div className="prose prose-sm max-w-none p-3 bg-background/50 rounded-md whitespace-pre-wrap font-body min-h-[50px]">
                  {renderPotentiallyObjectContent(item.responseA, 'responseA')}
                </div>
              </div>
              <div>
                <h3 className="flex items-center font-semibold mb-1 text-primary">
                  <Bot className="mr-2 h-5 w-5" /> Model B Response
                </h3>
                <div className="prose prose-sm max-w-none p-3 bg-background/50 rounded-md whitespace-pre-wrap font-body min-h-[50px]">
                  {renderPotentiallyObjectContent(item.responseB, 'responseB')}
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div>
              <h3 className="flex items-center font-semibold mb-1 text-accent">
                <CheckSquare className="mr-2 h-5 w-5" /> Evaluation
              </h3>
              <div className="prose prose-sm max-w-none p-3 bg-background/50 rounded-md whitespace-pre-wrap font-body min-h-[50px]">
                {renderPotentiallyObjectContent(item.evaluation, 'evaluation')}
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
