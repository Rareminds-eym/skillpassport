/**
 * College Admin - Faculty Management API
 * POST: Action-based dispatch for faculty, lecturers, leaves, substitutions, users, budget, organizations
 */
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { getContextUser, withAuth } from '../../lib/auth';
import { apiDbError, apiError, apiMethodNotAllowed, apiSuccess } from '../../lib/response';
import { getServiceClient } from '../../lib/supabase';

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
      // ── Faculty (college_lecturers) ──
      case 'get-faculty': {
        const { college_id } = params;
        let query = supabase.from('college_lecturers').select('*');
        if (college_id) query = query.eq('collegeId', college_id);
        const { data, error } = await query.order('createdAt', { ascending: false });
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'get-faculty-by-id': {
        const { id } = params;
        if (!id) return apiError(400, 'VALIDATION_ERROR', 'Missing id', context.request, { startTime });
        const { data, error } = await supabase
          .from('college_lecturers')
          .select('*')
          .eq('id', id)
          .single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'create-faculty': {
        const { data, error } = await supabase
          .from('college_lecturers')
          .insert([{ ...params, created_by: user.id }])
          .select()
          .single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'update-faculty': {
        const { id, ...updates } = params;
        if (!id) return apiError(400, 'VALIDATION_ERROR', 'Missing id', context.request, { startTime });
        const { data, error } = await supabase
          .from('college_lecturers')
          .update(updates)
          .eq('id', id)
          .select()
          .single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'delete-faculty': {
        const { id } = params;
        if (!id) return apiError(400, 'VALIDATION_ERROR', 'Missing id', context.request, { startTime });
        const { error } = await supabase
          .from('college_lecturers')
          .update({ accountStatus: 'deactivated' })
          .eq('id', id);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ success: true }, context.request, { startTime });
      }

      case 'delete-faculty-record': {
        const { id } = params;
        if (!id) return apiError(400, 'VALIDATION_ERROR', 'Missing id', context.request, { startTime });
        const { error } = await supabase
          .from('college_lecturers')
          .delete()
          .eq('id', id);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ success: true }, context.request, { startTime });
      }

      // ── Faculty Leaves ──
      case 'get-faculty-leaves': {
        const { college_id, faculty_id } = params;
        let query = supabase.from('college_faculty_leaves').select('*, faculty:college_lecturers!faculty_id(first_name, last_name, email), leave_type:college_leave_types!leave_type_id(name, code, color)');
        if (college_id) query = query.eq('college_id', college_id);
        if (faculty_id) query = query.eq('faculty_id', faculty_id);
        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'get-leave-types': {
        const { college_id } = params;
        if (!college_id) return apiError(400, 'VALIDATION_ERROR', 'Missing college_id', context.request, { startTime });
        const { data, error } = await supabase
          .from('college_leave_types')
          .select('*')
          .eq('college_id', college_id)
          .order('name');
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'get-leave-balances': {
        const { faculty_id, college_id } = params;
        let query = supabase.from('college_faculty_leave_balances').select('*, college_leave_types!leave_type_id(name, code)');
        if (faculty_id) query = query.eq('faculty_id', faculty_id);
        if (college_id) query = query.eq('college_id', college_id);
        const { data, error } = await query;
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'update-leave-balance': {
        const { id, ...updates } = params;
        if (!id) return apiError(400, 'VALIDATION_ERROR', 'Missing id', context.request, { startTime });
        const { data, error } = await supabase
          .from('college_faculty_leave_balances')
          .update(updates)
          .eq('id', id)
          .select()
          .single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'apply-leave': {
        const { data, error } = await supabase
          .from('college_faculty_leaves')
          .insert([{ ...params, status: 'pending', applied_by: user.id }])
          .select()
          .single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'approve-leave': {
        const { id } = params;
        if (!id) return apiError(400, 'VALIDATION_ERROR', 'Missing id', context.request, { startTime });
        const { data, error } = await supabase
          .from('college_faculty_leaves')
          .update({ status: 'approved', approved_by: user.id, approved_at: new Date().toISOString() })
          .eq('id', id)
          .select()
          .single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'reject-leave': {
        const { id, rejection_reason } = params;
        if (!id) return apiError(400, 'VALIDATION_ERROR', 'Missing id', context.request, { startTime });
        const { data, error } = await supabase
          .from('college_faculty_leaves')
          .update({ status: 'rejected', rejection_reason, reviewed_by: user.id, reviewed_at: new Date().toISOString() })
          .eq('id', id)
          .select()
          .single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      // ── Faculty Substitutions ──
      case 'get-faculty-substitutions': {
        const { college_id, faculty_id, substitute_id } = params;
        let query = supabase.from('college_faculty_substitutions')
          .select('*, faculty:college_lecturers!faculty_id(first_name, last_name), substitute:college_lecturers!substitute_id(first_name, last_name), class:college_classes!class_id(name, grade, section)');
        if (college_id) query = query.eq('college_id', college_id);
        if (faculty_id) query = query.eq('faculty_id', faculty_id);
        if (substitute_id) query = query.eq('substitute_id', substitute_id);
        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'update-substitution': {
        const { id, ...updates } = params;
        if (!id) return apiError(400, 'VALIDATION_ERROR', 'Missing id', context.request, { startTime });
        const { data, error } = await supabase
          .from('college_faculty_substitutions')
          .update(updates)
          .eq('id', id)
          .select()
          .single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'create-substitution': {
        const substitutions = params.substitutionEntries || params.substitutions || [params];
        const entries = Array.isArray(substitutions) ? substitutions : [substitutions];
        const enriched = entries.map((e: any) => ({ ...e, created_by: user.id }));
        const { data, error } = await supabase
          .from('college_faculty_substitutions')
          .insert(enriched)
          .select();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'complete-substitution': {
        const { id } = params;
        if (!id) return apiError(400, 'VALIDATION_ERROR', 'Missing id', context.request, { startTime });
        const { data, error } = await supabase
          .from('college_faculty_substitutions')
          .update({ status: 'completed', completed_at: new Date().toISOString() })
          .eq('id', id)
          .select()
          .single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      // ── Lecturers ──
      case 'get-lecturers': {
        const { college_id, department, status, search } = params;
        let query = supabase.from('college_lecturers').select('*');
        if (college_id) query = query.eq('collegeId', college_id);
        if (department) query = query.eq('department', department);
        if (status) query = query.eq('accountStatus', status);
        const { data, error } = await query.order('createdAt', { ascending: false });
        if (error) return apiDbError(error, context.request, { startTime });
        let result = data || [];
        if (search) {
          const s = search.toLowerCase();
          result = result.filter((r: any) =>
            (r.first_name || '').toLowerCase().includes(s) ||
            (r.last_name || '').toLowerCase().includes(s) ||
            (r.email || '').toLowerCase().includes(s) ||
            (r.employeeId || '').toLowerCase().includes(s)
          );
        }
        return apiSuccess(result, context.request, { startTime });
      }

      case 'get-lecturer': {
        const { id } = params;
        if (!id) return apiError(400, 'VALIDATION_ERROR', 'Missing id', context.request, { startTime });
        const { data, error } = await supabase
          .from('college_lecturers')
          .select('*')
          .eq('id', id)
          .single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'create-lecturer': {
        const { data, error } = await supabase
          .from('college_lecturers')
          .insert([params])
          .select()
          .single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'update-lecturer': {
        const { id, ...updates } = params;
        if (!id) return apiError(400, 'VALIDATION_ERROR', 'Missing id', context.request, { startTime });
        const { data, error } = await supabase
          .from('college_lecturers')
          .update(updates)
          .eq('id', id)
          .select()
          .single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'get-lecturer-timetable': {
        const { lecturer_id } = params;
        if (!lecturer_id) return apiError(400, 'VALIDATION_ERROR', 'Missing lecturer_id', context.request, { startTime });
        const { data, error } = await supabase
          .from('timetable_entries')
          .select('*')
          .eq('lecturer_id', lecturer_id)
          .order('day_of_week', { ascending: true })
          .order('start_time', { ascending: true });
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'get-lecturer-workload': {
        const { lecturer_id } = params;
        if (!lecturer_id) return apiError(400, 'VALIDATION_ERROR', 'Missing lecturer_id', context.request, { startTime });
        const { data, error } = await supabase
          .from('course_mappings')
          .select('id, credits, course:course_id(id, name, code)')
          .eq('faculty_id', lecturer_id);
        if (error) return apiDbError(error, context.request, { startTime });
        const totalCredits = (data || []).reduce((sum: number, c: any) => sum + (c.credits || 0), 0);
        return apiSuccess({
          total_credits: totalCredits,
          course_count: (data || []).length,
          courses: data || [],
        }, context.request, { startTime });
      }

      // ── User Management ──
      case 'get-users': {
        const { college_id, role, status, search, department } = params;
        let query = supabase.from('college_lecturers').select('*');
        if (college_id) query = query.eq('collegeId', college_id);
        if (status) query = query.eq('accountStatus', status);
        if (department) query = query.eq('department', department);
        const { data, error } = await query.order('createdAt', { ascending: false });
        if (error) return apiDbError(error, context.request, { startTime });
        let result = data || [];
        if (role) {
          const r = role.toLowerCase();
          result = result.filter((u: any) => {
            const meta = u.metadata || {};
            return (meta.role || '').toLowerCase().includes(r) ||
              (Array.isArray(meta.roles) && meta.roles.some((rl: string) => rl.toLowerCase().includes(r)));
          });
        }
        if (search) {
          const s = search.toLowerCase();
          result = result.filter((u: any) =>
            (u.first_name || '').toLowerCase().includes(s) ||
            (u.last_name || '').toLowerCase().includes(s) ||
            (u.email || '').toLowerCase().includes(s) ||
            (u.employeeId || '').toLowerCase().includes(s)
          );
        }
        return apiSuccess(result, context.request, { startTime });
      }

      case 'get-user': {
        const { id } = params;
        if (!id) return apiError(400, 'VALIDATION_ERROR', 'Missing id', context.request, { startTime });
        const { data, error } = await supabase
          .from('college_lecturers')
          .select('*')
          .eq('id', id)
          .single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'create-user': {
        const { data, error } = await supabase
          .from('college_lecturers')
          .insert([{ ...params, created_by: user.id }])
          .select()
          .single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'update-user': {
        const { id, ...updates } = params;
        if (!id) return apiError(400, 'VALIDATION_ERROR', 'Missing id', context.request, { startTime });
        const { data, error } = await supabase
          .from('college_lecturers')
          .update(updates)
          .eq('id', id)
          .select()
          .single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      // NOTE: the `get-user-roles` and `assign-role` actions were REMOVED here
      // (P4 task 22.1). They queried/wrote a PHANTOM `public.user_roles` table
      // (no CREATE TABLE in any migration; absent from the live DB — confirmed in
      // .kiro/verifications/2026-06-07_p3-role-tables-verification.md §2), so every
      // call errored at runtime (PostgREST PGRST205). No frontend code references
      // either action. Role ASSIGNMENT is owned by the sso-worker `membership_roles`
      // (surfaced via the JWT); use the SSO membership RPCs (e.g. ssoAssignMembershipRole)
      // for assignment. Unknown actions fall through to the default case below.

      case 'get-organization-users': {
        const { organization_id } = params;
        if (!organization_id) return apiError(400, 'VALIDATION_ERROR', 'Missing organization_id', context.request, { startTime });
        const { data, error } = await supabase
          .from('organization_users')
          .select('*, user:user_id(id, email, name)')
          .eq('organization_id', organization_id);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      // ── Budget Management ──
      case 'allocate-budget': {
        const { data, error } = await supabase
          .from('department_budgets')
          .insert([{ ...params, status: 'draft' }])
          .select()
          .single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'submit-budget': {
        const { budget_id } = params;
        if (!budget_id) return apiError(400, 'VALIDATION_ERROR', 'Missing budget_id', context.request, { startTime });
        const { error } = await supabase
          .from('department_budgets')
          .update({ status: 'submitted', submitted_at: new Date().toISOString() })
          .eq('id', budget_id);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ success: true }, context.request, { startTime });
      }

      case 'approve-budget': {
        const { budget_id, approved_by } = params;
        if (!budget_id) return apiError(400, 'VALIDATION_ERROR', 'Missing budget_id', context.request, { startTime });
        const { error } = await supabase
          .from('department_budgets')
          .update({ status: 'approved', approved_by: approved_by || user.id, approved_at: new Date().toISOString() })
          .eq('id', budget_id);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ success: true }, context.request, { startTime });
      }

      case 'record-expenditure': {
        const { data, error } = await supabase
          .from('expenditures')
          .insert([{ ...params, recorded_by: user.id, recorded_at: new Date().toISOString() }])
          .select()
          .single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'validate-budget': {
        const { department_id, budget_head_id, amount } = params;
        const { data: budget, error } = await supabase
          .from('department_budgets')
          .select('budget_heads')
          .eq('department_id', department_id)
          .eq('status', 'approved')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (error) return apiDbError(error, context.request, { startTime });
        if (!budget) return apiSuccess(false, context.request, { startTime });
        const head = (budget.budget_heads || []).find((h: any) => h.id === budget_head_id);
        const isValid = !!head && (amount || 0) <= (head.remaining || head.allocated_amount || 0);
        return apiSuccess(isValid, context.request, { startTime });
      }

      case 'get-fee-ledger-detailed': {
        const { college_id, department_id, program_id, academic_year, semester, payment_status, is_overdue, date_from, date_to, search, page, limit } = params;
        if (!college_id) return apiError(400, 'VALIDATION_ERROR', 'Missing college_id', context.request, { startTime });
        let q = supabase.from('v_learner_fee_ledger_detailed').select('*', { count: 'exact' }).eq('college_id', college_id);
        if (department_id) q = q.eq('program_id', department_id);
        if (program_id) q = q.eq('program_id', program_id);
        if (academic_year) q = q.eq('academic_year', academic_year);
        if (semester) q = q.eq('semester', semester);
        if (payment_status) q = q.eq('payment_status', payment_status);
        if (is_overdue !== undefined) q = q.eq('is_overdue', is_overdue);
        if (date_from) q = q.gte('due_date', date_from);
        if (date_to) q = q.lte('due_date', date_to);
        if (search) q = q.or(`learner_name.ilike.%${search}%,roll_number.ilike.%${search}%,admission_number.ilike.%${search}%,fee_head_name.ilike.%${search}%`);
        q = q.order('due_date', { ascending: false });
        if (page && limit) {
          const from = (page - 1) * limit;
          q = q.range(from, from + limit - 1);
        }
        const { data, error, count } = await q;
        if (error) {
          if (error.code === '42P01' || error.code === 'PGRST116') return apiSuccess([], context.request, { startTime });
          return apiDbError(error, context.request, { startTime });
        }
        return apiSuccess({ data: data || [], count: count || 0 }, context.request, { startTime });
      }

      case 'get-fee-ledger-filter-options': {
        const { college_id } = params;
        if (!college_id) return apiError(400, 'VALIDATION_ERROR', 'Missing college_id', context.request, { startTime });
        const { data, error } = await supabase
          .from('v_learner_fee_ledger_detailed')
          .select('academic_year, semester, payment_status, department_name, program_name_full')
          .eq('college_id', college_id);
        if (error) {
          if (error.code === '42P01' || error.code === 'PGRST116') return apiSuccess({
            academicYears: [], semesters: [], paymentStatuses: [], departments: [], programs: [],
          }, context.request, { startTime });
          return apiDbError(error, context.request, { startTime });
        }
        const list = data || [];
        return apiSuccess({
          academicYears: [...new Set(list.map((d: any) => d.academic_year))].filter(Boolean).sort(),
          semesters: [...new Set(list.map((d: any) => d.semester))].filter(Boolean).sort(),
          paymentStatuses: [...new Set(list.map((d: any) => d.payment_status))].filter(Boolean),
          departments: [...new Set(list.map((d: any) => d.department_name))].filter(Boolean).sort(),
          programs: [...new Set(list.map((d: any) => d.program_name_full))].filter(Boolean).sort(),
        }, context.request, { startTime });
      }

      case 'get-budget-report': {
        const { department_id, period_from, period_to } = params;
        let query = supabase.from('department_budgets').select('*').eq('department_id', department_id);
        if (period_from) query = query.gte('period_from', period_from);
        if (period_to) query = query.lte('period_to', period_to);
        const { data: budgets, error: bError } = await query.order('created_at', { ascending: false });
        if (bError) return apiDbError(bError, context.request, { startTime });
        const { data: dept } = await supabase
          .from('departments')
          .select('name')
          .eq('id', department_id)
          .single();
        const totalAllocated = (budgets || []).reduce((s: number, b: any) => {
          const heads = b.budget_heads || [];
          return s + heads.reduce((hs: number, h: any) => hs + (h.allocated_amount || 0), 0);
        }, 0);
        const totalSpent = (budgets || []).reduce((s: number, b: any) => {
          const heads = b.budget_heads || [];
          return s + heads.reduce((hs: number, h: any) => hs + (h.spent_amount || 0), 0);
        }, 0);
        return apiSuccess({
          department_id,
          department_name: dept?.name || '',
          period: { from: period_from, to: period_to },
          total_allocated: totalAllocated,
          total_spent: totalSpent,
          total_remaining: totalAllocated - totalSpent,
          utilization_percentage: totalAllocated > 0 ? Math.round((totalSpent / totalAllocated) * 10000) / 100 : 0,
          budgets: budgets || [],
        }, context.request, { startTime });
      }

      case 'get-expenditures': {
        let query = supabase.from('expenditures').select('*');
        if (params.department_id) query = query.eq('department_id', params.department_id);
        if (params.budget_id) query = query.eq('budget_id', params.budget_id);
        if (params.budget_head_id) query = query.eq('budget_head_id', params.budget_head_id);
        const { data, error } = await query.order('recorded_at', { ascending: false });
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'get-budgets': {
        let query = supabase.from('department_budgets').select('*');
        if (params.department_id) query = query.eq('department_id', params.department_id);
        if (params.status) query = query.eq('status', params.status);
        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      // ── Missing actions from frontend audit ──

      case 'check-duplicate-email': {
        const { email } = params;
        if (!email) return apiError(400, 'VALIDATION_ERROR', 'Missing email', context.request, { startTime });
        const { data, error } = await supabase
          .from('users')
          .select('id')
          .eq('email', email)
          .maybeSingle();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ isDuplicate: !!data, exists: !!data }, context.request, { startTime });
      }

      case 'get-college-by-admin': {
        const { admin_id, email, userId } = params;
        const id = admin_id || userId;
        let query = supabase.from('organizations').select('*');
        if (id) query = query.eq('admin_id', id);
        if (!id && email) query = query.eq('email', email);
        const { data, error } = await query.order('created_at', { ascending: false }).limit(1).maybeSingle();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || null, context.request, { startTime });
      }

      case 'get-organization-by-admin': {
        const { userId } = params;
        if (!userId) return apiError(400, 'VALIDATION_ERROR', 'Missing userId', context.request, { startTime });
        const { data, error } = await supabase
          .from('organizations')
          .select('*')
          .eq('admin_id', userId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || null, context.request, { startTime });
      }

      case 'get-first-college': {
        const { data, error } = await supabase
          .from('organizations')
          .select('*')
          .eq('organization_type', 'college')
          .order('created_at', { ascending: true })
          .limit(1)
          .maybeSingle();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || null, context.request, { startTime });
      }

      case 'get-lecturer-college': {
        const { user_id, email } = params;
        if (!user_id && !email) return apiError(400, 'VALIDATION_ERROR', 'Missing user_id or email', context.request, { startTime });
        let query = supabase.from('college_lecturers').select('collegeId, collegeId');
        if (user_id) query = query.eq('user_id', user_id);
        if (!user_id && email) query = query.eq('email', email);
        const { data, error } = await query.limit(1).maybeSingle();
        if (error) return apiDbError(error, context.request, { startTime });
        if (data?.collegeId) {
          const { data: org } = await supabase
            .from('organizations')
            .select('id, name, code, organization_type')
            .eq('id', data.collegeId)
            .maybeSingle();
          return apiSuccess({ collegeId: data.collegeId, college: org || null }, context.request, { startTime });
        }
        return apiSuccess({ collegeId: null, college: null }, context.request, { startTime });
      }

      case 'get-college-lecturer': {
        const { user_id } = params;
        if (!user_id) return apiError(400, 'VALIDATION_ERROR', 'Missing user_id', context.request, { startTime });
        const { data, error } = await supabase
          .from('college_lecturers')
          .select('*')
          .eq('user_id', user_id)
          .maybeSingle();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || null, context.request, { startTime });
      }

      case 'get-college-organization': {
        const { user_id, email, userId } = params;
        const id = user_id || userId;
        let query = supabase.from('organizations').select('*');
        if (id) query = query.eq('admin_id', id);
        if (!id && email) query = query.or(`email.eq.${email},admin_email.eq.${email}`);
        const { data, error } = await query.limit(1).maybeSingle();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || null, context.request, { startTime });
      }

      case 'get-faculty-statistics': {
        const { college_id } = params;
        if (!college_id) return apiError(400, 'VALIDATION_ERROR', 'Missing college_id', context.request, { startTime });
        const { data, error } = await supabase
          .from('college_lecturers')
          .select('accountStatus')
          .eq('collegeId', college_id);
        if (error) return apiDbError(error, context.request, { startTime });
        const list = data || [];
        const statistics = {
          total: list.length,
          active: list.filter((r: any) => r.accountStatus === 'active').length,
          pending: list.filter((r: any) => r.accountStatus === 'pending').length,
          inactive: list.filter((r: any) => r.accountStatus === 'deactivated').length,
          deactivated: list.filter((r: any) => r.accountStatus === 'deactivated').length,
          suspended: list.filter((r: any) => r.accountStatus === 'suspended').length,
          verified: list.filter((r: any) => r.verification_status === 'verified').length,
        };
        return apiSuccess(statistics, context.request, { startTime });
      }

      case 'calculate-faculty-workload': {
        const { faculty_id } = params;
        if (!faculty_id) return apiError(400, 'VALIDATION_ERROR', 'Missing faculty_id', context.request, { startTime });
        const { data, error } = await supabase
          .from('college_course_mappings')
          .select('course:college_courses(credits)')
          .eq('faculty_id', faculty_id);
        if (error) return apiDbError(error, context.request, { startTime });
        const totalCredits = (data || []).reduce((sum: number, m: any) => sum + (m.course?.credits || 0), 0);
        return apiSuccess({ totalCredits, courseCount: (data || []).length }, context.request, { startTime });
      }

      case 'deactivate-user': {
        const { user_id } = params;
        if (!user_id) return apiError(400, 'VALIDATION_ERROR', 'Missing user_id', context.request, { startTime });
        const { error } = await supabase
          .from('college_lecturers')
          .update({ accountStatus: 'deactivated', updatedAt: new Date().toISOString() })
          .eq('user_id', user_id);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ success: true }, context.request, { startTime });
      }

      case 'get-users-by-ids': {
        const { user_ids } = params;
        if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
          return apiError(400, 'VALIDATION_ERROR', 'Missing user_ids array', context.request, { startTime });
        }
        const { data, error } = await supabase
          .from('users')
          .select('id, email, firstName, lastName, name, phone, role, metadata')
          .in('id', user_ids);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'get-users-by-role': {
        const { role } = params;
        if (!role) return apiError(400, 'VALIDATION_ERROR', 'Missing role', context.request, { startTime });
        const { data, error } = await supabase
          .from('users')
          .select('id, email, firstName, lastName, name, role, metadata')
          .eq('role', role);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'reset-password': {
        const { user_id } = params;
        if (!user_id) return apiError(400, 'VALIDATION_ERROR', 'Missing user_id', context.request, { startTime });
        const { error } = await supabase
          .from('college_lecturers')
          .update({ password_reset_requested_at: new Date().toISOString(), metadata: { ...(params.metadata || {}), passwordResetRequested: true } })
          .eq('user_id', user_id);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ success: true, message: 'Password reset has been requested' }, context.request, { startTime });
      }

      case 'get-user-role': {
        // TODO(§7.5/7.10 frontend-resolver reconciliation): lookup endpoint returning
        // `users.role` by arbitrary user_id — NOT an in-handler authz decision; deferred.
        const { user_id } = params;
        if (!user_id) return apiError(400, 'VALIDATION_ERROR', 'Missing user_id', context.request, { startTime });
        const { data, error } = await supabase
          .from('users')
          .select('role')
          .eq('id', user_id)
          .maybeSingle();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || null, context.request, { startTime });
      }

      case 'get-department-budgets-by-college': {
        const { college_id } = params;
        if (!college_id) return apiError(400, 'VALIDATION_ERROR', 'Missing college_id', context.request, { startTime });
        const { data, error } = await supabase
          .from('department_budgets')
          .select('*')
          .eq('college_id', college_id)
          .order('department_name', { ascending: true });
        if (error) {
          if (error.code === '42P01') return apiSuccess([], context.request, { startTime });
          return apiDbError(error, context.request, { startTime });
        }
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'create-leave': {
        const { data, error } = await supabase
          .from('college_faculty_leaves')
          .insert([{ ...params, status: 'pending', applied_by: user.id, created_by: user.id }])
          .select()
          .single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'create-substitutions': {
        const entries = params.entries || [];
        if (!Array.isArray(entries) || entries.length === 0) {
          return apiError(400, 'VALIDATION_ERROR', 'Missing entries array', context.request, { startTime });
        }
        const enriched = entries.map((e: any) => ({ ...e, created_by: user.id }));
        const { data, error } = await supabase
          .from('college_faculty_substitutions')
          .insert(enriched)
          .select();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      // ── Organizations ──
      case 'create-organization': {
        const { organization_type, collegeData, userId } = params;
        if (!collegeData) return apiError(400, 'VALIDATION_ERROR', 'Missing collegeData', context.request, { startTime });
        const insertData: Record<string, any> = {
          ...collegeData,
          organization_type: organization_type || 'college',
          admin_id: userId || user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        const { data, error } = await supabase
          .from('organizations')
          .insert([insertData])
          .select()
          .single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'get-organizations': {
        const { organization_type } = params;
        let query = supabase.from('organizations').select('*');
        if (organization_type) query = query.eq('organization_type', organization_type);
        const { data, error } = await query.order('name', { ascending: true });
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'get-organization': {
        const { id } = params;
        if (!id) return apiError(400, 'VALIDATION_ERROR', 'Missing id', context.request, { startTime });
        const { data, error } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', id)
          .single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'update-organization': {
        const { id, ...updates } = params;
        if (!id) return apiError(400, 'VALIDATION_ERROR', 'Missing id', context.request, { startTime });
        const { data, error } = await supabase
          .from('organizations')
          .update(updates)
          .eq('id', id)
          .select()
          .single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'check-org-code': {
        const { code } = params;
        if (!code) return apiError(400, 'VALIDATION_ERROR', 'Missing code', context.request, { startTime });
        const { data, error } = await supabase
          .from('organizations')
          .select('id')
          .eq('code', code)
          .maybeSingle();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ exists: !!data }, context.request, { startTime });
      }

      // ── Educator ID Lookup (for useSwapRequests) ──
      case 'get-educator-id-by-user': {
        const { user_id } = params;
        if (!user_id) return apiError(400, 'VALIDATION_ERROR', 'Missing user_id', context.request, { startTime });

        // Check college_lecturers first
        const { data: collegeLecturer } = await supabase
          .from('college_lecturers')
          .select('id')
          .eq('user_id', user_id)
          .maybeSingle();

        if (collegeLecturer) {
          return apiSuccess({ educatorId: collegeLecturer.id, isCollegeEducator: true }, context.request, { startTime });
        }

        // Fallback to school_educators
        const { data: schoolEducator } = await supabase
          .from('school_educators')
          .select('id')
          .eq('user_id', user_id)
          .maybeSingle();

        if (schoolEducator) {
          return apiSuccess({ educatorId: schoolEducator.id, isCollegeEducator: false }, context.request, { startTime });
        }

        return apiSuccess({ educatorId: null, isCollegeEducator: false }, context.request, { startTime });
      }

      // ── Faculty with Department Assignments (for useTimetableData) ──
      case 'get-faculty-with-departments': {
        const { college_id } = params;
        if (!college_id) return apiError(400, 'VALIDATION_ERROR', 'Missing college_id', context.request, { startTime });

        const { data: lecturers } = await supabase
          .from('college_lecturers')
          .select('id, first_name, last_name, employeeId, subject_expertise')
          .eq('collegeId', college_id)
          .eq('accountStatus', 'active')
          .order('first_name');

        if (!lecturers) return apiSuccess([], context.request, { startTime });

        const { data: assignments } = await supabase
          .from('department_faculty_assignments')
          .select('lecturer_id, department_id, is_hod')
          .eq('is_active', true);

        const facultyWithDept = lecturers.map((f: any) => {
          const assignment = (assignments || []).find((a: any) => a.lecturer_id === f.id);
          return {
            ...f,
            department_id: assignment?.department_id || null,
            is_hod: assignment?.is_hod || false,
          };
        });

        return apiSuccess(facultyWithDept, context.request, { startTime });
      }

      case 'resolve-user-college': {
        const { user_id, email } = params;
        if (!user_id && !email) return apiError(400, 'VALIDATION_ERROR', 'Missing user_id or email', context.request, { startTime });

        // organizations has admin_id and email columns (no admin_email column).
        if (user_id || email) {
          let q = supabase
            .from('organizations')
            .select('id, name, code, email')
            .eq('organization_type', 'college');

          if (user_id && email) {
            q = q.or(`admin_id.eq.${user_id},email.eq.${email}`);
          } else if (user_id) {
            q = q.eq('admin_id', user_id);
          } else {
            q = q.eq('email', email);
          }

          const { data: org, error } = await q.maybeSingle();
          if (error) return apiDbError(error, context.request, { startTime });
          if (org?.id) return apiSuccess({ college_id: org.id, college: org, source: 'organization' }, context.request, { startTime });
        }

        if (user_id) {
          // college_lecturers uses snake_case user_id (no userId column).
          const { data: lecturer, error: lecturerError } = await supabase
            .from('college_lecturers')
            .select('collegeId')
            .eq('user_id', user_id)
            .limit(1)
            .maybeSingle();

          if (lecturerError) return apiDbError(lecturerError, context.request, { startTime });
          if (lecturer?.collegeId) {
            const { data: org } = await supabase
              .from('organizations')
              .select('id, name, code, email')
              .eq('id', lecturer.collegeId)
              .maybeSingle();

            return apiSuccess({ college_id: lecturer.collegeId, college: org || null, source: 'lecturer' }, context.request, { startTime });
          }
        }

        return apiSuccess({ college_id: null, college: null, source: null }, context.request, { startTime });
      }

      case 'check-duplicate-employee-id': {
        const { college_id, employee_id } = params;
        if (!college_id || !employee_id) return apiError(400, 'VALIDATION_ERROR', 'Missing college_id or employee_id', context.request, { startTime });
        const { data, error } = await supabase
          .from('college_lecturers')
          .select('employeeId')
          .eq('collegeId', college_id)
          .eq('employeeId', employee_id)
          .maybeSingle();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ exists: !!data }, context.request, { startTime });
      }

      case 'update-faculty-status': {
        const { id, account_status } = params;
        if (!id) return apiError(400, 'VALIDATION_ERROR', 'Missing id', context.request, { startTime });
        const { data, error } = await supabase
          .from('college_lecturers')
          .update({ accountStatus: account_status })
          .eq('id', id)
          .select()
          .single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'get-school-educators': {
        const { school_id, email, user_id } = params;
        let query = supabase.from('school_educators').select('id, user_id, school_id, first_name, last_name, email');
        if (school_id) query = query.eq('school_id', school_id);
        if (email) query = query.eq('email', email);
        if (user_id) query = query.eq('user_id', user_id);
        const { data, error } = await query;
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'get-organization-by-email': {
        const { email, organization_type } = params;
        if (!email) return apiError(400, 'VALIDATION_ERROR', 'Missing email', context.request, { startTime });
        let query = supabase.from('organizations').select('*');
        if (organization_type) query = query.eq('organization_type', organization_type);
        query = query.eq('email', email);
        const { data, error } = await query.limit(1).maybeSingle();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || null, context.request, { startTime });
      }

      case 'get-user-by-email': {
        const { email } = params;
        if (!email) return apiError(400, 'VALIDATION_ERROR', 'Missing email', context.request, { startTime });
        const { data, error } = await supabase
          .from('users')
          .select('id, email, organizationId')
          .eq('email', email)
          .maybeSingle();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || null, context.request, { startTime });
      }

      default:
        return apiError(400, 'VALIDATION_ERROR', `Unknown action: ${action}`, context.request, { startTime });
    }
  } catch (error: any) {
    console.error(`[faculty POST] action=${action}:`, error?.message || error);
    return apiDbError(error, context.request, { startTime });
  }
});

export const onRequestGet = withAuth(async (context: AuthenticatedContext) => {
  return apiMethodNotAllowed(context.request);
});
