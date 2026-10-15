/**
 * LTE Client - HTTP Service for inter-service communication
 *
 * Basic HTTP client for making requests to LTE service
 * (Learning & Teaching Environment)
 */

export interface LTEClientConfig {
  baseUrl: string;
  timeout?: number;
}

export class LTEClient {
  private baseUrl: string;
  private timeout: number;

  constructor(config: LTEClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
    this.timeout = config.timeout || 30000;
  }

  async request<T>(endpoint: string, payload: any): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    return response.json() as Promise<T>;
  }
}

import type { Env } from './types';

export function createLTEClient(env: Env): LTEClient {
  const baseUrl = env.LTE_APP_URL;
  return new LTEClient({ baseUrl });
}

/** A capability as returned by LTE `POST /api/v1/capabilities`. */
export interface LteCapability {
  id: string;
  /** Original formal name. Never replaced by the display name. */
  name: string;
  /** Short learner-facing name. Omitted by LTE when `display_name` is NULL. */
  displayName?: string;
  code?: string;
  description?: string;
}

export type LteRoleCapabilitiesResult =
  | { ok: true; capabilities: LteCapability[] }
  | { ok: false; reason: string };

const LTE_CAPABILITIES_TIMEOUT_MS = 5000;

/**
 * Fetches a role's capabilities (including `displayName`) from LTE.
 * Never throws: any failure is returned as `{ ok: false, reason }`.
 * An empty capability list is a success (`ok: true`).
 */
export async function fetchLteRoleCapabilities(
  env: { LTE_APP_URL?: unknown },
  roleId: string,
  timeoutMs: number = LTE_CAPABILITIES_TIMEOUT_MS,
): Promise<LteRoleCapabilitiesResult> {
  const baseUrl = typeof env.LTE_APP_URL === 'string' ? env.LTE_APP_URL.trim().replace(/\/$/, '') : '';
  if (!baseUrl) {
    return { ok: false, reason: 'LTE_APP_URL not configured' };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${baseUrl}/api/v1/capabilities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roleId }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      return { ok: false, reason: `LTE responded ${response.status}: ${errorText.substring(0, 200)}` };
    }

    const body = (await response.json()) as { success?: unknown; capabilities?: unknown };
    if (body?.success !== true || !Array.isArray(body.capabilities)) {
      return { ok: false, reason: 'LTE returned an unexpected payload' };
    }
    return { ok: true, capabilities: body.capabilities as LteCapability[] };
  } catch (error) {
    return { ok: false, reason: error instanceof Error ? error.message : String(error) };
  } finally {
    clearTimeout(timeoutId);
  }
}
