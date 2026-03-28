/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface ModalWrapperProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
  size?: "lg" | "2xl" | "4xl" | "5xl" | "full";
}

const ModalWrapper: React.FC<ModalWrapperProps> = ({ title, subtitle, children, isOpen, onClose, size = "2xl" }) => {
  if (!isOpen) return null;

  const sizeClasses: Record<string, string> = {
    lg: "max-w-lg",
    "2xl": "max-w-2xl",
    "4xl": "max-w-4xl",
    "5xl": "max-w-5xl",
    full: "max-w-[95vw]",
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onClose} />
        <div className={`relative w-full ${sizeClasses[size]} transform overflow-hidden rounded-2xl bg-white shadow-2xl max-h-[95vh] flex flex-col`}>
          <div className="flex items-start justify-between border-b border-gray-100 px-6 py-5 flex-shrink-0">
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
              {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
            </div>
            <button onClick={onClose} className="ml-4 rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <div className="p-6">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalWrapper;