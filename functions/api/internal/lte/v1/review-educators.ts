export type ReviewScopeType = "college_program" | "school_class";

export interface OrgEducator {
  userId: string;
  name: string;
  email: string | null;
}

interface Row {
  user_id: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
}

/**
 * Active educators (school) / lecturers (college) of ONE organisation. The
 * organisation id must come from the administrator's verified scope, never from
 * a request body. `userIds` narrows the result, which is how a designation is
 * re-validated: anyone not returned is not an eligible reviewer.
 */
export async function listOrgEducators(
  db: { query<T = unknown>(path: string): Promise<T[]> },
  scopeType: ReviewScopeType,
  organizationId: string,
  userIds?: string[],
): Promise<OrgEducator[]> {
  if (userIds && userIds.length === 0) return [];
  const narrow = userIds ? `&user_id=in.(${userIds.join(",")})` : "";
  const path =
    scopeType === "school_class"
      ? `school_educators?school_id=eq.${organizationId}&account_status=eq.active${narrow}&select=user_id,first_name,last_name,email&order=first_name.asc&limit=500`
      : `college_lecturers?collegeId=eq.${organizationId}&accountStatus=eq.active${narrow}&select=user_id,first_name,last_name,email&order=first_name.asc&limit=500`;
  const rows = await db.query<Row>(path);
  return rows
    .filter((row): row is Row & { user_id: string } => !!row.user_id)
    .map((row) => ({
      userId: row.user_id,
      name: [row.first_name, row.last_name].filter(Boolean).join(" ") || row.email || "Educator",
      email: row.email,
    }));
}
