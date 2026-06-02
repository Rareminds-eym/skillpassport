import { withAuth, getContextUser } from '../../lib/auth';
import { getServiceClient } from '../../lib/supabase';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { apiSuccess, apiError } from '../../lib/response';

export const onRequestPost = withAuth(async (context: AuthenticatedContext) => {
  getContextUser(context);
  const env = context.env as Record<string, string>;
  const supabase = getServiceClient(env as any);

  let body: any;
  try {
    body = await context.request.json() as any;
  } catch {
    return apiError(400, 'VALIDATION_ERROR', 'Invalid JSON body', context.request);
  }

  const { action, ...params } = body;
  if (!action) return apiError(400, 'VALIDATION_ERROR', 'action is required', context.request);

  try {
    switch (action) {
      case 'create': {
        const { recipient_id, type, title, message } = params;
        if (!recipient_id || !type || !title) {
          return apiError(400, 'VALIDATION_ERROR', 'recipient_id, type, and title are required', context.request);
        }
        const { data, error } = await supabase
          .from('notifications')
          .insert({ recipient_id, type, title, message: message || '', read: false })
          .select()
          .single();
        if (error) throw error;
        return apiSuccess(data, context.request);
      }

      case 'notify-training-submission': {
        const { school_id, learner_name, training_title, training_id } = params;
        const { data: schoolAdmin } = await supabase
          .from('school_educators')
          .select('user_id')
          .eq('school_id', school_id)
          .eq('role', 'admin')
          .maybeSingle();
        if (!schoolAdmin?.user_id) return apiSuccess(null, context.request);

        const { error } = await supabase.from('notifications').insert({
          recipient_id: schoolAdmin.user_id,
          type: 'training_submitted',
          title: 'New Training Submitted',
          message: `${learner_name} submitted "${training_title}" for approval`,
          read: false,
        });
        if (error) throw error;
        return apiSuccess(null, context.request);
      }

      case 'notify-experience-submission': {
        const { school_id, learner_name, experience_title, experience_id } = params;
        const { data: schoolAdmin } = await supabase
          .from('school_educators')
          .select('user_id')
          .eq('school_id', school_id)
          .eq('role', 'admin')
          .maybeSingle();
        if (!schoolAdmin?.user_id) return apiSuccess(null, context.request);

        const { error } = await supabase.from('notifications').insert({
          recipient_id: schoolAdmin.user_id,
          type: 'experience_submitted',
          title: 'New Experience Submitted',
          message: `${learner_name} submitted "${experience_title}" for approval`,
          read: false,
        });
        if (error) throw error;
        return apiSuccess(null, context.request);
      }

      case 'notify-project-submission': {
        const { school_id, learner_name, project_title, project_id } = params;
        const { data: schoolAdmin } = await supabase
          .from('school_educators')
          .select('user_id')
          .eq('school_id', school_id)
          .eq('role', 'admin')
          .maybeSingle();
        if (!schoolAdmin?.user_id) return apiSuccess(null, context.request);

        const { error } = await supabase.from('notifications').insert({
          recipient_id: schoolAdmin.user_id,
          type: 'project_submitted',
          title: 'New Project Submitted',
          message: `${learner_name} submitted "${project_title}" for approval`,
          read: false,
        });
        if (error) throw error;
        return apiSuccess(null, context.request);
      }

      case 'notify-college-admin': {
        const { college_id, type, title, message } = params;
        const { data: collegeAdmin } = await supabase
          .from('users')
          .select('id')
          .eq('organizationId', college_id)
          .eq('role', 'college_admin')
          .maybeSingle();
        if (!collegeAdmin?.id) return apiSuccess(null, context.request);

        const { error } = await supabase.from('notifications').insert({
          recipient_id: collegeAdmin.id,
          type,
          title,
          message: message || '',
          read: false,
        });
        if (error) throw error;
        return apiSuccess(null, context.request);
      }

      case 'notify-approval-status': {
        const { learner_id, type, item_title, item_id, notes } = params;
        const { data: learner } = await supabase
          .from('learners')
          .select('user_id, name')
          .eq('id', learner_id)
          .maybeSingle();
        if (!learner?.user_id) return apiSuccess(null, context.request);

        const isApproved = type.includes('approved');
        const notifTitle = isApproved
          ? `${type.split('_')[0].charAt(0).toUpperCase() + type.split('_')[0].slice(1)} Approved`
          : `${type.split('_')[0].charAt(0).toUpperCase() + type.split('_')[0].slice(1)} Rejected`;
        const notifMessage = isApproved
          ? `Your ${type.split('_')[0]} "${item_title}" has been approved`
          : `Your ${type.split('_')[0]} "${item_title}" was rejected${notes ? `: ${notes}` : ''}`;

        const { error } = await supabase.from('notifications').insert({
          recipient_id: learner.user_id,
          type,
          title: notifTitle,
          message: notifMessage,
          read: false,
        });
        if (error) throw error;
        return apiSuccess(null, context.request);
      }

      case 'create-system-alert': {
        const { title, message, admin_type } = params;
        const adminUsers: { user_id: string }[] = [];

        if (!admin_type || admin_type === 'school_admin') {
          const { data } = await supabase
            .from('school_educators')
            .select('user_id')
            .eq('role', 'admin');
          if (data) adminUsers.push(...data);
        }

        if (!admin_type || admin_type === 'college_admin') {
          const { data } = await supabase
            .from('users')
            .select('id')
            .eq('role', 'college_admin');
          if (data) adminUsers.push(...data.map((u: any) => ({ user_id: u.id })));
        }

        if (!admin_type || admin_type === 'university_admin') {
          const { data } = await supabase
            .from('users')
            .select('id')
            .eq('role', 'university_admin');
          if (data) adminUsers.push(...data.map((u: any) => ({ user_id: u.id })));
        }

        const notifications = adminUsers.map(a => ({
          recipient_id: a.user_id,
          type: 'system_alert',
          title,
          message: message || '',
          read: false,
        }));

        if (notifications.length > 0) {
          const { error } = await supabase.from('notifications').insert(notifications);
          if (error) throw error;
        }
        return apiSuccess(null, context.request);
      }

      default:
        return apiError(400, 'VALIDATION_ERROR', `Unknown action: ${action}`, context.request);
    }
  } catch (error: any) {
    return apiError(500, 'INTERNAL_ERROR', error.message, context.request);
  }
});