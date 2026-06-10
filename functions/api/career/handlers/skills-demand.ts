import { createSupabaseAdminClient } from '../../../lib/supabase';
import { apiSuccess, apiError } from '../../../lib/response';

export async function handleGetSkillsDemand(env: any, request: Request): Promise<Response> {
  try {
    const supabase = createSupabaseAdminClient(env);
    const { data } = await supabase
      .from('opportunities')
      .select('skills_required')
      .limit(50);

    if (!data) return apiSuccess([], request);

    const skillsMap = new Map<string, number>();
    data.forEach((job: any) => {
      let skills: string[] = [];
      if (Array.isArray(job.skills_required)) {
        skills = job.skills_required;
      } else if (typeof job.skills_required === 'string') {
        try { skills = JSON.parse(job.skills_required); } catch {}
      }
      skills.forEach((skill: string) => {
        if (skill) {
          const normalized = skill.toLowerCase().trim();
          skillsMap.set(normalized, (skillsMap.get(normalized) || 0) + 1);
        }
      });
    });

    const topSkills = Array.from(skillsMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([skill]) => skill);

    return apiSuccess(topSkills, request);
  } catch (error) {
    console.error('[ERROR] skills-demand:', error);
    return apiError(500, 'INTERNAL_ERROR', 'Failed to fetch skills demand', request);
  }
}
