
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { ConversationTurn } from '@/types';
import { Bot, UserCircle, CheckSquare } from 'lucide-react';

// Helper to render AI-generated content (responseA, responseB, evaluation)
const renderAIOutput = (content: any): string => {
  // Check if content is the specific object {prompt: "string_value"}
  if (typeof content === 'object' && content !== null && Object.prototype.hasOwnProperty.call(content, 'prompt') && typeof content.prompt === 'string') {
    return content.prompt || "No response";
  }
  // Check if it's already a string
  if (typeof content === 'string') {
    return content || "No response";
  }
  // Handle null or undefined
  if (content === null || content === undefined) {
    return "No response";
  }
  // Fallback for other types (objects not matching the specific structure, numbers, booleans)
  // console.warn('renderAIOutput: Rendering placeholder for unexpected structure:', JSON.stringify(content));
  return "[Unsupported Content]";
};

// Helper to display the main user prompt
const getDisplayableUserPrompt = (promptInput: any): string => {
  // Priority: Check if promptInput is the specific object {prompt: "string_value"}
  if (typeof promptInput === 'object' && promptInput !== null && Object.prototype.hasOwnProperty.call(promptInput, 'prompt') && typeof promptInput.prompt === 'string') {
    return promptInput.prompt || "No user prompt";
  }
  // Then, check if it's already a string
  if (typeof promptInput === 'string') {
    return promptInput || "No user prompt";
  }
  // Handle null or undefined
  if (promptInput === null || promptInput === undefined) {
    return "No user prompt";
  }
  // Fallback for other types
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
