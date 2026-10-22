/**
 * Internal evidence API — `POST /api/internal/evidence`.
 *
 * Authorized, read-only learner evidence for the AI worker. The worker
 * signs the request body; this endpoint verifies the signature, derives
 * ownership from the authenticated actor, and returns a provenance-carrying
 * evidence bundle.
 *
 * Status contract (each outcome is distinct, never collapsed):
 *   200 — evidence returned; a kind with no data is listed in `missing`
 *   400 — malformed request, unknown field, disallowed kind, bad hash
 *   401 — missing/invalid signature, expired request
 *   403 — wrong audience, wrong product, unreviewed task, tenant scope,
 *          unknown resource kind, resource the actor does not own, replay
 *   500 — the endpoint is not configured (fails closed)
 *   503 — the evidence store is unavailable
 *
 * This endpoint is read-only by construction: it exposes no write path and
 * accepts no table, column or URL from the caller.
 */

import type { PagesFunction, PagesEnv } from '../../lib/types';
import { apiError, apiSuccess } from '../../lib/response';
import { createSupabaseAdminClient } from '../../lib/supabase';
import { buildCareerEvidence } from '../career/context/evidence';
import { buildLessonEvidence } from './lesson-evidence';
import { buildCourseEvidence } from './course-evidence';
import {
  EVIDENCE_MAX_BODY_BYTES,
  EvidenceAuthError,
  assertEvidenceTaskAllowed,
  assertEvidenceKindsAllowed,
  awaitEvidence,
  assertEvidenceTenantUnsupported,
  assertResourceKindsAllowed,
  getEvidenceSecret,
  parseEvidenceRequest,
  readBoundedBody,
  verifyEvidenceBody,
  verifyRequestHash,
} from './evidence-auth';
import { EvidenceReplayError, claimEvidenceNonce } from './evidence-nonce';

export const onRequestPost: PagesFunction<PagesEnv> = async (context) => {
  const { request, env } = context;
  const startedAt = Date.now();
  let requestHash: string | undefined;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4000);

  try {
    const secret = getEvidenceSecret(env);

    // Bound the body while reading it, in bytes: the cap must hold before
    // the body is materialized as a string.
    const body = await readBoundedBody(request, EVIDENCE_MAX_BODY_BYTES, controller.signal);
    if (body === null) {
      return apiError(400, 'BAD_REQUEST', 'Evidence request body is too large', request);
    }

    await verifyEvidenceBody(secret, body, request.headers.get('x-evidence-signature'));

    let decoded: unknown;
    try {
      decoded = JSON.parse(body);
    } catch {
      return apiError(400, 'BAD_REQUEST', 'Evidence request body is not valid JSON', request);
    }

    const parsed = parseEvidenceRequest(decoded);

    // The audit hash ties the logs to the exact bytes that were signed.
    await verifyRequestHash(body, request.headers.get('x-evidence-request-hash'));
    requestHash = request.headers.get('x-evidence-request-hash')!.toLowerCase();

    // Structural validity is not authorization: the task must be reviewed,
    // tenancy must be verifiable (it is not), and every resource kind must
    // be one this product can ownership-check.
    assertEvidenceTaskAllowed(parsed.task);
    assertEvidenceKindsAllowed(parsed.task, parsed.kinds);
    assertEvidenceTenantUnsupported(parsed.tenantId);
    assertResourceKindsAllowed(parsed.resources, parsed.task);

    const supabase = createSupabaseAdminClient(env, { abortSignal: controller.signal });

    // Claim the nonce before any read: one signed request, at most one
    // serving. A duplicate is a replay (403); a store failure is an outage.
    await awaitEvidence(claimEvidenceNonce(supabase, parsed.nonce, parsed.expiresAt), controller.signal);

    const projection = parsed.task === 'senior-educator.suggest' ? buildLessonEvidence : parsed.task === 'senior-educator.tutor-chat' ? buildCourseEvidence : buildCareerEvidence;
    const result = await awaitEvidence(projection(
      supabase,
      {
        actorId: parsed.actorId,
        kinds: parsed.kinds,
        resources: parsed.resources,
      },
      startedAt,
    ), controller.signal);

    if (result.forbiddenResources.length > 0) {
      // Never echo the resource ids back beyond the count.
      console.warn('[evidence] refused resources not owned by the actor', {
        count: result.forbiddenResources.length,
      });
      return apiError(403, 'FORBIDDEN', 'Requested resource is not owned by this user', request);
    }

    // Log shape only — never the body, the actor id or the evidence.
    console.info('[evidence] served', {
      requestHash,
      task: parsed.task,
      kinds: parsed.kinds.length,
      items: result.bundle.evidence.length,
      missing: result.bundle.missing.length,
      durationMs: Date.now() - startedAt,
    });

    const response = apiSuccess(result.bundle, request, { startTime: startedAt });
    response.headers.set('X-Evidence-Request-Hash', requestHash);
    return response;
  } catch (error) {
    if (error instanceof EvidenceAuthError) {
      console.warn('[evidence] rejected', { code: error.code, status: error.status, requestHash });
      return apiError(error.status, error.code, error.message, request, { startTime: startedAt });
    }
    if (error instanceof EvidenceReplayError) {
      console.warn('[evidence] replay refused', { requestHash });
      return apiError(403, 'FORBIDDEN', 'Evidence request has already been used', request, {
        startTime: startedAt,
      });
    }
    console.error('[evidence] unavailable', {
      requestHash,
      message: error instanceof Error ? error.message : 'unknown error',
      durationMs: Date.now() - startedAt,
    });
    return apiError(503, 'UNAVAILABLE', 'Evidence service is unavailable', request, {
      startTime: startedAt,
    });
  } finally {
    clearTimeout(timer);
  }
};

export const onRequest = async (context: Parameters<PagesFunction<PagesEnv>>[0]) => {
  if (context.request.method !== 'POST') {
    return apiError(405, 'METHOD_NOT_ALLOWED', 'Method not allowed', context.request);
  }
  return onRequestPost(context);
};
