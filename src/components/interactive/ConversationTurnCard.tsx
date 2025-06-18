
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { ConversationTurn } from '@/types';
import { Bot, UserCircle, CheckSquare } from 'lucide-react';

interface ConversationTurnCardProps {
  turn: ConversationTurn;
}

const renderPotentiallyObjectContent = (content: any, fieldName: string, itemId: string): string | JSX.Element => {
    // 1. Handle direct strings
    if (typeof content === 'string') {
      return content || <span className="text-muted-foreground italic">No response</span>;
    }

    // 2. Handle null or undefined
    if (content === null || content === undefined) {
      return <span className="text-muted-foreground italic">No response</span>;
    }

    // 3. Handle objects
    if (typeof content === 'object') {
      // Specifically look for { prompt: "string_value" }
      if (content.hasOwnProperty('prompt') && typeof content.prompt === 'string') {
        return content.prompt || <span className="text-muted-foreground italic">No response from prompt key</span>;
      }
      // ANY other object structure (including {prompt: <non-string>}, or objects without 'prompt')
      console.warn(
        `renderPotentiallyObjectContent: Field '${fieldName}' for ID ${itemId} is an unexpected object or malformed prompt structure. Content:`,
        JSON.stringify(content)
      );
      return <span className="text-destructive italic">[Invalid Content in {fieldName}]</span>;
    }

    // 4. Handle other primitives (booleans, numbers) by converting to string
    return String(content);
};

const ConversationTurnCard: React.FC<ConversationTurnCardProps> = ({ turn }) => {
  const displayUserPromptContent = typeof turn.userPrompt === 'string'
    ? turn.userPrompt || <span className="text-muted-foreground italic">No user prompt</span>
    : <span className="text-destructive italic">[Invalid User Prompt Format]</span>;

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
