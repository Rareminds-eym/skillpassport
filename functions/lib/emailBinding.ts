/**
 * Email Worker Binding Helper
 *
 * Provides typed access to the email-worker via Cloudflare Service Binding RPC.
 * Replaces the old HTTP fetch + API key pattern in email-service.ts.
 *
 * Usage:
 *   const worker = getEmailService(env);
 *   await worker.sendEmail({ to: 'user@example.com', subject: '...', html: '...' });
 */

// ─── RPC Interface Types ────────────────────────────────────────────────────────
// These mirror the types in email-worker/src/types.ts.
// Defined locally to avoid cross-project import issues.

export interface SendEmailPayload {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  fromName?: string;
  replyTo?: string;
  cc?: string[];
  bcc?: string[];
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  customMessageId?: string;
  recipient?: string | string[];
  timestamp?: string;
}

export interface SendOTPParams {
  mobileNumber: string;
  countryCode?: string;
  flowType?: 'SMS' | 'WHATSAPP' | 'RCS';
}

export interface VerifyOTPParams {
  mobileNumber: string;
  verificationId: string;
  code: string;
  countryCode?: string;
}

/**
 * Typed interface for the EmailService RPC binding.
 * Mirrors the EmailService WorkerEntrypoint methods.
 */
export interface EmailServiceBinding {
  sendEmail(payload: SendEmailPayload): Promise<SendEmailResult>;
  sendOTP(params: SendOTPParams): Promise<{ verificationId: string; timeout: string }>;
  verifyOTP(params: VerifyOTPParams): Promise<{ verified: boolean; verificationStatus: string }>;
}

// ─── Environment Interface ──────────────────────────────────────────────────────

export interface EmailWorkerEnv {
  /** Service binding to the email-worker (shared-email-api) */
  EMAIL_SERVICE: EmailServiceBinding;
  [key: string]: unknown;
}

// ─── Helper Functions ───────────────────────────────────────────────────────────

/**
 * Get the typed email service binding from the environment.
 *
 * @throws Error if EMAIL_SERVICE binding is not configured
 *
 * @example
 * ```ts
 * const worker = getEmailService(env);
 * await worker.sendEmail({ to: 'user@example.com', subject: 'Hi', html: '<p>Hello</p>' });
 * ```
 */
export function getEmailService(env: EmailWorkerEnv): EmailServiceBinding {
  if (!env.EMAIL_SERVICE) {
    throw new Error(
      'EMAIL_SERVICE binding is not configured. ' +
      'Add [[services]] to wrangler.toml or use --service EMAIL_SERVICE=shared-email-api in local dev.'
    );
  }
  return env.EMAIL_SERVICE;
}

/**
 * Parse an RPC error message to extract the HTTP status code.
 * EmailService methods throw errors with format: "CODE: message"
 */
export function emailRpcErrorToHttpStatus(error: unknown): number {
  const message = error instanceof Error ? error.message : String(error);
  if (message.startsWith('INVALID_INPUT:')) return 400;
  if (message.startsWith('PROVIDER_ERROR:')) return 502;
  if (message.startsWith('INTERNAL_ERROR:')) return 500;
  if (message.includes('binding is not configured')) return 503;
  return 500;
}

/**
 * Build a JSON error response from an RPC error.
 */
export function emailRpcErrorResponse(error: unknown): Response {
  const message = error instanceof Error ? error.message : String(error);
  const status = emailRpcErrorToHttpStatus(error);
  const colonIndex = message.indexOf(':');
  const code = colonIndex > 0 ? message.slice(0, colonIndex).trim() : 'INTERNAL_ERROR';
  const detail = colonIndex > 0 ? message.slice(colonIndex + 1).trim() : message;

  return new Response(
    JSON.stringify({ error: { code, message: detail } }),
    { status, headers: { 'Content-Type': 'application/json' } }
  );
}
