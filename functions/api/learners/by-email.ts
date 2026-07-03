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
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { getContextUser, withAuth } from '../../lib/auth';
import { apiError, apiSuccess } from '../../lib/response';
import { ADMIN_ROLES } from '../../lib/roleCategories';
import { getServiceClient } from '../../lib/supabase';

export const onRequestGet = withAuth(async (context: AuthenticatedContext) => {
  const startTime = Date.now();
  const env = context.env as Record<string, string>;
  const supabase = getServiceClient(env);
  const user = getContextUser(context);

  const url = new URL(context.request.url);
  const email = url.searchParams.get('email');
  const publicProfileLearnerId = url.searchParams.get('learnerId');

  if (!email) {
    return apiError(400, 'INVALID_INPUT', 'Email is required', context.request, { startTime });
  }

  // Ownership-scoped: a learner may fetch their OWN data by email; admins
  // (shared ADMIN_ROLES group) may fetch anyone's. Non-guard role check →
  // uses ADMIN_ROLES, replacing the inline literal (bug §7.1).
  const isAdmin = user.roles?.some((r: string) => ADMIN_ROLES.includes(r));
  const isOwner = user.email === email;

  // Audit log for public profile access attempts
  if (publicProfileLearnerId && !isOwner && !isAdmin) {
    console.log(`[LearnersByEmail] PUBLIC_PROFILE_ACCESS: userId="${user.id}" requested learnerId="${publicProfileLearnerId}" email="${email}"`);
  }

  if (!isAdmin && !isOwner) {
    if (!publicProfileLearnerId) {
      console.log(`[LearnersByEmail] BLOCKED: JWT email="${user.email}" tried to access "${email}"`);
      return apiError(403, 'FORBIDDEN', 'You can only access your own data', context.request, { startTime });
    }

    const { data: publicProfileLearner, error: publicProfileError } = await supabase
      .from('learners')
      .select('id, user_id')
      .eq('id', publicProfileLearnerId)
      .eq('email', email)
      .maybeSingle();

    if (publicProfileError) {
      console.error('[LearnersByEmail] Public profile verification error:', JSON.stringify(publicProfileError));
      return apiError(500, 'INTERNAL_ERROR', 'Unable to verify profile access', context.request, { startTime });
    }

    if (!publicProfileLearner) {
      console.log(`[LearnersByEmail] BLOCKED: learnerId="${publicProfileLearnerId}" does not match requested email="${email}"`);
      return apiError(403, 'FORBIDDEN', 'You can only access your own data', context.request, { startTime });
    }
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

      // Fetch privacy settings
      let privacySettings = { profileVisibility: 'public' };
      if (fullData.user_id) {
        const { data: userSettings } = await supabase
          .from('user_settings')
          .select('privacy_settings')
          .eq('user_id', fullData.user_id)
          .maybeSingle();
        if (userSettings?.privacy_settings) {
          privacySettings = userSettings.privacy_settings;
        }
      }

      return apiSuccess({
        ...fullData,
        privacySettings
      }, context.request, { startTime });
    }

    // Strategy 2: Try simple query without joins
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

      // Fetch privacy settings
      let privacySettings = { profileVisibility: 'public' };
      if (simpleData.user_id) {
        const { data: userSettings } = await supabase
          .from('user_settings')
          .select('privacy_settings')
          .eq('user_id', simpleData.user_id)
          .maybeSingle();
        if (userSettings?.privacy_settings) {
          privacySettings = userSettings.privacy_settings;
        }
      }

      const mergedData = {
        ...simpleData,
        privacySettings,
        skill_passports: skillPassports.data || [],
        projects: projects.data || [],
        certificates: certificates.data || [],
        experience: experience.data || [],
        skills: skills.data || [],
        trainings: trainings.data || [],
        education: educationData.data || [],
      };

      return apiSuccess(mergedData, context.request, { startTime });
    }

    // Strategy 3: Try by user_id from JWT
    const userId = user.id;
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
      const learnerId = byUserData.id;
      const [skillPassports, projects, certificates, experience, skills, trainings, educationData, userSettings] = await Promise.all([
        supabase.from('skill_passports').select('*').eq('learner_id', learnerId),
        supabase.from('projects').select('*').eq('learner_id', learnerId),
        supabase.from('certificates').select('*').eq('learner_id', learnerId),
        supabase.from('experience').select('*').eq('learner_id', learnerId),
        supabase.from('skills').select('*').eq('learner_id', learnerId),
        supabase.from('trainings').select('*').eq('learner_id', learnerId),
        supabase.from('education').select('*').eq('learner_id', learnerId),
        supabase.from('user_settings').select('privacy_settings').eq('user_id', byUserData.user_id).maybeSingle(),
      ]);

      let privacySettings = { profileVisibility: 'public' };
      if (userSettings.data?.privacy_settings) {
        privacySettings = userSettings.data.privacy_settings;
      }

      const mergedData = {
        ...byUserData,
        privacySettings,
        skill_passports: skillPassports.data || [],
        projects: projects.data || [],
        certificates: certificates.data || [],
        experience: experience.data || [],
        skills: skills.data || [],
        trainings: trainings.data || [],
        education: educationData.data || [],
      };

      return apiSuccess(mergedData, context.request, { startTime });
    }

    // Strategy 4: Try case-insensitive search
    console.log(`[LearnersByEmail] Trying case-insensitive search for "${email}"`);
    const { data: ilikeData } = await supabase
      .from('learners')
      .select('id, email, name, user_id')
      .ilike('email', email)
      .limit(1)
      .maybeSingle();

    if (ilikeData) {
      console.log(`[LearnersByEmail] Found by ILIKE! Actual email="${ilikeData.email}"`);
      return apiError(404, 'CASE_MISMATCH', `Email case mismatch. DB has "${ilikeData.email}" but requested "${email}".`, context.request, { startTime });
    }

    // Nothing found
    console.log(`[LearnersByEmail] No learner record found anywhere for email="${email}" or user_id="${userId}"`);
    return apiError(404, 'NOT_FOUND', `No learner record found for email "${email}".`, context.request, { startTime });

  } catch (err) {
    console.error('[LearnersByEmail] Error:', err);
    return apiError(500, 'INTERNAL_ERROR', 'An internal error occurred', context.request, { startTime });
  }
});
