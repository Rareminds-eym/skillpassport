/**
 * College Admin - Clubs API
 * POST: Action-based dispatch for clubs, enrollments, attendance
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
      case 'get-clubs': {
        const ctx = await getUserSchoolContext(supabase, user.id);
        if (!ctx) return apiError(403, 'AUTH_ERROR', 'Unable to determine school affiliation', context.request, { startTime });
        const { data: clubs, error } = await supabase.from('clubs').select('*').eq('school_id', ctx.schoolId).eq('is_active', true).order('name');
        if (error) return apiDbError(error, context.request, { startTime });

        const withMembers = await Promise.all((clubs || []).map(async (club: any) => {
          const { count } = await supabase.from('club_memberships').select('*', { count: 'exact', head: true }).eq('club_id', club.club_id).eq('status', 'active');
          const { data: memberships } = await supabase.from('club_memberships').select('learner_email').eq('club_id', club.club_id).eq('status', 'active');
          return { ...club, member_count: count || 0, members: memberships?.map((m: any) => m.learner_email) || [] };
        }));
        return apiSuccess(withMembers, context.request, { startTime });
      }

      case 'create-club': {
        const ctx = await getUserSchoolContext(supabase, user.id);
        if (!ctx) return apiError(403, 'AUTH_ERROR', 'Unable to determine school affiliation', context.request, { startTime });
        const { name, category, description, capacity, mentor_email, mentor_type, mentor_educator_id, mentor_school_id, meeting_day, meeting_time, location, school_id } = params;

        const targetSchoolId = school_id || ctx.schoolId;
        let mentorType = mentor_type || null;
        let mentorEducatorId = mentor_educator_id || null;
        let mentorSchoolId = mentor_school_id || null;

        if (mentor_email && !mentorEducatorId) {
          const { data: educatorData } = await supabase.from('school_educators').select('id').eq('email', mentor_email).eq('school_id', targetSchoolId).maybeSingle();
          if (educatorData?.id) {
            mentorType = 'educator';
            mentorEducatorId = educatorData.id;
          }
        }

        const newClub: any = {
          school_id: targetSchoolId, name, category, description, capacity,
          meeting_day: meeting_day || null, meeting_time: meeting_time || null, location: location || null,
          mentor_type: mentorType, mentor_educator_id: mentorEducatorId, mentor_school_id: mentorSchoolId,
          is_active: true,
          created_by_type: ctx.type,
          ...(ctx.type === 'educator' ? { created_by_educator_id: ctx.id } : { created_by_admin_id: ctx.id }),
        };

        const { data, error } = await supabase.from('clubs').insert([newClub]).select().single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ ...data, member_count: 0, members: [] }, context.request, { startTime });
      }

      case 'enroll-learner': {
        const { club_id, learner_email } = params;
        const ctx = await getUserSchoolContext(supabase, user.id);
        if (!ctx) return apiError(403, 'AUTH_ERROR', 'Unable to determine school affiliation', context.request, { startTime });

        const { data: existing } = await supabase.from('club_memberships').select('*').eq('club_id', club_id).eq('learner_email', learner_email).maybeSingle();

        if (existing) {
          if (existing.status === 'active') return apiError(400, 'VALIDATION_ERROR', 'Learner is already enrolled in this club', context.request, { startTime });
          if (existing.status === 'withdrawn') {
            const { data, error } = await supabase.from('club_memberships').update({
              status: 'active', enrolled_by_type: ctx.type,
              enrolled_at: new Date().toISOString(), withdrawn_at: null,
              ...(ctx.type === 'educator' ? { enrolled_by_educator_id: ctx.id, enrolled_by_admin_id: null } : { enrolled_by_admin_id: ctx.id, enrolled_by_educator_id: null }),
            }).eq('membership_id', existing.membership_id).select().single();
            if (error) return apiDbError(error, context.request, { startTime });
            return apiSuccess(data, context.request, { startTime });
          }
        }

        const membership = {
          club_id, learner_email, status: 'active', enrolled_by_type: ctx.type,
          ...(ctx.type === 'educator' ? { enrolled_by_educator_id: ctx.id } : { enrolled_by_admin_id: ctx.id }),
        };

        const { data, error } = await supabase.from('club_memberships').insert([membership]).select().single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'remove-learner': {
        const { club_id, learner_email } = params;
        const { error } = await supabase.from('club_memberships').update({ status: 'withdrawn', withdrawn_at: new Date().toISOString() }).eq('club_id', club_id).eq('learner_email', learner_email);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(null, context.request, { startTime });
      }

      case 'get-club-members': {
        const { club_id } = params;
        const { data, error } = await supabase.from('club_memberships').select('*').eq('club_id', club_id).eq('status', 'active').order('enrolled_at', { ascending: false });
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'mark-attendance': {
        const { club_id, session_date, session_topic, attendance_records } = params;
        const ctx = await getUserSchoolContext(supabase, user.id);
        if (!ctx) return apiError(403, 'AUTH_ERROR', 'Unable to determine school affiliation', context.request, { startTime });

        let sessionData: any;
        const { data: existingSession } = await supabase.from('club_attendance').select('attendance_id').eq('club_id', club_id).eq('session_date', session_date).maybeSingle();

        if (existingSession) {
          const { error: ue } = await supabase.from('club_attendance').update({ session_topic }).eq('attendance_id', existingSession.attendance_id);
          if (ue) return apiDbError(ue, context.request, { startTime });
          sessionData = existingSession;
        } else {
          const session = {
            club_id, session_date, session_topic,
            created_by_type: ctx.type,
            ...(ctx.type === 'educator' ? { created_by_educator_id: ctx.id } : { created_by_admin_id: ctx.id }),
          };
          const { data: newSession, error: se } = await supabase.from('club_attendance').insert([session]).select().single();
          if (se) return apiDbError(se, context.request, { startTime });
          sessionData = newSession;
        }

        const records = (attendance_records || []).map((r: any) => ({
          attendance_id: sessionData.attendance_id,
          learner_email: r.learner_email,
          status: r.status,
          marked_by_type: ctx.type,
          ...(ctx.type === 'educator' ? { marked_by_educator_id: ctx.id } : { marked_by_admin_id: ctx.id }),
        }));

        const { error: re } = await supabase.from('club_attendance_records').insert(records);
        if (re) {
          if (re.code === '23505') {
            await supabase.from('club_attendance_records').delete().eq('attendance_id', sessionData.attendance_id);
            const { error: re2 } = await supabase.from('club_attendance_records').insert(records);
            if (re2) return apiDbError(re2, context.request, { startTime });
          } else {
            return apiDbError(re, context.request, { startTime });
          }
        }

        return apiSuccess(null, context.request, { startTime });
      }

      case 'get-club-details': {
        const { club_id } = params;
        const { data: clubs, error } = await supabase.from('clubs').select('*').eq('club_id', club_id).single();
        if (error) return apiDbError(error, context.request, { startTime });

        const { count: memberCount } = await supabase.from('club_memberships').select('*', { count: 'exact', head: true }).eq('club_id', club_id).eq('status', 'active');

        let mentorName = null;
        if (clubs.mentor_educator_id) {
          const { data: ment } = await supabase.from('school_educators').select('first_name, last_name').eq('id', clubs.mentor_educator_id).maybeSingle();
          if (ment) mentorName = `${ment.first_name || ''} ${ment.last_name || ''}`.trim();
        }

        const { count: upcomingCompetitions } = await supabase.from('competition_clubs').select('*, competitions!inner(comp_id, status)', { count: 'exact', head: true }).eq('club_id', club_id).eq('competitions.status', 'upcoming');

        return apiSuccess({
          ...clubs,
          member_count: memberCount || 0,
          mentor_name: mentorName,
          upcoming_competitions: upcomingCompetitions || 0,
        }, context.request, { startTime });
      }

      case 'update-club': {
        const { club_id, ...updates } = params;
        const { data, error } = await supabase.from('clubs').update({ ...updates, updated_at: new Date().toISOString() }).eq('club_id', club_id).select().single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'delete-club': {
        const { club_id } = params;
        const { error } = await supabase.from('clubs').update({ is_active: false, updated_at: new Date().toISOString() }).eq('club_id', club_id);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(null, context.request, { startTime });
      }

      default:
        return apiError(400, 'VALIDATION_ERROR', `Unknown action: ${action}`, context.request, { startTime });
    }
  } catch (error: any) {
    console.error(`[clubs POST] action=${action}:`, error?.message || error);
    return apiDbError(error, context.request, { startTime });
  }
});

export const onRequestGet = withAuth(async (context: AuthenticatedContext) => {
  return apiMethodNotAllowed(context.request);
});
