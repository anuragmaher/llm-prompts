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
    console.log('chunkText called with:', { 
      textLength: text.length, 
      chunkSize, 
      overlap 
    });
    
    const chunks: string[] = [];
    let start = 0;
    
    // Safety check to prevent infinite loops
    if (chunkSize <= 0 || overlap < 0 || overlap >= chunkSize) {
      throw new Error(`Invalid chunk parameters: chunkSize=${chunkSize}, overlap=${overlap}`);
    }
    
    while (start < text.length) {
      const end = Math.min(start + chunkSize, text.length);
      const chunk = text.slice(start, end);
      
      console.log(`Creating chunk ${chunks.length}: start=${start}, end=${end}, length=${chunk.length}`);
      chunks.push(chunk);
      
      // Move start forward, but ensure we make progress
      const newStart = end - overlap;
      
      // If we're not making progress, break
      if (newStart <= start) {
        console.log('Breaking: newStart <= start', { newStart, start });
        break;
      }
      
      start = newStart;
      
      // Safety break to prevent infinite loops
      if (chunks.length > 1000) {
        console.error('Too many chunks, breaking to prevent infinite loop');
        break;
      }
    }
    
    console.log(`Chunking complete: ${chunks.length} chunks created`);
    return chunks;
  }

  private async getEmbedding(text: string): Promise<number[]> {
    try {
      console.log('getEmbedding called for text length:', text.length);
      
      // Check if OpenAI API key is available
      const apiKey = process.env.REACT_APP_OPENAI_API_KEY;
      if (!apiKey) {
        console.warn('OpenAI API key not configured, using mock embedding');
        // Fallback to mock embedding (1024 dimensions to match Pinecone index)
        const mockEmbedding: number[] = [];
        for (let i = 0; i < 1024; i++) {
          mockEmbedding.push(Math.random() - 0.5);
        }
        return mockEmbedding;
      }

      console.log('Using OpenAI API for embeddings...');
      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'text-embedding-3-large',
          input: text,
          dimensions: 1024,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`OpenAI API error: ${response.status} ${response.statusText} - ${errorText}`);
        throw new Error(`Embedding API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      
      // Validate the response structure
      if (!data || !data.data || !Array.isArray(data.data) || data.data.length === 0) {
        throw new Error('Invalid embedding API response: missing or empty data array');
      }
      
      const embedding = data.data[0].embedding;
      if (!Array.isArray(embedding)) {
        throw new Error('Invalid embedding API response: embedding is not an array');
      }
      
      console.log(`OpenAI embedding received: ${embedding.length} dimensions`);
      return embedding;
    } catch (error) {
      console.error('getEmbedding error:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to get embedding: ${error.message}`);
      }
      throw new Error('Failed to get embedding: Unknown error');
    }
  }

  private getPineconeUrl(path: string): string {
    if (!this.config) {
      throw new Error('Pinecone not configured');
    }
    
    // Use the correct Pinecone URL format based on your actual index
    // From your screenshot: https://draft-kidmlxz.svc.aped-4627-b74a.pinecone.io
    const baseUrl = `https://${this.config.indexName}-kidmlxz.svc.aped-4627-b74a.pinecone.io`;
    const fullUrl = `${baseUrl}${path}`;
    console.log('Pinecone URL constructed:', fullUrl);
    return fullUrl;
  }

  private async pineconeRequest(path: string, options: RequestInit = {}): Promise<any> {
    if (!this.config) {
      throw new Error('Pinecone not configured');
    }

    try {
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

      const data = await response.json();
      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Pinecone request failed: ${error.message}`);
      }
      throw new Error('Pinecone request failed: Unknown error');
    }
  }

  async indexDocument(document: SavedDocument): Promise<void> {
    console.log('=== DocumentService.indexDocument START ===');
    console.log('Document to index:', {
      id: document.id,
      name: document.name,
      contentLength: document.content.length
    });
    
    console.log('Validating configuration...');
    const validation = this.validateConfig();
    console.log('Validation result:', validation);
    if (!validation.isValid) {
      throw new Error(`Configuration error: ${validation.errors.join(', ')}`);
    }

    // Chunk the document
    console.log('=== CHUNKING DOCUMENT ===');
    const textChunks = this.chunkText(document.content);
    console.log(`Document chunked into ${textChunks.length} chunks`);
    console.log('First few chunks:', textChunks.slice(0, 3).map((chunk, i) => ({
      index: i,
      length: chunk.length,
      preview: chunk.substring(0, 100) + '...'
    })));
    
    // Create embeddings and upsert to Pinecone
    console.log('=== CREATING EMBEDDINGS ===');
    const vectors: PineconeVector[] = [];
    const chunks: DocumentChunk[] = [];
    
    for (let i = 0; i < textChunks.length; i++) {
      const chunk = textChunks[i];
      const chunkId = `${document.id}_chunk_${i}`;
      
      console.log(`\n--- Processing chunk ${i + 1}/${textChunks.length} ---`);
      console.log('Chunk ID:', chunkId);
      console.log('Chunk length:', chunk.length);
      console.log('Chunk preview:', chunk.substring(0, 50) + '...');
      
      try {
        console.log('Getting embedding for chunk...');
        const embedding = await this.getEmbedding(chunk);
        console.log('Embedding received:', typeof embedding, Array.isArray(embedding));
        
        // Validate embedding dimensions
        if (!Array.isArray(embedding) || embedding.length === 0) {
          console.error(`Invalid embedding for chunk ${i}:`, { 
            isArray: Array.isArray(embedding), 
            length: embedding?.length 
          });
          throw new Error(`Invalid embedding received for chunk ${i}: not an array or empty`);
        }
        
        console.log(`Embedding validation passed: ${embedding.length} dimensions`);
        
        console.log('Creating Pinecone vector object...');
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
        console.log('Pinecone vector created successfully');
        
        vectors.push(pineconeVector);
        console.log(`Added vector to batch (${vectors.length} total)`);
        
        chunks.push({
          id: chunkId,
          content: chunk,
          pineconeId: chunkId,
          startIndex: 0, // Would need to calculate actual position
          endIndex: chunk.length,
        });
        console.log(`Added chunk to collection (${chunks.length} total)`);
      } catch (error) {
        console.error(`FAILED to create embedding for chunk ${i}:`, error);
        console.error('Error details:', {
          name: error instanceof Error ? error.name : 'Unknown',
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        });
        // Continue with other chunks even if one fails
        // Add a note about the failed chunk
        chunks.push({
          id: chunkId,
          content: chunk,
          pineconeId: '', // Empty to indicate failure
          startIndex: 0,
          endIndex: chunk.length,
        });
      }
    }

    if (vectors.length > 0) {
      console.log('=== UPSERTING TO PINECONE ===');
      console.log(`Upserting ${vectors.length} vectors to Pinecone`);
      console.log('Sample vector:', {
        id: vectors[0].id,
        valuesLength: vectors[0].values.length,
        metadata: vectors[0].metadata
      });
      
      try {
        // Real Pinecone call
        const upsertResult = await this.pineconeRequest('/vectors/upsert', {
          method: 'POST',
          body: JSON.stringify({ vectors }),
        });
        
        console.log('Pinecone upsert successful:', upsertResult);
      } catch (error) {
        console.error('Pinecone upsert failed:', error);
        throw error;
      }
      
      // Update document with chunks
      document.chunks = chunks;
      this.saveDocument(document);
      console.log('Document updated with chunks and saved');
    } else {
      console.log('No vectors to upsert');
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