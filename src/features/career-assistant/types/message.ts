/**
 * Message Types
 * Type-safe definitions for chat messages
 */

import type { InteractiveElements } from './interactive';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  interactive?: InteractiveElements;
  intent?: string;
  intentConfidence?: string;
  phase?: string;
}
