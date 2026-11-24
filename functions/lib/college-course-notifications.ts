import type { SupabaseClient } from '@supabase/supabase-js';
import { notifyRealtime } from './realtime';

// Persistence belongs to the curriculum transaction; websocket delivery is best effort.
export async function publishCollegeCourseNotifications(db: SupabaseClient, env: Parameters<typeof notifyRealtime>[0], requestId: string, type: string) {
  try {
    let { data, error } = await db.from('notifications').select('*').eq('curriculum_change_id', requestId).eq('type', type);
    if (error) throw error;

    if ((!data || data.length === 0) && type === 'curriculum_change_submitted') {
      const { data: currList } = await db.from('college_curriculums').select('id, college_id, course_id, pending_changes, academic_year');
      for (const curr of currList || []) {
        const changes = Array.isArray(curr.pending_changes) ? curr.pending_changes : [];
        const proposal = changes.find((r: any) => r.id === requestId);
        if (proposal) {
          const { data: collegeUsers } = await db.from('users').select('id, email').eq('organizationId', curr.college_id).eq('isActive', true);
          let courseTitle = 'a course';
          if (curr.course_id) {
            const { data: c } = await db.from('college_courses').select('course_name').eq('id', curr.course_id).maybeSingle();
            if (c?.course_name) courseTitle = c.course_name;
          }
          let educatorName = proposal.requester_name || '';
          if (!educatorName && proposal.requested_by) {
            const { data: u } = await db.from('users').select('email').eq('id', proposal.requested_by).maybeSingle();
            educatorName = u?.email || 'An educator';
          }
          const entityLabel = (proposal.change_type === 'unit_add' || proposal.change_type === 'unit_edit') ? 'unit' : 'learning outcome';
          const actionVerb = proposal.change_type?.endsWith('_add') ? 'a new' : 'an edit to a';
          const message = `${educatorName} submitted ${actionVerb} ${entityLabel} for ${courseTitle} (${curr.academic_year || 'current'}).`;

          const eligibleUsers = (collegeUsers || []).filter(u => u.id !== proposal.requested_by);
          for (const u of eligibleUsers) {
            await db.from('notifications').insert({
              recipient_id: u.id,
              type: 'curriculum_change_submitted',
              title: 'Curriculum change awaiting review',
              message,
              read: false,
              curriculum_change_id: requestId,
              action_url: `/college-admin/academics/curriculum?reviewChange=${requestId}`,
            });
          }
          const refetch = await db.from('notifications').select('*').eq('curriculum_change_id', requestId).eq('type', type);
          data = refetch.data || [];
          break;
        }
      }
    }

    await Promise.all((data || []).map(row => notifyRealtime(env, 'notifications', 'INSERT', row)));
  } catch {
    console.error('Could not broadcast curriculum notifications. Saved notifications remain available in the bell.');
  }
}
