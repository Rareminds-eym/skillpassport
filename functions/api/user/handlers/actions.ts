import { withAuth, getContextUser } from '../../../lib/auth';
import { getServiceClient } from '../../../lib/supabase';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { apiSuccess, apiDbError, apiError } from '../../../lib/response';

export const onRequestPost = withAuth(async (context: AuthenticatedContext) => {
  getContextUser(context);
  const env = context.env as Record<string, string>;
  const supabase = getServiceClient(env as any);

  let body: Record<string, any>;
  try { body = await context.request.json() as any; } catch { return apiError(400, 'VALIDATION_ERROR', 'Invalid JSON', context.request); }

  const { action, ...params } = body;
  if (!action) return apiError(400, 'VALIDATION_ERROR', 'Missing action', context.request);

  const startTime = Date.now();

  try {
    switch (action) {

      case 'add-document': {
        const { p_user_id, p_document_type, p_document_name, p_document_url, p_file_size, p_file_type } = params;
        if (!p_user_id || !p_document_type || !p_document_name || !p_document_url) {
          return apiError(400, 'VALIDATION_ERROR', 'Missing required document fields', context.request, { startTime });
        }
        const { data, error } = await supabase.rpc('add_user_document', {
          p_user_id, p_document_type, p_document_name, p_document_url, p_file_size, p_file_type,
        });
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ document: data }, context.request, { startTime });
      }

      case 'verify-document': {
        const { documentId, verification_status, verified_at, verified_by, rejection_reason } = params;
        if (!documentId || !verification_status) {
          return apiError(400, 'VALIDATION_ERROR', 'Missing documentId or verification_status', context.request, { startTime });
        }
        const updateData: any = { verification_status, verified_at, verified_by };
        if (verification_status === 'rejected' && rejection_reason) {
          updateData.rejection_reason = rejection_reason;
        }
        const { error } = await supabase.from('user_documents').update(updateData).eq('id', documentId);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ verified: true }, context.request, { startTime });
      }

      case 'create-bulk-import': {
        const { imported_by, file_name, file_url } = params;
        if (!imported_by || !file_name || !file_url) {
          return apiError(400, 'VALIDATION_ERROR', 'Missing required fields', context.request, { startTime });
        }
        const { data, error } = await supabase.from('user_bulk_imports').insert({
          imported_by, file_name, file_url, status: 'pending',
        }).select().single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'get-bulk-import-status': {
        const { importId } = params;
        if (!importId) return apiError(400, 'VALIDATION_ERROR', 'Missing importId', context.request, { startTime });
        const { data, error } = await supabase.from('user_bulk_imports').select('*').eq('id', importId).single();
        if (error && error.code !== 'PGRST116') return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'get-current-user-role': {
        const { userId } = params;
        if (!userId) return apiError(400, 'VALIDATION_ERROR', 'Missing userId', context.request, { startTime });
        const { data, error } = await supabase.from('users').select('role').eq('id', userId).single();
        if (error && error.code !== 'PGRST116') return apiDbError(error, context.request, { startTime });
        return apiSuccess({ role: data?.role || null }, context.request, { startTime });
      }

      case 'get-permissions': {
        const { userId } = params;
        if (!userId) return apiError(400, 'VALIDATION_ERROR', 'Missing userId', context.request, { startTime });
        const { data: userData, error: userError } = await supabase.from('users').select('role').eq('id', userId).single();
        if (userError) return apiDbError(userError, context.request, { startTime });
        if (!userData?.role) return apiSuccess({ permissions: {} }, context.request, { startTime });
        const { data: permissionsData, error: permError } = await supabase
          .from('college_role_module_permissions')
          .select(`college_setting_modules(module_name), college_setting_permissions(permission_name)`)
          .eq('role_type', userData.role);
        if (permError) return apiDbError(permError, context.request, { startTime });
        const permissions: Record<string, string[]> = {};
        (permissionsData || []).forEach((item: any) => {
          const mod = item.college_setting_modules?.module_name;
          const perm = item.college_setting_permissions?.permission_name;
          if (mod && perm) {
            if (!permissions[mod]) permissions[mod] = [];
            permissions[mod].push(perm);
          }
        });
        return apiSuccess({ permissions }, context.request, { startTime });
      }

      case 'get-user-settings': {
        const { userId } = params;
        if (!userId) return apiError(400, 'VALIDATION_ERROR', 'Missing userId', context.request, { startTime });
        let { data, error } = await supabase.from('user_settings').select('*').eq('user_id', userId).maybeSingle();
        if (error && error.code !== 'PGRST116') return apiDbError(error, context.request, { startTime });
        if (!data) {
          const defaultSettings = {
            user_id: userId,
            notification_preferences: {
              emailNotifications: true, applicationUpdates: true, newOpportunities: true,
              recruitingMessages: true, weeklyDigest: false, monthlyReport: false,
            },
            privacy_settings: {
              profileVisibility: 'public', showEmail: false, showPhone: false,
              showLocation: true, allowRecruiterContact: true, showInTalentPool: true,
            },
            ui_preferences: {},
            communication_preferences: {},
          };
          const { data: newData, error: createError } = await supabase.from('user_settings').insert(defaultSettings).select().single();
          if (createError) return apiDbError(createError, context.request, { startTime });
          data = newData;
        }
        return apiSuccess(data, context.request, { startTime });
      }

      case 'update-user-settings': {
        const { userId, settings } = params;
        if (!userId || !settings) return apiError(400, 'VALIDATION_ERROR', 'Missing userId or settings', context.request, { startTime });
        const { data, error } = await supabase.from('user_settings').update({
          ...settings, updated_at: new Date().toISOString(), updated_by: userId,
        }).eq('user_id', userId).select().single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'get-learner-by-email': {
        const { email } = params;
        if (!email) return apiError(400, 'VALIDATION_ERROR', 'Missing email', context.request, { startTime });
        const { data, error } = await supabase.from('learners').select('id, profile').eq('profile->>email', email).maybeSingle();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ learner: data }, context.request, { startTime });
      }

      case 'get-recent-updates': {
        const { learnerId } = params;
        if (!learnerId) return apiError(400, 'VALIDATION_ERROR', 'Missing learnerId', context.request, { startTime });
        const { data, error } = await supabase.from('recent_updates').select('*').eq('learner_id', learnerId).maybeSingle();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ recentUpdates: data }, context.request, { startTime });
      }

      case 'get-teacher-role-by-email': {
        const { email } = params;
        if (!email) return apiError(400, 'VALIDATION_ERROR', 'Missing email', context.request, { startTime });
        const { data, error } = await supabase.from('teachers').select('role').eq('email', email).maybeSingle();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ role: data?.role || null }, context.request, { startTime });
      }

      case 'get-educator-role-by-email': {
        const { email } = params;
        if (!email) return apiError(400, 'VALIDATION_ERROR', 'Missing email', context.request, { startTime });
        const { data, error } = await supabase.from('school_educators').select('role').eq('email', email).maybeSingle();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ role: data?.role || null }, context.request, { startTime });
      }

      case 'lookup-user-roles': {
        const { userId, email } = params;
        if (!userId) return apiError(400, 'VALIDATION_ERROR', 'Missing userId', context.request, { startTime });
        const foundRoles: string[] = [];
        const foundUserData: Record<string, any>[] = [];

        const { data: learnerData, error: learnerError } = await supabase.from('learners').select('*').eq('user_id', userId).maybeSingle();
        if (!learnerError && learnerData) {
          foundRoles.push('learner');
          foundUserData.push({ id: learnerData.id, email: learnerData.email, name: learnerData.name, school_id: learnerData.school_id, university_college_id: learnerData.university_college_id, role: 'learner', ...learnerData });
        }

        const { data: recruiterData, error: recruiterError } = await supabase.from('recruiters').select('*').eq('user_id', userId).maybeSingle();
        if (!recruiterError && recruiterData) {
          foundRoles.push('recruiter');
          foundUserData.push({ id: recruiterData.id, email: recruiterData.email, name: recruiterData.name, role: 'recruiter', ...recruiterData });
        }

        const { data: educatorData, error: educatorError } = await supabase.from('school_educators').select('*').eq('user_id', userId).maybeSingle();
        if (!educatorError && educatorData) {
          foundRoles.push('educator');
          const name = educatorData.first_name && educatorData.last_name
            ? `${educatorData.first_name} ${educatorData.last_name}`
            : educatorData.first_name || educatorData.last_name || undefined;
          foundUserData.push({ id: educatorData.id, email: educatorData.email, name, school_id: educatorData.school_id, role: 'educator', ...educatorData });
        }

        const { data: userData, error: userError } = await supabase.from('users').select('*').eq('id', userId).maybeSingle();
        if (!userError && userData && userData.role) {
          const userRole = userData.role as string;
          const adminRoles = ['school_admin', 'college_admin', 'university_admin'];
          const educatorRoles = ['college_educator', 'school_educator'];
          if (adminRoles.includes(userRole)) {
            foundRoles.push(userRole);
            foundUserData.push({ id: userData.id, email: userData.email || email, role: userRole, ...userData, name: userData.firstName && userData.lastName ? `${userData.firstName} ${userData.lastName}` : userData.firstName || userData.lastName });
          } else if (educatorRoles.includes(userRole)) {
            foundRoles.push('educator');
            foundUserData.push({ id: userData.id, email: userData.email || email, role: 'educator', school_id: userRole === 'school_educator' ? userData.organizationId : undefined, university_college_id: userRole === 'college_educator' ? userData.organizationId : undefined, ...userData, name: userData.firstName && userData.lastName ? `${userData.firstName} ${userData.lastName}` : userData.firstName || userData.lastName });
          } else if (['learner', 'learner'].includes(userRole)) {
            foundRoles.push('learner');
            foundUserData.push({ id: userData.id, email: userData.email || email, role: 'learner', school_id: userRole === 'learner' ? userData.organizationId : undefined, university_college_id: userRole === 'learner' ? userData.organizationId : undefined, ...userData, name: userData.firstName && userData.lastName ? `${userData.firstName} ${userData.lastName}` : userData.firstName || userData.lastName });
          } else if (userRole === 'recruiter') {
            foundRoles.push('recruiter');
            foundUserData.push({ id: userData.id, email: userData.email || email, role: 'recruiter', ...userData, name: userData.firstName && userData.lastName ? `${userData.firstName} ${userData.lastName}` : userData.firstName || userData.lastName });
          } else if (['super_admin', 'company_admin'].includes(userRole)) {
            foundRoles.push('school_admin');
            foundUserData.push({ id: userData.id, email: userData.email || email, role: 'school_admin', ...userData, name: userData.firstName && userData.lastName ? `${userData.firstName} ${userData.lastName}` : userData.firstName || userData.lastName });
          }
        }

        const result: Record<string, any> = {};
        if (foundRoles.length === 0) {
          result.role = null; result.userData = null; result.error = 'Account not properly configured. Contact support';
        } else if (foundRoles.length === 1) {
          result.role = foundRoles[0]; result.userData = foundUserData[0];
        } else {
          result.role = null; result.roles = foundRoles; result.userData = null; result.allUserData = foundUserData;
        }
        return apiSuccess(result, context.request, { startTime });
      }

      case 'get-notification-preferences-by-email': {
        const { email } = params;
        if (!email) return apiError(400, 'VALIDATION_ERROR', 'Missing email', context.request, { startTime });
        const { data: learner, error: learnerError } = await supabase.from('learners').select('user_id').eq('email', email).maybeSingle();
        if (learnerError || !learner?.user_id) {
          return apiSuccess({ notification_preferences: null }, context.request, { startTime });
        }
        const { data: settings } = await supabase.from('user_settings').select('*').eq('user_id', learner.user_id).maybeSingle();
        return apiSuccess({ notification_preferences: settings?.notification_preferences || null, privacy_settings: settings?.privacy_settings || null }, context.request, { startTime });
      }

      default:
        return apiError(400, 'VALIDATION_ERROR', `Unknown action: ${action}`, context.request, { startTime });
    }
  } catch (error: any) {
    console.error(`[user/actions] action=${action}:`, error?.message || error);
    return apiDbError(error, context.request, { startTime });
  }
});
