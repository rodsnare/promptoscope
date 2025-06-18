
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { ConversationTurn } from '@/types';
import { Bot, UserCircle, CheckSquare } from 'lucide-react';

interface ConversationTurnCardProps {
  turn: ConversationTurn;
}

const ConversationTurnCard: React.FC<ConversationTurnCardProps> = ({ turn }) => {
  let displayUserPromptContent: string | JSX.Element;
  const userPromptValue = turn.userPrompt;

  if (typeof userPromptValue === 'object' && userPromptValue !== null && 'prompt' in userPromptValue && typeof (userPromptValue as any).prompt === 'string') {
    displayUserPromptContent = (userPromptValue as any).prompt;
    if (!displayUserPromptContent) {
      displayUserPromptContent = <span className="text-muted-foreground italic">No user prompt</span>;
    }
  } else if (typeof userPromptValue === 'string') {
    displayUserPromptContent = userPromptValue || <span className="text-muted-foreground italic">No user prompt</span>;
  } else {
    console.warn(`ConversationTurnCard: turn.userPrompt is an unexpected type for ID ${turn.id}. Value:`, userPromptValue);
    displayUserPromptContent = <span className="text-muted-foreground italic">Invalid user prompt format</span>;
  }

  const renderPotentiallyObjectContent = (content: any, fieldName: string): string | JSX.Element => {
    if (typeof content === 'string') {
      return content || <span className="text-muted-foreground italic">No response</span>;
    }
    if (typeof content === 'object' && content !== null) {
      if ('prompt' in content && typeof content.prompt === 'string' && Object.keys(content).length === 1) {
         console.warn(`ConversationTurnCard: item.${fieldName} was an object {prompt: string} for ID ${turn.id}. Rendering inner prompt string.`);
        return content.prompt;
      }
      console.warn(`ConversationTurnCard: item.${fieldName} is an unexpected object for ID ${turn.id}. Content:`, JSON.stringify(content));
      return <span className="text-destructive italic">[Malformed ${fieldName} Object]</span>;
    }
     // Handles null, undefined, numbers, booleans by attempting to convert to string or showing placeholder
    return content?.toString() || <span className="text-muted-foreground italic">No response</span>;
  };

  return (
    <Card className="mb-6 shadow-lg bg-card/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center text-lg font-semibold">
          <UserCircle className="mr-2 h-5 w-5 text-primary" />
          User Prompt
        </CardTitle>
        <CardDescription className="pt-1 font-code text-sm">{displayUserPromptContent}</CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="flex items-center font-semibold mb-1 text-primary">
              <Bot className="mr-2 h-5 w-5" /> Model A Response
            </h3>
            <div className="prose prose-sm max-w-none p-3 bg-background/50 rounded-md whitespace-pre-wrap font-body">
              {renderPotentiallyObjectContent(turn.responseA, 'responseA')}
            </div>
          </div>
          <div>
            <h3 className="flex items-center font-semibold mb-1 text-primary">
              <Bot className="mr-2 h-5 w-5" /> Model B Response
            </h3>
            <div className="prose prose-sm max-w-none p-3 bg-background/50 rounded-md whitespace-pre-wrap font-body">
              {renderPotentiallyObjectContent(turn.responseB, 'responseB')}
            </div>
          </div>
        </div>
        
        <Separator />
        
        <div>
          <h3 className="flex items-center font-semibold mb-1 text-accent">
            <CheckSquare className="mr-2 h-5 w-5" /> Evaluation
          </h3>
          <div className="prose prose-sm max-w-none p-3 bg-background/50 rounded-md whitespace-pre-wrap font-body">
            {renderPotentiallyObjectContent(turn.evaluation, 'evaluation')}
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <p className="text-xs text-muted-foreground">
          Evaluated on: {new Date(turn.timestamp).toLocaleString()}
        </p>
      </CardFooter>
    </Card>
  );
};

export default ConversationTurnCard;
