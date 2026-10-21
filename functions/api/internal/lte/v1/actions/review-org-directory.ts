import { z } from "zod";
import type { GatewayAction } from "../types";
import { resolveAdminOrganizations } from "./review-admin-scopes";
import { listOrgEducators } from "../review-educators";

/**
 * Who belongs to the organisations the signed administrator administers:
 * their learners (with class/program names) and their active educators.
 * LTE uses this to show every review of the organisation and to offer any
 * educator of the organisation as an assignee.
 *
 * The organisations come only from the caller's ACTIVE college_admin /
 * school_admin memberships, never from the payload.
 */
const MAX_LEARNERS = 5000;

interface LearnerRow {
  user_id: string;
  name: string | null;
  email: string | null;
  school_id: string | null;
  college_id: string | null;
  program_id: string | null;
  school_class_id: string | null;
}

export const handleReviewOrgDirectory: GatewayAction = async (ctx, payload) => {
  if (!z.object({}).strict().safeParse(payload).success)
    return {
      ok: false,
      error: { code: "VALIDATION_ERROR", message: "Unexpected directory parameters" },
    };
  const resolved = await resolveAdminOrganizations(ctx);
  if (!resolved.ok) return resolved;
  const { colleges, schools } = resolved;
  const organizationIds = [...new Set([...colleges, ...schools])];
  if (!organizationIds.length)
    return { ok: true, data: { organizations: [], learners: [], educators: [], truncated: false } };

  const [orgRows, collegeLearners, schoolLearners] = await Promise.all([
    ctx.db.query<{ id: string; name: string | null }>(
      `organizations?id=in.(${organizationIds.join(",")})&select=id,name&limit=100`,
    ),
    colleges.length
      ? ctx.db.query<LearnerRow>(
          `learners?college_id=in.(${colleges.join(",")})&is_deleted=is.false&select=user_id,name,email,school_id,college_id,program_id,school_class_id&limit=${MAX_LEARNERS + 1}`,
        )
      : Promise.resolve([] as LearnerRow[]),
    schools.length
      ? ctx.db.query<LearnerRow>(
          `learners?school_id=in.(${schools.join(",")})&is_deleted=is.false&select=user_id,name,email,school_id,college_id,program_id,school_class_id&limit=${MAX_LEARNERS + 1}`,
        )
      : Promise.resolve([] as LearnerRow[]),
  ]);
  const byUser = new Map<string, LearnerRow>();
  for (const row of [...collegeLearners, ...schoolLearners]) byUser.set(row.user_id, row);
  const truncated =
    collegeLearners.length > MAX_LEARNERS ||
    schoolLearners.length > MAX_LEARNERS ||
    byUser.size > MAX_LEARNERS;
  const learnerRows = [...byUser.values()].slice(0, MAX_LEARNERS);

  const programIds = [...new Set(learnerRows.map((l) => l.program_id).filter((v): v is string => !!v))];
  const classIds = [...new Set(learnerRows.map((l) => l.school_class_id).filter((v): v is string => !!v))];
  const chunks = <T,>(ids: string[], load: (part: string[]) => Promise<T[]>) =>
    Promise.all(
      Array.from({ length: Math.ceil(ids.length / 50) }, (_, i) => load(ids.slice(i * 50, i * 50 + 50))),
    ).then((parts) => parts.flat());
  const [programs, classes, collegeEducators, schoolEducators] = await Promise.all([
    chunks(programIds, (part) =>
      ctx.db.query<{ id: string; name: string }>(`programs?id=in.(${part.join(",")})&select=id,name`),
    ),
    chunks(classIds, (part) =>
      ctx.db.query<{ id: string; name: string; academic_year: string | null }>(
        `school_classes?id=in.(${part.join(",")})&select=id,name,academic_year`,
      ),
    ),
    Promise.all(
      colleges.map(async (organizationId) =>
        (await listOrgEducators(ctx.db, "college_program", organizationId)).map((e) => ({ ...e, organizationId })),
      ),
    ).then((rows) => rows.flat()),
    Promise.all(
      schools.map(async (organizationId) =>
        (await listOrgEducators(ctx.db, "school_class", organizationId)).map((e) => ({ ...e, organizationId })),
      ),
    ).then((rows) => rows.flat()),
  ]);
  const programName = new Map(programs.map((p) => [p.id, p.name]));
  const className = new Map(
    classes.map((c) => [c.id, c.academic_year ? `${c.name} · ${c.academic_year}` : c.name]),
  );
  const orgName = new Map(orgRows.map((o) => [o.id, o.name ?? ""]));

  return {
    ok: true,
    data: {
      organizations: organizationIds.map((id) => ({
        id,
        name: orgName.get(id) || (schools.includes(id) ? "School" : "College"),
        orgType: schools.includes(id) ? "school" : "college",
      })),
      learners: learnerRows.map((l) => {
        const isSchool = !!l.school_id && schools.includes(l.school_id);
        return {
          userId: l.user_id,
          name: l.name || l.email || "Learner",
          email: l.email,
          organizationId: (isSchool ? l.school_id : l.college_id) as string,
          scopeName:
            (l.school_class_id && className.get(l.school_class_id)) ||
            (l.program_id && programName.get(l.program_id)) ||
            null,
        };
      }),
      educators: [...collegeEducators, ...schoolEducators],
      truncated,
    },
  };
};
