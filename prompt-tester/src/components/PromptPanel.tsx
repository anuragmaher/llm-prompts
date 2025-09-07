import React from 'react';

interface PromptPanelProps {
  prompt: string;
  onPromptChange: (value: string) => void;
  collapsed: boolean;
  onToggle: () => void;
  onOpenPromptManager: () => void;
  hasUnsaved: boolean;
  onOpenSettings: () => void;
  onOpenDocuments: () => void;
  onExecute: () => void;
  isExecuting: boolean;
}

export default function PromptPanel({
  prompt,
  onPromptChange,
  collapsed,
  onToggle,
  onOpenPromptManager,
  hasUnsaved,
  onOpenSettings,
  onOpenDocuments,
  onExecute,
  isExecuting
}: PromptPanelProps) {
  return (
    <div className={`prompt-panel ${collapsed ? 'collapsed' : ''}`}>
      <div className="panel-header">
        <span>Prompt Template</span>
        <div className="header-actions">
          <button 
            className="collapse-btn"
            onClick={onToggle}
            title={collapsed ? 'Expand Prompt' : 'Collapse Prompt'}
          >
            {collapsed ? '▶' : '▼'}
          </button>
          <button 
            className="prompt-manager-btn"
            onClick={onOpenPromptManager}
          >
            📁 Prompts {hasUnsaved && '●'}
          </button>
          <button 
            className="documents-btn"
            onClick={onOpenDocuments}
          >
            📚 Documents
          </button>
          <button 
            className="settings-btn"
            onClick={onOpenSettings}
          >
            ⚙️ Settings
          </button>
          <button 
            className="execute-button"
            onClick={onExecute}
            disabled={isExecuting}
          >
            {isExecuting ? 'Executing...' : 'Execute'}
          </button>
        </div>
      </div>
      {!collapsed && (
      <div className="panel-content">
        <textarea
          className="prompt-textarea"
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          placeholder="Enter your prompt template here. Use {{variableName}} syntax for variables."
        />
      </div>
      )}
    </div>
  );
}


