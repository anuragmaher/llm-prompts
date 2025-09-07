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


