'use client';

import React, { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';

interface PromptInputFormProps {
  onSubmit: (prompt: string) => void;
  isLoading: boolean;
}

const PromptInputForm: React.FC<PromptInputFormProps> = ({ onSubmit, isLoading }) => {
  const [prompt, setPrompt] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      onSubmit(prompt.trim());
      setPrompt('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-card rounded-lg shadow">
      <Label htmlFor="interactive-prompt" className="block text-sm font-medium mb-1">Enter your prompt:</Label>
      <Textarea
        id="interactive-prompt"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Type your prompt here..."
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

// Dummy Label to satisfy TS if @radix-ui/react-label is not directly used for this component's label
const Label: React.FC<React.LabelHTMLAttributes<HTMLLabelElement>> = ({ children, ...props }) => (
  <label {...props}>{children}</label>
);


export default PromptInputForm;
