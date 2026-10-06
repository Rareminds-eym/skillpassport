/**
 * Centralized AI Configuration for Cloudflare Functions
 *
 * This module provides:
 * - Unified AI model configurations for all use cases
 * - Centralized API calling utilities with retry logic
 * - Common helper functions (JSON parsing, UUID generation, etc.)
 * - Model fallback chains organized by use case
 */

import { createLogger } from '../../lib/logger';
import { createCloudflareClient, CF_FALLBACK_MODEL, CF_PRIMARY_MODEL, type CfAiBinding } from './cloudflare-ai.js';

const logger = createLogger('ai-config');

// ============================================================================
// Cloudflare model configuration (Stage G: sole provider)
// ============================================================================

/**
 * Default Cloudflare model chain: GLM-4.7 Flash primary, Nemotron-3 bounded
 * fallback. Pre-cutover OpenRouter chains are recorded in git history.
 */
export { CF_PRIMARY_MODEL, CF_FALLBACK_MODEL };

// ============================================================================
// API Configuration
// ============================================================================

export const API_CONFIG = {
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

// ============================================================================
// Cloudflare Workers AI path (Stage G: sole provider)
// ============================================================================

/** Default Cloudflare model chain: GLM primary, Nemotron bounded fallback. */
export const CLOUDFLARE_MODELS = [CF_PRIMARY_MODEL, CF_FALLBACK_MODEL];

export interface CloudflareEnvConfig {
    ai: CfAiBinding;
    gatewayId?: string;
}

/**
 * Resolve the Cloudflare AI binding from any env shape without touching the
 * string-only PagesEnv/Record<string,string> signatures. Returns null (never
 * throws) when the binding is absent so optional-report callers stay
 * non-fatal. Real secret values are never read or logged here.
 */
export function getCloudflareConfig(env: unknown): CloudflareEnvConfig | null {
    if (typeof env !== 'object' || env === null) return null;
    const rec = env as Record<string, unknown>;
    const ai = rec.AI as CfAiBinding | undefined;
    if (!ai || typeof ai.run !== 'function') {
        logger.debug('Cloudflare AI binding not configured');
        return null;
    }
    const gatewayId = typeof rec.AI_GATEWAY_ID === 'string' && rec.AI_GATEWAY_ID !== '' ? rec.AI_GATEWAY_ID : undefined;
    return { ai, gatewayId };
}

function isCloudflareAdvanceable(error: unknown): boolean {
    if (!(error instanceof Error)) return false;
    return (
        error.message.startsWith('DEPENDENCY_UNAVAILABLE:') ||
        error.message.startsWith('DOWNSTREAM_TIMEOUT:') ||
        error.message.startsWith('INVALID_MODEL_OUTPUT:')
    );
}

/**
 * Call Cloudflare Workers AI with GLM → Nemotron fallback
 * (returns raw text, models tried in order, retryable
 * transport failures advance) minus the API key: auth is the binding.
 * Throws when the binding is absent — callers decide fatal vs non-fatal.
 */
export async function callCloudflareWithRetry(
    env: unknown,
    messages: Array<{ role: string, content: string }>,
    options: {
        models?: string[];
        maxTokens?: number;
        temperature?: number;
        timeoutMs?: number;
    } = {}
): Promise<string> {
    const config = getCloudflareConfig(env);
    if (!config) {
        throw new Error('Cloudflare AI binding is not configured. Bind AI and set AI_GATEWAY_ID.');
    }
    const {
        models = CLOUDFLARE_MODELS,
        maxTokens = 500,
        temperature = 0.7,
        timeoutMs = 60000,
    } = options;

    logger.info('Starting Cloudflare AI call', {
        modelsCount: models.length,
        maxTokens,
        temperature,
        timeoutMs,
        messagesCount: messages.length,
    });

    const client = createCloudflareClient({ ai: config.ai, gatewayId: config.gatewayId });
    let lastError: Error | null = null;
    for (const model of models) {
        try {
            const out = await client.complete(model, messages, { maxTokens, temperature, timeoutMs });
            logger.info('Cloudflare model request succeeded', { model, contentLength: out.text.length });
            return out.text;
        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));
            logger.warn('Cloudflare model attempt failed', { model, error: lastError.message });
            if (!isCloudflareAdvanceable(error)) throw lastError;
        }
    }
    throw lastError || new Error('All Cloudflare models failed');
}
