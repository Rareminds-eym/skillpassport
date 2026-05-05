import OpenAI from 'openai';
import { getLogger } from '@/shared/config/logging';

/**
 * OpenAI Client for University AI Counselling
 * Reuses the same pattern as career-assistant
 */

const logger = getLogger('university-ai-openai');
let openai: OpenAI | null = null;

export const getOpenAIClient = (): OpenAI => {
  if (!openai) {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    
    if (!apiKey || apiKey === '') {
      logger.error('VITE_OPENAI_API_KEY is not set in .env file');
      throw new Error('OpenAI API key is not configured. Please add VITE_OPENAI_API_KEY to your .env file.');
    }
    
    openai = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: apiKey,
      defaultHeaders: {
        "HTTP-Referer": typeof window !== 'undefined' ? window.location.origin : '',
        "X-Title": "SkillPassport University AI",
      },
      dangerouslyAllowBrowser: true
    });
  }
  return openai;
};

export const DEFAULT_MODEL = 'nvidia/nemotron-nano-12b-v2-vl:free';