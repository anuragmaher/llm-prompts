import React, { useState, useEffect } from 'react';
import { EvaluationCriteria, EvaluationConfig } from './evaluationService';

export interface ApiConfig {
  provider: 'openai' | 'anthropic';
  openaiKey: string;
  openaiModel: string;
  anthropicKey: string;
  anthropicModel: string;
}

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
  config: ApiConfig;
  onConfigChange: (config: ApiConfig) => void;
  evaluationConfig: EvaluationConfig;
  onEvaluationConfigChange: (config: EvaluationConfig) => void;
}

const Settings: React.FC<SettingsProps> = ({ 
  isOpen, 
  onClose, 
  config, 
  onConfigChange, 
  evaluationConfig, 
  onEvaluationConfigChange 
}) => {
  const [localConfig, setLocalConfig] = useState<ApiConfig>(config);
  const [localEvaluationConfig, setLocalEvaluationConfig] = useState<EvaluationConfig>(evaluationConfig);
  const [activeTab, setActiveTab] = useState<'api' | 'evaluation'>('api');

  useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  useEffect(() => {
    setLocalEvaluationConfig(evaluationConfig);
  }, [evaluationConfig]);

  const handleSave = () => {
    onConfigChange(localConfig);
    onEvaluationConfigChange(localEvaluationConfig);
    onClose();
  };

  const handleReset = () => {
    if (activeTab === 'api') {
      setLocalConfig({
        provider: 'openai',
        openaiKey: '',
        openaiModel: 'gpt-4o',
        anthropicKey: '',
        anthropicModel: 'claude-3-5-sonnet-20241022'
      });
    } else {
      // Reset evaluation config to defaults
      setLocalEvaluationConfig({
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
    }
  };

  const handleCriteriaChange = (index: number, updates: Partial<EvaluationCriteria>) => {
    const newCriteria = [...localEvaluationConfig.criteria];
    newCriteria[index] = { ...newCriteria[index], ...updates };
    setLocalEvaluationConfig({ ...localEvaluationConfig, criteria: newCriteria });
  };

  if (!isOpen) return null;

  return (
    <div className="settings-overlay">
      <div className="settings-modal">
        <div className="settings-header">
          <h2>Settings</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="settings-tabs">
          <button 
            className={`tab-btn ${activeTab === 'api' ? 'active' : ''}`}
            onClick={() => setActiveTab('api')}
          >
            API Configuration
          </button>
          <button 
            className={`tab-btn ${activeTab === 'evaluation' ? 'active' : ''}`}
            onClick={() => setActiveTab('evaluation')}
          >
            Evaluation Settings
          </button>
        </div>
        
        <div className="settings-content">{activeTab === 'api' ? (
          <div>
            <div className="setting-group">
              <label className="setting-label">LLM Provider:</label>
              <select 
                className="setting-select"
                value={localConfig.provider}
                onChange={(e) => setLocalConfig({...localConfig, provider: e.target.value as ApiConfig['provider']})}
              >
                <option value="openai">OpenAI GPT</option>
                <option value="anthropic">Anthropic Claude</option>
              </select>
            </div>

            <div className="setting-group">
              <label className="setting-label">OpenAI API Key:</label>
              <input
                type="password"
                className="setting-input"
                placeholder="sk-..."
                value={localConfig.openaiKey}
                onChange={(e) => setLocalConfig({...localConfig, openaiKey: e.target.value})}
              />
              <small className="setting-help">
                Get your key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer">OpenAI Platform</a>
              </small>
            </div>

            <div className="setting-group">
              <label className="setting-label">OpenAI Model:</label>
              <select 
                className="setting-select"
                value={localConfig.openaiModel}
                onChange={(e) => setLocalConfig({...localConfig, openaiModel: e.target.value})}
              >
                <option value="gpt-4o">GPT-4o (Latest)</option>
                <option value="gpt-4o-mini">GPT-4o Mini (Faster, cheaper)</option>
                <option value="gpt-4-turbo">GPT-4 Turbo</option>
                <option value="gpt-4">GPT-4</option>
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo (Cheapest)</option>
              </select>
            </div>

            <div className="setting-group">
              <label className="setting-label">Anthropic API Key:</label>
              <input
                type="password" 
                className="setting-input"
                placeholder="sk-ant-..."
                value={localConfig.anthropicKey}
                onChange={(e) => setLocalConfig({...localConfig, anthropicKey: e.target.value})}
              />
              <small className="setting-help">
                Get your key from <a href="https://console.anthropic.com/" target="_blank" rel="noopener noreferrer">Anthropic Console</a>
              </small>
            </div>

            <div className="setting-group">
              <label className="setting-label">Anthropic Model:</label>
              <select 
                className="setting-select"
                value={localConfig.anthropicModel}
                onChange={(e) => setLocalConfig({...localConfig, anthropicModel: e.target.value})}
              >
                <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet (Latest)</option>
                <option value="claude-3-5-haiku-20241022">Claude 3.5 Haiku (Faster, cheaper)</option>
                <option value="claude-3-opus-20240229">Claude 3 Opus (Most capable)</option>
                <option value="claude-3-sonnet-20240229">Claude 3 Sonnet</option>
                <option value="claude-3-haiku-20240307">Claude 3 Haiku</option>
              </select>
            </div>

            <div className="security-notice">
              <strong>🔒 Security Note:</strong> API keys are stored locally in your browser and never sent to external servers except the LLM providers you choose.
            </div>
          </div>
        ) : (
          <div>
            <div className="setting-group">
              <label className="setting-label">Judge Model:</label>
              <select 
                className="setting-select"
                value={localEvaluationConfig.judgeModel}
                onChange={(e) => setLocalEvaluationConfig({
                  ...localEvaluationConfig, 
                  judgeModel: e.target.value as EvaluationConfig['judgeModel']
                })}
              >
                <option value="gpt-4o">GPT-4o (Recommended for evaluation)</option>
                <option value="gpt-4-turbo">GPT-4 Turbo (Higher quality, more expensive)</option>
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo (Budget option)</option>
              </select>
              <small className="setting-help">
                GPT-4o provides the best balance of quality and speed for evaluation tasks.
              </small>
            </div>

            <div className="setting-group">
              <label className="setting-label">Temperature ({localEvaluationConfig.temperature}):</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={localEvaluationConfig.temperature}
                onChange={(e) => setLocalEvaluationConfig({
                  ...localEvaluationConfig, 
                  temperature: parseFloat(e.target.value)
                })}
                className="setting-range"
              />
              <small className="setting-help">
                Lower values (0.0-0.3) provide more consistent evaluations. Higher values add variation.
              </small>
            </div>

            <div className="criteria-section">
              <h3 className="criteria-title">Evaluation Criteria</h3>
              {localEvaluationConfig.criteria.map((criterion, index) => (
                <div key={criterion.name} className="criterion-item">
                  <div className="criterion-header">
                    <label className="criterion-toggle">
                      <input
                        type="checkbox"
                        checked={criterion.enabled}
                        onChange={(e) => handleCriteriaChange(index, { enabled: e.target.checked })}
                      />
                      <strong>{criterion.name}</strong>
                    </label>
                    <div className="weight-control">
                      <label>Weight: </label>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={criterion.weight}
                        onChange={(e) => handleCriteriaChange(index, { weight: parseInt(e.target.value) })}
                        disabled={!criterion.enabled}
                        className="weight-slider"
                      />
                      <span className="weight-value">{criterion.weight}</span>
                    </div>
                  </div>
                  <p className="criterion-description">{criterion.description}</p>
                </div>
              ))}
            </div>

            <div className="evaluation-notice">
              <strong>💡 Note:</strong> Evaluation requires an OpenAI API key. The judge model will assess responses based on your selected criteria.
            </div>
          </div>
        )}
        </div>

        <div className="settings-footer">
          <button className="btn-secondary" onClick={handleReset}>Reset</button>
          <button className="btn-primary" onClick={handleSave}>Save Configuration</button>
        </div>
      </div>
    </div>
  );
};

export default Settings;