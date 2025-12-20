// Career AI Memory Management - Production Ready
// Implements conversation memory, context compression, and topic tracking

import type { StoredMessage, CareerIntent } from '../types/career-ai.ts';

export interface ConversationMemory {
  summary: string;
  topics: string[];
  entities: EntityMemory;
  lastIntent: CareerIntent;
  keyInsights: string[];
  actionItems: string[];
}

export interface EntityMemory {
  mentionedJobs: string[];
  mentionedSkills: string[];
  mentionedCompanies: string[];
  mentionedCourses: string[];
  userPreferences: Record<string, string>;
}

export interface CompressedContext {
  recentMessages: StoredMessage[];
  memorySummary: string;
  relevantEntities: EntityMemory;
}

/**
 * Extract entities from conversation messages
 */
export function extractEntities(messages: StoredMessage[]): EntityMemory {
  const entities: EntityMemory = {
    mentionedJobs: [],
    mentionedSkills: [],
    mentionedCompanies: [],
    mentionedCourses: [],
    userPreferences: {}
  };

  const jobPatterns = [
    /\b(software|web|mobile|data|ml|ai|frontend|backend|fullstack|devops|cloud)\s*(engineer|developer|analyst|scientist)\b/gi,
    /\b(intern|internship|fresher|junior|senior)\s*(position|role|job)\b/gi
  ];

  const skillPatterns = [
    /\b(python|javascript|java|react|node|sql|aws|docker|kubernetes|git)\b/gi,
    /\b(machine learning|deep learning|data science|web development)\b/gi
  ];

  const companyPatterns = [
    /\b(google|microsoft|amazon|meta|apple|netflix|uber|airbnb|stripe)\b/gi,
    /\b(tcs|infosys|wipro|hcl|cognizant|accenture|deloitte)\b/gi
  ];

  const preferencePatterns = [
    { pattern: /prefer\s*(remote|hybrid|onsite|wfh)/gi, key: 'workMode' },
    { pattern: /looking for\s*(internship|full.?time|part.?time)/gi, key: 'employmentType' },
    { pattern: /interested in\s*(\w+(?:\s+\w+)?)\s*(field|domain|industry)/gi, key: 'industry' }
  ];

  for (const msg of messages) {
    const content = msg.content;

    // Extract jobs
    for (const pattern of jobPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        entities.mentionedJobs.push(...matches.map(m => m.toLowerCase()));
      }
    }

    // Extract skills
    for (const pattern of skillPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        entities.mentionedSkills.push(...matches.map(m => m.toLowerCase()));
      }
    }

    // Extract companies
    for (const pattern of companyPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        entities.mentionedCompanies.push(...matches.map(m => m.toLowerCase()));
      }
    }

    // Extract preferences
    for (const { pattern, key } of preferencePatterns) {
      const match = content.match(pattern);
      if (match && match[1]) {
        entities.userPreferences[key] = match[1].toLowerCase();
      }
    }
  }

  // Deduplicate
  entities.mentionedJobs = [...new Set(entities.mentionedJobs)];
  entities.mentionedSkills = [...new Set(entities.mentionedSkills)];
  entities.mentionedCompanies = [...new Set(entities.mentionedCompanies)];
  entities.mentionedCourses = [...new Set(entities.mentionedCourses)];

  return entities;
}

/**
 * Generate a summary of the conversation
 */
export function summarizeConversation(messages: StoredMessage[]): string {
  if (messages.length === 0) return '';
  if (messages.length <= 4) return ''; // No need to summarize short conversations

  const topics: string[] = [];
  const userQueries: string[] = [];

  for (const msg of messages) {
    if (msg.role === 'user') {
      userQueries.push(msg.content.slice(0, 100));
      
      // Extract topics
      if (msg.content.toLowerCase().includes('job')) topics.push('job search');
      if (msg.content.toLowerCase().includes('skill')) topics.push('skills');
      if (msg.content.toLowerCase().includes('interview')) topics.push('interview prep');
      if (msg.content.toLowerCase().includes('resume')) topics.push('resume');
      if (msg.content.toLowerCase().includes('career')) topics.push('career guidance');
      if (msg.content.toLowerCase().includes('course')) topics.push('courses');
    }
  }

  const uniqueTopics = [...new Set(topics)];
  
  return `Previous discussion covered: ${uniqueTopics.join(', ')}. User asked about: ${userQueries.slice(-3).join('; ')}`;
}

/**
 * Compress conversation context for long conversations
 */
export function compressContext(
  messages: StoredMessage[],
  maxRecentMessages: number = 10
): CompressedContext {
  const recentMessages = messages.slice(-maxRecentMessages);
  const olderMessages = messages.slice(0, -maxRecentMessages);
  
  const memorySummary = summarizeConversation(olderMessages);
  const relevantEntities = extractEntities(messages);

  return {
    recentMessages,
    memorySummary,
    relevantEntities
  };
}

/**
 * Build memory context string for system prompt
 */
export function buildMemoryContext(memory: CompressedContext): string {
  if (!memory.memorySummary && Object.values(memory.relevantEntities).every(v => 
    Array.isArray(v) ? v.length === 0 : Object.keys(v).length === 0
  )) {
    return '';
  }

  let context = '<conversation_memory>\n';
  
  if (memory.memorySummary) {
    context += `<summary>${memory.memorySummary}</summary>\n`;
  }

  const entities = memory.relevantEntities;
  
  if (entities.mentionedJobs.length > 0) {
    context += `<discussed_jobs>${entities.mentionedJobs.join(', ')}</discussed_jobs>\n`;
  }
  
  if (entities.mentionedSkills.length > 0) {
    context += `<discussed_skills>${entities.mentionedSkills.join(', ')}</discussed_skills>\n`;
  }
  
  if (entities.mentionedCompanies.length > 0) {
    context += `<discussed_companies>${entities.mentionedCompanies.join(', ')}</discussed_companies>\n`;
  }
  
  if (Object.keys(entities.userPreferences).length > 0) {
    context += `<user_preferences>${JSON.stringify(entities.userPreferences)}</user_preferences>\n`;
  }

  context += '</conversation_memory>';
  
  return context;
}

/**
 * Extract action items from AI responses
 */
export function extractActionItems(response: string): string[] {
  const actionItems: string[] = [];
  
  // Look for numbered lists
  const numberedPattern = /\d+\.\s*\*?\*?([^*\n]+)\*?\*?/g;
  let match;
  while ((match = numberedPattern.exec(response)) !== null) {
    const item = match[1].trim();
    if (item.length > 10 && item.length < 200) {
      actionItems.push(item);
    }
  }

  // Look for bullet points with action verbs
  const actionVerbs = ['apply', 'learn', 'practice', 'complete', 'update', 'review', 'prepare', 'enroll', 'build', 'create'];
  const bulletPattern = /[-•]\s*([^\n]+)/g;
  while ((match = bulletPattern.exec(response)) !== null) {
    const item = match[1].trim().toLowerCase();
    if (actionVerbs.some(verb => item.startsWith(verb))) {
      actionItems.push(match[1].trim());
    }
  }

  return actionItems.slice(0, 5); // Limit to 5 action items
}

/**
 * Detect topic shifts in conversation
 */
export function detectTopicShift(
  currentMessage: string,
  previousIntent: CareerIntent,
  currentIntent: CareerIntent
): boolean {
  // Different intent = topic shift
  if (previousIntent !== currentIntent && currentIntent !== 'general') {
    return true;
  }

  // Check for explicit topic change phrases
  const topicChangePatterns = [
    /\b(actually|instead|different|another|new)\s*(topic|question|thing)\b/i,
    /\b(let'?s talk about|can we discuss|what about)\b/i,
    /\b(moving on|changing topic|different question)\b/i
  ];

  return topicChangePatterns.some(pattern => pattern.test(currentMessage));
}

/**
 * Get relevant context based on current intent
 */
export function getRelevantContext(
  intent: CareerIntent,
  memory: ConversationMemory
): string[] {
  const relevantContext: string[] = [];

  switch (intent) {
    case 'find-jobs':
      if (memory.entities.mentionedJobs.length > 0) {
        relevantContext.push(`Previously discussed jobs: ${memory.entities.mentionedJobs.join(', ')}`);
      }
      if (memory.entities.userPreferences.workMode) {
        relevantContext.push(`Preferred work mode: ${memory.entities.userPreferences.workMode}`);
      }
      break;

    case 'skill-gap':
      if (memory.entities.mentionedSkills.length > 0) {
        relevantContext.push(`Skills discussed: ${memory.entities.mentionedSkills.join(', ')}`);
      }
      break;

    case 'interview-prep':
      if (memory.entities.mentionedCompanies.length > 0) {
        relevantContext.push(`Target companies: ${memory.entities.mentionedCompanies.join(', ')}`);
      }
      break;

    case 'learning-path':
    case 'course-recommendation':
      if (memory.entities.mentionedCourses.length > 0) {
        relevantContext.push(`Courses discussed: ${memory.entities.mentionedCourses.join(', ')}`);
      }
      break;
  }

  if (memory.actionItems.length > 0) {
    relevantContext.push(`Previous action items: ${memory.actionItems.slice(0, 3).join('; ')}`);
  }

  return relevantContext;
}
