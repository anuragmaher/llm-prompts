import React, { useState, useEffect } from 'react';

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
}

const Settings: React.FC<SettingsProps> = ({ isOpen, onClose, config, onConfigChange }) => {
  const [localConfig, setLocalConfig] = useState<ApiConfig>(config);

  useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  const handleSave = () => {
    onConfigChange(localConfig);
    onClose();
  };

  const handleReset = () => {
    setLocalConfig({
      provider: 'openai',
      openaiKey: '',
      openaiModel: 'gpt-4o',
      anthropicKey: '',
      anthropicModel: 'claude-3-5-sonnet-20241022'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="settings-overlay">
      <div className="settings-modal">
        <div className="settings-header">
          <h2>API Configuration</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="settings-content">
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

        <div className="settings-footer">
          <button className="btn-secondary" onClick={handleReset}>Reset</button>
          <button className="btn-primary" onClick={handleSave}>Save Configuration</button>
        </div>
      </div>
    </div>
  );
};

export default Settings;