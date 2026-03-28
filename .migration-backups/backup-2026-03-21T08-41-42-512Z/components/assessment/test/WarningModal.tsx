import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface WarningModalProps {
  warningCount: number;
  onClose: () => void;
}

const WarningModal: React.FC<WarningModalProps> = ({ warningCount, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
        <div className="text-center mb-6">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 font-serif">Warning: Tab Switching Detected</h3>
          <p className="mt-2 text-sm text-gray-500">
            You have switched tabs or minimized the window. This activity has been recorded. 
            Multiple violations may result in test termination.
          </p>
          <p className="mt-2 text-sm font-semibold text-red-600">
            Warning {warningCount} of 3
          </p>
        </div>
        <div className="flex justify-center">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
};

export default WarningModal;