import React, { useState } from 'react';

interface SavedVariableSet {
  id: string;
  name: string;
  variables: string; // JSON string
  createdAt: number;
  lastModified: number;
}

interface VariableManagerProps {
  isOpen: boolean;
  onClose: () => void;
  savedVariableSets: SavedVariableSet[];
  currentVariableSetId: string | null;
  onLoadVariableSet: (variableSetId: string) => void;
  onDeleteVariableSet: (variableSetId: string) => void;
  onSaveVariableSet: (name: string) => void;
  onNewVariableSet: () => void;
  hasUnsavedChanges: boolean;
}

const VariableManager: React.FC<VariableManagerProps> = ({
  isOpen,
  onClose,
  savedVariableSets,
  currentVariableSetId,
  onLoadVariableSet,
  onDeleteVariableSet,
  onSaveVariableSet,
  onNewVariableSet,
  hasUnsavedChanges
}) => {
  const [saveVariableSetName, setSaveVariableSetName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  const handleSave = () => {
    if (saveVariableSetName.trim()) {
      onSaveVariableSet(saveVariableSetName.trim());
      setSaveVariableSetName('');
      setShowSaveDialog(false);
    }
  };

  const getCurrentVariableSetName = () => {
    if (currentVariableSetId) {
      return savedVariableSets.find(v => v.id === currentVariableSetId)?.name || 'Untitled';
    }
    return 'Default Variables';
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getVariablePreview = (variablesJson: string) => {
    try {
      const parsed = JSON.parse(variablesJson);
      const keys = Object.keys(parsed);
      if (keys.length === 0) return 'Empty JSON';
      if (keys.length === 1) return `1 variable: ${keys[0]}`;
      return `${keys.length} variables: ${keys.slice(0, 3).join(', ')}${keys.length > 3 ? '...' : ''}`;
    } catch {
      return 'Invalid JSON';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="prompt-manager-overlay">
      <div className="prompt-manager-modal">
        <div className="prompt-manager-header">
          <h2>Variable Set Manager</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="prompt-manager-content">
          <div className="current-prompt-section">
            <div className="current-prompt-info">
              <h3>Current Variable Set: {getCurrentVariableSetName()}</h3>
              {hasUnsavedChanges && <span className="unsaved-indicator">● Unsaved changes</span>}
            </div>
            <div className="current-prompt-actions">
              <button 
                className="btn-save"
                onClick={() => {
                  if (currentVariableSetId) {
                    const currentName = getCurrentVariableSetName();
                    onSaveVariableSet(currentName);
                  } else {
                    setShowSaveDialog(true);
                  }
                }}
              >
                {currentVariableSetId ? 'Update' : 'Save As...'}
              </button>
              <button className="btn-new" onClick={onNewVariableSet}>
                New Variable Set
              </button>
            </div>
          </div>

          {showSaveDialog && (
            <div className="save-dialog">
              <input
                type="text"
                className="save-input"
                placeholder="Enter variable set name (e.g., 'Customer Support', 'Email Draft v1')"
                value={saveVariableSetName}
                onChange={(e) => setSaveVariableSetName(e.target.value)}
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
            <h3>Saved Variable Sets ({savedVariableSets.length})</h3>
            <div className="saved-prompts-list">
              {savedVariableSets.length === 0 ? (
                <div className="no-prompts">
                  No saved variable sets yet. Save your first set for easy reuse!
                  <br />
                  <small>Perfect for A/B testing different scenarios with the same prompt.</small>
                </div>
              ) : (
                savedVariableSets
                  .sort((a, b) => b.lastModified - a.lastModified)
                  .map(variableSet => (
                    <div 
                      key={variableSet.id} 
                      className={`prompt-item ${variableSet.id === currentVariableSetId ? 'active' : ''}`}
                    >
                      <div className="prompt-item-content" onClick={() => { onLoadVariableSet(variableSet.id); onClose(); }}>
                        <div className="prompt-item-header">
                          <h4>{variableSet.name}</h4>
                          <span className="prompt-date">{formatDate(variableSet.lastModified)}</span>
                        </div>
                        <div className="prompt-preview">
                          {getVariablePreview(variableSet.variables)}
                        </div>
                        <div className="prompt-meta">
                          {(() => {
                            try {
                              const vars = JSON.parse(variableSet.variables);
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
                          if (window.confirm(`Delete variable set "${variableSet.name}"?`)) {
                            onDeleteVariableSet(variableSet.id);
                          }
                        }}
                        title="Delete variable set"
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

export default VariableManager;