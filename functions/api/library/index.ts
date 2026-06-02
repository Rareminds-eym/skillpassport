import { withAuth } from '../../lib/auth';
import { getServiceClient } from '../../lib/supabase';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { apiSuccess, apiError, apiDbError, apiMethodNotAllowed } from '../../lib/response';

export const onRequest = async (context: any) => {
  if (context.request.method === 'GET') return onRequestGet(context);
  if (context.request.method === 'POST') return onRequestPost(context);
  return apiMethodNotAllowed();
};

const onRequestGet = withAuth(async (context: AuthenticatedContext) => {
  const env = context.env as Record<string, string>;
  const supabase = getServiceClient(env as any);
  const url = new URL(context.request.url);
  const resource = url.searchParams.get('resource') || 'books';
  const limit = parseInt(url.searchParams.get('limit') || '100', 10);
  const offset = parseInt(url.searchParams.get('offset') || '0', 10);
  if (isNaN(limit) || limit < 1) return apiError(400, 'VALIDATION_ERROR', 'limit must be a positive integer', context.request);
  if (isNaN(offset) || offset < 0) return apiError(400, 'VALIDATION_ERROR', 'offset must be a non-negative integer', context.request);
  const category = url.searchParams.get('category');
  const status = url.searchParams.get('status');
  const search = url.searchParams.get('search');
  const bookId = url.searchParams.get('bookId');
  const learnerId = url.searchParams.get('learnerId');

  switch (resource) {
    case 'books': {
      let query = supabase.from('library_books').select('*', { count: 'exact' });
      if (category) query = query.eq('category', category);
      if (status) query = query.eq('status', status);
      if (search) {
        query = query.or(`title.ilike.%${search}%,author.ilike.%${search}%,isbn.ilike.%${search}%`);
      }
      if (bookId) query = query.eq('id', bookId);
      query = query.order('title').range(offset, offset + limit - 1);
      const { data, error, count } = await query;
      if (error) return apiDbError(error, context.request);
      return apiSuccess({ books: data || [], total: count }, context.request);
    }

    case 'issued': {
      let query = supabase.from('library_issued_books').select('*', { count: 'exact' });
      if (status) query = query.eq('status', status);
      if (learnerId) query = query.eq('learner_id', learnerId);
      if (bookId) query = query.eq('book_id', bookId);
      query = query.order('issue_date', { ascending: false }).range(offset, offset + limit - 1);
      const { data, error, count } = await query;
      if (error) return apiDbError(error, context.request);
      return apiSuccess({ issues: data || [], total: count }, context.request);
    }

    case 'overdue': {
      const today = new Date().toISOString().split('T')[0];
      const { data, error, count } = await supabase
        .from('library_issued_books')
        .select('*', { count: 'exact' })
        .eq('status', 'issued')
        .lt('due_date', today)
        .order('due_date');
      if (error) return apiDbError(error, context.request);
      return apiSuccess({ issues: data || [], total: count }, context.request);
    }

    case 'reservations': {
      let query = supabase.from('library_reservations').select('*', { count: 'exact' }).eq('status', 'active');
      if (bookId) query = query.eq('book_id', bookId);
      query = query.order('priority');
      const { data, error, count } = await query;
      if (error) return apiDbError(error, context.request);
      return apiSuccess({ reservations: data || [], total: count }, context.request);
    }

    case 'reviews': {
      if (!bookId) return apiError(400, 'VALIDATION_ERROR', 'bookId is required for reviews', context.request);
      const { data, error } = await supabase
        .from('library_reviews')
        .select('*')
        .eq('book_id', bookId)
        .eq('is_approved', true)
        .order('created_at', { ascending: false });
      if (error) return apiDbError(error, context.request);
      return apiSuccess({ reviews: data || [] }, context.request);
    }

    case 'statistics': {
      const { data: books } = await supabase.from('library_books').select('total_copies, available_copies, issued_copies');
      const { data: issued } = await supabase.from('library_issued_books').select('status').eq('status', 'issued');
      const { data: overdue } = await supabase.from('library_issued_books').select('id').eq('status', 'overdue');
      return apiSuccess({
        totalBooks: books?.reduce((s, b) => s + b.total_copies, 0) || 0,
        availableBooks: books?.reduce((s, b) => s + b.available_copies, 0) || 0,
        issuedBooks: issued?.length || 0,
        overdueBooks: overdue?.length || 0,
      }, context.request);
    }

    case 'popular': {
      const { data, error } = await supabase
        .from('library_books')
        .select('*')
        .order('total_issues', { ascending: false })
        .limit(limit);
      if (error) return apiDbError(error, context.request);
      return apiSuccess({ books: data || [] }, context.request);
    }

    case 'categories': {
      const { data, error } = await supabase
        .from('library_books')
        .select('category')
        .order('category');
      if (error) return apiDbError(error, context.request);
      const categories = [...new Set(data?.map((b: any) => b.category) || [])];
      return apiSuccess({ categories }, context.request);
    }

    case 'history': {
      let query = supabase.from('library_history').select('*', { count: 'exact' });
      if (learnerId) query = query.eq('learner_id', learnerId);
      query = query.order('return_date', { ascending: false }).range(offset, offset + limit - 1);
      const { data, error, count } = await query;
      if (error) return apiDbError(error, context.request);
      return apiSuccess({ history: data || [], total: count }, context.request);
    }

    case 'issued-count': {
      if (!learnerId) return apiError(400, 'VALIDATION_ERROR', 'learnerId required', context.request);
      const { data, error } = await supabase
        .from('library_issued_books')
        .select('id', { count: 'exact', head: true })
        .eq('learner_id', learnerId)
        .eq('status', 'issued');
      if (error) return apiDbError(error, context.request);
      return apiSuccess({ count: data?.length || 0 }, context.request);
    }

    default:
      return apiError(400, 'VALIDATION_ERROR', `Invalid resource: ${resource}`, context.request);
  }
});

const onRequestPost = withAuth(async (context: AuthenticatedContext) => {
  const env = context.env as Record<string, string>;
  const supabase = getServiceClient(env as any);
  const body: any = await context.request.json().catch(() => ({}));
  const { action } = body;

  if (!action) return apiError(400, 'VALIDATION_ERROR', 'action is required', context.request);

  switch (action) {
    case 'add-book': {
      const data = body.data || body;
      const bookId = data.book_id || `BK${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      const { data: book, error } = await supabase
        .from('library_books')
        .insert([{ ...data, book_id: bookId, available_copies: data.total_copies || 1 }])
        .select()
        .single();
      if (error) return apiDbError(error, context.request);
      return apiSuccess({ book }, context.request, 201);
    }

    case 'update-book': {
      const { id, ...updates } = body;
      if (!id) return apiError(400, 'VALIDATION_ERROR', 'book id required', context.request);
      const { data: book, error } = await supabase
        .from('library_books')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) return apiDbError(error, context.request);
      return apiSuccess({ book }, context.request);
    }

    case 'delete-book': {
      const { id } = body;
      if (!id) return apiError(400, 'VALIDATION_ERROR', 'book id required', context.request);
      const { data: issued, error: checkError } = await supabase
        .from('library_issued_books')
        .select('id')
        .eq('book_id', id)
        .eq('status', 'issued')
        .limit(1);
      if (checkError) return apiDbError(checkError, context.request);
      if (issued && issued.length > 0) {
        return apiError(400, 'BOOK_ISSUED', 'Cannot delete book that is currently issued', context.request);
      }
      const { error } = await supabase.from('library_books').delete().eq('id', id);
      if (error) return apiDbError(error, context.request);
      return apiSuccess({ deleted: true }, context.request);
    }

    case 'issue-book': {
      const d = body.data || body;
      const { data: book, error: bookError } = await supabase
        .from('library_books')
        .select('available_copies, is_reference_only')
        .eq('id', d.book_id)
        .single();
      if (bookError) return apiDbError(bookError, context.request);
      if (book.is_reference_only) return apiError(400, 'REFERENCE_ONLY', 'Reference books cannot be issued', context.request);
      if (book.available_copies <= 0) return apiError(400, 'NOT_AVAILABLE', 'Book not available', context.request);

      const { data: currentIssues, error: issuesError } = await supabase
        .from('library_issued_books')
        .select('id')
        .eq('learner_id', d.learner_id)
        .eq('status', 'issued');
      if (issuesError) return apiDbError(issuesError, context.request);
      if (currentIssues && currentIssues.length >= 3) {
        return apiError(400, 'MAX_ISSUES', 'Learner has reached maximum book limit (3 books)', context.request);
      }

      const issueDate = new Date();
      const dueDate = new Date(issueDate);
      dueDate.setDate(dueDate.getDate() + 14);

      const { data: issued, error } = await supabase
        .from('library_issued_books')
        .insert([{
          ...d, issue_date: issueDate.toISOString().split('T')[0],
          due_date: dueDate.toISOString().split('T')[0], status: 'issued',
          renewal_count: 0, max_renewals: 2, fine_per_day: 10.00,
        }])
        .select()
        .single();
      if (error) return apiDbError(error, context.request);

      await supabase.from('library_books').update({ available_copies: book.available_copies - 1 }).eq('id', d.book_id);
      return apiSuccess({ issue: issued }, context.request, 201);
    }

    case 'return-book': {
      const { issuedBookId, returnedTo } = body;
      if (!issuedBookId) return apiError(400, 'VALIDATION_ERROR', 'issuedBookId required', context.request);
      const { data: issued, error: fetchError } = await supabase
        .from('library_issued_books')
        .select('*, library_books!inner(id, title, author)')
        .eq('id', issuedBookId)
        .single();
      if (fetchError) return apiDbError(fetchError, context.request);

      const returnDate = new Date();
      const dueDate = new Date(issued.due_date);
      const daysOverdue = Math.max(0, Math.floor((returnDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)));
      const fineAmount = daysOverdue * (issued.fine_per_day || 10);

      const { error: updateError } = await supabase
        .from('library_issued_books')
        .update({
          return_date: returnDate.toISOString().split('T')[0],
          actual_return_date: returnDate.toISOString().split('T')[0],
          days_overdue: daysOverdue, fine_amount: fineAmount,
          status: 'returned', returned_to: returnedTo,
        })
        .eq('id', issuedBookId);
      if (updateError) return apiDbError(updateError, context.request);

      const { data: bk } = await supabase.from('library_books').select('available_copies').eq('id', issued.book_id).single();
      if (bk) {
        await supabase.from('library_books').update({ available_copies: bk.available_copies + 1 }).eq('id', issued.book_id);
      }

      await supabase.from('library_history').insert([{
        book_id: issued.book_id, book_title: issued.library_books?.title,
        book_author: issued.library_books?.author,
        learner_id: issued.learner_id, learner_name: issued.learner_name,
        roll_number: issued.roll_number, email: issued.email,
        issue_date: issued.issue_date, due_date: issued.due_date,
        return_date: returnDate.toISOString().split('T')[0],
        days_overdue: daysOverdue, fine_amount: fineAmount,
        status: 'returned', renewal_count: issued.renewal_count,
        issued_by: issued.issued_by, returned_to: returnedTo,
      }]);
      return apiSuccess({ returned: true, daysOverdue, fineAmount }, context.request);
    }

    case 'renew-book': {
      const { issuedBookId } = body;
      if (!issuedBookId) return apiError(400, 'VALIDATION_ERROR', 'issuedBookId required', context.request);
      const { data: issued, error: fetchError } = await supabase
        .from('library_issued_books')
        .select('renewal_count, max_renewals, due_date')
        .eq('id', issuedBookId)
        .single();
      if (fetchError) return apiDbError(fetchError, context.request);
      if (issued.renewal_count >= issued.max_renewals) {
        return apiError(400, 'MAX_RENEWALS', 'Maximum renewals reached', context.request);
      }
      const newDueDate = new Date(issued.due_date);
      newDueDate.setDate(newDueDate.getDate() + 14);
      const { error } = await supabase
        .from('library_issued_books')
        .update({
          due_date: newDueDate.toISOString().split('T')[0],
          renewal_count: issued.renewal_count + 1,
          last_renewed_date: new Date().toISOString().split('T')[0],
        })
        .eq('id', issuedBookId);
      if (error) return apiDbError(error, context.request);
      return apiSuccess({ renewed: true }, context.request);
    }

    case 'reserve-book': {
      const d = body.data || body;
      const { data: book } = await supabase.from('library_books').select('available_copies').eq('id', d.book_id).single();
      if (book && book.available_copies > 0) {
        return apiError(400, 'BOOK_AVAILABLE', 'Book is available. Please issue directly.', context.request);
      }
      const { data: existing } = await supabase
        .from('library_reservations')
        .select('priority')
        .eq('book_id', d.book_id)
        .eq('status', 'active')
        .order('priority', { ascending: false })
        .limit(1);
      const nextPriority = existing && existing.length > 0 ? existing[0].priority + 1 : 1;
      const reservedDate = new Date();
      const expiryDate = new Date(reservedDate);
      expiryDate.setDate(expiryDate.getDate() + 7);
      const { data: reservation, error } = await supabase
        .from('library_reservations')
        .insert([{
          ...d, reserved_date: reservedDate.toISOString().split('T')[0],
          expiry_date: expiryDate.toISOString().split('T')[0],
          priority: nextPriority, status: 'active',
        }])
        .select()
        .single();
      if (error) return apiDbError(error, context.request);
      return apiSuccess({ reservation }, context.request, 201);
    }

    case 'cancel-reservation': {
      const { id } = body;
      if (!id) return apiError(400, 'VALIDATION_ERROR', 'reservation id required', context.request);
      const { error } = await supabase.from('library_reservations').update({ status: 'cancelled' }).eq('id', id);
      if (error) return apiDbError(error, context.request);
      return apiSuccess({ cancelled: true }, context.request);
    }

    case 'add-review': {
      const d = body.data || body;
      const { data: review, error } = await supabase
        .from('library_reviews')
        .insert([{ ...d, is_approved: false }])
        .select()
        .single();
      if (error) return apiDbError(error, context.request);
      return apiSuccess({ review }, context.request, 201);
    }

    default:
      return apiError(400, 'VALIDATION_ERROR', `Unknown action: ${action}`, context.request);
  }
});
