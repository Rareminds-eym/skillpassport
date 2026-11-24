import { z } from "zod";
import { withAuth, getContextUser } from "../../lib/auth";
import { getServiceClient } from "../../lib/supabase";
import {
  recruitmentScope,
  RecruitmentAccessError,
} from "../../lib/recruitment-scope";
import { PERMISSIONS } from "../../lib/permissions";
import {
  apiSuccess,
  apiError,
  apiDbError,
  apiMethodNotAllowed,
} from "../../lib/response";
import { requireSubscriptionAccess } from "../../shared/lib/subscription-access";
const digest = async (token: string) =>
  Array.from(
    new Uint8Array(
      await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token)),
    ),
    (b) => b.toString(16).padStart(2, "0"),
  ).join("");
export async function onRequest(context: any) {
  if (context.request.method !== "POST") return apiMethodNotAllowed();
  let body: any;
  try {
    body = await context.request.clone().json();
  } catch {
    return apiError(400, "VALIDATION_ERROR", "Invalid JSON", context.request);
  }
  if (body.action === "read") {
    if (
      !z
        .string()
        .regex(/^[a-f0-9]{64}$/)
        .safeParse(body.token).success
    )
      return apiError(
        404,
        "NOT_FOUND",
        "This link is unavailable or expired",
        context.request,
      );
    const db = getServiceClient(context.env as any);
    const { data: list, error } = await db
      .from("shortlists")
      .select("id,name,description,share_expiry")
      .eq("share_token_hash", await digest(body.token))
      .eq("shared", true)
      .gt("share_expiry", new Date().toISOString())
      .maybeSingle();
    if (error) return apiDbError(error, context.request);
    if (!list)
      return apiError(
        404,
        "NOT_FOUND",
        "This link is unavailable or expired",
        context.request,
      );
    const result = await db
      .from("shortlist_candidates")
      .select("learner_id")
      .eq("shortlist_id", list.id);
    if (result.error) return apiDbError(result.error, context.request);
    const ids = result.data.map((row) => row.learner_id);
    const learners = ids.length
      ? await db
          .from("zoho_recruiter_learners")
          .select("id,user_id,name,university,branch_field")
          .in("id", ids)
      : { data: [], error: null };
    if (learners.error) return apiDbError(learners.error, context.request);
    const candidates=z.array(z.object({id:z.string().uuid(),user_id:z.string().uuid(),name:z.string().nullable(),
      university:z.string().nullable(),branch_field:z.string().nullable()}).strict()).safeParse(learners.data);
    if(!candidates.success)return apiError(503,'SERVICE_UNAVAILABLE','Shared candidate identity is unavailable',context.request);
    if(candidates.data.some(candidate=>!ids.includes(candidate.id)))return apiError(503,'SERVICE_UNAVAILABLE','Shared candidate scope differs',context.request);
    const settings=candidates.data.length?await db.from('user_settings').select('user_id,privacy_settings')
      .in('user_id',[...new Set(candidates.data.map(candidate=>candidate.user_id))]):{data:[],error:null};
    if(settings.error)return apiDbError(settings.error,context.request);
    const consent=z.array(z.object({user_id:z.string().uuid(),privacy_settings:z.unknown()}).strict()).safeParse(settings.data);
    if(!consent.success||new Set(consent.data.map(row=>row.user_id)).size!==consent.data.length
      ||consent.data.some(row=>!candidates.data.some(candidate=>candidate.user_id===row.user_id)))return apiError(503,'SERVICE_UNAVAILABLE','Shared candidate consent is unavailable',context.request);
    const publicCandidates=candidates.data.filter(candidate=>{
      const value=z.object({profileVisibility:z.literal('public')}).passthrough().safeParse(consent.data.find(row=>row.user_id===candidate.user_id)?.privacy_settings);
      return value.success;
    }).map(({name,university,branch_field})=>({name,university,branch_field}));
    const response = apiSuccess(
      {
        name: list.name,
        description: list.description,
        expiresAt: list.share_expiry,
        candidates: publicCandidates,
      },
      context.request,
    );
    response.headers.set("Cache-Control", "no-store");
    response.headers.set("Referrer-Policy", "no-referrer");
    return response;
  }
  return authenticated(context);
}
const authenticated = withAuth(async (context) => {
  try {
    const db = getServiceClient(context.env as any),
      user = getContextUser(context),
      scope = await recruitmentScope(db, user, PERMISSIONS.MANAGE_CANDIDATES);
    const access=await requireSubscriptionAccess({env:context.env,request:context.request,actorId:user.id,
      subject:{kind:'organization',id:scope.orgId},mode:'write'});
    if(access instanceof Response)return access;
    const parsed = z
      .object({
        action: z.enum(["generate", "revoke"]),
        id: z.string().min(1).max(200),
        expiryDays: z.number().int().min(1).max(90).default(30),
      })
      .safeParse(await context.request.json());
    if (!parsed.success)
      return apiError(
        400,
        "VALIDATION_ERROR",
        "Choose a shortlist and an expiry of 1–90 days",
        context.request,
      );
    if (!scope.shortlistIds.includes(parsed.data.id))
      return apiError(
        404,
        "NOT_FOUND",
        "Shortlist unavailable",
        context.request,
      );
    if (parsed.data.action === "revoke") {
      const { error } = await db
        .from("shortlists")
        .update({
          shared: false,
          share_token_hash: null,
          share_link: null,
          share_expiry: null,
        })
        .eq("id", parsed.data.id);
      if (error) return apiDbError(error, context.request);
      return apiSuccess({ revoked: true }, context.request);
    }
    const token = Array.from(crypto.getRandomValues(new Uint8Array(32)), (b) =>
      b.toString(16).padStart(2, "0"),
    ).join("");
    const expiry = new Date(
        Date.now() + parsed.data.expiryDays * 86400000,
      ).toISOString(),
      path = "/shared/shortlist";
    const { error } = await db
      .from("shortlists")
      .update({
        shared: true,
        share_token_hash: await digest(token),
        share_organization_id: scope.orgId,
        share_link: path,
        share_expiry: expiry,
        include_pii: false,
        notify_on_access: false,
      })
      .eq("id", parsed.data.id);
    if (error) return apiDbError(error, context.request);
    const response = apiSuccess(
      { link: new URL(path, context.request.url).href + "#" + token, expiry },
      context.request,
    );
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    if (error instanceof RecruitmentAccessError)
      return apiError(403, "FORBIDDEN", error.message, context.request);
    return apiDbError(error, context.request);
  }
});
