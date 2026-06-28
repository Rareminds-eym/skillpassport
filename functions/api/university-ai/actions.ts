import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { getContextUser, withAuth } from '../../lib/auth';
import { apiDbError, apiError, apiSuccess } from '../../lib/response';
import { getServiceClient } from '../../lib/supabase';

export const onRequestPost = withAuth(async (context: AuthenticatedContext) => {
  const env = context.env;
  const supabase = getServiceClient(env);

  let body: Record<string, any>;
  try { body = await context.request.json(); } catch { return apiError(400, 'VALIDATION_ERROR', 'Invalid JSON body', context.request); }

  const { action, ...params } = body;
  if (!action) return apiError(400, 'VALIDATION_ERROR', 'Missing action field', context.request);

  const startTime = Date.now();

  try {
    switch (action) {

      case 'get-colleges-by-university': {
        const { universityId } = params;
        if (!universityId) return apiError(400, 'VALIDATION_ERROR', 'Missing universityId', context.request, { startTime });
        const { data, error } = await supabase
          .from('university_colleges')
          .select('*, university:organizations!university_id(name, code), college:organizations!college_id(name, code, city, state, email, phone, website, address, description, admin_id)')
          .eq('university_id', universityId)
          .order('name');
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'add-college-to-university': {
        const { universityId, organizationId, ...additionalData } = params;
        if (!universityId || !organizationId) return apiError(400, 'VALIDATION_ERROR', 'Missing universityId or organizationId', context.request, { startTime });
        const { data: org, error: orgError } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', organizationId)
          .eq('organization_type', 'college')
          .maybeSingle();
        if (orgError) return apiDbError(orgError, context.request, { startTime });
        if (!org) return apiError(400, 'VALIDATION_ERROR', 'College organization not found', context.request, { startTime });
        const currentUserId = getContextUser(context).id;
        const { code: existingCode, ...restData } = additionalData;
        let code = existingCode;
        if (!code) {
          const filteredName = org.name.replace(/\b(college|university|institute|of|the|and|for)\b/gi, '').trim();
          const words = filteredName.split(/\s+/).filter((w: string) => w.length > 0);
          code = words.map((w: string) => w.charAt(0).toUpperCase()).join('').slice(0, 6);
          if (code.length < 3) {
            code = org.name.replace(/\s+/g, '').slice(0, 6).toUpperCase();
          }
        }
        const { data, error } = await supabase
          .from('university_colleges')
          .insert({ university_id: universityId, college_id: organizationId, code, created_by: currentUserId, ...restData })
          .select()
          .single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'get-available-colleges': {
        const { universityId } = params;
        if (!universityId) return apiError(400, 'VALIDATION_ERROR', 'Missing universityId', context.request, { startTime });
        const { data: allColleges, error: collegesError } = await supabase
          .from('organizations')
          .select('*')
          .eq('organization_type', 'college')
          .eq('approval_status', 'approved');
        if (collegesError) return apiDbError(collegesError, context.request, { startTime });
        const { data: linkedColleges, error: linkedError } = await supabase
          .from('university_colleges')
          .select('college_id')
          .eq('university_id', universityId);
        if (linkedError) return apiDbError(linkedError, context.request, { startTime });
        const linkedIds = new Set((linkedColleges || []).map((lc: any) => lc.college_id));
        const available = (allColleges || []).filter((c: any) => !linkedIds.has(c.id));
        return apiSuccess(available, context.request, { startTime });
      }

      case 'update-university-college': {
        const { collegeId, ...updateData } = params;
        if (!collegeId) return apiError(400, 'VALIDATION_ERROR', 'Missing collegeId', context.request, { startTime });
        const { data, error } = await supabase
          .from('university_colleges')
          .update(updateData)
          .eq('id', collegeId)
          .select()
          .single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'remove-college-from-university': {
        const { collegeId } = params;
        if (!collegeId) return apiError(400, 'VALIDATION_ERROR', 'Missing collegeId', context.request, { startTime });
        const { data, error } = await supabase
          .from('university_colleges')
          .update({ account_status: 'inactive' })
          .eq('id', collegeId)
          .select()
          .single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'check-college-code-unique': {
        const { universityId, code, excludeId } = params;
        if (!universityId || !code) return apiError(400, 'VALIDATION_ERROR', 'Missing universityId or code', context.request, { startTime });
        let query = supabase.from('university_colleges').select('id').eq('university_id', universityId).eq('code', code);
        if (excludeId) query = query.neq('id', excludeId);
        const { data, error } = await query;
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ isUnique: !data || data.length === 0 }, context.request, { startTime });
      }

      case 'get-university-college-stats': {
        const { universityId } = params;
        if (!universityId) return apiError(400, 'VALIDATION_ERROR', 'Missing universityId', context.request, { startTime });
        const { data, error } = await supabase
          .from('university_colleges')
          .select('account_status')
          .eq('university_id', universityId);
        if (error) return apiDbError(error, context.request, { startTime });
        const stats: Record<string, number> = {};
        for (const row of data || []) {
          const status = row.account_status || 'unknown';
          stats[status] = (stats[status] || 0) + 1;
        }
        return apiSuccess(stats, context.request, { startTime });
      }

      case 'get-universities': {
        const { data, error } = await supabase
          .from('organizations')
          .select('id, name')
          .eq('organization_type', 'university')
          .order('name');
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'get-university-by-id': {
        const { universityId } = params;
        if (!universityId) return apiError(400, 'VALIDATION_ERROR', 'Missing universityId', context.request, { startTime });
        const { data, error } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', universityId)
          .eq('organization_type', 'university')
          .single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'get-university-by-owner': {
        const { userId } = params;
        if (!userId) return apiError(400, 'VALIDATION_ERROR', 'Missing userId', context.request, { startTime });
        const { data, error } = await supabase
          .from('organizations')
          .select('*')
          .eq('organization_type', 'university')
          .eq('admin_id', userId)
          .maybeSingle();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'create-university': {
        const { ...universityData } = params;
        const currentUserId = getContextUser(context).id;
        const { data, error } = await supabase
          .from('organizations')
          .insert({
            ...universityData,
            organization_type: 'university',
            admin_id: currentUserId,
            approval_status: 'approved',
            account_status: 'active',
            is_active: true,
          })
          .select()
          .single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'check-university-college-code': {
        const { universityId, code } = params;
        if (!universityId || !code) return apiError(400, 'VALIDATION_ERROR', 'Missing universityId or code', context.request, { startTime });
        const { data, error } = await supabase
          .from('university_colleges')
          .select('id')
          .eq('university_id', universityId)
          .eq('code', code);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ isUnique: !data || data.length === 0 }, context.request, { startTime });
      }

      case 'create-university-college': {
        const { ...collegeData } = params;
        const currentUserId = getContextUser(context).id;
        const { data, error } = await supabase
          .from('university_colleges')
          .insert({ ...collegeData, created_by: currentUserId })
          .select()
          .single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'get-university-college-by-owner': {
        const { userId } = params;
        if (!userId) return apiError(400, 'VALIDATION_ERROR', 'Missing userId', context.request, { startTime });
        const { data, error } = await supabase
          .from('university_colleges')
          .select('*, university:organizations!university_id(name)')
          .eq('created_by', userId);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'get-active-universities': {
        const { data, error } = await supabase
          .from('organizations')
          .select('id, name')
          .eq('organization_type', 'university')
          .eq('is_active', true)
          .order('name');
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      default:
        return apiError(400, 'VALIDATION_ERROR', 'Unknown action: ' + action, context.request, { startTime });
    }
  } catch (error: any) {
    console.error(`[university-ai/actions] action=${action}:`, error?.message || error);
    return apiDbError(error, context.request, { startTime });
  }
});
