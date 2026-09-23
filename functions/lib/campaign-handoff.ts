import { APPROVED_ORIGINS } from './app-origins';

const STATE_COOKIE = '__Host-rm-campaign-state';
const STATE_ATTRS = 'Secure; HttpOnly; Path=/; SameSite=Lax';
const headers = { 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' };

interface CampaignEnv {
  EDUCATORS_APP_URL?: string;
  SSO_SERVICE: {
    exchangeEducatorCampaignHandoff(input: { code: string; state: string; redirectUri: string }): Promise<{
      refreshToken: string; remainingLifetimeSeconds: number;
    }>;
  };
}

function redirect(location: string, cookies: string[] = []) {
  const result = new Headers({ ...headers, Location: location });
  for (const cookie of cookies) result.append('Set-Cookie', cookie);
  return new Response(null, { status: 303, headers: result });
}

export async function startCampaignHandoff(request: Request, env: CampaignEnv) {
  const origin = new URL(request.url).origin;
  if (!APPROVED_ORIGINS.includes(origin)) return new Response(null, { status: 403 });
  // Do not accept a browser-supplied campaign URL or return URL.
  if (!env.EDUCATORS_APP_URL) return new Response('Campaign connection unavailable', { status: 503, headers });
  const campaign = new URL('/api/handoff', env.EDUCATORS_APP_URL);
  if (campaign.protocol !== 'https:' && !['localhost', '127.0.0.1'].includes(campaign.hostname)) {
    return new Response('Campaign connection unavailable', { status: 503, headers });
  }
  const state = [...crypto.getRandomValues(new Uint8Array(32))].map(v => v.toString(16).padStart(2, '0')).join('');
  campaign.searchParams.set('state', state);
  return redirect(campaign.toString(), [`${STATE_COOKIE}=${state}; ${STATE_ATTRS}; Max-Age=300`]);
}

export async function completeCampaignHandoff(request: Request, env: CampaignEnv) {
  const url = new URL(request.url);
  const clear = `${STATE_COOKIE}=; ${STATE_ATTRS}; Max-Age=0`;
  if (!APPROVED_ORIGINS.includes(url.origin)) return new Response(null, { status: 403 });
  const state = url.searchParams.get('state') || '';
  const code = url.searchParams.get('code') || '';
  const cookies = (request.headers.get('Cookie') || '').split(';').map(v => v.trim())
    .filter(v => v.startsWith(`${STATE_COOKIE}=`));
  if (!/^[a-f0-9]{64}$/.test(state) || cookies.length !== 1 || cookies[0] !== `${STATE_COOKIE}=${state}` ||
      !/^[A-Za-z0-9_-]{43}$/.test(code)) {
    return redirect('/login?error=invalid_campaign_handoff', [clear]);
  }
  try {
    const session = await env.SSO_SERVICE.exchangeEducatorCampaignHandoff({
      code, state, redirectUri: `${url.origin}/api/campaign/callback`,
    });
    if (!/^[A-Za-z0-9_-]{43}$/.test(session.refreshToken) || !Number.isInteger(session.remainingLifetimeSeconds) ||
        session.remainingLifetimeSeconds <= 0 || session.remainingLifetimeSeconds > 604800) {
      throw new Error('Invalid session');
    }
    return redirect('/auth/callback', [
      `__Host-rm-refresh=${session.refreshToken}; Secure; HttpOnly; Path=/; SameSite=Strict; Max-Age=${session.remainingLifetimeSeconds}`,
      clear,
    ]);
  } catch {
    return redirect('/login?error=campaign_handoff_failed', [clear]);
  }
}
