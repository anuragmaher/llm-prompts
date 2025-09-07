import React from 'react';

interface LlmResponsePanelProps {
  response: string;
  collapsed: boolean;
  onToggle: () => void;
}

export default function LlmResponsePanel({ response, collapsed, onToggle }: LlmResponsePanelProps) {
  return (
    <div className={`output-right ${collapsed ? 'collapsed' : ''}`}>
      <div className="panel-header">
        <span>LLM Response</span>
        <button 
          className="collapse-btn"
          onClick={onToggle}
          title={collapsed ? 'Expand LLM Response' : 'Collapse LLM Response'}
        >
          {collapsed ? '▶' : '▼'}
        </button>
      </div>
      {!collapsed && (
      <div className="output-content response-output">
        {response || 'The AI response will appear here after execution.'}
      </div>
      )}
    </div>
  );
}


