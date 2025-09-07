import { ApiConfig } from './Settings';

export interface LLMResponse {
  success: boolean;
  data?: string;
  error?: string;
  executionTime?: number;
  firstByteTime?: number;
}

export interface StreamingCallback {
  onToken: (token: string) => void;
  onComplete: (response: LLMResponse) => void;
  onError: (error: string) => void;
  onFirstByte?: (firstByteTime: number) => void;
}

class ApiService {
  private config: ApiConfig;

  constructor(config: ApiConfig) {
    this.config = config;
  }

  updateConfig(config: ApiConfig) {
    this.config = config;
  }

  async callOpenAI(prompt: string, streaming?: StreamingCallback): Promise<LLMResponse> {
    const startTime = Date.now();
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
          temperature: 0.7,
          stream: !!streaming
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
      }

      if (streaming && response.body) {
        return this.handleOpenAIStream(response.body, startTime, streaming);
      } else {
        const firstByteTime = Date.now() - startTime; // For non-streaming, first byte = start of response parsing
        const data = await response.json();
        const executionTime = Date.now() - startTime;
        return {
          success: true,
          data: data.choices[0].message.content,
          executionTime,
          firstByteTime
        };
      }
    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorResponse = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        executionTime
      };
      
      if (streaming) {
        streaming.onError(errorResponse.error!);
      }
      
      return errorResponse;
    }
  }

  private async handleOpenAIStream(body: ReadableStream, startTime: number, streaming: StreamingCallback): Promise<LLMResponse> {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    let fullContent = '';
    let firstByteTime: number | undefined;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Record first byte time on first data received
        if (!firstByteTime) {
          firstByteTime = Date.now() - startTime;
          streaming.onFirstByte?.(firstByteTime);
        }

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              const executionTime = Date.now() - startTime;
              const response = {
                success: true,
                data: fullContent,
                executionTime,
                firstByteTime
              };
              streaming.onComplete(response);
              return response;
            }

            try {
              const parsed = JSON.parse(data);
              const delta = parsed.choices?.[0]?.delta?.content;
              if (delta) {
                fullContent += delta;
                streaming.onToken(delta);
              }
            } catch (e) {
              // Ignore parsing errors for non-JSON lines
            }
          }
        }
      }

      const executionTime = Date.now() - startTime;
      const response = {
        success: true,
        data: fullContent,
        executionTime,
        firstByteTime
      };
      streaming.onComplete(response);
      return response;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorMsg = error instanceof Error ? error.message : 'Stream error occurred';
      streaming.onError(errorMsg);
      return {
        success: false,
        error: errorMsg,
        executionTime,
        firstByteTime
      };
    }
  }

  async callAnthropic(prompt: string, streaming?: StreamingCallback): Promise<LLMResponse> {
    const startTime = Date.now();
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
          ],
          stream: !!streaming
        })
      });

      if (!response.ok) {
        throw new Error(`Anthropic API error: ${response.status} ${response.statusText}`);
      }

      if (streaming && response.body) {
        return this.handleAnthropicStream(response.body, startTime, streaming);
      } else {
        const firstByteTime = Date.now() - startTime; // For non-streaming, first byte = start of response parsing
        const data = await response.json();
        const executionTime = Date.now() - startTime;
        return {
          success: true,
          data: data.content[0].text,
          executionTime,
          firstByteTime
        };
      }
    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorResponse = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        executionTime
      };
      
      if (streaming) {
        streaming.onError(errorResponse.error!);
      }
      
      return errorResponse;
    }
  }

  private async handleAnthropicStream(body: ReadableStream, startTime: number, streaming: StreamingCallback): Promise<LLMResponse> {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    let fullContent = '';
    let firstByteTime: number | undefined;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Record first byte time on first data received
        if (!firstByteTime) {
          firstByteTime = Date.now() - startTime;
          streaming.onFirstByte?.(firstByteTime);
        }

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              const executionTime = Date.now() - startTime;
              const response = {
                success: true,
                data: fullContent,
                executionTime
              };
              streaming.onComplete(response);
              return response;
            }

            try {
              const parsed = JSON.parse(data);
              if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                fullContent += parsed.delta.text;
                streaming.onToken(parsed.delta.text);
              } else if (parsed.type === 'message_stop') {
                const executionTime = Date.now() - startTime;
                const response = {
                  success: true,
                  data: fullContent,
                  executionTime
                };
                streaming.onComplete(response);
                return response;
              }
            } catch (e) {
              // Ignore parsing errors for non-JSON lines
            }
          }
        }
      }

      const executionTime = Date.now() - startTime;
      const response = {
        success: true,
        data: fullContent,
        executionTime,
        firstByteTime
      };
      streaming.onComplete(response);
      return response;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorMsg = error instanceof Error ? error.message : 'Stream error occurred';
      streaming.onError(errorMsg);
      return {
        success: false,
        error: errorMsg,
        executionTime,
        firstByteTime
      };
    }
  }


  async executePrompt(prompt: string, streaming?: StreamingCallback): Promise<LLMResponse> {
    switch (this.config.provider) {
      case 'openai':
        if (!this.config.openaiKey) {
          return {
            success: false,
            error: 'OpenAI API key is required. Please configure it in Settings.'
          };
        }
        return this.callOpenAI(prompt, streaming);

      case 'anthropic':
        if (!this.config.anthropicKey) {
          return {
            success: false,
            error: 'Anthropic API key is required. Please configure it in Settings.'
          };
        }
        return this.callAnthropic(prompt, streaming);

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