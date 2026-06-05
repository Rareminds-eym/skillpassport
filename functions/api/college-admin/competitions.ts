/**
 * College Admin - Competitions API
 * POST: Action-based dispatch for competitions, clubs, registrations, results
 */
import { withAuth, getContextUser } from '../../lib/auth';
import { getServiceClient } from '../../lib/supabase';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { apiSuccess, apiDbError, apiError, apiMethodNotAllowed } from '../../lib/response';

async function getUserSchoolContext(supabase: any, userId: string): Promise<{ schoolId: string; type: 'educator' | 'admin'; id: string } | null> {
  const { data: educator } = await supabase.from('school_educators').select('id, school_id').eq('user_id', userId).maybeSingle();
  if (educator?.school_id) return { schoolId: educator.school_id, type: 'educator', id: educator.id };

  const { data: org } = await supabase.from('organizations').select('id').eq('organization_type', 'school').or(`admin_id.eq.${userId}`).maybeSingle();
  if (org?.id) return { schoolId: org.id, type: 'admin', id: org.id };

  const { data: profile } = await supabase.from('user_profiles').select('email').eq('user_id', userId).maybeSingle();
  if (profile?.email) {
    const { data: orgByEmail } = await supabase.from('organizations').select('id').eq('organization_type', 'school').eq('email', profile.email).maybeSingle();
    if (orgByEmail?.id) return { schoolId: orgByEmail.id, type: 'admin', id: orgByEmail.id };
  }

  return null;
}

export const onRequestPost = withAuth(async (context: AuthenticatedContext) => {
  const user = getContextUser(context);
  const env = context.env as Record<string, string>;
  const supabase = getServiceClient(env as any);

  let body: Record<string, any>;
  try {
    body = await context.request.json() as any;
  } catch {
    return apiError(400, 'VALIDATION_ERROR', 'Invalid JSON body', context.request);
  }

  const { action, ...params } = body;
  if (!action) return apiError(400, 'VALIDATION_ERROR', 'Missing action parameter', context.request);

  const startTime = Date.now();

  try {
    switch (action) {
      case 'get-all': {
        const ctx = await getUserSchoolContext(supabase, user.id);
        if (!ctx) return apiError(403, 'AUTH_ERROR', 'Unable to determine school affiliation', context.request, { startTime });
        let query = supabase.from('competitions').select('*').eq('school_id', ctx.schoolId).order('competition_date', { ascending: true });
        const { data: competitions, error } = await query;
        if (error) return apiDbError(error, context.request, { startTime });

        const withClubs = await Promise.all((competitions || []).map(async (comp: any) => {
          const { data: clubsData } = await supabase.from('competition_clubs').select('club_id').eq('comp_id', comp.comp_id);
          const { data: resultsData } = await supabase.from('competition_results').select('*').eq('comp_id', comp.comp_id);
          return { ...comp, participatingClubs: clubsData?.map((c: any) => c.club_id) || [], results: resultsData || [] };
        }));
        return apiSuccess(withClubs, context.request, { startTime });
      }

      case 'create': {
        const ctx = await getUserSchoolContext(supabase, user.id);
        if (!ctx) return apiError(403, 'AUTH_ERROR', 'Unable to determine school affiliation', context.request, { startTime });
        const { name, level, date, participatingClubs, ...rest } = params;
        const newCompetition: any = { school_id: ctx.schoolId, name, level, competition_date: date, status: 'upcoming', team_size_min: 1, team_size_max: 1, created_by_type: ctx.type };
        if (ctx.type === 'educator') newCompetition.created_by_educator_id = ctx.id;
        else newCompetition.created_by_admin_id = ctx.id;
        const { data, error } = await supabase.from('competitions').insert([newCompetition]).select().single();
        if (error) return apiDbError(error, context.request, { startTime });

        if (participatingClubs?.length > 0) {
          const clubRecords = (participatingClubs as string[]).map((clubId: string) => ({ comp_id: data.comp_id, club_id: clubId }));
          await supabase.from('competition_clubs').insert(clubRecords);
        }
        return apiSuccess({ ...data, participatingClubs: participatingClubs || [], results: [] }, context.request, { startTime });
      }

      case 'register': {
        const { comp_id, learner_email, ...regData } = params;
        const registration = { comp_id, learner_email, status: 'registered', ...regData };
        const { data, error } = await supabase.from('competition_registrations').insert([registration]).select().single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'get-registrations': {
        const { comp_id } = params;
        const { data, error } = await supabase.from('competition_registrations').select('*').eq('comp_id', comp_id).order('registration_date', { ascending: false });
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'add-result': {
        const { comp_id, learner_email, ...resultData } = params;
        const result = { comp_id, learner_email, certificate_issued: false, ...resultData };
        const { data, error } = await supabase.from('competition_results').insert([result]).select().single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'get-results': {
        const { comp_id } = params;
        const { data, error } = await supabase.from('competition_results').select('*').eq('comp_id', comp_id).order('rank', { ascending: true });
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'update-registration': {
        const { registration_id, ...updates } = params;
        const { data, error } = await supabase.from('competition_registrations').update(updates).eq('registration_id', registration_id).select().single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'delete-registration': {
        const { registration_id } = params;
        const { error } = await supabase.from('competition_registrations').delete().eq('registration_id', registration_id);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(null, context.request, { startTime });
      }

      case 'update': {
        const { comp_id, ...updates } = params;
        const updateData: any = {};
        if (updates.name) updateData.name = updates.name;
        if (updates.level) updateData.level = updates.level;
        if (updates.date) updateData.competition_date = updates.date;
        if (updates.description !== undefined) updateData.description = updates.description;
        if (updates.category !== undefined) updateData.category = updates.category;
        if (updates.status !== undefined) updateData.status = updates.status;

        const { error: updateError } = await supabase.from('competitions').update(updateData).eq('comp_id', comp_id);
        if (updateError) return apiDbError(updateError, context.request, { startTime });

        if (updates.participatingClubs !== undefined) {
          const { data: currentClubs } = await supabase.from('competition_clubs').select('club_id').eq('comp_id', comp_id);
          const currentIds = new Set(currentClubs?.map((c: any) => c.club_id) || []);
          const newIds = new Set(updates.participatingClubs as string[]);
          const toRemove = [...currentIds].filter(id => !newIds.has(id));
          const toAdd = [...newIds].filter(id => !currentIds.has(id));
          if (toRemove.length > 0) await supabase.from('competition_clubs').delete().eq('comp_id', comp_id).in('club_id', toRemove);
          if (toAdd.length > 0) {
            const clubRecords = toAdd.map((clubId: string) => ({ comp_id, club_id: clubId }));
            await supabase.from('competition_clubs').insert(clubRecords);
          }
        }
        return apiSuccess(null, context.request, { startTime });
      }

      case 'delete': {
        const { comp_id } = params;
        await supabase.from('competition_clubs').delete().eq('comp_id', comp_id);
        await supabase.from('competition_registrations').delete().eq('comp_id', comp_id);
        await supabase.from('competition_results').delete().eq('comp_id', comp_id);
        const { error } = await supabase.from('competitions').delete().eq('comp_id', comp_id);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(null, context.request, { startTime });
      }

      default:
        return apiError(400, 'VALIDATION_ERROR', `Unknown action: ${action}`, context.request, { startTime });
    }
  } catch (error: any) {
    console.error(`[competitions POST] action=${action}:`, error?.message || error);
    return apiDbError(error, context.request, { startTime });
  }
});

export const onRequestGet = withAuth(async (context: AuthenticatedContext) => {
  return apiMethodNotAllowed(context.request);
});
