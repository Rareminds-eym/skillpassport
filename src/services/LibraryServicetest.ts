import { supabase } from '../lib/supabaseClient';

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
  student_id: string;
  student_name: string;
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
  // Joined fields
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
  // Get current user's college ID
  private async getCurrentCollegeId(): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');
    
    // Try to get college_id from user metadata first
    const collegeId = user.user_metadata?.college_id;
    if (collegeId) return collegeId;
    
    // For college admin, get college_id from the user's profile or students table
    // Check if user is a college admin and get their college_id
    const { data: userData } = await supabase
      .from('students')
      .select('college_id')
      .eq('user_id', user.id)
      .limit(1)
      .single();
    
    if (userData?.college_id) {
      return userData.college_id;
    }
    
    // Fallback: get from organizations table
    const { data: orgs } = await supabase
      .from('organizations')
      .select('id')
      .eq('organization_type', 'college')
      .limit(1);
    
    if (orgs && orgs.length > 0) {
      return orgs[0].id;
    }
    
    throw new Error('No college found for user');
  }

  // ============================================================================
  // BOOKS MANAGEMENT
  // ============================================================================
  
  async getBooks(filters?: {
    search?: string;
    category?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const collegeId = await this.getCurrentCollegeId();
    
    let query = supabase
      .from('library_books_college')
      .select('*', { count: 'exact' })
      .eq('college_id', collegeId)
      .order('title');

    if (filters?.search) {
      query = query.or(`title.ilike.%${filters.search}%,author.ilike.%${filters.search}%,isbn.ilike.%${filters.search}%,book_id.ilike.%${filters.search}%`);
    }

    if (filters?.category) {
      query = query.eq('category', filters.category);
    }

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.page && filters?.limit) {
      const from = (filters.page - 1) * filters.limit;
      const to = from + filters.limit - 1;
      query = query.range(from, to);
    }

    const { data, error, count } = await query;
    
    if (error) throw error;
    return { books: data as LibraryBook[], count };
  }

  async getBookById(id: string) {
    const collegeId = await this.getCurrentCollegeId();
    
    const { data, error } = await supabase
      .from('library_books')
      .select('*')
      .eq('id', id)
      .eq('college_id', collegeId)
      .single();

    if (error) throw error;
    return data as LibraryBook;
  }

  async addBook(book: Omit<LibraryBook, 'id' | 'created_at' | 'updated_at'>) {
    const collegeId = await this.getCurrentCollegeId();
    
    // Generate a unique book_id if not provided
    const bookData = {
      ...book,
      college_id: collegeId,
      book_id: book.book_id || `BK-${Date.now()}`,
      location: book.location || 'Main Library',
      status: book.status || 'available',
    };
    
    const { data, error } = await supabase
      .from('library_books')
      .insert([bookData])
      .select()
      .single();

    if (error) throw error;
    return data as LibraryBook;
  }

  async updateBook(id: string, updates: Partial<LibraryBook>) {
    const collegeId = await this.getCurrentCollegeId();
    
    const { data, error } = await supabase
      .from('library_books')
      .update(updates)
      .eq('id', id)
      .eq('college_id', collegeId)
      .select()
      .single();

    if (error) throw error;
    return data as LibraryBook;
  }

  async deleteBook(id: string) {
    const collegeId = await this.getCurrentCollegeId();
    
    const { error } = await supabase
      .from('library_books')
      .delete()
      .eq('id', id)
      .eq('college_id', collegeId);

    if (error) throw error;
  }

  // ============================================================================
  // BOOK ISSUES MANAGEMENT
  // ============================================================================

  async issueBook(issue: {
    book_id: string;
    student_id: string;
    student_name: string;
    roll_number: string;
    class: string;
    academic_year: string;
    issued_by?: string;
  }) {
    const collegeId = await this.getCurrentCollegeId();
    
    // First check if student has reached max book limit
    const settings = await this.getSettings();
    const maxBooks = parseInt(settings.find(s => s.setting_key === 'max_books_per_student')?.setting_value || '3');
    
    const { count: currentIssues } = await supabase
      .from('library_book_issues')
      .select('*', { count: 'exact', head: true })
      .eq('student_id', issue.student_id)
      .eq('status', 'issued');

    if (currentIssues && currentIssues >= maxBooks) {
      throw new Error(`Student has already issued ${maxBooks} books. Maximum limit reached.`);
    }

    // Check book availability
    const book = await this.getBookById(issue.book_id);
    if (book.available_copies <= 0) {
      throw new Error('Book is not available for issue.');
    }

    // Calculate due date
    const loanPeriod = parseInt(settings.find(s => s.setting_key === 'default_loan_period_days')?.setting_value || '14');
    const issueDate = new Date();
    const dueDate = new Date(issueDate);
    dueDate.setDate(dueDate.getDate() + loanPeriod);

    const issueData = {
      ...issue,
      issue_date: issueDate.toISOString().split('T')[0],
      due_date: dueDate.toISOString().split('T')[0],
      status: 'issued' as const,
    };

    const { data, error } = await supabase
      .from('library_book_issues')
      .insert([issueData])
      .select(`
        *,
        book:library_books(*)
      `)
      .single();

    if (error) throw error;
    return data as LibraryBookIssue;
  }

  async returnBook(issueId: string, returnData: {
    return_date?: string;
    returned_by?: string;
    remarks?: string;
  }) {
    // Get the issue record
    const { data: issue, error: fetchError } = await supabase
      .from('library_book_issues')
      .select('*')
      .eq('id', issueId)
      .eq('status', 'issued')
      .single();

    if (fetchError) throw fetchError;
    if (!issue) throw new Error('Issue record not found or already returned.');

    // Calculate fine
    const returnDate = returnData.return_date || new Date().toISOString().split('T')[0];
    const { data: fineData, error: fineError } = await supabase
      .rpc('calculate_fine', {
        issue_date: issue.issue_date,
        return_date: returnDate
      });

    if (fineError) throw fineError;

    const updateData = {
      ...returnData,
      return_date: returnDate,
      status: 'returned' as const,
      fine_amount: fineData || 0,
    };

    const { data, error } = await supabase
      .from('library_book_issues')
      .update(updateData)
      .eq('id', issueId)
      .select(`
        *,
        book:library_books(*)
      `)
      .single();

    if (error) throw error;
    return data as LibraryBookIssue;
  }

  async getBookIssues(filters?: {
    student_id?: string;
    book_id?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const collegeId = await this.getCurrentCollegeId();
    
    // First get student IDs from this college
    const { data: students } = await supabase
      .from('students')
      .select('id')
      .eq('college_id', collegeId);
    
    const studentIds = students?.map(s => s.id) || [];
    
    if (studentIds.length === 0) {
      return { issues: [], count: 0 };
    }

    let query = supabase
      .from('library_book_issues')
      .select(`
        *,
        book:library_books(*)
      `, { count: 'exact' })
      .in('student_id', studentIds)
      .order('issue_date', { ascending: false });

    if (filters?.student_id) {
      query = query.eq('student_id', filters.student_id);
    }

    if (filters?.book_id) {
      query = query.eq('book_id', filters.book_id);
    }

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.search) {
      query = query.or(`student_name.ilike.%${filters.search}%,roll_number.ilike.%${filters.search}%`);
    }

    if (filters?.page && filters?.limit) {
      const from = (filters.page - 1) * filters.limit;
      const to = from + filters.limit - 1;
      query = query.range(from, to);
    }

    const { data, error, count } = await query;
    
    if (error) throw error;
    return { issues: data as LibraryBookIssue[], count };
  }

  async searchIssuedBook(bookId?: string, studentId?: string) {
    const collegeId = await this.getCurrentCollegeId();
    
    let query = supabase
      .from('library_book_issues')
      .select(`
        *,
        book:library_books(*)
      `)
      .eq('status', 'issued');

    // Filter by college students only
    if (collegeId && !studentId) {
      // Get student IDs from the college
      const { data: students } = await supabase
        .from('students')
        .select('id')
        .eq('college_id', collegeId);
      
      const studentIds = students?.map(s => s.id) || [];
      if (studentIds.length > 0) {
        query = query.in('student_id', studentIds);
      }
    }

    if (bookId && studentId) {
      query = query.eq('book_id', bookId).eq('student_id', studentId);
    } else if (bookId) {
      query = query.eq('book_id', bookId);
    } else if (studentId) {
      query = query.eq('student_id', studentId);
    } else {
      throw new Error('Either book_id or student_id must be provided');
    }

    const { data, error } = await query.single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data as LibraryBookIssue | null;
  }

  // ============================================================================
  // OVERDUE BOOKS
  // ============================================================================

  async getOverdueBooks() {
    const collegeId = await this.getCurrentCollegeId();
    
    // Get overdue books for students from this college
    const { data: students } = await supabase
      .from('students')
      .select('id')
      .eq('college_id', collegeId);
    
    const studentIds = students?.map(s => s.id) || [];
    
    if (studentIds.length === 0) {
      return [];
    }

    const { data, error } = await supabase
      .from('overdue_books')
      .select('*')
      .in('student_id', studentIds)
      .order('days_overdue', { ascending: false });

    if (error) throw error;
    return data as OverdueBook[];
  }

  // ============================================================================
  // LIBRARY STATISTICS
  // ============================================================================

  async getLibraryStats() {
    const collegeId = await this.getCurrentCollegeId();
    
    // Get students from this college
    const { data: students } = await supabase
      .from('students')
      .select('id')
      .eq('college_id', collegeId);
    
    const studentIds = students?.map(s => s.id) || [];
    
    // Calculate stats manually for this college
    const { data: booksData } = await supabase
      .from('library_books')
      .select('total_copies, available_copies');
    
    const totalBooks = booksData?.length || 0;
    const totalCopies = booksData?.reduce((sum, book) => sum + book.total_copies, 0) || 0;
    const availableCopies = booksData?.reduce((sum, book) => sum + book.available_copies, 0) || 0;
    
    let currentlyIssued = 0;
    let overdueCount = 0;
    let totalPendingFines = 0;
    
    if (studentIds.length > 0) {
      const { count: issuedCount } = await supabase
        .from('library_book_issues')
        .select('*', { count: 'exact', head: true })
        .in('student_id', studentIds)
        .eq('status', 'issued');
      
      currentlyIssued = issuedCount || 0;
      
      // Get overdue data
      const { data: overdueData } = await supabase
        .from('overdue_books')
        .select('current_fine')
        .in('student_id', studentIds);
      
      overdueCount = overdueData?.length || 0;
      totalPendingFines = overdueData?.reduce((sum, item) => sum + (item.current_fine || 0), 0) || 0;
    }

    const stats: LibraryStats = {
      college_id: collegeId,
      total_books: totalBooks,
      total_copies: totalCopies,
      available_copies: availableCopies,
      currently_issued: currentlyIssued,
      overdue_count: overdueCount,
      total_pending_fines: totalPendingFines,
    };

    return stats;
  }

  // ============================================================================
  // SETTINGS MANAGEMENT
  // ============================================================================

  async getSettings() {
    const { data, error } = await supabase
      .from('library_settings')
      .select('*')
      .order('setting_key');

    if (error) throw error;
    return data as LibrarySetting[];
  }

  async updateSetting(key: string, value: string) {
    const { data, error } = await supabase
      .from('library_settings')
      .update({ setting_value: value })
      .eq('setting_key', key)
      .select()
      .single();

    if (error) throw error;
    return data as LibrarySetting;
  }

  // ============================================================================
  // CATEGORIES MANAGEMENT
  // ============================================================================

  async getCategories() {
    const { data, error } = await supabase
      .from('library_categories')
      .select('*')
      .order('name');

    if (error) throw error;
    return data as LibraryCategory[];
  }

  async addCategory(category: Omit<LibraryCategory, 'id' | 'college_id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('library_categories')
      .insert([category])
      .select()
      .single();

    if (error) throw error;
    return data as LibraryCategory;
  }

  async updateCategory(id: string, updates: Partial<LibraryCategory>) {
    const { data, error } = await supabase
      .from('library_categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as LibraryCategory;
  }

  async deleteCategory(id: string) {
    const { error } = await supabase
      .from('library_categories')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  async calculateFine(issueDate: string, returnDate?: string) {
    const { data, error } = await supabase
      .rpc('calculate_fine', {
        issue_date: issueDate,
        return_date: returnDate || new Date().toISOString().split('T')[0]
      });

    if (error) throw error;
    return data as number;
  }

  // Get student's current issued books count
  async getStudentIssuedBooksCount(studentId: string) {
    const { count, error } = await supabase
      .from('library_book_issues')
      .select('*', { count: 'exact', head: true })
      .eq('student_id', studentId)
      .eq('status', 'issued');

    if (error) throw error;
    return count || 0;
  }

  // Get borrow history for a student
  async getStudentBorrowHistory(studentId: string) {
    const { data, error } = await supabase
      .from('library_book_issues')
      .select(`
        *,
        book:library_books(*)
      `)
      .eq('student_id', studentId)
      .order('issue_date', { ascending: false });

    if (error) throw error;
    return data as LibraryBookIssue[];
  }

  // Search students for book issuing
  async searchStudents(searchTerm: string) {
    const collegeId = await this.getCurrentCollegeId();
    
    const { data, error } = await supabase
      .from('students')
      .select('id, name, roll_number, enrollment_number, admission_number, contact_number as phone, email, grade, section, course_name, semester')
      .eq('college_id', collegeId)
      .eq('is_deleted', false)
      .or(`name.ilike.%${searchTerm}%,roll_number.ilike.%${searchTerm}%,enrollment_number.ilike.%${searchTerm}%,admission_number.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
      .order('name')
      .limit(10);

    if (error) throw error;
    return data;
  }

  // Get student details by ID
  async getStudentById(studentId: string) {
    const collegeId = await this.getCurrentCollegeId();
    
    const { data, error } = await supabase
      .from('students')
      .select('id, name, roll_number, enrollment_number, admission_number, contact_number as phone, email, grade, section, course_name, semester')
      .eq('id', studentId)
      .eq('college_id', collegeId)
      .eq('is_deleted', false)
      .single();

    if (error) throw error;
    return data;
  }
}

export const libraryService = new LibraryService();