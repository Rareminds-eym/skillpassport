import { Env } from '../types';
import { buildRoleOverviewPrompt } from '../prompts/roleOverviewPrompt';

/**
 * Call Gemini API as fallback to generate role overview
 */
export async function callGemini(
  roleName: string,
  clusterTitle: string,
  env: Env
): Promise<string> {
  const apiKey = env.GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  const prompt = buildRoleOverviewPrompt(roleName, clusterTitle);

  console.log(`[Gemini] Calling API for: ${roleName}`);

  // Gemini API endpoint
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: prompt }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1500,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[Gemini] Error ${response.status}:`, errorText);
    
    if (response.status === 400) {
      throw new Error('INVALID_REQUEST');
    }
    if (response.status === 403) {
      throw new Error('INVALID_API_KEY');
    }
    if (response.status === 429) {
      throw new Error('RATE_LIMITED');
    }
    
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json() as {
    candidates: Array<{
      content: {
        parts: Array<{ text: string }>;
      };
    }>;
  };

  const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
  
  if (!content) {
    throw new Error('Empty response from Gemini');
  }

  console.log(`[Gemini] Successfully received response for: ${roleName}`);
  return content;
}
