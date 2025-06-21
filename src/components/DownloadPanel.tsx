'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, FileJson, FileSpreadsheet } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from '@/components/ui/sheet';
import type { ConversationTurn, ProcessedBatchItem, EvaluationMode } from '@/types';
import { downloadJson, downloadCsv, formatInteractiveHistoryForCsv, formatBatchResultsForCsv } from '@/lib/export';

interface DownloadPanelProps {
  mode: EvaluationMode;
  interactiveHistory: ConversationTurn[];
  batchResults: ProcessedBatchItem[];
  isDisabled: boolean;
}

const DownloadPanel: React.FC<DownloadPanelProps> = ({ mode, interactiveHistory, batchResults, isDisabled }) => {
  const handleDownloadJson = () => {
    const dataToDownload = mode === 'interactive' ? interactiveHistory : batchResults;
    const filename = mode === 'interactive' ? 'interactive_eval_results.json' : 'batch_eval_results.json';
    downloadJson(dataToDownload, filename);
  };

  const handleDownloadCsv = () => {
    let csvData;
    let filename;
    if (mode === 'interactive') {
      csvData = formatInteractiveHistoryForCsv(interactiveHistory);
      filename = 'interactive_eval_results.csv';
    } else {
      csvData = formatBatchResultsForCsv(batchResults);
      filename = 'batch_eval_results.csv';
    }
    downloadCsv(csvData, filename);
  };
  
  const noData = (mode === 'interactive' && interactiveHistory.length === 0) || (mode === 'batch' && batchResults.length === 0);

  if (isDisabled || noData) {
    return null;
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="default"
          size="icon"
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50 animate-in fade-in-0 zoom-in-95"
          aria-label="Download results"
        >
          <Download className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="w-full sm:max-w-xl mx-auto rounded-t-lg border-t">
        <SheetHeader className="text-left">
          <SheetTitle>Download Evaluation Results</SheetTitle>
          <SheetDescription>
            Download the results from your '{mode}' evaluation session as either a JSON or CSV file.
          </SheetDescription>
        </SheetHeader>
        <div className="py-4 flex flex-col sm:flex-row gap-4">
          <Button onClick={handleDownloadJson} variant="outline" className="w-full sm:w-auto">
            <FileJson className="mr-2 h-4 w-4" />
            Download JSON
          </Button>
          <Button onClick={handleDownloadCsv} variant="outline" className="w-full sm:w-auto">
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Download CSV
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default DownloadPanel;
