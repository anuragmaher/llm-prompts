import React, { useState, useCallback, useEffect } from 'react';
import './App.css';
import Settings, { ApiConfig } from './Settings';
import ApiService, { StreamingCallback } from './apiService';
import PromptManager from './PromptManager';
import VariableManager from './VariableManager';
import EvaluationPanel from './EvaluationPanel';
import { EvaluationConfig, OverallEvaluation } from './evaluationService';
import { SavedPrompt, SavedVariableSet } from './types';
import { DEFAULT_PROMPT, DEFAULT_VARIABLES, getPredefinedVariableSets, NEW_PROMPT_TEMPLATE, NEW_VARIABLES_TEMPLATE } from './constants/defaults';
import { DocumentService, DocumentServiceConfig } from './documentService';
import DocumentManager from './DocumentManager';
import { substituteVariables as substituteVariablesUtil } from './utils/templating';
import VariablesPanel from './components/VariablesPanel';
import PromptPanel from './components/PromptPanel';
import ProcessedPromptPanel from './components/ProcessedPromptPanel';
import JsonPayloadPanel from './components/JsonPayloadPanel';
import LlmResponsePanel from './components/LlmResponsePanel';

// moved to constants/defaults.ts

// types moved to src/types.ts

function App() {
  const [variables, setVariables] = useState<string>(DEFAULT_VARIABLES);
  const [prompt, setPrompt] = useState<string>(DEFAULT_PROMPT);
  const [processedPrompt, setProcessedPrompt] = useState<string>('');
  const [llmResponse, setLlmResponse] = useState<string>('');
  const [firstByteTime, setFirstByteTime] = useState<number | null>(null);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [savedPrompts, setSavedPrompts] = useState<SavedPrompt[]>([]);
  const [currentPromptId, setCurrentPromptId] = useState<string | null>(null);
  const [showPromptManager, setShowPromptManager] = useState<boolean>(false);
  const [savedVariableSets, setSavedVariableSets] = useState<SavedVariableSet[]>([]);
  const [currentVariableSetId, setCurrentVariableSetId] = useState<string | null>(null);
  const [showVariableManager, setShowVariableManager] = useState<boolean>(false);
  const [showDocumentManager, setShowDocumentManager] = useState<boolean>(false);
  const [documentConfig, setDocumentConfig] = useState<DocumentServiceConfig | null>(null);
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
  const [evaluationConfig, setEvaluationConfig] = useState<EvaluationConfig>({
    criteria: [
      {
        name: 'Relevance',
        description: 'How well does the response address the user intent and context?',
        weight: 9,
        enabled: true
      },
      {
        name: 'Accuracy',
        description: 'Is the information provided factually correct and reliable?',
        weight: 8,
        enabled: true
      },
      {
        name: 'Clarity',
        description: 'How clear, well-structured, and easy to understand is the response?',
        weight: 7,
        enabled: true
      },
      {
        name: 'Completeness',
        description: 'Does the response fully address all aspects of the request?',
        weight: 7,
        enabled: true
      },
      {
        name: 'Tone Appropriateness',
        description: 'Is the tone professional, appropriate, and aligned with the context?',
        weight: 6,
        enabled: true
      },
      {
        name: 'Helpfulness',
        description: 'How actionable and useful is the response for the recipient?',
        weight: 8,
        enabled: true
      }
    ],
    judgeModel: 'gpt-4o',
    temperature: 0.2
  });
  const [apiService] = useState(() => new ApiService(apiConfig));
  const [documentService] = useState(() => new DocumentService());

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

    // Load saved evaluation config
    const savedEvaluationConfig = localStorage.getItem('llm-prompt-tester-evaluation-config');
    if (savedEvaluationConfig) {
      try {
        const config = JSON.parse(savedEvaluationConfig);
        setEvaluationConfig(config);
      } catch (error) {
        console.warn('Failed to load saved evaluation configuration');
      }
    }

    // Load saved document config
    const savedDocumentConfig = localStorage.getItem('llm-prompt-tester-document-config');
    if (savedDocumentConfig) {
      try {
        const config = JSON.parse(savedDocumentConfig);
        setDocumentConfig(config);
        documentService.updateConfig(config);
      } catch (error) {
        console.warn('Failed to load saved document configuration');
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

    // Load saved variable sets
    const savedVariableSetsData = localStorage.getItem('llm-prompt-tester-variable-sets');
    if (savedVariableSetsData) {
      try {
        const variableSets = JSON.parse(savedVariableSetsData);
        setSavedVariableSets(variableSets);
      } catch (error) {
        console.warn('Failed to load saved variable sets');
      }
    } else {
      // Initialize with predefined variable sets on first load
      const predefinedVariableSets = getPredefinedVariableSets();
      setSavedVariableSets(predefinedVariableSets);
      localStorage.setItem('llm-prompt-tester-variable-sets', JSON.stringify(predefinedVariableSets));
    }
  }, [apiService]);

  const handleConfigChange = useCallback((newConfig: ApiConfig) => {
    setApiConfig(newConfig);
    apiService.updateConfig(newConfig);
    localStorage.setItem('llm-prompt-tester-config', JSON.stringify(newConfig));
  }, [apiService]);

  const handleEvaluationConfigChange = useCallback((newConfig: EvaluationConfig) => {
    setEvaluationConfig(newConfig);
    localStorage.setItem('llm-prompt-tester-evaluation-config', JSON.stringify(newConfig));
  }, []);

  const handleDocumentConfigChange = useCallback((newConfig: DocumentServiceConfig) => {
    setDocumentConfig(newConfig);
    documentService.updateConfig(newConfig);
    localStorage.setItem('llm-prompt-tester-document-config', JSON.stringify(newConfig));
  }, [documentService]);

  const handleEvaluationComplete = useCallback((evaluation: OverallEvaluation) => {
    // Handle evaluation completion if needed
    console.log('Evaluation completed:', evaluation);
  }, []);

  const savePromptsToStorage = useCallback((prompts: SavedPrompt[]) => {
    localStorage.setItem('llm-prompt-tester-prompts', JSON.stringify(prompts));
  }, []);

  const saveVariableSetsToStorage = useCallback((variableSets: SavedVariableSet[]) => {
    localStorage.setItem('llm-prompt-tester-variable-sets', JSON.stringify(variableSets));
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
    setPrompt(NEW_PROMPT_TEMPLATE);
    setVariables(NEW_VARIABLES_TEMPLATE);
    setCurrentPromptId(null);
    setProcessedPrompt('');
    setLlmResponse('');
  }, []);

  const saveCurrentVariableSet = useCallback((name: string) => {
    const now = Date.now();
    const newVariableSet: SavedVariableSet = {
      id: currentVariableSetId || Date.now().toString(),
      name,
      variables,
      createdAt: currentVariableSetId ? savedVariableSets.find(v => v.id === currentVariableSetId)?.createdAt || now : now,
      lastModified: now
    };

    const updatedVariableSets = currentVariableSetId 
      ? savedVariableSets.map(v => v.id === currentVariableSetId ? newVariableSet : v)
      : [...savedVariableSets, newVariableSet];
    
    setSavedVariableSets(updatedVariableSets);
    saveVariableSetsToStorage(updatedVariableSets);
    setCurrentVariableSetId(newVariableSet.id);
  }, [variables, currentVariableSetId, savedVariableSets, saveVariableSetsToStorage]);

  const loadVariableSet = useCallback((variableSetId: string) => {
    const savedVariableSet = savedVariableSets.find(v => v.id === variableSetId);
    if (savedVariableSet) {
      setVariables(savedVariableSet.variables);
      setCurrentVariableSetId(variableSetId);
      setProcessedPrompt('');
      setLlmResponse('');
    }
  }, [savedVariableSets]);

  const deleteVariableSet = useCallback((variableSetId: string) => {
    const updatedVariableSets = savedVariableSets.filter(v => v.id !== variableSetId);
    setSavedVariableSets(updatedVariableSets);
    saveVariableSetsToStorage(updatedVariableSets);
    
    if (currentVariableSetId === variableSetId) {
      setCurrentVariableSetId(null);
    }
  }, [savedVariableSets, currentVariableSetId, saveVariableSetsToStorage]);

  const createNewVariableSet = useCallback(() => {
    setVariables(NEW_VARIABLES_TEMPLATE);
    setCurrentVariableSetId(null);
    setProcessedPrompt('');
    setLlmResponse('');
  }, []);

  // Detect if current prompt has unsaved changes
  const hasUnsavedChanges = useCallback(() => {
    const defaultTemplate = NEW_PROMPT_TEMPLATE;
    const defaultVars = NEW_VARIABLES_TEMPLATE;
    
    if (!currentPromptId) return prompt !== defaultTemplate || variables !== defaultVars;
    
    const savedPrompt = savedPrompts.find(p => p.id === currentPromptId);
    if (!savedPrompt) return true;
    
    return savedPrompt.prompt !== prompt || savedPrompt.variables !== variables;
  }, [currentPromptId, savedPrompts, prompt, variables]);

  // Detect if current variables have unsaved changes
  const hasUnsavedVariableChanges = useCallback(() => {
    if (!currentVariableSetId) return variables !== JSON.stringify({
      "agent_info": {
        "name": "Anurag Maherchandani",
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
    }, null, 2);
    
    const savedVariableSet = savedVariableSets.find(v => v.id === currentVariableSetId);
    if (!savedVariableSet) return true;
    
    return savedVariableSet.variables !== variables;
  }, [currentVariableSetId, savedVariableSets, variables]);


  const substituteVariables = useCallback((text: string): string => {
    return substituteVariablesUtil(text, variables);
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
  }, [prompt, substituteVariables, apiConfig.provider, apiService, firstByteTime]);

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
        <VariablesPanel
          variables={variables}
          onVariablesChange={setVariables}
          collapsed={collapsedSections.variables}
          onToggle={() => toggleSection('variables')}
          hasUnsaved={hasUnsavedVariableChanges()}
          onOpenManager={() => setShowVariableManager(true)}
        />
      </div>

      {!collapsedSections.variables && (
        <div 
          className="resize-handle"
          onMouseDown={handleMouseDown}
        />
      )}

      <div className="right-panel">
        <PromptPanel
          prompt={prompt}
          onPromptChange={setPrompt}
          collapsed={collapsedSections.prompt}
          onToggle={() => toggleSection('prompt')}
          onOpenPromptManager={() => setShowPromptManager(true)}
          hasUnsaved={hasUnsavedChanges()}
          onOpenSettings={() => setShowSettings(true)}
          onOpenDocuments={() => setShowDocumentManager(true)}
          onExecute={executePrompt}
          isExecuting={isExecuting}
        />

        <div className="output-panel">
          <div className="output-left">
            <ProcessedPromptPanel
              content={processedPrompt}
              collapsed={collapsedSections.processedPrompt}
              onToggle={() => toggleSection('processedPrompt')}
            />
            <div className={`output-left-bottom ${collapsedSections.jsonPayload ? 'collapsed' : ''}`}>
              <JsonPayloadPanel
                variables={variables}
                collapsed={collapsedSections.jsonPayload}
                onToggle={() => toggleSection('jsonPayload')}
              />
            </div>
          </div>
          <div className="output-right-container">
            <LlmResponsePanel
              response={llmResponse}
              collapsed={collapsedSections.llmResponse}
              onToggle={() => toggleSection('llmResponse')}
            />
            
            <div className="evaluation-container">
              <EvaluationPanel
                variables={variables}
                llmResponse={llmResponse}
                apiConfig={apiConfig}
                evaluationConfig={evaluationConfig}
                onEvaluationComplete={handleEvaluationComplete}
              />
            </div>
          </div>
        </div>
      </div>
      
      <Settings
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        config={apiConfig}
        onConfigChange={handleConfigChange}
        evaluationConfig={evaluationConfig}
        onEvaluationConfigChange={handleEvaluationConfigChange}
        documentConfig={documentConfig}
        onDocumentConfigChange={handleDocumentConfigChange}
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
      
      <VariableManager
        isOpen={showVariableManager}
        onClose={() => setShowVariableManager(false)}
        savedVariableSets={savedVariableSets}
        currentVariableSetId={currentVariableSetId}
        onLoadVariableSet={loadVariableSet}
        onDeleteVariableSet={deleteVariableSet}
        onSaveVariableSet={saveCurrentVariableSet}
        onNewVariableSet={createNewVariableSet}
        hasUnsavedChanges={hasUnsavedVariableChanges()}
      />
      
      <DocumentManager
        isOpen={showDocumentManager}
        onClose={() => setShowDocumentManager(false)}
        documentService={documentService}
        documentConfig={documentConfig}
      />
    </div>
  );
}

export default App;
