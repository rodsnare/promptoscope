
import type { ConversationTurn, ProcessedBatchItem } from '@/types';

export function downloadJson(data: unknown, filename: string) {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function convertToCsv(data: Record<string, any>[]): string {
  if (data.length === 0) {
    return "";
  }
  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(','),
    ...data.map(row =>
      headers.map(header => JSON.stringify(row[header] ?? '')).join(',')
    ),
  ];
  return csvRows.join('\n');
}

export function downloadCsv(data: Record<string, any>[], filename: string) {
  const csvString = convertToCsv(data);
  const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function formatInteractiveHistoryForCsv(history: ConversationTurn[]): Record<string, any>[] {
  return history.map((turn, index) => ({
    turn_id: turn.id,
    question_number: index + 1, // Retain for sequence if needed
    user_prompt: turn.userPrompt,
    run_mode: turn.runModeUsed ?? 'N/A',
    response_A: turn.responseA ?? '',
    response_B: turn.responseB ?? '',
    evaluation: turn.evaluation ?? '',
    timestamp: turn.timestamp.toISOString(),
  }));
}

export function formatBatchResultsForCsv(results: ProcessedBatchItem[]): Record<string, any>[] {
  return results.map(item => ({
    item_id: item.id,
    prompt: item.prompt,
    run_mode: item.runModeUsed ?? 'N/A',
    response_A: item.responseA ?? '',
    response_B: item.responseB ?? '',
    evaluation: item.evaluation ?? '',
    error: item.error ?? '',
    timestamp: item.timestamp.toISOString(),
  }));
}
