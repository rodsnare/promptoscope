import React from 'react';
import { Button } from '@/components/ui/button';
import { Settings2 } from 'lucide-react';
import { SheetTrigger } from '@/components/ui/sheet';

interface AppHeaderProps {
  onConfigOpen: () => void;
}

const AppHeader: React.FC<AppHeaderProps> = ({ onConfigOpen }) => {
  return (
    <header className="bg-primary/10 border-b border-primary/20 p-4 shadow-md sticky top-0 z-40 backdrop-blur-sm">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-3xl font-headline font-bold text-primary">
          PromptEval Pro
        </h1>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" onClick={onConfigOpen} aria-label="Open configuration panel">
            <Settings2 className="h-5 w-5" />
          </Button>
        </SheetTrigger>
      </div>
    </header>
  );
};

export default AppHeader;
