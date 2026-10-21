import { z } from "zod";
import { withAuth, getContextUser } from "../../lib/auth";
import { getServiceClient } from "../../lib/supabase";
import { getActiveOrgId } from "../../lib/org-ownership";
import { verifyOrgAccess, PERMISSIONS } from "../../lib/permissions";
import {
  apiSuccess,
  apiError,
  apiDbError,
  apiMethodNotAllowed,
} from "../../lib/response";
export const onRequest = (context: any) =>
  ["GET", "POST"].includes(context.request.method)
    ? handle(context)
    : apiMethodNotAllowed();
const handle = withAuth(async (context) => {
  const user = getContextUser(context),
    db = getServiceClient(context.env as any),
    orgId = await getActiveOrgId(db, user);
  if (!orgId)
    return apiError(
      403,
      "FORBIDDEN",
      "An active organization is required",
      context.request,
    );
  const member = await verifyOrgAccess(db, user.id, orgId);
  if (!member.allowed)
    return apiError(
      403,
      "FORBIDDEN",
      "Active membership is required",
      context.request,
    );
  const { data: settings, error } = await db
    .from("organization_recruitment_settings")
    .select("max_recruiters,metadata")
    .eq("organization_id", orgId)
    .maybeSingle();
  if (error) return apiDbError(error, context.request);
  const management = await verifyOrgAccess(
    db,
    user.id,
    orgId,
    PERMISSIONS.MANAGE_TEAM,
  );
  if (context.request.method === "GET")
    return apiSuccess(
      {
        canManage: management.allowed,
        maxRecruiters: settings?.max_recruiters || 10,
        requireApproval: settings?.metadata?.require_approval === true,
      },
      context.request,
    );
  if (!management.allowed)
    return apiError(
      403,
      "FORBIDDEN",
      "An organization administrator must save team settings",
      context.request,
    );
  let body: unknown;
  try {
    body = await context.request.json();
  } catch {
    return apiError(
      400,
      "VALIDATION_ERROR",
      "Invalid JSON body",
      context.request,
    );
  }
  const parsed = z
    .object({
      maxRecruiters: z.number().int().min(1).max(50),
      requireApproval: z.boolean(),
    })
    .safeParse(body);
  if (!parsed.success)
    return apiError(
      400,
      "VALIDATION_ERROR",
      "Choose 1–50 recruiters and a valid approval preference",
      context.request,
    );
  const { error: saveError } = await db.rpc("save_recruitment_team_settings", {
    p_organization_id: orgId,
    p_max_recruiters: parsed.data.maxRecruiters,
    p_require_approval: parsed.data.requireApproval,
  });
  if (saveError) return apiDbError(saveError, context.request);
  return apiSuccess(parsed.data, context.request);
});
