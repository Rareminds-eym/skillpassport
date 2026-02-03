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
 * @param text - The text to parse
 * @param preferObject - If true, look for objects first; if false, look for arrays first
 */
export function repairAndParseJSON(text: string, preferObject: boolean = false): any {
    // Clean markdown - be more aggressive
    let cleaned = text
        .replace(/```json\s*/gi, '')  // Remove ```json with optional whitespace
        .replace(/```\s*/g, '')        // Remove ``` with optional whitespace
        .trim();

    // Find JSON boundaries - prioritize based on preference
    let startIdx = -1;
    let endIdx = -1;
    let isArray = false;

    if (preferObject) {
        // Try object first (for assessments), then array
        startIdx = cleaned.indexOf('{');
        endIdx = cleaned.lastIndexOf('}');
        isArray = false;

        // If no object found, try array
        if (startIdx === -1 || endIdx === -1) {
            startIdx = cleaned.indexOf('[');
            endIdx = cleaned.lastIndexOf(']');
            isArray = true;
        }
    } else {
        // Try array first (for questions), then object
        startIdx = cleaned.indexOf('[');
        endIdx = cleaned.lastIndexOf(']');
        isArray = true;

        // If no array, try object
        if (startIdx === -1 || endIdx === -1) {
            startIdx = cleaned.indexOf('{');
            endIdx = cleaned.lastIndexOf('}');
            isArray = false;
        }
    }

    if (startIdx === -1 || endIdx === -1) {
        throw new Error('No JSON object or array found in response');
    }

    cleaned = cleaned.substring(startIdx, endIdx + 1);

    // Try parsing as-is first
    try {
        const parsed = JSON.parse(cleaned);
        console.log('✅ JSON parsed successfully on first attempt');
        return parsed;
    } catch (e) {
        console.log('⚠️ Initial JSON parse failed, attempting repair...');
        console.log('📄 First 200 chars:', cleaned.substring(0, 200));
        console.log('📄 Last 100 chars:', cleaned.substring(Math.max(0, cleaned.length - 100)));
    }

    // Repair common issues - but preserve spaces in strings
    let repaired = cleaned
        .replace(/,\s*]/g, ']')           // Remove trailing commas in arrays
        .replace(/,\s*}/g, '}')           // Remove trailing commas in objects
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control chars but keep \n and \t
        .replace(/\r/g, '')               // Remove carriage returns
        .replace(/\t/g, ' ')              // Replace tabs with spaces
        .replace(/}\s*{/g, '},{')         // Fix missing commas between objects
        .replace(/]\s*\[/g, '],[');       // Fix missing commas between arrays

    try {
        const parsed = JSON.parse(repaired);
        console.log('✅ JSON parsed successfully after basic repair');
        return parsed;
    } catch (e) {
        console.log('⚠️ Basic repair failed, trying aggressive repair...');
    }

    // More aggressive: handle newlines in strings more carefully
    // Replace newlines with spaces, but preserve the structure
    repaired = repaired
        .replace(/\n\s*/g, ' ')           // Replace newline + optional spaces with single space
        .replace(/\s{2,}/g, ' ')          // Collapse multiple spaces to one
        .replace(/"\s+"/g, '" "')         // Normalize spaces between quotes
        .replace(/,\s*,/g, ',');          // Remove duplicate commas

    try {
        const parsed = JSON.parse(repaired);
        console.log('✅ JSON parsed successfully after aggressive repair');
        return parsed;
    } catch (e) {
        console.log('⚠️ Aggressive repair failed, trying extraction...');
        console.log('📄 Repaired sample (first 300 chars):', repaired.substring(0, 300));
    }

    // Try to extract questions array if it's wrapped in an object
    const questionsMatch = cleaned.match(/"questions"\s*:\s*\[([\s\S]*)\]/);
    if (questionsMatch) {
        try {
            const questionsStr = questionsMatch[1];
            const questions: any[] = [];

            // Split by question boundaries
            const parts = questionsStr.split(/}\s*,\s*{/);
            for (let i = 0; i < parts.length; i++) {
                let part = parts[i].trim();
                if (!part.startsWith('{')) part = '{' + part;
                if (!part.endsWith('}')) part = part + '}';

                // Clean up the part
                part = part
                    .replace(/,\s*}/g, '}')
                    .replace(/[\x00-\x1F\x7F]/g, ' ')
                    .replace(/\r/g, '')
                    .replace(/\t/g, ' ');

                try {
                    const q = JSON.parse(part);
                    questions.push(q);
                } catch (qe) {
                    console.log(`⚠️ Skipping malformed question ${i + 1}:`, part.substring(0, 100));
                }
            }

            if (questions.length > 0) {
                console.log(`✅ Recovered ${questions.length} questions from malformed JSON`);
                return questions; // Return array directly, not wrapped
            }
        } catch (e) {
            console.log('⚠️ Questions extraction failed:', e);
        }
    }

    // For objects: Try to find the last complete closing brace
    if (!isArray && startIdx !== -1) {
        try {
            // Count braces to find where the object actually ends
            let braceCount = 0;
            let actualEndIdx = -1;
            
            for (let i = startIdx; i < cleaned.length; i++) {
                if (cleaned[i] === '{') braceCount++;
                else if (cleaned[i] === '}') {
                    braceCount--;
                    if (braceCount === 0) {
                        actualEndIdx = i;
                        break;
                    }
                }
            }
            
            if (actualEndIdx !== -1 && actualEndIdx !== endIdx) {
                console.log(`⚠️ Found actual object end at ${actualEndIdx} (was ${endIdx}), attempting parse...`);
                const correctedJson = cleaned.substring(startIdx, actualEndIdx + 1);
                
                // Try parsing the corrected JSON
                const correctedRepaired = correctedJson
                    .replace(/,\s*}/g, '}')
                    .replace(/,\s*]/g, ']')
                    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
                    .replace(/\r/g, '')
                    .replace(/\t/g, ' ')
                    .replace(/\n\s*/g, ' ')
                    .replace(/\s{2,}/g, ' ')
                    .replace(/}\s*{/g, '},{')
                    .replace(/]\s*\[/g, '],[');
                
                const parsed = JSON.parse(correctedRepaired);
                console.log(`✅ Successfully parsed object after brace counting`);
                return parsed;
            }
        } catch (e) {
            console.log('⚠️ Brace counting repair failed:', e);
        }
    }

    // If we got here and it's an array, try to extract individual objects
    if (isArray) {
        try {
            const objects: any[] = [];
            const parts = cleaned.substring(1, cleaned.length - 1).split(/}\s*,\s*{/);
            
            for (let i = 0; i < parts.length; i++) {
                let part = parts[i].trim();
                if (!part.startsWith('{')) part = '{' + part;
                if (!part.endsWith('}')) part = part + '}';

                // Clean up
                part = part
                    .replace(/,\s*}/g, '}')
                    .replace(/[\x00-\x1F\x7F]/g, ' ')
                    .replace(/\r/g, '')
                    .replace(/\t/g, ' ')
                    .replace(/\n/g, ' ');

                try {
                    const obj = JSON.parse(part);
                    objects.push(obj);
                } catch (objError) {
                    console.log(`⚠️ Skipping malformed object ${i + 1}`);
                }
            }

            if (objects.length > 0) {
                console.log(`✅ Recovered ${objects.length} objects from malformed array`);
                return objects;
            }
        } catch (e) {
            console.log('⚠️ Array extraction failed:', e);
        }
    }

    console.error('❌ All repair attempts failed');
    console.error('📄 Cleaned text (first 500 chars):', cleaned.substring(0, 500));
    throw new Error('Failed to parse JSON after all repair attempts');
}

/**
 * Get API keys from environment
 */
export function getAPIKeys(env: PagesEnv | Record<string, string>) {
    return {
        openRouter: env.OPENROUTER_API_KEY || env.OPENROUTER_API_KEY,
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
