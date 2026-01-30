/**
 * Centralized AI Configuration for Cloudflare Functions
 * 
 * This module provides:
 * - Unified AI model configurations for all use cases
 * - Centralized API calling utilities with retry logic
 * - Common helper functions (JSON parsing, UUID generation, etc.)
 * - Model fallback chains organized by use case
 */

import { PagesEnv } from '../../../src/functions-lib/types';

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface AIModel {
    id: string;
    provider: 'openrouter' | 'claude';
    endpoint?: string;
    maxTokens?: number;
    temperature?: number;
    description?: string;
}

export interface ModelProfile {
    primary: string;
    fallbacks: string[];
    maxTokens?: number;
    temperature?: number;
}

export type ModelUseCase =
    | 'question_generation'
    | 'chat'
    | 'resume_parsing'
    | 'keyword_generation'
    | 'embedding'
    | 'adaptive_assessment';

// ============================================================================
// Model Configurations
// ============================================================================

/**
 * Comprehensive list of available AI models
 */
export const AI_MODELS = {
    // Free Models - Primary choices for question generation
    GEMINI_2_FLASH: 'google/gemini-2.0-flash-001',
    GEMINI_FLASH_EXP: 'google/gemini-2.0-flash-exp:free',
    LLAMA_3_8B: 'meta-llama/llama-3-8b-instruct:free',
    LLAMA_3_2_3B: 'meta-llama/llama-3.2-3b-instruct:free',
    GEMINI_PRO: 'google/gemini-pro',
    GEMINI_FLASH_1_5_8B: 'google/gemini-flash-1.5-8b',
    XIAOMI_MIMO: 'xiaomi/mimo-v2-flash:free',

    // Paid Models - Higher quality
    GPT_4O_MINI: 'openai/gpt-4o-mini',
    CLAUDE_HAIKU: 'claude-3-haiku-20240307',
    CLAUDE_SONNET: 'anthropic/claude-3.5-sonnet',

    // Specialized Models
    EMBEDDING_SMALL: 'openai/text-embedding-3-small',
} as const;

/**
 * Model profiles organized by use case
 * All use cases now use the same consistent set of free OpenRouter models
 */

// Standard model chain for all use cases
// Using Gemini as primary (most reliable free model)
const STANDARD_MODELS = {
    primary: AI_MODELS.GEMINI_2_FLASH,
    fallbacks: [
        AI_MODELS.GEMINI_FLASH_1_5_8B,  // Reliable Gemini variant
        AI_MODELS.GEMINI_PRO,            // Another Gemini fallback
        AI_MODELS.XIAOMI_MIMO,           // Free alternative
    ],
};

export const MODEL_PROFILES: Record<ModelUseCase, ModelProfile> = {
    question_generation: {
        ...STANDARD_MODELS,
        maxTokens: 4000,
        temperature: 0.7,
    },
    chat: {
        ...STANDARD_MODELS,
        maxTokens: 2000,
        temperature: 0.7,
    },
    resume_parsing: {
        ...STANDARD_MODELS,
        maxTokens: 4096,
        temperature: 0.1,
    },
    keyword_generation: {
        ...STANDARD_MODELS,
        maxTokens: 500,
        temperature: 0.3,
    },
    embedding: {
        primary: AI_MODELS.EMBEDDING_SMALL,
        fallbacks: [],
        maxTokens: 8191,
        temperature: 0,
    },
    adaptive_assessment: {
        ...STANDARD_MODELS,
        maxTokens: 3000,
        temperature: 0.7,
    },
};

// ============================================================================
// API Configuration
// ============================================================================

export const API_CONFIG = {
    OPENROUTER: {
        endpoint: 'https://openrouter.ai/api/v1/chat/completions',
        headers: {
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://skillpassport.pages.dev',
            'X-Title': 'SkillPassport Assessment',
        },
    },
    CLAUDE: {
        endpoint: 'https://api.anthropic.com/v1/messages',
        headers: {
            'Content-Type': 'application/json',
            'anthropic-version': '2023-06-01',
        },
    },
    RETRY: {
        maxRetries: 3,
        baseDelay: 1000, // ms
        rateLimit429Delay: 2000, // ms for exponential backoff on 429
    },
} as const;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Delay execution for a specified number of milliseconds
 */
export function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate a UUID v4
 */
export function generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

/**
 * Repair and parse JSON from AI responses
 * Handles common issues like markdown code blocks, trailing commas, etc.
 */
export function repairAndParseJSON(text: string): any {
    // Clean markdown
    let cleaned = text
        .replace(/```json\n?/gi, '')
        .replace(/```\n?/g, '')
        .trim();

    // Find JSON boundaries (object)
    let startIdx = cleaned.indexOf('{');
    let endIdx = cleaned.lastIndexOf('}');

    // If no object, try array
    if (startIdx === -1 || endIdx === -1) {
        startIdx = cleaned.indexOf('[');
        endIdx = cleaned.lastIndexOf(']');
    }

    if (startIdx === -1 || endIdx === -1) {
        throw new Error('No JSON object or array found in response');
    }

    cleaned = cleaned.substring(startIdx, endIdx + 1);

    // Try parsing as-is first
    try {
        return JSON.parse(cleaned);
    } catch (e) {
        console.log('⚠️ Initial JSON parse failed, attempting repair...');
    }

    // Repair common issues
    cleaned = cleaned
        .replace(/,\s*]/g, ']')           // Remove trailing commas in arrays
        .replace(/,\s*}/g, '}')           // Remove trailing commas in objects
        .replace(/[\x00-\x1F\x7F]/g, ' ') // Remove control characters
        .replace(/\n/g, ' ')              // Remove newlines
        .replace(/\r/g, '')               // Remove carriage returns
        .replace(/\t/g, ' ')              // Replace tabs with spaces
        .replace(/"\s*\n\s*"/g, '", "')   // Fix broken string arrays
        .replace(/}\s*{/g, '},{')         // Fix missing commas between objects
        .replace(/]\s*\[/g, '],[')        // Fix missing commas between arrays
        .replace(/"\s+"/g, '","');        // Fix missing commas between strings

    try {
        return JSON.parse(cleaned);
    } catch (e) {
        console.log('⚠️ Repair attempt 1 failed, trying more aggressive repair...');
    }

    // More aggressive: try to extract just the questions array if present
    const questionsMatch = cleaned.match(/"questions"\s*:\s*\[([\s\S]*)\]/);
    if (questionsMatch) {
        try {
            const questionsStr = questionsMatch[1];
            const questions: any[] = [];

            const parts = questionsStr.split(/}\s*,\s*{/);
            for (let i = 0; i < parts.length; i++) {
                let part = parts[i].trim();
                if (!part.startsWith('{')) part = '{' + part;
                if (!part.endsWith('}')) part = part + '}';

                try {
                    const q = JSON.parse(part);
                    questions.push(q);
                } catch (qe) {
                    console.log(`⚠️ Skipping malformed question ${i + 1}`);
                }
            }

            if (questions.length > 0) {
                console.log(`✅ Recovered ${questions.length} questions from malformed JSON`);
                return { questions };
            }
        } catch (e) {
            console.log('⚠️ Questions extraction failed');
        }
    }

    throw new Error('Failed to parse JSON after all repair attempts');
}

/**
 * Get API keys from environment
 */
export function getAPIKeys(env: PagesEnv | Record<string, string>) {
    return {
        openRouter: env.OPENROUTER_API_KEY || env.VITE_OPENROUTER_API_KEY,
        claude: env.CLAUDE_API_KEY || env.VITE_CLAUDE_API_KEY,
    };
}

// ============================================================================
// Core AI API Functions
// ============================================================================

/**
 * Call OpenRouter API with automatic retry and model fallback
 */
export async function callOpenRouterWithRetry(
    openRouterKey: string,
    messages: Array<{ role: string, content: string }>,
    options: {
        models?: string[];
        maxRetries?: number;
        maxTokens?: number;
        temperature?: number;
    } = {}
): Promise<string> {
    const {
        models = [AI_MODELS.GEMINI_2_FLASH, AI_MODELS.LLAMA_3_8B, AI_MODELS.GEMINI_PRO],
        maxRetries = API_CONFIG.RETRY.maxRetries,
        maxTokens = 4000,
        temperature = 0.7,
    } = options;

    let lastError: Error | null = null;

    for (const model of models) {
        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                console.log(`🔄 Trying ${model} (attempt ${attempt + 1}/${maxRetries})`);

                const response = await fetch(API_CONFIG.OPENROUTER.endpoint, {
                    method: 'POST',
                    headers: {
                        ...API_CONFIG.OPENROUTER.headers,
                        'Authorization': `Bearer ${openRouterKey}`,
                    },
                    body: JSON.stringify({
                        model: model,
                        max_tokens: maxTokens,
                        temperature: temperature,
                        messages: messages,
                    }),
                });

                if (response.status === 429) {
                    const waitTime = Math.pow(2, attempt) * API_CONFIG.RETRY.rateLimit429Delay;
                    console.log(`⏳ Rate limited, waiting ${waitTime}ms before retry...`);
                    await delay(waitTime);
                    continue;
                }

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error(`❌ ${model} failed (${response.status}):`, errorText.substring(0, 200));
                    lastError = new Error(`${model} failed: ${response.status}`);
                    break; // Move to next model
                }

                const data = await response.json() as any;
                const content = data.choices?.[0]?.message?.content;
                if (content) {
                    console.log(`✅ ${model} succeeded`);
                    return content;
                }

                lastError = new Error('Empty response from API');
                break; // Move to next model
            } catch (e: any) {
                console.error(`❌ ${model} error:`, e.message);
                lastError = e;
                if (attempt < maxRetries - 1) {
                    await delay(API_CONFIG.RETRY.baseDelay);
                }
            }
        }
    }

    throw lastError || new Error('All models failed');
}

/**
 * Call Claude API directly
 */
export async function callClaudeAPI(
    claudeKey: string,
    messages: Array<{ role: string, content: string }>,
    options: {
        model?: string;
        maxTokens?: number;
        temperature?: number;
        systemPrompt?: string;
    } = {}
): Promise<string> {
    const {
        model = AI_MODELS.CLAUDE_HAIKU,
        maxTokens = 3000,
        temperature = 0.7,
        systemPrompt,
    } = options;

    const response = await fetch(API_CONFIG.CLAUDE.endpoint, {
        method: 'POST',
        headers: {
            ...API_CONFIG.CLAUDE.headers,
            'x-api-key': claudeKey,
        },
        body: JSON.stringify({
            model: model,
            max_tokens: maxTokens,
            temperature: temperature,
            ...(systemPrompt && { system: systemPrompt }),
            messages: messages,
        }),
    });

    if (!response.ok) {
        throw new Error(`Claude API failed: ${response.status}`);
    }

    const data = await response.json() as any;
    return data.content[0].text;
}

/**
 * Call AI with automatic fallback from Claude to OpenRouter
 */
export async function callAIWithFallback(
    env: PagesEnv | Record<string, string>,
    messages: Array<{ role: string, content: string }>,
    options: {
        useCase?: ModelUseCase;
        systemPrompt?: string;
        preferClaude?: boolean;
    } = {}
): Promise<string> {
    const { openRouter, claude } = getAPIKeys(env);
    const { useCase = 'question_generation', systemPrompt, preferClaude = false } = options;

    const profile = MODEL_PROFILES[useCase];
    const models = [profile.primary, ...profile.fallbacks];

    // Try Claude first if preferred and key is available
    if (preferClaude && claude) {
        try {
            console.log('🔑 Using Claude API');
            return await callClaudeAPI(claude, messages, {
                maxTokens: profile.maxTokens,
                temperature: profile.temperature,
                systemPrompt,
            });
        } catch (claudeError: any) {
            console.error('Claude error:', claudeError.message);
            if (!openRouter) {
                throw claudeError;
            }
            console.log('🔑 Claude failed, trying OpenRouter with retry');
        }
    }

    // Use OpenRouter with model fallback
    if (openRouter) {
        return await callOpenRouterWithRetry(openRouter, messages, {
            models,
            maxTokens: profile.maxTokens,
            temperature: profile.temperature,
        });
    }

    throw new Error('No API key configured (OpenRouter or Claude)');
}

/**
 * Get the appropriate model for a specific use case
 */
export function getModelForUseCase(useCase: ModelUseCase): string {
    return MODEL_PROFILES[useCase].primary;
}
