import { MultiStepPrompt, StepExecutionResult, MultiStepExecutionResult } from './types';
import ApiService, { StreamingCallback } from './apiService';
import { substituteVariables } from './utils/templating';

export interface MultiStepStreamingCallback {
  onStepStart?: (stepName: string, stepIndex: number, totalSteps: number) => void;
  onStepToken?: (stepIndex: number, token: string) => void;
  onStepComplete?: (stepIndex: number, result: StepExecutionResult) => void;
  onComplete?: (result: MultiStepExecutionResult) => void;
  onError?: (error: string, stepIndex?: number) => void;
}

export class MultiStepService {
  private apiService: ApiService;

  constructor(apiService: ApiService) {
    this.apiService = apiService;
  }

  async executeMultiStepPrompt(
    multiStepPrompt: MultiStepPrompt,
    streaming?: MultiStepStreamingCallback
  ): Promise<MultiStepExecutionResult> {
    const startTime = Date.now();
    const results: StepExecutionResult[] = [];
    let accumulatedVariables: any = {};
    let firstPaintTime: number | undefined;

    try {
      // Parse global variables
      const globalVariables = JSON.parse(multiStepPrompt.globalVariables);
      accumulatedVariables = { ...globalVariables };

      // Sort steps by order
      const sortedSteps = [...multiStepPrompt.steps].sort((a, b) => a.order - b.order);

      // Execute each step
      for (let i = 0; i < sortedSteps.length; i++) {
        const step = sortedSteps[i];
        const stepStartTime = Date.now();

        streaming?.onStepStart?.(step.name, i + 1, sortedSteps.length);

        try {
          // Merge step variables with accumulated variables
          const stepVariables = JSON.parse(step.variables);
          const mergedVariables = { ...accumulatedVariables, ...stepVariables };

          // Substitute variables in the prompt
          const processedPrompt = substituteVariables(step.prompt, JSON.stringify(mergedVariables, null, 2));

          let stepOutput = '';
          let stepFirstByteTime: number | undefined;

          // Create streaming callback for this step
          const stepStreaming: StreamingCallback = {
            onToken: (token: string) => {
              stepOutput += token;
              // Capture first paint time when the last step starts painting
              if (i === sortedSteps.length - 1 && !firstPaintTime) {
                firstPaintTime = Date.now() - startTime;
              }
              streaming?.onStepToken?.(i, token);
            },
            onFirstByte: (firstByteTime: number) => {
              stepFirstByteTime = firstByteTime;
            },
            onComplete: (response) => {
              stepOutput = response.data || stepOutput;
            },
            onError: (error) => {
              throw new Error(error);
            }
          };

          // Execute the step
          await this.apiService.executePrompt(processedPrompt, stepStreaming);
          
          // Log the final prompt for debugging
          console.log(`Step ${i + 1} (${step.name}) - Final processed prompt:`, processedPrompt);

          const stepEndTime = Date.now();
          const stepExecutionTime = stepEndTime - stepStartTime;

          const stepResult: StepExecutionResult = {
            stepId: step.id,
            stepName: step.name,
            input: processedPrompt,
            output: stepOutput,
            executionTime: stepExecutionTime,
            firstByteTime: stepFirstByteTime,
          };

          results.push(stepResult);

          // Store step output in accumulated variables if outputVariable is specified
          if (step.outputVariable && stepOutput.trim()) {
            accumulatedVariables[step.outputVariable] = stepOutput.trim();
          }

          streaming?.onStepComplete?.(i, stepResult);

          // Check for early termination condition
          if (stepOutput.trim().toLowerCase().includes('all_requirements_met')) {
            const endTime = Date.now();
            const totalExecutionTime = endTime - startTime;
            const success = results.every(result => !result.error);
            const finalOutput = stepOutput;

            const multiStepResult: MultiStepExecutionResult = {
              multiStepPromptId: multiStepPrompt.id,
              results,
              totalExecutionTime,
              firstPaintTime,
              success,
              finalOutput,
              executedAt: startTime,
              terminatedEarly: true,
              terminationReason: 'All requirements met'
            };

            streaming?.onComplete?.(multiStepResult);
            return multiStepResult;
          }

        } catch (error) {
          const stepEndTime = Date.now();
          const stepExecutionTime = stepEndTime - stepStartTime;
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';

          const stepResult: StepExecutionResult = {
            stepId: step.id,
            stepName: step.name,
            input: step.prompt,
            output: '',
            executionTime: stepExecutionTime,
            error: errorMessage,
          };

          results.push(stepResult);
          streaming?.onError?.(errorMessage, i);
          
          // Decide whether to continue or stop on error
          // For now, we'll stop on the first error
          break;
        }
      }

      const endTime = Date.now();
      const totalExecutionTime = endTime - startTime;
      const success = results.every(result => !result.error);
      const finalOutput = results.length > 0 ? results[results.length - 1].output : '';

      const multiStepResult: MultiStepExecutionResult = {
        multiStepPromptId: multiStepPrompt.id,
        results,
        totalExecutionTime,
        firstPaintTime,
        success,
        finalOutput,
        executedAt: startTime,
        terminatedEarly: false,
      };

      streaming?.onComplete?.(multiStepResult);
      return multiStepResult;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      streaming?.onError?.(errorMessage);
      
      return {
        multiStepPromptId: multiStepPrompt.id,
        results,
        totalExecutionTime: Date.now() - startTime,
        firstPaintTime,
        success: false,
        finalOutput: '',
        executedAt: startTime,
        terminatedEarly: false,
      };
    }
  }

  // Helper method to validate multi-step prompt
  validateMultiStepPrompt(multiStepPrompt: MultiStepPrompt): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!multiStepPrompt.name.trim()) {
      errors.push('Multi-step prompt name is required');
    }

    if (!multiStepPrompt.steps || multiStepPrompt.steps.length === 0) {
      errors.push('At least one step is required');
    }

    if (multiStepPrompt.steps) {
      // Check for duplicate step orders
      const orders = multiStepPrompt.steps.map(step => step.order);
      const uniqueOrders = new Set(orders);
      if (orders.length !== uniqueOrders.size) {
        errors.push('Step orders must be unique');
      }

      // Check for gaps in step orders
      const sortedOrders = Array.from(uniqueOrders).sort((a, b) => a - b);
      for (let i = 0; i < sortedOrders.length - 1; i++) {
        if (sortedOrders[i + 1] - sortedOrders[i] > 1) {
          errors.push('Step orders should not have gaps');
        }
      }

      // Validate each step
      multiStepPrompt.steps.forEach((step, index) => {
        if (!step.name.trim()) {
          errors.push(`Step ${index + 1}: Name is required`);
        }
        if (!step.prompt.trim()) {
          errors.push(`Step ${index + 1}: Prompt is required`);
        }
        
        // Validate JSON variables
        try {
          JSON.parse(step.variables);
        } catch {
          errors.push(`Step ${index + 1}: Variables must be valid JSON`);
        }
      });
    }

    // Validate global variables JSON
    try {
      JSON.parse(multiStepPrompt.globalVariables);
    } catch {
      errors.push('Global variables must be valid JSON');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Helper method to create a new multi-step prompt template
  createMultiStepTemplate(): MultiStepPrompt {
    const now = Date.now();
    return {
      id: now.toString(),
      name: 'New Multi-Step Prompt',
      description: 'Description of the multi-step process',
      steps: [
        {
          id: `step-1-${now}`,
          name: 'Step 1',
          prompt: 'Your first prompt here. Use {{variable_name}} for variables.',
          variables: '{}',
          order: 1,
          outputVariable: 'step1_output'
        },
        {
          id: `step-2-${now}`,
          name: 'Step 2',
          prompt: 'Your second prompt here. You can use {{step1_output}} from the previous step.',
          variables: '{}',
          order: 2,
        }
      ],
      globalVariables: '{\n  "agent_info": {\n    "name": "Assistant",\n    "role": "AI Helper"\n  }\n}',
      createdAt: now,
      lastModified: now,
    };
  }
}