// Chat Window Component for AI Counselling

import React, { useRef, useEffect, useState } from 'react';
import { CounsellingMessage } from '../../types/counselling';
import ReactMarkdown from 'react-markdown';
import { Send, Loader2, StopCircle, Bot, User } from 'lucide-react';
import { Button } from '../ui/button';
// @ts-expect-error - Auto-suppressed for migration
import { Textarea } from '../ui/textarea';
// @ts-expect-error - Auto-suppressed for migration
import { ScrollArea } from '../ui/scroll-area';
import { cn } from '../../lib/utils';

interface ChatWindowProps {
  messages: CounsellingMessage[];
  isStreaming: boolean;
  onSendMessage: (content: string) => void;
  onStopStreaming?: () => void;
  placeholder?: string;
  disabled?: boolean;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  messages,
  isStreaming,
  onSendMessage,
  onStopStreaming,
  placeholder = 'Type your message here...',
  disabled = false,
}) => {
  const [input, setInput] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isStreaming && !disabled) {
      onSendMessage(input);
      setInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border shadow-sm">
      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-gray-400">
              <div className="text-center">
                <Bot className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">Start a conversation with your AI counsellor</p>
              </div>
            </div>
          ) : (
            messages.map((message, index) => (
              <MessageBubble
                key={message.id || index}
                message={message}
                isStreaming={isStreaming && index === messages.length - 1}
              />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t p-4 bg-gray-50">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled || isStreaming}
            className="flex-1 min-h-[60px] max-h-[200px] resize-none"
            rows={2}
          />
          {isStreaming ? (
            <Button
              type="button"
              onClick={onStopStreaming}
              variant="destructive"
              size="icon"
              className="self-end"
            >
              <StopCircle className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              type="submit"
              disabled={!input.trim() || disabled}
              size="icon"
              className="self-end"
            >
              <Send className="w-4 h-4" />
            </Button>
          )}
        </form>
      </div>
    </div>
  );
};

// Message Bubble Component
interface MessageBubbleProps {
  message: CounsellingMessage;
  isStreaming?: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isStreaming }) => {
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';

  return (
    <div className={cn('flex gap-3 max-w-[85%]', isUser ? 'ml-auto flex-row-reverse' : 'mr-auto')}>
      {/* Avatar */}
      <div
        className={cn(
          'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
          isUser ? 'bg-blue-500' : 'bg-purple-500'
        )}
      >
        {isUser ? <User className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-white" />}
      </div>

      {/* Message Content */}
      <div
        className={cn(
          'rounded-lg px-4 py-3 shadow-sm',
          isUser ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-900 border border-gray-200'
        )}
      >
        {isAssistant ? (
          <div className="prose prose-sm max-w-none">
            <ReactMarkdown
              components={{
                p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                ul: ({ children }) => <ul className="mb-2 ml-4 list-disc">{children}</ul>,
                ol: ({ children }) => <ol className="mb-2 ml-4 list-decimal">{children}</ol>,
                li: ({ children }) => <li className="mb-1">{children}</li>,
                strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
              }}
            >
              {message.content}
            </ReactMarkdown>
            {isStreaming && (
              <span className="inline-flex items-center ml-1">
                <Loader2 className="w-3 h-3 animate-spin" />
              </span>
            )}
          </div>
        ) : (
          <p className="whitespace-pre-wrap">{message.content}</p>
        )}

        {/* Timestamp */}
        <div className={cn('text-xs mt-2', isUser ? 'text-blue-100' : 'text-gray-500')}>
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      </div>
    </div>
  );
};
