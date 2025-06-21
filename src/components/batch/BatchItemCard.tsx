
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { ProcessedBatchItem } from '@/types';
import { Bot, FileText, CheckSquare, AlertTriangle, Info } from 'lucide-react';

const renderContentSafely = (content: any, defaultText: string = "N/A"): string => {
  if (content === null || content === undefined) {
    return defaultText;
  }
  if (typeof content === 'string') {
    return content || defaultText;
  }
  if (typeof content === 'number' || typeof content === 'boolean') {
    return String(content);
  }
  if (typeof content === 'object' && Object.prototype.hasOwnProperty.call(content, 'prompt') && typeof content.prompt === 'string' && Object.keys(content).length === 1) {
    return content.prompt || defaultText;
  }
  if (typeof content === 'object' && content !== null) {
    return `[Unsupported Content Type]`;
  }
  return String(content);
};

interface BatchItemCardProps {
  item: ProcessedBatchItem;
}

const BatchItemCard: React.FC<BatchItemCardProps> = ({ item }) => {
  const runModeText = item.runModeUsed ? 
    (item.runModeUsed === 'a_vs_b' ? 'A vs B' : item.runModeUsed === 'a_only' ? 'Model A Only' : 'Model B Only')
    : 'N/A';

  return (
    <Card className="mb-6 shadow-lg bg-card/80 backdrop-blur-sm">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center text-lg font-semibold">
              <FileText className="mr-2 h-5 w-5 text-primary" />
              Prompt ID: {renderContentSafely(item.id, "No ID")}
            </CardTitle>
            <CardDescription className="pt-1 font-code text-sm whitespace-pre-wrap">
              {renderContentSafely(item.prompt, "No prompt provided")}
            </CardDescription>
          </div>
           <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md ml-2 shrink-0">
             Mode: {runModeText}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {item.error ? (
          <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-md text-destructive flex items-start">
            <AlertTriangle className="h-5 w-5 mr-2 mt-0.5 shrink-0" />
            <span className="flex-grow whitespace-pre-wrap">{renderContentSafely(item.error, "Error occurred, no details.")}</span>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {item.responseA !== null && item.responseA !== undefined ? (
                <div>
                  <h3 className="flex items-center font-semibold mb-1 text-primary">
                    <Bot className="mr-2 h-5 w-5" /> Model A Response
                  </h3>
                  <div className="prose prose-sm max-w-none p-3 bg-background/50 rounded-md whitespace-pre-wrap font-body min-h-[50px]">
                    {renderContentSafely(item.responseA, "No response from Model A")}
                  </div>
                </div>
              ) : (
                item.runModeUsed === 'b_only' && (
                  <div className="p-3 bg-muted/50 rounded-md flex items-center text-muted-foreground text-sm">
                    <Info className="mr-2 h-4 w-4 shrink-0" /> Model A not run.
                  </div>
                )
              )}

              {item.responseB !== null && item.responseB !== undefined ? (
                <div>
                  <h3 className="flex items-center font-semibold mb-1 text-primary">
                    <Bot className="mr-2 h-5 w-5" /> Model B Response
                  </h3>
                  <div className="prose prose-sm max-w-none p-3 bg-background/50 rounded-md whitespace-pre-wrap font-body min-h-[50px]">
                    {renderContentSafely(item.responseB, "No response from Model B")}
                  </div>
                </div>
              ) : (
                 item.runModeUsed === 'a_only' && (
                  <div className="p-3 bg-muted/50 rounded-md flex items-center text-muted-foreground text-sm">
                    <Info className="mr-2 h-4 w-4 shrink-0" /> Model B not run.
                  </div>
                )
              )}
            </div>
            
            {(item.responseA !== null || item.responseB !== null) && item.evaluation !== null && item.evaluation !== undefined && (
              <>
                <Separator />
                <div>
                  <h3 className="flex items-center font-semibold mb-1 text-accent">
                    <CheckSquare className="mr-2 h-5 w-5" /> Evaluation
                  </h3>
                  <div className="prose prose-sm max-w-none p-3 bg-background/50 rounded-md whitespace-pre-wrap font-body min-h-[50px]">
                    {renderContentSafely(item.evaluation, "No evaluation available")}
                  </div>
                </div>
              </>
            )}
            {(item.responseA === null && item.responseA === undefined && item.responseB === null && item.responseB === undefined && !item.error) && (
               <div className="p-3 bg-muted/50 rounded-md flex items-center text-muted-foreground text-sm">
                 <Info className="mr-2 h-4 w-4 shrink-0" /> No models were run for this prompt item.
               </div>
            )}
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
