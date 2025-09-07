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


