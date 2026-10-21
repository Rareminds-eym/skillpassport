import { z } from "zod";
import { withAuth, getContextUser } from "../../lib/auth";
import { getServiceClient } from "../../lib/supabase";
import {
  apiSuccess,
  apiError,
  apiDbError,
  apiMethodNotAllowed,
} from "../../lib/response";
import {
  recruitmentScope,
  RecruitmentAccessError,
} from "../../lib/recruitment-scope";
import { getUserRecruitmentRoles, PERMISSIONS } from "../../lib/permissions";
const id = z.string().uuid();
const optionalAmount = z
  .number()
  .finite()
  .nonnegative()
  .max(999999999999)
  .nullable()
  .optional();
const projectInput = z
  .object({
    id: id.optional(),
    title: z.string().trim().min(1).max(200),
    description: z.string().trim().max(20000),
    skills: z.array(z.string().trim().min(1).max(80)).max(30),
    budget_min: optionalAmount,
    budget_max: optionalAmount,
    status: z.enum(["draft", "open", "in_progress", "completed", "cancelled"]),
    deadline: z.string().date().nullable().optional(),
    expectedUpdatedAt: z.string().optional(),
  })
  .refine(
    (p) =>
      p.budget_min == null ||
      p.budget_max == null ||
      p.budget_max >= p.budget_min,
    "Maximum budget must not be lower than minimum budget",
  );
export const onRequest = (context: any) =>
  context.request.method === "POST" ? handle(context) : apiMethodNotAllowed();
const handle = withAuth(async (context) => {
  const user = getContextUser(context),
    db = getServiceClient(context.env as any);
  let body: any;
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
  try {
    const action = z
      .enum([
        "list",
        "detail",
        "save",
        "delete",
        "proposal-save",
        "proposal-delete",
        "milestone-save",
        "milestone-delete",
      ])
      .safeParse(body?.action);
    if (!action.success)
      return apiError(
        400,
        "VALIDATION_ERROR",
        "Unsupported project action",
        context.request,
      );
    const permission =
      body.action === "delete"
        ? PERMISSIONS.DELETE_JOBS
        : body.action === "save"
          ? body.project?.id
            ? PERMISSIONS.EDIT_JOBS
            : PERMISSIONS.CREATE_JOBS
          : [
                "proposal-save",
                "proposal-delete",
                "milestone-save",
                "milestone-delete",
              ].includes(body.action)
            ? PERMISSIONS.MANAGE_CANDIDATES
            : PERMISSIONS.VIEW_CANDIDATES;
    const scope = await recruitmentScope(db, user, permission);
    if (body.action === "list") {
      const { data, error } = await db
        .from("recruitment_projects")
        .select(
          "*,proposals:recruitment_project_proposals(count),milestones:recruitment_project_milestones(count)",
        )
        .eq("organization_id", scope.orgId)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      const roles = (
        await getUserRecruitmentRoles(db, user.id, scope.orgId)
      )[0];
      return apiSuccess(
        {
          projects: data || [],
          permissions: {
            create: !!roles?.can_create_jobs,
            edit: !!roles?.can_edit_jobs,
            delete: !!roles?.can_delete_jobs,
            manage: !!roles?.can_manage_candidates,
          },
        },
        context.request,
      );
    }
    if (body.action === "save") {
      const parsed = projectInput.safeParse(body.project);
      if (!parsed.success)
        return apiError(
          400,
          "VALIDATION_ERROR",
          parsed.error.issues.map((x) => x.message).join("; "),
          context.request,
        );
      const { id: projectId, expectedUpdatedAt, ...values } = parsed.data;
      let q: any;
      if (projectId) {
        const { data: current, error } = await db
          .from("recruitment_projects")
          .select("id,updated_at")
          .eq("id", projectId)
          .eq("organization_id", scope.orgId)
          .maybeSingle();
        if (error) throw error;
        if (!current)
          return apiError(
            404,
            "NOT_FOUND",
            "Project not found",
            context.request,
          );
        if (!expectedUpdatedAt || current.updated_at !== expectedUpdatedAt)
          return apiError(
            409,
            "PROJECT_CHANGED",
            "Refresh this project before editing it",
            context.request,
          );
        q = db
          .from("recruitment_projects")
          .update({ ...values, updated_at: new Date().toISOString() })
          .eq("id", projectId)
          .eq("organization_id", scope.orgId)
          .eq("updated_at", expectedUpdatedAt);
      } else
        q = db.from("recruitment_projects").insert({
          ...values,
          organization_id: scope.orgId,
          created_by: user.id,
        });
      const { data, error } = await q.select().maybeSingle();
      if (error) throw error;
      if (!data)
        return apiError(
          409,
          "PROJECT_CHANGED",
          "Project changed; refresh and retry",
          context.request,
        );
      return apiSuccess({ project: data }, context.request);
    }
    const projectId = id.safeParse(body.projectId);
    if (!projectId.success)
      return apiError(
        400,
        "VALIDATION_ERROR",
        "A valid project is required",
        context.request,
      );
    const { data: project, error: lookup } = await db
      .from("recruitment_projects")
      .select("*")
      .eq("id", projectId.data)
      .eq("organization_id", scope.orgId)
      .maybeSingle();
    if (lookup) throw lookup;
    if (!project)
      return apiError(404, "NOT_FOUND", "Project not found", context.request);
    if (body.action === "detail") {
      const [proposals, milestones] = await Promise.all([
        db
          .from("recruitment_project_proposals")
          .select("*,learner:learners(id,name)")
          .eq("project_id", project.id)
          .order("created_at", { ascending: false }),
        db
          .from("recruitment_project_milestones")
          .select("*")
          .eq("project_id", project.id)
          .order("created_at"),
      ]);
      if (proposals.error) throw proposals.error;
      if (milestones.error) throw milestones.error;
      return apiSuccess(
        {
          project,
          proposals: proposals.data || [],
          milestones: milestones.data || [],
        },
        context.request,
      );
    }
    if (body.action === "delete") {
      const { data, error } = await db.rpc("recruitment_delete_draft_project", {
        p_project_id: project.id,
        p_org: scope.orgId,
      });
      if (error) throw error;
      if (data?.error)
        return apiError(409, "PROJECT_IN_USE", data.error, context.request);
      return apiSuccess(data, context.request);
    }
    const milestone =
      body.action === "milestone-save" || body.action === "milestone-delete";
    const table = milestone
      ? "recruitment_project_milestones"
      : "recruitment_project_proposals";
    if (
      body.action === "proposal-delete" ||
      body.action === "milestone-delete"
    ) {
      const rowId = id.parse(body.id);
      const version = z
        .string()
        .datetime({ offset: true })
        .safeParse(body.expectedUpdatedAt);
      if (!version.success)
        return apiError(
          409,
          "RECORD_CHANGED",
          "Refresh this record before deleting it",
          context.request,
        );
      const { data: row, error } = await db
        .from(table)
        .select("id,status")
        .eq("id", rowId)
        .eq("project_id", project.id)
        .maybeSingle();
      if (error) throw error;
      if (!row)
        return apiError(404, "NOT_FOUND", "Record not found", context.request);
      if (["accepted", "approved"].includes(row.status))
        return apiError(
          409,
          "RECORD_IN_USE",
          "Accepted work is retained in project history",
          context.request,
        );
      const { data: deleted, error: deleteError } = await db
        .from(table)
        .delete()
        .eq("id", rowId)
        .eq("project_id", project.id)
        .eq("updated_at", version.data)
        .select("id")
        .maybeSingle();
      if (deleteError) throw deleteError;
      if (!deleted)
        return apiError(
          409,
          "RECORD_CHANGED",
          "Record changed; refresh and retry",
          context.request,
        );
      return apiSuccess({ deleted: true }, context.request);
    }
    if (body.action === "milestone-save" || body.action === "proposal-save") {
      const schema = milestone
        ? z.object({
            id: id.optional(),
            expectedUpdatedAt: z.string().datetime({ offset: true }).optional(),
            title: z.string().trim().min(1).max(200),
            description: z.string().max(10000).default(""),
            amount: optionalAmount,
            due_date: z.string().date().nullable().optional(),
            status: z.enum(["planned", "in_progress", "submitted", "approved"]),
          })
        : z.object({
            id: id.optional(),
            expectedUpdatedAt: z.string().datetime({ offset: true }).optional(),
            learner_id: id,
            amount: optionalAmount,
            cover_letter: z.string().max(10000).default(""),
            status: z.enum([
              "submitted",
              "shortlisted",
              "accepted",
              "rejected",
              "withdrawn",
            ]),
          });
      const parsed = schema.safeParse(body.record);
      if (!parsed.success)
        return apiError(
          400,
          "VALIDATION_ERROR",
          parsed.error.issues.map((x) => x.message).join("; "),
          context.request,
        );
      const { id: recordId, expectedUpdatedAt, ...values } = parsed.data;
      if (recordId && !expectedUpdatedAt)
        return apiError(
          409,
          "RECORD_CHANGED",
          "Refresh this record before editing it",
          context.request,
        );
      if (!milestone && values.status === "accepted") {
        if (!recordId)
          return apiError(
            400,
            "VALIDATION_ERROR",
            "Save a proposal before accepting it",
            context.request,
          );
        const { data, error } = await db.rpc("recruitment_accept_proposal", {
          p_project_id: project.id,
          p_proposal_id: recordId,
          p_organization_id: scope.orgId,
          p_expected_updated_at: expectedUpdatedAt,
        });
        if (error) throw error;
        if (!data)
          return apiError(
            404,
            "NOT_FOUND",
            "Proposal not found",
            context.request,
          );
        if (data.error)
          return apiError(
            409,
            data.code === "RECORD_CHANGED"
              ? "RECORD_CHANGED"
              : "PROJECT_CLOSED",
            String(data.error),
            context.request,
          );
        return apiSuccess({ record: data }, context.request);
      }
      const q = recordId
        ? db
            .from(table)
            .update({ ...values, updated_at: new Date().toISOString() })
            .eq("id", recordId)
            .eq("project_id", project.id)
            .eq("updated_at", expectedUpdatedAt)
        : db.from(table).insert({ ...values, project_id: project.id });
      const { data, error } = await q.select().maybeSingle();
      if (error) throw error;
      if (!data)
        return apiError(
          409,
          "RECORD_CHANGED",
          "Record changed; refresh and retry",
          context.request,
        );
      return apiSuccess({ record: data }, context.request);
    }
    return apiError(
      400,
      "BAD_REQUEST",
      "Unknown project action",
      context.request,
    );
  } catch (error) {
    if ((error as any)?.code === "23514")
      return apiError(
        409,
        "PROJECT_HISTORY",
        "Agreed work and closed project records are retained in history",
        context.request,
      );
    if (error instanceof RecruitmentAccessError)
      return apiError(403, "FORBIDDEN", error.message, context.request);
    if (error instanceof z.ZodError)
      return apiError(
        400,
        "VALIDATION_ERROR",
        "Invalid project record",
        context.request,
      );
    return apiDbError(error, context.request);
  }
});
