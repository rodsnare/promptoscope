
export interface ApiConfig {
  temperature?: number;
  topK?: number;
  maxOutputTokens?: number;
}

export interface ModelProcessingConfig {
  systemInstruction: string;
  promptTemplate: string; // For Model A and B, user's input is injected into {{prompt}}
  apiConfig: ApiConfig;
}

export interface EvaluatorConfig {
  evaluationPromptTemplate: string; // Template for the evaluator, e.g., "Evaluate Response A: {{responseA}} vs Response B: {{responseB}} for Prompt: {{prompt}}"
  apiConfig: ApiConfig;
}

export type EvaluationRunMode = 'a_vs_b' | 'a_only' | 'b_only';

export interface AppConfig {
  runMode: EvaluationRunMode;
  modelAConfig: ModelProcessingConfig;
  modelBConfig: ModelProcessingConfig;
  evaluatorConfig: EvaluatorConfig;
}

export interface ConversationTurn {
  id: string;
  userPrompt: string;
  responseA: string | null; // Can be null if not run
  responseB: string | null; // Can be null if not run
  evaluation: string | null; // Can be null if not evaluated or if single run with no eval
  timestamp: Date;
  runModeUsed?: EvaluationRunMode; // Optional: store run mode for this turn
}

export interface BatchFileItem {
  id: string; // or number
  prompt: string;
}

export interface ProcessedBatchItem extends BatchFileItem {
  responseA?: string | null;
  responseB?: string | null;
  evaluation?: string | null;
  error?: string;
  timestamp: Date;
  runModeUsed?: EvaluationRunMode; // Optional: store run mode for this item
}

export type EvaluationMode = "interactive" | "batch"; // This is for UI mode, not the same as EvaluationRunMode
