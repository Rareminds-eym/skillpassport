import { Env } from '../types';
import { buildRoleOverviewPrompt, SYSTEM_PROMPT } from '../prompts/roleOverviewPrompt';

/**
 * Call OpenRouter API to generate role overview
 */
export async function callOpenRouter(
  roleName: string,
  clusterTitle: string,
  env: Env
): Promise<string> {
  const apiKey = env.OPENROUTER_API_KEY;
  
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY not configured');
  }

  const prompt = buildRoleOverviewPrompt(roleName, clusterTitle);

  console.log(`[OpenRouter] Calling API for: ${roleName}`);

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://skillpassport.rareminds.in',
      'X-Title': 'Role Overview API',
    },
    body: JSON.stringify({
      model: 'xiaomi/mimo-v2-flash:free',
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
    console.error(`[OpenRouter] Error ${response.status}:`, errorText);
    console.error(`[OpenRouter] API Key present: ${!!apiKey}, Key prefix: ${apiKey?.substring(0, 10)}...`);
    
    // Throw specific errors for different status codes
    if (response.status === 402) {
      throw new Error('INSUFFICIENT_CREDITS');
    }
    if (response.status === 401) {
      throw new Error('INVALID_API_KEY');
    }
    if (response.status === 429) {
      throw new Error('RATE_LIMITED');
    }
    if (response.status === 400) {
      throw new Error(`BAD_REQUEST: ${errorText}`);
    }
    
    throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json() as {
    choices: Array<{ message: { content: string } }>;
  };

  const content = data.choices?.[0]?.message?.content;
  
  if (!content) {
    throw new Error('Empty response from OpenRouter');
  }

  console.log(`[OpenRouter] Successfully received response for: ${roleName}`);
  return content;
}
