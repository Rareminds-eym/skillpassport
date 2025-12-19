import React from 'react';

interface ProgressBarProps {
  currentQuestion: number;
  totalQuestions: number;
  answeredQuestions: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  currentQuestion,
  totalQuestions,
  answeredQuestions,
}) => {
  return (
    <div className="bg-white shadow rounded-lg mb-6 p-4">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-700">
          Question {currentQuestion + 1} of {totalQuestions}
        </span>
        <span className="text-sm font-medium text-gray-700">
          {answeredQuestions} of {totalQuestions} answered
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div 
          className="bg-blue-600 h-2.5 rounded-full" 
          style={{ width: `${((currentQuestion + 1) / totalQuestions) * 100}%` }}
        ></div>
      </div>
    </div>
  );
};

export default ProgressBar;