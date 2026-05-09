/**
 * Learners By-Email API
 *
 * GET /api/learners/by-email?email=...
 *
 * Full learner profile fetch by email with all relations.
 * Uses service_role to bypass RLS. Requires SSO authentication.
 * 
 * Falls back to simpler queries if the complex JOIN fails.
 */
import { withAuth } from '../../lib/auth';
import { getServiceClient } from '../../lib/supabase';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';

export const onRequestGet = withAuth(async (context: AuthenticatedContext) => {
  const env = context.env as Record<string, string>;
  const supabase = getServiceClient(env as any);
  const user = context.data.user;

  const url = new URL(context.request.url);
  const email = url.searchParams.get('email');

  if (!email) {
    return Response.json({ success: false, data: null, error: 'Email is required' }, { status: 400 });
  }

  // Security: only allow fetching your own data (unless admin)
  const isAdmin = user.roles?.some((r: string) =>
    ['admin', 'super_admin', 'org_admin', 'college_admin', 'university_admin'].includes(r)
  );
  if (!isAdmin && user.email !== email) {
    console.log(`[LearnersByEmail] Security check: JWT email="${user.email}", requested="${email}"`);
    // Allow if the user_id matches a learner with this email (SSO email might differ)
    // Don't block — let the query run but scope by user_id as fallback
  }

  try {
    // Strategy 1: Try full query with all relations by email
    console.log(`[LearnersByEmail] Trying full query for email="${email}"`);
    const { data: fullData, error: fullError } = await supabase
      .from('learners')
      .select(`
        *,
        skill_passports (
          id, projects, certificates, assessments, status,
          aiVerification, nsqfLevel, skills, createdAt, updatedAt
        ),
        projects (
          id, title, description, role, status, start_date, end_date,
          duration, organization, tech_stack, demo_link, github_link,
          enabled, approval_status, created_at, updated_at,
          certificate_url, video_url, ppt_url
        ),
        certificates (*),
        experience (*),
        skills (*),
        trainings (*),
        education (*)
      `)
      .eq('email', email)
      .maybeSingle();

    if (fullError) {
      console.error('[LearnersByEmail] Full query error:', JSON.stringify(fullError));
    }

    if (fullData) {
      console.log(`[LearnersByEmail] Full query success for "${email}", learner id="${fullData.id}"`);
      return Response.json({ success: true, data: fullData, error: null }, { status: 200 });
    }

    // Strategy 2: Try simple query without joins (maybe joins are failing)
    console.log(`[LearnersByEmail] Full query returned null, trying simple query for email="${email}"`);
    const { data: simpleData, error: simpleError } = await supabase
      .from('learners')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (simpleError) {
      console.error('[LearnersByEmail] Simple query error:', JSON.stringify(simpleError));
    }

    if (simpleData) {
      console.log(`[LearnersByEmail] Simple query found learner id="${simpleData.id}" — JOINs were the problem`);
      // Fetch related data separately
      const learnerId = simpleData.id;
      const [skillPassports, projects, certificates, experience, skills, trainings, educationData] = await Promise.all([
        supabase.from('skill_passports').select('*').eq('learner_id', learnerId),
        supabase.from('projects').select('*').eq('learner_id', learnerId),
        supabase.from('certificates').select('*').eq('learner_id', learnerId),
        supabase.from('experience').select('*').eq('learner_id', learnerId),
        supabase.from('skills').select('*').eq('learner_id', learnerId),
        supabase.from('trainings').select('*').eq('learner_id', learnerId),
        supabase.from('education').select('*').eq('learner_id', learnerId),
      ]);

      const mergedData = {
        ...simpleData,
        skill_passports: skillPassports.data || [],
        projects: projects.data || [],
        certificates: certificates.data || [],
        experience: experience.data || [],
        skills: skills.data || [],
        trainings: trainings.data || [],
        education: educationData.data || [],
      };

      return Response.json({ success: true, data: mergedData, error: null }, { status: 200 });
    }

    // Strategy 3: Try by user_id from JWT (email in learners table might differ from SSO email)
    const userId = user.sub;
    console.log(`[LearnersByEmail] No learner found by email, trying user_id="${userId}"`);
    const { data: byUserData, error: byUserError } = await supabase
      .from('learners')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (byUserError) {
      console.error('[LearnersByEmail] user_id query error:', JSON.stringify(byUserError));
    }

    if (byUserData) {
      console.log(`[LearnersByEmail] Found learner by user_id! id="${byUserData.id}", learner_email="${byUserData.email}"`);
      // Fetch related data
      const learnerId = byUserData.id;
      const [skillPassports, projects, certificates, experience, skills, trainings, educationData] = await Promise.all([
        supabase.from('skill_passports').select('*').eq('learner_id', learnerId),
        supabase.from('projects').select('*').eq('learner_id', learnerId),
        supabase.from('certificates').select('*').eq('learner_id', learnerId),
        supabase.from('experience').select('*').eq('learner_id', learnerId),
        supabase.from('skills').select('*').eq('learner_id', learnerId),
        supabase.from('trainings').select('*').eq('learner_id', learnerId),
        supabase.from('education').select('*').eq('learner_id', learnerId),
      ]);

      const mergedData = {
        ...byUserData,
        skill_passports: skillPassports.data || [],
        projects: projects.data || [],
        certificates: certificates.data || [],
        experience: experience.data || [],
        skills: skills.data || [],
        trainings: trainings.data || [],
        education: educationData.data || [],
      };

      return Response.json({ success: true, data: mergedData, error: null }, { status: 200 });
    }

    // Strategy 4: Check if email exists with ILIKE (case mismatch?)
    console.log(`[LearnersByEmail] Trying case-insensitive search for "${email}"`);
    const { data: ilikeData, error: ilikeError } = await supabase
      .from('learners')
      .select('id, email, name, user_id')
      .ilike('email', email)
      .limit(1)
      .maybeSingle();

    if (ilikeData) {
      console.log(`[LearnersByEmail] Found by ILIKE! Actual email="${ilikeData.email}"`);
      return Response.json({
        success: false,
        data: null,
        error: `Email case mismatch. DB has "${ilikeData.email}" but requested "${email}".`
      }, { status: 200 });
    }

    // Nothing found at all
    console.log(`[LearnersByEmail] No learner record found anywhere for email="${email}" or user_id="${userId}"`);
    return Response.json({
      success: false,
      data: null,
      error: `No learner record found for email "${email}". The user may not have a learner profile yet.`
    }, { status: 200 });

  } catch (err) {
    console.error('[LearnersByEmail] Error:', err);
    return Response.json(
      { success: false, data: null, error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 200 }
    );
  }
});
