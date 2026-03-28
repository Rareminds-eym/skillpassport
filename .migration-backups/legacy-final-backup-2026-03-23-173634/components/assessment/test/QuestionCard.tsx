import React from 'react';
import { Question } from '../../types';

interface QuestionCardProps {
  question: Question;
  currentQuestion: number;
  answers: Record<number, number>;
  onAnswerSelect: (questionIndex: number, optionIndex: number) => void;
}

const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  currentQuestion,
  answers,
  onAnswerSelect,
}) => {
  return (
    <div className="bg-white shadow rounded-lg mb-6 p-6">
      {question.section && (
        <div className="mb-4 pb-2 border-b border-gray-200">
          <h3 className="text-md font-medium text-blue-600 font-serif">{question.section}</h3>
        </div>
      )}
      
      <div className="flex justify-between mb-4">
        <span className="text-sm font-medium text-gray-500">Question {currentQuestion + 1}</span>
        <span className="text-sm font-medium text-gray-500">Marks: {question.marks}</span>
      </div>
      
      <h2 className="text-lg font-medium text-gray-900 mb-4 font-serif">
        {question.text}
      </h2>
      
      <div className="space-y-3">
        {question.options.map((option, index) => (
          <div key={index} className="flex items-center p-3 border border-gray-200 rounded-md hover:bg-gray-50">
            <input
              id={`option-${index}`}
              name={`question-${currentQuestion}`}
              type="radio"
              className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              checked={answers[currentQuestion] === index}
              onChange={() => onAnswerSelect(currentQuestion, index)}
            />
            <label htmlFor={`option-${index}`} className="ml-3 block text-gray-700 w-full cursor-pointer">
              {String.fromCharCode(97 + index)}. {option}
            </label>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuestionCard;