import { withAuth, getContextUser } from '../../lib/auth';
import { getServiceClient } from '../../lib/supabase';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { apiSuccess, apiError } from '../../lib/response';

const LEVEL_MAP: Record<string, number> = {
  beginner: 1, '1': 1,
  intermediate: 2, '2': 2,
  advanced: 3, '3': 3,
  expert: 4, '4': 4,
};

function normalizeLevel(level: unknown): number {
  if (typeof level === 'number') return level;
  if (typeof level === 'string') return LEVEL_MAP[level.trim().toLowerCase()] || 3;
  return 3;
}

export const onRequestPost = withAuth(async (context: AuthenticatedContext) => {
  const user = getContextUser(context);
  const env = context.env as Record<string, string>;
  const supabase = getServiceClient(env as any);

  let body: any;
  try {
    body = await context.request.json();
  } catch {
    return apiError(400, 'VALIDATION_ERROR', 'Invalid JSON body', context.request);
  }

  const { learnerId } = body;
  if (!learnerId) {
    return apiError(400, 'VALIDATION_ERROR', 'learnerId is required', context.request);
  }

  // Verify user owns this learner record
  const isAdmin = user?.roles?.some((r: string) =>
    ['admin', 'company_admin', 'owner', 'college_admin', 'university_admin', 'school_admin'].includes(r)
  );
  if (!isAdmin) {
    const { data: learner } = await supabase
      .from('learners')
      .select('user_id')
      .eq('id', learnerId)
      .maybeSingle();
    if (!learner || learner.user_id !== user.id) {
      return apiError(403, 'FORBIDDEN', 'You can only access your own data', context.request);
    }
  }

  const results: any = { education: 0, experience: 0, skills: 0, certificates: 0, projects: 0, trainings: 0 };
  const errors: any[] = [];

  if (body.education?.length) {
    const records = body.education.map((e: any) => ({
      learner_id: learnerId,
      level: e.level || "Bachelor's",
      degree: e.degree || '',
      department: e.department || '',
      university: e.university || '',
      year_of_passing: e.yearOfPassing || '',
      cgpa: e.cgpa || '',
      status: e.status || 'completed',
      approval_status: 'pending',
    }));
    const { data, error } = await supabase.from('education').insert(records).select();
    if (error) errors.push({ table: 'education', error: error.message });
    else results.education = data?.length || 0;
  }

  if (body.experience?.length) {
    const records = body.experience.map((e: any) => ({
      learner_id: learnerId,
      organization: e.organization || '',
      role: e.role || '',
      duration: e.duration || '',
      verified: e.verified || false,
      approval_status: 'pending',
    }));
    const { data, error } = await supabase.from('experience').insert(records).select();
    if (error) errors.push({ table: 'experience', error: error.message });
    else results.experience = data?.length || 0;
  }

  const allSkills: any[] = [];
  if (body.technicalSkills?.length) {
    body.technicalSkills.forEach((s: any) => {
      allSkills.push({ learner_id: learnerId, name: s.name || '', type: 'technical', level: normalizeLevel(s.level), description: s.category || '', verified: s.verified || false, approval_status: 'pending' });
    });
  }
  if (body.softSkills?.length) {
    body.softSkills.forEach((s: any) => {
      allSkills.push({ learner_id: learnerId, name: s.name || '', type: 'soft', level: normalizeLevel(s.level), description: s.description || s.type || '', verified: false, approval_status: 'pending' });
    });
  }
  if (allSkills.length > 0) {
    const { data, error } = await supabase.from('skills').insert(allSkills).select();
    if (error) errors.push({ table: 'skills', error: error.message });
    else results.skills = data?.length || 0;
  }

  if (body.certificates?.length) {
    const records = body.certificates.map((c: any) => ({
      learner_id: learnerId,
      title: c.title || '',
      issuer: c.issuer || '',
      level: c.level || 'Professional',
      credential_id: c.credentialId || '',
      link: c.link || '',
      issued_on: c.issuedOn || null,
      description: c.description || '',
      status: c.status || 'pending',
      approval_status: 'pending',
    }));
    const { data, error } = await supabase.from('certificates').insert(records).select();
    if (error) errors.push({ table: 'certificates', error: error.message });
    else results.certificates = data?.length || 0;
  }

  if (body.projects?.length) {
    const records = body.projects.map((p: any) => ({
      learner_id: learnerId,
      title: p.title || '',
      organization: p.organization || '',
      duration: p.duration || '',
      description: p.description || '',
      status: p.status || 'Completed',
      tech_stack: p.technologies || p.techStack || p.tech || p.skills || [],
      demo_link: p.demoLink || p.demo || p.link || p.url || '',
      github_link: p.github || '',
      approval_status: 'pending',
    }));
    const { data, error } = await supabase.from('projects').insert(records).select();
    if (error) errors.push({ table: 'projects', error: error.message });
    else results.projects = data?.length || 0;
  }

  if (body.training?.length) {
    const records = body.training.map((t: any) => ({
      learner_id: learnerId,
      title: t.course || t.skill || '',
      organization: t.trainer || '',
      status: t.status || 'ongoing',
      description: `Progress: ${t.progress || 0}%`,
      approval_status: 'pending',
    }));
    const { data, error } = await supabase.from('trainings').insert(records).select();
    if (error) errors.push({ table: 'trainings', error: error.message });
    else results.trainings = data?.length || 0;
  }

  const updateData: any = {};
  if (body.name) updateData.name = body.name;
  if (body.contact_number) updateData.contact_number = body.contact_number;
  if (body.alternate_number) updateData.alternate_number = body.alternate_number;
  if (body.age) updateData.age = parseInt(body.age);
  if (body.date_of_birth) updateData.date_of_birth = body.date_of_birth;
  if (body.university) updateData.university = body.university;
  if (body.branch_field) updateData.branch_field = body.branch_field;
  if (body.college_school_name) updateData.college_school_name = body.college_school_name;
  if (body.registration_number) updateData.registration_number = body.registration_number;
  if (body.district_name) updateData.district_name = body.district_name;
  updateData.resume_imported_at = new Date().toISOString();

  if (Object.keys(updateData).length > 0) {
    const { error } = await supabase.from('learners').update(updateData).eq('id', learnerId);
    if (error) errors.push({ table: 'learners', error: error.message });
  }

  return apiSuccess({
    saved: results,
    errors: errors.length > 0 ? errors : undefined,
    success: errors.length === 0,
  }, context.request);
});
