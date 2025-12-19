import React from 'react';
import { AlertCircle, Clock, AlertTriangle } from 'lucide-react';

interface NotificationModalProps {
  type: 'info' | 'warning' | 'error';
  title: string;
  message: string;
  onClose: () => void;
  onConfirm?: () => void;
  confirmText?: string;
}

const NotificationModal: React.FC<NotificationModalProps> = ({
  type,
  title,
  message,
  onClose,
  onConfirm,
  confirmText = 'Confirm'
}) => {
  const icons = {
    info: <Clock className="h-12 w-12 text-blue-500" />,
    warning: <AlertTriangle className="h-12 w-12 text-yellow-500" />,
    error: <AlertCircle className="h-12 w-12 text-red-500" />
  };

  const colors = {
    info: 'blue',
    warning: 'yellow',
    error: 'red'
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
        <div className="text-center mb-6">
          {icons[type]}
          <h3 className="text-lg font-medium text-gray-900 mt-4 font-serif">{title}</h3>
          <p className="mt-2 text-sm text-gray-500">{message}</p>
        </div>
        <div className="flex justify-center space-x-3">
          {onConfirm && (
            <button
              onClick={onConfirm}
              className={`px-4 py-2 bg-${colors[type]}-600 text-white font-medium rounded-md shadow hover:bg-${colors[type]}-700 focus:outline-none focus:ring-2 focus:ring-${colors[type]}-500 focus:ring-offset-2`}
            >
              {confirmText}
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationModal;