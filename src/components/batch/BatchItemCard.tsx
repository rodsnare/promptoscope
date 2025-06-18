
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { ProcessedBatchItem } from '@/types';
import { Bot, FileText, CheckSquare, AlertTriangle } from 'lucide-react';

interface BatchItemCardProps {
  item: ProcessedBatchItem;
}

const BatchItemCard: React.FC<BatchItemCardProps> = ({ item }) => {
  // item.prompt is expected to be a string due to getCleanedPromptString in page.tsx
  const displayPromptContent = item.prompt || <span className="text-muted-foreground italic">No prompt provided</span>;

  const renderPotentiallyObjectContent = (content: any, fieldName: string, itemId: string): string | JSX.Element => {
    if (typeof content === 'string') {
      return content || <span className="text-muted-foreground italic">No response</span>;
    }

    if (typeof content === 'object' && content !== null) {
      // Case 1: content has a 'prompt' key and its value is a string.
      if (typeof content.prompt === 'string') {
        return content.prompt || <span className="text-muted-foreground italic">No response from prompt key</span>;
      }
      // Case 2: content has a 'prompt' key, but its value is NOT a string.
      if ('prompt' in content) {
        console.warn(`BatchItemCard: Field '${fieldName}' for ID ${itemId} has a '.prompt' key, but its value is not a string. Value:`, JSON.stringify(content.prompt));
        return <span className="text-destructive italic">[Malformed {fieldName} (prompt value not string)]</span>;
      }
      // Case 3: content is some other object (does not have a 'prompt' key, or previous conditions not met).
      console.warn(`BatchItemCard: Field '${fieldName}' for ID ${itemId} is an unexpected object. Content:`, JSON.stringify(content));
      return <span className="text-destructive italic">[Malformed {fieldName} Object]</span>;
    }
    
    if (content === null || content === undefined) {
        return <span className="text-muted-foreground italic">No response</span>;
    }
    
    // Fallback for other primitive types (boolean, number) by converting to string.
    const stringifiedContent = String(content);
    return stringifiedContent || <span className="text-muted-foreground italic">No response</span>;
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
                  {renderPotentiallyObjectContent(item.responseA, 'responseA', item.id)}
                </div>
              </div>
              <div>
                <h3 className="flex items-center font-semibold mb-1 text-primary">
                  <Bot className="mr-2 h-5 w-5" /> Model B Response
                </h3>
                <div className="prose prose-sm max-w-none p-3 bg-background/50 rounded-md whitespace-pre-wrap font-body min-h-[50px]">
                  {renderPotentiallyObjectContent(item.responseB, 'responseB', item.id)}
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div>
              <h3 className="flex items-center font-semibold mb-1 text-accent">
                <CheckSquare className="mr-2 h-5 w-5" /> Evaluation
              </h3>
              <div className="prose prose-sm max-w-none p-3 bg-background/50 rounded-md whitespace-pre-wrap font-body min-h-[50px]">
                {renderPotentiallyObjectContent(item.evaluation, 'evaluation', item.id)}
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
