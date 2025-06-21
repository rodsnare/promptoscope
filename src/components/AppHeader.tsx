
import React from 'react';
import { Button } from '@/components/ui/button';
import { Settings2 } from 'lucide-react';
import { SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import type { EvaluationRunMode } from '@/types';

interface AppHeaderProps {
  runMode: EvaluationRunMode;
}

const AppHeader: React.FC<AppHeaderProps> = ({ runMode }) => {
  const modeMap: Record<EvaluationRunMode, string> = {
    a_vs_b: 'A vs B Comparison',
    a_only: 'Model A Only',
    b_only: 'Model B Only',
  };

  return (
    <header className="bg-primary/10 border-b border-primary/20 p-4 shadow-md sticky top-0 z-40 backdrop-blur-sm">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4">
          <h1 className="text-3xl font-headline font-bold text-primary">
            PromptEval Pro
          </h1>
          <Badge variant="outline" className="mt-1 sm:mt-0 border-primary/50 text-primary self-start sm:self-auto">
            {modeMap[runMode]}
          </Badge>
        </div>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" aria-label="Open configuration panel">
            <Settings2 className="h-5 w-5" />
          </Button>
        </SheetTrigger>
      </div>
    </header>
  );
};

export default AppHeader;
