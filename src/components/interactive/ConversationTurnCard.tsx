
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { ConversationTurn } from '@/types';
import { Bot, UserCircle, CheckSquare } from 'lucide-react';

interface ConversationTurnCardProps {
  turn: ConversationTurn;
}

const ConversationTurnCard: React.FC<ConversationTurnCardProps> = ({ turn }) => {
  // turn.userPrompt is expected to be a string due to getCleanedPromptString in page.tsx
  const displayUserPromptContent = turn.userPrompt || <span className="text-muted-foreground italic">No user prompt</span>;

  const renderPotentiallyObjectContent = (content: any, fieldName: string, turnId: string): string | JSX.Element => {
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
        console.warn(`ConversationTurnCard: Field '${fieldName}' for ID ${turnId} has a '.prompt' key, but its value is not a string. Value:`, JSON.stringify(content.prompt));
        return <span className="text-destructive italic">[Malformed {fieldName} (prompt value not string)]</span>;
      }
      // Case 3: content is some other object (does not have a 'prompt' key, or previous conditions not met).
      console.warn(`ConversationTurnCard: Field '${fieldName}' for ID ${turnId} is an unexpected object. Content:`, JSON.stringify(content));
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
              {renderPotentiallyObjectContent(turn.responseA, 'responseA', turn.id)}
            </div>
          </div>
          <div>
            <h3 className="flex items-center font-semibold mb-1 text-primary">
              <Bot className="mr-2 h-5 w-5" /> Model B Response
            </h3>
            <div className="prose prose-sm max-w-none p-3 bg-background/50 rounded-md whitespace-pre-wrap font-body">
              {renderPotentiallyObjectContent(turn.responseB, 'responseB', turn.id)}
            </div>
          </div>
        </div>
        
        <Separator />
        
        <div>
          <h3 className="flex items-center font-semibold mb-1 text-accent">
            <CheckSquare className="mr-2 h-5 w-5" /> Evaluation
          </h3>
          <div className="prose prose-sm max-w-none p-3 bg-background/50 rounded-md whitespace-pre-wrap font-body">
            {renderPotentiallyObjectContent(turn.evaluation, 'evaluation', turn.id)}
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
