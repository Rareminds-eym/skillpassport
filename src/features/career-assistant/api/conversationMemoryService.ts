/**
 * Conversation Memory Service
 * Maintains conversation context for natural follow-ups and multi-turn dialogues
 */

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  intent?: string;
  domain?: string;
  entities?: Record<string, any>;
}

export interface ConversationContext {
  learnerId: string;
  messages: ConversationMessage[];
  userGoals: string[];
  detectedDomains: string[];
  technologiesMentioned: string[];
  lastIntent?: string;
  sessionStarted: Date;
}

class ConversationMemoryService {
  private conversations: Map<string, ConversationContext> = new Map();
  private readonly MAX_MESSAGES = 10; // Keep last 10 messages

  /**
   * Initialize conversation for a learner
   */
  initConversation(learnerId: string): ConversationContext {
    const context: ConversationContext = {
      learnerId,
      messages: [],
      userGoals: [],
      detectedDomains: [],
      technologiesMentioned: [],
      sessionStarted: new Date()
    };
    this.conversations.set(learnerId, context);
    return context;
  }

  /**
   * Get conversation context for a learner
   */
  getContext(learnerId: string): ConversationContext | null {
    return this.conversations.get(learnerId) || null;
  }

  /**
   * Add user message to conversation
   */
  addUserMessage(
    learnerId: string,
    content: string,
    intent?: string,
    domain?: string,
    entities?: Record<string, any>
  ): void {
    let context = this.getContext(learnerId);
    if (!context) {
      context = this.initConversation(learnerId);
    }

    const message: ConversationMessage = {
      role: 'user',
      content,
      timestamp: new Date(),
      intent,
      domain,
      entities
    };

    context.messages.push(message);
    
    // Update context metadata
    if (intent) context.lastIntent = intent;
    if (domain && !context.detectedDomains.includes(domain)) {
      context.detectedDomains.push(domain);
    }
    if (entities?.skills) {
      entities.skills.forEach((skill: string) => {
        if (!context!.technologiesMentioned.includes(skill)) {
          context!.technologiesMentioned.push(skill);
        }
      });
    }

    // Keep only last N messages
    if (context.messages.length > this.MAX_MESSAGES) {
      context.messages = context.messages.slice(-this.MAX_MESSAGES);
    }

    this.conversations.set(learnerId, context);
  }

  /**
   * Add assistant message to conversation
   */
  addAssistantMessage(learnerId: string, content: string): void {
    let context = this.getContext(learnerId);
    if (!context) {
      context = this.initConversation(learnerId);
    }

    const message: ConversationMessage = {
      role: 'assistant',
      content: content.substring(0, 500), // Store truncated version
      timestamp: new Date()
    };

    context.messages.push(message);

    // Keep only last N messages
    if (context.messages.length > this.MAX_MESSAGES) {
      context.messages = context.messages.slice(-this.MAX_MESSAGES);
    }

    this.conversations.set(learnerId, context);
  }

  /**
   * Get formatted conversation history for AI context
   */
  getFormattedHistory(learnerId: string, lastN: number = 5): string {
    const context = this.getContext(learnerId);
    if (!context || context.messages.length === 0) {
      return '';
    }

    const recentMessages = context.messages.slice(-lastN);
    return recentMessages
      .map(msg => `${msg.role === 'user' ? 'Learner' : 'AI'}: ${msg.content}`)
      .join('\n');
  }

  /**
   * Get conversation summary for AI context
   */
  getConversationSummary(learnerId: string): string {
    const context = this.getContext(learnerId);
    if (!context) return 'New conversation';

    const parts: string[] = [];
    
    if (context.detectedDomains.length > 0) {
      parts.push(`Interests: ${context.detectedDomains.join(', ')}`);
    }
    
    if (context.technologiesMentioned.length > 0) {
      parts.push(`Technologies discussed: ${context.technologiesMentioned.join(', ')}`);
    }
    
    if (context.lastIntent) {
      parts.push(`Last topic: ${context.lastIntent}`);
    }

    return parts.length > 0 ? parts.join(' | ') : 'Ongoing conversation';
  }

  /**
   * Clear conversation for a learner
   */
  clearConversation(learnerId: string): void {
    this.conversations.delete(learnerId);
  }

  /**
   * Check if this is a follow-up question
   */
  isFollowUpQuestion(learnerId: string, message: string): boolean {
    const context = this.getContext(learnerId);
    if (!context || context.messages.length === 0) return false;

    const followUpIndicators = [
      'that one', 'first one', 'second one', 'last one',
      'tell me more', 'more details', 'more about',
      'what about', 'how about', 'and that',
      'the one about', 'previous', 'earlier'
    ];

    const lowerMessage = message.toLowerCase();
    return followUpIndicators.some(indicator => lowerMessage.includes(indicator));
  }
}

export const conversationMemoryService = new ConversationMemoryService();
export default conversationMemoryService;
