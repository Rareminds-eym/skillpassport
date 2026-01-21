import React from 'react';
import {
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import Modal from './Modal';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: 'warning' | 'error' | 'success' | 'info';
  buttonText?: string;
}

const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
  title,
  message,
  type = 'info',
  buttonText = 'OK',
}) => {
  const typeConfig = {
    warning: {
      icon: ExclamationTriangleIcon,
      iconColor: 'text-amber-600',
      iconBg: 'bg-amber-100',
      buttonColor: 'bg-amber-600 hover:bg-amber-700',
    },
    error: {
      icon: XCircleIcon,
      iconColor: 'text-red-600',
      iconBg: 'bg-red-100',
      buttonColor: 'bg-red-600 hover:bg-red-700',
    },
    success: {
      icon: CheckCircleIcon,
      iconColor: 'text-green-600',
      iconBg: 'bg-green-100',
      buttonColor: 'bg-green-600 hover:bg-green-700',
    },
    info: {
      icon: InformationCircleIcon,
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-100',
      buttonColor: 'bg-blue-600 hover:bg-blue-700',
    },
  };

  const config = typeConfig[type];
  const IconComponent = config.icon;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm" showCloseButton={false}>
      <div className="text-center">
        <div
          className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${config.iconBg} mb-4`}
        >
          <IconComponent className={`h-6 w-6 ${config.iconColor}`} />
        </div>

        <p className="text-sm text-gray-600 mb-6">{message}</p>

        <button
          onClick={onClose}
          className={`px-4 py-2 text-sm font-medium text-white rounded-md ${config.buttonColor}`}
        >
          {buttonText}
        </button>
      </div>
    </Modal>
  );
};

export default NotificationModal;
