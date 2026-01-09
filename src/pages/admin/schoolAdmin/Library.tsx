import {
    BookOpenIcon,
    CheckCircleIcon,
    MagnifyingGlassIcon,
    PlusIcon,
    UsersIcon,
    XMarkIcon
} from '@heroicons/react/24/outline';
import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useStudents } from '../../../hooks/useAdminStudents';
import { supabase } from '../../../lib/supabaseClient';

interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  total_copies: number;
  available_copies: number;
  status: string;
  category?: string;
  publisher?: string;
  publication_year?: number;
  description?: string;
  location_shelf?: string;
  created_at?: string;
  updated_at?: string;
}

interface BookIssue {
  id: string;
  book_id: string;
  student_id: string;
  student_name: string;
  roll_number: string;
  class: string;
  issue_date: string;
  due_date: string;
  return_date?: string;
  status: string;
  fine_amount: number;
  book?: Book;
  // Calculated fields for overdue books
  days_overdue?: number;
  calculated_fine?: number;
}

interface LibraryStats {
  total_books: number;
  total_copies: number;
  available_copies: number;
  currently_issued: number;
  overdue_count: number;
  total_pending_fines: number;
}

export default function LibraryModule() {
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [books, setBooks] = useState<Book[]>([]);
  const [bookIssues, setBookIssues] = useState<BookIssue[]>([]);
  const [libraryStats, setLibraryStats] = useState<LibraryStats>({
    total_books: 0,
    total_copies: 0,
    available_copies: 0,
    currently_issued: 0,
    overdue_count: 0,
    total_pending_fines: 0
  });
  const [loading, setLoading] = useState(false);
  const [schoolId, setSchoolId] = useState<string | null>(null);

  // Add Book Form State
  const [newBook, setNewBook] = useState({
    title: '',
    author: '',
    isbn: '',
    total_copies: 1,
    category: '',
    publisher: '',
    publication_year: new Date().getFullYear(),
    description: '',
    location_shelf: ''
  });

  // Student Search State
  const [studentSearch, setStudentSearch] = useState("");
  const [debouncedStudentSearch, setDebouncedStudentSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);
  const [selectedBookForIssue, setSelectedBookForIssue] = useState<Book | null>(null);
  const studentSearchRef = useRef<HTMLDivElement>(null);

  // Return Book State
  const [bookIdSearch, setBookIdSearch] = useState("");
  const [studentIdSearch, setStudentIdSearch] = useState("");
  const [searchAllBooks, setSearchAllBooks] = useState("");

  // Details Tab State
  const [detailsSearchQuery, setDetailsSearchQuery] = useState("");
  const [detailsStatusFilter, setDetailsStatusFilter] = useState("all");
  const [detailsCategoryFilter, setDetailsCategoryFilter] = useState("all");
  const [showEditBookModal, setShowEditBookModal] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [categories, setCategories] = useState<any[]>([]);

  // History Tab State
  const [historyData, setHistoryData] = useState<BookIssue[]>([]);
  const [historySearchQuery, setHistorySearchQuery] = useState("");
  const [historyStatusFilter, setHistoryStatusFilter] = useState("all");
  const [historyDateFilter, setHistoryDateFilter] = useState("all");
  const [historyLoading, setHistoryLoading] = useState(false);

  // Overdue Tab State
  const [overdueBooks, setOverdueBooks] = useState<BookIssue[]>([]);
  const [overdueSearchQuery, setOverdueSearchQuery] = useState("");
  const [overdueLoading, setOverdueLoading] = useState(false);

  // Use the same hook as admissions page for fetching students
  const { students: studentSearchResults, loading: searchLoading } = useStudents({
    searchTerm: debouncedStudentSearch,
    page: 1,
    pageSize: 10
  });

  // Get current school ID from organizations table
  useEffect(() => {
    const getCurrentSchoolId = async () => {
      try {
        // First try localStorage
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          if (userData.schoolId) {
            setSchoolId(userData.schoolId);
            return;
          }
        }

        // Then try Supabase auth
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Check school_educators table first
          const { data: educator } = await supabase
            .from('school_educators')
            .select('school_id')
            .eq('user_id', user.id)
            .single();
          
          if (educator?.school_id) {
            setSchoolId(educator.school_id);
          } else {
            // Check organizations table for school admin
            const { data: org } = await supabase
              .from('organizations')
              .select('id')
              .eq('organization_type', 'school')
              .or(`admin_id.eq.${user.id},email.eq.${user.email}`)
              .maybeSingle();
            
            if (org?.id) {
              setSchoolId(org.id);
            }
          }
        }
      } catch (error) {
        console.error('Error getting school ID:', error);
      }
    };

    getCurrentSchoolId();
  }, []);

  // Fetch library data
  useEffect(() => {
    if (schoolId) {
      fetchLibraryData();
      fetchCategories();
    }
  }, [schoolId]);

  const fetchLibraryData = async () => {
    if (!schoolId) return;
    
    setLoading(true);
    try {
      // Fetch books
      const { data: booksData, error: booksError } = await supabase
        .from('library_books_school')
        .select('*')
        .eq('school_id', schoolId)
        .order('created_at', { ascending: false });

      if (booksError) throw booksError;
      setBooks(booksData || []);

      // Fetch current issues
      const { data: issuesData, error: issuesError } = await supabase
        .from('library_book_issues_school')
        .select(`
          *,
          book:library_books_school(*)
        `)
        .eq('school_id', schoolId)
        .eq('status', 'issued')
        .order('issue_date', { ascending: false });

      if (issuesError) throw issuesError;
      setBookIssues(issuesData || []);

      // Fetch library stats
      const { data: statsData, error: statsError } = await supabase
        .from('library_stats_school')
        .select('*')
        .eq('school_id', schoolId)
        .single();

      if (statsError) {
        console.warn('Stats view not available, calculating manually');
        // Calculate stats manually
        const totalBooks = booksData?.length || 0;
        const totalCopies = booksData?.reduce((sum, book) => sum + book.total_copies, 0) || 0;
        const availableCopies = booksData?.reduce((sum, book) => sum + book.available_copies, 0) || 0;
        const currentlyIssued = issuesData?.length || 0;
        
        setLibraryStats({
          total_books: totalBooks,
          total_copies: totalCopies,
          available_copies: availableCopies,
          currently_issued: currentlyIssued,
          overdue_count: 0,
          total_pending_fines: 0
        });
      } else {
        setLibraryStats(statsData);
      }

    } catch (error) {
      console.error('Error fetching library data:', error);
      toast.error('Failed to load library data');
    } finally {
      setLoading(false);
    }
  };

  // Fetch categories
  const fetchCategories = async () => {
    if (!schoolId) return;
    
    try {
      const { data: categoriesData, error } = await supabase
        .from('library_categories_school')
        .select('*')
        .eq('school_id', schoolId)
        .order('name');

      if (error) throw error;
      setCategories(categoriesData || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  // Edit book
  const handleEditBook = async () => {
    if (!schoolId || !editingBook || !editingBook.title || !editingBook.author || !editingBook.isbn) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase
        .from('library_books_school')
        .update({
          title: editingBook.title,
          author: editingBook.author,
          isbn: editingBook.isbn,
          total_copies: editingBook.total_copies,
          category: editingBook.category || null,
          publisher: editingBook.publisher || null,
          publication_year: editingBook.publication_year || null,
          description: editingBook.description || null,
          location_shelf: editingBook.location_shelf || null
        })
        .eq('id', editingBook.id)
        .eq('school_id', schoolId);

      if (error) throw error;

      toast.success('Book updated successfully!');
      setShowEditBookModal(false);
      setEditingBook(null);
      fetchLibraryData(); // Refresh data
    } catch (error: any) {
      console.error('Error updating book:', error);
      if (error.code === '23505') {
        toast.error('A book with this ISBN already exists');
      } else {
        toast.error('Failed to update book');
      }
    } finally {
      setLoading(false);
    }
  };

  // Delete book
  const handleDeleteBook = async (bookId: string) => {
    if (!schoolId) return;

    if (!confirm('Are you sure you want to delete this book? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase
        .from('library_books_school')
        .delete()
        .eq('id', bookId)
        .eq('school_id', schoolId);

      if (error) throw error;

      toast.success('Book deleted successfully!');
      fetchLibraryData(); // Refresh data
    } catch (error: any) {
      console.error('Error deleting book:', error);
      if (error.code === '23503') {
        toast.error('Cannot delete book: It has been issued to students');
      } else {
        toast.error('Failed to delete book');
      }
    } finally {
      setLoading(false);
    }
  };

  // Filter books for details tab
  const filteredBooksForDetails = books.filter(book => {
    const matchesSearch = !detailsSearchQuery || 
      book.title.toLowerCase().includes(detailsSearchQuery.toLowerCase()) ||
      book.author.toLowerCase().includes(detailsSearchQuery.toLowerCase()) ||
      book.isbn.toLowerCase().includes(detailsSearchQuery.toLowerCase());
    
    const matchesStatus = detailsStatusFilter === 'all' || book.status === detailsStatusFilter;
    
    const matchesCategory = detailsCategoryFilter === 'all' || 
      (book.category && book.category.toLowerCase() === detailsCategoryFilter.toLowerCase());
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Fetch history data
  const fetchHistoryData = async () => {
    if (!schoolId) return;
    
    setHistoryLoading(true);
    try {
      const { data: historyData, error } = await supabase
        .from('library_book_issues_school')
        .select(`
          *,
          book:library_books_school(*)
        `)
        .eq('school_id', schoolId)
        .order('created_at', { ascending: false })
        .limit(100); // Limit to last 100 records for performance

      if (error) throw error;
      setHistoryData(historyData || []);
    } catch (error) {
      console.error('Error fetching history data:', error);
      toast.error('Failed to load history data');
    } finally {
      setHistoryLoading(false);
    }
  };

  // Fetch overdue books
  const fetchOverdueBooks = async () => {
    if (!schoolId) return;
    
    setOverdueLoading(true);
    try {
      // Fetch overdue books (issued books past due date)
      const { data: overdueData, error } = await supabase
        .from('library_book_issues_school')
        .select(`
          *,
          book:library_books_school(*)
        `)
        .eq('school_id', schoolId)
        .eq('status', 'issued')
        .lt('due_date', new Date().toISOString().split('T')[0])
        .order('due_date', { ascending: true });

      if (error) throw error;
      
      // Calculate days overdue and fine for each book
      const overdueWithFines = (overdueData || []).map(issue => ({
        ...issue,
        days_overdue: Math.floor((new Date().getTime() - new Date(issue.due_date).getTime()) / (1000 * 60 * 60 * 24)),
        calculated_fine: Math.floor((new Date().getTime() - new Date(issue.due_date).getTime()) / (1000 * 60 * 60 * 24)) * 10 // ₹10 per day
      }));

      setOverdueBooks(overdueWithFines);
    } catch (error) {
      console.error('Error fetching overdue books:', error);
      toast.error('Failed to load overdue books');
    } finally {
      setOverdueLoading(false);
    }
  };

  // Filter history data
  const filteredHistoryData = historyData.filter(issue => {
    const matchesSearch = !historySearchQuery || 
      issue.student_name.toLowerCase().includes(historySearchQuery.toLowerCase()) ||
      issue.roll_number.toLowerCase().includes(historySearchQuery.toLowerCase()) ||
      issue.book?.title.toLowerCase().includes(historySearchQuery.toLowerCase()) ||
      issue.book?.author.toLowerCase().includes(historySearchQuery.toLowerCase());
    
    const matchesStatus = historyStatusFilter === 'all' || issue.status === historyStatusFilter;
    
    let matchesDate = true;
    if (historyDateFilter !== 'all') {
      const issueDate = new Date(issue.issue_date);
      const now = new Date();
      
      switch (historyDateFilter) {
        case 'today':
          matchesDate = issueDate.toDateString() === now.toDateString();
          break;
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          matchesDate = issueDate >= weekAgo;
          break;
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          matchesDate = issueDate >= monthAgo;
          break;
      }
    }
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  // Filter overdue data
  const filteredOverdueBooks = overdueBooks.filter(issue => {
    const matchesSearch = !overdueSearchQuery || 
      issue.student_name.toLowerCase().includes(overdueSearchQuery.toLowerCase()) ||
      issue.roll_number.toLowerCase().includes(overdueSearchQuery.toLowerCase()) ||
      issue.book?.title.toLowerCase().includes(overdueSearchQuery.toLowerCase()) ||
      issue.book?.author.toLowerCase().includes(overdueSearchQuery.toLowerCase());
    
    return matchesSearch;
  });

  // Mark book as overdue and calculate fine
  const handleMarkOverdue = async (issueId: string) => {
    try {
      setLoading(true);
      
      const issue = overdueBooks.find(b => b.id === issueId);
      if (!issue) return;

      const { error } = await supabase
        .from('library_book_issues_school')
        .update({
          status: 'overdue',
          fine_amount: issue.calculated_fine
        })
        .eq('id', issueId)
        .eq('school_id', schoolId);

      if (error) throw error;

      toast.success('Book marked as overdue with fine calculated');
      fetchOverdueBooks(); // Refresh overdue data
      fetchLibraryData(); // Refresh main data
    } catch (error: any) {
      console.error('Error marking book as overdue:', error);
      toast.error('Failed to mark book as overdue');
    } finally {
      setLoading(false);
    }
  };

  // Send overdue reminder (placeholder for future implementation)
  const handleSendReminder = async (issueId: string) => {
    const issue = overdueBooks.find(b => b.id === issueId);
    if (!issue) return;

    // This would integrate with email/SMS service
    toast.success(`Reminder sent to ${issue.student_name}`);
  };

  // Add new book
  const handleAddBook = async () => {
    if (!schoolId || !newBook.title || !newBook.author || !newBook.isbn) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase
        .from('library_books_school')
        .insert([{
          school_id: schoolId,
          title: newBook.title,
          author: newBook.author,
          isbn: newBook.isbn,
          total_copies: newBook.total_copies,
          available_copies: newBook.total_copies,
          category: newBook.category || null,
          publisher: newBook.publisher || null,
          publication_year: newBook.publication_year || null,
          description: newBook.description || null,
          location_shelf: newBook.location_shelf || null,
          status: 'available'
        }])
        .select()
        .single();

      if (error) throw error;

      toast.success('Book added successfully!');
      setNewBook({
        title: '',
        author: '',
        isbn: '',
        total_copies: 1,
        category: '',
        publisher: '',
        publication_year: new Date().getFullYear(),
        description: '',
        location_shelf: ''
      });
      fetchLibraryData(); // Refresh data
    } catch (error: any) {
      console.error('Error adding book:', error);
      if (error.code === '23505') {
        toast.error('A book with this ISBN already exists');
      } else {
        toast.error('Failed to add book');
      }
    } finally {
      setLoading(false);
    }
  };

  // Issue book to student
  const handleIssueBook = async () => {
    if (!schoolId || !selectedStudent || !selectedBookForIssue) {
      toast.error('Please select both a student and a book');
      return;
    }

    if (selectedBookForIssue.available_copies <= 0) {
      toast.error('No copies available for this book');
      return;
    }

    try {
      setLoading(true);
      
      // Calculate due date (14 days from now by default)
      const issueDate = new Date();
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 14);

      const { error } = await supabase
        .from('library_book_issues_school')
        .insert([{
          school_id: schoolId,
          book_id: selectedBookForIssue.id,
          student_id: selectedStudent.id,
          student_name: selectedStudent.name,
          roll_number: selectedStudent.roll_number || '',
          class: selectedStudent.grade || selectedStudent.class || '',
          academic_year: new Date().getFullYear().toString(),
          issue_date: issueDate.toISOString().split('T')[0],
          due_date: dueDate.toISOString().split('T')[0],
          status: 'issued',
          issued_by: 'Admin' // You can get this from current user
        }])
        .select()
        .single();

      if (error) throw error;

      toast.success(`Book "${selectedBookForIssue.title}" issued to ${selectedStudent.name}`);
      
      // Clear selections
      setSelectedStudent(null);
      setSelectedBookForIssue(null);
      setStudentSearch('');
      setDebouncedStudentSearch('');
      
      fetchLibraryData(); // Refresh data
    } catch (error: any) {
      console.error('Error issuing book:', error);
      toast.error('Failed to issue book');
    } finally {
      setLoading(false);
    }
  };

  // Return book
  const handleReturnBook = async (issueId: string) => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('library_book_issues_school')
        .update({
          return_date: new Date().toISOString().split('T')[0],
          status: 'returned',
          returned_by: 'Admin'
        })
        .eq('id', issueId)
        .eq('school_id', schoolId)
        .select()
        .single();

      if (error) throw error;

      toast.success('Book returned successfully');
      fetchLibraryData(); // Refresh data
    } catch (error: any) {
      console.error('Error returning book:', error);
      toast.error('Failed to return book');
    } finally {
      setLoading(false);
    }
  };

  // Debounce student search
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      setDebouncedStudentSearch(studentSearch);
    }, 300);

    return () => clearTimeout(delayedSearch);
  }, [studentSearch]);

  // Show/hide dropdown based on search and results
  useEffect(() => {
    if (studentSearch.length >= 2 && studentSearchResults.length > 0) {
      setShowStudentDropdown(true);
    } else {
      setShowStudentDropdown(false);
    }
  }, [studentSearch, studentSearchResults]);

  // Select student and auto-fill
  const selectStudent = (student: any) => {
    setSelectedStudent(student);
    setStudentSearch(student.name);
    setShowStudentDropdown(false);
  };

  // Clear student selection
  const clearStudentSelection = () => {
    setSelectedStudent(null);
    setStudentSearch('');
    setDebouncedStudentSearch('');
  };

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: any) => {
      if (studentSearchRef.current && !studentSearchRef.current.contains(event.target)) {
        setShowStudentDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load data when switching to History or Overdue tabs
  useEffect(() => {
    if (activeTab === 'History' && historyData.length === 0) {
      fetchHistoryData();
    } else if (activeTab === 'Overdue' && overdueBooks.length === 0) {
      fetchOverdueBooks();
    }
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-2xl font-semibold text-gray-900">Library Module</h1>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200 px-6">
        <div className="flex space-x-1">
          {['Dashboard', 'Add', 'Details', 'Issue', 'Return', 'History', 'Overdue'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-sm font-medium rounded-t-lg transition-colors ${
                activeTab === tab
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Dashboard Tab */}
        {activeTab === "Dashboard" && (
          <div>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">Total Books</h3>
                <p className="text-3xl font-bold text-blue-900">{libraryStats.total_books}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-6 border border-green-200">
                <h3 className="text-lg font-semibold text-green-900 mb-2">Available</h3>
                <p className="text-3xl font-bold text-green-900">{libraryStats.available_copies}</p>
              </div>
              <div className="bg-yellow-50 rounded-lg p-6 border border-yellow-200">
                <h3 className="text-lg font-semibold text-yellow-900 mb-2">Currently Issued</h3>
                <p className="text-3xl font-bold text-yellow-900">{libraryStats.currently_issued}</p>
              </div>
            </div>

            {/* Books Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <p className="text-sm text-gray-600">Showing {books.length} books</p>
                <button
                  onClick={() => setActiveTab('Add')}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add Book
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Author</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ISBN</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Copies</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Available</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {loading ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                          Loading books...
                        </td>
                      </tr>
                    ) : books.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                          No books found. Add your first book to get started.
                        </td>
                      </tr>
                    ) : (
                      books.map((book) => (
                        <tr key={book.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{book.title}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{book.author}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{book.isbn}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{book.total_copies}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">{book.available_copies}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              book.status === 'available' ? 'bg-green-100 text-green-800' :
                              book.status === 'all_issued' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {book.status === 'available' ? 'Available' :
                               book.status === 'all_issued' ? 'All Issued' : 'Maintenance'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => {
                                setSelectedBookForIssue(book);
                                setActiveTab('Issue');
                              }}
                              disabled={book.available_copies <= 0}
                              className="text-blue-600 hover:text-blue-900 disabled:text-gray-400 mr-3"
                            >
                              Issue
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Add Tab */}
        {activeTab === "Add" && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Add New Book</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter book title"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={newBook.title}
                    onChange={(e) => setNewBook({ ...newBook, title: e.target.value })}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Author <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter author name"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={newBook.author}
                    onChange={(e) => setNewBook({ ...newBook, author: e.target.value })}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ISBN <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter ISBN number"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={newBook.isbn}
                    onChange={(e) => setNewBook({ ...newBook, isbn: e.target.value })}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total Copies <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="1"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={newBook.total_copies}
                    onChange={(e) => setNewBook({ ...newBook, total_copies: parseInt(e.target.value) || 1 })}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Publication Year</label>
                  <input
                    type="number"
                    min="1900"
                    max={new Date().getFullYear()}
                    placeholder="2026"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={newBook.publication_year}
                    onChange={(e) => setNewBook({ ...newBook, publication_year: parseInt(e.target.value) || new Date().getFullYear() })}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <input
                    type="text"
                    placeholder="e.g., Academic, Fiction"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={newBook.category}
                    onChange={(e) => setNewBook({ ...newBook, category: e.target.value })}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Publisher</label>
                  <input
                    type="text"
                    placeholder="Enter publisher name"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={newBook.publisher}
                    onChange={(e) => setNewBook({ ...newBook, publisher: e.target.value })}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Shelf Location</label>
                  <input
                    type="text"
                    placeholder="e.g., A1-B2, Section 3"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={newBook.location_shelf}
                    onChange={(e) => setNewBook({ ...newBook, location_shelf: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  rows={3}
                  placeholder="Brief description of the book"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={newBook.description}
                  onChange={(e) => setNewBook({ ...newBook, description: e.target.value })}
                />
              </div>
              
              <div className="mt-8 flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    setNewBook({
                      title: '',
                      author: '',
                      isbn: '',
                      total_copies: 1,
                      category: '',
                      publisher: '',
                      publication_year: new Date().getFullYear(),
                      description: '',
                      location_shelf: ''
                    });
                  }}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Clear
                </button>
                <button
                  onClick={handleAddBook}
                  disabled={loading || !newBook.title || !newBook.author || !newBook.isbn}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Adding...' : 'Add Book'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Details Tab */}
        {activeTab === "Details" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Book Details</h2>
              <div className="text-sm text-gray-600">
                Showing {filteredBooksForDetails.length} of {books.length} books
              </div>
            </div>

            {/* Search and Filter Controls */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Search Books</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search by title, author, or ISBN..."
                      className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={detailsSearchQuery}
                      onChange={(e) => setDetailsSearchQuery(e.target.value)}
                    />
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-4" />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Status</label>
                  <select
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={detailsStatusFilter}
                    onChange={(e) => setDetailsStatusFilter(e.target.value)}
                  >
                    <option value="all">All Books</option>
                    <option value="available">Available</option>
                    <option value="all_issued">All Issued</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Category</label>
                  <select
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={detailsCategoryFilter}
                    onChange={(e) => setDetailsCategoryFilter(e.target.value)}
                  >
                    <option value="all">All Categories</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.name}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Books Grid */}
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-500 mt-2">Loading books...</p>
              </div>
            ) : filteredBooksForDetails.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                <BookOpenIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No books found</h3>
                <p className="text-gray-600">
                  {detailsSearchQuery || detailsStatusFilter !== 'all' || detailsCategoryFilter !== 'all'
                    ? 'Try adjusting your search or filters'
                    : 'Add your first book to get started'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredBooksForDetails.map((book) => (
                  <div key={book.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                    {/* Book Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">{book.title}</h3>
                        <p className="text-sm text-gray-600">by {book.author}</p>
                      </div>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        book.status === 'available' ? 'bg-green-100 text-green-800' :
                        book.status === 'all_issued' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {book.status === 'available' ? 'Available' :
                         book.status === 'all_issued' ? 'All Issued' : 'Maintenance'}
                      </span>
                    </div>

                    {/* Book Details */}
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">ISBN:</span>
                        <span className="font-medium text-gray-900">{book.isbn}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Total Copies:</span>
                        <span className="font-medium text-gray-900">{book.total_copies}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Available:</span>
                        <span className={`font-medium ${book.available_copies > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {book.available_copies}
                        </span>
                      </div>
                      {book.category && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Category:</span>
                          <span className="font-medium text-gray-900">{book.category}</span>
                        </div>
                      )}
                      {book.publisher && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Publisher:</span>
                          <span className="font-medium text-gray-900">{book.publisher}</span>
                        </div>
                      )}
                      {book.publication_year && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Year:</span>
                          <span className="font-medium text-gray-900">{book.publication_year}</span>
                        </div>
                      )}
                      {book.location_shelf && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Location:</span>
                          <span className="font-medium text-gray-900">{book.location_shelf}</span>
                        </div>
                      )}
                    </div>

                    {/* Description */}
                    {book.description && (
                      <div className="mb-4">
                        <p className="text-sm text-gray-600 line-clamp-2">{book.description}</p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setSelectedBookForIssue(book);
                          setActiveTab('Issue');
                        }}
                        disabled={book.available_copies <= 0}
                        className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                      >
                        Issue Book
                      </button>
                      <button
                        onClick={() => {
                          setEditingBook(book);
                          setShowEditBookModal(true);
                        }}
                        className="px-3 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteBook(book.id)}
                        disabled={loading}
                        className="px-3 py-2 border border-red-300 text-red-700 text-sm font-medium rounded-lg hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Edit Book Modal */}
        {showEditBookModal && editingBook && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Edit Book</h3>
                  <button
                    onClick={() => {
                      setShowEditBookModal(false);
                      setEditingBook(null);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={editingBook.title}
                      onChange={(e) => setEditingBook({ ...editingBook, title: e.target.value })}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Author <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={editingBook.author}
                      onChange={(e) => setEditingBook({ ...editingBook, author: e.target.value })}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ISBN <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={editingBook.isbn}
                      onChange={(e) => setEditingBook({ ...editingBook, isbn: e.target.value })}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Total Copies <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={editingBook.total_copies}
                      onChange={(e) => setEditingBook({ ...editingBook, total_copies: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Publication Year</label>
                    <input
                      type="number"
                      min="1900"
                      max={new Date().getFullYear()}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={editingBook.publication_year || undefined}
                      onChange={(e) => setEditingBook({ ...editingBook, publication_year: parseInt(e.target.value) || undefined })}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                    <select
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={editingBook.category || ''}
                      onChange={(e) => setEditingBook({ ...editingBook, category: e.target.value })}
                    >
                      <option value="">Select Category</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.name}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Publisher</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={editingBook.publisher || ''}
                      onChange={(e) => setEditingBook({ ...editingBook, publisher: e.target.value })}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Shelf Location</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={editingBook.location_shelf || ''}
                      onChange={(e) => setEditingBook({ ...editingBook, location_shelf: e.target.value })}
                    />
                  </div>
                </div>
                
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={editingBook.description || ''}
                    onChange={(e) => setEditingBook({ ...editingBook, description: e.target.value })}
                  />
                </div>
                
                <div className="mt-8 flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditBookModal(false);
                      setEditingBook(null);
                    }}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleEditBook}
                    disabled={loading || !editingBook.title || !editingBook.author || !editingBook.isbn}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? 'Updating...' : 'Update Book'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* History Tab */}
        {activeTab === "History" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Issue History</h2>
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-600">
                  Showing {filteredHistoryData.length} of {historyData.length} records
                </div>
                <button
                  onClick={fetchHistoryData}
                  disabled={historyLoading}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                >
                  {historyLoading ? 'Loading...' : 'Refresh'}
                </button>
              </div>
            </div>

            {/* Search and Filter Controls */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Search History</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search by student name, roll number, or book..."
                      className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={historySearchQuery}
                      onChange={(e) => setHistorySearchQuery(e.target.value)}
                    />
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-4" />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Status</label>
                  <select
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={historyStatusFilter}
                    onChange={(e) => setHistoryStatusFilter(e.target.value)}
                  >
                    <option value="all">All Status</option>
                    <option value="issued">Currently Issued</option>
                    <option value="returned">Returned</option>
                    <option value="overdue">Overdue</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Date</label>
                  <select
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={historyDateFilter}
                    onChange={(e) => setHistoryDateFilter(e.target.value)}
                  >
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="week">Last Week</option>
                    <option value="month">Last Month</option>
                  </select>
                </div>
              </div>
            </div>

            {/* History Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Book Issue History</h3>
              </div>

              {historyLoading ? (
                <div className="p-6 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-500 mt-2">Loading history...</p>
                </div>
              ) : filteredHistoryData.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  {historyData.length === 0 ? (
                    <div>
                      <BookOpenIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p>No history records found</p>
                      <button
                        onClick={fetchHistoryData}
                        className="mt-2 text-blue-600 hover:text-blue-800"
                      >
                        Load History
                      </button>
                    </div>
                  ) : (
                    <p>No records match your current filters</p>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Book</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issue Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Return Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fine</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredHistoryData.map((issue) => (
                        <tr key={issue.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{issue.book?.title || 'Unknown Book'}</div>
                              <div className="text-sm text-gray-500">{issue.book?.author}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{issue.student_name}</div>
                              <div className="text-sm text-gray-500">Roll: {issue.roll_number}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(issue.issue_date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(issue.due_date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {issue.return_date ? new Date(issue.return_date).toLocaleDateString() : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              issue.status === 'issued' ? 'bg-blue-100 text-blue-800' :
                              issue.status === 'returned' ? 'bg-green-100 text-green-800' :
                              issue.status === 'overdue' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {issue.status === 'issued' ? 'Issued' :
                               issue.status === 'returned' ? 'Returned' :
                               issue.status === 'overdue' ? 'Overdue' : issue.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {issue.fine_amount > 0 ? `₹${issue.fine_amount}` : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            {issue.status === 'issued' && (
                              <button
                                onClick={() => handleReturnBook(issue.id)}
                                disabled={loading}
                                className="text-green-600 hover:text-green-900 disabled:text-gray-400"
                              >
                                Return
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Overdue Tab */}
        {activeTab === "Overdue" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Overdue Books</h2>
              <div className="flex items-center space-x-4">
                <div className="text-sm text-red-600 font-medium">
                  {filteredOverdueBooks.length} overdue books
                </div>
                <button
                  onClick={fetchOverdueBooks}
                  disabled={overdueLoading}
                  className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:bg-gray-400 transition-colors"
                >
                  {overdueLoading ? 'Loading...' : 'Refresh'}
                </button>
              </div>
            </div>

            {/* Search Control */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <div className="max-w-md">
                <label className="block text-sm font-medium text-gray-700 mb-2">Search Overdue Books</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search by student name, roll number, or book..."
                    className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    value={overdueSearchQuery}
                    onChange={(e) => setOverdueSearchQuery(e.target.value)}
                  />
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-4" />
                </div>
              </div>
            </div>

            {/* Overdue Books */}
            {overdueLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
                <p className="text-gray-500 mt-2">Loading overdue books...</p>
              </div>
            ) : filteredOverdueBooks.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                <CheckCircleIcon className="h-12 w-12 text-green-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Overdue Books!</h3>
                <p className="text-gray-600">
                  {overdueBooks.length === 0 ? 'All books are returned on time.' : 'No books match your search.'}
                </p>
                {overdueBooks.length === 0 && (
                  <button
                    onClick={fetchOverdueBooks}
                    className="mt-4 text-blue-600 hover:text-blue-800"
                  >
                    Check for Overdue Books
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredOverdueBooks.map((issue) => (
                  <div key={issue.id} className="bg-white rounded-lg shadow-sm border border-red-200 p-6">
                    {/* Overdue Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">{issue.book?.title || 'Unknown Book'}</h3>
                        <p className="text-sm text-gray-600">by {issue.book?.author}</p>
                      </div>
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                        {issue.days_overdue} days overdue
                      </span>
                    </div>

                    {/* Student Details */}
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Student:</span>
                        <span className="font-medium text-gray-900">{issue.student_name}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Roll Number:</span>
                        <span className="font-medium text-gray-900">{issue.roll_number}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Class:</span>
                        <span className="font-medium text-gray-900">{issue.class}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Issue Date:</span>
                        <span className="font-medium text-gray-900">{new Date(issue.issue_date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Due Date:</span>
                        <span className="font-medium text-red-600">{new Date(issue.due_date).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Fine Information */}
                    <div className="bg-red-50 rounded-lg p-3 mb-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-red-800">Calculated Fine:</span>
                        <span className="text-lg font-bold text-red-800">₹{issue.calculated_fine}</span>
                      </div>
                      <p className="text-xs text-red-600 mt-1">₹10 per day × {issue.days_overdue} days</p>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-2">
                      <button
                        onClick={() => handleReturnBook(issue.id)}
                        disabled={loading}
                        className="w-full px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                      >
                        {loading ? 'Processing...' : 'Return Book'}
                      </button>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleMarkOverdue(issue.id)}
                          disabled={loading}
                          className="px-3 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                        >
                          Mark Overdue
                        </button>
                        <button
                          onClick={() => handleSendReminder(issue.id)}
                          className="px-3 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          Send Reminder
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Issue Tab */}
        {activeTab === "Issue" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Issue Book</h2>
              <div className="bg-green-100 p-2 rounded-lg">
                <CheckCircleIcon className="h-6 w-6 text-green-600" />
              </div>
            </div>

            {/* Library Rules */}
            <div className="bg-blue-50 rounded-lg p-6 mb-8 border border-blue-200">
              <h3 className="text-lg font-semibold text-blue-900 mb-4">Library Rules</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                <div>
                  <span className="font-medium text-blue-900">Max Books per Student:</span>
                  <span className="ml-2 text-blue-700">3</span>
                </div>
                <div>
                  <span className="font-medium text-blue-900">Loan Period:</span>
                  <span className="ml-2 text-blue-700">14 days</span>
                </div>
                <div>
                  <span className="font-medium text-blue-900">Overdue Fine:</span>
                  <span className="ml-2 text-blue-700">₹10/day</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Select Student Section */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center mb-4">
                  <UsersIcon className="h-6 w-6 text-blue-600 mr-3" />
                  <h3 className="text-lg font-semibold text-gray-900">Select Student</h3>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Search Student</label>
                  <div className="relative" ref={studentSearchRef}>
                    <input
                      type="text"
                      placeholder="Type student name, roll number, or email..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                    />
                    <div className="absolute right-3 top-3">
                      {searchLoading ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                      ) : (
                        <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                    
                    {/* Student Search Dropdown */}
                    {showStudentDropdown && studentSearchResults.length > 0 && (
                      <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                        {studentSearchResults.map((student) => (
                          <div
                            key={student.id}
                            className="p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
                            onClick={() => selectStudent(student)}
                          >
                            <div className="font-semibold text-gray-800">{student.name}</div>
                            <div className="text-sm text-gray-600 mt-1">
                              {student.roll_number && `Roll: ${student.roll_number}`}
                              {student.admission_number && ` | Admission: ${student.admission_number}`}
                            </div>
                            <div className="text-sm text-gray-600">
                              {student.grade && `Grade: ${student.grade}`}
                              {student.section && ` | Section: ${student.section}`}
                              {student.course_name && ` | Course: ${student.course_name}`}
                            </div>
                            {student.email && (
                              <div className="text-xs text-gray-500 mt-1">{student.email}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* No Results Message */}
                    {!searchLoading && studentSearch.length >= 2 && studentSearchResults.length === 0 && (
                      <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-3">
                        <div className="text-sm text-gray-500 text-center">
                          No students found matching "{studentSearch}"
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Selected Student Display */}
                {selectedStudent && (
                  <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-semibold text-green-800 text-lg flex items-center gap-2">
                          <CheckCircleIcon className="h-5 w-5" />
                          Selected: {selectedStudent.name}
                        </div>
                        <div className="text-sm text-green-700 mt-1">
                          {selectedStudent.roll_number && `Roll: ${selectedStudent.roll_number}`}
                          {selectedStudent.admission_number && ` | Admission: ${selectedStudent.admission_number}`}
                        </div>
                        <div className="text-sm text-green-700">
                          {selectedStudent.grade && `Grade: ${selectedStudent.grade}`}
                          {selectedStudent.section && ` | Section: ${selectedStudent.section}`}
                          {selectedStudent.course_name && ` | Course: ${selectedStudent.course_name}`}
                        </div>
                        {selectedStudent.email && (
                          <div className="text-xs text-green-600 mt-1">{selectedStudent.email}</div>
                        )}
                      </div>
                      <button
                        onClick={clearStudentSelection}
                        className="ml-3 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-full p-1 transition-colors"
                        title="Clear selection"
                      >
                        <XMarkIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Select Book Section */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center mb-4">
                  <BookOpenIcon className="h-6 w-6 text-blue-600 mr-3" />
                  <h3 className="text-lg font-semibold text-gray-900">Select Book</h3>
                </div>

                {selectedBookForIssue ? (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-semibold text-blue-800 text-lg">
                          {selectedBookForIssue.title}
                        </div>
                        <div className="text-sm text-blue-700 mt-1">
                          Author: {selectedBookForIssue.author}
                        </div>
                        <div className="text-sm text-blue-700">
                          ISBN: {selectedBookForIssue.isbn}
                        </div>
                        <div className="text-sm text-blue-700">
                          Available: {selectedBookForIssue.available_copies} of {selectedBookForIssue.total_copies}
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedBookForIssue(null)}
                        className="ml-3 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-full p-1 transition-colors"
                        title="Clear selection"
                      >
                        <XMarkIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">Select a book from the available books below:</p>
                    <div className="max-h-64 overflow-y-auto space-y-2">
                      {books.filter(book => book.available_copies > 0).map((book) => (
                        <div
                          key={book.id}
                          className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                          onClick={() => setSelectedBookForIssue(book)}
                        >
                          <div className="font-medium text-gray-900">{book.title}</div>
                          <div className="text-sm text-gray-600">
                            {book.author} • Available: {book.available_copies}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Issue Button */}
            {selectedStudent && selectedBookForIssue && (
              <div className="mt-8 flex justify-center">
                <button
                  onClick={handleIssueBook}
                  disabled={loading}
                  className="px-8 py-3 bg-green-600 text-white text-lg font-medium rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Issuing...' : `Issue "${selectedBookForIssue.title}" to ${selectedStudent.name}`}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Return Tab */}
        {activeTab === "Return" && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Return Book</h2>

            {/* Search Options */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search by Book ID</label>
                <input
                  type="text"
                  placeholder="Enter book ID..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={bookIdSearch}
                  onChange={(e) => setBookIdSearch(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search by Student ID</label>
                <input
                  type="text"
                  placeholder="Enter student ID..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={studentIdSearch}
                  onChange={(e) => setStudentIdSearch(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Or Search All</label>
                <input
                  type="text"
                  placeholder="Search by book title or student..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={searchAllBooks}
                  onChange={(e) => setSearchAllBooks(e.target.value)}
                />
              </div>
            </div>

            {/* Currently Issued Books */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center">
                  <BookOpenIcon className="h-5 w-5 text-blue-600 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">Currently Issued Books</h3>
                </div>
                <p className="text-sm text-gray-600 mt-1">Showing {bookIssues.length} issued books</p>
              </div>

              {loading ? (
                <div className="p-6 text-center text-gray-500">Loading issued books...</div>
              ) : bookIssues.length === 0 ? (
                <div className="p-6 text-center text-gray-500">No books currently issued</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                  {bookIssues.map((issue) => (
                    <div key={issue.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <h4 className="font-semibold text-gray-900 mb-2">{issue.book?.title || 'Unknown Book'}</h4>
                      <p className="text-sm text-gray-600 mb-2">ISBN: {issue.book?.isbn}</p>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Student:</span>
                          <span className="font-medium">{issue.student_name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Roll No:</span>
                          <span className="font-medium">{issue.roll_number}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Class:</span>
                          <span className="font-medium">{issue.class}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Issue Date:</span>
                          <span className="font-medium">{new Date(issue.issue_date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Due Date:</span>
                          <span className={`font-medium ${new Date(issue.due_date) < new Date() ? 'text-red-600' : 'text-gray-900'}`}>
                            {new Date(issue.due_date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="mt-4">
                        <button
                          onClick={() => handleReturnBook(issue.id)}
                          disabled={loading}
                          className="w-full px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                        >
                          {loading ? 'Processing...' : 'Return Book'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Other tabs placeholder */}
        {!['Dashboard', 'Add', 'Details', 'Issue', 'Return', 'History', 'Overdue'].includes(activeTab) && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{activeTab} Module</h3>
            <p className="text-gray-600">This section is under development.</p>
          </div>
        )}
      </div>
    </div>
  );
}