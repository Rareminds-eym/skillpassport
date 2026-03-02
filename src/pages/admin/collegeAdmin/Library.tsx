import { useEffect, useRef, useState } from "react";
import toast from 'react-hot-toast';
import { supabase } from "../../../lib/supabaseClient";
import { LibraryBook, LibraryBookIssue, libraryService, LibrarySetting, LibraryStats, OverdueBook } from "../../../services/libraryService";
import { 
  LibraryHeader, 
  LibraryStatsCards, 
  LibraryTabs, 
  DashboardTab,
  AddBookModal,
  IssueBookModal,
  ReturnBookModal,
  DetailsTab,
  HistoryTab,
  OverdueTab,
} from "./components/library";

export default function LibraryModule() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddBookModal, setShowAddBookModal] = useState(false);
  const [showIssueBookModal, setShowIssueBookModal] = useState(false);
  const [showReturnBookModal, setShowReturnBookModal] = useState(false);
  const [selectedBookIdForReturn, setSelectedBookIdForReturn] = useState<string | null>(null);

  // Data states
  const [books, setBooks] = useState<LibraryBook[]>([]);
  const [totalBooksCount, setTotalBooksCount] = useState(0);
  const [issuedBooks, setIssuedBooks] = useState<LibraryBookIssue[]>([]);
  const [borrowHistory, setBorrowHistory] = useState<LibraryBookIssue[]>([]);
  const [overdueBooks, setOverdueBooks] = useState<OverdueBook[]>([]);
  const [libraryStats, setLibraryStats] = useState<LibraryStats | null>(null);
  const [librarySettings, setLibrarySettings] = useState<LibrarySetting[]>([]);

  // Library Configuration Rules
  const [LIBRARY_RULES, setLibraryRules] = useState({
    maxBooksPerStudent: 3,
    defaultLoanPeriodDays: 14,
    finePerDay: 10,
  });

  // New book form state
  const [newBook, setNewBook] = useState({ 
    title: "", 
    author: "", 
    isbn: "", 
    total_copies: 1,
    category: "",
    publisher: "",
    publication_year: new Date().getFullYear(),
    description: "",
    location_shelf: ""
  });

  // Dashboard pagination
  const [dashboardPage, setDashboardPage] = useState(1);
  const dashboardBooksPerPage = 10;

  // Book Details filters and pagination
  const [bookSearch, setBookSearch] = useState("");
  const [bookFilter, setBookFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const booksPerPage = 6;

  // Return Book - Issued books pagination and modal
  const [issuedBooksSearch, setIssuedBooksSearch] = useState("");
  const [issuedBooksPage, setIssuedBooksPage] = useState(1);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const issuedBooksPerPage = 6;

  // Issue book form state
  const [issueForm, setIssueForm] = useState({
    studentId: "",
    studentName: "",
    rollNumber: "",
    enrollmentNumber: "",
    admissionNumber: "",
    grade: "",
    section: "",
    courseName: "",
    semester: "",
    bookId: "",
    dueDate: "",
  });

  // Student search state
  const [studentSearch, setStudentSearch] = useState("");
  const [studentSearchResults, setStudentSearchResults] = useState<any[]>([]);
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const studentSearchRef = useRef<HTMLDivElement>(null);

  // Return book form state
  const [returnForm, setReturnForm] = useState({
    bookId: "",
    studentId: "",
    studentName: "",
    rollNumber: "",
    class: "",
    bookTitle: "",
    issueDate: "",
    dueDate: "",
    returnDate: new Date().toISOString().split('T')[0],
  });

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  // Click outside handler for student dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (studentSearchRef.current && !studentSearchRef.current.contains(event.target as Node)) {
        setShowStudentDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (studentSearch.length >= 2) {
        searchStudents(studentSearch);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [studentSearch]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      const settings = await libraryService.getSettings();
      setLibrarySettings(settings);
      
      const maxBooks = parseInt(settings.find(s => s.setting_key === 'max_books_per_student')?.setting_value || '3');
      const loanPeriod = parseInt(settings.find(s => s.setting_key === 'default_loan_period_days')?.setting_value || '14');
      const finePerDay = parseInt(settings.find(s => s.setting_key === 'fine_per_day')?.setting_value || '10');
      
      setLibraryRules({
        maxBooksPerStudent: maxBooks,
        defaultLoanPeriodDays: loanPeriod,
        finePerDay: finePerDay,
      });

      await Promise.all([
        loadBooks(),
        loadIssuedBooks(),
        loadLibraryStats(),
        loadOverdueBooks(),
      ]);
    } catch (err) {
      console.error('Error loading library data:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load library data';
      setError(errorMessage);
      toast.error(`Failed to load library data: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const loadBooks = async (filters?: { search?: string; status?: string; page?: number }) => {
    try {
      const searchTerm = filters?.search !== undefined ? filters.search : bookSearch;
      const statusFilter = filters?.status !== undefined ? filters.status : bookFilter;
      const pageNum = filters?.page !== undefined ? filters.page : currentPage;
      
      const actualStatusFilter = statusFilter === 'all' ? undefined : statusFilter;
      
      const { books: booksData, count } = await libraryService.getBooks({
        search: searchTerm || undefined,
        status: actualStatusFilter,
        page: pageNum,
        limit: booksPerPage,
      });
      setBooks(booksData);
      setTotalBooksCount(count || 0);
      
      if (filters?.search !== undefined) setBookSearch(filters.search);
      if (filters?.status !== undefined) setBookFilter(filters.status);
      if (filters?.page !== undefined) setCurrentPage(filters.page);
    } catch (err) {
      console.error('Error loading books:', err);
      toast.error('Failed to load books');
    }
  };

  const loadIssuedBooks = async () => {
    try {
      const { issues } = await libraryService.getBookIssues({ status: 'issued' });
      setIssuedBooks(issues);
    } catch (err) {
      console.error('Error loading issued books:', err);
      toast.error('Failed to load issued books');
    }
  };

  const loadLibraryStats = async () => {
    try {
      const stats = await libraryService.getLibraryStats();
      setLibraryStats(stats);
    } catch (err) {
      console.error('Error loading library stats:', err);
      toast.error('Failed to load library statistics');
    }
  };

  const loadOverdueBooks = async () => {
    try {
      const overdue = await libraryService.getOverdueBooks();
      setOverdueBooks(overdue);
    } catch (err) {
      console.error('Error loading overdue books:', err);
      toast.error('Failed to load overdue books');
    }
  };

  const loadBorrowHistory = async () => {
    try {
      const { issues } = await libraryService.getBookIssues();
      setBorrowHistory(issues);
    } catch (err) {
      console.error('Error loading borrow history:', err);
      toast.error('Failed to load borrow history');
    }
  };

  // Student search functionality
  const searchStudents = async (searchTerm: string) => {
    if (searchTerm.length < 2) {
      setStudentSearchResults([]);
      setShowStudentDropdown(false);
      setSearchLoading(false);
      return;
    }

    try {
      setSearchLoading(true);

      let schoolId: string | null = null;
      let collegeId: string | null = null;
      let userRole: string | null = null;
      let userId: string | null = null;
      let universityId: string | null = null;
      
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          userRole = userData.role;
          
          if (userData.role === 'school_admin' && userData.schoolId) {
            schoolId = userData.schoolId;
          } else if (userData.role === 'college_admin' && userData.collegeId) {
            collegeId = userData.collegeId;
          } else if (userData.role === 'university_admin' && (userData.universityId || userData.organizationId)) {
            universityId = userData.universityId || userData.organizationId;
          }
        } catch (e) {
          console.error('Error parsing stored user:', e);
        }
      }
      
      if (!schoolId && !collegeId) {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          userId = user.id;
          
          const { data: userRecord } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single();
          
          userRole = userRecord?.role || null;
          
          if (userRole === 'college_admin') {
            const { data: org } = await supabase
              .from('organizations')
              .select('id, name, email')
              .eq('organization_type', 'college')
              .ilike('email', user.email || '')
              .maybeSingle();
            
            if (org?.id) {
              collegeId = org.id;
            }
          } else {
            const { data: educator } = await supabase
              .from('school_educators')
              .select('school_id')
              .eq('user_id', user.id)
              .single();
            
            if (educator?.school_id) {
              schoolId = educator.school_id;
            } else {
              const { data: org } = await supabase
                .from('organizations')
                .select('id')
                .eq('organization_type', 'school')
                .eq('email', user.email)
                .maybeSingle();
              
              schoolId = org?.id || null;
            }
          }
        }
      }
      
      let query = supabase
        .from('students')
        .select('id, name, roll_number, enrollmentNumber, admission_number, contact_number, email, grade, section, course_name, semester')
        .eq('is_deleted', false)
        .or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,contact_number.ilike.%${searchTerm}%,grade.ilike.%${searchTerm}%,section.ilike.%${searchTerm}%,roll_number.ilike.%${searchTerm}%`)
        .order('name')
        .limit(10);
      
      if (schoolId) {
        query = query.eq('school_id', schoolId);
      } else if (collegeId) {
        query = query.eq('college_id', collegeId);
      } else if (universityId) {
        query = query.eq('universityId', universityId);
      }
      
      const { data: students, error } = await query;
      
      if (error) {
        console.error('Supabase query error:', error);
        throw error;
      }
      
      setStudentSearchResults(students || []);
      setShowStudentDropdown(students && students.length > 0);
      
    } catch (err) {
      console.error('Error searching students:', err);
      setStudentSearchResults([]);
      setShowStudentDropdown(false);
    } finally {
      setSearchLoading(false);
    }
  };

  const selectStudent = async (student: any) => {
    setSelectedStudent(student);
    setStudentSearch(student.name);
    setIssueForm({
      ...issueForm,
      studentId: student.id,
      studentName: student.name,
      rollNumber: student.roll_number || "",
      enrollmentNumber: student.enrollmentNumber || "",
      admissionNumber: student.admission_number || "",
      grade: student.grade || "",
      section: student.section || "",
      courseName: student.course_name || "",
      semester: student.semester ? student.semester.toString() : "",
    });
    setShowStudentDropdown(false);

    toast.success(`Selected student: ${student.name}`, { duration: 2000 });

    try {
      const currentCount = await libraryService.getStudentIssuedBooksCount(student.id);
      if (currentCount >= LIBRARY_RULES.maxBooksPerStudent) {
        toast.error(`${student.name} has already issued ${currentCount} books (maximum: ${LIBRARY_RULES.maxBooksPerStudent}). Cannot issue more books.`);
      } else if (currentCount > 0) {
        toast.success(`${student.name} currently has ${currentCount} book(s) issued.`, { 
          icon: 'ℹ️',
          duration: 3000 
        });
      }
    } catch (err) {
      console.error('Error checking student issued books:', err);
      toast.error('Failed to check student\'s current book count');
    }
  };

  const clearStudentSelection = () => {
    setSelectedStudent(null);
    setStudentSearch("");
    setIssueForm({
      ...issueForm,
      studentId: "",
      studentName: "",
      rollNumber: "",
      enrollmentNumber: "",
      admissionNumber: "",
      grade: "",
      section: "",
      courseName: "",
      semester: "",
    });
    setStudentSearchResults([]);
    setShowStudentDropdown(false);
    toast.success('Student selection cleared', { 
      icon: 'ℹ️',
      duration: 1500 
    });
  };

  const calculateFine = (issueDate: string, returnDate: string) => {
    try {
      const issue = new Date(issueDate);
      const dueDate = new Date(issue);
      dueDate.setDate(dueDate.getDate() + LIBRARY_RULES.defaultLoanPeriodDays);
      
      const ret = new Date(returnDate);
      const overdueDays = Math.max(0, Math.floor((ret.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)));
      const fine = overdueDays * LIBRARY_RULES.finePerDay;
      
      return { 
        dueDate: dueDate.toISOString().split('T')[0], 
        overdueDays, 
        fine 
      };
    } catch (err) {
      console.error('Error calculating fine:', err);
      return { 
        dueDate: new Date().toISOString().split('T')[0], 
        overdueDays: 0, 
        fine: 0 
      };
    }
  };

  const addBook = async () => {
    if (!newBook.title || !newBook.author || !newBook.isbn || newBook.total_copies < 1) {
      toast.error("Please fill all required fields correctly.");
      return;
    }

    try {
      setLoading(true);
      const loadingToast = toast.loading('Adding book to library...');
      
      await libraryService.addBook({
        ...newBook,
        available_copies: newBook.total_copies,
        status: 'available' as const,
      });
      
      toast.dismiss(loadingToast);
      
      setNewBook({ 
        title: "", 
        author: "", 
        isbn: "", 
        total_copies: 1,
        category: "",
        publisher: "",
        publication_year: new Date().getFullYear(),
        description: "",
        location_shelf: ""
      });
      
      toast.success("Book added successfully!", { duration: 3000 });
      
      setBookSearch("");
      setBookFilter("all");
      setCurrentPage(1);
      
      await loadBooks({ search: "", status: "all", page: 1 });
      await loadLibraryStats();
      
      setActiveTab("details");
    } catch (err) {
      console.error('Error adding book:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to add book');
    } finally {
      setLoading(false);
    }
  };

  const issueBook = async () => {
    if (!issueForm.studentId || !issueForm.studentName || !issueForm.bookId) {
      toast.error("Please select a student and book.");
      return;
    }

    try {
      setLoading(true);
      const loadingToast = toast.loading(`Issuing book to ${issueForm.studentName}...`);

      const studentIdentifier = issueForm.rollNumber || issueForm.enrollmentNumber || issueForm.admissionNumber || issueForm.studentId;
      const classInfo = issueForm.grade && issueForm.section ? `${issueForm.grade}-${issueForm.section}` : issueForm.grade || "";
      const academicYear = issueForm.semester ? `Semester ${issueForm.semester}` : new Date().getFullYear().toString();

      await libraryService.issueBook({
        book_id: issueForm.bookId,
        student_id: issueForm.studentId,
        student_name: issueForm.studentName,
        roll_number: studentIdentifier,
        class: classInfo,
        academic_year: academicYear,
      });

      toast.dismiss(loadingToast);

      setIssueForm({ 
        studentId: "",
        studentName: "", 
        rollNumber: "",
        enrollmentNumber: "",
        admissionNumber: "",
        grade: "",
        section: "",
        courseName: "",
        semester: "",
        bookId: "", 
        dueDate: "" 
      });
      clearStudentSelection();
      
      toast.success(`Book issued successfully to ${issueForm.studentName}!`, { duration: 4000 });
      
      await Promise.all([
        loadBooks(),
        loadIssuedBooks(),
        loadLibraryStats(),
      ]);
      
    } catch (err) {
      console.error('Error issuing book:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to issue book');
    } finally {
      setLoading(false);
    }
  };

  const searchIssuedBook = async () => {
    if (!returnForm.bookId && !returnForm.studentId) {
      toast.error("Please enter at least Book ID or Student ID to search.");
      return;
    }

    try {
      setLoading(true);
      const loadingToast = toast.loading('Searching for issued book...');
      
      const issued = await libraryService.searchIssuedBook(
        returnForm.bookId || undefined,
        returnForm.studentId || undefined
      );

      toast.dismiss(loadingToast);

      if (issued) {
        const today = new Date().toISOString().split('T')[0];
        const { dueDate, overdueDays, fine } = calculateFine(issued.issue_date, today);
        
        setReturnForm({
          ...returnForm,
          bookId: issued.book_id,
          studentId: issued.student_id,
          studentName: issued.student_name,
          rollNumber: issued.roll_number,
          class: issued.class,
          bookTitle: issued.book?.title || 'Unknown Book',
          issueDate: issued.issue_date,
          dueDate: dueDate,
          returnDate: new Date().toISOString().split('T')[0],
        });
        
        if (overdueDays > 0) {
          toast.error(`Book found! This book is ${overdueDays} days overdue. Current fine: ₹${fine}`, {
            icon: '⚠️',
            duration: 5000
          });
        } else {
          toast.success("Book found! No overdue charges.");
        }
      } else {
        toast.error("No matching issued book found. Please check the Book ID and Student ID.");
        setReturnForm({
          bookId: returnForm.bookId,
          studentId: returnForm.studentId,
          studentName: "",
          rollNumber: "",
          class: "",
          bookTitle: "",
          issueDate: "",
          dueDate: "",
          returnDate: new Date().toISOString().split('T')[0],
        });
      }
    } catch (err) {
      console.error('Error searching issued book:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to search book');
    } finally {
      setLoading(false);
    }
  };

  const returnBook = async () => {
    if (!returnForm.bookId || !returnForm.studentId || !returnForm.bookTitle) {
      toast.error("Please search for the issued book first before returning.");
      return;
    }

    try {
      setLoading(true);
      const loadingToast = toast.loading(`Processing return for ${returnForm.bookTitle}...`);
      
      const issued = await libraryService.searchIssuedBook(returnForm.bookId, returnForm.studentId);
      if (!issued) {
        toast.dismiss(loadingToast);
        toast.error("No matching issued book found. Please search again.");
        return;
      }

      await libraryService.returnBook(issued.id, {
        return_date: returnForm.returnDate,
      });

      const { overdueDays, fine } = calculateFine(issued.issue_date, returnForm.returnDate);

      toast.dismiss(loadingToast);

      const fineMessage = fine > 0 
        ? `Overdue: ${overdueDays} days | Fine: ₹${fine} (@ ₹${LIBRARY_RULES.finePerDay}/day)` 
        : "No fine. Returned on time.";
      
      toast.success(`Book returned successfully!\n\nStudent: ${returnForm.studentName}\nBook: ${returnForm.bookTitle}\n${fineMessage}`, {
        duration: 6000,
      });
      
      setReturnForm({ 
        bookId: "", 
        studentId: "", 
        studentName: "", 
        rollNumber: "", 
        class: "", 
        bookTitle: "", 
        issueDate: "", 
        dueDate: "", 
        returnDate: new Date().toISOString().split('T')[0] 
      });

      await Promise.all([
        loadBooks(),
        loadIssuedBooks(),
        loadLibraryStats(),
        loadOverdueBooks(),
      ]);
      
    } catch (err) {
      console.error('Error returning book:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to return book');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <LibraryHeader />

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <LibraryStatsCards stats={libraryStats} />

      <LibraryTabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        borrowHistory={borrowHistory}
        overdueBooks={overdueBooks}
        loadBorrowHistory={loadBorrowHistory}
        loadOverdueBooks={loadOverdueBooks}
      />

      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        {activeTab === "dashboard" && (
          <DashboardTab
            books={books}
            dashboardPage={dashboardPage}
            setDashboardPage={setDashboardPage}
            dashboardBooksPerPage={dashboardBooksPerPage}
            onAddBookClick={() => setShowAddBookModal(true)}
          />
        )}

        {activeTab === "details" && (
          <DetailsTab
            books={books}
            totalBooksCount={totalBooksCount}
            bookSearch={bookSearch}
            setBookSearch={setBookSearch}
            bookFilter={bookFilter}
            setBookFilter={setBookFilter}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            booksPerPage={booksPerPage}
            loadBooks={loadBooks}
            setActiveTab={setActiveTab}
            setIssueFormBookId={(bookId) => setIssueForm({ ...issueForm, bookId })}
            setReturnFormBookId={(bookId) => setReturnForm({ ...returnForm, bookId })}
            onIssueBookClick={(bookId) => {
              setIssueForm({ ...issueForm, bookId });
              setShowIssueBookModal(true);
            }}
            onReturnBookClick={(bookId) => {
              setSelectedBookIdForReturn(bookId);
              setShowReturnBookModal(true);
            }}
          />
        )}

        {activeTab === "history" && (
          <HistoryTab borrowHistory={borrowHistory} />
        )}

        {activeTab === "overdue" && (
          <OverdueTab overdueBooks={overdueBooks} />
        )}
      </div>

      {/* Add Book Modal */}
      <AddBookModal
        isOpen={showAddBookModal}
        onClose={() => setShowAddBookModal(false)}
        newBook={newBook}
        setNewBook={setNewBook}
        addBook={addBook}
        loading={loading}
      />

      {/* Issue Book Modal */}
      <IssueBookModal
        isOpen={showIssueBookModal}
        onClose={() => setShowIssueBookModal(false)}
        issueForm={issueForm}
        setIssueForm={setIssueForm}
        books={books}
        issuedBooks={issuedBooks}
        loading={loading}
        issueBook={issueBook}
        LIBRARY_RULES={LIBRARY_RULES}
        studentSearch={studentSearch}
        setStudentSearch={setStudentSearch}
        studentSearchResults={studentSearchResults}
        showStudentDropdown={showStudentDropdown}
        selectedStudent={selectedStudent}
        searchLoading={searchLoading}
        studentSearchRef={studentSearchRef}
        selectStudent={selectStudent}
        clearStudentSelection={clearStudentSelection}
      />

      {/* Return Book Modal */}
      <ReturnBookModal
        isOpen={showReturnBookModal}
        onClose={() => {
          setShowReturnBookModal(false);
          setSelectedBookIdForReturn(null);
        }}
        selectedBookId={selectedBookIdForReturn}
        issuedBooks={issuedBooks}
        returnForm={returnForm}
        setReturnForm={setReturnForm}
        showReturnModal={showReturnModal}
        setShowReturnModal={setShowReturnModal}
        returnBook={returnBook}
        calculateFine={calculateFine}
      />
    </div>
  );
}
