import {
  handleReviewAdminScopes,
  resolveAdminOrganizations,
} from "../../api/internal/lte/v1/actions/review-admin-scopes";
import { createReadOnlyDb } from "../../api/internal/lte/v1/readonly-db";
import type { GatewayContext } from "../../api/internal/lte/v1/types";
import { apiError } from "../response";
import type { PagesEnv } from "../types";

export interface AdminScope {
  scopeId: string;
  scopeType: "college_program" | "school_class";
  organizationId: string;
  name: string;
}

export const scopeColumn = (type: AdminScope["scopeType"]) =>
  type === "school_class" ? "school_class_id" : "college_program_id";

/**
 * The programs/classes the caller administers, from their ACTIVE
 * college_admin / school_admin memberships (the same authority used by review
 * oversight). Returns a 403 Response when the caller has no such role.
 */
export async function adminScopesFor(
  context: { env: PagesEnv; request: Request },
  userId: string,
): Promise<AdminScope[] | Response> {
  const ctx: GatewayContext = {
    db: createReadOnlyDb(context.env),
    env: context.env,
    request: context.request,
    requestId: crypto.randomUUID(),
    userId,
  };
  const result = await handleReviewAdminScopes(ctx, {});
  if (!result.ok) return apiError(403, "FORBIDDEN", result.error.message, context.request);
  return result.data as AdminScope[];
}

export interface AdminOrganization {
  organizationId: string;
  orgType: "school" | "college";
  name: string;
}

/** The schools/colleges the caller administers (active admin membership), with names. */
export async function adminOrganizationsFor(
  context: { env: PagesEnv; request: Request },
  userId: string,
): Promise<AdminOrganization[] | Response> {
  const resolved = await resolveAdminOrganizations({ env: context.env, userId });
  if (!resolved.ok) return apiError(403, "FORBIDDEN", resolved.error.message, context.request);
  const kinds = new Map<string, AdminOrganization["orgType"]>();
  for (const id of resolved.colleges) kinds.set(id, "college");
  for (const id of resolved.schools) kinds.set(id, "school");
  if (!kinds.size) return [];
  const rows = await createReadOnlyDb(context.env).query<{ id: string; name: string | null }>(
    `organizations?id=in.(${[...kinds.keys()].join(",")})&select=id,name&limit=100`,
  );
  return [...kinds].map(([organizationId, orgType]) => ({
    organizationId,
    orgType,
    name: rows.find((r) => r.id === organizationId)?.name || (orgType === "school" ? "School" : "College"),
  }));
}
