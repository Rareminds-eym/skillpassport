import { z } from "zod";
import { getContextUser, withAuth } from "../lib/auth";
import { createLogger } from "../lib/logger";
import { type AdminScope, adminScopesFor, scopeColumn } from "../lib/lte/review-admin";
import { apiError, apiSuccess } from "../lib/response";
import { collegeCandidates, schoolCandidates } from "./internal/lte/v1/actions/review-scope";
import { createReadOnlyDb } from "./internal/lte/v1/readonly-db";
import { listOrgEducators } from "./internal/lte/v1/review-educators";
import { createWriteDb, WriteDbError } from "./internal/lte/v1/write-db";

/**
 * Institution administrators designate any ACTIVE educator of their own
 * organisation as an artifact reviewer for a program/class (for example one
 * that has no teaching educators). Authority is the administrator's active
 * college_admin / school_admin membership; the organisation always comes from
 * that verified scope, never from the request.
 */
const logger = createLogger("lte-review-scope-reviewers");
const MAX_DESIGNATED = 50;
const TABLE = "lte_review_scope_reviewers";
const scopeSchema = z
  .object({
    scopeId: z.string().uuid(),
    scopeType: z.enum(["college_program", "school_class"]),
  })
  .strict();
const reviewerSchema = scopeSchema.extend({ reviewerId: z.string().uuid() }).strict();

interface Designation {
  id: string;
  reviewer_user_id: string;
}

type Resolved = { scope: AdminScope; userId: string } | Response;
type Ctx = Parameters<typeof adminScopesFor>[0] & Parameters<typeof getContextUser>[0];
async function resolveScope(
  context: Ctx,
  input: { scopeId: string; scopeType: AdminScope["scopeType"] },
): Promise<Resolved> {
  const userId = getContextUser(context).id;
  const scopes = await adminScopesFor(context, userId);
  if (scopes instanceof Response) return scopes;
  const scope = scopes.find((s) => s.scopeId === input.scopeId && s.scopeType === input.scopeType);
  // Not-found rather than forbidden: do not reveal other institutions' scopes.
  if (!scope) return apiError(404, "NOT_FOUND", "Scope not found", context.request);
  return { scope, userId };
}

const unavailable = (context: { request: Request }, error: unknown, event: string) => {
  logger.error(event, error as Error);
  return apiError(503, "REVIEWERS_UNAVAILABLE", "Unable to update reviewers", context.request);
};

export const onRequestGet = withAuth(async (context) => {
  const url = new URL(context.request.url);
  const parsed = scopeSchema.safeParse({
    scopeId: url.searchParams.get("scopeId"),
    scopeType: url.searchParams.get("scopeType"),
  });
  if (!parsed.success)
    return apiError(400, "VALIDATION_ERROR", "Invalid request", context.request);
  const resolved = await resolveScope(context, parsed.data);
  if (resolved instanceof Response) return resolved;
  const { scope } = resolved;
  try {
    const db = createReadOnlyDb(context.env);
    const [educators, designations, teachingIds] = await Promise.all([
      listOrgEducators(db, scope.scopeType, scope.organizationId),
      db.query<Designation>(
        `${TABLE}?${scopeColumn(scope.scopeType)}=eq.${scope.scopeId}&select=id,reviewer_user_id&limit=${MAX_DESIGNATED * 2}`,
      ),
      scope.scopeType === "school_class"
        ? schoolCandidates({ db }, { school_class_id: scope.scopeId, school_id: scope.organizationId })
        : collegeCandidates(
          { db },
          { program_id: scope.scopeId, college_id: scope.organizationId, college_class_id: null },
        ),
    ]);
    const designated = new Set(designations.map((d) => d.reviewer_user_id));
    const teaching = new Set(teachingIds ?? []);
    return apiSuccess(
      {
        scopeId: scope.scopeId,
        scopeType: scope.scopeType,
        teachingCount: teaching.size,
        // Only designations that are still active educators of the organisation.
        designatedCount: educators.filter((e) => designated.has(e.userId)).length,
        educators: educators.map((e) => ({
          userId: e.userId,
          name: e.name,
          email: e.email,
          designated: designated.has(e.userId),
          teaching: teaching.has(e.userId),
        })),
      },
      context.request,
    );
  } catch (error) {
    return unavailable(context, error, "lte_review_scope_reviewers_load_failed");
  }
});

export const onRequestPost = withAuth(async (context) => {
  let body: z.infer<typeof reviewerSchema>;
  try {
    body = reviewerSchema.parse(await context.request.json());
  } catch {
    return apiError(400, "VALIDATION_ERROR", "Invalid request", context.request);
  }
  const resolved = await resolveScope(context, body);
  if (resolved instanceof Response) return resolved;
  const { scope, userId } = resolved;
  try {
    // The educator must be ACTIVE in the administrator's own organisation.
    const eligible = await listOrgEducators(createReadOnlyDb(context.env), scope.scopeType, scope.organizationId, [
      body.reviewerId,
    ]);
    if (!eligible.length)
      return apiError(400, "INVALID_REVIEWER", "Choose an active educator of your organization", context.request);
    const db = createWriteDb(context.env);
    const existing = await db.query<Designation>(
      `${TABLE}?${scopeColumn(scope.scopeType)}=eq.${scope.scopeId}&select=id,reviewer_user_id&limit=${MAX_DESIGNATED + 1}`,
    );
    if (!existing.some((d) => d.reviewer_user_id === body.reviewerId)) {
      if (existing.length >= MAX_DESIGNATED)
        return apiError(400, "TOO_MANY_REVIEWERS", `At most ${MAX_DESIGNATED} reviewers per class or program`, context.request);
      try {
        await db.insert(TABLE, {
          [scopeColumn(scope.scopeType)]: scope.scopeId,
          reviewer_user_id: body.reviewerId,
          created_by: userId,
        });
      } catch (error) {
        // A concurrent identical request already added it: the goal is met.
        if (!(error instanceof WriteDbError) || error.code !== "23505") throw error;
      }
      logger.info("lte_review_reviewer_added", {
        actor: `${userId.slice(0, 8)}…`,
        scopeId: scope.scopeId,
        scopeType: scope.scopeType,
        reviewer: `${body.reviewerId.slice(0, 8)}…`,
      });
    }
    return apiSuccess({ designated: true }, context.request);
  } catch (error) {
    return unavailable(context, error, "lte_review_reviewer_add_failed");
  }
});

export const onRequestDelete = withAuth(async (context) => {
  const url = new URL(context.request.url);
  const parsed = reviewerSchema.safeParse({
    scopeId: url.searchParams.get("scopeId"),
    scopeType: url.searchParams.get("scopeType"),
    reviewerId: url.searchParams.get("reviewerId"),
  });
  if (!parsed.success)
    return apiError(400, "VALIDATION_ERROR", "Invalid request", context.request);
  const resolved = await resolveScope(context, parsed.data);
  if (resolved instanceof Response) return resolved;
  const { scope, userId } = resolved;
  try {
    const db = createWriteDb(context.env);
    const row = await db.queryOne<Designation>(
      `${TABLE}?${scopeColumn(scope.scopeType)}=eq.${scope.scopeId}&reviewer_user_id=eq.${parsed.data.reviewerId}&select=id,reviewer_user_id`,
    );
    if (row) {
      await db.remove(TABLE, row.id);
      logger.info("lte_review_reviewer_removed", {
        actor: `${userId.slice(0, 8)}…`,
        scopeId: scope.scopeId,
        scopeType: scope.scopeType,
        reviewer: `${parsed.data.reviewerId.slice(0, 8)}…`,
      });
    }
    return apiSuccess({ designated: false }, context.request);
  } catch (error) {
    return unavailable(context, error, "lte_review_reviewer_remove_failed");
  }
});
