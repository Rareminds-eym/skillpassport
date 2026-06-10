import { useEffect, useRef, useState } from "react";
import toast from 'react-hot-toast';
import { LibraryBook, LibraryBookIssue, libraryService, LibrarySetting, LibraryStats, OverdueBook } from "@/features/college-admin";
import { getLogger } from '@/shared/config/logging';
import { useAuthStore } from '@/shared/model/authStore';
import { apiPost } from '@/shared/api/apiClient';

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
} from "@/features/college-admin/ui/components/library";

export default function LibraryModule() {
  const logger = getLogger('college-admin-library');
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
    maxBooksPerLearner: 3,
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
    learnerId: "",
    learnerName: "",
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

  // Learner search state
  const [learnerSearch, setlearnerSearch] = useState("");
  const [learnerSearchResults, setlearnerSearchResults] = useState<any[]>([]);
  const [showlearnerDropdown, setShowlearnerDropdown] = useState(false);
  const [selectedLearner, setSelectedLearner] = useState<any>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const learnerSearchRef = useRef<HTMLDivElement>(null);

  // Return book form state
  const [returnForm, setReturnForm] = useState({
    bookId: "",
    learnerId: "",
    learnerName: "",
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

  // Click outside handler for learner dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (learnerSearchRef.current && !learnerSearchRef.current.contains(event.target as Node)) {
        setShowlearnerDropdown(false);
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
      if (learnerSearch.length >= 2) {
        searchlearners(learnerSearch);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [learnerSearch]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      const settings = await libraryService.getSettings();
      setLibrarySettings(settings);

      const maxBooks = parseInt(settings.find(s => s.setting_key === 'max_books_per_learner')?.setting_value || '3');
      const loanPeriod = parseInt(settings.find(s => s.setting_key === 'default_loan_period_days')?.setting_value || '14');
      const finePerDay = parseInt(settings.find(s => s.setting_key === 'fine_per_day')?.setting_value || '10');

      setLibraryRules({
        maxBooksPerLearner: maxBooks,
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
      logger.error('Error loading library data:', err as Error);
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
      logger.error('Error loading books:', err as Error);
      toast.error('Failed to load books');
    }
  };

  const loadIssuedBooks = async () => {
    try {
      const { issues } = await libraryService.getBookIssues({ status: 'issued' });
      setIssuedBooks(issues);
    } catch (err) {
      logger.error('Error loading issued books:', err as Error);
      toast.error('Failed to load issued books');
    }
  };

  const loadLibraryStats = async () => {
    try {
      const stats = await libraryService.getLibraryStats();
      setLibraryStats(stats);
    } catch (err) {
      logger.error('Error loading library stats:', err as Error);
      toast.error('Failed to load library statistics');
    }
  };

  const loadOverdueBooks = async () => {
    try {
      const overdue = await libraryService.getOverdueBooks();
      setOverdueBooks(overdue);
    } catch (err) {
      logger.error('Error loading overdue books:', err as Error);
      toast.error('Failed to load overdue books');
    }
  };

  const loadBorrowHistory = async () => {
    try {
      const { issues } = await libraryService.getBookIssues();
      setBorrowHistory(issues);
    } catch (err) {
      logger.error('Error loading borrow history:', err as Error);
      toast.error('Failed to load borrow history');
    }
  };

  // Learner search functionality
  const searchlearners = async (searchTerm: string) => {
    if (searchTerm.length < 2) {
      setlearnerSearchResults([]);
      setShowlearnerDropdown(false);
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

      const storedUser = (useAuthStore.getState().user ? JSON.stringify(useAuthStore.getState().user) : localStorage.getItem("user"));
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
          logger.error('Error parsing stored user:', e as Error);
        }
      }

      if (!schoolId && !collegeId) {
        const user = useAuthStore.getState().user;
        if (user) {
          userId = user.id;
        }
      }

      const res: any = await apiPost('/college-admin/actions', {
        action: 'search-library-learners',
        searchTerm,
        userId,
        email: useAuthStore.getState().user?.email,
        passedSchoolId: schoolId,
        passedCollegeId: collegeId,
        passedUniversityId: universityId
      });

      if (!res.success) {
        logger.error('API query error:', res.error);
        throw new Error(res.error || 'Failed to search learners');
      }

      const learners = res.data;
      setlearnerSearchResults(learners || []);
      setShowlearnerDropdown(learners && learners.length > 0);

    } catch (err) {
      logger.error('Error searching learners:', err as Error);
      setlearnerSearchResults([]);
      setShowlearnerDropdown(false);
    } finally {
      setSearchLoading(false);
    }
  };

  const selectLearner = async (learner: any) => {
    setSelectedLearner(learner);
    setlearnerSearch(learner.name);
    setIssueForm({
      ...issueForm,
      learnerId: learner.id,
      learnerName: learner.name,
      rollNumber: learner.roll_number || "",
      enrollmentNumber: learner.enrollmentNumber || "",
      admissionNumber: learner.admission_number || "",
      grade: learner.grade || "",
      section: learner.section || "",
      courseName: learner.course_name || "",
      semester: learner.semester ? learner.semester.toString() : "",
    });
    setShowlearnerDropdown(false);

    toast.success(`Selected learner: ${learner.name}`, { duration: 2000 });

    try {
      const currentCount = await libraryService.getlearnerIssuedBooksCount(learner.id);
      if (currentCount >= LIBRARY_RULES.maxBooksPerLearner) {
        toast.error(`${learner.name} has already issued ${currentCount} books (maximum: ${LIBRARY_RULES.maxBooksPerLearner}). Cannot issue more books.`);
      } else if (currentCount > 0) {
        toast.success(`${learner.name} currently has ${currentCount} book(s) issued.`, {
          icon: 'ℹ️',
          duration: 3000
        });
      }
    } catch (err) {
      logger.error('Error checking learner issued books:', err as Error);
      toast.error('Failed to check learner\'s current book count');
    }
  };

  const clearlearnerSelection = () => {
    setSelectedLearner(null);
    setlearnerSearch("");
    setIssueForm({
      ...issueForm,
      learnerId: "",
      learnerName: "",
      rollNumber: "",
      enrollmentNumber: "",
      admissionNumber: "",
      grade: "",
      section: "",
      courseName: "",
      semester: "",
    });
    setlearnerSearchResults([]);
    setShowlearnerDropdown(false);
    toast.success('Learner selection cleared', {
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
      logger.error('Error calculating fine:', err as Error);
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
      logger.error('Error adding book:', err as Error);
      toast.error(err instanceof Error ? err.message : 'Failed to add book');
    } finally {
      setLoading(false);
    }
  };

  const issueBook = async () => {
    if (!issueForm.learnerId || !issueForm.learnerName || !issueForm.bookId) {
      toast.error("Please select a learner and book.");
      return;
    }

    try {
      setLoading(true);
      const loadingToast = toast.loading(`Issuing book to ${issueForm.learnerName}...`);

      const learnerIdentifier = issueForm.rollNumber || issueForm.enrollmentNumber || issueForm.admissionNumber || issueForm.learnerId;
      const classInfo = issueForm.grade && issueForm.section ? `${issueForm.grade}-${issueForm.section}` : issueForm.grade || "";
      const academicYear = issueForm.semester ? `Semester ${issueForm.semester}` : new Date().getFullYear().toString();

      await libraryService.issueBook({
        book_id: issueForm.bookId,
        learner_id: issueForm.learnerId,
        learner_name: issueForm.learnerName,
        roll_number: learnerIdentifier,
        class: classInfo,
        academic_year: academicYear,
      });

      toast.dismiss(loadingToast);

      setIssueForm({
        learnerId: "",
        learnerName: "",
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
      clearlearnerSelection();

      toast.success(`Book issued successfully to ${issueForm.learnerName}!`, { duration: 4000 });

      await Promise.all([
        loadBooks(),
        loadIssuedBooks(),
        loadLibraryStats(),
      ]);

    } catch (err) {
      logger.error('Error issuing book:', err as Error);
      toast.error(err instanceof Error ? err.message : 'Failed to issue book');
    } finally {
      setLoading(false);
    }
  };

  const searchIssuedBook = async () => {
    if (!returnForm.bookId && !returnForm.learnerId) {
      toast.error("Please enter at least Book ID or Learner ID to search.");
      return;
    }

    try {
      setLoading(true);
      const loadingToast = toast.loading('Searching for issued book...');

      const issued = await libraryService.searchIssuedBook(
        returnForm.bookId || undefined,
        returnForm.learnerId || undefined
      );

      toast.dismiss(loadingToast);

      if (issued) {
        const today = new Date().toISOString().split('T')[0];
        const { dueDate, overdueDays, fine } = calculateFine(issued.issue_date, today);

        setReturnForm({
          ...returnForm,
          bookId: issued.book_id,
          learnerId: issued.learner_id,
          learnerName: issued.learner_name,
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
        toast.error("No matching issued book found. Please check the Book ID and Learner ID.");
        setReturnForm({
          bookId: returnForm.bookId,
          learnerId: returnForm.learnerId,
          learnerName: "",
          rollNumber: "",
          class: "",
          bookTitle: "",
          issueDate: "",
          dueDate: "",
          returnDate: new Date().toISOString().split('T')[0],
        });
      }
    } catch (err) {
      logger.error('Error searching issued book:', err as Error);
      toast.error(err instanceof Error ? err.message : 'Failed to search book');
    } finally {
      setLoading(false);
    }
  };

  const returnBook = async () => {
    if (!returnForm.bookId || !returnForm.learnerId || !returnForm.bookTitle) {
      toast.error("Please search for the issued book first before returning.");
      return;
    }

    try {
      setLoading(true);
      const loadingToast = toast.loading(`Processing return for ${returnForm.bookTitle}...`);

      const issued = await libraryService.searchIssuedBook(returnForm.bookId, returnForm.learnerId);
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

      toast.success(`Book returned successfully!\n\nLearner: ${returnForm.learnerName}\nBook: ${returnForm.bookTitle}\n${fineMessage}`, {
        duration: 6000,
      });

      setReturnForm({
        bookId: "",
        learnerId: "",
        learnerName: "",
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
      logger.error('Error returning book:', err as Error);
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
        learnerSearch={learnerSearch}
        setlearnerSearch={setlearnerSearch}
        learnerSearchResults={learnerSearchResults}
        showlearnerDropdown={showlearnerDropdown}
        selectedLearner={selectedLearner}
        searchLoading={searchLoading}
        learnerSearchRef={learnerSearchRef}
        selectLearner={selectLearner}
        clearlearnerSelection={clearlearnerSelection}
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
