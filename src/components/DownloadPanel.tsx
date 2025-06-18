'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, FileJson, FileSpreadsheet } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    return null; // Don't show panel if disabled or no data
  }

  return (
    <div className="p-4">
      <Card className="shadow-md bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center text-lg font-semibold">
            <Download className="mr-2 h-5 w-5 text-primary" />
            Download Results
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-2">
          <Button onClick={handleDownloadJson} variant="outline" className="w-full sm:w-auto">
            <FileJson className="mr-2 h-4 w-4" />
            Download JSON
          </Button>
          <Button onClick={handleDownloadCsv} variant="outline" className="w-full sm:w-auto">
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Download CSV
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default DownloadPanel;
