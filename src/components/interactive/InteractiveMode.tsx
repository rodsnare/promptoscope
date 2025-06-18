'use client';

import React from 'react';
import PromptInputForm from './PromptInputForm';
import ConversationTurnCard from './ConversationTurnCard';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { ConversationTurn } from '@/types';
import { MessageSquare } from 'lucide-react';

interface InteractiveModeProps {
  history: ConversationTurn[];
  onSubmitPrompt: (prompt: string) => Promise<void>;
  isLoading: boolean;
}

const InteractiveMode: React.FC<InteractiveModeProps> = ({ history, onSubmitPrompt, isLoading }) => {
  return (
    <div className="flex flex-col h-full">
      <div className="p-4">
        <PromptInputForm onSubmit={onSubmitPrompt} isLoading={isLoading} />
      </div>

      {history.length === 0 && !isLoading ? (
         <div className="flex-grow flex flex-col items-center justify-center text-muted-foreground p-8">
            <MessageSquare size={64} className="mb-4 opacity-50" />
            <p className="text-xl font-semibold">Conversation History</p>
            <p className="text-center">Your evaluated prompts and responses will appear here.</p>
        </div>
      ) : (
        <ScrollArea className="flex-grow p-4 bg-background/30 rounded-lg">
          <div className="space-y-4">
            {history.map((turn) => (
              <ConversationTurnCard key={turn.id} turn={turn} />
            ))}
            {isLoading && (
              <div className="flex items-center justify-center p-8 text-muted-foreground">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing evaluation...
              </div>
            )}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};

export default InteractiveMode;
