import OpenAI from 'openai';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('openai-client');

/**
 * OpenAI Client Service
 * Handles initialization and management of OpenAI client
 */

// Lazy initialization to avoid SSR issues
let openai: OpenAI | null = null;

export const getOpenAIClient = (): OpenAI => {
  if (!openai) {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

    if (!apiKey || apiKey === '') {
      logger.error('OpenAI API key is not configured', undefined, {
        environment: 'client',
        requiredEnvVar: 'VITE_OPENAI_API_KEY'
      });
      throw new Error('OpenAI API key is not configured. Please add VITE_OPENAI_API_KEY to your .env file.');
    }

    logger.info('OpenAI client initialized', {
      baseURL: 'https://openrouter.ai/api/v1',
      model: DEFAULT_MODEL
    });

    openai = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: apiKey,
      defaultHeaders: {
        "HTTP-Referer": typeof window !== 'undefined' ? window.location.origin : '',
        "X-Title": "SkillPassport Career AI",
      },
      dangerouslyAllowBrowser: true
    });
  }
  return openai;
};

export const DEFAULT_MODEL = 'nvidia/nemotron-nano-12b-v2-vl:free';
