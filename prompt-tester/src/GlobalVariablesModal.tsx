import React, { useState, useCallback, useEffect } from 'react';
import './GlobalVariablesModal.css';

interface GlobalVariablesModalProps {
  isOpen: boolean;
  onClose: () => void;
  globalVariables: string;
  onGlobalVariablesChange: (variables: string) => void;
}

const GlobalVariablesModal: React.FC<GlobalVariablesModalProps> = ({
  isOpen,
  onClose,
  globalVariables,
  onGlobalVariablesChange
}) => {
  const [localVariables, setLocalVariables] = useState(globalVariables);
  const [isValidJson, setIsValidJson] = useState(true);
  const [jsonError, setJsonError] = useState('');

  useEffect(() => {
    setLocalVariables(globalVariables);
  }, [globalVariables, isOpen]);

  const validateJson = useCallback((value: string) => {
    if (!value.trim()) {
      setIsValidJson(true);
      setJsonError('');
      return true;
    }

    try {
      JSON.parse(value);
      setIsValidJson(true);
      setJsonError('');
      return true;
    } catch (error) {
      setIsValidJson(false);
      setJsonError(error instanceof Error ? error.message : 'Invalid JSON');
      return false;
    }
  }, []);

  const handleVariablesChange = useCallback((value: string) => {
    setLocalVariables(value);
    validateJson(value);
  }, [validateJson]);

  const handleSave = useCallback(() => {
    if (validateJson(localVariables)) {
      onGlobalVariablesChange(localVariables);
      onClose();
    }
  }, [localVariables, onGlobalVariablesChange, onClose, validateJson]);

  const handleCancel = useCallback(() => {
    setLocalVariables(globalVariables);
    setIsValidJson(true);
    setJsonError('');
    onClose();
  }, [globalVariables, onClose]);

  const formatJson = useCallback(() => {
    try {
      if (localVariables.trim()) {
        const parsed = JSON.parse(localVariables);
        const formatted = JSON.stringify(parsed, null, 2);
        setLocalVariables(formatted);
        setIsValidJson(true);
        setJsonError('');
      }
    } catch (error) {
      // Keep current value if formatting fails
    }
  }, [localVariables]);

  const addCommonVariable = useCallback((key: string, value: any) => {
    try {
      const current = localVariables.trim() ? JSON.parse(localVariables) : {};
      current[key] = value;
      const updated = JSON.stringify(current, null, 2);
      setLocalVariables(updated);
      setIsValidJson(true);
      setJsonError('');
    } catch (error) {
      // If current JSON is invalid, create new object
      const newObj = { [key]: value };
      const updated = JSON.stringify(newObj, null, 2);
      setLocalVariables(updated);
      setIsValidJson(true);
      setJsonError('');
    }
  }, [localVariables]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content global-variables-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Global Variables</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          <div className="variables-info">
            <p>
              Global variables are available to all steps in your multi-step prompt. 
              Use JSON format to define key-value pairs that can be referenced using <code>{'{{variable_name}}'}</code> syntax.
            </p>
          </div>

          <div className="quick-add-section">
            <h4>Quick Add Common Variables</h4>
            <div className="quick-add-buttons">
              <button onClick={() => addCommonVariable('user_name', '')}>
                👤 User Name
              </button>
              <button onClick={() => addCommonVariable('company', '')}>
                🏢 Company
              </button>
              <button onClick={() => addCommonVariable('email', '')}>
                📧 Email
              </button>
              <button onClick={() => addCommonVariable('date', new Date().toISOString().split('T')[0])}>
                📅 Current Date
              </button>
              <button onClick={() => addCommonVariable('context', '')}>
                📝 Context
              </button>
            </div>
          </div>

          <div className="editor-section">
            <div className="editor-header">
              <label htmlFor="global-variables-textarea">JSON Variables</label>
              <div className="editor-actions">
                <button className="format-btn" onClick={formatJson} disabled={!isValidJson}>
                  🎨 Format JSON
                </button>
              </div>
            </div>
            
            <textarea
              id="global-variables-textarea"
              className={`variables-editor ${!isValidJson ? 'invalid' : ''}`}
              value={localVariables}
              onChange={(e) => handleVariablesChange(e.target.value)}
              placeholder='{\n  "user_name": "Alex Support",\n  "company": "Tech Corp",\n  "email": "alex@techcorp.com"\n}'
              rows={15}
            />
            
            {!isValidJson && (
              <div className="json-error">
                <strong>JSON Error:</strong> {jsonError}
              </div>
            )}
            
            {isValidJson && localVariables.trim() && (
              <div className="json-valid">
                ✓ Valid JSON format
              </div>
            )}
          </div>

          <div className="variable-preview">
            <h4>Available Variables</h4>
            {localVariables.trim() && isValidJson ? (
              <div className="variable-list">
                {Object.keys(JSON.parse(localVariables || '{}')).map(key => (
                  <div key={key} className="variable-item">
                    <code>{'{{' + key + '}}'}</code>
                    <span className="variable-description">
                      {JSON.stringify(JSON.parse(localVariables)[key])}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-variables">
                No valid variables defined yet. Add some variables above to see them here.
              </div>
            )}
          </div>
        </div>
        
        <div className="modal-footer">
          <button className="cancel-btn" onClick={handleCancel}>
            Cancel
          </button>
          <button 
            className="save-btn" 
            onClick={handleSave}
            disabled={!isValidJson}
          >
            Save Variables
          </button>
        </div>
      </div>
    </div>
  );
};

export default GlobalVariablesModal;