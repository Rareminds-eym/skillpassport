import { z } from 'zod';
import { serializeCanonicalInput } from '@rareminds-eym/ai-protocol';
export const VideoIntentSchema = z.object({ jobId: z.string().uuid(), actorId: z.string().min(1).max(256), requestHash: z.string().regex(/^[a-f0-9]{64}$/) }).strict();
export type VideoIntent = z.infer<typeof VideoIntentSchema>;
const EnvelopeSchema = z.object({ version: z.literal(1), issuedAt: z.number().int(), expiresAt: z.number().int(), intent: VideoIntentSchema }).strict();
export interface ScheduledVideoRequest { body: string; signature: string }
export interface VideoJobService { enqueue(request: ScheduledVideoRequest): Promise<{ jobId: string; workflowId: string }> }
const bytes = (text: string) => new TextEncoder().encode(text);
async function key(secret: string, usage: KeyUsage) {
  if (secret.length < 32) throw new Error('DEPENDENCY_UNAVAILABLE: Video scheduling secret is not configured');
  return crypto.subtle.importKey('raw', bytes(secret), { name: 'HMAC', hash: 'SHA-256' }, false, [usage]);
}
export async function signVideoIntent(secret: string, intent: VideoIntent, now = Date.now()): Promise<ScheduledVideoRequest> {
  const body = serializeCanonicalInput(EnvelopeSchema.parse({ version: 1, issuedAt: now, expiresAt: now + 60000, intent }));
  const signature = Array.from(new Uint8Array(await crypto.subtle.sign('HMAC', await key(secret, 'sign'), bytes(body))), x => x.toString(16).padStart(2, '0')).join('');
  return { body, signature };
}
export async function verifyVideoIntent(secret: string, request: ScheduledVideoRequest, now = Date.now()): Promise<VideoIntent> {
  if (typeof request?.body !== 'string' || bytes(request.body).byteLength > 4096 || !/^[a-f0-9]{64}$/.test(request.signature ?? '')) throw new Error('UNAUTHORIZED: Invalid video scheduling request');
  const signature = Uint8Array.from(request.signature.match(/../g)!, part => parseInt(part, 16));
  if (!await crypto.subtle.verify('HMAC', await key(secret, 'verify'), signature, bytes(request.body))) throw new Error('UNAUTHORIZED: Invalid video scheduling signature');
  const parsed = EnvelopeSchema.parse(JSON.parse(request.body));
  if (parsed.issuedAt > now || parsed.expiresAt <= now || parsed.expiresAt - parsed.issuedAt > 60000 || parsed.expiresAt <= parsed.issuedAt) throw new Error('UNAUTHORIZED: Expired video scheduling request');
  return parsed.intent;
}
