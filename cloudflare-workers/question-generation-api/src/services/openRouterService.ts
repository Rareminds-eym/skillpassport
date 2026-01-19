/**
 * OpenRouter API Service
 */

import { delay } from '../utils/delay';
import { FREE_MODELS } from '../config';
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
 * Call OpenRouter for adaptive question generation (with model fallback)
 */
export async function callOpenRouterForAdaptive(
  apiKey: string,
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  let lastError: Error | null = null;

  // Try each model until one succeeds
  for (const model of FREE_MODELS) {
    console.log(`🔄 [Adaptive] Trying model: ${model}`);
    
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://skillpassport.pages.dev',
          'X-Title': 'Adaptive Aptitude Test Generator'
        },
        body: JSON.stringify({
          model: model,
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
        lastError = new Error(`${model} failed: ${response.status}`);
        console.error(`❌ [Adaptive] Model ${model} failed:`, response.status, errorText.substring(0, 200));
        continue;
      }

      const data = await response.json() as any;
      const content = data.choices?.[0]?.message?.content;
      
      if (!content) {
        lastError = new Error('Empty response from AI');
        console.error(`❌ [Adaptive] Model ${model} returned empty content`);
        continue;
      }

      console.log(`✅ [Adaptive] Success with model: ${model}`);
      console.log('📝 AI response received, length:', content.length, 'chars');
      return content;
      
    } catch (error) {
      lastError = error as Error;
      console.error(`❌ [Adaptive] Model ${model} error:`, (error as Error).message);
    }
  }

  throw lastError || new Error('All models failed for adaptive question generation');
}
