/**
 * Claude AI Service
 * Centralized service for all Claude API interactions
 */

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';

// Available Claude models - using current model names that support vision
export const CLAUDE_MODELS = {
  HAIKU: 'claude-3-haiku-20240307',      // Fast, cheap, supports vision
  SONNET: 'claude-3-5-sonnet-latest',    // Best quality for vision tasks
  OPUS: 'claude-3-opus-latest'           // Most capable
};

const DEFAULT_MODEL = CLAUDE_MODELS.HAIKU;

/**
 * Get Claude API key from environment
 */
const getApiKey = () => import.meta.env.VITE_CLAUDE_API_KEY || null;

/**
 * Check if Claude API is configured
 */
export function isClaudeConfigured() {
  return !!getApiKey();
}

/**
 * Call Claude API with text prompt
 */
export async function callClaude(prompt, options = {}) {
  const {
    model = DEFAULT_MODEL,
    systemPrompt = null,
    maxTokens = 1000,
  } = options;

  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('Claude API key not configured. Add VITE_CLAUDE_API_KEY to .env file.');
  }

  const requestBody = {
    model,
    max_tokens: maxTokens,
    messages: [{ role: 'user', content: prompt }]
  };

  if (systemPrompt) {
    requestBody.system = systemPrompt;
  }

  console.log(`🤖 Claude API call - Model: ${model}`);

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

  console.log('✅ Claude response received');
  return responseText;
}

/**
 * Call Claude and parse JSON response
 */
export async function callClaudeJSON(prompt, options = {}) {
  const response = await callClaude(prompt, options);

  try {
    // Remove markdown code blocks if present
    let cleaned = response.replace(/```json\s*/gi, '').replace(/```\s*/gi, '');
    
    // Extract JSON
    const jsonMatch = cleaned.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    // Clean common issues
    const jsonStr = jsonMatch[0]
      .replace(/,\s*}/g, '}')
      .replace(/,\s*]/g, ']');

    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('Failed to parse JSON:', error, '\nResponse:', response.slice(0, 500));
    throw new Error(`Failed to parse JSON: ${error.message}`);
  }
}

/**
 * Call Claude with an image (Vision API)
 * Uses Haiku by default as it's fast and supports vision well
 */
export async function callClaudeWithImage(prompt, imageBase64, mediaType = 'image/png', options = {}) {
  const {
    model = CLAUDE_MODELS.HAIKU, // Haiku works well for vision
    systemPrompt = null,
    maxTokens = 2000,
  } = options;

  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('Claude API key not configured. Add VITE_CLAUDE_API_KEY to .env file.');
  }

  const requestBody = {
    model,
    max_tokens: maxTokens,
    messages: [{
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
    }]
  };

  if (systemPrompt) {
    requestBody.system = systemPrompt;
  }

  console.log(`🤖 Claude Vision API call - Model: ${model}`);

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

  console.log('✅ Claude Vision response received');
  return responseText;
}

/**
 * Call Claude Vision and parse JSON response
 */
export async function callClaudeVisionJSON(prompt, imageBase64, mediaType = 'image/png', options = {}) {
  const response = await callClaudeWithImage(prompt, imageBase64, mediaType, options);

  try {
    // Remove markdown code blocks if present
    let cleaned = response.replace(/```json\s*/gi, '').replace(/```\s*/gi, '');
    
    // Extract JSON
    const jsonMatch = cleaned.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    // Clean common issues
    const jsonStr = jsonMatch[0]
      .replace(/,\s*}/g, '}')
      .replace(/,\s*]/g, ']');

    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('Failed to parse Vision JSON:', error, '\nResponse:', response.slice(0, 500));
    throw new Error(`Failed to parse JSON: ${error.message}`);
  }
}

export default {
  callClaude,
  callClaudeJSON,
  callClaudeWithImage,
  callClaudeVisionJSON,
  isClaudeConfigured,
  CLAUDE_MODELS
};
