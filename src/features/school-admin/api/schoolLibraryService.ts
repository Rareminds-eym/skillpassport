import { apiPost } from '@/shared/api/apiClient';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('schoolLibraryService');

export interface SchoolLibraryBook {
  id: string;
  school_id: string;
  title: string;
  author: string;
  isbn: string;
  total_copies: number;
  available_copies: number;
  status: 'available' | 'all_issued' | 'maintenance';
  category?: string;
  publisher?: string;
  publication_year?: number;
  description?: string;
  location_shelf?: string;
  created_at: string;
  updated_at: string;
}

export interface SchoolLibraryBookIssue {
  id: string;
  school_id: string;
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
  book?: SchoolLibraryBook;
}

export interface SchoolLibrarySetting {
  id: string;
  school_id: string;
  setting_key: string;
  setting_value: string;
  description?: string;
}

export interface SchoolLibraryCategory {
  id: string;
  school_id: string;
  name: string;
  description?: string;
  color_code: string;
}

export interface SchoolLibraryStats {
  school_id: string;
  total_books: number;
  total_copies: number;
  available_copies: number;
  currently_issued: number;
  overdue_count: number;
  total_pending_fines: number;
}

export interface SchoolOverdueBook extends SchoolLibraryBookIssue {
  title: string;
  author: string;
  isbn: string;
  current_fine: number;
  days_overdue: number;
}

const API_PATH = '/college-admin/school-library';

class SchoolLibraryService {
  async getBooks(schoolId: string, filters?: {
    search?: string;
    category?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const result = await apiPost(API_PATH, {
      action: 'get-books',
      school_id: schoolId,
      ...filters,
    });
    return result as { books: SchoolLibraryBook[]; count: number };
  }

  async getBookById(schoolId: string, id: string) {
    const result = await apiPost(API_PATH, {
      action: 'get-book-by-id',
      school_id: schoolId,
      id,
    });
    return result as SchoolLibraryBook;
  }

  async addBook(schoolId: string, book: Omit<SchoolLibraryBook, 'id' | 'school_id' | 'created_at' | 'updated_at'>) {
    const result = await apiPost(API_PATH, {
      action: 'add-book',
      school_id: schoolId,
      ...book,
    });
    return result as SchoolLibraryBook;
  }

  async updateBook(schoolId: string, id: string, updates: Partial<SchoolLibraryBook>) {
    const result = await apiPost(API_PATH, {
      action: 'update-book',
      school_id: schoolId,
      id,
      ...updates,
    });
    return result as SchoolLibraryBook;
  }

  async deleteBook(schoolId: string, id: string) {
    await apiPost(API_PATH, {
      action: 'delete-book',
      school_id: schoolId,
      id,
    });
  }

  async issueBook(schoolId: string, issue: {
    book_id: string;
    learner_id: string;
    learner_name: string;
    roll_number: string;
    class: string;
    academic_year: string;
    issued_by?: string;
  }) {
    const result = await apiPost(API_PATH, {
      action: 'issue-book',
      school_id: schoolId,
      ...issue,
    });
    return result as SchoolLibraryBookIssue;
  }

  async returnBook(schoolId: string, issueId: string, returnData: {
    return_date?: string;
    returned_by?: string;
    remarks?: string;
  }) {
    const result = await apiPost(API_PATH, {
      action: 'return-book',
      school_id: schoolId,
      issue_id: issueId,
      ...returnData,
    });
    return result as SchoolLibraryBookIssue;
  }

  async getBookIssues(schoolId: string, filters?: {
    learner_id?: string;
    book_id?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const result = await apiPost(API_PATH, {
      action: 'get-book-issues',
      school_id: schoolId,
      ...filters,
    });
    return result as { issues: SchoolLibraryBookIssue[]; count: number };
  }

  async searchIssuedBook(schoolId: string, bookId?: string, learnerId?: string) {
    if (!bookId && !learnerId) throw new Error('Either book_id or learner_id must be provided');
    const result = await apiPost(API_PATH, {
      action: 'search-issued-book',
      school_id: schoolId,
      book_id: bookId,
      learner_id: learnerId,
    });
    return result as SchoolLibraryBookIssue | null;
  }

  async getOverdueBooks(schoolId: string) {
    const result = await apiPost(API_PATH, {
      action: 'get-overdue-books',
      school_id: schoolId,
    });
    return result as SchoolOverdueBook[];
  }

  async getLibraryStats(schoolId: string) {
    const result = await apiPost(API_PATH, {
      action: 'get-library-stats',
      school_id: schoolId,
    });
    return result as SchoolLibraryStats;
  }

  async getSettings(schoolId: string) {
    const result = await apiPost(API_PATH, {
      action: 'get-settings',
      school_id: schoolId,
    });
    return result as SchoolLibrarySetting[];
  }

  async updateSetting(schoolId: string, key: string, value: string) {
    const result = await apiPost(API_PATH, {
      action: 'update-setting',
      school_id: schoolId,
      key,
      value,
    });
    return result as SchoolLibrarySetting;
  }

  async getCategories(schoolId: string) {
    const result = await apiPost(API_PATH, {
      action: 'get-categories',
      school_id: schoolId,
    });
    return result as SchoolLibraryCategory[];
  }

  async addCategory(schoolId: string, category: Omit<SchoolLibraryCategory, 'id' | 'school_id' | 'created_at' | 'updated_at'>) {
    const result = await apiPost(API_PATH, {
      action: 'add-category',
      school_id: schoolId,
      ...category,
    });
    return result as SchoolLibraryCategory;
  }

  async updateCategory(schoolId: string, id: string, updates: Partial<SchoolLibraryCategory>) {
    const result = await apiPost(API_PATH, {
      action: 'update-category',
      school_id: schoolId,
      id,
      ...updates,
    });
    return result as SchoolLibraryCategory;
  }

  async deleteCategory(schoolId: string, id: string) {
    await apiPost(API_PATH, {
      action: 'delete-category',
      school_id: schoolId,
      id,
    });
  }

  async calculateFine(schoolId: string, issueDate: string, returnDate?: string) {
    const result = await apiPost(API_PATH, {
      action: 'calculate-fine',
      school_id: schoolId,
      issue_date: issueDate,
      return_date: returnDate || new Date().toISOString().split('T')[0],
    });
    return result as number;
  }

  async getLearnerIssuedBooksCount(schoolId: string, learnerId: string) {
    const result = await apiPost(API_PATH, {
      action: 'get-learner-issued-count',
      school_id: schoolId,
      learner_id: learnerId,
    });
    return result as number;
  }

  async getLearnerBorrowHistory(schoolId: string, learnerId: string) {
    const result = await apiPost(API_PATH, {
      action: 'get-learner-borrow-history',
      school_id: schoolId,
      learner_id: learnerId,
    });
    return result as SchoolLibraryBookIssue[];
  }

  async searchLearners(schoolId: string, searchTerm: string) {
    const result = await apiPost(API_PATH, {
      action: 'search-learners-for-library',
      school_id: schoolId,
      search_term: searchTerm,
    });
    return result;
  }

  async getLearnerById(schoolId: string, learnerId: string) {
    const result = await apiPost(API_PATH, {
      action: 'get-learner-by-id',
      school_id: schoolId,
      learner_id: learnerId,
    });
    return result;
  }
}

export const schoolLibraryService = new SchoolLibraryService();
