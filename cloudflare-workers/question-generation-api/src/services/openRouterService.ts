/**
 * OpenRouter API Service
 */

import { delay } from '../utils/delay';
import { FREE_MODELS, OPENROUTER_MODEL } from '../config';
import type { AIMessage } from '../types';

/**
 * Call OpenRouter with retry and model fallback (for career assessment)
 */
export async function callOpenRouterWithRetry(
  apiKey: string,
  messages: AIMessage[],
  maxRetries: number = 3
): Promise<string> {
  let lastError: Error | null = null;
  
  for (const model of FREE_MODELS) {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        console.log(`🔄 Trying ${model} (attempt ${attempt + 1}/${maxRetries})`);
        
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'HTTP-Referer': 'https://skillpassport.pages.dev',
            'X-Title': 'SkillPassport Assessment'
          },
          body: JSON.stringify({
            model: model,
            max_tokens: 4000,
            temperature: 0.7,
            messages: messages
          })
        });

        if (response.status === 429) {
          const waitTime = Math.pow(2, attempt) * 2000;
          console.log(`⏳ Rate limited, waiting ${waitTime}ms before retry...`);
          await delay(waitTime);
          continue;
        }

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`❌ ${model} failed (${response.status}):`, errorText.substring(0, 200));
          lastError = new Error(`${model} failed: ${response.status}`);
          break;
        }

        const data = await response.json() as any;
        const content = data.choices?.[0]?.message?.content;
        if (content) {
          console.log(`✅ ${model} succeeded`);
          return content;
        }
        
        lastError = new Error('Empty response from API');
        break;
      } catch (e: any) {
        console.error(`❌ ${model} error:`, e.message);
        lastError = e;
        if (attempt < maxRetries - 1) {
          await delay(1000);
        }
      }
    }
  }
  
  throw lastError || new Error('All models failed');
}

/**
 * Call OpenRouter for adaptive question generation (uses GPT-4o-mini)
 */
export async function callOpenRouterForAdaptive(
  apiKey: string,
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://skillpassport.pages.dev',
      'X-Title': 'Adaptive Aptitude Test Generator'
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 4000,
      temperature: 0.7,
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ OpenRouter API failed:', response.status, errorText.substring(0, 200));
    throw new Error(`OpenRouter API failed: ${response.status}`);
  }

  const data = await response.json() as any;
  const content = data.choices?.[0]?.message?.content;
  
  if (!content) {
    console.error('❌ Empty response from AI. Full response:', JSON.stringify(data).substring(0, 500));
    throw new Error('Empty response from AI');
  }

  console.log('📝 AI response received, length:', content.length, 'chars');
  return content;
}
