import React, { useState, useCallback, useEffect } from 'react';
import './App.css';
import Settings, { ApiConfig } from './Settings';
import ApiService, { StreamingCallback } from './apiService';
import PromptManager from './PromptManager';

interface SavedPrompt {
  id: string;
  name: string;
  prompt: string;
  variables: string; // JSON string
  createdAt: number;
  lastModified: number;
}

function App() {
  const [variables, setVariables] = useState<string>(JSON.stringify({
    "agent_info": {
      "name": "Anurag Maherchandani",
      "email": "anurag@grexit.com",
      "role": "AI Leader"
    },
    "email_thread": [
      {
        "from": "Sarah Johnson <sarah.johnson@example.com>",
        "to": "Anurag Maherchandani <anurag@grexit.com>",
        "content": "Hi Anurag, just checking if we are still on for our meeting tomorrow at 10 AM?"
      }
    ],
    "chat_history": "You previously confirmed 10 AM works and asked whether we'd use the west conference room.",
    "user_intent": "Confirm the meeting time politely and express that you're looking forward to it."
  }, null, 2));
  const [prompt, setPrompt] = useState<string>('You are a helpful and precise email drafting assistant in a productivity copilot.\n\nYou will be given the following variables (injected at runtime):\n\n1. agent_info: {{agent_info}}\n   - Type: JSON object with agent details\n   - Contains: "name", "email", "role" fields\n   - Use this to sign emails and provide context about the sender\n\n2. email_thread: {{email_thread}}\n   - Type: a JSON array (list) of up to 3 email messages\n   - Each message is an object with keys: "from", "to", "content"\n   - Example: [{"from":"Sarah Johnson <sarah@example.com>","to":"Agent <agent@example.com>","content":"Hi..."}]\n\n3. chat_history: "{{chat_history}}"\n   - Type: string\n   - Previous conversation context that may provide additional details for the email draft (optional)\n\n4. user_intent: "{{user_intent}}"\n   - Type: string\n   - A clear purpose and tone for the reply (e.g., "Confirm the meeting time politely and express enthusiasm")\n\n---\n\n### VALIDATION CONDITIONS\n\n1. User Intent must be clear:\n   - It must specify the purpose or goal of the reply\n   - If intent is vague, missing, or ambiguous, respond with JSON exception below\n\n2. Chat History is optional:\n   - Can be empty, brief, or contain meaningful context\n   - Will be used if provided to enhance the email draft\n\n---\n\n### OUTPUT INSTRUCTIONS\n\n- If `user_intent` passes validation:\n    - Generate a concise, professional email draft using all provided variables\n    - Sign the email with the agent name from `agent_info`\n    - Return only the email draft text (no extra metadata)\n\n- If validation fails:\n    - Return exactly one JSON object (no extra text):\n\nIf user_intent invalid:\n```json\n{"error": true, "reason": "User intent is missing or unclear."}\n```\n\n');
  const [processedPrompt, setProcessedPrompt] = useState<string>('');
  const [llmResponse, setLlmResponse] = useState<string>('');
  const [firstByteTime, setFirstByteTime] = useState<number | null>(null);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [savedPrompts, setSavedPrompts] = useState<SavedPrompt[]>([]);
  const [currentPromptId, setCurrentPromptId] = useState<string | null>(null);
  const [showPromptManager, setShowPromptManager] = useState<boolean>(false);
  const [leftPanelWidth, setLeftPanelWidth] = useState<number>(() => {
    const saved = localStorage.getItem('llm-prompt-tester-left-panel-width');
    return saved ? parseInt(saved, 10) : 320;
  });
  const [collapsedSections, setCollapsedSections] = useState<{[key: string]: boolean}>(() => {
    const saved = localStorage.getItem('llm-prompt-tester-collapsed-sections');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return {
          variables: false,
          prompt: false,
          processedPrompt: false,
          jsonPayload: false,
          llmResponse: false
        };
      }
    }
    return {
      variables: false,
      prompt: false,
      processedPrompt: false,
      jsonPayload: false,
      llmResponse: false
    };
  });
  const [apiConfig, setApiConfig] = useState<ApiConfig>({
    provider: (process.env.REACT_APP_DEFAULT_PROVIDER as ApiConfig['provider']) || 'openai',
    openaiKey: process.env.REACT_APP_OPENAI_API_KEY || '',
    openaiModel: process.env.REACT_APP_DEFAULT_OPENAI_MODEL || 'gpt-4o',
    anthropicKey: process.env.REACT_APP_ANTHROPIC_API_KEY || '',
    anthropicModel: process.env.REACT_APP_DEFAULT_ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022'
  });
  const [apiService] = useState(() => new ApiService(apiConfig));

  useEffect(() => {
    const savedConfig = localStorage.getItem('llm-prompt-tester-config');
    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig);
        setApiConfig(config);
        apiService.updateConfig(config);
      } catch (error) {
        console.warn('Failed to load saved configuration');
      }
    }

    // Load saved prompts
    const savedPromptsData = localStorage.getItem('llm-prompt-tester-prompts');
    if (savedPromptsData) {
      try {
        const prompts = JSON.parse(savedPromptsData);
        setSavedPrompts(prompts);
      } catch (error) {
        console.warn('Failed to load saved prompts');
      }
    }
  }, [apiService]);

  const handleConfigChange = useCallback((newConfig: ApiConfig) => {
    setApiConfig(newConfig);
    apiService.updateConfig(newConfig);
    localStorage.setItem('llm-prompt-tester-config', JSON.stringify(newConfig));
  }, [apiService]);

  const savePromptsToStorage = useCallback((prompts: SavedPrompt[]) => {
    localStorage.setItem('llm-prompt-tester-prompts', JSON.stringify(prompts));
  }, []);

  const saveCurrentPrompt = useCallback((name: string) => {
    const now = Date.now();
    const newPrompt: SavedPrompt = {
      id: currentPromptId || Date.now().toString(),
      name,
      prompt,
      variables,
      createdAt: currentPromptId ? savedPrompts.find(p => p.id === currentPromptId)?.createdAt || now : now,
      lastModified: now
    };

    const updatedPrompts = currentPromptId 
      ? savedPrompts.map(p => p.id === currentPromptId ? newPrompt : p)
      : [...savedPrompts, newPrompt];
    
    setSavedPrompts(updatedPrompts);
    savePromptsToStorage(updatedPrompts);
    setCurrentPromptId(newPrompt.id);
  }, [prompt, variables, currentPromptId, savedPrompts, savePromptsToStorage]);

  const loadPrompt = useCallback((promptId: string) => {
    const savedPrompt = savedPrompts.find(p => p.id === promptId);
    if (savedPrompt) {
      setPrompt(savedPrompt.prompt);
      setVariables(savedPrompt.variables);
      setCurrentPromptId(promptId);
      setProcessedPrompt('');
      setLlmResponse('');
    }
  }, [savedPrompts]);

  const deletePrompt = useCallback((promptId: string) => {
    const updatedPrompts = savedPrompts.filter(p => p.id !== promptId);
    setSavedPrompts(updatedPrompts);
    savePromptsToStorage(updatedPrompts);
    
    if (currentPromptId === promptId) {
      setCurrentPromptId(null);
    }
  }, [savedPrompts, currentPromptId, savePromptsToStorage]);

  const createNewPrompt = useCallback(() => {
    setPrompt('Enter your prompt here. Use {{variable_name}} syntax for variables.\n\nExample:\n- Use {{email_thread}} for email data\n- Use {{user_intent}} for instructions\n- Use {{context}} for additional information');
    setVariables('{\n  "email_thread": [\n    {\n      "from": "sender@example.com",\n      "to": "you@example.com",\n      "content": "Email content here"\n    }\n  ],\n  "user_intent": "Your instruction here",\n  "context": "Additional context"\n}');
    setCurrentPromptId(null);
    setProcessedPrompt('');
    setLlmResponse('');
  }, []);

  // Detect if current prompt has unsaved changes
  const hasUnsavedChanges = useCallback(() => {
    const defaultTemplate = 'Enter your prompt here. Use {{variable_name}} syntax for variables.\n\nExample:\n- Use {{email_thread}} for email data\n- Use {{user_intent}} for instructions\n- Use {{context}} for additional information';
    const defaultVars = '{\n  "email_thread": [\n    {\n      "from": "sender@example.com",\n      "to": "you@example.com",\n      "content": "Email content here"\n    }\n  ],\n  "user_intent": "Your instruction here",\n  "context": "Additional context"\n}';
    
    if (!currentPromptId) return prompt !== defaultTemplate || variables !== defaultVars;
    
    const savedPrompt = savedPrompts.find(p => p.id === currentPromptId);
    if (!savedPrompt) return true;
    
    return savedPrompt.prompt !== prompt || savedPrompt.variables !== variables;
  }, [currentPromptId, savedPrompts, prompt, variables]);


  const substituteVariables = useCallback((text: string): string => {
    try {
      const variableData = JSON.parse(variables);
      let result = text;
      
      Object.entries(variableData).forEach(([key, value]) => {
        const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
        // Convert value to appropriate string representation
        const stringValue = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
        result = result.replace(regex, stringValue);
      });
      
      return result;
    } catch (error) {
      return text + '\n\n[ERROR: Invalid JSON in variables]';
    }
  }, [variables]);

  const executePrompt = useCallback(async () => {
    setIsExecuting(true);
    setFirstByteTime(null);
    const substitutedPrompt = substituteVariables(prompt);
    
    // Set the processed prompt immediately
    setProcessedPrompt(substitutedPrompt);
    setLlmResponse('Executing prompt...\n\nProvider: ' + apiConfig.provider.toUpperCase() + '\n\nProcessing your request...');
    
    try {
      const validation = apiService.validateConfig();
      if (!validation.isValid) {
        setLlmResponse(`Configuration Error:\n${validation.errors.join('\n')}\n\nPlease check your API credentials in Settings.`);
        return;
      }

      let streamingContent = '';
      const streaming: StreamingCallback = {
        onToken: (token: string) => {
          streamingContent += token;
          setLlmResponse(streamingContent);
        },
        onFirstByte: (firstByteTime: number) => {
          setFirstByteTime(firstByteTime);
          setLlmResponse(`${streamingContent}\n\n---\nFirst byte: ${firstByteTime}ms (streaming...)`);
        },
        onComplete: (response) => {
          const timeString = response.executionTime 
            ? `\n\n---\nFirst byte: ${response.firstByteTime}ms | Total time: ${response.executionTime}ms` 
            : '';
          setLlmResponse(`${response.data || 'No response received'}${timeString}`);
          setIsExecuting(false);
        },
        onError: (error) => {
          const timeString = firstByteTime ? ` (First byte: ${firstByteTime}ms)` : '';
          setLlmResponse(`Error: ${error}${timeString}`);
          setIsExecuting(false);
        }
      };

      await apiService.executePrompt(substitutedPrompt, streaming);
    } catch (error) {
      setLlmResponse(`Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsExecuting(false);
    }
  }, [prompt, substituteVariables, apiConfig.provider, apiService]);

  const toggleSection = useCallback((section: string) => {
    setCollapsedSections(prev => {
      const newState = {
        ...prev,
        [section]: !prev[section]
      };
      localStorage.setItem('llm-prompt-tester-collapsed-sections', JSON.stringify(newState));
      return newState;
    });
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = leftPanelWidth;
    let currentWidth = startWidth;

    const handleMouseMove = (e: MouseEvent) => {
      currentWidth = Math.max(200, Math.min(800, startWidth + e.clientX - startX));
      setLeftPanelWidth(currentWidth);
    };

    const handleMouseUp = () => {
      localStorage.setItem('llm-prompt-tester-left-panel-width', currentWidth.toString());
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [leftPanelWidth]);

  return (
    <div className="app">
      <div 
        className={`left-panel ${collapsedSections.variables ? 'collapsed' : ''}`}
        style={{ width: collapsedSections.variables ? 'auto' : `${leftPanelWidth}px` }}
      >
        <div className="panel-header">
          <span>Variables (JSON)</span>
          <button 
            className="collapse-btn"
            onClick={() => toggleSection('variables')}
            title={collapsedSections.variables ? 'Expand Variables' : 'Collapse Variables'}
          >
            {collapsedSections.variables ? '▶' : '▼'}
          </button>
        </div>
        {!collapsedSections.variables && (
        <div className="panel-content">
          <div className="json-editor-container">
            <textarea
              className="json-editor"
              value={variables}
              onChange={(e) => setVariables(e.target.value)}
              placeholder='{\n  "variable_name": "value",\n  "array_example": ["item1", "item2"],\n  "object_example": {\n    "nested": "value"\n  }\n}'
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

      {!collapsedSections.variables && (
        <div 
          className="resize-handle"
          onMouseDown={handleMouseDown}
        />
      )}

      <div className="right-panel">
        <div className={`prompt-panel ${collapsedSections.prompt ? 'collapsed' : ''}`}>
          <div className="panel-header">
            <span>Prompt Template</span>
            <div className="header-actions">
              <button 
                className="collapse-btn"
                onClick={() => toggleSection('prompt')}
                title={collapsedSections.prompt ? 'Expand Prompt' : 'Collapse Prompt'}
              >
                {collapsedSections.prompt ? '▶' : '▼'}
              </button>
              <button 
                className="prompt-manager-btn"
                onClick={() => setShowPromptManager(true)}
              >
                📁 Prompts {hasUnsavedChanges() && '●'}
              </button>
              <button 
                className="settings-btn"
                onClick={() => setShowSettings(true)}
              >
                ⚙️ Settings
              </button>
              <button 
                className="execute-button"
                onClick={executePrompt}
                disabled={isExecuting}
              >
                {isExecuting ? 'Executing...' : 'Execute'}
              </button>
            </div>
          </div>
          {!collapsedSections.prompt && (
          <div className="panel-content">
            <textarea
              className="prompt-textarea"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter your prompt template here. Use {{variableName}} syntax for variables."
            />
          </div>
          )}
        </div>

        <div className="output-panel">
          <div className="output-left">
            <div className={`output-left-top ${collapsedSections.processedPrompt ? 'collapsed' : ''}`}>
              <div className="panel-header">
                <span>Processed Prompt</span>
                <button 
                  className="collapse-btn"
                  onClick={() => toggleSection('processedPrompt')}
                  title={collapsedSections.processedPrompt ? 'Expand Processed Prompt' : 'Collapse Processed Prompt'}
                >
                  {collapsedSections.processedPrompt ? '▶' : '▼'}
                </button>
              </div>
              {!collapsedSections.processedPrompt && (
              <div className="output-content prompt-output">
                {processedPrompt || 'Click "Execute" to see your prompt with variables substituted.'}
              </div>
              )}
            </div>
            <div className={`output-left-bottom ${collapsedSections.jsonPayload ? 'collapsed' : ''}`}>
              <div className="panel-header">
                <span>JSON Payload</span>
                <button 
                  className="collapse-btn"
                  onClick={() => toggleSection('jsonPayload')}
                  title={collapsedSections.jsonPayload ? 'Expand JSON Payload' : 'Collapse JSON Payload'}
                >
                  {collapsedSections.jsonPayload ? '▶' : '▼'}
                </button>
              </div>
              {!collapsedSections.jsonPayload && (
              <div className="output-content json-payload">
                {(() => {
                  try {
                    const parsedVars = JSON.parse(variables);
                    return JSON.stringify(parsedVars, null, 2);
                  } catch (error) {
                    return 'Invalid JSON - fix variables to see payload';
                  }
                })()}
              </div>
              )}
            </div>
          </div>
          <div className={`output-right ${collapsedSections.llmResponse ? 'collapsed' : ''}`}>
            <div className="panel-header">
              <span>LLM Response</span>
              <button 
                className="collapse-btn"
                onClick={() => toggleSection('llmResponse')}
                title={collapsedSections.llmResponse ? 'Expand LLM Response' : 'Collapse LLM Response'}
              >
                {collapsedSections.llmResponse ? '▶' : '▼'}
              </button>
            </div>
            {!collapsedSections.llmResponse && (
            <div className="output-content response-output">
              {llmResponse || 'The AI response will appear here after execution.'}
            </div>
            )}
          </div>
        </div>
      </div>
      
      <Settings
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        config={apiConfig}
        onConfigChange={handleConfigChange}
      />
      
      <PromptManager
        isOpen={showPromptManager}
        onClose={() => setShowPromptManager(false)}
        savedPrompts={savedPrompts}
        currentPromptId={currentPromptId}
        onLoadPrompt={loadPrompt}
        onDeletePrompt={deletePrompt}
        onSavePrompt={saveCurrentPrompt}
        onNewPrompt={createNewPrompt}
        hasUnsavedChanges={hasUnsavedChanges()}
      />
    </div>
  );
}

export default App;
