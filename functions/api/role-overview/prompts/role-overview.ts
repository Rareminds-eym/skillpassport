/**
 * Role Overview Prompts — course-matching builders only.
 *
 * Removed 2026-09-12 (role-overview RPC cutover): buildRoleOverviewPrompt
 * and SYSTEM_PROMPT served only the deleted direct-provider draft; the
 * worker carries its own ported copies. Recorded in
 * ai-worker/docs/migration.md.
 */

/**
 * Build the prompt for AI-powered course matching
 * Takes a role name and list of available courses, returns the most relevant course IDs
 */
export function buildCourseMatchingPrompt(
  roleName: string,
  clusterTitle: string,
  courses: Array<{
    id: string;
    title: string;
    description: string;
    skills?: string[];
    category?: string;
  }>
): string {
  const courseList = courses
    .map(
      (c, idx) =>
        `${idx + 1}. ID: "${c.id}" | Title: "${c.title}" | Description: "${c.description?.substring(0, 100) || ''}" | Skills: ${(c.skills || []).join(', ')} | Category: ${c.category || 'General'}`
    )
    .join('\n');

  return `You are an expert career advisor. Analyze which courses are MOST RELEVANT for someone pursuing a "${roleName}" role in the "${clusterTitle}" career cluster.

AVAILABLE COURSES:
${courseList}

TASK: Select the TOP 4 most relevant courses for a "${roleName}" role. Consider:
1. Direct skill match (course teaches skills needed for the role)
2. Domain relevance (course is in the same field/industry)
3. Foundational value (course provides essential knowledge for the role)
4. Career progression (course helps advance in this career path)

IMPORTANT RULES:
- Only select courses that are GENUINELY relevant to "${roleName}"
- If a course has NO relevance to the role, do NOT include it
- Prefer courses that directly mention skills/topics related to "${roleName}"
- For technical roles, prioritize technical courses
- For business roles, prioritize business/management courses
- If fewer than 4 courses are relevant, return only the relevant ones

Return ONLY a JSON object with this exact format:
{
  "matchedCourseIds": ["id1", "id2", "id3", "id4"],
  "reasoning": "Brief explanation of why these courses match"
}

If NO courses are relevant, return:
{
  "matchedCourseIds": [],
  "reasoning": "No courses in the catalog match this role"
}`;
}

export const COURSE_MATCHING_SYSTEM_PROMPT =
  'You are a career advisor specializing in course recommendations. Return valid JSON only. Be strict about relevance - only recommend courses that genuinely help the specified role.';
