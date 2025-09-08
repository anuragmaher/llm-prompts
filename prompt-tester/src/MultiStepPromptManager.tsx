import React, { useState, useCallback } from 'react';
import { MultiStepPrompt } from './types';
import './MultiStepPromptManager.css';

interface MultiStepPromptManagerProps {
  isOpen: boolean;
  onClose: () => void;
  savedMultiStepPrompts: MultiStepPrompt[];
  currentMultiStepPromptId: string | null;
  onLoadMultiStepPrompt: (id: string) => void;
  onDeleteMultiStepPrompt: (id: string) => void;
  onSaveMultiStepPrompt: (name: string) => void;
  onNewMultiStepPrompt: () => void;
  hasUnsavedChanges: boolean;
}

const MultiStepPromptManager: React.FC<MultiStepPromptManagerProps> = ({
  isOpen,
  onClose,
  savedMultiStepPrompts,
  currentMultiStepPromptId,
  onLoadMultiStepPrompt,
  onDeleteMultiStepPrompt,
  onSaveMultiStepPrompt,
  onNewMultiStepPrompt,
  hasUnsavedChanges
}) => {
  const [newName, setNewName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleSave = useCallback(() => {
    if (newName.trim()) {
      onSaveMultiStepPrompt(newName.trim());
      setNewName('');
      setShowSaveDialog(false);
    }
  }, [newName, onSaveMultiStepPrompt]);

  const handleDelete = useCallback((id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (deleteConfirm === id) {
      onDeleteMultiStepPrompt(id);
      setDeleteConfirm(null);
    } else {
      setDeleteConfirm(id);
    }
  }, [deleteConfirm, onDeleteMultiStepPrompt]);

  const handleLoad = useCallback((id: string) => {
    if (hasUnsavedChanges) {
      const confirmed = window.confirm('You have unsaved changes. Are you sure you want to load a different multi-step prompt?');
      if (!confirmed) return;
    }
    onLoadMultiStepPrompt(id);
    onClose();
  }, [hasUnsavedChanges, onLoadMultiStepPrompt, onClose]);

  const handleNew = useCallback(() => {
    if (hasUnsavedChanges) {
      const confirmed = window.confirm('You have unsaved changes. Are you sure you want to create a new multi-step prompt?');
      if (!confirmed) return;
    }
    onNewMultiStepPrompt();
    onClose();
  }, [hasUnsavedChanges, onNewMultiStepPrompt, onClose]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const getCurrentPromptName = () => {
    const current = savedMultiStepPrompts.find(p => p.id === currentMultiStepPromptId);
    return current?.name || 'Unsaved Multi-Step Prompt';
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content multi-step-prompt-manager" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Multi-Step Prompt Manager</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          <div className="current-prompt-info">
            <strong>Current:</strong> {getCurrentPromptName()}
            {hasUnsavedChanges && <span className="unsaved-indicator"> (Unsaved changes)</span>}
          </div>

          <div className="actions">
            <button className="new-btn" onClick={handleNew}>
              New Multi-Step Prompt
            </button>
            <button className="save-btn" onClick={() => setShowSaveDialog(true)}>
              Save Current
            </button>
          </div>

          {showSaveDialog && (
            <div className="save-dialog">
              <input
                type="text"
                placeholder="Enter multi-step prompt name..."
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSave()}
                autoFocus
              />
              <button onClick={handleSave} disabled={!newName.trim()}>Save</button>
              <button onClick={() => {setShowSaveDialog(false); setNewName('');}}>Cancel</button>
            </div>
          )}

          <div className="prompt-list">
            <h3>Saved Multi-Step Prompts ({savedMultiStepPrompts.length})</h3>
            {savedMultiStepPrompts.length === 0 ? (
              <div className="empty-state">No multi-step prompts saved yet</div>
            ) : (
              savedMultiStepPrompts
                .sort((a, b) => b.lastModified - a.lastModified)
                .map((prompt) => (
                  <div
                    key={prompt.id}
                    className={`prompt-item ${prompt.id === currentMultiStepPromptId ? 'current' : ''}`}
                    onClick={() => handleLoad(prompt.id)}
                  >
                    <div className="prompt-header">
                      <span className="prompt-name">{prompt.name}</span>
                      <div className="prompt-actions">
                        <button
                          className={`delete-btn ${deleteConfirm === prompt.id ? 'confirm' : ''}`}
                          onClick={(e) => handleDelete(prompt.id, e)}
                        >
                          {deleteConfirm === prompt.id ? 'Confirm?' : '🗑'}
                        </button>
                      </div>
                    </div>
                    <div className="prompt-meta">
                      <span className="step-count">{prompt.steps.length} steps</span>
                      <span className="date">Modified: {formatDate(prompt.lastModified)}</span>
                    </div>
                    {prompt.description && (
                      <div className="prompt-description">{prompt.description}</div>
                    )}
                  </div>
                ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MultiStepPromptManager;