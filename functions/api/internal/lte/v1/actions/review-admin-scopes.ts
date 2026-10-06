import { z } from "zod";
import type { GatewayAction, GatewayContext } from "../types";

interface MembershipAuthority {
  getUserById(
    id: string,
  ): Promise<{ is_blocked: boolean; is_email_verified: boolean } | null>;
  getUserMemberships(id: string): Promise<{
    memberships: Array<{
      org_id: string;
      role: string;
      roles?: string[];
      status: string;
    }>;
  }>;
}

/**
 * The organisations the caller administers, from their ACTIVE college_admin /
 * school_admin memberships (and a live, verified, unblocked SSO account).
 */
export async function resolveAdminOrganizations(
  ctx: Pick<GatewayContext, "env" | "userId">,
): Promise<
  | { ok: true; colleges: string[]; schools: string[] }
  | { ok: false; error: { code: string; message: string } }
> {
  const authority = ctx.env.SSO_SERVICE as unknown as MembershipAuthority;
  const [user, result] = await Promise.all([
    authority.getUserById(ctx.userId),
    authority.getUserMemberships(ctx.userId),
  ]);
  if (!user || user.is_blocked || !user.is_email_verified)
    return {
      ok: false,
      error: { code: "FORBIDDEN", message: "Administrator access is inactive" },
    };
  const colleges = result.memberships
    .filter(
      (m) =>
        m.status === "active" &&
        (m.roles ?? [m.role]).includes("college_admin"),
    )
    .map((m) => m.org_id);
  const schools = result.memberships
    .filter(
      (m) =>
        m.status === "active" && (m.roles ?? [m.role]).includes("school_admin"),
    )
    .map((m) => m.org_id);
  return { ok: true, colleges, schools };
}

export const handleReviewAdminScopes: GatewayAction = async (ctx, payload) => {
  if (!z.object({}).strict().safeParse(payload).success)
    return {
      ok: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Unexpected scope parameters",
      },
    };
  const resolved = await resolveAdminOrganizations(ctx);
  if (!resolved.ok) return resolved;
  const { colleges, schools } = resolved;
  const scopes: Array<{
    scopeId: string;
    scopeType: "college_program" | "school_class";
    organizationId: string;
    name: string;
  }> = [];
  if (colleges.length) {
    const departments = await ctx.db.query<{ id: string; college_id: string }>(
      `departments?college_id=in.(${colleges.join(",")})&select=id,college_id&limit=1000`,
    );
    if (departments.length) {
      const programs = await ctx.db.query<{
        id: string;
        department_id: string;
        name: string;
      }>(
        `programs?department_id=in.(${departments.map((d) => d.id).join(",")})&status=eq.active&select=id,department_id,name&limit=1000`,
      );
      for (const program of programs) {
        const department = departments.find(
          (d) => d.id === program.department_id,
        );
        if (department)
          scopes.push({
            scopeId: program.id,
            scopeType: "college_program",
            organizationId: department.college_id,
            name: program.name,
          });
      }
    }
  }
  if (schools.length) {
    const classes = await ctx.db.query<{
      id: string;
      school_id: string;
      name: string;
      academic_year: string;
    }>(
      `school_classes?school_id=in.(${schools.join(",")})&account_status=eq.active&select=id,school_id,name,academic_year&limit=1000`,
    );
    scopes.push(
      ...classes.map((row) => ({
        scopeId: row.id,
        scopeType: "school_class" as const,
        organizationId: row.school_id,
        name: `${row.name} · ${row.academic_year}`,
      })),
    );
  }
  return { ok: true, data: scopes };
};
