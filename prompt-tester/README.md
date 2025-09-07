# LLM Prompt Tester

A modern, feature-rich web application for testing and developing LLM prompts with real-time variable substitution and streaming responses.

## ✨ Features

### Core Functionality
- **Multi-Provider Support**: Works with OpenAI GPT models and Anthropic Claude
- **Real-time Streaming**: Watch responses appear word-by-word like ChatGPT/Claude
- **Variable Substitution**: Use `{{variable_name}}` syntax with JSON-based variables
- **Execution Timing**: Track response times for performance analysis

### User Interface
- **Modern Design**: Dark glassmorphism UI with smooth animations
- **Collapsible Sections**: Hide/show panels to focus on what matters
- **Resizable Panels**: Drag to resize the variables panel to your preference
- **Responsive Layout**: Works on different screen sizes

### Prompt Management
- **Save & Load**: Store multiple prompts with names and metadata
- **Auto-save**: Remembers your preferences and panel states
- **Template System**: Built-in email drafting assistant template
- **Export/Import**: Manage your prompt library

### Professional Use Cases
- **Email Assistant**: Pre-configured for professional email drafting
- **QA Workflows**: Perfect for testing prompts with different variables
- **Prompt Engineering**: Rapid iteration and testing environment
- **API Testing**: Compare responses across different models

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- npm or yarn
- API keys for OpenAI and/or Anthropic

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd prompt-tester
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` with your API keys:
   ```env
   REACT_APP_OPENAI_API_KEY=your_openai_key_here
   REACT_APP_ANTHROPIC_API_KEY=your_anthropic_key_here
   ```

4. **Start the development server**
   ```bash
   npm start
   ```

5. **Open in browser**
   Navigate to `http://localhost:3000`

### Deployment

**Vercel (Recommended)**
```bash
npm run build
vercel --prod
```

**Other Platforms**
```bash
npm run build
# Deploy the 'build' folder to your hosting provider
```

## 📖 Usage Guide

### Basic Workflow

1. **Configure Variables** (Left Panel)
   - Edit the JSON object with your test data
   - Use realistic data for better testing
   - Variables support strings, objects, and arrays

2. **Write Your Prompt** (Top Right)
   - Use `{{variable_name}}` syntax for dynamic content
   - Test different prompt variations
   - Save useful prompts for later

3. **Execute & Analyze** (Bottom)
   - Click "Execute" to run your prompt
   - Watch streaming responses in real-time
   - Review execution times and results

### Advanced Features

**Panel Management**
- Click ▼/▶ arrows to collapse/expand sections
- Drag the resize handle to adjust panel widths
- Your layout preferences are automatically saved

**Prompt Library**
- Click "📁 Prompts" to manage saved prompts
- Save current work with custom names
- Load previous prompts for iteration

**API Configuration**
- Click "⚙️ Settings" to configure providers
- Switch between OpenAI and Anthropic
- Select different models for comparison

## 🎯 Use Cases

### Email Assistant
Perfect for creating professional email responses:
```json
{
  "agent_info": {
    "name": "Your Name", 
    "role": "Your Role"
  },
  "email_thread": [
    {
      "from": "client@example.com",
      "to": "you@company.com",
      "content": "Email content here..."
    }
  ],
  "user_intent": "Respond professionally and confirm meeting"
}
```

### API Testing
Test different prompts with consistent data:
- Compare OpenAI vs Anthropic responses
- Measure response times across models
- A/B test prompt variations

### Prompt Engineering
Rapid development and iteration:
- Real-time variable substitution
- Save successful prompt variations
- Track what works best for your use case

## 🛠️ Technical Details

### Architecture
- **Frontend**: React 18 with TypeScript
- **Styling**: Modern CSS with glassmorphism effects
- **State**: React hooks with localStorage persistence
- **APIs**: Direct integration with OpenAI and Anthropic APIs

### Key Components
- `App.tsx` - Main application component
- `Settings.tsx` - API configuration modal
- `PromptManager.tsx` - Prompt library management
- `apiService.ts` - API abstraction layer

### Data Persistence
- **Prompts**: Stored in localStorage as JSON
- **Settings**: API keys and preferences in localStorage
- **UI State**: Panel sizes and collapsed states remembered

## 🔧 Configuration

### Environment Variables
```env
# API Keys
REACT_APP_OPENAI_API_KEY=sk-...
REACT_APP_ANTHROPIC_API_KEY=sk-ant-...

# Defaults (optional)
REACT_APP_DEFAULT_PROVIDER=openai
REACT_APP_DEFAULT_OPENAI_MODEL=gpt-4o
REACT_APP_DEFAULT_ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
```

### Model Support
**OpenAI Models**
- GPT-4 Turbo
- GPT-4o
- GPT-3.5 Turbo

**Anthropic Models** 
- Claude 3.5 Sonnet
- Claude 3 Haiku
- Claude 3 Opus

## 📝 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

- 🐛 **Issues**: Use GitHub Issues for bug reports
- 💡 **Features**: Submit feature requests via Issues
- 📧 **Contact**: [Your contact information]

---

Built with ❤️ for the LLM development community.