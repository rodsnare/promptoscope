export interface ApiConfig {
  temperature: number;
  topK: number;
  maxOutputTokens: number;
}

export interface ConversationTurn {
  id: string;
  userPrompt: string;
  fullPromptA?: string; // Optional: Store the fully constructed prompt if needed
  fullPromptB?: string; // Optional
  responseA: string;
  responseB: string;
  evaluation: string;
  timestamp: Date;
}

export interface BatchFileItem {
  id: string; // or number
  prompt: string; 
}

export interface ProcessedBatchItem extends BatchFileItem {
  responseA?: string;
  responseB?: string;
  evaluation?: string;
  error?: string;
  timestamp: Date;
}

export interface AppConfig {
  systemInstruction: string;
  promptATemplate: string;
  promptBTemplate: string;
  apiConfig: ApiConfig;
}

export type EvaluationMode = "interactive" | "batch";
