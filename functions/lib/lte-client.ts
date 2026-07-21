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

export function createLTEClient(env: Record<string, any>): LTEClient {
  const baseUrl = env.LTE_API_URL;
  return new LTEClient({ baseUrl });
}
