import { withAuth, getContextUser } from "../../lib/auth";
import { getServiceClient } from "../../lib/supabase";
import {
  apiSuccess,
  apiError,
  apiDbError,
  apiMethodNotAllowed,
} from "../../lib/response";
import { z } from "zod";
const preferences = z.object({
  emailNotifications: z.boolean(),
  realtimeAlerts: z.boolean(),
  weeklyReports: z.boolean(),
});
export const onRequest = (context: any) =>
  ["GET", "POST"].includes(context.request.method)
    ? handle(context)
    : apiMethodNotAllowed();
const handle = withAuth(async (context) => {
  const user = getContextUser(context),
    db = getServiceClient(context.env as any);
  const { data: existing, error } = await db
    .from("user_settings")
    .select("notification_preferences")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) return apiDbError(error, context.request);
  if (context.request.method === "GET")
    return apiSuccess(
      {
        preferences: {
          emailNotifications: true,
          realtimeAlerts: true,
          weeklyReports: false,
          ...existing?.notification_preferences?.recruitment,
        },
        security: { mfaAvailable: false, mfaManagedBy: "identity_provider" },
      },
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
  const parsed = preferences.safeParse(body);
  if (!parsed.success)
    return apiError(
      400,
      "VALIDATION_ERROR",
      "All notification preferences must be boolean values",
      context.request,
    );
  const { error: saveError } = await db.rpc("save_recruitment_preferences", {
    p_user_id: user.id,
    p_preferences: parsed.data,
  });
  if (saveError) return apiDbError(saveError, context.request);
  return apiSuccess({ preferences: parsed.data }, context.request);
});
