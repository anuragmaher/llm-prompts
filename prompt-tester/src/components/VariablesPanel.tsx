import React from 'react';

interface VariablesPanelProps {
  variables: string;
  onVariablesChange: (value: string) => void;
  collapsed: boolean;
  onToggle: () => void;
  hasUnsaved: boolean;
  onOpenManager: () => void;
}

export default function VariablesPanel({
  variables,
  onVariablesChange,
  collapsed,
  onToggle,
  hasUnsaved,
  onOpenManager
}: VariablesPanelProps) {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="panel-header">
        <span>Variables (JSON) {hasUnsaved && '●'}</span>
        <div className="header-actions">
          <button 
            className="variable-manager-btn"
            onClick={onOpenManager}
          >
            📊 Variables
          </button>
          <button 
            className="collapse-btn"
            onClick={onToggle}
            title={collapsed ? 'Expand Variables' : 'Collapse Variables'}
          >
            {collapsed ? '▶' : '▼'}
          </button>
        </div>
      </div>
      {!collapsed && (
      <div className="panel-content">
        <div className="json-editor-container">
          <textarea
            className="json-editor"
            value={variables}
            onChange={(e) => onVariablesChange(e.target.value)}
            placeholder='{"\n  "variable_name": "value",\n  "array_example": ["item1", "item2"],\n  "object_example": {\n    "nested": "value"\n  }\n}'
          />
          <div className="json-validation">
            {(() => {
              try {
                JSON.parse(variables);
                return <span className="json-valid">✓ Valid JSON</span>;
              } catch (error) {
                return <span className="json-invalid">⚠ Invalid JSON: {(error as Error).message}</span>;
              }
            })()}
          </div>
        </div>
      </div>
      )}
    </div>
  );
}


