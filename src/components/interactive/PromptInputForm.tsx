
'use client';

import React, { useState, useRef } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';
import { Label } from '@/components/ui/label';

interface PromptInputFormProps {
  onSubmit: (prompt: { prompt: string }) => void;
  isLoading: boolean;
}

const PromptInputForm: React.FC<PromptInputFormProps> = ({ onSubmit, isLoading }) => {
  const [prompt, setPrompt] = useState('');
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      onSubmit({ prompt: prompt.trim() });
      setPrompt('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (prompt.trim()) {
        formRef.current?.requestSubmit();
      }
    }
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="p-4 bg-card rounded-lg shadow">
      <Label htmlFor="interactive-prompt" className="block text-sm font-medium mb-1">Enter your prompt:</Label>
      <Textarea
        id="interactive-prompt"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type your prompt here... (Shift+Enter for a new line)"
        className="w-full min-h-[80px] rounded-md shadow-sm focus:ring-primary focus:border-primary"
        rows={3}
        disabled={isLoading}
      />
      <Button type="submit" className="mt-3 w-full sm:w-auto" disabled={isLoading || !prompt.trim()}>
        <Send className="mr-2 h-4 w-4" />
        {isLoading ? 'Evaluating...' : 'Evaluate Prompt'}
      </Button>
    </form>
  );
};

export default PromptInputForm;
