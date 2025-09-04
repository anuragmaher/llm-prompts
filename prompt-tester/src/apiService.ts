import { ApiConfig } from './Settings';

export interface LLMResponse {
  success: boolean;
  data?: string;
  error?: string;
}

class ApiService {
  private config: ApiConfig;

  constructor(config: ApiConfig) {
    this.config = config;
  }

  updateConfig(config: ApiConfig) {
    this.config = config;
  }

  async callOpenAI(prompt: string): Promise<LLMResponse> {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.openaiKey}`
        },
        body: JSON.stringify({
          model: this.config.openaiModel,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 1000,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data.choices[0].message.content
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async callAnthropic(prompt: string): Promise<LLMResponse> {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.config.anthropicKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: this.config.anthropicModel,
          max_tokens: 1000,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`Anthropic API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data.content[0].text
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }


  async executePrompt(prompt: string): Promise<LLMResponse> {
    switch (this.config.provider) {
      case 'openai':
        if (!this.config.openaiKey) {
          return {
            success: false,
            error: 'OpenAI API key is required. Please configure it in Settings.'
          };
        }
        return this.callOpenAI(prompt);

      case 'anthropic':
        if (!this.config.anthropicKey) {
          return {
            success: false,
            error: 'Anthropic API key is required. Please configure it in Settings.'
          };
        }
        return this.callAnthropic(prompt);

      default:
        return {
          success: false,
          error: 'Unknown provider selected'
        };
    }
  }

  validateConfig(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    switch (this.config.provider) {
      case 'openai':
        if (!this.config.openaiKey) {
          errors.push('OpenAI API key is required');
        } else if (!this.config.openaiKey.startsWith('sk-')) {
          errors.push('OpenAI API key should start with "sk-"');
        }
        if (!this.config.openaiModel) {
          errors.push('OpenAI model selection is required');
        }
        break;
        
      case 'anthropic':
        if (!this.config.anthropicKey) {
          errors.push('Anthropic API key is required');
        } else if (!this.config.anthropicKey.startsWith('sk-ant-')) {
          errors.push('Anthropic API key should start with "sk-ant-"');
        }
        if (!this.config.anthropicModel) {
          errors.push('Anthropic model selection is required');
        }
        break;
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export default ApiService;