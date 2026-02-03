/**
 * Conversation Phase System for AI Tutor
 * 
 * Implements a 3-phase conversation system that adapts response length
 * and depth based on conversation progress:
 * - opening: First message, brief and conversational
 * - exploring: Messages 2-4, moderate depth
 * - deep_dive: Message 5+, comprehensive explanations
 */

export type ConversationPhase = 'opening' | 'exploring' | 'deep_dive';

export interface PhaseParameters {
  maxTokens: number;
  temperature: number;
  verbosity: string;
}

/**
 * Determine conversation phase based on message count
 */
export function getConversationPhase(messageCount: number): ConversationPhase {
  if (messageCount === 0) return 'opening';
  if (messageCount <= 4) return 'exploring';
  return 'deep_dive';
}

/**
 * Get AI parameters for each conversation phase
 */
export function getPhaseParameters(phase: ConversationPhase): PhaseParameters {
  const params: Record<ConversationPhase, PhaseParameters> = {
    opening: { 
      maxTokens: 250, 
      temperature: 0.8, 
      verbosity: 'low' 
    },
    exploring: { 
      maxTokens: 1500, 
      temperature: 0.7, 
      verbosity: 'medium' 
    },
    deep_dive: { 
      maxTokens: 3000, 
      temperature: 0.6, 
      verbosity: 'high' 
    }
  };
  return params[phase];
}

/**
 * Get phase-specific instructions for the AI
 */
export function getPhaseInstructions(phase: ConversationPhase): string {
  const instructions: Record<ConversationPhase, string> = {
    opening: `
## FIRST MESSAGE BEHAVIOR
This is the VERY FIRST message. Keep response SHORT and CONVERSATIONAL.
- Maximum 150 words, 4-5 sentences
- NO bullet points or numbered lists
- Acknowledge warmly, give brief teaser answer, ask ONE follow-up question`,
    
    exploring: `
## EARLY CONVERSATION (Messages 2-4)
- Provide moderate depth (200-400 words)
- Build on previous context naturally
- Start introducing specific details
- End with a question or offer to explore deeper`,
    
    deep_dive: `
## DEEP CONVERSATION (Message 5+)
- Provide comprehensive explanations
- Include specific citations and references
- Use structured formatting when helpful
- Go as deep as the topic requires`
  };
  return instructions[phase];
}
