import React, { forwardRef } from 'react';
import { Send, Mic, Paperclip } from 'lucide-react';

interface InputBarProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  placeholder: string;
  disabled?: boolean;
  enableVoice?: boolean;
  enableAttachments?: boolean;
  disclaimer?: string;
}

export const InputBar = forwardRef<HTMLInputElement, InputBarProps>(
  (
    { value, onChange, onSend, placeholder, disabled, enableVoice, enableAttachments, disclaimer },
    ref
  ) => {
    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        onSend();
      }
    };

    return (
      <div className="flex-shrink-0 border-t border-gray-200 bg-white px-4 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="relative">
            <input
              ref={ref}
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={placeholder}
              disabled={disabled}
              className="w-full px-5 py-4 pr-32 text-gray-900 placeholder-gray-500 bg-gray-50 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed transition-all"
            />

            {/* Action Buttons */}
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
              {enableAttachments && (
                <button
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                  title="Attach file"
                  type="button"
                >
                  <Paperclip className="w-5 h-5" />
                </button>
              )}
              {enableVoice && (
                <button
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                  title="Voice message"
                  type="button"
                >
                  <Mic className="w-5 h-5" />
                </button>
              )}
              <button
                onClick={onSend}
                disabled={disabled || !value.trim()}
                className="p-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all"
                title="Send message"
                type="button"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Disclaimer */}
          {disclaimer && (
            <div className="mt-2 px-2">
              <p className="text-xs text-gray-500">{disclaimer}</p>
            </div>
          )}
        </div>
      </div>
    );
  }
);

InputBar.displayName = 'InputBar';
