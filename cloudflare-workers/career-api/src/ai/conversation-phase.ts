// Conversation Phase Management - Cloudflare Workers Version

import type { ConversationPhase, CareerIntent, PhaseParameters } from '../types/career-ai';

export function getConversationPhase(messageCount: number): ConversationPhase {
  if (messageCount === 0) return 'opening';
  if (messageCount <= 4) return 'exploring';
  if (messageCount <= 10) return 'deep_dive';
  return 'follow_up';
}

export function getPhaseParameters(
  phase: ConversationPhase, 
  intent?: CareerIntent
): PhaseParameters {
  // Base parameters by phase - optimized for career conversations
  const baseParams: Record<ConversationPhase, PhaseParameters> = {
    opening: { 
      max_tokens: 600, 
      temperature: 0.7,
      top_p: 0.9,
      frequency_penalty: 0.3,
      presence_penalty: 0.2
    },
    exploring: { 
      max_tokens: 2000, 
      temperature: 0.5,
      top_p: 0.85,
      frequency_penalty: 0.2,
      presence_penalty: 0.1
    },
    deep_dive: { 
      max_tokens: 4000, 
      temperature: 0.4,
      top_p: 0.8,
      frequency_penalty: 0.1,
      presence_penalty: 0.1
    },
    follow_up: { 
      max_tokens: 2500, 
      temperature: 0.45,
      top_p: 0.85,
      frequency_penalty: 0.2,
      presence_penalty: 0.15
    }
  };
  
  // Intent-specific temperature optimization
  const intentTemperatures: Record<CareerIntent, number> = {
    'find-jobs': 0.2,
    'application-status': 0.2,
    'course-progress': 0.25,
    'assessment-insights': 0.3,
    'skill-gap': 0.35,
    'resume-review': 0.35,
    'course-recommendation': 0.4,
    'interview-prep': 0.45,
    'networking': 0.5,
    'learning-path': 0.5,
    'career-guidance': 0.55,
    'general': 0.6
  };
  
  // Intent-specific max_tokens
  const intentMaxTokens: Partial<Record<CareerIntent, number>> = {
    'learning-path': 4000,
    'career-guidance': 3500,
    'skill-gap': 3000,
    'interview-prep': 3500,
    'resume-review': 2500,
    'find-jobs': 3000
  };
  
  const result = { ...baseParams[phase] };
  
  if (intent) {
    const intentTemp = intentTemperatures[intent];
    if (intentTemp !== undefined) {
      result.temperature = (result.temperature + intentTemp) / 2;
    }
    
    const intentTokens = intentMaxTokens[intent];
    if (intentTokens) {
      result.max_tokens = Math.max(result.max_tokens, intentTokens);
    }
    
    if (phase === 'opening') {
      result.temperature = Math.min(result.temperature + 0.15, 0.8);
      result.max_tokens = Math.min(result.max_tokens, 700);
    }
    
    const factualIntents: CareerIntent[] = ['find-jobs', 'application-status', 'course-progress', 'assessment-insights'];
    if (factualIntents.includes(intent)) {
      result.temperature = Math.min(result.temperature, 0.35);
      result.top_p = 0.75;
    }
  }
  
  return result;
}

export function getPhaseDescription(phase: ConversationPhase): string {
  const descriptions: Record<ConversationPhase, string> = {
    opening: 'First interaction - warm greeting, brief response, one follow-up question',
    exploring: 'Early conversation - moderate depth, 2-3 recommendations, building rapport',
    deep_dive: 'Engaged conversation - comprehensive guidance, detailed roadmaps, structured response',
    follow_up: 'Ongoing discussion - build on previous points, track progress, maintain continuity'
  };
  return descriptions[phase];
}
