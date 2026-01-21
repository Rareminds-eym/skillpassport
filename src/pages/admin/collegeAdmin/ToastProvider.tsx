import * as Toast from '@radix-ui/react-toast';
import React, { useState } from 'react';

interface ToastContextType {
  showToast: (message: string) => void;
}

export const ToastContext = React.createContext<ToastContextType | null>(null);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');

  const showToast = (msg: string) => {
    setMessage(msg);
    setOpen(false); // reset
    setTimeout(() => setOpen(true), 50);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      <Toast.Provider swipeDirection="right">
        {children}

        <Toast.Root
          open={open}
          onOpenChange={setOpen}
          className="bg-white border shadow-lg rounded-lg p-4 flex items-center gap-3"
        >
          <Toast.Title className="font-semibold text-gray-900">Notification</Toast.Title>
          <Toast.Description className="text-gray-600">{message}</Toast.Description>
        </Toast.Root>

        <Toast.Viewport className="fixed bottom-5 right-5 w-[320px] z-50" />
      </Toast.Provider>
    </ToastContext.Provider>
  );
};
