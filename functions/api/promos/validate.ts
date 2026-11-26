import { getServiceClient } from '../../lib/supabase';
import { signupPromoValid } from '../../lib/signup-promo';
import type { PagesFunction } from '../../lib/types';

const headers = { 'Cache-Control': 'no-store' };
const reply = (value: unknown, status = 200) => Response.json(value, { status, headers });
export const onRequestPost: PagesFunction = async ({ request, env }) => {
  let code: string, role: string;
  try {
    if (!request.headers.get('Content-Type')?.startsWith('application/json')) return reply({ error: 'Invalid request.' }, 400);
    const reader = request.body?.getReader(); if (!reader) return reply({ error: 'Invalid request.' }, 400);
    let size = 0, text = ''; const decoder = new TextDecoder();
    try { for (;;) { const chunk = await reader.read(); if (chunk.done) break;
      size += chunk.value.length; if (size > 512) { await reader.cancel(); return reply({ error: 'Invalid request.' }, 400); }
      text += decoder.decode(chunk.value, { stream: true });
    } } finally { reader.releaseLock(); }
    const body = JSON.parse(text + decoder.decode());
    if (!body || typeof body.code !== 'string' || typeof body.role !== 'string' || body.code.length > 100 || body.role.length > 50) return reply({ error: 'Invalid request.' }, 400);
    code = body.code.trim().toUpperCase(); role = body.role;
    if (!code) return reply({ valid: false });
  } catch { return reply({ error: 'Invalid request.' }, 400); }
  try {
    // Return no campaign, pricing, personal data or remaining quota to anonymous visitors.
    return reply({ valid: await signupPromoValid(getServiceClient(env), code, role) });
  } catch { return reply({ error: 'Unable to verify the promo code. Please try again.' }, 503); }
};
