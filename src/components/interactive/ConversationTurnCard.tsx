
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { ConversationTurn } from '@/types';
import { Bot, UserCircle, CheckSquare } from 'lucide-react';

const renderContentSafely = (content: any, defaultText: string = "N/A"): string => {
  if (typeof content === 'string') {
    return content || defaultText;
  }
  if (typeof content === 'number' || typeof content === 'boolean') {
    return String(content);
  }
  if (content === null || content === undefined) {
    return defaultText;
  }
  if (typeof content === 'object' &&
      Object.prototype.hasOwnProperty.call(content, 'prompt') &&
      typeof content.prompt === 'string') {
    // console.warn('renderContentSafely (Interactive): Extracting from {prompt: string} object.');
    return content.prompt || defaultText;
  }
  if (typeof content === 'object') {
    // console.warn('renderContentSafely (Interactive): Attempting to stringify complex object.');
    try {
      const str = JSON.stringify(content);
      if (str === '{}') return '[Empty Object]';
      return str;
    } catch (e) {
      // console.error('renderContentSafely (Interactive): Failed to stringify object.', e);
      return '[Unstringifiable Object]';
    }
  }
  // console.warn('renderContentSafely (Interactive): Encountered unexpected type, converting to string:', typeof content);
  return String(content);
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
          {renderContentSafely(turn.userPrompt, "No user prompt")}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="flex items-center font-semibold mb-1 text-primary">
              <Bot className="mr-2 h-5 w-5" /> Model A Response
            </h3>
            <div className="prose prose-sm max-w-none p-3 bg-background/50 rounded-md whitespace-pre-wrap font-body min-h-[50px]">
              {renderContentSafely(turn.responseA, "No response from Model A")}
            </div>
          </div>
          <div>
            <h3 className="flex items-center font-semibold mb-1 text-primary">
              <Bot className="mr-2 h-5 w-5" /> Model B Response
            </h3>
            <div className="prose prose-sm max-w-none p-3 bg-background/50 rounded-md whitespace-pre-wrap font-body min-h-[50px]">
              {renderContentSafely(turn.responseB, "No response from Model B")}
            </div>
          </div>
        </div>
        
        <Separator />
        
        <div>
          <h3 className="flex items-center font-semibold mb-1 text-accent">
            <CheckSquare className="mr-2 h-5 w-5" /> Evaluation
          </h3>
          <div className="prose prose-sm max-w-none p-3 bg-background/50 rounded-md whitespace-pre-wrap font-body min-h-[50px]">
            {renderContentSafely(turn.evaluation, "No evaluation available")}
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
