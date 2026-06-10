import { buildlearnerContext } from '../context/learner';
import { apiSuccess, apiError } from '../../../lib/response';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';

export async function handleGetProfile(env: any, userId: string, request: Request): Promise<Response> {
  try {
    const profile = await buildlearnerContext(env, userId);
    if (!profile) {
      return apiError(404, 'NOT_FOUND', 'Learner profile not found', request);
    }

    const transformed = {
      id: profile.id,
      name: profile.name,
      email: profile.email,
      department: profile.department,
      university: profile.university,
      cgpa: profile.cgpa,
      year_of_passing: profile.yearOfPassing,
      profile: {
        technicalSkills: profile.technicalSkills,
        softSkills: profile.softSkills,
        education: profile.education,
        training: profile.trainings,
        experience: profile.experience,
        projects: profile.projects,
        certificates: profile.certificates,
      },
    };

    return apiSuccess(transformed, request);
  } catch (error) {
    console.error('[ERROR] profile:', error);
    return apiError(500, 'INTERNAL_ERROR', 'Failed to fetch profile', request);
  }
}
