/**
 * School Library API
 * POST: Action-based dispatch for library books, issues, categories, settings
 */
import { withAuth, getContextUser } from '../../lib/auth';
import { getServiceClient } from '../../lib/supabase';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { apiSuccess, apiDbError, apiError, apiMethodNotAllowed } from '../../lib/response';

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
      // ── Books ──
      case 'get-books': {
        const { school_id, search, category, status, page, limit } = params;
        if (!school_id) return apiError(400, 'VALIDATION_ERROR', 'Missing school_id', context.request, { startTime });
        let query = supabase.from('library_books_school').select('*', { count: 'exact' }).eq('school_id', school_id).order('title');
        if (search) query = query.or(`title.ilike.%${search}%,author.ilike.%${search}%,isbn.ilike.%${search}%`);
        if (category) query = query.eq('category', category);
        if (status) query = query.eq('status', status);
        if (page && limit) {
          const from = (page - 1) * limit;
          query = query.range(from, from + limit - 1);
        }
        const { data, error, count } = await query;
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ books: data || [], count: count || 0 }, context.request, { startTime });
      }

      case 'get-book-by-id': {
        const { id, school_id } = params;
        if (!id) return apiError(400, 'VALIDATION_ERROR', 'Missing id', context.request, { startTime });
        let query = supabase.from('library_books_school').select('*').eq('id', id);
        if (school_id) query = query.eq('school_id', school_id);
        const { data, error } = await query.maybeSingle();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'add-book': {
        const { school_id, ...bookData } = params;
        if (!school_id || !bookData.title) return apiError(400, 'VALIDATION_ERROR', 'Missing school_id or title', context.request, { startTime });
        const { data, error } = await supabase.from('library_books_school').insert([{ ...bookData, school_id }]).select().single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'update-book': {
        const { id, school_id, ...updates } = params;
        if (!id) return apiError(400, 'VALIDATION_ERROR', 'Missing id', context.request, { startTime });
        let query = supabase.from('library_books_school').update(updates).eq('id', id);
        if (school_id) query = query.eq('school_id', school_id);
        const { data, error } = await query.select().single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'delete-book': {
        const { id, school_id } = params;
        if (!id) return apiError(400, 'VALIDATION_ERROR', 'Missing id', context.request, { startTime });
        let query = supabase.from('library_books_school').delete().eq('id', id);
        if (school_id) query = query.eq('school_id', school_id);
        const { error } = await query;
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ success: true }, context.request, { startTime });
      }

      // ── Book Issues ──
      case 'issue-book': {
        const { school_id, book_id, learner_id, learner_name, roll_number, class: className, academic_year, issued_by } = params;
        if (!school_id || !book_id || !learner_id) return apiError(400, 'VALIDATION_ERROR', 'Missing required fields', context.request, { startTime });

        // Check max books per learner
        const { data: settings } = await supabase.from('library_settings_school').select('setting_key, setting_value').eq('school_id', school_id);
        const maxBooks = parseInt(settings?.find((s: any) => s.setting_key === 'max_books_per_learner')?.setting_value || '3', 10);
        const { count: currentIssues } = await supabase.from('library_book_issues_school').select('*', { count: 'exact', head: true }).eq('school_id', school_id).eq('learner_id', learner_id).eq('status', 'issued');
        if (currentIssues && currentIssues >= maxBooks) {
          return apiError(400, 'LIMIT_EXCEEDED', `Learner has already issued ${maxBooks} books`, context.request, { startTime });
        }

        // Check availability
        const { data: book } = await supabase.from('library_books_school').select('available_copies').eq('id', book_id).eq('school_id', school_id).single();
        if (!book || book.available_copies <= 0) {
          return apiError(400, 'UNAVAILABLE', 'Book is not available', context.request, { startTime });
        }

        const loanPeriod = parseInt(settings?.find((s: any) => s.setting_key === 'default_loan_period_days')?.setting_value || '14', 10);
        const issueDate = new Date();
        const dueDate = new Date(issueDate);
        dueDate.setDate(dueDate.getDate() + loanPeriod);

        const { data, error } = await supabase.from('library_book_issues_school').insert([{
          school_id, book_id, learner_id, learner_name, roll_number, class: className, academic_year,
          issue_date: issueDate.toISOString().split('T')[0],
          due_date: dueDate.toISOString().split('T')[0],
          status: 'issued', issued_by: issued_by || user.id,
        }]).select('*, book:library_books_school(*)').single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'return-book': {
        const { issue_id, return_date, returned_by, remarks } = params;
        if (!issue_id) return apiError(400, 'VALIDATION_ERROR', 'Missing issue_id', context.request, { startTime });

        const { data: issue, error: fetchError } = await supabase.from('library_book_issues_school').select('*').eq('id', issue_id).eq('status', 'issued').single();
        if (fetchError) return apiDbError(fetchError, context.request, { startTime });
        if (!issue) return apiError(404, 'NOT_FOUND', 'Issue not found or already returned', context.request, { startTime });

        const retDate = return_date || new Date().toISOString().split('T')[0];
        const { data: fineData } = await supabase.rpc('calculate_fine_school', { p_school_id: issue.school_id, issue_date: issue.issue_date, return_date: retDate });

        const { data, error } = await supabase.from('library_book_issues_school').update({
          return_date: retDate, returned_by: returned_by || user.id, remarks, status: 'returned', fine_amount: fineData || 0,
        }).eq('id', issue_id).select('*, book:library_books_school(*)').single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'get-book-issues': {
        const { school_id, learner_id, book_id, status: issueStatus, search, page, limit } = params;
        if (!school_id) return apiError(400, 'VALIDATION_ERROR', 'Missing school_id', context.request, { startTime });
        let query = supabase.from('library_book_issues_school').select('*, book:library_books_school(*)', { count: 'exact' }).eq('school_id', school_id).order('issue_date', { ascending: false });
        if (learner_id) query = query.eq('learner_id', learner_id);
        if (book_id) query = query.eq('book_id', book_id);
        if (issueStatus) query = query.eq('status', issueStatus);
        if (search) query = query.or(`learner_name.ilike.%${search}%,roll_number.ilike.%${search}%`);
        if (page && limit) {
          const from = (page - 1) * limit;
          query = query.range(from, from + limit - 1);
        }
        const { data, error, count } = await query;
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ issues: data || [], count: count || 0 }, context.request, { startTime });
      }

      case 'search-issued-book': {
        const { school_id, book_id, learner_id } = params;
        let query = supabase.from('library_book_issues_school').select('*, book:library_books_school(*)').eq('status', 'issued');
        if (school_id) query = query.eq('school_id', school_id);
        if (book_id && learner_id) {
          query = query.eq('book_id', book_id).eq('learner_id', learner_id);
        } else if (book_id) {
          query = query.eq('book_id', book_id);
        } else if (learner_id) {
          query = query.eq('learner_id', learner_id);
        }
        const { data, error } = await query.maybeSingle();
        if (error && error.code !== 'PGRST116') return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || null, context.request, { startTime });
      }

      // ── Overdue Books ──
      case 'get-overdue-books': {
        const { school_id } = params;
        if (!school_id) return apiError(400, 'VALIDATION_ERROR', 'Missing school_id', context.request, { startTime });
        const { data, error } = await supabase.from('overdue_books_school').select('*').eq('school_id', school_id).order('days_overdue', { ascending: false });
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      // ── Library Stats ──
      case 'get-library-stats': {
        const { school_id } = params;
        if (!school_id) return apiError(400, 'VALIDATION_ERROR', 'Missing school_id', context.request, { startTime });
        const { data, error } = await supabase.from('library_stats_school').select('*').eq('school_id', school_id).maybeSingle();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      // ── Settings ──
      case 'get-settings': {
        const { school_id } = params;
        if (!school_id) return apiError(400, 'VALIDATION_ERROR', 'Missing school_id', context.request, { startTime });
        const { data, error } = await supabase.from('library_settings_school').select('*').eq('school_id', school_id).order('setting_key');
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'update-setting': {
        const { school_id, key, value } = params;
        if (!school_id || !key) return apiError(400, 'VALIDATION_ERROR', 'Missing required fields', context.request, { startTime });
        const { data, error } = await supabase.from('library_settings_school').update({ setting_value: value }).eq('school_id', school_id).eq('setting_key', key).select().single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      // ── Categories ──
      case 'get-categories': {
        const { school_id } = params;
        if (!school_id) return apiError(400, 'VALIDATION_ERROR', 'Missing school_id', context.request, { startTime });
        const { data, error } = await supabase.from('library_categories_school').select('*').eq('school_id', school_id).order('name');
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'add-category': {
        const { school_id, name, description, color_code } = params;
        if (!school_id || !name) return apiError(400, 'VALIDATION_ERROR', 'Missing required fields', context.request, { startTime });
        const { data, error } = await supabase.from('library_categories_school').insert([{ school_id, name, description, color_code }]).select().single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'update-category': {
        const { id, school_id, ...updates } = params;
        if (!id) return apiError(400, 'VALIDATION_ERROR', 'Missing id', context.request, { startTime });
        let query = supabase.from('library_categories_school').update(updates).eq('id', id);
        if (school_id) query = query.eq('school_id', school_id);
        const { data, error } = await query.select().single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'delete-category': {
        const { id, school_id } = params;
        if (!id) return apiError(400, 'VALIDATION_ERROR', 'Missing id', context.request, { startTime });
        let query = supabase.from('library_categories_school').delete().eq('id', id);
        if (school_id) query = query.eq('school_id', school_id);
        const { error } = await query;
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ success: true }, context.request, { startTime });
      }

      // ── Fine Calculation ──
      case 'calculate-fine': {
        const { school_id, issue_date, return_date } = params;
        if (!issue_date) return apiError(400, 'VALIDATION_ERROR', 'Missing issue_date', context.request, { startTime });
        const retDate = return_date || new Date().toISOString().split('T')[0];
        const { data, error } = await supabase.rpc('calculate_fine_school', { p_school_id: school_id, issue_date, return_date: retDate });
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || 0, context.request, { startTime });
      }

      // ── Learner Issued Count ──
      case 'get-learner-issued-count': {
        const { school_id, learner_id } = params;
        if (!learner_id) return apiError(400, 'VALIDATION_ERROR', 'Missing learner_id', context.request, { startTime });
        let query = supabase.from('library_book_issues_school').select('*', { count: 'exact', head: true }).eq('learner_id', learner_id).eq('status', 'issued');
        if (school_id) query = query.eq('school_id', school_id);
        const { count, error } = await query;
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(count || 0, context.request, { startTime });
      }

      // ── Learner Borrow History ──
      case 'get-learner-borrow-history': {
        const { school_id, learner_id } = params;
        if (!learner_id) return apiError(400, 'VALIDATION_ERROR', 'Missing learner_id', context.request, { startTime });
        let query = supabase.from('library_book_issues_school').select('*, book:library_books_school(*)').eq('learner_id', learner_id).order('issue_date', { ascending: false });
        if (school_id) query = query.eq('school_id', school_id);
        const { data, error } = await query;
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      // ── Search Learners for Library ──
      case 'search-learners-for-library': {
        const { school_id, search_term } = params;
        if (!school_id || !search_term) return apiError(400, 'VALIDATION_ERROR', 'Missing required fields', context.request, { startTime });
        const { data, error } = await supabase.from('learners').select('id, name, roll_number, enrollmentNumber, admission_number, contact_number, email, grade, section, course_name, semester').eq('school_id', school_id).eq('is_deleted', false).or(`name.ilike.%${search_term}%,roll_number.ilike.%${search_term}%,enrollmentNumber.ilike.%${search_term}%,admission_number.ilike.%${search_term}%,email.ilike.%${search_term}%`).order('name').limit(10);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'get-learner-by-id': {
        const { school_id, learner_id } = params;
        if (!learner_id) return apiError(400, 'VALIDATION_ERROR', 'Missing learner_id', context.request, { startTime });
        let query = supabase.from('learners').select('id, name, roll_number, enrollmentNumber, admission_number, contact_number, email, grade, section, course_name, semester').eq('id', learner_id).eq('is_deleted', false);
        if (school_id) query = query.eq('school_id', school_id);
        const { data, error } = await query.maybeSingle();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      default:
        return apiError(400, 'VALIDATION_ERROR', `Unknown action: ${action}`, context.request, { startTime });
    }
  } catch (error: any) {
    console.error(`[school-library POST] action=${action}:`, error?.message || error);
    return apiDbError(error, context.request, { startTime });
  }
});

export const onRequestGet = withAuth(async (context: AuthenticatedContext) => {
  return apiMethodNotAllowed(context.request);
});
