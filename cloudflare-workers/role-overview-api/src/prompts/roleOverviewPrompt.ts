/**
 * Build the prompt for generating role overview data
 */
export function buildRoleOverviewPrompt(roleName: string, clusterTitle: string): string {
  return `For a ${roleName} role in the ${clusterTitle} career cluster, provide:

1. RESPONSIBILITIES: Exactly 3 key job responsibilities
   - Each must start with an action verb
   - Each should be 10-20 words, specific to this role

2. INDUSTRY DEMAND:
   - demandDescription: 2 short sentences (max 25 words)
   - demandLevel: "Low", "Medium", "High", or "Very High"
   - demandPercentage: Low=20-40, Medium=41-65, High=66-85, Very High=86-100

3. CAREER PROGRESSION: 4 career stages with role-specific titles
   - Each: title, yearsExperience (e.g., "0-2 yrs")

4. LEARNING ROADMAP: 3 phases for 6-month learning plan specific to becoming a ${roleName}
   - Phase 1 (Month 1-2): Foundation - Learn core ${roleName} concepts, tools, and fundamentals
   - Phase 2 (Month 3-4): Skill Building - Practice with hands-on ${roleName} projects
   - Phase 3 (Month 5-6): Portfolio & Job Prep - Build portfolio and prepare for ${roleName} interviews
   - Each phase: month, title (role-specific), description (1 sentence specific to ${roleName}), tasks (4 specific actionable items relevant to ${roleName})
   - Tasks must be specific to ${roleName}, NOT generic like "Complete foundational courses" or "Join communities"
   - Example good tasks for a Software Engineer: "Learn Git version control", "Build a REST API", "Practice LeetCode problems"

5. RECOMMENDED COURSES: 4 courses specific to this role
   - Each: title (specific course name), description (1 sentence), duration (e.g., "4 weeks"), level ("Beginner"/"Intermediate"/"Advanced"/"Professional"), skills (3 skills learned)

6. FREE RESOURCES: 3 free learning resources with real URLs
   - Each: title (specific resource name), description (1 sentence), type ("YouTube"/"Documentation"/"Certification"/"Community"/"Tool"), url (real working URL)

7. ACTION ITEMS: 4 immediate action items specific to becoming a ${roleName}
   - Each: title (2-3 words), description (specific actionable step, 5-10 words)

8. SUGGESTED PROJECTS: 3 hands-on projects specific to ${roleName}
   - Each project should be practical and help build portfolio
   - Each: title (catchy project name), description (2-3 sentences explaining what to build and what you'll learn), difficulty ("Beginner"/"Intermediate"/"Advanced"), skills (3-4 skills practiced), estimatedTime (e.g., "2-4 hours", "1-2 weeks")
   - Projects should progress from simple to complex
   - Make descriptions engaging and explain the real-world value

Return ONLY this JSON:
{
  "responsibilities": ["...", "...", "..."],
  "demandDescription": "...",
  "demandLevel": "High",
  "demandPercentage": 78,
  "careerProgression": [
    {"title": "...", "yearsExperience": "0-2 yrs"},
    {"title": "...", "yearsExperience": "2-5 yrs"},
    {"title": "...", "yearsExperience": "5-8 yrs"},
    {"title": "...", "yearsExperience": "8+ yrs"}
  ],
  "learningRoadmap": [
    {"month": "Month 1-2", "title": "...", "description": "...", "tasks": ["...", "...", "...", "..."]},
    {"month": "Month 3-4", "title": "...", "description": "...", "tasks": ["...", "...", "...", "..."]},
    {"month": "Month 5-6", "title": "...", "description": "...", "tasks": ["...", "...", "...", "..."]}
  ],
  "recommendedCourses": [
    {"title": "...", "description": "...", "duration": "4 weeks", "level": "Beginner", "skills": ["...", "...", "..."]},
    {"title": "...", "description": "...", "duration": "6 weeks", "level": "Intermediate", "skills": ["...", "...", "..."]},
    {"title": "...", "description": "...", "duration": "8 weeks", "level": "Advanced", "skills": ["...", "...", "..."]},
    {"title": "...", "description": "...", "duration": "4 weeks", "level": "Professional", "skills": ["...", "...", "..."]}
  ],
  "freeResources": [
    {"title": "...", "description": "...", "type": "YouTube", "url": "https://..."},
    {"title": "...", "description": "...", "type": "Documentation", "url": "https://..."},
    {"title": "...", "description": "...", "type": "Certification", "url": "https://..."}
  ],
  "actionItems": [
    {"title": "...", "description": "..."},
    {"title": "...", "description": "..."},
    {"title": "...", "description": "..."},
    {"title": "...", "description": "..."}
  ],
  "suggestedProjects": [
    {"title": "...", "description": "...", "difficulty": "Beginner", "skills": ["...", "...", "..."], "estimatedTime": "2-4 hours"},
    {"title": "...", "description": "...", "difficulty": "Intermediate", "skills": ["...", "...", "...", "..."], "estimatedTime": "1-2 weeks"},
    {"title": "...", "description": "...", "difficulty": "Advanced", "skills": ["...", "...", "...", "..."], "estimatedTime": "2-4 weeks"}
  ]
}`;
}

export const SYSTEM_PROMPT = 'You are a career advisor. Return valid JSON only. Make all recommendations specific to the role.';

/**
 * Build the prompt for AI-powered course matching
 * Takes a role name and list of available courses, returns the most relevant course IDs
 */
export function buildCourseMatchingPrompt(roleName: string, clusterTitle: string, courses: Array<{id: string, title: string, description: string, skills?: string[], category?: string}>): string {
  const courseList = courses.map((c, idx) => 
    `${idx + 1}. ID: "${c.id}" | Title: "${c.title}" | Description: "${c.description?.substring(0, 100) || ''}" | Skills: ${(c.skills || []).join(', ')} | Category: ${c.category || 'General'}`
  ).join('\n');

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

export const COURSE_MATCHING_SYSTEM_PROMPT = 'You are a career advisor specializing in course recommendations. Return valid JSON only. Be strict about relevance - only recommend courses that genuinely help the specified role.';
