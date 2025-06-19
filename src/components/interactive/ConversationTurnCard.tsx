
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { ConversationTurn } from '@/types';
import { Bot, UserCircle, CheckSquare } from 'lucide-react';

// Helper for AI responses & evaluation - expects data to be pre-cleaned to string in page.tsx
const renderCleanedString = (content: string | undefined | null, defaultText: string = "N/A"): string => {
  return content && typeof content === 'string' && content.trim() ? content : defaultText;
};

// Robust helper for the main user prompt, as it comes more directly from input
const getDisplayableUserPrompt = (promptInput: any): string => {
  if (typeof promptInput === 'string') {
    return promptInput || "No user prompt";
  }
  if (promptInput === null || promptInput === undefined) {
    return "No user prompt";
  }
  if (typeof promptInput === 'object' && promptInput.hasOwnProperty('prompt') && typeof promptInput.prompt === 'string') {
    return promptInput.prompt || "No user prompt";
  }
  // console.warn('getDisplayableUserPrompt: Rendering placeholder for unexpected prompt structure:', JSON.stringify(promptInput));
  return "[Invalid User Prompt Format]";
};

interface ConversationTurnCardProps {
  turn: ConversationTurn;
}

const ConversationTurnCard: React.FC<ConversationTurnCardProps> = ({ turn }) => {
  return (
    <Card className="mb-6 shadow-lg bg-card/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center text-lg font-semibold">
          <UserCircle className="mr-2 h-5 w-5 text-primary" />
          User Prompt
        </CardTitle>
        <CardDescription className="pt-1 font-code text-sm whitespace-pre-wrap">
          {getDisplayableUserPrompt(turn.userPrompt)}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="flex items-center font-semibold mb-1 text-primary">
              <Bot className="mr-2 h-5 w-5" /> Model A Response
            </h3>
            <div className="prose prose-sm max-w-none p-3 bg-background/50 rounded-md whitespace-pre-wrap font-body min-h-[50px]">
              {renderCleanedString(turn.responseA, "No response from Model A")}
            </div>
          </div>
          <div>
            <h3 className="flex items-center font-semibold mb-1 text-primary">
              <Bot className="mr-2 h-5 w-5" /> Model B Response
            </h3>
            <div className="prose prose-sm max-w-none p-3 bg-background/50 rounded-md whitespace-pre-wrap font-body min-h-[50px]">
              {renderCleanedString(turn.responseB, "No response from Model B")}
            </div>
          </div>
        </div>
        
        <Separator />
        
        <div>
          <h3 className="flex items-center font-semibold mb-1 text-accent">
            <CheckSquare className="mr-2 h-5 w-5" /> Evaluation
          </h3>
          <div className="prose prose-sm max-w-none p-3 bg-background/50 rounded-md whitespace-pre-wrap font-body min-h-[50px]">
            {renderCleanedString(turn.evaluation, "No evaluation")}
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
