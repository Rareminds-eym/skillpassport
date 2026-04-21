import React from 'react';
import { Clock } from 'lucide-react';

interface TestHeaderProps {
  timeLeft: number;
  totalMarks: number;
  formatTime: (seconds: number) => string;
}

const TestHeader: React.FC<TestHeaderProps> = ({ timeLeft, totalMarks, formatTime }) => {
  return (
    <div className="bg-white shadow rounded-lg mb-6 p-4">
      <div className="flex flex-col md:flex-row justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-gray-900 font-serif">
            Final Exam: Chemical Safety in Battery Production and Handling
          </h1>
          <p className="text-sm text-gray-600">Total Marks: {totalMarks}</p>
        </div>
        <div className="flex items-center mt-2 md:mt-0">
          <Clock className={`h-5 w-5 ${timeLeft < 1800 ? 'text-red-500' : 'text-gray-500'} mr-2`} />
          <span className={`font-mono font-medium ${timeLeft < 1800 ? 'text-red-600' : 'text-gray-700'}`}>
            {formatTime(timeLeft)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default TestHeader;