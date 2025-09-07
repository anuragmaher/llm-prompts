import React, { useState } from 'react';

interface SavedPrompt {
  id: string;
  name: string;
  prompt: string;
  variables: string; // JSON string
  createdAt: number;
  lastModified: number;
}

interface PromptManagerProps {
  isOpen: boolean;
  onClose: () => void;
  savedPrompts: SavedPrompt[];
  currentPromptId: string | null;
  onLoadPrompt: (promptId: string) => void;
  onDeletePrompt: (promptId: string) => void;
  onSavePrompt: (name: string) => void;
  onNewPrompt: () => void;
  hasUnsavedChanges: boolean;
}

const PromptManager: React.FC<PromptManagerProps> = ({
  isOpen,
  onClose,
  savedPrompts,
  currentPromptId,
  onLoadPrompt,
  onDeletePrompt,
  onSavePrompt,
  onNewPrompt,
  hasUnsavedChanges
}) => {
  const [savePromptName, setSavePromptName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  const handleSave = () => {
    if (savePromptName.trim()) {
      onSavePrompt(savePromptName.trim());
      setSavePromptName('');
      setShowSaveDialog(false);
    }
  };

  const getCurrentPromptName = () => {
    if (currentPromptId) {
      return savedPrompts.find(p => p.id === currentPromptId)?.name || 'Untitled';
    }
    return 'New Prompt';
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="prompt-manager-overlay">
      <div className="prompt-manager-modal">
        <div className="prompt-manager-header">
          <h2>Prompt Manager</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="prompt-manager-content">
          <div className="current-prompt-section">
            <div className="current-prompt-info">
              <h3>Current Prompt: {getCurrentPromptName()}</h3>
              {hasUnsavedChanges && <span className="unsaved-indicator">● Unsaved changes</span>}
            </div>
            <div className="current-prompt-actions">
              <button 
                className="btn-save"
                onClick={() => {
                  if (currentPromptId) {
                    const currentName = getCurrentPromptName();
                    onSavePrompt(currentName);
                  } else {
                    setShowSaveDialog(true);
                  }
                }}
              >
                {currentPromptId ? 'Update' : 'Save As...'}
              </button>
              <button className="btn-new" onClick={onNewPrompt}>
                New Prompt
              </button>
            </div>
          </div>

          {showSaveDialog && (
            <div className="save-dialog">
              <input
                type="text"
                className="save-input"
                placeholder="Enter prompt name"
                value={savePromptName}
                onChange={(e) => setSavePromptName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSave()}
                autoFocus
              />
              <div className="save-dialog-actions">
                <button className="btn-secondary" onClick={() => setShowSaveDialog(false)}>
                  Cancel
                </button>
                <button className="btn-primary" onClick={handleSave}>
                  Save
                </button>
              </div>
            </div>
          )}

          <div className="saved-prompts-section">
            <h3>Saved Prompts ({savedPrompts.length})</h3>
            <div className="saved-prompts-list">
              {savedPrompts.length === 0 ? (
                <div className="no-prompts">
                  No saved prompts yet. Create and save your first prompt!
                </div>
              ) : (
                savedPrompts
                  .sort((a, b) => b.lastModified - a.lastModified)
                  .map(prompt => (
                    <div 
                      key={prompt.id} 
                      className={`prompt-item ${prompt.id === currentPromptId ? 'active' : ''}`}
                    >
                      <div className="prompt-item-content" onClick={() => onLoadPrompt(prompt.id)}>
                        <div className="prompt-item-header">
                          <h4>{prompt.name}</h4>
                          <span className="prompt-date">{formatDate(prompt.lastModified)}</span>
                        </div>
                        <div className="prompt-preview">
                          {prompt.prompt.length > 100 
                            ? prompt.prompt.substring(0, 100) + '...' 
                            : prompt.prompt}
                        </div>
                        <div className="prompt-meta">
                          {(() => {
                            try {
                              const vars = JSON.parse(prompt.variables);
                              const varCount = Object.keys(vars).length;
                              return `${varCount} variable${varCount !== 1 ? 's' : ''}`;
                            } catch {
                              return 'Invalid JSON';
                            }
                          })()}
                        </div>
                      </div>
                      <button 
                        className="delete-prompt-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(`Delete "${prompt.name}"?`)) {
                            onDeletePrompt(prompt.id);
                          }
                        }}
                        title="Delete prompt"
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

export default PromptManager;