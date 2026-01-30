/**
 * Claude API Service
 */

import { CLAUDE_MODEL } from '../config';

export interface ClaudeRequestOptions {
  systemPrompt: string;
  userPrompt: string;
  maxTokens?: number;
  temperature?: number;
}

/**
 * Call Claude API for question generation
 */
export async function callClaudeAPI(
  apiKey: string,
  options: ClaudeRequestOptions
): Promise<string> {
  const { systemPrompt, userPrompt, maxTokens = 4000, temperature = 0.7 } = options;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: maxTokens,
      temperature,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }]
    })
  });

  if (!response.ok) {
    const error = await response.json() as any;
    throw new Error(error.error?.message || `Claude API failed: ${response.status}`);
  }

  const data = await response.json() as any;
  return data.content[0].text;
}
