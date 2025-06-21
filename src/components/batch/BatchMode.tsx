
'use client';

import React, { useState } from 'react';
import FileUpload from './FileUpload';
import BatchItemCard from './BatchItemCard';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import type { ProcessedBatchItem, BatchFileItem } from '@/types';
import { PlayCircle, ListChecks, ServerCrash, Ban } from 'lucide-react';

interface BatchModeProps {
  batchResults: ProcessedBatchItem[];
  onProcessBatch: (fileContent: BatchFileItem[]) => Promise<void>;
  isLoading: boolean;
  progress: number;
  onCancel: () => void;
  isCancelling: boolean;
}

const BatchMode: React.FC<BatchModeProps> = ({ batchResults, onProcessBatch, isLoading, progress, onCancel, isCancelling }) => {
  const [stagedFileContent, setStagedFileContent] = useState<BatchFileItem[] | null>(null);

  const handleFileUploaded = (content: BatchFileItem[]) => {
    setStagedFileContent(content);
  };

  const handleStartProcessing = () => {
    if (stagedFileContent) {
      onProcessBatch(stagedFileContent);
    }
  };

  return (
    <div className="flex flex-col h-full p-4 space-y-4">
      <FileUpload onFileUpload={handleFileUploaded} isLoading={isLoading} />

      {stagedFileContent && !isLoading && batchResults.length === 0 && (
        <Button onClick={handleStartProcessing} disabled={isLoading || !stagedFileContent} className="w-full sm:w-auto">
          <PlayCircle className="mr-2 h-4 w-4" />
          Start Processing ({stagedFileContent.length} prompts)
        </Button>
      )}

      {isLoading && (
        <div className="flex flex-col items-center space-y-2">
          <p className="text-sm text-muted-foreground text-center">Processing batch... {Math.round(progress)}%</p>
          <Progress value={progress} className="w-full max-w-md" />
          <Button onClick={onCancel} variant="outline" className="mt-4" disabled={isCancelling}>
              <Ban className="mr-2 h-4 w-4" />
              {isCancelling ? 'Cancelling...' : 'Cancel Processing'}
          </Button>
        </div>
      )}

      {batchResults.length > 0 && !isLoading && (
         <h2 className="text-2xl font-semibold font-headline text-primary pt-4">Batch Results</h2>
      )}

      {(batchResults.length === 0 && !isLoading && !stagedFileContent) ? (
         <div className="flex-grow flex flex-col items-center justify-center text-muted-foreground p-8">
            <ListChecks size={64} className="mb-4 opacity-50" />
            <p className="text-xl font-semibold">Batch Evaluation</p>
            <p className="text-center">Upload a JSON file and process it to see results here.</p>
        </div>
      ) : (batchResults.length === 0 && !isLoading && stagedFileContent) ? (
        <div className="flex-grow flex flex-col items-center justify-center text-muted-foreground p-8">
            <PlayCircle size={64} className="mb-4 opacity-50" />
            <p className="text-xl font-semibold">Ready to Process</p>
            <p className="text-center">Click "Start Processing" to evaluate the uploaded prompts.</p>
        </div>
      ) : batchResults.length > 0 ? (
        <ScrollArea className="flex-grow bg-background/30 rounded-lg p-2">
          <div className="space-y-4">
            {batchResults.map((item) => (
              <BatchItemCard key={item.id} item={item} />
            ))}
          </div>
        </ScrollArea>
      ) : null}
    </div>
  );
};

export default BatchMode;
