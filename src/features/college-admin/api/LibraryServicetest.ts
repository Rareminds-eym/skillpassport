import { apiGet, apiPost } from '@/shared/api/apiClient';
import { useAuthStore } from '@/shared/model/authStore';

export interface LibraryBook {
  id: string;
  book_id: string;
  title: string;
  author: string;
  isbn?: string;
  isbn13?: string;
  total_copies: number;
  available_copies: number;
  status?: 'available' | 'all_issued' | 'maintenance';
  category: string;
  publisher?: string;
  publication_year?: number;
  description?: string;
  location: string;
  rack_number?: string;
  floor?: string;
  section?: string;
  college_id?: string;
  created_at: string;
  updated_at: string;
}

export interface LibraryBookIssue {
  id: string;
  book_id: string;
  learner_id: string;
  learner_name: string;
  roll_number: string;
  class: string;
  academic_year: string;
  issue_date: string;
  due_date: string;
  return_date?: string;
  status: 'issued' | 'returned' | 'overdue';
  fine_amount: number;
  fine_paid: boolean;
  remarks?: string;
  issued_by?: string;
  returned_by?: string;
  created_at: string;
  updated_at: string;
  book?: LibraryBook;
}

export interface LibrarySetting {
  id: string;
  setting_key: string;
  setting_value: string;
  description?: string;
}

export interface LibraryCategory {
  id: string;
  name: string;
  description?: string;
  color_code: string;
}

export interface LibraryStats {
  college_id: string;
  total_books: number;
  total_copies: number;
  available_copies: number;
  currently_issued: number;
  overdue_count: number;
  total_pending_fines: number;
}

export interface OverdueBook extends LibraryBookIssue {
  title: string;
  author: string;
  isbn: string;
  current_fine: number;
  days_overdue: number;
}

class LibraryService {
  private async getCurrentCollegeId(): Promise<string> {
    const user = useAuthStore.getState().user;
    if (!user) throw new Error('User not authenticated');

    const collegeId = user.user_metadata?.college_id;
    if (collegeId) return collegeId;

    const response: any = await apiPost('/college-admin/library', {
      action: 'get-college-id',
      userId: user.id,
    });
    return response?.data?.college_id;
  }

  async getBooks(filters?: {
    search?: string;
    category?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const collegeId = await this.getCurrentCollegeId();
    const response: any = await apiPost('/college-admin/library', {
      action: 'get-books-college',
      college_id: collegeId,
      search: filters?.search,
      category: filters?.category,
      status: filters?.status,
      page: filters?.page,
      limit: filters?.limit,
    });
    return { books: (response?.data?.books || []) as LibraryBook[], count: response?.data?.count || 0 };
  }

  async getBookById(id: string) {
    const collegeId = await this.getCurrentCollegeId();
    const response: any = await apiPost('/college-admin/library', {
      action: 'get-book-by-id',
      id,
      college_id: collegeId,
    });
    return response?.data?.book as LibraryBook;
  }

  async addBook(book: Omit<LibraryBook, 'id' | 'created_at' | 'updated_at'>) {
    const collegeId = await this.getCurrentCollegeId();
    const bookData = {
      ...book,
      college_id: collegeId,
      book_id: book.book_id || `BK-${Date.now()}`,
      location: book.location || 'Main Library',
      status: book.status || 'available',
    };
    const response: any = await apiPost('/college-admin/library', {
      action: 'add-book',
      data: bookData,
    });
    return response?.data?.book as LibraryBook;
  }

  async updateBook(id: string, updates: Partial<LibraryBook>) {
    const response: any = await apiPost('/college-admin/library', {
      action: 'update-book',
      id,
      ...updates,
    });
    return response?.data?.book as LibraryBook;
  }

  async deleteBook(id: string) {
    await apiPost('/college-admin/library', { action: 'delete-book', id });
  }

  async issueBook(issue: {
    book_id: string;
    learner_id: string;
    learner_name: string;
    roll_number: string;
    class: string;
    academic_year: string;
    issued_by?: string;
  }) {
    const response: any = await apiPost('/college-admin/library', {
      action: 'issue-book-v2',
      ...issue,
    });
    return response?.data?.issue as LibraryBookIssue;
  }

  async returnBook(issueId: string, returnData: {
    return_date?: string;
    returned_by?: string;
    remarks?: string;
  }) {
    const response: any = await apiPost('/college-admin/library', {
      action: 'return-book-v2',
      issueId,
      ...returnData,
    });
    return response?.data?.issue as LibraryBookIssue;
  }

  async getBookIssues(filters?: {
    learner_id?: string;
    book_id?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const collegeId = await this.getCurrentCollegeId();
    const response: any = await apiPost('/college-admin/library', {
      action: 'get-book-issues',
      college_id: collegeId,
      ...(filters || {}),
    });
    return { issues: (response?.data?.issues || []) as LibraryBookIssue[], count: response?.data?.count || 0 };
  }

  async searchIssuedBook(bookId?: string, learnerId?: string) {
    const collegeId = await this.getCurrentCollegeId();
    const response: any = await apiPost('/college-admin/library', {
      action: 'search-issued-book',
      book_id: bookId,
      learner_id: learnerId,
      college_id: learnerId ? undefined : collegeId,
    });
    return (response?.data?.issue || null) as LibraryBookIssue | null;
  }

  async getOverdueBooks() {
    const collegeId = await this.getCurrentCollegeId();
    const response: any = await apiPost('/college-admin/library', {
      action: 'get-overdue-books-college',
      college_id: collegeId,
    });
    return (response?.data?.overdue || []) as OverdueBook[];
  }

  async getLibraryStats() {
    const collegeId = await this.getCurrentCollegeId();
    const response: any = await apiPost('/college-admin/library', {
      action: 'get-library-stats-college',
      college_id: collegeId,
    });
    return response?.data as LibraryStats;
  }

  async getSettings() {
    const response: any = await apiPost('/college-admin/library', {
      action: 'get-settings',
    });
    return (response?.data?.settings || []) as LibrarySetting[];
  }

  async updateSetting(key: string, value: string) {
    const response: any = await apiPost('/college-admin/library', {
      action: 'update-setting',
      key,
      value,
    });
    return response?.data?.setting as LibrarySetting;
  }

  async getCategories() {
    const response: any = await apiPost('/college-admin/library', {
      action: 'get-categories-list',
    });
    return (response?.data?.categories || []) as LibraryCategory[];
  }

  async addCategory(category: Omit<LibraryCategory, 'id' | 'college_id' | 'created_at' | 'updated_at'>) {
    const response: any = await apiPost('/college-admin/library', {
      action: 'add-category',
      ...category,
    });
    return response?.data?.category as LibraryCategory;
  }

  async updateCategory(id: string, updates: Partial<LibraryCategory>) {
    const response: any = await apiPost('/college-admin/library', {
      action: 'update-category',
      id,
      ...updates,
    });
    return response?.data?.category as LibraryCategory;
  }

  async deleteCategory(id: string) {
    await apiPost('/college-admin/library', { action: 'delete-category', id });
  }

  async calculateFine(issueDate: string, returnDate?: string) {
    const response: any = await apiPost('/college-admin/library', {
      action: 'calculate-fine',
      issue_date: issueDate,
      return_date: returnDate,
    });
    return (response?.data?.fine || 0) as number;
  }

  async getlearnerIssuedBooksCount(learnerId: string) {
    const response: any = await apiPost('/college-admin/library', {
      action: 'get-learner-issued-count',
      learner_id: learnerId,
    });
    return (response?.data?.count || 0) as number;
  }

  async getlearnerBorrowHistory(learnerId: string) {
    const response: any = await apiPost('/college-admin/library', {
      action: 'get-learner-borrow-history',
      learner_id: learnerId,
    });
    return (response?.data?.issues || []) as LibraryBookIssue[];
  }

  async searchlearners(searchTerm: string) {
    const collegeId = await this.getCurrentCollegeId();
    const response: any = await apiPost('/college-admin/library', {
      action: 'search-learners',
      college_id: collegeId,
      search_term: searchTerm,
    });
    return response?.data?.learners || [];
  }

  async getlearnerById(learnerId: string) {
    const collegeId = await this.getCurrentCollegeId();
    const response: any = await apiPost('/college-admin/library', {
      action: 'get-learner-by-id',
      learner_id: learnerId,
      college_id: collegeId,
    });
    return response?.data?.learner;
  }
}

export const libraryService = new LibraryService();
