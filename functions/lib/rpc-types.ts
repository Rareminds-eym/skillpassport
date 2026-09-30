/**
 * RPC type definitions for Cloudflare service bindings
 * Minimal typed surface for SSO_SERVICE used by heal-user + get-active-subscription
 */

export interface SsoWorkerRpc {
  // User lookups
  getUserByEmail(email: string): Promise<{ id: string; email: string; is_email_verified: boolean } | null>;
  getUserById(userId: string): Promise<{ id: string; email: string; is_email_verified: boolean; is_blocked: boolean; user_metadata: Record<string, unknown> | null; created_at: string; last_login_at: string | null } | null>;
  getOrganizationById(orgId: string): Promise<{ id: string; name: string; slug: string | null; metadata: Record<string, unknown> | null; created_at: string } | null>;
  getUserMemberships(userId: string): Promise<{ memberships: { id: string; org_id: string; role: string; status: string }[] }>;
  // Subscriptions
  getUserSubscription(userId: string): Promise<{ subscription: Record<string, unknown> | null; plan: Record<string, unknown> | null }>;
  syncSubscription(userId: string): Promise<{ subscription: Record<string, unknown> | null; plan: Record<string, unknown> | null }>;
  syncPlans(): Promise<{ plans: Record<string, unknown>[] }>;
  listRoles(): Promise<{ roles: { id: string; name: string; description: string | null }[] }>;
  // Generic fallback for other RPCs
  [key: string]: (...args: any[]) => Promise<any>;
}

export interface PaymentWorkerRpc {
  [key: string]: (...args: any[]) => Promise<any>;
}

export interface EmailWorkerRpc {
  [key: string]: (...args: any[]) => Promise<any>;
}

export interface EmbeddingWorkerRpc {
  [key: string]: (...args: any[]) => Promise<any>;
}

export interface RealtimeEventsQueue {
  send(message: unknown): Promise<void>;
  sendBatch(messages: unknown[]): Promise<void>;
}
