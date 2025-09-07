# User Guide

A comprehensive guide to using the LLM Prompt Tester effectively for various use cases and workflows.

## Getting Started

### First Launch
1. **Open the application** in your web browser
2. **Configure API credentials** via Settings (⚙️ button)
3. **Explore the interface** - three main panels for variables, prompts, and outputs
4. **Try the default email assistant** template to get familiar

### Interface Overview

```
┌─────────────────┬─────────────────────────────────┐
│   Variables     │        Prompt Template          │
│   (JSON)        │                                 │
│                 │  ┌─────────────────────────────┐ │
│                 │  │ 📁 Prompts  ⚙️ Settings    │ │
│                 │  │           Execute           │ │
│                 │  └─────────────────────────────┘ │
├─────────────────┼─────────────────┬───────────────┤
│                 │ Processed Prompt│ LLM Response  │
│                 │                 │               │
│                 │ JSON Payload    │               │
└─────────────────┴─────────────────┴───────────────┘
```

## Core Workflows

### 1. Basic Prompt Testing

**Step-by-step:**
1. **Edit Variables** (left panel)
   ```json
   {
     "name": "John Doe",
     "product": "AI Assistant",
     "feature": "voice commands"
   }
   ```

2. **Write Prompt** (top right)
   ```
   Write a product announcement for {{product}} 
   highlighting the new {{feature}} feature. 
   Address it to {{name}}.
   ```

3. **Execute** and review results
   - Watch streaming response in real-time
   - Check execution time
   - Review processed prompt for accuracy

### 2. Email Assistant Workflow

**Perfect for professional email responses:**

1. **Configure Agent Info**
   ```json
   {
     "agent_info": {
       "name": "Your Name",
       "role": "AI Leader"
     }
   }
   ```

2. **Add Email Thread**
   ```json
   {
     "email_thread": [
       {
         "from": "client@example.com",
         "to": "you@company.com", 
         "content": "Can we reschedule our meeting to next week?"
       }
     ]
   }
   ```

3. **Set Clear Intent**
   ```json
   {
     "user_intent": "Confirm rescheduling and propose 3 specific time slots"
   }
   ```

4. **Execute** and get professional email draft

### 3. A/B Testing Prompts

**Compare different prompt approaches:**

1. **Save Baseline Prompt**
   - Write your initial prompt
   - Click "📁 Prompts" → "Save As..." 
   - Name it "Baseline v1"

2. **Create Variations**
   - Modify prompt wording/structure
   - Save as "Variation A", "Variation B", etc.

3. **Test with Same Variables**
   - Keep variables consistent
   - Load each prompt version
   - Execute and compare responses

4. **Document Results**
   - Note execution times
   - Compare response quality
   - Save the best-performing version

## Advanced Features

### Panel Management

**Collapsible Sections**
- Click ▼/▶ arrows to hide/show panels
- Perfect for focused workflows:
  - **QA Testing**: Hide Variables + Prompt, show only Response
  - **Prompt Development**: Hide output panels while drafting
  - **Variable Testing**: Hide prompt while editing data

**Resizable Panels**
- Drag the resize handle between Variables and main content
- Expand Variables panel for complex JSON editing
- Your preferred size is remembered across sessions

### Prompt Library Management

**Saving Prompts**
1. Click "📁 Prompts" button
2. Select "Save As..." for new prompts
3. Click "Update" for existing prompts
4. Add descriptive names for easy identification

**Loading Prompts**
1. Open Prompt Manager
2. Click on any saved prompt to load
3. Variables and prompt text are restored
4. Unsaved changes indicator (●) shows modifications

**Best Practices**
- Use descriptive names: "Email Reply - Customer Support"
- Save successful prompt variations
- Include version numbers for iteration tracking
- Delete outdated or ineffective prompts

### Variable Management

**JSON Structure Best Practices**

✅ **Good Structure**
```json
{
  "user_context": {
    "name": "Sarah",
    "role": "Marketing Manager", 
    "company": "TechCorp"
  },
  "task_details": {
    "type": "product_launch",
    "timeline": "Q2 2024",
    "audience": "enterprise_customers"
  }
}
```

❌ **Avoid**
```json
{
  "name": "Sarah",
  "role": "Marketing Manager",
  "company": "TechCorp",
  "type": "product_launch"
  // Flat structure harder to manage
}
```

**Variable Substitution Tips**
- Use descriptive variable names: `{{customer_name}}` not `{{name}}`
- Group related variables in objects
- Test complex nested structures thoroughly
- Use arrays for lists: `{{features}}` → `["Feature A", "Feature B"]`

## Use Case Examples

### 1. Content Creation

**Blog Post Generation**
```json
{
  "topic": "sustainable technology",
  "audience": "tech executives",
  "tone": "professional but engaging",
  "length": "800-1000 words",
  "key_points": [
    "cost savings",
    "environmental impact",
    "competitive advantage"
  ]
}
```

**Prompt Template**
```
Write a {{length}} blog post about {{topic}} for {{audience}}. 
Use a {{tone}} tone and cover these key points: {{key_points}}.
Include actionable insights and real-world examples.
```

### 2. Customer Support

**Support Response Generation**
```json
{
  "customer": {
    "name": "Alex Chen",
    "tier": "enterprise",
    "issue_type": "billing_question"
  },
  "context": {
    "account_status": "active", 
    "last_payment": "2024-01-15",
    "support_history": "first_contact"
  },
  "resolution_steps": [
    "explain_billing_cycle",
    "provide_invoice_details", 
    "offer_payment_options"
  ]
}
```

### 3. Code Documentation

**API Documentation**
```json
{
  "endpoint": "/api/v1/users",
  "method": "POST",
  "purpose": "Create new user account",
  "parameters": [
    {"name": "email", "type": "string", "required": true},
    {"name": "password", "type": "string", "required": true},
    {"name": "role", "type": "string", "required": false}
  ],
  "responses": {
    "success": "201 Created",
    "error": "400 Bad Request"
  }
}
```

## Tips and Best Practices

### Prompt Engineering Tips

**Structure Your Prompts**
1. **Context**: Set the role and scenario
2. **Task**: Clearly define what you want
3. **Format**: Specify output format/style
4. **Examples**: Provide examples when helpful
5. **Constraints**: Add any limitations or requirements

**Example Structure**
```
You are a [ROLE] helping with [SCENARIO].

Task: [SPECIFIC REQUEST]

Format: [OUTPUT REQUIREMENTS]

Context: {{context_variables}}

Requirements:
- Constraint 1
- Constraint 2
```

### Variable Design Tips

**Make Variables Reusable**
- Design for multiple scenarios
- Use consistent naming conventions
- Include optional context fields
- Structure for easy modification

**Testing Strategy**
- Start with simple variables
- Add complexity gradually
- Test edge cases (empty values, long text)
- Validate JSON syntax regularly

### Performance Optimization

**Reduce Response Time**
- Use appropriate model for task complexity
- Optimize prompt length (shorter = faster)
- Batch similar requests
- Monitor execution times

**Improve Response Quality**
- Provide sufficient context
- Use specific rather than vague language
- Test with realistic data
- Iterate based on results

## Troubleshooting

### Common Issues

**Variables Not Substituting**
- Check JSON syntax in Variables panel
- Verify variable names match exactly: `{{variable_name}}`
- Look for typos in variable references
- Ensure proper quote marks in JSON

**API Errors**
- Verify API keys in Settings
- Check account credits/limits
- Try different model if current one fails
- Check internet connectivity

**Streaming Not Working**
- Refresh browser if stream stalls
- Check for browser compatibility
- Disable browser extensions that block content
- Try standard (non-streaming) request

**UI Issues**
- Clear browser cache and localStorage
- Try different browser
- Check for JavaScript errors in console
- Ensure browser supports modern features

### Getting Help

**Self-Diagnosis**
1. Check browser console for errors
2. Verify API configuration
3. Test with simple variables/prompt
4. Try default email template

**Documentation**
- API Guide for integration issues
- README for setup problems
- GitHub Issues for bug reports

## Keyboard Shortcuts

- **Ctrl/Cmd + Enter**: Execute prompt
- **Ctrl/Cmd + S**: Save current prompt (if modified)
- **Ctrl/Cmd + ,**: Open Settings
- **Esc**: Close modal dialogs

## Data Privacy

**Local Storage**
- All data stored locally in your browser
- Prompts, variables, and settings never leave your device
- API keys encrypted in localStorage
- No telemetry or usage tracking

**API Communication**
- Direct communication with OpenAI/Anthropic
- No data passes through our servers
- Follow provider privacy policies
- Your prompts/responses remain private

---

This user guide covers the essential workflows and features. For technical details, see the API Guide, and for development information, check the README.