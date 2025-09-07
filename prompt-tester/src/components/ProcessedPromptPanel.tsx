import React from 'react';

interface ProcessedPromptPanelProps {
  content: string;
  collapsed: boolean;
  onToggle: () => void;
}

export default function ProcessedPromptPanel({ content, collapsed, onToggle }: ProcessedPromptPanelProps) {
  return (
    <div className={`output-left-top ${collapsed ? 'collapsed' : ''}`}>
      <div className="panel-header">
        <span>Processed Prompt</span>
        <button 
          className="collapse-btn"
          onClick={onToggle}
          title={collapsed ? 'Expand Processed Prompt' : 'Collapse Processed Prompt'}
        >
          {collapsed ? '▶' : '▼'}
        </button>
      </div>
      {!collapsed && (
      <div className="output-content prompt-output">
        {content || 'Click "Execute" to see your prompt with variables substituted.'}
      </div>
      )}
    </div>
  );
}


