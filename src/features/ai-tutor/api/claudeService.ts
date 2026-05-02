/**
 * Claude AI Service
 * Centralized service for all Claude API interactions
 * Uses claude-3-haiku (cheapest) by default, with fallback options
 */

import { getLogger } from '@/shared/config/logging';

const logger = getLogger('claude-service');

// API Configuration
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';

// Available Claude models (ordered by cost, cheapest first)
export const CLAUDE_MODELS = {
  HAIKU: 'claude-3-haiku-20240307',      // Cheapest - $0.25/M input, $1.25/M output
  SONNET: 'claude-3-5-sonnet-20241022',  // Mid-tier - $3/M input, $15/M output
  OPUS: 'claude-3-opus-20240229'          // Most capable - $15/M input, $75/M output
};

// Default model (cheapest)
const DEFAULT_MODEL = CLAUDE_MODELS.HAIKU;

// Rate limiting and retry configuration
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000;
const MAX_RETRY_DELAY = 10000;

// Simple in-memory cache
const responseCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Get Claude API key from environment
 * @returns {string|null} API key or null if not configured
 */
const getApiKey = () => {
  return import.meta.env.VITE_CLAUDE_API_KEY || null;
};

/**
 * Sleep utility for retry delays
 * @param {number} ms - Milliseconds to sleep
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Generate cache key from prompt and options
 * @param {string} prompt - The prompt text
 * @param {Object} options - Request options
 * @returns {string} Cache key
 */
const generateCacheKey = (prompt, options = {}) => {
  const key = `${options.model || DEFAULT_MODEL}_${prompt.slice(0, 100)}`;
  return btoa(key).slice(0, 50);
};

/**
 * Main function to call Claude API
 * @param {string} prompt - The user prompt
 * @param {Object} options - Configuration options
 * @param {string} options.model - Claude model to use (default: haiku)
 * @param {string} options.systemPrompt - System prompt for context
 * @param {number} options.maxTokens - Max tokens in response (default: 1000)
 * @param {number} options.temperature - Temperature for randomness (default: 0.3)
 * @param {boolean} options.useCache - Whether to use caching (default: true)
 * @param {string} options.cacheKey - Custom cache key
 * @returns {Promise<string>} AI response text
 */
export async function callClaude(prompt, options = {}) {
  const {
    model = DEFAULT_MODEL,
    systemPrompt = null,
    maxTokens = 1000,
    temperature = 0.3,
    useCache = true,
    cacheKey = null
  } = options;

  const apiKey = getApiKey();
  
  if (!apiKey) {
    throw new Error('Claude API key not configured. Please add VITE_CLAUDE_API_KEY to your .env file.');
  }

  // Check cache
  const finalCacheKey = cacheKey || generateCacheKey(prompt, options);
  if (useCache) {
    const cached = responseCache.get(finalCacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.response;
    }
  }

  // Build messages array
  const messages = [{ role: 'user', content: prompt }];

  // Build request body
  const requestBody = {
    model,
    max_tokens: maxTokens,
    messages
  };

  // Add system prompt if provided
  if (systemPrompt) {
    requestBody.system = systemPrompt;
  }

  // Add temperature if not default
  if (temperature !== 0.3) {
    requestBody.temperature = temperature;
  }

  let lastError = null;
  let retryDelay = INITIAL_RETRY_DELAY;

  // Retry loop
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(CLAUDE_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': ANTHROPIC_VERSION,
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || response.statusText;

        // Handle rate limiting
        if (response.status === 429) {
          logger.warn('Rate limited, retrying', { retryDelay, model });
          await sleep(retryDelay);
          retryDelay = Math.min(retryDelay * 2, MAX_RETRY_DELAY);
          lastError = new Error(`Rate limited: ${errorMessage}`);
          continue;
        }

        // Handle other errors
        throw new Error(`Claude API error (${response.status}): ${errorMessage}`);
      }

      const data = await response.json();
      const responseText = data.content?.[0]?.text;

      if (!responseText) {
        throw new Error('No content in Claude response');
      }

      // Cache the response
      if (useCache) {
        responseCache.set(finalCacheKey, {
          response: responseText,
          timestamp: Date.now()
        });
      }

      return responseText;

    } catch (error) {
      lastError = error;
      
      // Don't retry on non-retryable errors
      if (!error.message.includes('Rate limited') && 
          !error.message.includes('timeout') &&
          !error.message.includes('network')) {
        throw error;
      }

      if (attempt < MAX_RETRIES) {
        logger.warn('API call attempt failed, retrying', { attempt, retryDelay, model });
        await sleep(retryDelay);
        retryDelay = Math.min(retryDelay * 2, MAX_RETRY_DELAY);
      }
    }
  }

  throw lastError || new Error('Claude API call failed after all retries');
}

/**
 * Call Claude and parse JSON response
 * @param {string} prompt - The prompt expecting JSON response
 * @param {Object} options - Same options as callClaude
 * @returns {Promise<Object>} Parsed JSON object
 */
export async function callClaudeJSON(prompt, options = {}) {
  const response = await callClaude(prompt, options);
  
  try {
    // Try to extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (!jsonMatch) {
      logger.error('No JSON found in response', new Error('JSON parsing failed'), { responseLength: response.length });
      throw new Error('No JSON found in Claude response');
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    logger.error('Failed to parse Claude JSON response', error instanceof Error ? error : new Error(String(error)));
    throw new Error(`Failed to parse JSON: ${error.message}`);
  }
}

/**
 * Call Claude with an image (Vision API)
 * @param {string} prompt - The text prompt
 * @param {string} imageBase64 - Base64 encoded image data
 * @param {string} mediaType - Image media type (e.g., 'image/png', 'image/jpeg')
 * @param {Object} options - Configuration options
 * @returns {Promise<string>} AI response text
 */
export async function callClaudeWithImage(prompt, imageBase64, mediaType = 'image/png', options = {}) {
  const {
    model = CLAUDE_MODELS.HAIKU,
    systemPrompt = null,
    maxTokens = 1000,
  } = options;

  const apiKey = getApiKey();
  
  if (!apiKey) {
    throw new Error('Claude API key not configured. Please add VITE_CLAUDE_API_KEY to your .env file.');
  }

  // Build messages with image
  const messages = [{
    role: 'user',
    content: [
      {
        type: 'image',
        source: {
          type: 'base64',
          media_type: mediaType,
          data: imageBase64,
        },
      },
      {
        type: 'text',
        text: prompt,
      },
    ],
  }];

  const requestBody = {
    model,
    max_tokens: maxTokens,
    messages,
  };

  if (systemPrompt) {
    requestBody.system = systemPrompt;
  }

  const response = await fetch(CLAUDE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': ANTHROPIC_VERSION,
      'anthropic-dangerous-direct-browser-access': 'true'
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Claude API error (${response.status}): ${errorData.error?.message || response.statusText}`);
  }

  const data = await response.json();
  const responseText = data.content?.[0]?.text;

  if (!responseText) {
    throw new Error('No content in Claude response');
  }

  return responseText;
}

/**
 * Call Claude Vision and parse JSON response
 * @param {string} prompt - The prompt expecting JSON response
 * @param {string} imageBase64 - Base64 encoded image
 * @param {string} mediaType - Image media type
 * @param {Object} options - Same options as callClaudeWithImage
 * @returns {Promise<Object>} Parsed JSON object
 */
export async function callClaudeVisionJSON(prompt, imageBase64, mediaType = 'image/png', options = {}) {
  const response = await callClaudeWithImage(prompt, imageBase64, mediaType, options);
  
  try {
    const jsonMatch = response.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (!jsonMatch) {
      logger.error('No JSON found in vision response', new Error('Vision JSON parsing failed'), { responseLength: response.length });
      throw new Error('No JSON found in Claude response');
    }
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    logger.error('Failed to parse Claude Vision JSON response', error instanceof Error ? error : new Error(String(error)));
    throw new Error(`Failed to parse JSON: ${error.message}`);
  }
}

/**
 * Clear the response cache
 */
export function clearCache() {
  responseCache.clear();
}

/**
 * Check if Claude API is configured
 * @returns {boolean} True if API key is available
 */
export function isClaudeConfigured() {
  return !!getApiKey();
}

// Export default object for convenience
export default {
  callClaude,
  callClaudeJSON,
  callClaudeWithImage,
  callClaudeVisionJSON,
  clearCache,
  isClaudeConfigured,
  CLAUDE_MODELS
};
