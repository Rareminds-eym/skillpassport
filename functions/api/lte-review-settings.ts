import { z } from "zod";
import { getContextUser, withAuth } from "../lib/auth";
import { createLogger } from "../lib/logger";
import {
  type AdminOrganization,
  adminOrganizationsFor,
  adminScopesFor,
} from "../lib/lte/review-admin";
import { apiError, apiSuccess } from "../lib/response";
import { createReadOnlyDb } from "./internal/lte/v1/readonly-db";
import { createWriteDb, WriteDbError } from "./internal/lte/v1/write-db";

/**
 * An institution administrator chooses, ONCE for their whole organisation
 * (school or college), whether LTE artifact submissions are evaluated by AI
 * first or go straight to a human reviewer. It applies to every learner of the
 * organisation, whatever the course, class or program.
 *
 * Authority: an ACTIVE college_admin / school_admin membership of that
 * organisation (the same rule as review oversight). The organisation is only
 * ever taken from the caller's verified memberships, never trusted from input.
 */
const logger = createLogger("lte-review-settings");
const TABLE = "lte_review_org_settings";
const modeSchema = z.enum(["ai_first", "human_only"]);
const updateSchema = z
  .object({ organizationId: z.string().uuid(), evaluationMode: modeSchema })
  .strict();

interface OrgSettingsRow {
  id: string;
  organization_id: string;
  evaluation_mode: "ai_first" | "human_only";
}

export const onRequestGet = withAuth(async (context) => {
  const userId = getContextUser(context).id;
  try {
    const organizations = await adminOrganizationsFor(context, userId);
    if (organizations instanceof Response) return organizations;
    const rows = organizations.length
      ? await createReadOnlyDb(context.env).query<OrgSettingsRow>(
        `${TABLE}?organization_id=in.(${organizations.map((o) => o.organizationId).join(",")})&select=id,organization_id,evaluation_mode`,
      )
      : [];
    // Programs/classes are listed only so the admin can pick reviewers for one.
    const scopes = await adminScopesFor(context, userId);
    return apiSuccess(
      {
        organizations: organizations.map((org) => ({
          organizationId: org.organizationId,
          orgType: org.orgType,
          name: org.name,
          evaluationMode:
            rows.find((r) => r.organization_id === org.organizationId)?.evaluation_mode ??
            "ai_first",
        })),
        scopes:
          scopes instanceof Response
            ? []
            : scopes.map(({ scopeId, scopeType, name }) => ({ scopeId, scopeType, name })),
      },
      context.request,
    );
  } catch (error) {
    logger.error("lte_review_org_settings_load_failed", error as Error);
    return apiError(503, "SETTINGS_UNAVAILABLE", "Unable to load the setting", context.request);
  }
});

export const onRequestPut = withAuth(async (context) => {
  let body: z.infer<typeof updateSchema>;
  try {
    body = updateSchema.parse(await context.request.json());
  } catch {
    return apiError(400, "VALIDATION_ERROR", "Invalid request", context.request);
  }
  const user = getContextUser(context);
  let organization: AdminOrganization | undefined;
  try {
    const organizations = await adminOrganizationsFor(context, user.id);
    if (organizations instanceof Response) return organizations;
    organization = organizations.find((o) => o.organizationId === body.organizationId);
  } catch (error) {
    logger.error("lte_review_org_mode_authorize_failed", error as Error);
    return apiError(503, "SETTINGS_UNAVAILABLE", "Unable to save the setting", context.request);
  }
  // Not-found rather than forbidden: do not reveal other institutions.
  if (!organization) return apiError(404, "NOT_FOUND", "Organization not found", context.request);

  const patch = {
    evaluation_mode: body.evaluationMode,
    updated_by: user.id,
    updated_at: new Date().toISOString(),
  };
  let previous: OrgSettingsRow["evaluation_mode"] = "ai_first";
  try {
    const db = createWriteDb(context.env);
    const lookup = () =>
      db.queryOne<OrgSettingsRow>(
        `${TABLE}?organization_id=eq.${organization.organizationId}&select=id,organization_id,evaluation_mode`,
      );
    const existing = await lookup();
    previous = existing?.evaluation_mode ?? "ai_first";
    if (existing) await db.update(TABLE, existing.id, patch);
    else {
      try {
        await db.insert(TABLE, { organization_id: organization.organizationId, ...patch });
      } catch (error) {
        // Two admins saving a brand-new organisation at once: the loser hits the
        // unique constraint, so apply its choice to the row that now exists.
        if (!(error instanceof WriteDbError) || error.code !== "23505") throw error;
        const winner = await lookup();
        if (!winner) throw error;
        await db.update(TABLE, winner.id, patch);
      }
    }
  } catch (error) {
    logger.error("lte_review_org_mode_save_failed", error as Error);
    return apiError(503, "SETTINGS_UNAVAILABLE", "Unable to save the setting", context.request);
  }
  logger.info("lte_review_org_mode_changed", {
    actor: `${user.id.slice(0, 8)}…`,
    organizationId: organization.organizationId,
    orgType: organization.orgType,
    from: previous,
    to: body.evaluationMode,
  });
  return apiSuccess(
    {
      organizationId: organization.organizationId,
      evaluationMode: body.evaluationMode,
    },
    context.request,
  );
});
