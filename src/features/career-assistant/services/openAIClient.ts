import OpenAI from 'openai';

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
      console.error('❌ VITE_OPENAI_API_KEY is not set in .env file!');
      throw new Error('OpenAI API key is not configured. Please add VITE_OPENAI_API_KEY to your .env file.');
    }
    
    console.log('✅ OpenAI client initializing with API key:', apiKey.substring(0, 10) + '...');
    
    openai = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: apiKey,
      defaultHeaders: {
        "HTTP-Referer": typeof window !== 'undefined' ? window.location.origin : '',
        "X-Title": "SkillPassport Career AI",
      },
      dangerouslyAllowBrowser: true // Required for browser usage
    });
  }
  return openai;
};

export const DEFAULT_MODEL = 'nvidia/nemotron-nano-12b-v2-vl:free'; // Fast and cost-effective model
