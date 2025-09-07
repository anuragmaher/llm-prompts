import { SavedDocument, DocumentChunk, RAGContext } from './types';

export interface DocumentServiceConfig {
  pineconeApiKey: string;
  indexName: string;
  environment: string;
}

interface PineconeVector {
  id: string;
  values: number[];
  metadata?: Record<string, any>;
}

interface PineconeQueryResponse {
  matches: {
    id: string;
    score: number;
    metadata?: Record<string, any>;
  }[];
}

export class DocumentService {
  private config: DocumentServiceConfig | null = null;

  constructor(config?: DocumentServiceConfig) {
    if (config) {
      this.updateConfig(config);
    }
  }

  updateConfig(config: DocumentServiceConfig) {
    this.config = config;
  }

  validateConfig(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!this.config?.pineconeApiKey) {
      errors.push('Pinecone API key is required');
    }
    
    if (!this.config?.indexName) {
      errors.push('Pinecone index name is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private chunkText(text: string, chunkSize: number = 1000, overlap: number = 200): string[] {
    const chunks: string[] = [];
    let start = 0;
    
    while (start < text.length) {
      const end = Math.min(start + chunkSize, text.length);
      chunks.push(text.slice(start, end));
      start = end - overlap;
      
      if (start >= text.length) break;
    }
    
    return chunks;
  }

  private async getEmbedding(text: string): Promise<number[]> {
    // For now, we'll use a simple placeholder embedding
    // In production, you'd want to use OpenAI's embedding API or similar
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'text-embedding-ada-002',
        input: text,
      }),
    });

    if (!response.ok) {
      throw new Error(`Embedding API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data[0].embedding;
  }

  private getPineconeUrl(path: string): string {
    if (!this.config) {
      throw new Error('Pinecone not configured');
    }
    return `https://${this.config.indexName}-${this.config.environment}.pinecone.io${path}`;
  }

  private async pineconeRequest(path: string, options: RequestInit = {}): Promise<any> {
    if (!this.config) {
      throw new Error('Pinecone not configured');
    }

    const url = this.getPineconeUrl(path);
    const response = await fetch(url, {
      ...options,
      headers: {
        'Api-Key': this.config.pineconeApiKey,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Pinecone API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return response.json();
  }

  async indexDocument(document: SavedDocument): Promise<void> {
    const validation = this.validateConfig();
    if (!validation.isValid) {
      throw new Error(`Configuration error: ${validation.errors.join(', ')}`);
    }

    // Chunk the document
    const textChunks = this.chunkText(document.content);
    
    // Create embeddings and upsert to Pinecone
    const vectors: PineconeVector[] = [];
    const chunks: DocumentChunk[] = [];
    
    for (let i = 0; i < textChunks.length; i++) {
      const chunk = textChunks[i];
      const chunkId = `${document.id}_chunk_${i}`;
      
      try {
        const embedding = await this.getEmbedding(chunk);
        
        const pineconeVector: PineconeVector = {
          id: chunkId,
          values: embedding,
          metadata: {
            documentId: document.id,
            documentName: document.name,
            chunkIndex: i,
            content: chunk,
            createdAt: document.createdAt,
          }
        };
        
        vectors.push(pineconeVector);
        
        chunks.push({
          id: chunkId,
          content: chunk,
          pineconeId: chunkId,
          startIndex: 0, // Would need to calculate actual position
          endIndex: chunk.length,
        });
      } catch (error) {
        console.error(`Failed to create embedding for chunk ${i}:`, error);
        // Continue with other chunks even if one fails
      }
    }

    if (vectors.length > 0) {
      // Upsert vectors to Pinecone
      await this.pineconeRequest('/vectors/upsert', {
        method: 'POST',
        body: JSON.stringify({ vectors }),
      });
      
      // Update document with chunks
      document.chunks = chunks;
      this.saveDocument(document);
    }
  }

  async searchDocuments(query: string, topK: number = 5): Promise<RAGContext> {
    const validation = this.validateConfig();
    if (!validation.isValid) {
      throw new Error(`Configuration error: ${validation.errors.join(', ')}`);
    }

    // Get embedding for query
    const queryEmbedding = await this.getEmbedding(query);
    
    // Search in Pinecone
    const searchResults: PineconeQueryResponse = await this.pineconeRequest('/query', {
      method: 'POST',
      body: JSON.stringify({
        vector: queryEmbedding,
        topK,
        includeMetadata: true,
      }),
    });

    // Extract relevant chunks and build context
    const relevantChunks: DocumentChunk[] = [];
    const sourceDocumentIds = new Set<string>();

    if (searchResults.matches) {
      for (const match of searchResults.matches) {
        if (match.metadata) {
          const chunk: DocumentChunk = {
            id: match.id,
            content: match.metadata.content as string,
            pineconeId: match.id,
            startIndex: 0, // Would need to calculate actual position
            endIndex: (match.metadata.content as string).length,
          };
          
          relevantChunks.push(chunk);
          sourceDocumentIds.add(match.metadata.documentId as string);
        }
      }
    }

    // Get source documents from localStorage
    const savedDocuments = this.getSavedDocuments();
    const sources = savedDocuments.filter(doc => sourceDocumentIds.has(doc.id));

    return {
      query,
      relevantChunks,
      sources,
    };
  }

  async deleteDocument(documentId: string): Promise<void> {
    const validation = this.validateConfig();
    if (!validation.isValid) {
      throw new Error(`Configuration error: ${validation.errors.join(', ')}`);
    }

    // Find all chunks for this document
    const savedDocuments = this.getSavedDocuments();
    const document = savedDocuments.find(doc => doc.id === documentId);
    
    if (document) {
      // Delete all chunks from Pinecone
      const chunkIds = document.chunks.map(chunk => chunk.pineconeId);
      if (chunkIds.length > 0) {
        await this.pineconeRequest('/vectors/delete', {
          method: 'POST',
          body: JSON.stringify({ ids: chunkIds }),
        });
      }
    }
  }

  // Local storage methods for document metadata
  getSavedDocuments(): SavedDocument[] {
    const saved = localStorage.getItem('llm-prompt-tester-documents');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (error) {
        console.warn('Failed to load saved documents');
        return [];
      }
    }
    return [];
  }

  saveDocument(document: SavedDocument): void {
    const documents = this.getSavedDocuments();
    const existingIndex = documents.findIndex(d => d.id === document.id);
    
    if (existingIndex >= 0) {
      documents[existingIndex] = document;
    } else {
      documents.push(document);
    }
    
    localStorage.setItem('llm-prompt-tester-documents', JSON.stringify(documents));
  }

  deleteDocumentFromStorage(documentId: string): void {
    const documents = this.getSavedDocuments();
    const filtered = documents.filter(d => d.id !== documentId);
    localStorage.setItem('llm-prompt-tester-documents', JSON.stringify(filtered));
  }
}