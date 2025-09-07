import React, { useState, useCallback, useEffect } from 'react';
import './App.css';
import Settings, { ApiConfig } from './Settings';
import ApiService, { StreamingCallback } from './apiService';
import PromptManager from './PromptManager';
import VariableManager from './VariableManager';
import EvaluationPanel from './EvaluationPanel';
import { EvaluationConfig, OverallEvaluation } from './evaluationService';

// Predefined variable sets for first-time users
const getPredefinedVariableSets = (): SavedVariableSet[] => {
  const baseTimestamp = Date.now();
  return [
    {
      id: 'meeting-reschedule',
      name: 'Meeting Reschedule Request',
      variables: JSON.stringify({
        "agent_info": {
          "name": "Sarah Chen",
          "email": "sarah.chen@techcorp.com",
          "role": "Product Manager"
        },
        "email_thread": [
          {
            "from": "Michael Rodriguez <michael.r@clientfirm.com>",
            "to": "Sarah Chen <sarah.chen@techcorp.com>",
            "content": "Hi Sarah, I need to reschedule our product demo meeting scheduled for Thursday 2pm. Something urgent came up. Can we move it to next week?"
          }
        ],
        "chat_history": "Client has been very engaged in our product discussions and this is a high-priority demo for Q1 closing.",
        "user_intent": "Accommodate the reschedule request professionally and propose 3 specific time slots next week"
      }, null, 2),
      createdAt: baseTimestamp - 600000,
      lastModified: baseTimestamp - 600000
    },
    {
      id: 'project-status',
      name: 'Project Status Update',
      variables: JSON.stringify({
        "agent_info": {
          "name": "David Park",
          "email": "david.park@devstudio.com", 
          "role": "Engineering Lead"
        },
        "email_thread": [
          {
            "from": "Lisa Thompson <lisa.t@startup.io>",
            "to": "David Park <david.park@devstudio.com>",
            "content": "Hey David, haven't heard updates on the mobile app development in a while. How are we tracking against the March 15th deadline? Any blockers I should know about?"
          }
        ],
        "chat_history": "Project is 85% complete, slightly behind due to API integration challenges, but still on track for deadline.",
        "user_intent": "Provide honest status update with timeline reassurance and mention one current blocker"
      }, null, 2),
      createdAt: baseTimestamp - 540000,
      lastModified: baseTimestamp - 540000
    },
    {
      id: 'budget-approval',
      name: 'Budget Approval Request',
      variables: JSON.stringify({
        "agent_info": {
          "name": "Jennifer Walsh",
          "email": "j.walsh@marketingplus.com",
          "role": "Marketing Director"
        },
        "email_thread": [
          {
            "from": "Robert Kim <robert.kim@headquarters.com>",
            "to": "Jennifer Walsh <j.walsh@marketingplus.com>",
            "content": "Jennifer, I received your budget proposal for the Q2 campaign. The numbers seem high - can you break down the $75K request and justify the ROI projections?"
          }
        ],
        "chat_history": "Budget includes $30K for paid ads, $25K for content creation, $20K for events - all backed by historical performance data.",
        "user_intent": "Provide detailed budget breakdown with ROI justification and offer to schedule a call for discussion"
      }, null, 2),
      createdAt: baseTimestamp - 480000,
      lastModified: baseTimestamp - 480000
    },
    {
      id: 'customer-complaint',
      name: 'Customer Complaint Resolution',
      variables: JSON.stringify({
        "agent_info": {
          "name": "Amanda Foster",
          "email": "amanda.foster@customercare.com",
          "role": "Customer Success Manager"
        },
        "email_thread": [
          {
            "from": "Angry Customer <john.davis@businessclient.com>",
            "to": "Amanda Foster <amanda.foster@customercare.com>",
            "content": "This is unacceptable! Your software crashed during our live presentation to investors. We lost a potential $2M deal because of this. I want immediate answers and compensation!"
          }
        ],
        "chat_history": "Incident occurred during high-traffic period, technical team identified root cause as server overload, fix deployed.",
        "user_intent": "Apologize sincerely, explain root cause, offer compensation, and outline prevention measures"
      }, null, 2),
      createdAt: baseTimestamp - 420000,
      lastModified: baseTimestamp - 420000
    },
    {
      id: 'job-interview',
      name: 'Job Interview Scheduling',
      variables: JSON.stringify({
        "agent_info": {
          "name": "Marcus Johnson",
          "email": "marcus.johnson@hiringfirm.com",
          "role": "HR Business Partner"
        },
        "email_thread": [
          {
            "from": "Emma Wilson <emma.wilson.dev@gmail.com>",
            "to": "Marcus Johnson <marcus.johnson@hiringfirm.com>",
            "content": "Hi Marcus, thank you for considering my application for the Senior React Developer position. I'm excited about the opportunity and available for interviews next week."
          }
        ],
        "chat_history": "Candidate has strong background, passed initial screening, ready for technical interview with engineering team.",
        "user_intent": "Schedule technical interview, explain interview process, and set expectations for next steps"
      }, null, 2),
      createdAt: baseTimestamp - 360000,
      lastModified: baseTimestamp - 360000
    },
    {
      id: 'partnership-proposal',
      name: 'Partnership Proposal Follow-up',
      variables: JSON.stringify({
        "agent_info": {
          "name": "Rachel Green",
          "email": "rachel.green@bizdev.com",
          "role": "Business Development Director"
        },
        "email_thread": [
          {
            "from": "Tom Anderson <t.anderson@partnertech.com>",
            "to": "Rachel Green <rachel.green@bizdev.com>",
            "content": "Rachel, we've reviewed your partnership proposal internally. The terms look interesting but we have some concerns about the revenue sharing model. Can we discuss modifications?"
          }
        ],
        "chat_history": "Initial proposal was 60/40 split, they want to negotiate to 70/30, we have some flexibility but need to maintain minimum margins.",
        "user_intent": "Show flexibility on terms while protecting key business interests and suggest a meeting to discuss details"
      }, null, 2),
      createdAt: baseTimestamp - 300000,
      lastModified: baseTimestamp - 300000
    },
    {
      id: 'event-planning',
      name: 'Event Planning Coordination',
      variables: JSON.stringify({
        "agent_info": {
          "name": "Alex Rodriguez",
          "email": "alex.rodriguez@eventspro.com",
          "role": "Event Coordinator"
        },
        "email_thread": [
          {
            "from": "Corporate Client <events@bigcorp.com>",
            "to": "Alex Rodriguez <alex.rodriguez@eventspro.com>",
            "content": "Alex, we need to finalize details for the annual conference next month. 500 attendees confirmed. Need updates on catering, AV setup, and speaker arrangements."
          }
        ],
        "chat_history": "Catering confirmed for 500+50 buffer, AV team scheduled for setup day before, 2 keynote speakers confirmed, 1 still pending.",
        "user_intent": "Provide comprehensive status update on all event elements and request final headcount confirmation"
      }, null, 2),
      createdAt: baseTimestamp - 240000,
      lastModified: baseTimestamp - 240000
    },
    {
      id: 'vendor-negotiation',
      name: 'Vendor Negotiation',
      variables: JSON.stringify({
        "agent_info": {
          "name": "Kevin Liu",
          "email": "kevin.liu@procurement.com",
          "role": "Procurement Manager"
        },
        "email_thread": [
          {
            "from": "Supplier Rep <sales@supplierco.com>",
            "to": "Kevin Liu <kevin.liu@procurement.com>",
            "content": "Kevin, we've prepared a new quote based on your volume requirements. The pricing is $12 per unit for 10K units, with 30-day payment terms. This is our best offer."
          }
        ],
        "chat_history": "Market rate is $10-11 per unit, we need 15-day payment terms to match cash flow, relationship is important for future orders.",
        "user_intent": "Negotiate price down to $10.50 per unit and request 15-day payment terms while maintaining positive relationship"
      }, null, 2),
      createdAt: baseTimestamp - 180000,
      lastModified: baseTimestamp - 180000
    },
    {
      id: 'product-launch',
      name: 'Product Launch Announcement',
      variables: JSON.stringify({
        "agent_info": {
          "name": "Priya Patel",
          "email": "priya.patel@innovation.com",
          "role": "Product Marketing Manager"
        },
        "email_thread": [
          {
            "from": "Industry Reporter <news@techdaily.com>",
            "to": "Priya Patel <priya.patel@innovation.com>",
            "content": "Hi Priya, heard rumors about your new AI-powered analytics platform launching next month. Can you share any details for our upcoming feature story on emerging business intelligence tools?"
          }
        ],
        "chat_history": "Launch is March 1st, key features include real-time analytics, predictive modeling, and 50% faster processing than competitors.",
        "user_intent": "Share exciting product details while maintaining some mystery and offer exclusive interview opportunity"
      }, null, 2),
      createdAt: baseTimestamp - 120000,
      lastModified: baseTimestamp - 120000
    },
    {
      id: 'crisis-communication',
      name: 'Crisis Communication',
      variables: JSON.stringify({
        "agent_info": {
          "name": "Victoria Chang",
          "email": "victoria.chang@corpcomms.com",
          "role": "Communications Director"
        },
        "email_thread": [
          {
            "from": "Board Member <james.wilson@boardmember.com>",
            "to": "Victoria Chang <victoria.chang@corpcomms.com>",
            "content": "Victoria, the data breach news is spreading on social media. We need a clear communication strategy before the press picks this up. What's our response plan?"
          }
        ],
        "chat_history": "Breach affected 1,000 users, no financial data compromised, security team contained it within 2 hours, all users notified.",
        "user_intent": "Present clear crisis communication plan focusing on transparency, user safety, and steps taken to prevent future incidents"
      }, null, 2),
      createdAt: baseTimestamp - 60000,
      lastModified: baseTimestamp - 60000
    }
  ];
};

interface SavedPrompt {
  id: string;
  name: string;
  prompt: string;
  variables: string; // JSON string
  createdAt: number;
  lastModified: number;
}

interface SavedVariableSet {
  id: string;
  name: string;
  variables: string; // JSON string
  createdAt: number;
  lastModified: number;
}

function App() {
  const [variables, setVariables] = useState<string>(JSON.stringify({
    "agent_info": {
      "name": "Anurag Maherchandani",
      "email": "anurag@grexit.com",
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
  }, null, 2));
  const [prompt, setPrompt] = useState<string>('You are a helpful and precise email drafting assistant in a productivity copilot.\n\nYou will be given the following variables (injected at runtime):\n\n1. agent_info: {{agent_info}}\n   - Type: JSON object with agent details\n   - Contains: "name", "email", "role" fields\n   - Use this to sign emails and provide context about the sender\n\n2. email_thread: {{email_thread}}\n   - Type: a JSON array (list) of up to 3 email messages\n   - Each message is an object with keys: "from", "to", "content"\n   - Example: [{"from":"Sarah Johnson <sarah@example.com>","to":"Agent <agent@example.com>","content":"Hi..."}]\n\n3. chat_history: "{{chat_history}}"\n   - Type: string\n   - Previous conversation context that may provide additional details for the email draft (optional)\n\n4. user_intent: "{{user_intent}}"\n   - Type: string\n   - A clear purpose and tone for the reply (e.g., "Confirm the meeting time politely and express enthusiasm")\n\n---\n\n### VALIDATION CONDITIONS\n\n1. User Intent must be clear:\n   - It must specify the purpose or goal of the reply\n   - If intent is vague, missing, or ambiguous, respond with JSON exception below\n\n2. Chat History is optional:\n   - Can be empty, brief, or contain meaningful context\n   - Will be used if provided to enhance the email draft\n\n---\n\n### OUTPUT INSTRUCTIONS\n\n- If `user_intent` passes validation:\n    - Generate a concise, professional email draft using all provided variables\n    - Sign the email with the agent name from `agent_info`\n    - Return only the email draft text (no extra metadata)\n\n- If validation fails:\n    - Return exactly one JSON object (no extra text):\n\nIf user_intent invalid:\n```json\n{"error": true, "reason": "User intent is missing or unclear."}\n```\n\n');
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
    setPrompt('Enter your prompt here. Use {{variable_name}} syntax for variables.\n\nExample:\n- Use {{email_thread}} for email data\n- Use {{user_intent}} for instructions\n- Use {{context}} for additional information');
    setVariables('{\n  "email_thread": [\n    {\n      "from": "sender@example.com",\n      "to": "you@example.com",\n      "content": "Email content here"\n    }\n  ],\n  "user_intent": "Your instruction here",\n  "context": "Additional context"\n}');
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
    setVariables('{\n  "email_thread": [\n    {\n      "from": "sender@example.com",\n      "to": "you@example.com",\n      "content": "Email content here"\n    }\n  ],\n  "user_intent": "Your instruction here",\n  "context": "Additional context"\n}');
    setCurrentVariableSetId(null);
    setProcessedPrompt('');
    setLlmResponse('');
  }, []);

  // Detect if current prompt has unsaved changes
  const hasUnsavedChanges = useCallback(() => {
    const defaultTemplate = 'Enter your prompt here. Use {{variable_name}} syntax for variables.\n\nExample:\n- Use {{email_thread}} for email data\n- Use {{user_intent}} for instructions\n- Use {{context}} for additional information';
    const defaultVars = '{\n  "email_thread": [\n    {\n      "from": "sender@example.com",\n      "to": "you@example.com",\n      "content": "Email content here"\n    }\n  ],\n  "user_intent": "Your instruction here",\n  "context": "Additional context"\n}';
    
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
        "email": "anurag@grexit.com",
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
    try {
      const variableData = JSON.parse(variables);
      let result = text;
      
      Object.entries(variableData).forEach(([key, value]) => {
        const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
        // Convert value to appropriate string representation
        const stringValue = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
        result = result.replace(regex, stringValue);
      });
      
      return result;
    } catch (error) {
      return text + '\n\n[ERROR: Invalid JSON in variables]';
    }
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
        <div className="panel-header">
          <span>Variables (JSON) {hasUnsavedVariableChanges() && '●'}</span>
          <div className="header-actions">
            <button 
              className="variable-manager-btn"
              onClick={() => setShowVariableManager(true)}
            >
              📊 Variables
            </button>
            <button 
              className="collapse-btn"
              onClick={() => toggleSection('variables')}
              title={collapsedSections.variables ? 'Expand Variables' : 'Collapse Variables'}
            >
              {collapsedSections.variables ? '▶' : '▼'}
            </button>
          </div>
        </div>
        {!collapsedSections.variables && (
        <div className="panel-content">
          <div className="json-editor-container">
            <textarea
              className="json-editor"
              value={variables}
              onChange={(e) => setVariables(e.target.value)}
              placeholder='{\n  "variable_name": "value",\n  "array_example": ["item1", "item2"],\n  "object_example": {\n    "nested": "value"\n  }\n}'
            />
            <div className="json-validation">
              {(() => {
                try {
                  JSON.parse(variables);
                  return <span className="json-valid">✓ Valid JSON</span>;
                } catch (error) {
                  return <span className="json-invalid">⚠ Invalid JSON: {(error as Error).message}</span>;
                }
              })()}
            </div>
          </div>
        </div>
        )}
      </div>

      {!collapsedSections.variables && (
        <div 
          className="resize-handle"
          onMouseDown={handleMouseDown}
        />
      )}

      <div className="right-panel">
        <div className={`prompt-panel ${collapsedSections.prompt ? 'collapsed' : ''}`}>
          <div className="panel-header">
            <span>Prompt Template</span>
            <div className="header-actions">
              <button 
                className="collapse-btn"
                onClick={() => toggleSection('prompt')}
                title={collapsedSections.prompt ? 'Expand Prompt' : 'Collapse Prompt'}
              >
                {collapsedSections.prompt ? '▶' : '▼'}
              </button>
              <button 
                className="prompt-manager-btn"
                onClick={() => setShowPromptManager(true)}
              >
                📁 Prompts {hasUnsavedChanges() && '●'}
              </button>
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
          </div>
          {!collapsedSections.prompt && (
          <div className="panel-content">
            <textarea
              className="prompt-textarea"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter your prompt template here. Use {{variableName}} syntax for variables."
            />
          </div>
          )}
        </div>

        <div className="output-panel">
          <div className="output-left">
            <div className={`output-left-top ${collapsedSections.processedPrompt ? 'collapsed' : ''}`}>
              <div className="panel-header">
                <span>Processed Prompt</span>
                <button 
                  className="collapse-btn"
                  onClick={() => toggleSection('processedPrompt')}
                  title={collapsedSections.processedPrompt ? 'Expand Processed Prompt' : 'Collapse Processed Prompt'}
                >
                  {collapsedSections.processedPrompt ? '▶' : '▼'}
                </button>
              </div>
              {!collapsedSections.processedPrompt && (
              <div className="output-content prompt-output">
                {processedPrompt || 'Click "Execute" to see your prompt with variables substituted.'}
              </div>
              )}
            </div>
            <div className={`output-left-bottom ${collapsedSections.jsonPayload ? 'collapsed' : ''}`}>
              <div className="panel-header">
                <span>JSON Payload</span>
                <button 
                  className="collapse-btn"
                  onClick={() => toggleSection('jsonPayload')}
                  title={collapsedSections.jsonPayload ? 'Expand JSON Payload' : 'Collapse JSON Payload'}
                >
                  {collapsedSections.jsonPayload ? '▶' : '▼'}
                </button>
              </div>
              {!collapsedSections.jsonPayload && (
              <div className="output-content json-payload">
                {(() => {
                  try {
                    const parsedVars = JSON.parse(variables);
                    return JSON.stringify(parsedVars, null, 2);
                  } catch (error) {
                    return 'Invalid JSON - fix variables to see payload';
                  }
                })()}
              </div>
              )}
            </div>
          </div>
          <div className="output-right-container">
            <div className={`output-right ${collapsedSections.llmResponse ? 'collapsed' : ''}`}>
              <div className="panel-header">
                <span>LLM Response</span>
                <button 
                  className="collapse-btn"
                  onClick={() => toggleSection('llmResponse')}
                  title={collapsedSections.llmResponse ? 'Expand LLM Response' : 'Collapse LLM Response'}
                >
                  {collapsedSections.llmResponse ? '▶' : '▼'}
                </button>
              </div>
              {!collapsedSections.llmResponse && (
              <div className="output-content response-output">
                {llmResponse || 'The AI response will appear here after execution.'}
              </div>
              )}
            </div>
            
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
    </div>
  );
}

export default App;
