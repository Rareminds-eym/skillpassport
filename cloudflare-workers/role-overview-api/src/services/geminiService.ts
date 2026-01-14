import { Env } from '../types';
import { buildRoleOverviewPrompt, SYSTEM_PROMPT } from '../prompts/roleOverviewPrompt';

/**
 * Call Gemini via OpenRouter as fallback (uses free model)
 */
export async function callGemini(
  roleName: string,
  clusterTitle: string,
  env: Env
): Promise<string> {
  // Use OpenRouter API key (same as primary) for free Gemini model
  const apiKey = env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY not configured');
  }

  const prompt = buildRoleOverviewPrompt(roleName, clusterTitle);

  console.log(`[Gemini-Fallback] Calling OpenRouter free Gemini for: ${roleName}`);

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://skillpassport.rareminds.in',
      'X-Title': 'Role Overview API - Fallback',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.0-flash-exp:free',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      max_tokens: 4000,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[Gemini-Fallback] Error ${response.status}:`, errorText);

    if (response.status === 402) {
      throw new Error('INSUFFICIENT_CREDITS');
    }
    if (response.status === 401) {
      throw new Error('INVALID_API_KEY');
    }
    if (response.status === 429) {
      throw new Error('RATE_LIMITED');
    }

    throw new Error(`Gemini fallback error: ${response.status} - ${errorText}`);
  }

  const data = (await response.json()) as {
    choices: Array<{ message: { content: string } }>;
  };

  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('Empty response from Gemini fallback');
  }

  console.log(`[Gemini-Fallback] Successfully received response for: ${roleName}`);
  return content;
}
