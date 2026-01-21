/**
 * AI Thinking Indicators - Usage Examples
 *
 * This file demonstrates how to use the various AI thinking/loading components
 * in your chat interfaces.
 */

import React, { useState, useEffect } from 'react';
import {
  AIThinkingBubble,
  AIStatusPill,
  AISkeletonMessage,
  AITypingIndicator,
} from './AIThinkingIndicators';

// ============================================================
// Example 1: Basic Thinking Bubble
// ============================================================
export const Example1_BasicThinkingBubble = () => {
  return (
    <div className="flex justify-start">
      <AIThinkingBubble />
    </div>
  );
};

// ============================================================
// Example 2: Thinking Bubble with Status
// ============================================================
export const Example2_ThinkingWithStatus = () => {
  const [status, setStatus] = useState('Analyzing your request...');

  useEffect(() => {
    const statusSequence = [
      'Analyzing your request...',
      'Searching talent database...',
      'Processing insights...',
      'Generating response...',
    ];

    let currentIndex = 0;
    const interval = setInterval(() => {
      currentIndex = (currentIndex + 1) % statusSequence.length;
      setStatus(statusSequence[currentIndex]);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex justify-start">
      <AIThinkingBubble status={status} />
    </div>
  );
};

// ============================================================
// Example 3: Standalone Status Pills
// ============================================================
export const Example3_StatusPills = () => {
  return (
    <div className="space-y-2">
      <AIStatusPill status="Thinking..." variant="default" />
      <AIStatusPill status="Searching files..." variant="searching" />
      <AIStatusPill status="Processing data..." variant="processing" />
      <AIStatusPill status="Running code..." variant="running" />
    </div>
  );
};

// ============================================================
// Example 4: Skeleton Message for Long Responses
// ============================================================
export const Example4_SkeletonMessage = () => {
  return (
    <div className="flex justify-start">
      <AISkeletonMessage lines={4} />
    </div>
  );
};

// ============================================================
// Example 5: Minimal Typing Indicators
// ============================================================
export const Example5_TypingIndicators = () => {
  return (
    <div className="space-y-4">
      {/* Bubble variant */}
      <div className="flex justify-start">
        <AITypingIndicator text="AI is typing" variant="bubble" />
      </div>

      {/* Inline variant */}
      <div className="flex items-center gap-2">
        <AITypingIndicator text="Processing" variant="inline" />
      </div>
    </div>
  );
};

// ============================================================
// Example 6: Full Chat Implementation
// ============================================================
export const Example6_FullChatImplementation = () => {
  const [loading, setLoading] = useState(false);
  const [aiStatus, setAiStatus] = useState('');
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([]);

  const handleSendMessage = async (text: string) => {
    // Add user message
    setMessages((prev) => [...prev, { role: 'user', content: text }]);

    // Show loading with status
    setLoading(true);
    setAiStatus('Analyzing your request...');

    // Simulate AI processing with status updates
    setTimeout(() => setAiStatus('Searching database...'), 800);
    setTimeout(() => setAiStatus('Processing insights...'), 1600);

    // Simulate response after 3 seconds
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Here is my response to your query.',
        },
      ]);
      setLoading(false);
      setAiStatus('');
    }, 3000);
  };

  return (
    <div className="flex flex-col gap-4 p-6">
      {messages.map((msg, i) => (
        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
          <div
            className={`
            max-w-md px-6 py-4 rounded-2xl
            ${
              msg.role === 'user'
                ? 'bg-blue-600 text-white rounded-br-sm'
                : 'bg-white text-gray-900 rounded-bl-sm shadow-md'
            }
          `}
          >
            {msg.content}
          </div>
        </div>
      ))}

      {loading && (
        <div className="flex justify-start">
          <AIThinkingBubble status={aiStatus} />
        </div>
      )}

      <button
        onClick={() => handleSendMessage('Test message')}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
      >
        Send Test Message
      </button>
    </div>
  );
};

// ============================================================
// Example 7: Multi-Stage Status Progress
// ============================================================
export const Example7_MultiStageProgress = () => {
  const [stage, setStage] = useState(0);

  const stages = [
    { status: 'Understanding your query...', variant: 'default' as const },
    { status: 'Searching knowledge base...', variant: 'searching' as const },
    { status: 'Analyzing results...', variant: 'processing' as const },
    { status: 'Generating insights...', variant: 'running' as const },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setStage((prev) => (prev + 1) % stages.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col gap-3">
      <AIStatusPill status={stages[stage].status} variant={stages[stage].variant} />
      <AIThinkingBubble />
    </div>
  );
};

// ============================================================
// Example 8: Conditional Indicators Based on Task Type
// ============================================================
export const Example8_ConditionalIndicators = () => {
  const [taskType, setTaskType] = useState<'search' | 'code' | 'analyze'>('search');

  const statusMap = {
    search: { text: 'Searching talent database...', variant: 'searching' as const },
    code: { text: 'Running code analysis...', variant: 'running' as const },
    analyze: { text: 'Analyzing data patterns...', variant: 'processing' as const },
  };

  return (
    <div className="space-y-4">
      {/* Task selector */}
      <div className="flex gap-2">
        {(['search', 'code', 'analyze'] as const).map((type) => (
          <button
            key={type}
            onClick={() => setTaskType(type)}
            className={`px-3 py-1 rounded ${
              taskType === type ? 'bg-blue-600 text-white' : 'bg-gray-200'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Dynamic indicator */}
      <AIThinkingBubble status={statusMap[taskType].text} />
    </div>
  );
};

// ============================================================
// How to Use in Your RecruiterCopilot Component
// ============================================================
/*

// 1. Import the component
import { AIThinkingBubble } from './AIThinkingIndicators';

// 2. Add state for AI status
const [loading, setLoading] = useState(false);
const [aiStatus, setAiStatus] = useState('');

// 3. Update status during processing
const handleSend = async (query: string) => {
  setLoading(true);
  setAiStatus('Analyzing your request...');
  
  // Update status at different stages
  setTimeout(() => setAiStatus('Searching talent database...'), 800);
  setTimeout(() => setAiStatus('Processing insights...'), 1600);
  
  // Process the query...
  const response = await processQuery(query);
  
  // Clear loading state
  setLoading(false);
  setAiStatus('');
};

// 4. Render in your message list
{loading && (
  <div className="flex justify-start">
    <AIThinkingBubble status={aiStatus} />
  </div>
)}

*/
