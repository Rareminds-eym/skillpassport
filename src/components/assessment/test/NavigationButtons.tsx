import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface NavigationButtonsProps {
  currentQuestion: number;
  totalQuestions: number;
  onPrevious: () => void;
  onNext: () => void;
  isFromReview?: boolean;
}

const NavigationButtons: React.FC<NavigationButtonsProps> = ({
  currentQuestion,
  totalQuestions,
  onPrevious,
  onNext,
  isFromReview = false
}) => {
  return (
    <div className="flex justify-between">
      <button
        onClick={onPrevious}
        disabled={currentQuestion === 0}
        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
      >
        Previous
      </button>
      
      {isFromReview ? (
        <button
          onClick={onNext}
          className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Review
        </button>
      ) : (
        <button
          onClick={onNext}
          className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {currentQuestion < totalQuestions - 1 ? 'Next' : 'Review Answers'}
        </button>
      )}
    </div>
  );
};

export default NavigationButtons;