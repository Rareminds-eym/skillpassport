/**
 * College Admin - Library Management API
 * POST: Action-based dispatch for books, issues, returns, reservations, reviews
 * GET: Resource-based queries for books, issued, overdue, reservations, reviews, statistics
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
      case 'add-book': {
        const { data: bookData } = params;
        if (!bookData) return apiError(400, 'VALIDATION_ERROR', 'Missing book data', context.request, { startTime });
        const { data, error } = await supabase
          .from('library_books')
          .insert([{ ...bookData, available_copies: bookData.total_copies, issued_copies: 0 }])
          .select()
          .single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ book: data }, context.request, { startTime });
      }

      case 'update-book': {
        const { id, data: bookData, ...rest } = params;
        if (!id) return apiError(400, 'VALIDATION_ERROR', 'Missing id', context.request, { startTime });
        const updates = bookData || rest;
        const { data, error } = await supabase
          .from('library_books')
          .update(updates)
          .eq('id', id)
          .select()
          .single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ book: data }, context.request, { startTime });
      }

      case 'delete-book': {
        const { id } = params;
        if (!id) return apiError(400, 'VALIDATION_ERROR', 'Missing id', context.request, { startTime });
        const { error } = await supabase
          .from('library_books')
          .delete()
          .eq('id', id);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ success: true }, context.request, { startTime });
      }

      case 'issue-book': {
        const { data: issueData } = params;
        if (!issueData) return apiError(400, 'VALIDATION_ERROR', 'Missing issue data', context.request, { startTime });
        if (!issueData.book_id) return apiError(400, 'VALIDATION_ERROR', 'Missing book_id in issue data', context.request, { startTime });

        const { data: book, error: bookError } = await supabase
          .from('library_books')
          .select('available_copies, issued_copies')
          .eq('id', issueData.book_id)
          .single();
        if (bookError) return apiDbError(bookError, context.request, { startTime });
        if (!book || book.available_copies < 1) {
          return apiError(400, 'UNAVAILABLE', 'No copies available for issue', context.request, { startTime });
        }

        const { data: issue, error: issueError } = await supabase
          .from('issued_books')
          .insert([{
            ...issueData,
            status: 'issued',
            issued_by: user.id,
            issue_date: new Date().toISOString(),
          }])
          .select()
          .single();
        if (issueError) return apiDbError(issueError, context.request, { startTime });

        await supabase
          .from('library_books')
          .update({
            available_copies: book.available_copies - 1,
            issued_copies: (book.issued_copies || 0) + 1,
            status: book.available_copies - 1 <= 0 ? 'issued' : 'available',
          })
          .eq('id', issueData.book_id);

        return apiSuccess({ issue }, context.request, { startTime });
      }

      case 'return-book': {
        const { issuedBookId, returnedTo } = params;
        if (!issuedBookId) return apiError(400, 'VALIDATION_ERROR', 'Missing issuedBookId', context.request, { startTime });

        const { data: issued, error: fetchError } = await supabase
          .from('issued_books')
          .select('book_id')
          .eq('id', issuedBookId)
          .single();
        if (fetchError) return apiDbError(fetchError, context.request, { startTime });

        const { error: updateError } = await supabase
          .from('issued_books')
          .update({
            status: 'returned',
            return_date: new Date().toISOString(),
            returned_to: returnedTo || user.id,
          })
          .eq('id', issuedBookId);
        if (updateError) return apiDbError(updateError, context.request, { startTime });

        if (issued) {
          const { data: book } = await supabase
            .from('library_books')
            .select('available_copies, issued_copies')
            .eq('id', issued.book_id)
            .single();
          if (book) {
            await supabase
              .from('library_books')
              .update({
                available_copies: (book.available_copies || 0) + 1,
                issued_copies: Math.max(0, (book.issued_copies || 1) - 1),
                status: 'available',
              })
              .eq('id', issued.book_id);
          }
        }

        return apiSuccess({ success: true }, context.request, { startTime });
      }

      case 'renew-book': {
        const { issuedBookId } = params;
        if (!issuedBookId) return apiError(400, 'VALIDATION_ERROR', 'Missing issuedBookId', context.request, { startTime });

        const { data: current, error: fetchError } = await supabase
          .from('issued_books')
          .select('renewal_count, max_renewals, due_date')
          .eq('id', issuedBookId)
          .single();
        if (fetchError) return apiDbError(fetchError, context.request, { startTime });

        if ((current.renewal_count || 0) >= (current.max_renewals || 2)) {
          return apiError(400, 'LIMIT_EXCEEDED', 'Maximum renewals reached', context.request, { startTime });
        }

        const newDueDate = new Date(current.due_date);
        newDueDate.setDate(newDueDate.getDate() + 14);

        const { data, error } = await supabase
          .from('issued_books')
          .update({
            renewal_count: (current.renewal_count || 0) + 1,
            due_date: newDueDate.toISOString(),
            status: 'renewed',
          })
          .eq('id', issuedBookId)
          .select()
          .single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ issue: data }, context.request, { startTime });
      }

      case 'reserve-book': {
        const { data: reserveData } = params;
        if (!reserveData) return apiError(400, 'VALIDATION_ERROR', 'Missing reservation data', context.request, { startTime });

        const { data, error } = await supabase
          .from('book_reservations')
          .insert([{
            ...reserveData,
            status: 'active',
            reserved_date: new Date().toISOString(),
            expiry_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          }])
          .select()
          .single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ reservation: data }, context.request, { startTime });
      }

      case 'add-review': {
        const { data: reviewData } = params;
        if (!reviewData) return apiError(400, 'VALIDATION_ERROR', 'Missing review data', context.request, { startTime });

        const { data, error } = await supabase
          .from('book_reviews')
          .insert([{ ...reviewData, is_approved: false, created_at: new Date().toISOString() }])
          .select()
          .single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ review: data }, context.request, { startTime });
      }

      // ======================================================================
      // LibraryServicetest.ts support actions
      // ======================================================================

      case 'get-college-id': {
        const { userId } = params;
        if (!userId) return apiError(400, 'VALIDATION_ERROR', 'Missing userId', context.request, { startTime });
        const { data: learnerData, error: learnerError } = await supabase
          .from('learners')
          .select('college_id')
          .eq('user_id', userId)
          .limit(1)
          .maybeSingle();
        if (learnerError) return apiDbError(learnerError, context.request, { startTime });
        if (learnerData?.college_id) {
          return apiSuccess({ college_id: learnerData.college_id }, context.request, { startTime });
        }
        const { data: orgs, error: orgError } = await supabase
          .from('organizations')
          .select('id')
          .eq('organization_type', 'college')
          .limit(1);
        if (orgError) return apiDbError(orgError, context.request, { startTime });
        if (orgs && orgs.length > 0) {
          return apiSuccess({ college_id: orgs[0].id }, context.request, { startTime });
        }
        return apiError(404, 'NOT_FOUND', 'No college found for user', context.request, { startTime });
      }

      case 'get-books-college': {
        const { college_id, search, category, status, page, limit } = params;
        if (!college_id) return apiError(400, 'VALIDATION_ERROR', 'Missing college_id', context.request, { startTime });
        const pg = Math.max(1, parseInt(page || '1', 10));
        const lim = Math.min(100, Math.max(1, parseInt(limit || '20', 10)));
        const offset = (pg - 1) * lim;
        let query = supabase.from('library_books_college').select('*', { count: 'exact' }).eq('college_id', college_id).order('title');
        if (search) query = query.or(`title.ilike.%${search}%,author.ilike.%${search}%,isbn.ilike.%${search}%,book_id.ilike.%${search}%`);
        if (category) query = query.eq('category', category);
        if (status) query = query.eq('status', status);
        query = query.range(offset, offset + lim - 1);
        const { data, error, count } = await query;
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ books: data || [], count: count || 0 }, context.request, { startTime });
      }

      case 'get-book-by-id': {
        const { id, college_id } = params;
        if (!id) return apiError(400, 'VALIDATION_ERROR', 'Missing id', context.request, { startTime });
        const q = supabase.from('library_books').select('*').eq('id', id);
        if (college_id) q.eq('college_id', college_id);
        const { data, error } = await q.single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ book: data }, context.request, { startTime });
      }

      case 'issue-book-v2': {
        const { learner_id, book_id } = params;
        if (!learner_id || !book_id) return apiError(400, 'VALIDATION_ERROR', 'Missing learner_id or book_id', context.request, { startTime });
        const { count: currentIssues, error: countError } = await supabase
          .from('library_book_issues')
          .select('*', { count: 'exact', head: true })
          .eq('learner_id', learner_id)
          .eq('status', 'issued');
        if (countError) return apiDbError(countError, context.request, { startTime });
        const settingsRes = await supabase.from('library_settings').select('setting_key, setting_value');
        const settings = settingsRes.data || [];
        const maxBooks = parseInt(settings.find((s: any) => s.setting_key === 'max_books_per_learner')?.setting_value || '3', 10);
        if (currentIssues && currentIssues >= maxBooks) {
          return apiError(400, 'LIMIT_EXCEEDED', `Learner has already issued ${maxBooks} books`, context.request, { startTime });
        }
        const { data: book, error: bookError } = await supabase
          .from('library_books')
          .select('available_copies')
          .eq('id', book_id)
          .single();
        if (bookError) return apiDbError(bookError, context.request, { startTime });
        if (!book || book.available_copies <= 0) {
          return apiError(400, 'UNAVAILABLE', 'Book is not available for issue', context.request, { startTime });
        }
        const loanPeriod = parseInt(settings.find((s: any) => s.setting_key === 'default_loan_period_days')?.setting_value || '14', 10);
        const issueDate = new Date();
        const dueDate = new Date(issueDate);
        dueDate.setDate(dueDate.getDate() + loanPeriod);
        const issueData = {
          ...params,
          issue_date: issueDate.toISOString().split('T')[0],
          due_date: dueDate.toISOString().split('T')[0],
          status: 'issued',
        };
        const { data, error } = await supabase
          .from('library_book_issues')
          .insert([issueData])
          .select('*, book:library_books(*)')
          .single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ issue: data }, context.request, { startTime });
      }

      case 'return-book-v2': {
        const { issueId, return_date, returned_by, remarks } = params;
        if (!issueId) return apiError(400, 'VALIDATION_ERROR', 'Missing issueId', context.request, { startTime });
        const { data: issue, error: fetchError } = await supabase
          .from('library_book_issues')
          .select('*')
          .eq('id', issueId)
          .eq('status', 'issued')
          .single();
        if (fetchError) return apiDbError(fetchError, context.request, { startTime });
        if (!issue) return apiError(404, 'NOT_FOUND', 'Issue record not found or already returned', context.request, { startTime });
        const retDate = return_date || new Date().toISOString().split('T')[0];
        const { data: fineData, error: fineError } = await supabase
          .rpc('calculate_fine', { issue_date: issue.issue_date, return_date: retDate });
        if (fineError) return apiDbError(fineError, context.request, { startTime });
        const { data, error } = await supabase
          .from('library_book_issues')
          .update({ return_date: retDate, returned_by: returned_by || user.id, remarks, status: 'returned', fine_amount: fineData || 0 })
          .eq('id', issueId)
          .select('*, book:library_books(*)')
          .single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ issue: data }, context.request, { startTime });
      }

      case 'get-book-issues': {
        const { college_id, learner_id, book_id: bi, status: issueStatus, search, page, limit } = params;
        if (!college_id) return apiError(400, 'VALIDATION_ERROR', 'Missing college_id', context.request, { startTime });
        const { data: learners } = await supabase.from('learners').select('id').eq('college_id', college_id);
        const learnerIds = learners?.map((l: any) => l.id) || [];
        if (learnerIds.length === 0) return apiSuccess({ issues: [], count: 0 }, context.request, { startTime });
        const pg = Math.max(1, parseInt(page || '1', 10));
        const lim = Math.min(100, Math.max(1, parseInt(limit || '20', 10)));
        const off = (pg - 1) * lim;
        let q = supabase.from('library_book_issues').select('*, book:library_books(*)', { count: 'exact' }).in('learner_id', learnerIds).order('issue_date', { ascending: false });
        if (learner_id) q = q.eq('learner_id', learner_id);
        if (bi) q = q.eq('book_id', bi);
        if (issueStatus) q = q.eq('status', issueStatus);
        if (search) q = q.or(`learner_name.ilike.%${search}%,roll_number.ilike.%${search}%`);
        q = q.range(off, off + lim - 1);
        const { data, error, count } = await q;
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ issues: data || [], count: count || 0 }, context.request, { startTime });
      }

      case 'search-issued-book': {
        const { book_id, learner_id, college_id } = params;
        if (!book_id && !learner_id) return apiError(400, 'VALIDATION_ERROR', 'Provide book_id or learner_id', context.request, { startTime });
        let q = supabase.from('library_book_issues').select('*, book:library_books(*)').eq('status', 'issued');
        if (college_id && !learner_id) {
          const { data: learners } = await supabase.from('learners').select('id').eq('college_id', college_id);
          const ids = learners?.map((l: any) => l.id) || [];
          if (ids.length > 0) q = q.in('learner_id', ids);
        }
        if (book_id && learner_id) {
          q = q.eq('book_id', book_id).eq('learner_id', learner_id);
        } else if (book_id) {
          q = q.eq('book_id', book_id);
        } else if (learner_id) {
          q = q.eq('learner_id', learner_id);
        }
        const { data, error } = await q.maybeSingle();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ issue: data }, context.request, { startTime });
      }

      case 'get-overdue-books-college': {
        const { college_id } = params;
        if (!college_id) return apiError(400, 'VALIDATION_ERROR', 'Missing college_id', context.request, { startTime });
        const { data: learners } = await supabase.from('learners').select('id').eq('college_id', college_id);
        const learnerIds = learners?.map((l: any) => l.id) || [];
        if (learnerIds.length === 0) return apiSuccess({ overdue: [] }, context.request, { startTime });
        const { data, error } = await supabase
          .from('overdue_books')
          .select('*')
          .in('learner_id', learnerIds)
          .order('days_overdue', { ascending: false });
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ overdue: data || [] }, context.request, { startTime });
      }

      case 'get-library-stats-college': {
        const { college_id } = params;
        if (!college_id) return apiError(400, 'VALIDATION_ERROR', 'Missing college_id', context.request, { startTime });
        const { data: learners } = await supabase.from('learners').select('id').eq('college_id', college_id);
        const learnerIds = learners?.map((l: any) => l.id) || [];
        const { data: booksData } = await supabase.from('library_books').select('total_copies, available_copies');
        const totalBooks = booksData?.length || 0;
        const totalCopies = booksData?.reduce((s: number, b: any) => s + (b.total_copies || 0), 0) || 0;
        const availableCopies = booksData?.reduce((s: number, b: any) => s + (b.available_copies || 0), 0) || 0;
        let currentlyIssued = 0;
        let overdueCount = 0;
        let totalPendingFines = 0;
        if (learnerIds.length > 0) {
          const { count: ic } = await supabase.from('library_book_issues').select('*', { count: 'exact', head: true }).in('learner_id', learnerIds).eq('status', 'issued');
          currentlyIssued = ic || 0;
          const { data: od } = await supabase.from('overdue_books').select('current_fine').in('learner_id', learnerIds);
          overdueCount = od?.length || 0;
          totalPendingFines = od?.reduce((s: number, item: any) => s + (item.current_fine || 0), 0) || 0;
        }
        return apiSuccess({
          college_id, total_books: totalBooks, total_copies: totalCopies,
          available_copies: availableCopies, currently_issued: currentlyIssued,
          overdue_count: overdueCount, total_pending_fines: totalPendingFines,
        }, context.request, { startTime });
      }

      case 'get-settings': {
        const { data, error } = await supabase.from('library_settings').select('*').order('setting_key');
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ settings: data || [] }, context.request, { startTime });
      }

      case 'update-setting': {
        const { key, value } = params;
        if (!key || value === undefined) return apiError(400, 'VALIDATION_ERROR', 'Missing key or value', context.request, { startTime });
        const { data, error } = await supabase.from('library_settings').update({ setting_value: value }).eq('setting_key', key).select().single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ setting: data }, context.request, { startTime });
      }

      case 'get-categories-list': {
        const { data, error } = await supabase.from('library_categories').select('*').order('name');
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ categories: data || [] }, context.request, { startTime });
      }

      case 'add-category': {
        const { name, description, color_code } = params;
        if (!name) return apiError(400, 'VALIDATION_ERROR', 'Missing category name', context.request, { startTime });
        const { data, error } = await supabase.from('library_categories').insert([{ name, description, color_code }]).select().single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ category: data }, context.request, { startTime });
      }

      case 'update-category': {
        const { id, name, description, color_code } = params;
        if (!id) return apiError(400, 'VALIDATION_ERROR', 'Missing id', context.request, { startTime });
        const updates: Record<string, any> = {};
        if (name !== undefined) updates.name = name;
        if (description !== undefined) updates.description = description;
        if (color_code !== undefined) updates.color_code = color_code;
        const { data, error } = await supabase.from('library_categories').update(updates).eq('id', id).select().single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ category: data }, context.request, { startTime });
      }

      case 'delete-category': {
        const { id } = params;
        if (!id) return apiError(400, 'VALIDATION_ERROR', 'Missing id', context.request, { startTime });
        const { error } = await supabase.from('library_categories').delete().eq('id', id);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ success: true }, context.request, { startTime });
      }

      case 'calculate-fine': {
        const { issue_date, return_date } = params;
        if (!issue_date) return apiError(400, 'VALIDATION_ERROR', 'Missing issue_date', context.request, { startTime });
        const retDate = return_date || new Date().toISOString().split('T')[0];
        const { data, error } = await supabase.rpc('calculate_fine', { issue_date, return_date: retDate });
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ fine: data }, context.request, { startTime });
      }

      case 'get-learner-issued-count': {
        const { learner_id } = params;
        if (!learner_id) return apiError(400, 'VALIDATION_ERROR', 'Missing learner_id', context.request, { startTime });
        const { count, error } = await supabase.from('library_book_issues').select('*', { count: 'exact', head: true }).eq('learner_id', learner_id).eq('status', 'issued');
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ count: count || 0 }, context.request, { startTime });
      }

      case 'get-learner-borrow-history': {
        const { learner_id } = params;
        if (!learner_id) return apiError(400, 'VALIDATION_ERROR', 'Missing learner_id', context.request, { startTime });
        const { data, error } = await supabase
          .from('library_book_issues')
          .select('*, book:library_books(*)')
          .eq('learner_id', learner_id)
          .order('issue_date', { ascending: false });
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ issues: data || [] }, context.request, { startTime });
      }

      case 'search-learners': {
        const { college_id, search_term } = params;
        if (!college_id) return apiError(400, 'VALIDATION_ERROR', 'Missing college_id', context.request, { startTime });
        if (!search_term) return apiError(400, 'VALIDATION_ERROR', 'Missing search_term', context.request, { startTime });
        const { data, error } = await supabase
          .from('learners')
          .select('id, name, roll_number, enrollment_number, admission_number, contact_number, email, grade, section, course_name, semester')
          .eq('college_id', college_id)
          .eq('is_deleted', false)
          .or(`name.ilike.%${search_term}%,roll_number.ilike.%${search_term}%,enrollment_number.ilike.%${search_term}%,admission_number.ilike.%${search_term}%,email.ilike.%${search_term}%`)
          .order('name')
          .limit(10);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ learners: data || [] }, context.request, { startTime });
      }

      case 'get-learner-by-id': {
        const { learner_id, college_id } = params;
        if (!learner_id) return apiError(400, 'VALIDATION_ERROR', 'Missing learner_id', context.request, { startTime });
        let q = supabase
          .from('learners')
          .select('id, name, roll_number, enrollment_number, admission_number, contact_number, email, grade, section, course_name, semester')
          .eq('id', learner_id)
          .eq('is_deleted', false);
        if (college_id) q = q.eq('college_id', college_id);
        const { data, error } = await q.single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ learner: data }, context.request, { startTime });
      }

      default:
        return apiError(400, 'VALIDATION_ERROR', `Unknown action: ${action}`, context.request, { startTime });
    }
  } catch (error: any) {
    console.error(`[library POST] action=${action}:`, error?.message || error);
    return apiDbError(error, context.request, { startTime });
  }
});

export const onRequestGet = withAuth(async (context: AuthenticatedContext) => {
  getContextUser(context);
  const env = context.env as Record<string, string>;
  const supabase = getServiceClient(env as any);

  const url = new URL(context.request.url);
  const resource = url.searchParams.get('resource');
  if (!resource) return apiError(400, 'VALIDATION_ERROR', 'Missing resource parameter', context.request);

  const startTime = Date.now();

  try {
    switch (resource) {
      case 'books': {
        const category = url.searchParams.get('category');
        const status = url.searchParams.get('status');
        const search = url.searchParams.get('search');
        const offset = parseInt(url.searchParams.get('offset') || '0', 10);
        const limit = parseInt(url.searchParams.get('limit') || '100', 10);

        let query = supabase.from('library_books').select('*', { count: 'exact' });
        if (category) query = query.eq('category', category);
        if (status) query = query.eq('status', status);
        if (search) {
          query = query.or(`title.ilike.%${search}%,author.ilike.%${search}%,isbn.ilike.%${search}%`);
        }
        query = query.range(offset, offset + limit - 1).order('title', { ascending: true });

        const { data, error, count } = await query;
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ books: data || [], total: count || 0 }, context.request, { startTime });
      }

      case 'issued': {
        const learnerId = url.searchParams.get('learnerId');
        const bookId = url.searchParams.get('bookId');
        const status = url.searchParams.get('status');

        let query = supabase.from('issued_books').select('*');
        if (learnerId) query = query.eq('learner_id', learnerId);
        if (bookId) query = query.eq('book_id', bookId);
        if (status) query = query.eq('status', status);
        query = query.order('issue_date', { ascending: false });

        const { data, error } = await query;
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ issues: data || [] }, context.request, { startTime });
      }

      case 'overdue': {
        const { data, error } = await supabase
          .from('issued_books')
          .select('*')
          .in('status', ['issued', 'overdue'])
          .lt('due_date', new Date().toISOString())
          .order('due_date', { ascending: true });
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ issues: data || [] }, context.request, { startTime });
      }

      case 'reservations': {
        const bookId = url.searchParams.get('bookId');
        let query = supabase.from('book_reservations').select('*');
        if (bookId) query = query.eq('book_id', bookId);
        query = query.order('reserved_date', { ascending: false });
        const { data, error } = await query;
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ reservations: data || [] }, context.request, { startTime });
      }

      case 'reviews': {
        const bookId = url.searchParams.get('bookId');
        let query = supabase.from('book_reviews').select('*');
        if (bookId) query = query.eq('book_id', bookId);
        query = query.order('created_at', { ascending: false });
        const { data, error } = await query;
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ reviews: data || [] }, context.request, { startTime });
      }

      case 'statistics': {
        const [booksRes, issuedRes, overdueRes, reservationsRes] = await Promise.all([
          supabase.from('library_books').select('id, status, total_copies, available_copies'),
          supabase.from('issued_books').select('id').eq('status', 'issued'),
          supabase.from('issued_books').select('id').in('status', ['issued', 'overdue']).lt('due_date', new Date().toISOString()),
          supabase.from('book_reservations').select('id').eq('status', 'active'),
        ]);

        if (booksRes.error) return apiDbError(booksRes.error, context.request, { startTime });

        const totalBooks = booksRes.data?.length || 0;
        const availableBooks = booksRes.data?.filter((b: any) => b.status === 'available').length || 0;
        const totalCopies = booksRes.data?.reduce((s: number, b: any) => s + (b.total_copies || 0), 0) || 0;
        const availableCopies = booksRes.data?.reduce((s: number, b: any) => s + (b.available_copies || 0), 0) || 0;

        return apiSuccess({
          total_books: totalBooks,
          available_books: availableBooks,
          total_copies: totalCopies,
          available_copies: availableCopies,
          issued_count: issuedRes.data?.length || 0,
          overdue_count: overdueRes.data?.length || 0,
          active_reservations: reservationsRes.data?.length || 0,
        }, context.request, { startTime });
      }

      case 'popular': {
        const limit = parseInt(url.searchParams.get('limit') || '10', 10);
        const { data, error } = await supabase
          .from('library_books')
          .select('*')
          .order('issued_copies', { ascending: false })
          .limit(limit);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ books: data || [] }, context.request, { startTime });
      }

      case 'issued-count': {
        const learnerId = url.searchParams.get('learnerId');
        let query = supabase.from('issued_books').select('id', { count: 'exact' }).eq('status', 'issued');
        if (learnerId) query = query.eq('learner_id', learnerId);
        const { count, error } = await query;
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ count: count || 0 }, context.request, { startTime });
      }

      case 'categories': {
        const { data, error } = await supabase
          .from('library_books')
          .select('category');
        if (error) return apiDbError(error, context.request, { startTime });
        const unique = new Set((data || []).map((b: any) => b.category).filter(Boolean));
        const categories = Array.from(unique) as string[];
        categories.sort();
        return apiSuccess({ categories }, context.request, { startTime });
      }

      default:
        return apiError(400, 'VALIDATION_ERROR', `Unknown resource: ${resource}`, context.request, { startTime });
    }
  } catch (error: any) {
    console.error(`[library GET] resource=${resource}:`, error?.message || error);
    return apiDbError(error, context.request, { startTime });
  }
});
