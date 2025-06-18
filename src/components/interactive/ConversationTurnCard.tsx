
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { ConversationTurn } from '@/types';
import { Bot, UserCircle, CheckSquare } from 'lucide-react';

// Simplified and robust content renderer for AI outputs
const renderAIOutput = (content: any): string | JSX.Element => {
  if (typeof content === 'string') {
    return content || <span className="text-muted-foreground italic">No response</span>;
  }
  if (content === null || content === undefined) {
    return <span className="text-muted-foreground italic">No response</span>;
  }
  if (typeof content === 'object') {
    if (Object.prototype.hasOwnProperty.call(content, 'prompt') && typeof content.prompt === 'string') {
      return content.prompt || <span className="text-muted-foreground italic">Empty prompt value</span>;
    }
    // For any other object structure, or if content.prompt is not a string
    console.warn('renderAIOutput: Rendering placeholder for unexpected object structure:', JSON.stringify(content));
    return <span className="text-destructive italic">[Object Content Received]</span>;
  }
  // For other primitive types like boolean or number
  return String(content);
};

interface ConversationTurnCardProps {
  turn: ConversationTurn;
}

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
        <CardDescription className="pt-1 font-code text-sm whitespace-pre-wrap">{displayUserPromptContent}</CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="flex items-center font-semibold mb-1 text-primary">
              <Bot className="mr-2 h-5 w-5" /> Model A Response
            </h3>
            <div className="prose prose-sm max-w-none p-3 bg-background/50 rounded-md whitespace-pre-wrap font-body min-h-[50px]">
              {renderAIOutput(turn.responseA)}
            </div>
          </div>
          <div>
            <h3 className="flex items-center font-semibold mb-1 text-primary">
              <Bot className="mr-2 h-5 w-5" /> Model B Response
            </h3>
            <div className="prose prose-sm max-w-none p-3 bg-background/50 rounded-md whitespace-pre-wrap font-body min-h-[50px]">
              {renderAIOutput(turn.responseB)}
            </div>
          </div>
        </div>
        
        <Separator />
        
        <div>
          <h3 className="flex items-center font-semibold mb-1 text-accent">
            <CheckSquare className="mr-2 h-5 w-5" /> Evaluation
          </h3>
          <div className="prose prose-sm max-w-none p-3 bg-background/50 rounded-md whitespace-pre-wrap font-body min-h-[50px]">
            {renderAIOutput(turn.evaluation)}
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
