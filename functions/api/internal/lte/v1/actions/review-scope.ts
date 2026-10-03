import { z } from "zod";
import type { GatewayAction, GatewayContext } from "../types";

const payloadSchema = z.object({}).strict();
interface Learner {
  user_id: string;
  program_id: string | null;
  program_section_id: string | null;
  college_class_id: string | null;
  college_id: string | null;
  school_class_id: string | null;
  school_id: string | null;
}
interface Settings {
  enabled: boolean;
  sla_days: number;
  time_zone: string;
  load_cap: number;
  confidence_threshold: number;
}
interface Educator {
  id: string;
  user_id: string;
}

async function schoolCandidates(
  ctx: GatewayContext,
  learner: Learner,
): Promise<string[] | null> {
  if (!learner.school_class_id || !learner.school_id) return null;
  const classroom = await ctx.db.queryOne<{
    id: string;
    academic_year: string;
  }>(
    `school_classes?id=eq.${learner.school_class_id}&school_id=eq.${learner.school_id}&account_status=eq.active&select=id,academic_year`,
  );
  if (!classroom) return null;
  const assignments = await ctx.db.query<{ educator_id: string }>(
    `school_educator_class_assignments?class_id=eq.${classroom.id}&academic_year=eq.${encodeURIComponent(classroom.academic_year)}&select=educator_id&order=is_primary.desc&limit=100`,
  );
  const ids = [...new Set(assignments.map((row) => row.educator_id))];
  if (!ids.length) return [];
  const educators = await ctx.db.query<Educator>(
    `school_educators?id=in.(${ids.join(",")})&school_id=eq.${learner.school_id}&account_status=eq.active&select=id,user_id`,
  );
  return educators.map((row) => row.user_id);
}

async function collegeCandidates(
  ctx: GatewayContext,
  learner: Learner,
): Promise<string[] | null> {
  if (!learner.program_id) return null;
  const program = await ctx.db.queryOne<{ id: string; department_id: string }>(
    `programs?id=eq.${learner.program_id}&status=eq.active&select=id,department_id`,
  );
  if (!program || !learner.college_id) return null;
  const department = await ctx.db.queryOne<{ id: string }>(
    `departments?id=eq.${program.department_id}&college_id=eq.${learner.college_id}&select=id`,
  );
  if (!department) return null;
  const sections = await ctx.db.query<{ faculty_id: string | null }>(
    `program_sections?program_id=eq.${program.id}&status=eq.active&select=faculty_id&limit=100`,
  );
  // Existing educator APIs treat program_sections.faculty_id as an SSO user
  // ID; college_faculty_class_assignments instead stores lecturer row IDs.
  const userIds = [
    ...new Set(
      sections.map((row) => row.faculty_id).filter((id): id is string => !!id),
    ),
  ];
  const classIds: string[] = [];
  if (learner.college_class_id && learner.college_id) {
    const rows = await ctx.db.query<{ faculty_id: string }>(
      `college_faculty_class_assignments?class_id=eq.${learner.college_class_id}&college_id=eq.${learner.college_id}&select=faculty_id&limit=100`,
    );
    classIds.push(...rows.map((row) => row.faculty_id));
  }
  if (!learner.college_id) return [];
  const predicates = [
    userIds.length ? `user_id.in.(${userIds.join(",")})` : "",
    classIds.length ? `id.in.(${[...new Set(classIds)].join(",")})` : "",
  ].filter(Boolean);
  if (!predicates.length) return [];
  const educators = await ctx.db.query<Educator>(
    `college_lecturers?or=(${predicates.join(",")})&accountStatus=eq.active&collegeId=eq.${learner.college_id}&select=id,user_id`,
  );
  return educators.map((row) => row.user_id);
}

export const handleReviewScope: GatewayAction = async (ctx, payload) => {
  if (!payloadSchema.safeParse(payload).success)
    return {
      ok: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Review scope is resolved from the signed subject.",
      },
    };
  const learners = await ctx.db.query<Learner>(
    `learners?user_id=eq.${ctx.userId}&is_deleted=is.false&select=user_id,program_id,program_section_id,college_class_id,college_id,school_class_id,school_id&limit=2`,
  );
  if (learners.length !== 1) return { ok: true, data: null };
  const learner = learners[0]!;
  // Ambiguous dual enrolment requires explicit operator resolution, not a guess.
  if (learner.program_id && learner.school_class_id)
    return { ok: true, data: null };
  const isSchool = !!learner.school_class_id;
  const scopeId = isSchool ? learner.school_class_id : learner.program_id;
  if (!scopeId) return { ok: true, data: null };
  const candidates = isSchool
    ? await schoolCandidates(ctx, learner)
    : await collegeCandidates(ctx, learner);
  if (!candidates) return { ok: true, data: null };
  const settings = await ctx.db.queryOne<Settings>(
    `lte_review_scope_settings?${isSchool ? "school_class_id" : "college_program_id"}=eq.${scopeId}&select=enabled,sla_days,time_zone,load_cap,confidence_threshold`,
  );
  return {
    ok: true,
    data: {
      scopeId,
      organizationId: isSchool ? learner.school_id : learner.college_id,
      scopeType: isSchool ? "school_class" : "college_program",
      enabled: settings?.enabled ?? false,
      slaDays: settings?.sla_days ?? 3,
      timeZone: settings?.time_zone ?? "Asia/Kolkata",
      loadCap: settings?.load_cap ?? 10,
      threshold: Number(settings?.confidence_threshold ?? 60),
      reviewerIds: [...new Set(candidates)]
        .filter((id) => id !== ctx.userId)
        .slice(0, 100),
    },
  };
};
