import { supabase } from '@/lib/supabaseClient';

// ============================================
// LIBRARY MANAGEMENT SERVICE
// Connects to: library_books, library_issued_books, 
//              library_history, library_reservations, library_reviews
// ============================================

export interface LibraryBook {
  id: string;
  book_id: string;
  isbn?: string;
  title: string;
  author: string;
  publisher?: string;
  category: string;
  total_copies: number;
  available_copies: number;
  issued_copies: number;
  location: string;
  rack_number?: string;
  price?: number;
  status: 'available' | 'issued' | 'reserved' | 'maintenance' | 'lost' | 'damaged';
  is_reference_only: boolean;
  department_id?: string;
}

export interface IssuedBook {
  id: string;
  book_id: string;
  student_id: string;
  student_name: string;
  roll_number: string;
  email: string;
  issue_date: string;
  due_date: string;
  return_date?: string;
  days_overdue: number;
  fine_amount: number;
  fine_paid: boolean;
  status: 'issued' | 'returned' | 'overdue' | 'lost' | 'renewed';
  renewal_count: number;
  max_renewals: number;
}

export interface LibraryReservation {
  id: string;
  book_id: string;
  student_id: string;
  student_name: string;
  roll_number: string;
  reserved_date: string;
  expiry_date: string;
  priority: number;
  status: 'active' | 'fulfilled' | 'expired' | 'cancelled';
}

export interface LibraryReview {
  id: string;
  book_id: string;
  student_id: string;
  student_name: string;
  rating: number;
  review_text?: string;
  is_approved: boolean;
  created_at: string;
}

// ============================================
// BOOK CATALOG MANAGEMENT
// ============================================

export async function addBook(data: Partial<LibraryBook>): Promise<LibraryBook> {
  // Generate book_id if not provided
  const bookId = data.book_id || `BK${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

  const { data: book, error } = await supabase
    .from('library_books')
    .insert([{
      ...data,
      book_id: bookId,
      available_copies: data.total_copies || 1
    }])
    .select()
    .single();

  if (error) throw error;
  return book;
}

export async function getBooks(filters?: {
  category?: string;
  status?: string;
  department_id?: string;
  search?: string;
}): Promise<LibraryBook[]> {
  let query = supabase.from('library_books').select('*');

  if (filters?.category) query = query.eq('category', filters.category);
  if (filters?.status) query = query.eq('status', filters.status);
  if (filters?.department_id) query = query.eq('department_id', filters.department_id);
  if (filters?.search) {
    query = query.or(`title.ilike.%${filters.search}%,author.ilike.%${filters.search}%,isbn.ilike.%${filters.search}%`);
  }

  const { data, error } = await query.order('title');
  if (error) throw error;
  return data || [];
}

export async function updateBook(id: string, updates: Partial<LibraryBook>): Promise<LibraryBook> {
  const { data, error } = await supabase
    .from('library_books')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteBook(id: string): Promise<void> {
  // Check if book is currently issued
  const { data: issued, error: checkError } = await supabase
    .from('library_issued_books')
    .select('id')
    .eq('book_id', id)
    .eq('status', 'issued')
    .limit(1);

  if (checkError) throw checkError;
  if (issued && issued.length > 0) {
    throw new Error('Cannot delete book that is currently issued');
  }

  const { error } = await supabase
    .from('library_books')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ============================================
// BOOK ISSUE & RETURN
// ============================================

export async function issueBook(data: {
  book_id: string;
  student_id: string;
  student_name: string;
  roll_number: string;
  email: string;
  department_id?: string;
  academic_year: string;
  issued_by: string;
}): Promise<IssuedBook> {
  // Check book availability
  const { data: book, error: bookError } = await supabase
    .from('library_books')
    .select('available_copies, is_reference_only')
    .eq('id', data.book_id)
    .single();

  if (bookError) throw bookError;
  if (book.is_reference_only) {
    throw new Error('Reference books cannot be issued');
  }
  if (book.available_copies <= 0) {
    throw new Error('Book not available');
  }

  // Check student's current issues
  const { data: currentIssues, error: issuesError } = await supabase
    .from('library_issued_books')
    .select('id')
    .eq('student_id', data.student_id)
    .eq('status', 'issued');

  if (issuesError) throw issuesError;
  if (currentIssues && currentIssues.length >= 3) {
    throw new Error('Student has reached maximum book limit (3 books)');
  }

  // Calculate due date (14 days from now)
  const issueDate = new Date();
  const dueDate = new Date(issueDate);
  dueDate.setDate(dueDate.getDate() + 14);

  // Issue book
  const { data: issued, error } = await supabase
    .from('library_issued_books')
    .insert([{
      ...data,
      issue_date: issueDate.toISOString().split('T')[0],
      due_date: dueDate.toISOString().split('T')[0],
      status: 'issued',
      renewal_count: 0,
      max_renewals: 2,
      fine_per_day: 10.00
    }])
    .select()
    .single();

  if (error) throw error;

  // Update book availability
  await supabase
    .from('library_books')
    .update({ available_copies: book.available_copies - 1 })
    .eq('id', data.book_id);

  return issued;
}

export async function returnBook(issuedBookId: string, returnedTo: string): Promise<void> {
  // Get issued book details
  const { data: issued, error: fetchError } = await supabase
    .from('library_issued_books')
    .select('*, library_books!inner(id)')
    .eq('id', issuedBookId)
    .single();

  if (fetchError) throw fetchError;

  const returnDate = new Date();
  const dueDate = new Date(issued.due_date);
  const daysOverdue = Math.max(0, Math.floor((returnDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)));
  const fineAmount = daysOverdue * (issued.fine_per_day || 10);

  // Update issued book
  const { error: updateError } = await supabase
    .from('library_issued_books')
    .update({
      return_date: returnDate.toISOString().split('T')[0],
      actual_return_date: returnDate.toISOString().split('T')[0],
      days_overdue: daysOverdue,
      fine_amount: fineAmount,
      status: 'returned',
      returned_to: returnedTo
    })
    .eq('id', issuedBookId);

  if (updateError) throw updateError;

  // Update book availability
  const { data: book } = await supabase
    .from('library_books')
    .select('available_copies')
    .eq('id', issued.book_id)
    .single();

  if (book) {
    await supabase
      .from('library_books')
      .update({ available_copies: book.available_copies + 1 })
      .eq('id', issued.book_id);
  }

  // Add to history
  await supabase.from('library_history').insert([{
    book_id: issued.book_id,
    book_title: issued.library_books?.title,
    book_author: issued.library_books?.author,
    student_id: issued.student_id,
    student_name: issued.student_name,
    roll_number: issued.roll_number,
    email: issued.email,
    issue_date: issued.issue_date,
    due_date: issued.due_date,
    return_date: returnDate.toISOString().split('T')[0],
    days_overdue: daysOverdue,
    fine_amount: fineAmount,
    status: 'returned',
    renewal_count: issued.renewal_count,
    issued_by: issued.issued_by,
    returned_to: returnedTo
  }]);
}

export async function renewBook(issuedBookId: string): Promise<void> {
  const { data: issued, error: fetchError } = await supabase
    .from('library_issued_books')
    .select('renewal_count, max_renewals, due_date')
    .eq('id', issuedBookId)
    .single();

  if (fetchError) throw fetchError;

  if (issued.renewal_count >= issued.max_renewals) {
    throw new Error('Maximum renewals reached');
  }

  // Extend due date by 14 days
  const newDueDate = new Date(issued.due_date);
  newDueDate.setDate(newDueDate.getDate() + 14);

  const { error } = await supabase
    .from('library_issued_books')
    .update({
      due_date: newDueDate.toISOString().split('T')[0],
      renewal_count: issued.renewal_count + 1,
      last_renewed_date: new Date().toISOString().split('T')[0]
    })
    .eq('id', issuedBookId);

  if (error) throw error;
}

// ============================================
// ISSUED BOOKS & OVERDUE
// ============================================

export async function getIssuedBooks(filters?: {
  student_id?: string;
  status?: string;
  overdue?: boolean;
}): Promise<IssuedBook[]> {
  let query = supabase
    .from('library_issued_books')
    .select('*');

  if (filters?.student_id) query = query.eq('student_id', filters.student_id);
  if (filters?.status) query = query.eq('status', filters.status);
  if (filters?.overdue) {
    const today = new Date().toISOString().split('T')[0];
    query = query.lt('due_date', today).eq('status', 'issued');
  }

  const { data, error } = await query.order('issue_date', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getOverdueBooks(): Promise<IssuedBook[]> {
  const today = new Date().toISOString().split('T')[0];
  
  const { data, error } = await supabase
    .from('library_issued_books')
    .select('*')
    .eq('status', 'issued')
    .lt('due_date', today)
    .order('due_date');

  if (error) throw error;
  return data || [];
}

// ============================================
// RESERVATIONS
// ============================================

export async function reserveBook(data: {
  book_id: string;
  student_id: string;
  student_name: string;
  roll_number: string;
}): Promise<LibraryReservation> {
  // Check if book is available
  const { data: book } = await supabase
    .from('library_books')
    .select('available_copies')
    .eq('id', data.book_id)
    .single();

  if (book && book.available_copies > 0) {
    throw new Error('Book is available. Please issue directly.');
  }

  // Get next priority
  const { data: existing } = await supabase
    .from('library_reservations')
    .select('priority')
    .eq('book_id', data.book_id)
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
      ...data,
      reserved_date: reservedDate.toISOString().split('T')[0],
      expiry_date: expiryDate.toISOString().split('T')[0],
      priority: nextPriority,
      status: 'active'
    }])
    .select()
    .single();

  if (error) throw error;
  return reservation;
}

export async function getReservations(bookId?: string): Promise<LibraryReservation[]> {
  let query = supabase
    .from('library_reservations')
    .select('*')
    .eq('status', 'active');

  if (bookId) query = query.eq('book_id', bookId);

  const { data, error } = await query.order('priority');
  if (error) throw error;
  return data || [];
}

// ============================================
// REVIEWS & RATINGS
// ============================================

export async function addReview(data: {
  book_id: string;
  student_id: string;
  student_name: string;
  rating: number;
  review_text?: string;
}): Promise<LibraryReview> {
  const { data: review, error } = await supabase
    .from('library_reviews')
    .insert([{ ...data, is_approved: false }])
    .select()
    .single();

  if (error) throw error;
  return review;
}

export async function getBookReviews(bookId: string): Promise<LibraryReview[]> {
  const { data, error } = await supabase
    .from('library_reviews')
    .select('*')
    .eq('book_id', bookId)
    .eq('is_approved', true)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

// ============================================
// REPORTS & ANALYTICS
// ============================================

export async function getLibraryStatistics(): Promise<any> {
  const { data: books } = await supabase.from('library_books').select('total_copies, available_copies, issued_copies');
  const { data: issued } = await supabase.from('library_issued_books').select('status').eq('status', 'issued');
  const { data: overdue } = await supabase.from('library_issued_books').select('id').eq('status', 'overdue');

  return {
    totalBooks: books?.reduce((sum, b) => sum + b.total_copies, 0) || 0,
    availableBooks: books?.reduce((sum, b) => sum + b.available_copies, 0) || 0,
    issuedBooks: issued?.length || 0,
    overdueBooks: overdue?.length || 0
  };
}

export async function getPopularBooks(limit: number = 10): Promise<any[]> {
  const { data, error } = await supabase
    .from('library_books')
    .select('*')
    .order('total_issues', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}
