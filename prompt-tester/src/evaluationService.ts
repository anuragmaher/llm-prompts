import { ApiConfig } from './Settings';

export interface EvaluationCriteria {
  name: string;
  description: string;
  weight: number; // 1-10 scale
  enabled: boolean;
}

export interface EvaluationResult {
  criteriaName: string;
  score: number; // 1-10 scale
  explanation: string;
}

export interface OverallEvaluation {
  overallScore: number; // weighted average
  results: EvaluationResult[];
  feedback: string;
  timestamp: number;
  evaluationId: string;
}

export interface EvaluationConfig {
  criteria: EvaluationCriteria[];
  judgeModel: 'gpt-4o' | 'gpt-4-turbo' | 'gpt-3.5-turbo';
  temperature: number;
}

const DEFAULT_CRITERIA: EvaluationCriteria[] = [
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
];

class EvaluationService {
  private config: ApiConfig;
  private evaluationConfig: EvaluationConfig;

  constructor(config: ApiConfig) {
    this.config = config;
    this.evaluationConfig = {
      criteria: DEFAULT_CRITERIA,
      judgeModel: 'gpt-4o',
      temperature: 0.2
    };
  }

  updateConfig(config: ApiConfig) {
    this.config = config;
  }

  updateEvaluationConfig(evaluationConfig: EvaluationConfig) {
    this.evaluationConfig = evaluationConfig;
  }

  getDefaultCriteria(): EvaluationCriteria[] {
    return DEFAULT_CRITERIA;
  }

  private buildJudgePrompt(
    originalVariables: string,
    llmResponse: string,
    criteria: EvaluationCriteria[]
  ): string {
    const enabledCriteria = criteria.filter(c => c.enabled);
    
    const criteriaDescription = enabledCriteria
      .map(c => `- **${c.name}** (Weight: ${c.weight}/10): ${c.description}`)
      .join('\n');

    return `You are an expert LLM response evaluator. Your task is to objectively assess the quality of an LLM-generated response based on specific criteria.

## EVALUATION CONTEXT

**Original Variables/Input:**
${originalVariables}

**LLM Response to Evaluate:**
${llmResponse}

## EVALUATION CRITERIA
${criteriaDescription}

## INSTRUCTIONS

1. Evaluate the LLM response against each criterion listed above
2. Assign a score from 1-10 for each criterion (1 = very poor, 10 = excellent)
3. Provide a brief explanation (1-2 sentences) for each score
4. Give overall feedback and suggestions for improvement

## REQUIRED OUTPUT FORMAT (JSON ONLY)

\`\`\`json
{
  "results": [
    {
      "criteriaName": "Relevance",
      "score": 8,
      "explanation": "Response directly addresses the user's request with relevant information."
    },
    {
      "criteriaName": "Accuracy",
      "score": 9,
      "explanation": "Information provided appears factually correct and reliable."
    }
  ],
  "feedback": "Overall assessment and specific suggestions for improvement",
  "confidence": 8.5
}
\`\`\`

Evaluate objectively and provide constructive feedback that helps improve the response quality.`;
  }

  async evaluateResponse(
    originalVariables: string,
    llmResponse: string,
    criteria?: EvaluationCriteria[]
  ): Promise<OverallEvaluation> {
    const evaluationCriteria = criteria || this.evaluationConfig.criteria;
    const enabledCriteria = evaluationCriteria.filter(c => c.enabled);

    if (!this.config.openaiKey) {
      throw new Error('OpenAI API key is required for evaluation. Please configure it in Settings.');
    }

    const judgePrompt = this.buildJudgePrompt(originalVariables, llmResponse, enabledCriteria);

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.openaiKey}`
        },
        body: JSON.stringify({
          model: this.evaluationConfig.judgeModel,
          messages: [
            {
              role: 'user',
              content: judgePrompt
            }
          ],
          max_tokens: 1500,
          temperature: this.evaluationConfig.temperature,
          response_format: { type: "json_object" }
        })
      });

      if (!response.ok) {
        throw new Error(`Evaluation API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const evaluationText = data.choices[0].message.content;

      // Parse the JSON response
      const parsedEvaluation = JSON.parse(evaluationText);

      // Calculate weighted overall score
      const totalWeight = enabledCriteria.reduce((sum, criterion) => sum + criterion.weight, 0);
      const weightedScore = parsedEvaluation.results.reduce((sum: number, result: EvaluationResult) => {
        const criterion = enabledCriteria.find(c => c.name === result.criteriaName);
        const weight = criterion ? criterion.weight : 1;
        return sum + (result.score * weight);
      }, 0);

      const overallScore = Math.round((weightedScore / totalWeight) * 10) / 10;

      return {
        overallScore,
        results: parsedEvaluation.results,
        feedback: parsedEvaluation.feedback,
        timestamp: Date.now(),
        evaluationId: `eval_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };

    } catch (error) {
      throw new Error(`Evaluation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  validateEvaluationConfig(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!this.config.openaiKey) {
      errors.push('OpenAI API key is required for evaluation');
    } else if (!this.config.openaiKey.startsWith('sk-')) {
      errors.push('OpenAI API key should start with "sk-"');
    }

    const enabledCriteria = this.evaluationConfig.criteria.filter(c => c.enabled);
    if (enabledCriteria.length === 0) {
      errors.push('At least one evaluation criterion must be enabled');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export default EvaluationService;