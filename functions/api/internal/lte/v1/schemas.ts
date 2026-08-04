import { z } from 'zod';

/**
 * Envelope contract for the LTE ↔ SkillPassport internal gateway.
 * Every request is `{ action, requestId, payload }`; every response is
 * `{ ok, data | error, requestId }`.
 */
export const LteGatewayEnvelopeSchema = z.object({
  action: z
    .string()
    .min(1)
    .max(64)
    .regex(/^[a-z0-9-]+:[a-z0-9-]+$/, 'action must be "<domain>:<verb>" (e.g. learning-track:get)'),
  requestId: z.string().min(1).max(64),
  payload: z.record(z.unknown()).default({}),
});

export type LteGatewayEnvelope = z.infer<typeof LteGatewayEnvelopeSchema>;

/** Actions that operate on a single learner identified by the SSO user id. */
export const UserIdPayloadSchema = z.object({
  userId: z.string().uuid('userId must be a valid UUID'),
});

export type UserIdPayload = z.infer<typeof UserIdPayloadSchema>;
