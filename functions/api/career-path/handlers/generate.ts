/**
 * Career-path handlers (server-side model calls for the admin enrollments
 * flow). Scoped ops: generate (full career-path JSON, 1500 tokens) and chat
 * (follow-up Q&A over a generated path, 500 tokens). Parsing, normalization
 * and fallbacks stay browser-side unchanged.
 */
import { apiError, apiSuccess } from '../../../lib/response';
import { callCloudflareWithRetry, getCloudflareConfig } from '../../shared/ai-config';
import {
  buildCareerPathUserPrompt,
  buildlearnerProfileContext,
  CAREER_PATH_SYSTEM_PROMPT,
  sanitizeLearnerProfile,
} from '../lib/career-path-prompts';

export async function handleGenerateCareerPath(env: unknown, request: Request): Promise<Response> {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return apiError(400, 'VALIDATION_ERROR', 'Invalid JSON body', request);
  }

  const learner = sanitizeLearnerProfile(body.learner);
  if (!learner) {
    return apiError(400, 'VALIDATION_ERROR', 'learner with a name is required', request);
  }

  const cfConfig = getCloudflareConfig(env);
  if (!cfConfig) {
    return apiError(500, 'INTERNAL_ERROR', 'Cloudflare AI binding not configured', request);
  }

  try {
    const text = await callCloudflareWithRetry(
      env,
      [
        { role: 'system', content: CAREER_PATH_SYSTEM_PROMPT },
        { role: 'user', content: buildCareerPathUserPrompt(buildlearnerProfileContext(learner)) },
      ],
      { maxTokens: 1500, temperature: 0.7 },
    );
    if (!text) {
      return apiError(502, 'DEPENDENCY_UNAVAILABLE', 'Empty generation response', request);
    }
    return apiSuccess({ content: text }, request);
  } catch (error) {
    return apiError(
      502,
      'DEPENDENCY_UNAVAILABLE',
      error instanceof Error ? error.message.slice(0, 200) : 'Generation failed',
      request,
    );
  }
}

const MAX_CHAT_SYSTEM = 12000;
const MAX_CHAT_HISTORY = 10;
const MAX_CHAT_INPUT = 2000;

/**
 * Follow-up chat over a generated career path. The system block is assembled
 * browser-side from the generated path + learner data (unchanged template);
 * the server only executes it with fixed allowance. History bounded.
 */
export async function handleCareerPathChat(env: unknown, request: Request): Promise<Response> {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return apiError(400, 'VALIDATION_ERROR', 'Invalid JSON body', request);
  }

  const system = typeof body.system === 'string' ? body.system.slice(0, MAX_CHAT_SYSTEM) : '';
  const input = typeof body.input === 'string' ? body.input.slice(0, MAX_CHAT_INPUT) : '';
  if (!system.trim() || !input.trim()) {
    return apiError(400, 'VALIDATION_ERROR', 'system and input are required', request);
  }
  const history = Array.isArray(body.history)
    ? body.history
        .filter(
          (m): m is { role: string; content: string } =>
            typeof m === 'object' &&
            m !== null &&
            ((m as { role: string }).role === 'user' || (m as { role: string }).role === 'assistant') &&
            typeof (m as { content: string }).content === 'string',
        )
        .slice(-MAX_CHAT_HISTORY)
        .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content.slice(0, MAX_CHAT_INPUT) }))
    : [];

  const cfConfig = getCloudflareConfig(env);
  if (!cfConfig) {
    return apiError(500, 'INTERNAL_ERROR', 'Cloudflare AI binding not configured', request);
  }

  try {
    const text = await callCloudflareWithRetry(
      env,
      [{ role: 'system', content: system }, ...history, { role: 'user', content: input }],
      { maxTokens: 500, temperature: 0.7 },
    );
    return apiSuccess({ message: text || 'Sorry, I could not generate a response.' }, request);
  } catch (error) {
    return apiError(
      502,
      'DEPENDENCY_UNAVAILABLE',
      error instanceof Error ? error.message.slice(0, 200) : 'Generation failed',
      request,
    );
  }
}
