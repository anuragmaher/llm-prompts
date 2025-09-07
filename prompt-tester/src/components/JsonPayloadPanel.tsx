import React, { useMemo } from 'react';

interface JsonPayloadPanelProps {
  variables: string;
  collapsed: boolean;
  onToggle: () => void;
}

export default function JsonPayloadPanel({ variables, collapsed, onToggle }: JsonPayloadPanelProps) {
  const payload = useMemo(() => {
    try {
      const parsed = JSON.parse(variables);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return 'Invalid JSON - fix variables to see payload';
    }
  }, [variables]);

  return (
    <div className={`output-left-bottom ${collapsed ? 'collapsed' : ''}`}>
      <div className="panel-header">
        <span>JSON Payload</span>
        <button 
          className="collapse-btn"
          onClick={onToggle}
          title={collapsed ? 'Expand JSON Payload' : 'Collapse JSON Payload'}
        >
          {collapsed ? '▶' : '▼'}
        </button>
      </div>
      {!collapsed && (
      <div className="output-content json-payload">
        {payload}
      </div>
      )}
    </div>
  );
}


