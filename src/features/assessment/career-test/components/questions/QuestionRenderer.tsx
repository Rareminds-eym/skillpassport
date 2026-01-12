/**
 * QuestionRenderer Component
 * 
 * Routes to the appropriate question component based on question type.
 * Acts as a factory for different question types.
 * 
 * @module features/assessment/career-test/components/questions/QuestionRenderer
 */

import React from 'react';
import { LikertQuestion } from './LikertQuestion';
import { MCQQuestion } from './MCQQuestion';
import { SJTQuestion } from './SJTQuestion';
import { AdaptiveQuestion } from './AdaptiveQuestion';
import { MultiSelectQuestion } from './MultiSelectQuestion';

interface ResponseScaleItem {
  value: number;
  label: string;
}

interface Question {
  id: string;
  text: string;
  type?: string;
  subtype?: string;
  partType?: string;
  options?: string[] | Record<string, string>;
  correct?: string;
  scenario?: string;
  optionLabels?: string[];
  moduleTitle?: string;
  maxSelections?: number;
  placeholder?: string;
}

interface QuestionRendererProps {
  question: Question;
  questionId: string;
  sectionId: string;
  answer: any;
  onAnswer: (value: any) => void;
  responseScale?: ResponseScaleItem[];
  isAdaptive?: boolean;
  adaptiveTimer?: number;
  adaptiveDifficulty?: number;
  adaptiveLoading?: boolean;
  color?: string;
}

/**
 * Determines the question type and renders the appropriate component
 */
export const QuestionRenderer: React.FC<QuestionRendererProps> = ({
  question,
  questionId,
  sectionId,
  answer,
  onAnswer,
  responseScale,
  isAdaptive = false,
  adaptiveTimer = 90,
  adaptiveDifficulty = 3,
  adaptiveLoading = false,
  color = 'indigo'
}) => {
  // Adaptive Aptitude Questions
  if (isAdaptive) {
    return (
      <AdaptiveQuestion
        questionId={questionId}
        questionText={question.text}
        options={question.options as Record<string, string>}
        selectedAnswer={answer}
        onAnswer={onAnswer}
        difficultyLevel={adaptiveDifficulty}
        subtag={question.subtype}
        timer={adaptiveTimer}
        loading={adaptiveLoading}
      />
    );
  }

  // SJT Questions (Situational Judgment Test)
  if (question.partType === 'sjt') {
    return (
      <SJTQuestion
        questionId={questionId}
        questionText={question.text}
        scenario={question.scenario}
        options={question.options as string[]}
        optionLabels={question.optionLabels}
        selectedAnswer={answer}
        onAnswer={onAnswer}
      />
    );
  }

  // MultiSelect Questions (pick multiple options)
  if (question.type === 'multiselect' && question.maxSelections && question.maxSelections > 1) {
    return (
      <MultiSelectQuestion
        questionId={questionId}
        questionText={question.text}
        options={question.options as string[]}
        selectedAnswers={Array.isArray(answer) ? answer : []}
        onAnswer={onAnswer}
        maxSelections={question.maxSelections}
        moduleTitle={question.moduleTitle}
        subtype={question.subtype}
      />
    );
  }

  // Likert Scale Questions (when responseScale is provided)
  if (responseScale && responseScale.length > 0) {
    return (
      <LikertQuestion
        questionId={questionId}
        questionText={question.text}
        responseScale={responseScale}
        selectedValue={answer}
        onAnswer={onAnswer}
        color={color}
      />
    );
  }

  // MCQ Questions (Aptitude, Knowledge, or any with options)
  if (question.options && Array.isArray(question.options)) {
    return (
      <MCQQuestion
        questionId={questionId}
        questionText={question.text}
        options={question.options}
        selectedAnswer={answer}
        onAnswer={onAnswer}
        moduleTitle={question.moduleTitle}
        subtype={question.subtype}
      />
    );
  }

  // Fallback: Simple text display
  return (
    <div className="space-y-4">
      <h3 className="text-xl md:text-2xl font-medium text-gray-800 leading-snug">
        {question.text}
      </h3>
      <p className="text-gray-500 text-sm">
        Question type not recognized. Please contact support.
      </p>
    </div>
  );
};

export default QuestionRenderer;
