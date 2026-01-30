// Career AI Memory Management - Cloudflare Workers Version

import type { StoredMessage, CareerIntent } from '../types/career-ai';

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

    for (const pattern of jobPatterns) {
      const matches = content.match(pattern);
      if (matches) entities.mentionedJobs.push(...matches.map(m => m.toLowerCase()));
    }

    for (const pattern of skillPatterns) {
      const matches = content.match(pattern);
      if (matches) entities.mentionedSkills.push(...matches.map(m => m.toLowerCase()));
    }

    for (const pattern of companyPatterns) {
      const matches = content.match(pattern);
      if (matches) entities.mentionedCompanies.push(...matches.map(m => m.toLowerCase()));
    }

    for (const { pattern, key } of preferencePatterns) {
      const match = content.match(pattern);
      if (match && match[1]) entities.userPreferences[key] = match[1].toLowerCase();
    }
  }

  entities.mentionedJobs = [...new Set(entities.mentionedJobs)];
  entities.mentionedSkills = [...new Set(entities.mentionedSkills)];
  entities.mentionedCompanies = [...new Set(entities.mentionedCompanies)];
  entities.mentionedCourses = [...new Set(entities.mentionedCourses)];

  return entities;
}

export function summarizeConversation(messages: StoredMessage[]): string {
  if (messages.length === 0) return '';
  if (messages.length <= 4) return '';

  const topics: string[] = [];
  const userQueries: string[] = [];

  for (const msg of messages) {
    if (msg.role === 'user') {
      userQueries.push(msg.content.slice(0, 100));
      
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

export function compressContext(messages: StoredMessage[], maxRecentMessages: number = 10): CompressedContext {
  const recentMessages = messages.slice(-maxRecentMessages);
  const olderMessages = messages.slice(0, -maxRecentMessages);
  
  const memorySummary = summarizeConversation(olderMessages);
  const relevantEntities = extractEntities(messages);

  return { recentMessages, memorySummary, relevantEntities };
}

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
