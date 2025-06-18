'use client';

import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { EvaluationMode } from '@/types';
import { MessageCircle, ListChecks } from 'lucide-react';

interface ModeSwitcherProps {
  currentMode: EvaluationMode;
  onModeChange: (mode: EvaluationMode) => void;
}

const ModeSwitcher: React.FC<ModeSwitcherProps> = ({ currentMode, onModeChange }) => {
  return (
    <div className="py-4 px-4 md:px-8 bg-background border-b">
      <Tabs value={currentMode} onValueChange={(value) => onModeChange(value as EvaluationMode)} className="w-full max-w-md mx-auto">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="interactive" className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            Interactive
          </TabsTrigger>
          <TabsTrigger value="batch" className="flex items-center gap-2">
            <ListChecks className="h-4 w-4" />
            Batch
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
};

export default ModeSwitcher;
