# API Integration Guide

This guide explains how the LLM Prompt Tester integrates with OpenAI and Anthropic APIs, including setup, configuration, and troubleshooting.

## Overview

The application provides a unified interface for testing prompts across multiple LLM providers. It supports both standard and streaming API calls with real-time response display.

## Supported Providers

### OpenAI
- **Models**: GPT-4 Turbo, GPT-4o, GPT-3.5 Turbo
- **Features**: Chat completions, streaming responses
- **Rate Limits**: Follows OpenAI's rate limiting policies

### Anthropic
- **Models**: Claude 3.5 Sonnet, Claude 3 Haiku, Claude 3 Opus  
- **Features**: Messages API, streaming responses
- **Rate Limits**: Follows Anthropic's rate limiting policies

## API Configuration

### Environment Variables

Create a `.env.local` file in the project root:

```env
# Required: API Keys
REACT_APP_OPENAI_API_KEY=sk-proj-xxxx
REACT_APP_ANTHROPIC_API_KEY=sk-ant-xxxx

# Optional: Default Settings
REACT_APP_DEFAULT_PROVIDER=openai
REACT_APP_DEFAULT_OPENAI_MODEL=gpt-4o
REACT_APP_DEFAULT_ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
```

### Runtime Configuration

Users can also configure APIs through the Settings UI:
1. Click the "⚙️ Settings" button
2. Select provider (OpenAI or Anthropic)
3. Enter API key
4. Choose model
5. Save configuration

Settings are persisted in localStorage and encrypted for security.

## API Implementation Details

### Service Architecture

The `apiService.ts` file provides a unified interface:

```typescript
class ApiService {
  // Provider-agnostic method
  async executePrompt(prompt: string, streaming?: StreamingCallback): Promise<LLMResponse>
  
  // Provider-specific methods
  async callOpenAI(prompt: string, streaming?: StreamingCallback): Promise<LLMResponse>
  async callAnthropic(prompt: string, streaming?: StreamingCallback): Promise<LLMResponse>
}
```

### Request Format

**OpenAI Chat Completions**
```json
{
  "model": "gpt-4o",
  "messages": [
    {
      "role": "user", 
      "content": "Your processed prompt here"
    }
  ],
  "max_tokens": 1000,
  "temperature": 0.7,
  "stream": true
}
```

**Anthropic Messages**
```json
{
  "model": "claude-3-5-sonnet-20241022",
  "max_tokens": 1000,
  "messages": [
    {
      "role": "user",
      "content": "Your processed prompt here"
    }
  ],
  "stream": true
}
```

### Streaming Implementation

Both providers support Server-Sent Events (SSE) for streaming:

**OpenAI Stream Format**
```
data: {"choices":[{"delta":{"content":"Hello"}}]}
data: {"choices":[{"delta":{"content":" world"}}]}
data: [DONE]
```

**Anthropic Stream Format**
```
data: {"type":"content_block_delta","delta":{"text":"Hello"}}
data: {"type":"content_block_delta","delta":{"text":" world"}}
data: {"type":"message_stop"}
```

## Error Handling

### Common Error Types

**Authentication Errors**
- Invalid API key
- Expired API key
- Insufficient credits

**Rate Limiting**
- Too many requests per minute
- Concurrent request limits exceeded

**Model Errors**
- Unsupported model selected
- Model temporarily unavailable

**Content Errors**
- Input too long
- Content policy violations

### Error Response Format

```typescript
interface LLMResponse {
  success: boolean;
  data?: string;           // Response content
  error?: string;          // Error message
  executionTime?: number;  // Request duration in ms
}
```

### Error Recovery

The application implements several error recovery strategies:

1. **Automatic Retry**: Transient errors are retried with exponential backoff
2. **Graceful Fallback**: Failed streaming requests fall back to standard requests
3. **User Feedback**: Clear error messages with suggested actions
4. **Validation**: Pre-request validation of API keys and settings

## Security Considerations

### API Key Storage
- Keys stored in localStorage (client-side only)
- Never logged or transmitted except to official APIs
- Users responsible for key security

### CORS and Proxy
- Direct API calls from browser (CORS enabled by providers)
- Optional proxy implementation available for additional security
- Rate limiting handled by providers

### Best Practices
- Use environment variables for development
- Rotate API keys regularly
- Monitor usage and billing
- Implement proper error handling

## Usage Limits

### OpenAI Limits
- **Rate Limits**: Vary by plan and model
- **Token Limits**: 4K-128K tokens depending on model
- **Monthly Limits**: Based on billing plan

### Anthropic Limits  
- **Rate Limits**: Requests per minute based on plan
- **Token Limits**: Up to 200K tokens for Claude 3
- **Monthly Limits**: Based on subscription tier

### Application Limits
- **Request Timeout**: 120 seconds default
- **Max Tokens**: 1000 tokens (configurable)
- **Concurrent Requests**: 1 (prevents rate limiting)

## Monitoring and Analytics

### Execution Timing
- Response time measurement for performance analysis
- Displayed in UI after each request
- Useful for comparing model performance

### Usage Tracking
- Request count stored locally
- No data sent to external analytics
- Users can monitor their own usage patterns

## Troubleshooting

### Connection Issues
1. Check internet connectivity
2. Verify API endpoints are reachable
3. Check for firewall/proxy restrictions

### Authentication Problems
1. Verify API key format and validity
2. Check account status and billing
3. Ensure sufficient credits/quota

### Performance Issues
1. Monitor request timing
2. Check for rate limiting
3. Consider model selection impact

### Feature-Specific Issues

**Streaming Not Working**
- Verify browser supports EventSource
- Check for network proxy interference
- Fall back to standard requests

**Variables Not Substituting**
- Validate JSON syntax in variables panel
- Check variable name spelling in prompt
- Ensure proper `{{variable}}` syntax

## API Updates

### Staying Current
- Monitor provider documentation for changes
- Update model lists as new models are released
- Test compatibility with API updates

### Versioning
- OpenAI: Uses latest stable API version
- Anthropic: Pinned to specific API version (2023-06-01)
- Application: Follow semantic versioning

## Development

### Local Testing
```bash
# Start with API debugging
REACT_APP_DEBUG_API=true npm start

# Test specific provider
REACT_APP_DEFAULT_PROVIDER=anthropic npm start
```

### API Mocking
For development without real API calls:
```javascript
// Mock responses for testing
const mockApiService = {
  executePrompt: async (prompt) => ({
    success: true,
    data: "Mock response",
    executionTime: 500
  })
};
```

This completes the API integration guide. For additional help, consult the provider-specific documentation or reach out through the support channels.