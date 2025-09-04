import React, { useState, useCallback, useEffect } from 'react';
import './App.css';
import Settings, { ApiConfig } from './Settings';
import ApiService from './apiService';

interface Variable {
  id: string;
  name: string;
  value: string;
}

function App() {
  const [variables, setVariables] = useState<Variable[]>([
    { id: '1', name: 'name', value: 'John' },
    { id: '2', name: 'task', value: 'write a blog post' }
  ]);
  const [prompt, setPrompt] = useState<string>('Hello {{name}}, please {{task}} about artificial intelligence.');
  const [output, setOutput] = useState<string>('');
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [apiConfig, setApiConfig] = useState<ApiConfig>({
    provider: 'openai',
    openaiKey: '',
    openaiModel: 'gpt-4o',
    anthropicKey: '',
    anthropicModel: 'claude-3-5-sonnet-20241022'
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
  }, [apiService]);

  const handleConfigChange = useCallback((newConfig: ApiConfig) => {
    setApiConfig(newConfig);
    apiService.updateConfig(newConfig);
    localStorage.setItem('llm-prompt-tester-config', JSON.stringify(newConfig));
  }, [apiService]);

  const addVariable = () => {
    const newId = Date.now().toString();
    setVariables([...variables, { id: newId, name: `var${variables.length + 1}`, value: '' }]);
  };

  const removeVariable = (id: string) => {
    setVariables(variables.filter(v => v.id !== id));
  };

  const updateVariable = (id: string, field: 'name' | 'value', newValue: string) => {
    setVariables(variables.map(v => 
      v.id === id ? { ...v, [field]: newValue } : v
    ));
  };

  const substituteVariables = useCallback((text: string): string => {
    let result = text;
    variables.forEach(variable => {
      const regex = new RegExp(`\\{\\{${variable.name}\\}\\}`, 'g');
      result = result.replace(regex, variable.value);
    });
    return result;
  }, [variables]);

  const executePrompt = useCallback(async () => {
    setIsExecuting(true);
    const substitutedPrompt = substituteVariables(prompt);
    
    setOutput(`Executing prompt...\n\nProvider: ${apiConfig.provider.toUpperCase()}\nSubstituted Prompt:\n${substitutedPrompt}\n\n--- Response ---\n`);
    
    try {
      const validation = apiService.validateConfig();
      if (!validation.isValid) {
        setOutput(prev => prev + `Configuration Error:\n${validation.errors.join('\n')}\n\nPlease check your API credentials in Settings.`);
        return;
      }

      const response = await apiService.executePrompt(substitutedPrompt);
      
      if (response.success) {
        setOutput(prev => prev + (response.data || 'No response received'));
      } else {
        setOutput(prev => prev + `Error: ${response.error}`);
      }
    } catch (error) {
      setOutput(prev => prev + `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsExecuting(false);
    }
  }, [prompt, substituteVariables, apiConfig.provider, apiService]);

  return (
    <div className="app">
      <div className="left-panel">
        <div className="panel-header">Variables</div>
        <div className="panel-content">
          {variables.map(variable => (
            <div key={variable.id} className="variable-item">
              <button 
                className="remove-variable-btn"
                onClick={() => removeVariable(variable.id)}
              >
                ×
              </button>
              <div className="variable-label">Variable Name:</div>
              <input
                className="variable-input"
                type="text"
                value={variable.name}
                onChange={(e) => updateVariable(variable.id, 'name', e.target.value)}
                placeholder="Variable name"
              />
              <div className="variable-label">Value:</div>
              <input
                className="variable-input"
                type="text"
                value={variable.value}
                onChange={(e) => updateVariable(variable.id, 'value', e.target.value)}
                placeholder="Variable value"
              />
            </div>
          ))}
          <button className="add-variable-btn" onClick={addVariable}>
            + Add Variable
          </button>
        </div>
      </div>

      <div className="right-panel">
        <div className="prompt-panel">
          <div className="panel-header">
            Prompt Template
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
          <div className="panel-content">
            <textarea
              className="prompt-textarea"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter your prompt template here. Use {{variableName}} syntax for variables."
            />
          </div>
        </div>

        <div className="output-panel">
          <div className="panel-header">Output</div>
          <div className="panel-content">
            <div className="output-content">
              {output || 'Click "Execute" to see the output with variables substituted.'}
            </div>
          </div>
        </div>
      </div>
      
      <Settings
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        config={apiConfig}
        onConfigChange={handleConfigChange}
      />
    </div>
  );
}

export default App;
