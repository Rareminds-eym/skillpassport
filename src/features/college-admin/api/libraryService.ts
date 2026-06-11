import { apiGet, apiPost } from '@/shared/api/apiClient';

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
  learner_id: string;
  learner_name: string;
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
  learner_id: string;
  learner_name: string;
  roll_number: string;
  reserved_date: string;
  expiry_date: string;
  priority: number;
  status: 'active' | 'fulfilled' | 'expired' | 'cancelled';
}

export interface LibraryReview {
  id: string;
  book_id: string;
  learner_id: string;
  learner_name: string;
  rating: number;
  review_text?: string;
  is_approved: boolean;
  created_at: string;
}

export async function addBook(data: Partial<LibraryBook>): Promise<LibraryBook> {
  const response: any = await apiPost('/college-admin/library', { action: 'add-book', data });
  return response?.data?.book;
}

export async function getBooks(filters?: {
  category?: string;
  status?: string;
  department_id?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<{ books: LibraryBook[]; count: number }> {
  const params = new URLSearchParams({ resource: 'books' });
  if (filters?.category) params.set('category', filters.category);
  if (filters?.status) params.set('status', filters.status);
  if (filters?.search) params.set('search', filters.search);
  if (filters?.limit) params.set('limit', String(filters.limit));
  if (filters?.page) params.set('offset', String((filters.page - 1) * (filters.limit || 100)));

  const response: any = await apiGet(`/library?${params.toString()}`);
  const books = response?.data?.books ?? [];
  const count = response?.data?.total ?? books.length;
  return { books, count };
}

export async function updateBook(id: string, updates: Partial<LibraryBook>): Promise<LibraryBook> {
  const response: any = await apiPost('/college-admin/library', { action: 'update-book', id, ...updates });
  return response?.data?.book;
}

export async function deleteBook(id: string): Promise<void> {
  await apiPost('/college-admin/library', { action: 'delete-book', id });
}

export async function issueBook(data: {
  book_id: string;
  learner_id: string;
  learner_name: string;
  roll_number: string;
  email: string;
  department_id?: string;
  academic_year: string;
  issued_by: string;
}): Promise<IssuedBook> {
  const response: any = await apiPost('/college-admin/library', { action: 'issue-book', data });
  return response?.data?.issue;
}

export async function returnBook(issuedBookId: string, returnedTo: string): Promise<void> {
  await apiPost('/college-admin/library', { action: 'return-book', issuedBookId, returnedTo });
}

export async function renewBook(issuedBookId: string): Promise<void> {
  await apiPost('/college-admin/library', { action: 'renew-book', issuedBookId });
}

export async function getIssuedBooks(filters?: {
  learner_id?: string;
  status?: string;
  overdue?: boolean;
}): Promise<IssuedBook[]> {
  const params = new URLSearchParams({ resource: 'issued' });
  if (filters?.learner_id) params.set('learnerId', filters.learner_id);
  if (filters?.status) params.set('status', filters.status);
  if (filters?.overdue) {
    const response: any = await apiGet('/college-admin/library?resource=overdue');
    return response?.data?.issues ?? [];
  }

  const response: any = await apiGet(`/library?${params.toString()}`);
  return response?.data?.issues ?? [];
}

export async function getOverdueBooks(): Promise<IssuedBook[]> {
  const response: any = await apiGet('/college-admin/library?resource=overdue');
  return response?.data?.issues ?? [];
}

export async function reserveBook(data: {
  book_id: string;
  learner_id: string;
  learner_name: string;
  roll_number: string;
}): Promise<LibraryReservation> {
  const response: any = await apiPost('/college-admin/library', { action: 'reserve-book', data });
  return response?.data?.reservation;
}

export async function getReservations(bookId?: string): Promise<LibraryReservation[]> {
  const params = new URLSearchParams({ resource: 'reservations' });
  if (bookId) params.set('bookId', bookId);
  const response: any = await apiGet(`/library?${params.toString()}`);
  return response?.data?.reservations ?? [];
}

export async function addReview(data: {
  book_id: string;
  learner_id: string;
  learner_name: string;
  rating: number;
  review_text?: string;
}): Promise<LibraryReview> {
  const response: any = await apiPost('/college-admin/library', { action: 'add-review', data });
  return response?.data?.review;
}

export async function getBookReviews(bookId: string): Promise<LibraryReview[]> {
  const response: any = await apiGet(`/library?resource=reviews&bookId=${encodeURIComponent(bookId)}`);
  return response?.data?.reviews ?? [];
}

export async function getLibraryStatistics(): Promise<any> {
  const response: any = await apiGet('/college-admin/library?resource=statistics');
  return response?.data ?? {};
}

export async function getPopularBooks(limit: number = 10): Promise<any[]> {
  const response: any = await apiGet(`/library?resource=popular&limit=${limit}`);
  return response?.data?.books ?? [];
}

export const getLibraryStats = getLibraryStatistics;

export async function getBookIssues(filters?: {
  learner_id?: string;
  status?: string;
  overdue?: boolean;
  limit?: number;
}): Promise<{ issues: IssuedBook[]; total: number }> {
  const issues = await getIssuedBooks(filters);
  return {
    issues: filters?.limit ? issues.slice(0, filters.limit) : issues,
    total: issues.length,
  };
}

export async function searchIssuedBook(bookId?: string, learnerId?: string): Promise<IssuedBook | null> {
  const params = new URLSearchParams({ resource: 'issued', status: 'issued' });
  if (bookId) params.set('bookId', bookId);
  if (learnerId) params.set('learnerId', learnerId);
  const response: any = await apiGet(`/library?${params.toString()}`);
  const issues: IssuedBook[] = response?.data?.issues ?? [];
  return issues.length > 0 ? issues[0] : null;
}

export async function getlearnerIssuedBooksCount(learnerId: string): Promise<number> {
  const response: any = await apiGet(`/library?resource=issued-count&learnerId=${encodeURIComponent(learnerId)}`);
  return response?.data?.count ?? 0;
}

export async function getSettings(): Promise<any> {
  return {
    maxBooksPerLearner: 3,
    loanPeriodDays: 14,
    maxRenewals: 2,
    finePerDay: 10,
    reservationExpiryDays: 7,
  };
}

export async function getCategories(): Promise<string[]> {
  const response: any = await apiGet('/college-admin/library?resource=categories');
  return response?.data?.categories ?? [];
}
