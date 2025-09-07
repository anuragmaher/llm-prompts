import React, { useState, useRef, useCallback } from 'react';
import { SavedDocument } from './types';
import { DocumentService, DocumentServiceConfig } from './documentService';

interface DocumentManagerProps {
  isOpen: boolean;
  onClose: () => void;
  documentService: DocumentService;
  documentConfig: DocumentServiceConfig | null;
}

const DocumentManager: React.FC<DocumentManagerProps> = ({
  isOpen,
  onClose,
  documentService,
  documentConfig
}) => {
  const [savedDocuments, setSavedDocuments] = useState<SavedDocument[]>(() => 
    documentService.getSavedDocuments()
  );
  const [uploadingDocuments, setUploadingDocuments] = useState<Set<string>>(new Set());
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const refreshDocuments = useCallback(() => {
    setSavedDocuments(documentService.getSavedDocuments());
  }, [documentService]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          resolve(e.target.result as string);
        } else {
          reject(new Error('Failed to read file'));
        }
      };
      reader.onerror = () => reject(new Error('File reading error'));
      reader.readAsText(file);
    });
  };

  const handleFileUpload = async (files: FileList) => {
    if (!documentConfig) {
      setError('Document service not configured. Please check your Pinecone settings.');
      return;
    }

    const validation = documentService.validateConfig();
    if (!validation.isValid) {
      setError(`Configuration error: ${validation.errors.join(', ')}`);
      return;
    }

    setError('');
    
    for (const file of Array.from(files)) {
      const fileId = `${Date.now()}_${file.name}`;
      
      try {
        setUploadingDocuments(prev => new Set(prev).add(fileId));
        setProcessingStatus(`Reading ${file.name}...`);

        const content = await readFileContent(file);
        
        setProcessingStatus(`Processing ${file.name}...`);

        const document: SavedDocument = {
          id: fileId,
          name: file.name,
          content,
          pineconeId: fileId,
          chunks: [], // Will be populated during indexing
          createdAt: Date.now(),
          lastModified: Date.now(),
          fileType: file.type || 'text/plain',
          fileSize: file.size
        };

        // Save to local storage first
        documentService.saveDocument(document);
        
        setProcessingStatus(`Indexing ${file.name} to vector database...`);

        // Index to Pinecone
        await documentService.indexDocument(document);
        
        setProcessingStatus(`${file.name} successfully uploaded and indexed!`);
        
        refreshDocuments();
      } catch (error) {
        console.error(`Failed to process ${file.name}:`, error);
        setError(`Failed to process ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setUploadingDocuments(prev => {
          const newSet = new Set(prev);
          newSet.delete(fileId);
          return newSet;
        });
      }
    }
    
    setTimeout(() => setProcessingStatus(''), 3000);
  };

  const handleDeleteDocument = async (documentId: string) => {
    try {
      setProcessingStatus('Deleting document from vector database...');
      
      // Delete from Pinecone
      await documentService.deleteDocument(documentId);
      
      // Delete from local storage
      documentService.deleteDocumentFromStorage(documentId);
      
      refreshDocuments();
      setProcessingStatus('Document deleted successfully!');
      setTimeout(() => setProcessingStatus(''), 2000);
    } catch (error) {
      console.error('Failed to delete document:', error);
      setError(`Failed to delete document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  if (!isOpen) return null;

  return (
    <div className="prompt-manager-overlay">
      <div className="prompt-manager-modal document-manager-modal">
        <div className="prompt-manager-header">
          <h2>Document Manager</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="prompt-manager-content">
          {!documentConfig && (
            <div className="config-warning">
              <h3>⚠️ Configuration Required</h3>
              <p>Please configure your Pinecone settings in the Settings panel to use RAG functionality.</p>
            </div>
          )}

          <div className="current-prompt-section">
            <div className="current-prompt-info">
              <h3>Upload Documents</h3>
              <p>Upload text files to create a knowledge base for RAG-enhanced prompt generation.</p>
            </div>
            <div className="current-prompt-actions">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".txt,.md,.json,.csv"
                style={{ display: 'none' }}
                onChange={(e) => {
                  if (e.target.files) {
                    handleFileUpload(e.target.files);
                  }
                }}
              />
              <button 
                className="btn-save"
                onClick={handleUploadClick}
                disabled={!documentConfig || uploadingDocuments.size > 0}
              >
                Upload Files
              </button>
            </div>
          </div>

          {processingStatus && (
            <div className="processing-status">
              <div className="status-message">{processingStatus}</div>
              {uploadingDocuments.size > 0 && (
                <div className="loading-spinner"></div>
              )}
            </div>
          )}

          {error && (
            <div className="error-message">
              <strong>Error:</strong> {error}
              <button 
                className="error-dismiss"
                onClick={() => setError('')}
              >
                ×
              </button>
            </div>
          )}

          <div className="saved-prompts-section">
            <h3>Indexed Documents ({savedDocuments.length})</h3>
            <div className="saved-prompts-list">
              {savedDocuments.length === 0 ? (
                <div className="no-prompts">
                  No documents uploaded yet. Upload your first document to get started with RAG!
                </div>
              ) : (
                savedDocuments
                  .sort((a, b) => b.lastModified - a.lastModified)
                  .map(document => (
                    <div 
                      key={document.id} 
                      className="prompt-item document-item"
                    >
                      <div className="prompt-item-content">
                        <div className="prompt-item-header">
                          <h4>{document.name}</h4>
                          <span className="prompt-date">{formatDate(document.lastModified)}</span>
                        </div>
                        <div className="prompt-preview document-preview">
                          {document.content.length > 150 
                            ? document.content.substring(0, 150) + '...' 
                            : document.content}
                        </div>
                        <div className="document-meta">
                          <span className="file-type">{document.fileType}</span>
                          <span className="file-size">{formatFileSize(document.fileSize)}</span>
                          <span className="chunk-count">{document.chunks.length} chunks</span>
                        </div>
                      </div>
                      <button 
                        className="delete-prompt-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(`Delete "${document.name}"? This will remove it from your knowledge base.`)) {
                            handleDeleteDocument(document.id);
                          }
                        }}
                        title="Delete document"
                      >
                        ×
                      </button>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentManager;