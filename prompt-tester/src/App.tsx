import React, { useState, useCallback, useEffect } from 'react';
import './App.css';
import Settings, { ApiConfig } from './Settings';
import ApiService from './apiService';
import EvaluationPanel from './EvaluationPanel';
import { EvaluationConfig, OverallEvaluation } from './evaluationService';
import { MultiStepPrompt, MultiStepExecutionResult } from './types';
import { getPredefinedMultiStepPrompts } from './constants/defaults';
import { DocumentService, DocumentServiceConfig } from './documentService';
import DocumentManager from './DocumentManager';
import LlmResponsePanel from './components/LlmResponsePanel';
import MultiStepPromptManager from './MultiStepPromptManager';
import MultiStepPromptEditor from './MultiStepPromptEditor';
import { MultiStepService, MultiStepStreamingCallback } from './multiStepService';

// moved to constants/defaults.ts

// types moved to src/types.ts

function App() {
  // Multi-step prompt state (now the primary mode)
  const [currentMultiStepPrompt, setCurrentMultiStepPrompt] = useState<MultiStepPrompt | null>(null);
  const [savedMultiStepPrompts, setSavedMultiStepPrompts] = useState<MultiStepPrompt[]>([]);
  const [currentMultiStepPromptId, setCurrentMultiStepPromptId] = useState<string | null>(null);
  const [showMultiStepManager, setShowMultiStepManager] = useState<boolean>(false);
  const [multiStepExecutionResults, setMultiStepExecutionResults] = useState<MultiStepExecutionResult[]>([]);
  
  // Execution and UI state
  const [llmResponse, setLlmResponse] = useState<string>('');
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showDocumentManager, setShowDocumentManager] = useState<boolean>(false);
  const [documentConfig, setDocumentConfig] = useState<DocumentServiceConfig | null>(null);
  const [collapsedSections, setCollapsedSections] = useState<{[key: string]: boolean}>(() => {
    const saved = localStorage.getItem('llm-prompt-tester-collapsed-sections');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return {
          llmResponse: false
        };
      }
    }
    return {
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
  const [multiStepService] = useState(() => new MultiStepService(apiService));

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

    // Legacy single prompts and variables are no longer supported
    // Multi-step prompts with global variables are the only supported format now

    // Load saved multi-step prompts
    const savedMultiStepPromptsData = localStorage.getItem('llm-prompt-tester-multi-step-prompts');
    if (savedMultiStepPromptsData) {
      try {
        const multiStepPrompts = JSON.parse(savedMultiStepPromptsData);
        setSavedMultiStepPrompts(multiStepPrompts);
      } catch (error) {
        console.warn('Failed to load saved multi-step prompts');
      }
    } else {
      // Initialize with predefined multi-step prompts on first load
      const predefinedMultiStepPrompts = getPredefinedMultiStepPrompts();
      setSavedMultiStepPrompts(predefinedMultiStepPrompts);
      localStorage.setItem('llm-prompt-tester-multi-step-prompts', JSON.stringify(predefinedMultiStepPrompts));
      
      // Auto-load the first multi-step prompt
      if (predefinedMultiStepPrompts.length > 0) {
        const firstPrompt = predefinedMultiStepPrompts[0];
        setCurrentMultiStepPrompt(firstPrompt);
        setCurrentMultiStepPromptId(firstPrompt.id);
      }
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


  // Multi-step prompt management functions
  const saveMultiStepPromptsToStorage = useCallback((multiStepPrompts: MultiStepPrompt[]) => {
    localStorage.setItem('llm-prompt-tester-multi-step-prompts', JSON.stringify(multiStepPrompts));
  }, []);

  const saveCurrentMultiStepPrompt = useCallback((name: string) => {
    if (!currentMultiStepPrompt) return;
    
    const now = Date.now();
    const updatedPrompt: MultiStepPrompt = {
      ...currentMultiStepPrompt,
      name,
      lastModified: now
    };

    const updatedPrompts = currentMultiStepPromptId 
      ? savedMultiStepPrompts.map(p => p.id === currentMultiStepPromptId ? updatedPrompt : p)
      : [...savedMultiStepPrompts, updatedPrompt];
    
    setSavedMultiStepPrompts(updatedPrompts);
    saveMultiStepPromptsToStorage(updatedPrompts);
    setCurrentMultiStepPromptId(updatedPrompt.id);
  }, [currentMultiStepPrompt, currentMultiStepPromptId, savedMultiStepPrompts, saveMultiStepPromptsToStorage]);

  const loadMultiStepPrompt = useCallback((promptId: string) => {
    const savedPrompt = savedMultiStepPrompts.find(p => p.id === promptId);
    if (savedPrompt) {
      setCurrentMultiStepPrompt(savedPrompt);
      setCurrentMultiStepPromptId(promptId);
      setLlmResponse('');
    }
  }, [savedMultiStepPrompts]);

  const deleteMultiStepPrompt = useCallback((promptId: string) => {
    const updatedPrompts = savedMultiStepPrompts.filter(p => p.id !== promptId);
    setSavedMultiStepPrompts(updatedPrompts);
    saveMultiStepPromptsToStorage(updatedPrompts);
    
    if (currentMultiStepPromptId === promptId) {
      setCurrentMultiStepPromptId(null);
      setCurrentMultiStepPrompt(null);
    }
  }, [savedMultiStepPrompts, currentMultiStepPromptId, saveMultiStepPromptsToStorage]);

  const createNewMultiStepPrompt = useCallback(() => {
    const newPrompt = multiStepService.createMultiStepTemplate();
    setCurrentMultiStepPrompt(newPrompt);
    setCurrentMultiStepPromptId(null);
    setLlmResponse('');
  }, [multiStepService]);

  const hasUnsavedMultiStepChanges = useCallback(() => {
    if (!currentMultiStepPrompt) return false;
    
    if (!currentMultiStepPromptId) return true;
    
    const savedPrompt = savedMultiStepPrompts.find(p => p.id === currentMultiStepPromptId);
    if (!savedPrompt) return true;
    
    return JSON.stringify(savedPrompt) !== JSON.stringify(currentMultiStepPrompt);
  }, [currentMultiStepPrompt, currentMultiStepPromptId, savedMultiStepPrompts]);

  const executeMultiStepPrompt = useCallback(async () => {
    if (!currentMultiStepPrompt) return;

    setIsExecuting(true);
    setLlmResponse('');

    const streaming: MultiStepStreamingCallback = {
      onStepStart: (stepName: string, stepIndex: number, totalSteps: number) => {
        setLlmResponse(prev => prev + `\n--- Step ${stepIndex}/${totalSteps}: ${stepName} ---\n`);
      },
      onStepToken: (stepIndex: number, token: string) => {
        setLlmResponse(prev => prev + token);
      },
      onStepComplete: (stepIndex: number, result) => {
        setLlmResponse(prev => prev + `\n\n[Step ${stepIndex + 1} completed in ${result.executionTime}ms]\n\n`);
      },
      onComplete: (result) => {
        let timeString = `\n\n---\nTotal execution time: ${result.totalExecutionTime}ms${result.firstPaintTime ? `\nFirst paint time: ${result.firstPaintTime}ms` : ''}`;
        if (result.terminatedEarly) {
          timeString += `\n🎯 Execution terminated early: ${result.terminationReason}`;
        }
        setLlmResponse(prev => prev + timeString);
        setMultiStepExecutionResults(prev => [result, ...prev]);
        setIsExecuting(false);
      },
      onError: (error, stepIndex) => {
        const errorMsg = stepIndex !== undefined 
          ? `\nError in step ${stepIndex + 1}: ${error}` 
          : `\nError: ${error}`;
        setLlmResponse(prev => prev + errorMsg);
        setIsExecuting(false);
      }
    };

    try {
      const validation = apiService.validateConfig();
      if (!validation.isValid) {
        setLlmResponse(`Configuration Error:\n${validation.errors.join('\n')}\n\nPlease check your API credentials in Settings.`);
        setIsExecuting(false);
        return;
      }

      await multiStepService.executeMultiStepPrompt(currentMultiStepPrompt, streaming);
    } catch (error) {
      setLlmResponse(`Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsExecuting(false);
    }
  }, [currentMultiStepPrompt, apiService, multiStepService]);


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

  return (
    <div className="app">
      <div className="main-panel">
        <div className="editor-section">
          {currentMultiStepPrompt ? (
            <MultiStepPromptEditor
              multiStepPrompt={currentMultiStepPrompt}
              onMultiStepPromptChange={setCurrentMultiStepPrompt}
              onExecute={executeMultiStepPrompt}
              isExecuting={isExecuting}
              onOpenSettings={() => setShowSettings(true)}
              onOpenDocuments={() => setShowDocumentManager(true)}
              onOpenPromptManager={() => setShowMultiStepManager(true)}
            />
          ) : (
            <div className="multi-step-empty">
              <h2>Multi-Step Prompt Tester</h2>
              <p>No multi-step prompt selected. Create or load a prompt to get started.</p>
              <div className="empty-actions">
                <button onClick={() => setShowMultiStepManager(true)}>
                  📁 Browse Prompts
                </button>
                <button onClick={createNewMultiStepPrompt}>
                  ✨ Create New Prompt
                </button>
                <button onClick={() => setShowSettings(true)}>
                  ⚙️ Settings
                </button>
                <button onClick={() => setShowDocumentManager(true)}>
                  📚 Documents
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="output-panel">
          <LlmResponsePanel
            response={llmResponse}
            collapsed={collapsedSections.llmResponse}
            onToggle={() => toggleSection('llmResponse')}
          />
          
          <div className="evaluation-container">
            <EvaluationPanel
              variables={currentMultiStepPrompt?.globalVariables || '{}'}
              llmResponse={llmResponse}
              apiConfig={apiConfig}
              evaluationConfig={evaluationConfig}
              onEvaluationComplete={handleEvaluationComplete}
            />
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
      
      <DocumentManager
        isOpen={showDocumentManager}
        onClose={() => setShowDocumentManager(false)}
        documentService={documentService}
        documentConfig={documentConfig}
      />
      
      <MultiStepPromptManager
        isOpen={showMultiStepManager}
        onClose={() => setShowMultiStepManager(false)}
        savedMultiStepPrompts={savedMultiStepPrompts}
        currentMultiStepPromptId={currentMultiStepPromptId}
        onLoadMultiStepPrompt={loadMultiStepPrompt}
        onDeleteMultiStepPrompt={deleteMultiStepPrompt}
        onSaveMultiStepPrompt={saveCurrentMultiStepPrompt}
        onNewMultiStepPrompt={createNewMultiStepPrompt}
        hasUnsavedChanges={hasUnsavedMultiStepChanges()}
      />
    </div>
  );
}

export default App;
