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
import { TextQuestion } from './TextQuestion';

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
  adaptiveDisabled?: boolean;
  color?: string;
}

/**
 * Determines the question type and renders the appropriate component
 */
export const QuestionRenderer: React.FC<QuestionRendererProps> = ({
  question,
  questionId,
  answer,
  onAnswer,
  responseScale,
  isAdaptive = false,
  adaptiveTimer = 90,
  adaptiveDifficulty,
  adaptiveLoading = false,
  adaptiveDisabled = false,
  color = 'indigo',
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
        disabled={adaptiveDisabled}
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

  // Text Questions (open-ended responses)
  if (question.type === 'text') {
    return (
      <TextQuestion
        questionId={questionId}
        questionText={question.text}
        placeholder={question.placeholder}
        value={answer || ''}
        onAnswer={onAnswer}
        minLength={10}
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
  // Handle both array options and object options (AI sometimes returns { A: "...", B: "...", ... })
  // Also handle malformed keys like " options" (with leading space)
  let optionsArray: string[] | null = null;

  // First check for options with leading space (AI malformed JSON bug)
  const questionAny = question as any;
  const rawOptions = question.options || questionAny[' options'];

  if (Array.isArray(rawOptions)) {
    optionsArray = rawOptions.map((o) => String(o));
  } else if (rawOptions && typeof rawOptions === 'object') {
    // Convert object to array - handles { A: "...", B: "..." } format
    // Force convert all values to strings
    const values = Object.values(rawOptions).map((v) => String(v));
    if (values.length > 0) {
      optionsArray = values;
      console.log('✅ Converted object options to array:', values);
    }
  }

  // Debug log for troubleshooting - only if conversion failed
  if (!optionsArray && (question.options || questionAny[' options'])) {
    console.error('❌ Failed to convert options:', {
      questionId,
      optionsRaw: JSON.stringify(rawOptions),
      isArray: Array.isArray(rawOptions),
      typeOf: typeof rawOptions,
    });
  }

  if (optionsArray && optionsArray.length > 0) {
    return (
      <MCQQuestion
        questionId={questionId}
        questionText={question.text}
        options={optionsArray as string[]}
        selectedAnswer={answer}
        onAnswer={onAnswer}
        moduleTitle={question.moduleTitle}
        subtype={question.subtype}
      />
    );
  }

  // Fallback: Simple text display with debug info in dev mode
  console.warn('⚠️ Question type not recognized:', {
    questionId,
    questionText: question.text?.substring(0, 50),
    type: question.type,
    hasOptions: !!question.options,
    optionsType: typeof question.options,
    hasResponseScale: !!responseScale,
  });

  return (
    <div className="space-y-4">
      <h3 className="text-xl md:text-2xl font-medium text-gray-800 leading-snug">
        {question.text}
      </h3>
      <p className="text-gray-500 text-sm">Question type not recognized. Please contact support.</p>
      {import.meta.env.DEV && (
        <p className="text-xs text-red-400 font-mono">
          Debug: type={question.type}, options={String(!!question.options)}, optionsType=
          {typeof question.options}
        </p>
      )}
    </div>
  );
};

export default QuestionRenderer;
