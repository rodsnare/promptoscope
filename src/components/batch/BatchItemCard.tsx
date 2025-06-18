
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { ProcessedBatchItem } from '@/types';
import { Bot, FileText, CheckSquare, AlertTriangle } from 'lucide-react';

const renderPotentiallyObjectContent = (content: any, fieldName: string, itemId: string | number): string | JSX.Element => {
    if (typeof content === 'string') {
      return content || <span className="text-muted-foreground italic">No response</span>;
    }
    if (content === null || content === undefined) {
      return <span className="text-muted-foreground italic">No response</span>;
    }
    if (typeof content === 'object') {
      if (content.hasOwnProperty('prompt') && typeof content.prompt === 'string') {
        return content.prompt || <span className="text-muted-foreground italic">No response from prompt key</span>;
      }
      console.warn(
        `renderPotentiallyObjectContent: Field '${fieldName}' for ID ${String(itemId)} is an unexpected object. Content:`,
        JSON.stringify(content)
      );
      return <span className="text-destructive italic">[Invalid Content in {fieldName}]</span>;
    }
    return String(content);
};

const displayIdContent = (id: string | number | any): string | JSX.Element => {
    if (typeof id === 'string' || typeof id === 'number') {
      return String(id);
    }
    if (typeof id === 'object' && id !== null && id.hasOwnProperty('prompt') && typeof id.prompt === 'string') {
      return id.prompt || <span className="text-muted-foreground italic">No ID in prompt key</span>;
    }
    console.warn(`BatchItemCard: item.id is an unexpected type or structure. ID:`, JSON.stringify(id));
    return <span className="text-destructive italic">[Invalid ID]</span>;
};


const BatchItemCard: React.FC<BatchItemCardProps> = ({ item }) => {
  const displayPromptContent = typeof item.prompt === 'string'
    ? item.prompt || <span className="text-muted-foreground italic">No prompt provided</span>
    : <span className="text-destructive italic">[Invalid Prompt Format]</span>;

  return (
    <Card className="mb-6 shadow-lg bg-card/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center text-lg font-semibold">
          <FileText className="mr-2 h-5 w-5 text-primary" />
          Prompt ID: {displayIdContent(item.id)}
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
