/**
 * Centralized AI Configuration for Cloudflare Functions
 *
 * This module provides:
 * - Unified AI model configurations for all use cases
 * - Centralized API calling utilities with retry logic
 * - Common helper functions (JSON parsing, UUID generation, etc.)
 * - Model fallback chains organized by use case
 */

import { PagesEnv } from '../../lib/types';
import { createLogger } from '../../lib/logger';

const logger = createLogger('ai-config');

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface AIModel {
    id: string;
    provider: 'openrouter';
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
    // OpenAI Models - Primary choices
    GPT_4O_LATEST: 'openai/chatgpt-4o-latest',
    GPT_4O: 'openai/gpt-4o',
    GPT_4O_MINI: 'openai/gpt-4o-mini',
    
    // Free Models - Fallback choices
    GEMINI_2_FLASH: 'google/gemini-2.0-flash-001',
    GEMINI_FLASH_EXP: 'google/gemini-2.0-flash-exp:free',
    LLAMA_3_8B: 'meta-llama/llama-3-8b-instruct:free',
    LLAMA_3_2_3B: 'meta-llama/llama-3.2-3b-instruct:free',
    // GEMINI_PRO: 'google/gemini-pro',  // DEPRECATED: Invalid model ID
    GEMINI_FLASH_1_5_8B: 'google/gemini-flash-1.5-8b',
    // XIAOMI_MIMO: 'xiaomi/mimo-v2-flash:free',  // DEPRECATED: Free period ended

    // Specialized Models
    EMBEDDING_SMALL: 'openai/text-embedding-3-small',
} as const;

/**
 * Model profiles organized by use case
 * Using OpenAI ChatGPT-4o-latest as primary model with fallbacks
 */

// Standard model chain - using models that actually exist on OpenRouter
const STANDARD_MODELS = {
    primary: 'openai/gpt-3.5-turbo',                 // Reliable and affordable
    fallbacks: [
        'openai/gpt-4o-mini',                        // Backup OpenAI model
        'google/gemini-2.0-flash-001',               // Google fallback
    ],
};

export const MODEL_PROFILES: Record<ModelUseCase, ModelProfile> = {
    question_generation: {
        ...STANDARD_MODELS,
        maxTokens: 500,  // Reduced from 2000 to fit within credit limits
        temperature: 0.7,
    },
    chat: {
        ...STANDARD_MODELS,
        maxTokens: 500,  // Reduced from 2000 to fit within credit limits
        temperature: 0.7,
    },
    resume_parsing: {
        ...STANDARD_MODELS,
        maxTokens: 500,  // Reduced from 2000 to fit within credit limits
        temperature: 0.1,
    },
    keyword_generation: {
        ...STANDARD_MODELS,
        maxTokens: 300,  // Reduced from 500 to fit within credit limits
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
        maxTokens: 500,  // Reduced from 1500 to fit within credit limits
        temperature: 0.7,
    },
};

// ============================================================================
// API Configuration
// ============================================================================

export const API_CONFIG = {
    OPENROUTER: {
        endpoint: 'https://openrouter.ai/api/v1/chat/completions',
        embeddingEndpoint: 'https://openrouter.ai/api/v1/embeddings',
        headers: {
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://skillpassport.pages.dev',
            'X-Title': 'SkillPassport Assessment',
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
    console.log(`🔧 [JSON-Parser] Starting JSON repair and parse`);
    console.log(`📏 [JSON-Parser] Input length: ${text.length} characters`);
    console.log(`⚙️ [JSON-Parser] Prefer object: ${preferObject}`);
    console.log(`📝 [JSON-Parser] Input preview (first 200 chars): ${text.substring(0, 200)}`);
    
    // Clean markdown - be more aggressive
    let cleaned = text
        .replace(/```json\s*/gi, '')  // Remove ```json with optional whitespace
        .replace(/```\s*/g, '')        // Remove ``` with optional whitespace
        .trim();

    console.log(`🧹 [JSON-Parser] After markdown cleanup: ${cleaned.length} characters`);

    // Find JSON boundaries - prioritize based on preference
    let startIdx = -1;
    let endIdx = -1;
    let isArray = false;

    if (preferObject) {
        // Try object first (for assessments), then array
        startIdx = cleaned.indexOf('{');
        endIdx = cleaned.lastIndexOf('}');
        isArray = false;
        console.log(`🔍 [JSON-Parser] Looking for object first: start=${startIdx}, end=${endIdx}`);

        // If no object found, try array
        if (startIdx === -1 || endIdx === -1) {
            startIdx = cleaned.indexOf('[');
            endIdx = cleaned.lastIndexOf(']');
            isArray = true;
            console.log(`🔍 [JSON-Parser] No object found, trying array: start=${startIdx}, end=${endIdx}`);
        }
    } else {
        // Try array first (for questions), then object
        startIdx = cleaned.indexOf('[');
        endIdx = cleaned.lastIndexOf(']');
        isArray = true;
        console.log(`🔍 [JSON-Parser] Looking for array first: start=${startIdx}, end=${endIdx}`);

        // If no array, try object
        if (startIdx === -1 || endIdx === -1) {
            startIdx = cleaned.indexOf('{');
            endIdx = cleaned.lastIndexOf('}');
            isArray = false;
            console.log(`🔍 [JSON-Parser] No array found, trying object: start=${startIdx}, end=${endIdx}`);
        }
    }

    if (startIdx === -1 || endIdx === -1) {
        console.error(`❌ [JSON-Parser] No JSON boundaries found`);
        throw new Error('No JSON object or array found in response');
    }

    cleaned = cleaned.substring(startIdx, endIdx + 1);
    console.log(`✂️ [JSON-Parser] Extracted JSON (${cleaned.length} chars): ${cleaned.substring(0, 100)}...`);

    // Try parsing as-is first
    try {
        const parsed = JSON.parse(cleaned);
        console.log('✅ [JSON-Parser] JSON parsed successfully on first attempt');
        console.log(`📊 [JSON-Parser] Result type: ${Array.isArray(parsed) ? 'array' : 'object'}, length/keys: ${Array.isArray(parsed) ? parsed.length : Object.keys(parsed).length}`);
        return parsed;
    } catch (e: any) {
        console.log('⚠️ [JSON-Parser] Initial JSON parse failed, attempting repair...');
        console.log(`🐛 [JSON-Parser] Parse error: ${e.message}`);
        console.log('📄 [JSON-Parser] First 200 chars:', cleaned.substring(0, 200));
        console.log('📄 [JSON-Parser] Last 100 chars:', cleaned.substring(Math.max(0, cleaned.length - 100)));
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

    console.log(`🔧 [JSON-Parser] Applied basic repairs (${repaired.length} chars)`);

    try {
        const parsed = JSON.parse(repaired);
        console.log('✅ [JSON-Parser] JSON parsed successfully after basic repair');
        console.log(`📊 [JSON-Parser] Result type: ${Array.isArray(parsed) ? 'array' : 'object'}, length/keys: ${Array.isArray(parsed) ? parsed.length : Object.keys(parsed).length}`);
        return parsed;
    } catch (e: any) {
        console.log('⚠️ [JSON-Parser] Basic repair failed, trying aggressive repair...');
        console.log(`🐛 [JSON-Parser] Parse error: ${e.message}`);
    }

    // More aggressive: handle newlines in strings more carefully
    // Replace newlines with spaces, but preserve the structure
    repaired = repaired
        .replace(/\n\s*/g, ' ')           // Replace newline + optional spaces with single space
        .replace(/\s{2,}/g, ' ')          // Collapse multiple spaces to one
        .replace(/"\s+"/g, '" "')         // Normalize spaces between quotes
        .replace(/,\s*,/g, ',');          // Remove duplicate commas

    console.log(`🔧 [JSON-Parser] Applied aggressive repairs (${repaired.length} chars)`);

    try {
        const parsed = JSON.parse(repaired);
        console.log('✅ [JSON-Parser] JSON parsed successfully after aggressive repair');
        console.log(`📊 [JSON-Parser] Result type: ${Array.isArray(parsed) ? 'array' : 'object'}, length/keys: ${Array.isArray(parsed) ? parsed.length : Object.keys(parsed).length}`);
        return parsed;
    } catch (e: any) {
        console.log('⚠️ [JSON-Parser] Aggressive repair failed, trying extraction...');
        console.log(`🐛 [JSON-Parser] Parse error: ${e.message}`);
        console.log('📄 [JSON-Parser] Repaired sample (first 300 chars):', repaired.substring(0, 300));
    }

    // Try to extract questions array if it's wrapped in an object
    const questionsMatch = cleaned.match(/"questions"\s*:\s*\[([\s\S]*)\]/);
    if (questionsMatch) {
        console.log('🔍 [JSON-Parser] Found questions array in object wrapper, extracting...');
        try {
            const questionsStr = questionsMatch[1];
            const questions: any[] = [];

            // Split by question boundaries
            const parts = questionsStr.split(/}\s*,\s*{/);
            console.log(`📦 [JSON-Parser] Split into ${parts.length} question parts`);
            
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
                    console.log(`✅ [JSON-Parser] Successfully parsed question ${i + 1}`);
                } catch (qe) {
                    console.log(`⚠️ [JSON-Parser] Skipping malformed question ${i + 1}:`, part.substring(0, 100));
                }
            }

            if (questions.length > 0) {
                console.log(`✅ [JSON-Parser] Recovered ${questions.length} questions from malformed JSON`);
                return questions; // Return array directly, not wrapped
            }
        } catch (e: any) {
            console.log('⚠️ [JSON-Parser] Questions extraction failed:', e.message);
        }
    }

    // For objects: Try to find the last complete closing brace
    if (!isArray && startIdx !== -1) {
        console.log('🔍 [JSON-Parser] Attempting brace counting for object...');
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
                console.log(`🔍 [JSON-Parser] Found actual object end at ${actualEndIdx} (was ${endIdx}), attempting parse...`);
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
                console.log(`✅ [JSON-Parser] Successfully parsed object after brace counting`);
                console.log(`📊 [JSON-Parser] Result keys: ${Object.keys(parsed).length}`);
                return parsed;
            }
        } catch (e: any) {
            console.log('⚠️ [JSON-Parser] Brace counting repair failed:', e.message);
        }
    }

    // If we got here and it's an array, try to extract individual objects
    if (isArray) {
        console.log('🔍 [JSON-Parser] Attempting array object extraction...');
        try {
            const objects: any[] = [];
            const parts = cleaned.substring(1, cleaned.length - 1).split(/}\s*,\s*{/);
            console.log(`� [JSON-Parser] Split array into ${parts.length} object parts`);
            
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
                    console.log(`✅ [JSON-Parser] Successfully parsed object ${i + 1}`);
                } catch (objError) {
                    console.log(`⚠️ [JSON-Parser] Skipping malformed object ${i + 1}`);
                }
            }

            if (objects.length > 0) {
                console.log(`✅ [JSON-Parser] Recovered ${objects.length} objects from malformed array`);
                return objects;
            }
        } catch (e: any) {
            console.log('⚠️ [JSON-Parser] Array extraction failed:', e.message);
        }
    }

    console.error('❌ [JSON-Parser] All repair attempts failed');
    console.error('📄 [JSON-Parser] Final cleaned text (first 500 chars):', cleaned.substring(0, 500));
    throw new Error('Failed to parse JSON after all repair attempts');
}

/**
 * Get API keys from environment with validation
 */
export function getAPIKeys(env: PagesEnv | Record<string, string>) {
    const openRouter = env.OPENROUTER_API_KEY;

    if (!openRouter) {
        logger.error('Missing OPENROUTER_API_KEY environment variable - AI services will not work');
        throw new Error('OPENROUTER_API_KEY is not configured. Set it in your environment variables.');
    }

    logger.debug('API keys validated', { hasOpenRouter: !!openRouter });

    return {
        openRouter,
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
        models = [
            'openai/gpt-3.5-turbo',                  // Reliable and affordable
            'openai/gpt-4o-mini',                    // Backup OpenAI model
            'google/gemini-2.0-flash-001',           // Gemini 2.0 Flash stable
            'meta-llama/llama-3.2-3b-instruct:free', // FREE - Smaller Llama
        ],
        maxRetries = API_CONFIG.RETRY.maxRetries,
        maxTokens = 500,  // Reduced to 500 to fit within credit limits
        temperature = 0.7,
    } = options;

    logger.info('Starting OpenRouter API call', {
        modelsCount: models.length,
        maxTokens,
        temperature,
        maxRetries,
        messagesCount: messages.length,
    });

    let lastError: Error | null = null;
    const startTime = Date.now();

    for (let modelIndex = 0; modelIndex < models.length; modelIndex++) {
        const model = models[modelIndex];
        logger.debug('Trying model', {
            modelIndex: modelIndex + 1,
            totalModels: models.length,
            model,
        });

        for (let attempt = 0; attempt < maxRetries; attempt++) {
            const attemptStartTime = Date.now();
            try {
                logger.debug('Model attempt', {
                    model,
                    attempt: attempt + 1,
                    maxRetries,
                });

                const requestBody = {
                    model: model,
                    max_tokens: maxTokens,
                    temperature: temperature,
                    messages: messages,
                };

                logger.debug('Sending request to OpenRouter');

                const response = await fetch(API_CONFIG.OPENROUTER.endpoint, {
                    method: 'POST',
                    headers: {
                        ...API_CONFIG.OPENROUTER.headers,
                        'Authorization': `Bearer ${openRouterKey}`,
                    },
                    body: JSON.stringify(requestBody),
                });

                const attemptDuration = Date.now() - attemptStartTime;
                logger.debug('Request completed', { duration: attemptDuration, status: response.status });

                if (response.status === 429) {
                    const waitTime = Math.pow(2, attempt) * API_CONFIG.RETRY.rateLimit429Delay;
                    logger.warn('Rate limited, waiting for retry', { model, waitTime, attempt });
                    await delay(waitTime);
                    continue;
                }

                if (!response.ok) {
                    const errorText = await response.text();
                    logger.error('Model request failed', new Error(`${model} failed with status ${response.status}`), {
                        model,
                        status: response.status,
                        errorPreview: errorText.substring(0, 100),
                    });
                    lastError = new Error(`${model} failed: ${response.status} - ${errorText.substring(0, 100)}`);
                    break; // Move to next model
                }

                const data = await response.json() as any;
                logger.debug('Response received and parsed');

                const content = data.choices?.[0]?.message?.content;
                if (content) {
                    const totalDuration = Date.now() - startTime;
                    logger.info('Model request succeeded', {
                        model,
                        totalDuration,
                        contentLength: content.length,
                        promptTokens: data.usage?.prompt_tokens,
                        completionTokens: data.usage?.completion_tokens,
                        totalTokens: data.usage?.total_tokens,
                    });

                    return content;
                }

                logger.warn('Empty response from model', { model });
                lastError = new Error(`Empty response from ${model}`);
                break; // Move to next model
            } catch (e: any) {
                const attemptDuration = Date.now() - attemptStartTime;
                logger.error('Model request error', e, {
                    model,
                    attempt: attempt + 1,
                    maxRetries,
                    duration: attemptDuration,
                });
                lastError = e;
                if (attempt < maxRetries - 1) {
                    const retryDelay = API_CONFIG.RETRY.baseDelay * (attempt + 1);
                    logger.debug('Scheduling retry', { model, retryDelay });
                    await delay(retryDelay);
                }
            }
        }

        logger.warn('Model exhausted all attempts', { model, maxRetries });
    }

    const totalDuration = Date.now() - startTime;
    logger.error('All models failed', lastError || new Error('Unknown error'), {
        totalDuration,
        modelsAttempted: models.length,
        lastErrorMessage: lastError?.message,
    });
    
    throw lastError || new Error('All models failed');
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
    } = {}
): Promise<string> {
    const { openRouter } = getAPIKeys(env);
    const { useCase = 'question_generation' } = options;

    const profile = MODEL_PROFILES[useCase];
    const models = [profile.primary, ...profile.fallbacks];

    // Use OpenRouter with model fallback
    if (openRouter) {
        return await callOpenRouterWithRetry(openRouter, messages, {
            models,
            maxTokens: profile.maxTokens,
            temperature: profile.temperature,
        });
    }

    throw new Error('No API key configured (OpenRouter)');
}

/**
 * Get the appropriate model for a specific use case
 */
export function getModelForUseCase(useCase: ModelUseCase): string {
    return MODEL_PROFILES[useCase].primary;
}
