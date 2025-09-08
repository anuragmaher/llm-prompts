export interface SavedPrompt {
  id: string;
  name: string;
  prompt: string;
  variables: string; // JSON string
  createdAt: number;
  lastModified: number;
}

export interface SavedVariableSet {
  id: string;
  name: string;
  variables: string; // JSON string
  createdAt: number;
  lastModified: number;
}

export interface DocumentChunk {
  id: string;
  content: string;
  pineconeId: string;
  startIndex: number;
  endIndex: number;
}

export interface SavedDocument {
  id: string;
  name: string;
  content: string;
  pineconeId: string;
  chunks: DocumentChunk[];
  createdAt: number;
  lastModified: number;
  fileType: string;
  fileSize: number;
}

export interface RAGContext {
  query: string;
  relevantChunks: DocumentChunk[];
  sources: SavedDocument[];
}

export interface PromptStep {
  id: string;
  name: string;
  prompt: string;
  variables: string; // JSON string
  order: number;
  outputVariable?: string; // Variable name to store this step's output for next step
}

export interface MultiStepPrompt {
  id: string;
  name: string;
  description: string;
  steps: PromptStep[];
  globalVariables: string; // JSON string - variables available to all steps
  createdAt: number;
  lastModified: number;
}

export interface StepExecutionResult {
  stepId: string;
  stepName: string;
  input: string;
  output: string;
  executionTime: number;
  firstByteTime?: number;
  error?: string;
}

export interface MultiStepExecutionResult {
  multiStepPromptId: string;
  results: StepExecutionResult[];
  totalExecutionTime: number;
  firstPaintTime?: number;
  success: boolean;
  finalOutput: string;
  executedAt: number;
  terminatedEarly?: boolean;
  terminationReason?: string;
}


