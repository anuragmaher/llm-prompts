import React, { useState, useCallback } from 'react';
import EvaluationService, { OverallEvaluation, EvaluationConfig } from './evaluationService';
import { ApiConfig } from './Settings';

interface EvaluationPanelProps {
  variables: string;
  llmResponse: string;
  apiConfig: ApiConfig;
  evaluationConfig: EvaluationConfig;
  onEvaluationComplete: (evaluation: OverallEvaluation) => void;
}

interface SavedEvaluation extends OverallEvaluation {
  promptHash: string;
  responseHash: string;
}

const EvaluationPanel: React.FC<EvaluationPanelProps> = ({
  variables,
  llmResponse,
  apiConfig,
  evaluationConfig,
  onEvaluationComplete
}) => {
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [currentEvaluation, setCurrentEvaluation] = useState<OverallEvaluation | null>(null);
  const [evaluationError, setEvaluationError] = useState<string | null>(null);
  const [evaluationService] = useState(() => new EvaluationService(apiConfig));

  // Update service configurations when props change
  React.useEffect(() => {
    evaluationService.updateConfig(apiConfig);
    evaluationService.updateEvaluationConfig(evaluationConfig);
  }, [apiConfig, evaluationConfig, evaluationService]);

  const canEvaluate = useCallback(() => {
    if (!llmResponse || llmResponse.trim() === '' || llmResponse === 'The AI response will appear here after execution.') {
      return false;
    }
    const validation = evaluationService.validateEvaluationConfig();
    return validation.isValid;
  }, [llmResponse, evaluationService]);

  const getValidationErrors = useCallback(() => {
    const validation = evaluationService.validateEvaluationConfig();
    return validation.errors;
  }, [evaluationService]);

  const handleEvaluate = useCallback(async () => {
    if (!canEvaluate()) return;

    setIsEvaluating(true);
    setEvaluationError(null);

    try {
      const evaluation = await evaluationService.evaluateResponse(variables, llmResponse);
      setCurrentEvaluation(evaluation);
      onEvaluationComplete(evaluation);

      // Save evaluation to localStorage
      const savedEvaluations = JSON.parse(localStorage.getItem('llm-evaluations') || '[]');
      
      // Create hash function that works with Unicode characters
      const createHash = (str: string): string => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
          const char = str.charCodeAt(i);
          hash = ((hash << 5) - hash) + char;
          hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash).toString(16).slice(0, 16);
      };
      
      const evaluationWithHashes: SavedEvaluation = {
        ...evaluation,
        promptHash: createHash(variables),
        responseHash: createHash(llmResponse)
      };
      savedEvaluations.unshift(evaluationWithHashes);
      
      // Keep only last 50 evaluations
      if (savedEvaluations.length > 50) {
        savedEvaluations.splice(50);
      }
      
      localStorage.setItem('llm-evaluations', JSON.stringify(savedEvaluations));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred during evaluation';
      setEvaluationError(errorMessage);
    } finally {
      setIsEvaluating(false);
    }
  }, [canEvaluate, variables, llmResponse, evaluationService, onEvaluationComplete]);

  const getScoreColor = (score: number): string => {
    if (score >= 8) return '#22c55e'; // green
    if (score >= 6) return '#eab308'; // yellow
    if (score >= 4) return '#f97316'; // orange
    return '#ef4444'; // red
  };

  const getOverallScoreLabel = (score: number): string => {
    if (score >= 9) return 'Excellent';
    if (score >= 8) return 'Very Good';
    if (score >= 7) return 'Good';
    if (score >= 6) return 'Fair';
    if (score >= 4) return 'Poor';
    return 'Very Poor';
  };

  return (
    <div className="evaluation-panel">
      <div className="evaluation-header">
        <h3>🧠 LLM Evaluation</h3>
        <button
          className="evaluate-btn"
          onClick={handleEvaluate}
          disabled={!canEvaluate() || isEvaluating}
        >
          {isEvaluating ? 'Evaluating...' : '🔍 Evaluate Response'}
        </button>
      </div>

      {!canEvaluate() && (
        <div className="evaluation-status">
          {!llmResponse || llmResponse.trim() === '' || llmResponse === 'The AI response will appear here after execution.' ? (
            <p className="status-message">
              📋 Generate an LLM response first to enable evaluation
            </p>
          ) : (
            <div className="validation-errors">
              <p className="error-title">⚠️ Configuration Issues:</p>
              <ul className="error-list">
                {getValidationErrors().map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {evaluationError && (
        <div className="evaluation-error">
          <strong>❌ Evaluation Failed:</strong>
          <p>{evaluationError}</p>
        </div>
      )}

      {currentEvaluation && (
        <div className="evaluation-results">
          <div className="overall-score">
            <div className="score-header">
              <h4>Overall Score</h4>
              <div 
                className="score-badge"
                style={{ backgroundColor: getScoreColor(currentEvaluation.overallScore) }}
              >
                {currentEvaluation.overallScore}/10
              </div>
            </div>
            <p className="score-label">{getOverallScoreLabel(currentEvaluation.overallScore)}</p>
          </div>

          <div className="criteria-scores">
            <h4>Detailed Scores</h4>
            {currentEvaluation.results.map((result, index) => (
              <div key={index} className="score-item">
                <div className="score-item-header">
                  <span className="criteria-name">{result.criteriaName}</span>
                  <span 
                    className="score-value"
                    style={{ color: getScoreColor(result.score) }}
                  >
                    {result.score}/10
                  </span>
                </div>
                <p className="score-explanation">{result.explanation}</p>
              </div>
            ))}
          </div>

          <div className="evaluation-feedback">
            <h4>💡 Feedback & Suggestions</h4>
            <p className="feedback-text">{currentEvaluation.feedback}</p>
          </div>

          <div className="evaluation-meta">
            <small className="evaluation-timestamp">
              Evaluated on {new Date(currentEvaluation.timestamp).toLocaleString()}
            </small>
          </div>
        </div>
      )}

      <div className="evaluation-info">
        <p className="info-text">
          💡 Evaluation analyzes response quality based on your configured criteria using {evaluationConfig.judgeModel}
        </p>
      </div>
    </div>
  );
};

export default EvaluationPanel;