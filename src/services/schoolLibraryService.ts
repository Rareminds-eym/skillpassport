import { supabase } from '../lib/supabaseClient';

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

class SchoolLibraryService {
  // Get current user's school ID
  private async getCurrentSchoolId(): Promise<string> {
    // First, check if user is logged in via AuthContext (for school admins)
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        if (userData.role === 'school_admin' && userData.schoolId) {
          return userData.schoolId;
        }
      } catch (e) {
        console.error('Error parsing stored user:', e);
      }
    }
    
    // If not found in localStorage, try Supabase Auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');
    
    // Check school_educators table
    const { data: educator } = await supabase
      .from('school_educators')
      .select('school_id')
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (educator?.school_id) {
      return educator.school_id;
    }
    
    // Check organizations table by email
    const { data: org } = await supabase
      .from('organizations')
      .select('id')
      .eq('organization_type', 'school')
      .eq('email', user.email)
      .maybeSingle();
    
    if (org?.id) {
      return org.id;
    }
    
    throw new Error('No school found for user');
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
    const schoolId = await this.getCurrentSchoolId();
    
    let query = supabase
      .from('library_books_school')
      .select('*', { count: 'exact' })
      .eq('school_id', schoolId)
      .order('title');

    if (filters?.search) {
      query = query.or(`title.ilike.%${filters.search}%,author.ilike.%${filters.search}%,isbn.ilike.%${filters.search}%`);
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
    return { books: data as SchoolLibraryBook[], count };
  }

  async getBookById(id: string) {
    const schoolId = await this.getCurrentSchoolId();
    
    const { data, error } = await supabase
      .from('library_books_school')
      .select('*')
      .eq('id', id)
      .eq('school_id', schoolId)
      .maybeSingle();

    if (error) throw error;
    return data as SchoolLibraryBook;
  }

  async addBook(book: Omit<SchoolLibraryBook, 'id' | 'school_id' | 'created_at' | 'updated_at'>) {
    const schoolId = await this.getCurrentSchoolId();
    
    const { data, error } = await supabase
      .from('library_books_school')
      .insert([{ ...book, school_id: schoolId }])
      .select()
      .single();

    if (error) throw error;
    return data as SchoolLibraryBook;
  }

  async updateBook(id: string, updates: Partial<SchoolLibraryBook>) {
    const schoolId = await this.getCurrentSchoolId();
    
    const { data, error } = await supabase
      .from('library_books_school')
      .update(updates)
      .eq('id', id)
      .eq('school_id', schoolId)
      .select()
      .single();

    if (error) throw error;
    return data as SchoolLibraryBook;
  }

  async deleteBook(id: string) {
    const schoolId = await this.getCurrentSchoolId();
    
    const { error } = await supabase
      .from('library_books_school')
      .delete()
      .eq('id', id)
      .eq('school_id', schoolId);

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
    const schoolId = await this.getCurrentSchoolId();
    
    // First check if student has reached max book limit
    const settings = await this.getSettings();
    const maxBooks = parseInt(settings.find(s => s.setting_key === 'max_books_per_student')?.setting_value || '3');
    
    const { count: currentIssues } = await supabase
      .from('library_book_issues_school')
      .select('*', { count: 'exact', head: true })
      .eq('school_id', schoolId)
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
      school_id: schoolId,
      issue_date: issueDate.toISOString().split('T')[0],
      due_date: dueDate.toISOString().split('T')[0],
      status: 'issued' as const,
    };

    const { data, error } = await supabase
      .from('library_book_issues_school')
      .insert([issueData])
      .select(`
        *,
        book:library_books_school(*)
      `)
      .single();

    if (error) throw error;
    return data as SchoolLibraryBookIssue;
  }

  async returnBook(issueId: string, returnData: {
    return_date?: string;
    returned_by?: string;
    remarks?: string;
  }) {
    const schoolId = await this.getCurrentSchoolId();
    
    // Get the issue record
    const { data: issue, error: fetchError } = await supabase
      .from('library_book_issues_school')
      .select('*')
      .eq('id', issueId)
      .eq('school_id', schoolId)
      .eq('status', 'issued')
      .single();

    if (fetchError) throw fetchError;
    if (!issue) throw new Error('Issue record not found or already returned.');

    // Calculate fine
    const returnDate = returnData.return_date || new Date().toISOString().split('T')[0];
    const { data: fineData, error: fineError } = await supabase
      .rpc('calculate_fine_school', {
        p_school_id: schoolId,
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
      .from('library_book_issues_school')
      .update(updateData)
      .eq('id', issueId)
      .eq('school_id', schoolId)
      .select(`
        *,
        book:library_books_school(*)
      `)
      .single();

    if (error) throw error;
    return data as SchoolLibraryBookIssue;
  }

  async getBookIssues(filters?: {
    student_id?: string;
    book_id?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const schoolId = await this.getCurrentSchoolId();
    
    let query = supabase
      .from('library_book_issues_school')
      .select(`
        *,
        book:library_books_school(*)
      `)
      .eq('school_id', schoolId)
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
    return { issues: data as SchoolLibraryBookIssue[], count };
  }

  async searchIssuedBook(bookId?: string, studentId?: string) {
    const schoolId = await this.getCurrentSchoolId();
    
    let query = supabase
      .from('library_book_issues_school')
      .select(`
        *,
        book:library_books_school(*)
      `)
      .eq('school_id', schoolId)
      .eq('status', 'issued');

    if (bookId && studentId) {
      query = query.eq('book_id', bookId).eq('student_id', studentId);
    } else if (bookId) {
      query = query.eq('book_id', bookId);
    } else if (studentId) {
      query = query.eq('student_id', studentId);
    } else {
      throw new Error('Either book_id or student_id must be provided');
    }

    const { data, error } = await query.maybeSingle();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data as SchoolLibraryBookIssue | null;
  }

  // ============================================================================
  // OVERDUE BOOKS
  // ============================================================================

  async getOverdueBooks() {
    const schoolId = await this.getCurrentSchoolId();
    
    const { data, error } = await supabase
      .from('overdue_books_school')
      .select('*')
      .eq('school_id', schoolId)
      .order('days_overdue', { ascending: false });

    if (error) throw error;
    return data as SchoolOverdueBook[];
  }

  // ============================================================================
  // LIBRARY STATISTICS
  // ============================================================================

  async getLibraryStats() {
    const schoolId = await this.getCurrentSchoolId();
    
    const { data, error } = await supabase
      .from('library_stats_school')
      .select('*')
      .eq('school_id', schoolId)
      .maybeSingle();

    if (error) throw error;
    return data as SchoolLibraryStats;
  }

  // ============================================================================
  // SETTINGS MANAGEMENT
  // ============================================================================

  async getSettings() {
    const schoolId = await this.getCurrentSchoolId();
    
    const { data, error } = await supabase
      .from('library_settings_school')
      .select('*')
      .eq('school_id', schoolId)
      .order('setting_key');

    if (error) throw error;
    return data as SchoolLibrarySetting[];
  }

  async updateSetting(key: string, value: string) {
    const schoolId = await this.getCurrentSchoolId();
    
    const { data, error } = await supabase
      .from('library_settings_school')
      .update({ setting_value: value })
      .eq('school_id', schoolId)
      .eq('setting_key', key)
      .select()
      .single();

    if (error) throw error;
    return data as SchoolLibrarySetting;
  }

  // ============================================================================
  // CATEGORIES MANAGEMENT
  // ============================================================================

  async getCategories() {
    const schoolId = await this.getCurrentSchoolId();
    
    const { data, error } = await supabase
      .from('library_categories_school')
      .select('*')
      .eq('school_id', schoolId)
      .order('name');

    if (error) throw error;
    return data as SchoolLibraryCategory[];
  }

  async addCategory(category: Omit<SchoolLibraryCategory, 'id' | 'school_id' | 'created_at' | 'updated_at'>) {
    const schoolId = await this.getCurrentSchoolId();
    
    const { data, error } = await supabase
      .from('library_categories_school')
      .insert([{ ...category, school_id: schoolId }])
      .select()
      .single();

    if (error) throw error;
    return data as SchoolLibraryCategory;
  }

  async updateCategory(id: string, updates: Partial<SchoolLibraryCategory>) {
    const schoolId = await this.getCurrentSchoolId();
    
    const { data, error } = await supabase
      .from('library_categories_school')
      .update(updates)
      .eq('id', id)
      .eq('school_id', schoolId)
      .select()
      .single();

    if (error) throw error;
    return data as SchoolLibraryCategory;
  }

  async deleteCategory(id: string) {
    const schoolId = await this.getCurrentSchoolId();
    
    const { error } = await supabase
      .from('library_categories_school')
      .delete()
      .eq('id', id)
      .eq('school_id', schoolId);

    if (error) throw error;
  }

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  async calculateFine(issueDate: string, returnDate?: string) {
    const schoolId = await this.getCurrentSchoolId();
    
    const { data, error } = await supabase
      .rpc('calculate_fine_school', {
        p_school_id: schoolId,
        issue_date: issueDate,
        return_date: returnDate || new Date().toISOString().split('T')[0]
      });

    if (error) throw error;
    return data as number;
  }

  // Get student's current issued books count
  async getStudentIssuedBooksCount(studentId: string) {
    const schoolId = await this.getCurrentSchoolId();
    
    const { count, error } = await supabase
      .from('library_book_issues_school')
      .select('*', { count: 'exact', head: true })
      .eq('school_id', schoolId)
      .eq('student_id', studentId)
      .eq('status', 'issued');

    if (error) throw error;
    return count || 0;
  }

  // Get borrow history for a student
  async getStudentBorrowHistory(studentId: string) {
    const schoolId = await this.getCurrentSchoolId();
    
    const { data, error } = await supabase
      .from('library_book_issues_school')
      .select(`
        *,
        book:library_books_school(*)
      `)
      .eq('school_id', schoolId)
      .eq('student_id', studentId)
      .order('issue_date', { ascending: false });

    if (error) throw error;
    return data as SchoolLibraryBookIssue[];
  }

  // Search students for book issuing
  async searchStudents(searchTerm: string) {
    const schoolId = await this.getCurrentSchoolId();
    
    const { data, error } = await supabase
      .from('students')
      .select('id, name, roll_number, enrollmentNumber, admission_number, contact_number, email, grade, section, course_name, semester')
      .eq('school_id', schoolId)
      .eq('is_deleted', false)
      .or(`name.ilike.%${searchTerm}%,roll_number.ilike.%${searchTerm}%,enrollmentNumber.ilike.%${searchTerm}%,admission_number.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
      .order('name')
      .limit(10);

    if (error) throw error;
    return data;
  }

  // Get student details by ID
  async getStudentById(studentId: string) {
    const schoolId = await this.getCurrentSchoolId();
    
    const { data, error } = await supabase
      .from('students')
      .select('id, name, roll_number, enrollmentNumber, admission_number, contact_number, email, grade, section, course_name, semester')
      .eq('id', studentId)
      .eq('school_id', schoolId)
      .eq('is_deleted', false)
      .maybeSingle();

    if (error) throw error;
    return data;
  }
}

export const schoolLibraryService = new SchoolLibraryService();