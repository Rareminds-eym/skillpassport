import { withAuth, getContextUser } from '../../lib/auth';
import { getServiceClient } from '../../lib/supabase';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { apiSuccess, apiError } from '../../lib/response';

export const onRequestPost = withAuth(async (context: AuthenticatedContext) => {
  const startTime = Date.now();
  const user = getContextUser(context);
  const env = context.env as Record<string, string>;
  const supabase = getServiceClient(env as any);

  let body: any;
  try {
    body = await context.request.json();
  } catch {
    return apiError(400, 'VALIDATION_ERROR', 'Invalid JSON body', context.request, { startTime });
  }

  const { action } = body;
  if (!action) {
    return apiError(400, 'VALIDATION_ERROR', 'action is required', context.request, { startTime });
  }

  const { data: learner, error: learnerError } = await supabase
    .from('learners')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (learnerError) {
    return apiError(500, 'INTERNAL_ERROR', 'Failed to fetch learner', context.request, { startTime });
  }

  if (!learner) {
    return apiError(404, 'NOT_FOUND', 'Learner not found', context.request, { startTime });
  }

  const profile = learner.profile || {};

  switch (action) {
    case 'get': {
      return apiSuccess({
        profile: learner,
        education: profile.education || [],
        training: profile.training || [],
        experience: profile.experience || [],
        technicalSkills: profile.technicalSkills || [],
        softSkills: profile.softSkills || [],
      }, context.request, { startTime });
    }

    case 'update-profile': {
      const updates = body.updates || {};
      const { data, error } = await supabase
        .from('learners')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .select()
        .single();
      if (error) {
        return apiError(500, 'INTERNAL_ERROR', error.message, context.request, { startTime });
      }
      return apiSuccess({ data, error: null }, context.request, { startTime });
    }

    case 'add-education': {
      const newItem = { id: Date.now(), ...(body.item || {}), created_at: new Date().toISOString() };
      const education = [...(profile.education || []), newItem];
      const { error: updateError } = await supabase
        .from('learners')
        .update({ profile: { ...profile, education }, updated_at: new Date().toISOString() })
        .eq('user_id', user.id);
      if (updateError) {
        return apiError(500, 'INTERNAL_ERROR', updateError.message, context.request, { startTime });
      }
      return apiSuccess({ data: newItem, error: null }, context.request, { startTime });
    }

    case 'update-education': {
      const education = (profile.education || []).map((edu: any) =>
        edu.id === body.itemId ? { ...edu, ...(body.updates || {}) } : edu
      );
      const { error: updateError } = await supabase
        .from('learners')
        .update({ profile: { ...profile, education }, updated_at: new Date().toISOString() })
        .eq('user_id', user.id);
      if (updateError) {
        return apiError(500, 'INTERNAL_ERROR', updateError.message, context.request, { startTime });
      }
      return apiSuccess({ data: { error: null }, error: null }, context.request, { startTime });
    }

    case 'delete-education': {
      const education = (profile.education || []).filter((edu: any) => edu.id !== body.itemId);
      const { error: updateError } = await supabase
        .from('learners')
        .update({ profile: { ...profile, education }, updated_at: new Date().toISOString() })
        .eq('user_id', user.id);
      if (updateError) {
        return apiError(500, 'INTERNAL_ERROR', updateError.message, context.request, { startTime });
      }
      return apiSuccess({ data: { error: null }, error: null }, context.request, { startTime });
    }

    case 'add-training': {
      const newItem = { id: Date.now(), ...(body.item || {}), created_at: new Date().toISOString() };
      const training = [...(profile.training || []), newItem];
      const { error: updateError } = await supabase
        .from('learners')
        .update({ profile: { ...profile, training }, updated_at: new Date().toISOString() })
        .eq('user_id', user.id);
      if (updateError) {
        return apiError(500, 'INTERNAL_ERROR', updateError.message, context.request, { startTime });
      }
      return apiSuccess({ data: newItem, error: null }, context.request, { startTime });
    }

    case 'update-training': {
      const training = (profile.training || []).map((tr: any) =>
        tr.id === body.itemId ? { ...tr, ...(body.updates || {}) } : tr
      );
      const { error: updateError } = await supabase
        .from('learners')
        .update({ profile: { ...profile, training }, updated_at: new Date().toISOString() })
        .eq('user_id', user.id);
      if (updateError) {
        return apiError(500, 'INTERNAL_ERROR', updateError.message, context.request, { startTime });
      }
      return apiSuccess({ data: { error: null }, error: null }, context.request, { startTime });
    }

    case 'delete-training': {
      const training = (profile.training || []).filter((tr: any) => tr.id !== body.itemId);
      const { error: updateError } = await supabase
        .from('learners')
        .update({ profile: { ...profile, training }, updated_at: new Date().toISOString() })
        .eq('user_id', user.id);
      if (updateError) {
        return apiError(500, 'INTERNAL_ERROR', updateError.message, context.request, { startTime });
      }
      return apiSuccess({ data: { error: null }, error: null }, context.request, { startTime });
    }

    case 'add-experience': {
      const newItem = { id: Date.now(), ...(body.item || {}), created_at: new Date().toISOString() };
      const experience = [...(profile.experience || []), newItem];
      const { error: updateError } = await supabase
        .from('learners')
        .update({ profile: { ...profile, experience }, updated_at: new Date().toISOString() })
        .eq('user_id', user.id);
      if (updateError) {
        return apiError(500, 'INTERNAL_ERROR', updateError.message, context.request, { startTime });
      }
      return apiSuccess({ data: newItem, error: null }, context.request, { startTime });
    }

    case 'update-experience': {
      const experience = (profile.experience || []).map((exp: any) =>
        exp.id === body.itemId ? { ...exp, ...(body.updates || {}) } : exp
      );
      const { error: updateError } = await supabase
        .from('learners')
        .update({ profile: { ...profile, experience }, updated_at: new Date().toISOString() })
        .eq('user_id', user.id);
      if (updateError) {
        return apiError(500, 'INTERNAL_ERROR', updateError.message, context.request, { startTime });
      }
      return apiSuccess({ data: { error: null }, error: null }, context.request, { startTime });
    }

    case 'delete-experience': {
      const experience = (profile.experience || []).filter((exp: any) => exp.id !== body.itemId);
      const { error: updateError } = await supabase
        .from('learners')
        .update({ profile: { ...profile, experience }, updated_at: new Date().toISOString() })
        .eq('user_id', user.id);
      if (updateError) {
        return apiError(500, 'INTERNAL_ERROR', updateError.message, context.request, { startTime });
      }
      return apiSuccess({ data: { error: null }, error: null }, context.request, { startTime });
    }

    case 'add-technical-skills': {
      const newItem = { id: Date.now(), ...(body.item || {}), created_at: new Date().toISOString() };
      const technicalSkills = [...(profile.technicalSkills || []), newItem];
      const { error: updateError } = await supabase
        .from('learners')
        .update({ profile: { ...profile, technicalSkills }, updated_at: new Date().toISOString() })
        .eq('user_id', user.id);
      if (updateError) {
        return apiError(500, 'INTERNAL_ERROR', updateError.message, context.request, { startTime });
      }
      return apiSuccess({ data: newItem, error: null }, context.request, { startTime });
    }

    case 'update-technical-skills': {
      const technicalSkills = (profile.technicalSkills || []).map((skill: any) =>
        skill.id === body.itemId ? { ...skill, ...(body.updates || {}) } : skill
      );
      const { error: updateError } = await supabase
        .from('learners')
        .update({ profile: { ...profile, technicalSkills }, updated_at: new Date().toISOString() })
        .eq('user_id', user.id);
      if (updateError) {
        return apiError(500, 'INTERNAL_ERROR', updateError.message, context.request, { startTime });
      }
      return apiSuccess({ data: { error: null }, error: null }, context.request, { startTime });
    }

    case 'delete-technical-skills': {
      const technicalSkills = (profile.technicalSkills || []).filter((skill: any) => skill.id !== body.itemId);
      const { error: updateError } = await supabase
        .from('learners')
        .update({ profile: { ...profile, technicalSkills }, updated_at: new Date().toISOString() })
        .eq('user_id', user.id);
      if (updateError) {
        return apiError(500, 'INTERNAL_ERROR', updateError.message, context.request, { startTime });
      }
      return apiSuccess({ data: { error: null }, error: null }, context.request, { startTime });
    }

    case 'add-soft-skills': {
      const newItem = { id: Date.now(), ...(body.item || {}), created_at: new Date().toISOString() };
      const softSkills = [...(profile.softSkills || []), newItem];
      const { error: updateError } = await supabase
        .from('learners')
        .update({ profile: { ...profile, softSkills }, updated_at: new Date().toISOString() })
        .eq('user_id', user.id);
      if (updateError) {
        return apiError(500, 'INTERNAL_ERROR', updateError.message, context.request, { startTime });
      }
      return apiSuccess({ data: newItem, error: null }, context.request, { startTime });
    }

    case 'update-soft-skills': {
      const softSkills = (profile.softSkills || []).map((skill: any) =>
        skill.id === body.itemId ? { ...skill, ...(body.updates || {}) } : skill
      );
      const { error: updateError } = await supabase
        .from('learners')
        .update({ profile: { ...profile, softSkills }, updated_at: new Date().toISOString() })
        .eq('user_id', user.id);
      if (updateError) {
        return apiError(500, 'INTERNAL_ERROR', updateError.message, context.request, { startTime });
      }
      return apiSuccess({ data: { error: null }, error: null }, context.request, { startTime });
    }

    case 'delete-soft-skills': {
      const softSkills = (profile.softSkills || []).filter((skill: any) => skill.id !== body.itemId);
      const { error: updateError } = await supabase
        .from('learners')
        .update({ profile: { ...profile, softSkills }, updated_at: new Date().toISOString() })
        .eq('user_id', user.id);
      if (updateError) {
        return apiError(500, 'INTERNAL_ERROR', updateError.message, context.request, { startTime });
      }
      return apiSuccess({ data: { error: null }, error: null }, context.request, { startTime });
    }

    case 'get-education': {
      const { data: eduData, error: eduError } = await supabase
        .from('education')
        .select('*')
        .eq('learner_id', learner.id)
        .order('created_at', { ascending: false });
      if (eduError) {
        return apiError(500, 'INTERNAL_ERROR', eduError.message, context.request, { startTime });
      }
      return apiSuccess(eduData || [], context.request, { startTime });
    }

    case 'get-experience': {
      const { data: expData, error: expError } = await supabase
        .from('experience')
        .select('*')
        .eq('learner_id', learner.id)
        .order('created_at', { ascending: false });
      if (expError) {
        return apiError(500, 'INTERNAL_ERROR', expError.message, context.request, { startTime });
      }
      return apiSuccess(expData || [], context.request, { startTime });
    }

    case 'get-skills': {
      const { data: skillsData, error: skillsError } = await supabase
        .from('skills')
        .select('*')
        .eq('learner_id', learner.id)
        .is('training_id', null)
        .order('created_at', { ascending: false });
      if (skillsError) {
        return apiError(500, 'INTERNAL_ERROR', skillsError.message, context.request, { startTime });
      }
      return apiSuccess(skillsData || [], context.request, { startTime });
    }

    case 'toggle-skill-visibility': {
      const { skillId, enabled } = body;
      if (!skillId) {
        return apiError(400, 'VALIDATION_ERROR', 'skillId is required', context.request, { startTime });
      }
      const { error: updateError } = await supabase
        .from('skills')
        .update({ enabled })
        .eq('id', skillId);
      if (updateError) {
        return apiError(500, 'INTERNAL_ERROR', updateError.message, context.request, { startTime });
      }
      return apiSuccess({ success: true }, context.request, { startTime });
    }

    default:
      return apiError(400, 'VALIDATION_ERROR', `Unknown action: ${action}`, context.request, { startTime });
  }
});
