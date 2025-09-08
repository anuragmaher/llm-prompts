import React, { useState, useCallback } from 'react';
import { MultiStepPrompt, PromptStep } from './types';
import GlobalVariablesModal from './GlobalVariablesModal';
import './MultiStepPromptEditor.css';

interface MultiStepPromptEditorProps {
  multiStepPrompt: MultiStepPrompt;
  onMultiStepPromptChange: (multiStepPrompt: MultiStepPrompt) => void;
  onExecute: () => void;
  isExecuting: boolean;
  onOpenSettings?: () => void;
  onOpenDocuments?: () => void;
  onOpenPromptManager?: () => void;
}

const MultiStepPromptEditor: React.FC<MultiStepPromptEditorProps> = ({
  multiStepPrompt,
  onMultiStepPromptChange,
  onExecute,
  isExecuting,
  onOpenSettings,
  onOpenDocuments,
  onOpenPromptManager
}) => {
  const [activeStepId, setActiveStepId] = useState<string>(multiStepPrompt.steps[0]?.id || '');
  const [draggedStepId, setDraggedStepId] = useState<string | null>(null);
  const [showGlobalVariablesModal, setShowGlobalVariablesModal] = useState<boolean>(false);
  const [hoveredVariable, setHoveredVariable] = useState<{key: string, value: any, position: {x: number, y: number}} | null>(null);

  const handleVariableHover = useCallback((event: React.MouseEvent, key: string, value: any) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setHoveredVariable({
      key,
      value,
      position: {
        x: rect.left + rect.width / 2,
        y: rect.top - 10
      }
    });
  }, []);

  const handleVariableLeave = useCallback(() => {
    setHoveredVariable(null);
  }, []);

  const formatJsonValue = useCallback((value: any): string => {
    if (typeof value === 'string') {
      return `"${value}"`;
    }
    return JSON.stringify(value, null, 2);
  }, []);

  const highlightJsonValue = useCallback((jsonString: string): React.ReactElement => {
    // Simple JSON syntax highlighting
    const highlighted = jsonString
      .replace(/(".*?")/g, '<span class="json-string">$1</span>')
      .replace(/(\b\d+\.?\d*\b)/g, '<span class="json-number">$1</span>')
      .replace(/(\btrue\b|\bfalse\b|\bnull\b)/g, '<span class="json-boolean">$1</span>')
      .replace(/([{}[\],:])/g, '<span class="json-punctuation">$1</span>');
    
    return <span dangerouslySetInnerHTML={{ __html: highlighted }} />;
  }, []);

  const updateMultiStepPrompt = useCallback((updates: Partial<MultiStepPrompt>) => {
    onMultiStepPromptChange({
      ...multiStepPrompt,
      ...updates,
      lastModified: Date.now()
    });
  }, [multiStepPrompt, onMultiStepPromptChange]);

  const updateStep = useCallback((stepId: string, updates: Partial<PromptStep>) => {
    const updatedSteps = multiStepPrompt.steps.map(step =>
      step.id === stepId ? { ...step, ...updates } : step
    );
    updateMultiStepPrompt({ steps: updatedSteps });
  }, [multiStepPrompt.steps, updateMultiStepPrompt]);

  const addStep = useCallback(() => {
    const newOrder = Math.max(...multiStepPrompt.steps.map(s => s.order), 0) + 1;
    const newStep: PromptStep = {
      id: `step-${Date.now()}`,
      name: `Step ${newOrder}`,
      prompt: 'Your prompt here. Use {{variable_name}} for variables.',
      variables: '{}',
      order: newOrder,
      outputVariable: `step${newOrder}_output`
    };
    
    const updatedSteps = [...multiStepPrompt.steps, newStep];
    updateMultiStepPrompt({ steps: updatedSteps });
    setActiveStepId(newStep.id);
  }, [multiStepPrompt.steps, updateMultiStepPrompt]);

  const deleteStep = useCallback((stepId: string) => {
    if (multiStepPrompt.steps.length <= 1) {
      alert('Cannot delete the last step. A multi-step prompt must have at least one step.');
      return;
    }

    const updatedSteps = multiStepPrompt.steps
      .filter(step => step.id !== stepId)
      .map((step, index) => ({ ...step, order: index + 1 })); // Reorder steps

    updateMultiStepPrompt({ steps: updatedSteps });
    
    if (activeStepId === stepId) {
      setActiveStepId(updatedSteps[0]?.id || '');
    }
  }, [multiStepPrompt.steps, updateMultiStepPrompt, activeStepId]);

  const handleDragStart = useCallback((e: React.DragEvent, stepId: string) => {
    setDraggedStepId(stepId);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetStepId: string) => {
    e.preventDefault();
    
    if (!draggedStepId || draggedStepId === targetStepId) {
      setDraggedStepId(null);
      return;
    }

    const draggedStep = multiStepPrompt.steps.find(s => s.id === draggedStepId);
    const targetStep = multiStepPrompt.steps.find(s => s.id === targetStepId);
    
    if (!draggedStep || !targetStep) {
      setDraggedStepId(null);
      return;
    }

    const draggedIndex = multiStepPrompt.steps.findIndex(s => s.id === draggedStepId);
    const targetIndex = multiStepPrompt.steps.findIndex(s => s.id === targetStepId);

    const newSteps = [...multiStepPrompt.steps];
    newSteps.splice(draggedIndex, 1);
    newSteps.splice(targetIndex, 0, draggedStep);

    // Reorder all steps
    const reorderedSteps = newSteps.map((step, index) => ({
      ...step,
      order: index + 1
    }));

    updateMultiStepPrompt({ steps: reorderedSteps });
    setDraggedStepId(null);
  }, [draggedStepId, multiStepPrompt.steps, updateMultiStepPrompt]);

  const activeStep = multiStepPrompt.steps.find(step => step.id === activeStepId);
  const sortedSteps = [...multiStepPrompt.steps].sort((a, b) => a.order - b.order);

  return (
    <div className="multi-step-prompt-editor">
      <div className="multi-step-header">
        <div className="multi-step-info">
          <input
            type="text"
            className="multi-step-name"
            value={multiStepPrompt.name}
            onChange={(e) => updateMultiStepPrompt({ name: e.target.value })}
            placeholder="Multi-step prompt name"
          />
          <textarea
            className="multi-step-description"
            value={multiStepPrompt.description}
            onChange={(e) => updateMultiStepPrompt({ description: e.target.value })}
            placeholder="Description (optional)"
            rows={2}
          />
        </div>
        <div className="header-actions">
          {onOpenPromptManager && (
            <button 
              className="prompt-manager-btn"
              onClick={onOpenPromptManager}
              title="Browse Prompts"
            >
              📁 Prompts
            </button>
          )}
          {onOpenDocuments && (
            <button 
              className="documents-btn"
              onClick={onOpenDocuments}
              title="Document Manager"
            >
              📚 Documents
            </button>
          )}
          {onOpenSettings && (
            <button 
              className="settings-btn"
              onClick={onOpenSettings}
              title="Settings"
            >
              ⚙️ Settings
            </button>
          )}
          <button
            className={`execute-btn ${isExecuting ? 'executing' : ''}`}
            onClick={onExecute}
            disabled={isExecuting}
          >
            {isExecuting ? 'Executing...' : 'Execute Multi-Step'}
          </button>
        </div>
      </div>

      <div className="multi-step-content">
        <div className="steps-sidebar">
          <div className="steps-header">
            <h3>Steps ({sortedSteps.length})</h3>
            <button className="add-step-btn" onClick={addStep}>+</button>
          </div>
          
          <div className="steps-list">
            {sortedSteps.map((step, index) => (
              <div
                key={step.id}
                className={`step-item ${step.id === activeStepId ? 'active' : ''} ${draggedStepId === step.id ? 'dragging' : ''}`}
                onClick={() => setActiveStepId(step.id)}
                draggable
                onDragStart={(e) => handleDragStart(e, step.id)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, step.id)}
              >
                <div className="step-number">{index + 1}</div>
                <div className="step-info">
                  <div className="step-name">{step.name}</div>
                  {step.outputVariable && (
                    <div className="step-output-var">→ {step.outputVariable}</div>
                  )}
                </div>
                <button
                  className="delete-step-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteStep(step.id);
                  }}
                  disabled={multiStepPrompt.steps.length <= 1}
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          <div className="global-variables">
            <div className="global-variables-header">
              <h4>Global Variables</h4>
              <button
                className="edit-variables-btn"
                onClick={() => setShowGlobalVariablesModal(true)}
                title="Edit Global Variables"
              >
                ⚙️ Edit
              </button>
            </div>
            <div className="variables-preview">
              {multiStepPrompt.globalVariables.trim() ? (
                <div className="variables-summary">
                  {(() => {
                    try {
                      const vars = JSON.parse(multiStepPrompt.globalVariables);
                      const count = Object.keys(vars).length;
                      return (
                        <div>
                          <span className="var-count">{count} variable{count !== 1 ? 's' : ''}</span>
                          <div className="var-list">
                            {Object.keys(vars).map(key => (
                              <code 
                                key={key} 
                                className="variable-tag"
                                onMouseEnter={(e) => handleVariableHover(e, key, vars[key])}
                                onMouseLeave={handleVariableLeave}
                              >
                                {'{{' + key + '}}'}
                              </code>
                            ))}
                          </div>
                        </div>
                      );
                    } catch {
                      return <span className="invalid-json">Invalid JSON format</span>;
                    }
                  })()}
                </div>
              ) : (
                <div className="no-variables">No global variables defined</div>
              )}
            </div>
          </div>
        </div>

        <div className="step-editor">
          {activeStep ? (
            <>
              <div className="step-editor-header">
                <input
                  type="text"
                  className="step-name-input"
                  value={activeStep.name}
                  onChange={(e) => updateStep(activeStep.id, { name: e.target.value })}
                  placeholder="Step name"
                />
                <input
                  type="text"
                  className="output-variable-input"
                  value={activeStep.outputVariable || ''}
                  onChange={(e) => updateStep(activeStep.id, { outputVariable: e.target.value })}
                  placeholder="Output variable (optional)"
                />
              </div>

              <div className="step-editor-content">
                <div className="prompt-section">
                  <label>Prompt</label>
                  <textarea
                    value={activeStep.prompt}
                    onChange={(e) => updateStep(activeStep.id, { prompt: e.target.value })}
                    placeholder="Enter your prompt here. Use {{variable_name}} syntax for variables."
                    rows={12}
                  />
                </div>

                <div className="variables-section">
                  <label>Step Variables (JSON)</label>
                  <textarea
                    value={activeStep.variables}
                    onChange={(e) => updateStep(activeStep.id, { variables: e.target.value })}
                    placeholder='{"key": "value"}'
                    rows={8}
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="no-step-selected">
              <p>Select a step to edit, or add a new step to get started.</p>
            </div>
          )}
        </div>
      </div>
      
      <GlobalVariablesModal
        isOpen={showGlobalVariablesModal}
        onClose={() => setShowGlobalVariablesModal(false)}
        globalVariables={multiStepPrompt.globalVariables}
        onGlobalVariablesChange={(variables) => updateMultiStepPrompt({ globalVariables: variables })}
      />
      
      {hoveredVariable && (
        <div 
          className="variable-tooltip"
          style={{
            position: 'fixed',
            left: hoveredVariable.position.x,
            top: hoveredVariable.position.y,
            transform: 'translateX(-50%)',
            zIndex: 1000,
            pointerEvents: 'none'
          }}
        >
          <div className="tooltip-arrow"></div>
          <div className="tooltip-content">
            <div className="tooltip-header">
              <code className="tooltip-variable-name">{'{{' + hoveredVariable.key + '}}'}</code>
            </div>
            <div className="tooltip-value">
              <pre className="json-highlight">
                {highlightJsonValue(formatJsonValue(hoveredVariable.value))}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiStepPromptEditor;