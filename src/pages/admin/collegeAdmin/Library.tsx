
// import React, { useState } from "react";
// import { v4 as uuidv4 } from "uuid"; // For generating UUIDs

// export default function LibraryModule() {
//   const [activeTab, setActiveTab] = useState("dashboard");

//   // Books DB (simulate table)
//   const [books, setBooks] = useState([
//     { book_id: uuidv4(), title: "Mathematics Grade 8", author: "R.S. Sharma", isbn: "1234567890", copies: 5, status: "Available" },
//     { book_id: uuidv4(), title: "Science Grade 9", author: "S. Gupta", isbn: "9876543210", copies: 3, status: "Issued" },
//   ]);

//   const [borrowHistory, setBorrowHistory] = useState([
//     { id: 1, book: "Math Grade 9", due: "2025-02-10", status: "Returned" },
//     { id: 2, book: "Physics Grade 11", due: "2025-02-15", status: "Overdue" },
//   ]);

//   // New book form state
//   const [newBook, setNewBook] = useState({ title: "", author: "", isbn: "", copies: 1 });

//   const addBook = () => {
//     if (!newBook.title || !newBook.author || !newBook.isbn || newBook.copies < 1) {
//       alert("Please fill all fields correctly.");
//       return;
//     }
//     setBooks([...books, { ...newBook, book_id: uuidv4(), status: "Available" }]);
//     setNewBook({ title: "", author: "", isbn: "", copies: 1 });
//     alert("Book added successfully!");
//   };

//   return (
//     <div className="p-6 max-w-6xl mx-auto">
//       <h1 className="text-2xl font-bold mb-4">Library Module</h1>

//       {/* Tabs */}
//       <div className="flex gap-2 mb-6 flex-wrap">
//         {["dashboard", "add", "details", "issue", "return", "history", "overdue"].map((tab) => (
//           <button
//             key={tab}
//             onClick={() => setActiveTab(tab)}
//             className={`px-4 py-2 rounded-lg ${
//               activeTab === tab ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-800"
//             }`}
//           >
//             {tab.charAt(0).toUpperCase() + tab.slice(1)}
//           </button>
//         ))}
//       </div>

//       {/* Dashboard / Book List */}
//       {activeTab === "dashboard" && (
//         <div>
//           <table className="w-full border rounded-lg">
//             <thead className="bg-gray-100">
//               <tr>
//                 <th className="p-2 border">Book ID</th>
//                 <th className="p-2 border">Title</th>
//                 <th className="p-2 border">Author</th>
//                 <th className="p-2 border">ISBN</th>
//                 <th className="p-2 border">Copies</th>
//                 <th className="p-2 border">Status</th>
//               </tr>
//             </thead>
//             <tbody>
//               {books.map((book) => (
//                 <tr key={book.book_id}>
//                   <td className="p-2 border">{book.book_id.slice(0, 8)}</td>
//                   <td className="p-2 border">{book.title}</td>
//                   <td className="p-2 border">{book.author}</td>
//                   <td className="p-2 border">{book.isbn}</td>
//                   <td className="p-2 border">{book.copies}</td>
//                   <td className="p-2 border">
//                     <span
//                       className={`px-3 py-1 rounded-full text-sm ${
//                         book.status === "Available"
//                           ? "bg-green-100 text-green-700"
//                           : "bg-yellow-100 text-yellow-700"
//                       }`}
//                     >
//                       {book.status}
//                     </span>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       )}

//       {/* Add New Book */}
//       {activeTab === "add" && (
//         <div className="max-w-xl mx-auto">
//           <h2 className="text-xl font-bold mb-4">Add New Book</h2>
//           <label className="block mb-2 font-medium">Title</label>
//           <input
//             className="w-full p-2 border rounded mb-3"
//             value={newBook.title}
//             onChange={(e) => setNewBook({ ...newBook, title: e.target.value })}
//           />
//           <label className="block mb-2 font-medium">Author</label>
//           <input
//             className="w-full p-2 border rounded mb-3"
//             value={newBook.author}
//             onChange={(e) => setNewBook({ ...newBook, author: e.target.value })}
//           />
//           <label className="block mb-2 font-medium">ISBN</label>
//           <input
//             className="w-full p-2 border rounded mb-3"
//             value={newBook.isbn}
//             onChange={(e) => setNewBook({ ...newBook, isbn: e.target.value })}
//           />
//           <label className="block mb-2 font-medium">Copies</label>
//           <input
//             type="number"
//             className="w-full p-2 border rounded mb-4"
//             value={newBook.copies}
//             onChange={(e) => setNewBook({ ...newBook, copies: Number(e.target.value) })}
//           />
//           <button onClick={addBook} className="w-full bg-green-600 text-white p-2 rounded-lg">
//             Add Book
//           </button>
//         </div>
//       )}

//       {/* Book Details */}
//       {activeTab === "details" && (
//         <div>
//           <h2 className="text-xl font-bold mb-4">Book Details</h2>
//           {books.map((book) => (
//             <div key={book.book_id} className="border p-4 mb-3 rounded-lg">
//               <p><strong>ID:</strong> {book.book_id}</p>
//               <p><strong>Title:</strong> {book.title}</p>
//               <p><strong>Author:</strong> {book.author}</p>
//               <p><strong>ISBN:</strong> {book.isbn}</p>
//               <p><strong>Copies:</strong> {book.copies}</p>
//               <p><strong>Status:</strong> {book.status}</p>
//               <div className="mt-2 flex gap-2">
//                 <button className="px-3 py-1 bg-blue-500 text-white rounded-lg">Issue</button>
//                 <button className="px-3 py-1 bg-green-600 text-white rounded-lg">Return</button>
//               </div>
//             </div>
//           ))}
//         </div>
//       )}

//       {/* Issue Book */}
//       {/* Issue Book */}
// {activeTab === "issue" && (
//   <div className="max-w-xl mx-auto">
//     <h2 className="text-xl font-bold mb-4">Issue Book</h2>

//     {/* Student Name */}
//     <label className="block mb-2 font-medium">Student Name</label>
//     <input className="w-full p-2 border rounded mb-3" placeholder="Enter student name" />

//     {/* Roll Number */}
//     <label className="block mb-2 font-medium">Roll Number</label>
//     <input className="w-full p-2 border rounded mb-3" placeholder="Enter roll number" />

//     {/* Class */}
//     <label className="block mb-2 font-medium">Class</label>
//     <input className="w-full p-2 border rounded mb-3" placeholder="Enter class/grade" />

//     {/* Academic Year */}
//     <label className="block mb-2 font-medium">Academic Year</label>
//     <input className="w-full p-2 border rounded mb-3" placeholder="Enter academic year" />

//     {/* Book Selection */}
//     <label className="block mb-2 font-medium">Book</label>
//     <select className="w-full p-2 border rounded mb-3">
//       {books.map((book) => (
//         <option key={book.book_id} value={book.book_id}>
//           {book.title} ({book.book_id.slice(0, 8)})
//         </option>
//       ))}
//     </select>

//     {/* Due Date */}
//     <label className="block mb-2 font-medium">Due Date</label>
//     <input type="date" className="w-full p-2 border rounded mb-4" />

//     <button className="w-full bg-blue-600 text-white p-2 rounded-lg">Issue Book</button>
//   </div>
// )}


//       {/* Return Book */}
//       {activeTab === "return" && (
//         <div className="max-w-xl mx-auto">
//           <h2 className="text-xl font-bold mb-4">Return Book</h2>
//           <label className="block mb-2 font-medium">Book ID</label>
//           <input className="w-full p-2 border rounded mb-3" />
//           <label className="block mb-2 font-medium">Student ID</label>
//           <input className="w-full p-2 border rounded mb-3" />
//           <div className="bg-yellow-100 border border-yellow-300 text-yellow-800 p-3 rounded mb-4">
//             Fine: ₹20 (Auto-calculated based on overdue days)
//           </div>
//           <button className="w-full bg-green-600 text-white p-2 rounded-lg">Return Book</button>
//         </div>
//       )}

//       {/* Borrow History */}
//       {activeTab === "history" && (
//         <div>
//           <h2 className="text-xl font-bold mb-4">Borrow History</h2>
//           <table className="w-full border rounded-lg">
//             <thead className="bg-gray-100">
//               <tr>
//                 <th className="p-2 border">Book</th>
//                 <th className="p-2 border">Due Date</th>
//                 <th className="p-2 border">Status</th>
//               </tr>
//             </thead>
//             <tbody>
//               {borrowHistory.map((item) => (
//                 <tr key={item.id}>
//                   <td className="p-2 border">{item.book}</td>
//                   <td className="p-2 border">{item.due}</td>
//                   <td className="p-2 border">
//                     {item.status === "Overdue" ? (
//                       <span className="text-red-600 font-bold">Overdue</span>
//                     ) : (
//                       <span className="text-green-600">Returned</span>
//                     )}
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       )}

//       {/* Overdue List */}
//       {activeTab === "overdue" && (
//         <div>
//           <h2 className="text-xl font-bold mb-4">Overdue Books</h2>
//           <table className="w-full border rounded-lg">
//             <thead className="bg-red-100">
//               <tr>
//                 <th className="p-2 border">Book</th>
//                 <th className="p-2 border">Student ID</th>
//                 <th className="p-2 border">Due Date</th>
//                 <th className="p-2 border">Fine</th>
//               </tr>
//             </thead>
//             <tbody>
//               {borrowHistory
//                 .filter((item) => item.status === "Overdue")
//                 .map((item) => (
//                   <tr key={item.id}>
//                     <td className="p-2 border">{item.book}</td>
//                     <td className="p-2 border">STD-001</td>
//                     <td className="p-2 border">{item.due}</td>
//                     <td className="p-2 border">₹20</td>
//                   </tr>
//                 ))}
//             </tbody>
//           </table>
//         </div>
//       )}
//     </div>
//   );
// }
import { BookOpenIcon, MagnifyingGlassIcon, UsersIcon } from "@heroicons/react/24/outline";
import { useEffect, useRef, useState } from "react";
import toast from 'react-hot-toast';
import { supabase } from "../../../lib/supabaseClient";
import { LibraryBook, LibraryBookIssue, libraryService, LibrarySetting, LibraryStats, OverdueBook } from "../../../services/libraryService";

export default function LibraryModule() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Data states
  const [books, setBooks] = useState<LibraryBook[]>([]);
  const [totalBooksCount, setTotalBooksCount] = useState(0); // Track total count from server
  const [issuedBooks, setIssuedBooks] = useState<LibraryBookIssue[]>([]);
  const [borrowHistory, setBorrowHistory] = useState<LibraryBookIssue[]>([]);
  const [overdueBooks, setOverdueBooks] = useState<OverdueBook[]>([]);
  const [libraryStats, setLibraryStats] = useState<LibraryStats | null>(null);
  const [librarySettings, setLibrarySettings] = useState<LibrarySetting[]>([]);

  // Library Configuration Rules (from backend settings)
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
  const [bookFilter, setBookFilter] = useState("all"); // all, available, issued
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

  // Debug function to check data
  const debugData = () => {
    console.log('=== LIBRARY DEBUG INFO ===');
    console.log('Books:', books);
    console.log('Issued Books:', issuedBooks);
    console.log('Borrow History:', borrowHistory);
    console.log('Overdue Books:', overdueBooks);
    console.log('Library Stats:', libraryStats);
    console.log('Library Settings:', librarySettings);
    console.log('Library Rules:', LIBRARY_RULES);
    console.log('=========================');
  };

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Loading initial library data...');

      // Load library settings first
      const settings = await libraryService.getSettings();
      console.log('Settings loaded:', settings);
      setLibrarySettings(settings);
      
      // Update library rules from settings
      const maxBooks = parseInt(settings.find(s => s.setting_key === 'max_books_per_student')?.setting_value || '3');
      const loanPeriod = parseInt(settings.find(s => s.setting_key === 'default_loan_period_days')?.setting_value || '14');
      const finePerDay = parseInt(settings.find(s => s.setting_key === 'fine_per_day')?.setting_value || '10');
      
      setLibraryRules({
        maxBooksPerStudent: maxBooks,
        defaultLoanPeriodDays: loanPeriod,
        finePerDay: finePerDay,
      });

      // Load other data
      await Promise.all([
        loadBooks(),
        loadIssuedBooks(),
        loadLibraryStats(),
        loadOverdueBooks(),
      ]);

      console.log('Initial data loading completed');
      //toast.success('Library data loaded successfully!', { duration: 2000 });

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
      console.log('Loading books with filters:', filters);
      
      // If no filters provided, use current state values, but ensure we don't filter out new books
      const searchTerm = filters?.search !== undefined ? filters.search : bookSearch;
      const statusFilter = filters?.status !== undefined ? filters.status : bookFilter;
      const pageNum = filters?.page !== undefined ? filters.page : currentPage;
      
      // When explicitly clearing filters (like after adding a book), ensure we get all books
      const actualStatusFilter = statusFilter === 'all' ? undefined : statusFilter;
      
      const { books: booksData, count } = await libraryService.getBooks({
        search: searchTerm || undefined, // Don't pass empty string
        status: actualStatusFilter,
        page: pageNum,
        limit: booksPerPage,
      });
      console.log('Books loaded:', booksData, 'Total count:', count);
      setBooks(booksData);
      setTotalBooksCount(count || 0);
      
      // Update state to match what was actually loaded
      if (filters?.search !== undefined) setBookSearch(filters.search);
      if (filters?.status !== undefined) setBookFilter(filters.status);
      if (filters?.page !== undefined) setCurrentPage(filters.page);
      
    } catch (err) {
      console.error('Error loading books:', err);
      const errorMessage = 'Failed to load books';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const loadIssuedBooks = async () => {
    try {
      console.log('Loading issued books...');
      const { issues } = await libraryService.getBookIssues({ status: 'issued' });
      console.log('Issued books loaded:', issues);
      setIssuedBooks(issues);
    } catch (err) {
      console.error('Error loading issued books:', err);
      toast.error('Failed to load issued books');
    }
  };

  const loadLibraryStats = async () => {
    try {
      console.log('Loading library stats...');
      const stats = await libraryService.getLibraryStats();
      console.log('Library stats loaded:', stats);
      setLibraryStats(stats);
    } catch (err) {
      console.error('Error loading library stats:', err);
      toast.error('Failed to load library statistics');
    }
  };

  const loadOverdueBooks = async () => {
    try {
      console.log('Loading overdue books...');
      const overdue = await libraryService.getOverdueBooks();
      console.log('Overdue books loaded:', overdue);
      setOverdueBooks(overdue);
    } catch (err) {
      console.error('Error loading overdue books:', err);
      toast.error('Failed to load overdue books');
    }
  };

  // Student search functionality - using the EXACT same logic as Admissions & Data
  const searchStudents = async (searchTerm: string) => {
    if (searchTerm.length < 2) {
      setStudentSearchResults([]);
      setShowStudentDropdown(false);
      setSearchLoading(false);
      return;
    }

    try {
      setSearchLoading(true);

      //testing 1
      //console.log('[Library] Searching students with term:', searchTerm);
      
      // Get current user's institution ID - EXACT same logic as Admissions & Data
      let schoolId: string | null = null;
      let collegeId: string | null = null;
      let userRole: string | null = null;
      let userId: string | null = null;
      let universityId: string | null = null;
      
      // First, check if user is logged in via AuthContext (for school/college admins)
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          console.log('📦 Found user in localStorage:', userData.email, 'role:', userData.role);
          userRole = userData.role;
          
          if (userData.role === 'school_admin' && userData.schoolId) {
            schoolId = userData.schoolId;
            console.log('✅ School admin detected, using schoolId from localStorage:', schoolId);
          } else if (userData.role === 'college_admin' && userData.collegeId) {
            collegeId = userData.collegeId;
            console.log('✅ College admin detected, using collegeId from localStorage:', collegeId);
          } else if (userData.role === 'university_admin' && (userData.universityId || userData.organizationId)) {
            universityId = userData.universityId || userData.organizationId;
            console.log('✅ University admin detected, using universityId from localStorage:', universityId);
          }
        } catch (e) {
          console.error('Error parsing stored user:', e);
        }
      }
      
      // If not found in localStorage, try Supabase Auth
      if (!schoolId && !collegeId) {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          console.log('🔍 Checking Supabase auth user:', user.email);
          userId = user.id;
          
          // Get user role from users table
          const { data: userRecord } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single();
          
          userRole = userRecord?.role || null;
          console.log('👤 User role from database:', userRole);
          
          // Check for college admin
          if (userRole === 'college_admin') {
            // Find college by matching email in organizations table (case-insensitive)
            const { data: org } = await supabase
              .from('organizations')
              .select('id, name, email')
              .eq('organization_type', 'college')
              .ilike('email', user.email || '')
              .maybeSingle();
            
            if (org?.id) {
              collegeId = org.id;
              console.log('✅ Found college_id for college admin:', collegeId, 'College:', org.name, 'Email:', org.email);
            } else {
              console.warn('⚠️ College admin but no matching organization found for email:', user.email);
            }
          }
          // Check for school admin/educator
          else {
            // Check school_educators table
            const { data: educator } = await supabase
              .from('school_educators')
              .select('school_id')
              .eq('user_id', user.id)
              .single();
            
            if (educator?.school_id) {
              schoolId = educator.school_id;
              console.log('✅ Found school_id in school_educators:', schoolId);
            } else {
              // Check organizations table by email for school
              const { data: org } = await supabase
                .from('organizations')
                .select('id')
                .eq('organization_type', 'school')
                .eq('email', user.email)
                .maybeSingle();
              
              schoolId = org?.id || null;
              if (schoolId) {
                console.log('✅ Found school_id in organizations table:', schoolId);
              }
            }
          }
        }
      }
      
      // Build the query - EXACT same as Admissions & Data
      let query = supabase
        .from('students')
        .select('id, name, roll_number, enrollmentNumber, admission_number, contact_number, email, grade, section, course_name, semester')
        .eq('is_deleted', false)
        .or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,contact_number.ilike.%${searchTerm}%,grade.ilike.%${searchTerm}%,section.ilike.%${searchTerm}%,roll_number.ilike.%${searchTerm}%`)
        .order('name')
        .limit(10);
      
      // Filter by school_id, college_id, or universityId based on user role
      if (schoolId) {
        console.log('✅ Filtering students by school_id:', schoolId);
        query = query.eq('school_id', schoolId);
      } else if (collegeId) {
        console.log('✅ Filtering students by college_id:', collegeId);
        query = query.eq('college_id', collegeId);
      } else if (universityId) {
        console.log('✅ Filtering students by universityId:', universityId);
        query = query.eq('universityId', universityId);
      } else {
        console.warn('⚠️ No school_id, college_id, or universityId found - User role:', userRole);
      }
      
      const { data: students, error } = await query;
      
      if (error) {
        console.error('Supabase query error:', error);
        throw error;
      }
      
      console.log(`✅ [Library] Found ${students?.length || 0} students matching "${searchTerm}"`);
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

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (studentSearch.length >= 2) {
        searchStudents(studentSearch);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [studentSearch]);

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

    // Check student's current issued books count
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

  const loadBorrowHistory = async () => {
    try {
      console.log('Loading borrow history...');
      const { issues } = await libraryService.getBookIssues();
      console.log('Borrow history loaded:', issues);
      setBorrowHistory(issues);
    } catch (err) {
      console.error('Error loading borrow history:', err);
      toast.error('Failed to load borrow history');
    }
  };

  // Calculate fine based on overdue days (Issue Date + 14 days = Due Date)
  const calculateFine = (issueDate: string, returnDate: string) => {
    try {
      // Calculate due date: Issue Date + loan period days
      const issue = new Date(issueDate);
      const dueDate = new Date(issue);
      dueDate.setDate(dueDate.getDate() + LIBRARY_RULES.defaultLoanPeriodDays);
      
      // Calculate overdue days
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
      
      // Clear any search filters and reset to first page to show all books
      setBookSearch("");
      setBookFilter("all");
      setCurrentPage(1);
      
      // Reload books without any filters to ensure new book appears
      await loadBooks({ search: "", status: "all", page: 1 });
      await loadLibraryStats();
      
      // Switch to details tab to show the newly added book
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

      // Use the most appropriate identifier for the student
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

      // Reset form
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
      
      // Reload data
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
        const { dueDate, overdueDays, fine } = await calculateFine(issued.issue_date, today);
        

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
      
      // Find the issue record
      const issued = await libraryService.searchIssuedBook(returnForm.bookId, returnForm.studentId);
      if (!issued) {
        toast.dismiss(loadingToast);
        toast.error("No matching issued book found. Please search again.");
        return;
      }

      const returnedIssue = await libraryService.returnBook(issued.id, {
        return_date: returnForm.returnDate,
      });

      const { overdueDays, fine } = await calculateFine(issued.issue_date, returnForm.returnDate);

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
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Library Module</h1>

      {/* Loading and Error States */}
      {loading && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Loading...</span>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {["dashboard", "add", "details", "issue", "return", "history", "overdue"].map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              // Load data when switching tabs
              if (tab === "history" && borrowHistory.length === 0) {
                toast.loading('Loading borrow history...', { id: 'load-history' });
                loadBorrowHistory().finally(() => toast.dismiss('load-history'));
              } else if (tab === "overdue" && overdueBooks.length === 0) {
                toast.loading('Loading overdue books...', { id: 'load-overdue' });
                loadOverdueBooks().finally(() => toast.dismiss('load-overdue'));
              }
            }}
            className={`px-4 py-2 rounded-lg ${
              activeTab === tab ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-800"
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
        
       
      </div>

      {/* Dashboard / Book List */}
      {activeTab === "dashboard" && (
        <div>
          <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-100 p-4 rounded-lg">
              <h3 className="text-lg font-semibold">Total Books</h3>
              <p className="text-3xl font-bold">{libraryStats?.total_books || 0}</p>
            </div>
            <div className="bg-green-100 p-4 rounded-lg">
              <h3 className="text-lg font-semibold">Available</h3>
              <p className="text-3xl font-bold">{libraryStats?.available_copies || 0}</p>
            </div>
            <div className="bg-yellow-100 p-4 rounded-lg">
              <h3 className="text-lg font-semibold">Currently Issued</h3>
              <p className="text-3xl font-bold">{libraryStats?.currently_issued || 0}</p>
            </div>
          </div>

          {(() => {
            // Pagination logic
            const totalPages = Math.ceil(books.length / dashboardBooksPerPage);
            const startIndex = (dashboardPage - 1) * dashboardBooksPerPage;
            const endIndex = startIndex + dashboardBooksPerPage;
            const paginatedBooks = books.slice(startIndex, endIndex);

            return (
              <>
                {/* Results Count */}
                <div className="mb-4 text-sm text-gray-600">
                  Showing {startIndex + 1}-{Math.min(endIndex, books.length)} of {books.length} books
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border rounded-lg">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="p-2 border">Book ID</th>
                        <th className="p-2 border">Title</th>
                        <th className="p-2 border">Author</th>
                        <th className="p-2 border">ISBN</th>
                        <th className="p-2 border">Total Copies</th>
                        <th className="p-2 border">Available</th>
                        <th className="p-2 border">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedBooks.map((book) => (
                        <tr key={book.id} className="hover:bg-gray-50">
                          <td className="p-2 border font-mono text-xs">{book.id.slice(0, 8)}...</td>
                          <td className="p-2 border font-semibold">{book.title}</td>
                          <td className="p-2 border">{book.author}</td>
                          <td className="p-2 border">{book.isbn}</td>
                          <td className="p-2 border text-center">{book.total_copies}</td>
                          <td className="p-2 border text-center">
                            <span className={`font-bold ${
                              book.available_copies > 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {book.available_copies}
                            </span>
                          </td>
                          <td className="p-2 border text-center">
                            <span
                              className={`px-3 py-1 rounded-full text-sm font-medium ${
                                book.available_copies > 0
                                  ? "bg-green-100 text-green-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {book.available_copies > 0 ? "Available" : "All Issued"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-6">
                    <button
                      onClick={() => setDashboardPage(prev => Math.max(1, prev - 1))}
                      disabled={dashboardPage === 1}
                      className={`px-4 py-2 rounded-lg font-medium ${
                        dashboardPage === 1
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      ←
                    </button>
                    
                    <div className="flex gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <button
                          key={page}
                          onClick={() => setDashboardPage(page)}
                          className={`px-3 py-2 rounded-lg font-medium ${
                            dashboardPage === page
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>
                    
                    <button
                      onClick={() => setDashboardPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={dashboardPage === totalPages}
                      className={`px-4 py-2 rounded-lg font-medium ${
                        dashboardPage === totalPages
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      Next →
                    </button>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      )}

      {/* Add New Book */}
      {activeTab === "add" && (
        <div className="max-w-xl mx-auto">
          <h2 className="text-xl font-bold mb-4">Add New Book</h2>
          <div className="space-y-4">
            <div>
              <label className="block mb-2 font-medium">Title <span className="text-red-500">*</span></label>
              <input
                className="w-full p-2 border rounded"
                value={newBook.title}
                onChange={(e) => setNewBook({ ...newBook, title: e.target.value })}
                placeholder="Enter book title"
              />
            </div>
            
            <div>
              <label className="block mb-2 font-medium">Author  <span className="text-red-500">*</span></label>
              <input
                className="w-full p-2 border rounded"
                value={newBook.author}
                onChange={(e) => setNewBook({ ...newBook, author: e.target.value })}
                placeholder="Enter author name"
              />
            </div>
            
            <div>
              <label className="block mb-2 font-medium">ISBN  <span className="text-red-500">*</span></label>
              <input
                className="w-full p-2 border rounded"
                value={newBook.isbn}
                onChange={(e) => setNewBook({ ...newBook, isbn: e.target.value })}
                placeholder="Enter ISBN number"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 font-medium">Total Copies  <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  min="1"
                  className="w-full p-2 border rounded"
                  value={newBook.total_copies}
                  onChange={(e) => setNewBook({ ...newBook, total_copies: Number(e.target.value) })}
                />
              </div>
              
              <div>
                <label className="block mb-2 font-medium">Publication Year</label>
                <input
                  type="number"
                  min="1900"
                  max={new Date().getFullYear()}
                  className="w-full p-2 border rounded"
                  value={newBook.publication_year}
                  onChange={(e) => setNewBook({ ...newBook, publication_year: Number(e.target.value) })}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 font-medium">Category</label>
                <input
                  className="w-full p-2 border rounded"
                  value={newBook.category}
                  onChange={(e) => setNewBook({ ...newBook, category: e.target.value })}
                  placeholder="e.g., Academic, Fiction"
                />
              </div>
              
              <div>
                <label className="block mb-2 font-medium">Publisher</label>
                <input
                  className="w-full p-2 border rounded"
                  value={newBook.publisher}
                  onChange={(e) => setNewBook({ ...newBook, publisher: e.target.value })}
                  placeholder="Enter publisher name"
                />
              </div>
            </div>
            
            <div>
              <label className="block mb-2 font-medium">Shelf Location</label>
              <input
                className="w-full p-2 border rounded"
                value={newBook.location_shelf}
                onChange={(e) => setNewBook({ ...newBook, location_shelf: e.target.value })}
                placeholder="e.g., A1-B2, Section-3"
              />
            </div>
            
            <div>
              <label className="block mb-2 font-medium">Description</label>
              <textarea
                className="w-full p-2 border rounded"
                rows={3}
                value={newBook.description}
                onChange={(e) => setNewBook({ ...newBook, description: e.target.value })}
                placeholder="Brief description of the book"
              />
            </div>
            
            <button 
              onClick={addBook} 
              disabled={loading}
              className="w-full bg-green-600 text-white p-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Book'}
            </button>
          </div>
        </div>
      )}

      {/* Book Details */}
      {activeTab === "details" && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Book Details</h2>
           
          </div>
          
          {/* Search and Filters */}
          <div className="bg-white p-4 rounded-lg border mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div className="md:col-span-2">
                <label className="block mb-2 font-medium text-sm">Search Books</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search by title, author, or ISBN..."
                    className="w-full p-2 pl-10 border rounded-lg"
                    value={bookSearch}
                    onChange={(e) => {
                      setBookSearch(e.target.value);
                      setCurrentPage(1);
                      // Trigger search after a short delay
                      setTimeout(() => {
                        loadBooks({ search: e.target.value, status: bookFilter, page: 1 });
                      }, 300);
                    }}
                  />
                 <MagnifyingGlassIcon
  className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
/>
                </div>
              </div>
              
              {/* Filter */}
              <div>
                <label className="block mb-2 font-medium text-sm">Filter by Status</label>
                <select
                  className="w-full p-2 border rounded-lg"
                  value={bookFilter}
                  onChange={(e) => {
                    setBookFilter(e.target.value);
                    setCurrentPage(1);
                    loadBooks({ search: bookSearch, status: e.target.value, page: 1 });
                  }}
                >
                  <option value="all">All Books</option>
                  <option value="available">Available Only</option>
                  <option value="issued">Issued/Unavailable</option>
                </select>
              </div>
            </div>
          </div>

          {(() => {
            // Server-side pagination: use totalBooksCount from server, not books.length
            const totalPages = Math.ceil(totalBooksCount / booksPerPage);
            const startIndex = (currentPage - 1) * booksPerPage + 1;
            const endIndex = Math.min(startIndex + books.length - 1, totalBooksCount);
            const paginatedBooks = books; // Show all books returned from server

            return (
              <>
                {/* Results Count */}
                <div className="mb-4 text-sm text-gray-600">
                  Showing {startIndex}-{endIndex} of {totalBooksCount} books
                  {bookSearch && ` (search: "${bookSearch}")`}
                  {bookFilter !== "all" && ` (filter: ${bookFilter})`}
                </div>

                {/* Books Grid */}
                {paginatedBooks.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <p className="text-gray-500 text-lg">No books found</p>
                    <p className="text-gray-400 text-sm mt-2">Try adjusting your search or filters, or add some books</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    {paginatedBooks.map((book) => (
                      <div 
                        key={book.id} 
                        className={`border-2 rounded-lg p-4 hover:shadow-lg transition ${
                          book.available_copies > 0 
                            ? 'border-green-200 bg-green-50' 
                            : 'border-red-200 bg-red-50'
                        }`}
                      >
                        {/* Book Header */}
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <h3 className="font-bold text-lg text-gray-800 mb-1">{book.title}</h3>
                            <p className="text-sm text-gray-600">by {book.author}</p>
                          </div>
                          <span 
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              book.available_copies > 0
                                ? 'bg-green-600 text-white'
                                : 'bg-red-600 text-white'
                            }`}
                          >
                            {book.available_copies > 0 ? 'Available' : 'All Issued'}
                          </span>
                        </div>

                        {/* Book Details */}
                        <div className="space-y-2 mb-4 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">ISBN:</span>
                            <span className="font-medium">{book.isbn}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Total Copies:</span>
                            <span className="font-medium">{book.total_copies}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Available:</span>
                            <span className={`font-bold ${
                              book.available_copies > 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {book.available_copies}
                            </span>
                          </div>
                          {book.category && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Category:</span>
                              <span className="font-medium">{book.category}</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-gray-600">Book ID:</span>
                            <span className="font-mono text-xs">{book.id.slice(0, 12)}...</span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                          <button 
                            className={`flex-1 py-2 rounded-lg font-medium transition ${
                              book.available_copies > 0
                                ? 'bg-blue-600 text-white hover:bg-blue-700'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }`}
                            disabled={book.available_copies === 0}
                            onClick={() => {
                              setActiveTab("issue");
                              setIssueForm({ ...issueForm, bookId: book.id });
                            }}
                          >
                            Issue Book
                          </button>
                          <button 
                            className="flex-1 bg-gray-600 text-white py-2 rounded-lg font-medium hover:bg-gray-700 transition"
                            onClick={() => {
                              setActiveTab("return");
                              setReturnForm({ ...returnForm, bookId: book.id });
                            }}
                          >
                            Return
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-6">
                    <button
                      onClick={() => {
                        const newPage = Math.max(1, currentPage - 1);
                        setCurrentPage(newPage);
                        loadBooks({ search: bookSearch, status: bookFilter, page: newPage });
                      }}
                      disabled={currentPage === 1}
                      className={`px-4 py-2 rounded-lg font-medium ${
                        currentPage === 1
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      ←
                    </button>
                    
                    <div className="flex gap-1">
                      {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => {
                        // Show page numbers around current page
                        let pageNum;
                        if (totalPages <= 10) {
                          pageNum = i + 1;
                        } else {
                          const start = Math.max(1, currentPage - 4);
                          const end = Math.min(totalPages, start + 9);
                          pageNum = start + i;
                          if (pageNum > end) return null;
                        }
                        
                        return (
                          <button
                            key={pageNum}
                            onClick={() => {
                              setCurrentPage(pageNum);
                              loadBooks({ search: bookSearch, status: bookFilter, page: pageNum });
                            }}
                            className={`px-3 py-2 rounded-lg font-medium ${
                              currentPage === pageNum
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    
                    <button
                      onClick={() => {
                        const newPage = Math.min(totalPages, currentPage + 1);
                        setCurrentPage(newPage);
                        loadBooks({ search: bookSearch, status: bookFilter, page: newPage });
                      }}
                      disabled={currentPage === totalPages}
                      className={`px-4 py-2 rounded-lg font-medium ${
                        currentPage === totalPages
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      →
                    </button>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      )}

      {/* Issue Book */}
      {activeTab === "issue" && (
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-bold mb-6">Issue Book</h2>
          
          {/* Library Rules Info */}
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-6 relative">
  <div className="flex items-center justify-between mb-2">
    <h3 className="font-bold text-blue-900">
      Library Rules
    </h3>

    <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
      <BookOpenIcon className="h-5 w-5 text-white" />
    </div>
  </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              <div>
                <span className="font-medium">Max Books per Student:</span> {LIBRARY_RULES.maxBooksPerStudent}
              </div>
              <div>
                <span className="font-medium">Loan Period:</span> {LIBRARY_RULES.defaultLoanPeriodDays} days
              </div>
              <div>
                <span className="font-medium">Overdue Fine:</span> ₹{LIBRARY_RULES.finePerDay}/day
              </div>
            </div>
</div>

          
          <div className="bg-white p-6 rounded-lg border">
            <div className="grid grid-cols-1 gap-6">
              {/* Student Search Section */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="flex items-center gap-3 font-bold text-blue-900 mb-3">
  <div className="w-10 h-10 rounded-full bg-white shadow flex items-center justify-center">
    <UsersIcon className="w-6 h-6 text-blue-600" />
  </div>
  Select Student
</h3>
                <div className="relative" ref={studentSearchRef}>
                  <label className="block mb-2 font-medium">Search Student</label>
                  <div className="relative">
                    <input 
                      className="w-full p-3 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Type student name, roll number, enrollment number, or email..."
                      value={studentSearch}
                      onChange={(e) => {
                        setStudentSearch(e.target.value);
                      }}
                      onFocus={() => {
                        if (studentSearchResults.length > 0 && studentSearch.length >= 2) {
                          setShowStudentDropdown(true);
                        }
                      }}
                    />
                    {/* Search Icon or Loading Spinner */}
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      {searchLoading ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                      ) : (
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      )}
                    </div>
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
                            {student.enrollmentNumber && ` | Enrollment: ${student.enrollmentNumber}`}
                            {student.admission_number && ` | Admission: ${student.admission_number}`}
                          </div>
                          <div className="text-sm text-gray-600">
                            {student.grade && `Grade: ${student.grade}`}
                            {student.section && ` Section: ${student.section}`}
                            {student.course_name && ` | Course: ${student.course_name}`}
                            {student.semester && ` | Semester: ${student.semester}`}
                          </div>
                          {student.email && (
                            <div className="text-xs text-gray-500 mt-1">{student.email}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Loading State */}
                  {searchLoading && studentSearch.length >= 2 && (
                    <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-3">
                      <div className="flex items-center justify-center text-sm text-gray-500">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                        Searching students...
                      </div>
                    </div>
                  )}
                  
                  {/* No Results Message */}
                  {!searchLoading && studentSearch.length >= 2 && studentSearchResults.length === 0 && !showStudentDropdown && (
                    <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-3">
                      <div className="text-sm text-gray-500 text-center">
                        No students found matching "{studentSearch}"
                      </div>
                    </div>
                  )}
                  
                  {/* Selected Student Display */}
                  {selectedStudent && (
                    <div className="mt-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-semibold text-green-800 text-lg">✓ Selected: {selectedStudent.name}</div>
                          <div className="text-sm text-green-700 mt-1">
                            {selectedStudent.roll_number && `Roll: ${selectedStudent.roll_number}`}
                            {selectedStudent.enrollmentNumber && ` | Enrollment: ${selectedStudent.enrollmentNumber}`}
                            {selectedStudent.admission_number && ` | Admission: ${selectedStudent.admission_number}`}
                          </div>
                          <div className="text-sm text-green-700">
                            {selectedStudent.grade && `Grade: ${selectedStudent.grade}`}
                            {selectedStudent.section && ` Section: ${selectedStudent.section}`}
                            {selectedStudent.course_name && ` | Course: ${selectedStudent.course_name}`}
                            {selectedStudent.semester && ` | Semester: ${selectedStudent.semester}`}
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
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Student Details (Read-only when selected) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2 font-medium">Student Name</label>
                  <input 
                    className="w-full p-2 border rounded bg-gray-50" 
                    value={issueForm.studentName}
                    readOnly
                    placeholder="Select student from search above"
                  />
                </div>
                
                <div>
                  <label className="block mb-2 font-medium">Roll Number</label>
                  <input 
                    className="w-full p-2 border rounded bg-gray-50" 
                    value={issueForm.rollNumber}
                    readOnly
                    placeholder="Auto-filled from student data"
                  />
                </div>
                
                <div>
                  <label className="block mb-2 font-medium">Enrollment Number</label>
                  <input 
                    className="w-full p-2 border rounded bg-gray-50" 
                    value={issueForm.enrollmentNumber}
                    readOnly
                    placeholder="Auto-filled from student data"
                  />
                </div>
                
                <div>
                  <label className="block mb-2 font-medium">Admission Number</label>
                  <input 
                    className="w-full p-2 border rounded bg-gray-50" 
                    value={issueForm.admissionNumber}
                    readOnly
                    placeholder="Auto-filled from student data"
                  />
                </div>
                
                <div>
                  <label className="block mb-2 font-medium">Grade</label>
                  <input 
                    className="w-full p-2 border rounded bg-gray-50" 
                    value={issueForm.grade}
                    readOnly
                    placeholder="Auto-filled from student data"
                  />
                </div>
                
                <div>
                  <label className="block mb-2 font-medium">Section</label>
                  <input 
                    className="w-full p-2 border rounded bg-gray-50" 
                    value={issueForm.section}
                    readOnly
                    placeholder="Auto-filled from student data"
                  />
                </div>
                
                <div>
                  <label className="block mb-2 font-medium">Course Name</label>
                  <input 
                    className="w-full p-2 border rounded bg-gray-50" 
                    value={issueForm.courseName}
                    readOnly
                    placeholder="Auto-filled from student data"
                  />
                </div>
                
                <div>
                  <label className="block mb-2 font-medium">Semester</label>
                  <input 
                    className="w-full p-2 border rounded bg-gray-50" 
                    value={issueForm.semester}
                    readOnly
                    placeholder="Auto-filled from student data"
                  />
                </div>
              </div>
              
              {/* Book Selection */}
              <div>
                <label className="block mb-2 font-medium">Select Book</label>
                <select 
                  className="w-full p-3 border rounded-lg"
                  value={issueForm.bookId}
                  onChange={(e) => setIssueForm({ ...issueForm, bookId: e.target.value })}
                >
                  <option value="">-- Select Book --</option>
                  {books.filter(b => b.available_copies > 0).map((book) => (
                    <option key={book.id} value={book.id}>
                      {book.title} by {book.author} (Available: {book.available_copies})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Due date will be automatically set to {LIBRARY_RULES.defaultLoanPeriodDays} days from today
                </p>
              </div>
            </div>
            
            <button 
              onClick={issueBook}
              disabled={loading || !selectedStudent || !issueForm.bookId}
              className="w-full mt-6 bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Issuing...' : selectedStudent && issueForm.bookId ? `Issue Book to ${selectedStudent.name}` : 'Select Student and Book to Issue'}
            </button>
          </div>

          {/* Currently Issued Books */}
          <div className="mt-8">
            <h3 className="text-lg font-bold mb-4">Currently Issued Books</h3>
            <div className="overflow-x-auto">
              <table className="w-full border rounded-lg">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-2 border">Book Title</th>
                    <th className="p-2 border">Student Name</th>
                    <th className="p-2 border">Roll No</th>
                    <th className="p-2 border">Class</th>
                    <th className="p-2 border">Issue Date</th>
                    <th className="p-2 border">Due Date</th>
                    <th className="p-2 border">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {issuedBooks.filter(ib => ib.status === "issued").map((issued) => (
                    <tr key={issued.id}>
                      <td className="p-2 border">{issued.book?.title || 'Unknown Book'}</td>
                      <td className="p-2 border">{issued.student_name}</td>
                      <td className="p-2 border">{issued.roll_number}</td>
                      <td className="p-2 border">{issued.class}</td>
                      <td className="p-2 border">{issued.issue_date}</td>
                      <td className="p-2 border">{issued.due_date}</td>
                      <td className="p-2 border">
                        <span className="px-3 py-1 rounded-full text-sm bg-yellow-100 text-yellow-700">
                          {issued.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Return Book */}
      {activeTab === "return" && (
        <div>
          <h2 className="text-xl font-bold mb-6">Return Book</h2>
          
          {/* Search Bar */}
          <div className="bg-white p-4 rounded-lg border mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block mb-2 font-medium text-sm">Search by Book ID</label>
                <input 
                  className="w-full p-2 border rounded" 
                  placeholder="Enter book ID..."
                  value={returnForm.bookId}
                  onChange={(e) => setReturnForm({ ...returnForm, bookId: e.target.value })}
                />
              </div>
              
              <div>
                <label className="block mb-2 font-medium text-sm">Search by Student ID</label>
                <input 
                  className="w-full p-2 border rounded" 
                  placeholder="Enter student ID..."
                  value={returnForm.studentId}
                  onChange={(e) => setReturnForm({ ...returnForm, studentId: e.target.value })}
                />
              </div>
              
              <div>
                <label className="block mb-2 font-medium text-sm">Or Search All</label>
                <input 
                  className="w-full p-2 border rounded" 
                  placeholder="Search by book title or student..."
                  value={issuedBooksSearch}
                  onChange={(e) => {
                    setIssuedBooksSearch(e.target.value);
                    setIssuedBooksPage(1);
                  }}
                />
              </div>
            </div>
            
            <button 
              onClick={searchIssuedBook}
              className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
            >
               Search by ID
            </button>
          </div>

          {/* Currently Issued Books Grid */}
          <div className="bg-white p-6 rounded-lg border">
           <h3 className="font-bold mb-4 text-lg flex items-center gap-3">
  <div className="w-10 h-10 bg-white border border-gray-200 rounded-lg flex items-center justify-center">
    <BookOpenIcon className="h-5 w-5 text-blue-500" />
  </div>
  <span>Currently Issued Books</span>
</h3>

            
            {(() => {
              const filteredIssued = issuedBooks.filter(ib => {
                if (ib.status !== "issued") return false;
                if (!issuedBooksSearch) return true;
                
                const search = issuedBooksSearch.toLowerCase();
                return (
                  (ib.book?.title || '').toLowerCase().includes(search) ||
                  ib.student_name.toLowerCase().includes(search) ||
                  ib.student_id.toLowerCase().includes(search) ||
                  ib.roll_number.includes(search)
                );
              });

              const totalPages = Math.ceil(filteredIssued.length / issuedBooksPerPage);
              const startIndex = (issuedBooksPage - 1) * issuedBooksPerPage;
              const endIndex = startIndex + issuedBooksPerPage;
              const paginatedIssued = filteredIssued.slice(startIndex, endIndex);

              return (
                <>
                  {/* Results Count */}
                  <div className="mb-4 text-sm text-gray-600">
                    Showing {startIndex + 1}-{Math.min(endIndex, filteredIssued.length)} of {filteredIssued.length} issued books
                  </div>

                  {paginatedIssued.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                      <p className="text-gray-500 text-lg">No issued books found</p>
                      <p className="text-gray-400 text-sm mt-2">Try adjusting your search</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                      {paginatedIssued.map((issued) => {
                        const today = new Date().toISOString().split('T')[0];
                        const { dueDate, overdueDays, fine } = calculateFine(issued.issue_date, today);
                        const isOverdue = overdueDays > 0;
                        
                        return (
                          <div 
                            key={issued.id} 
                            className={`border-2 rounded-lg p-4 hover:shadow-lg transition ${
                              isOverdue ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50'
                            }`}
                          >
                            {/* Card Header */}
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex-1">
                                <h4 className="font-bold text-base text-gray-800">{issued.book?.title || 'Unknown Book'}</h4>
                                <p className="text-xs text-gray-500 mt-1">ID: {issued.book_id.slice(0, 12)}...</p>
                              </div>
                              {isOverdue && (
                                <span className="px-2 py-1 bg-red-600 text-white text-xs rounded-full font-semibold">
                                  OVERDUE
                                </span>
                              )}
                            </div>

                            {/* Student Info */}
                            <div className="space-y-2 mb-3 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Student:</span>
                                <span className="font-medium">{issued.student_name}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Roll No:</span>
                                <span className="font-medium">{issued.roll_number}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Class:</span>
                                <span className="font-medium">{issued.class}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Issue Date:</span>
                                <span className="font-medium">{issued.issue_date}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Due Date:</span>
                                <span className="font-medium">{issued.due_date}</span>
                              </div>
                              {isOverdue && (
                                <div className="flex justify-between pt-2 border-t border-red-200">
                                  <span className="text-red-700 font-semibold">Fine:</span>
                                  <span className="text-red-700 font-bold">₹{fine} ({overdueDays}d)</span>
                                </div>
                              )}
                            </div>

                            {/* Action Button */}
                            <button 
                              className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition"
                              onClick={() => {
                                setReturnForm({
                                  bookId: issued.book_id,
                                  studentId: issued.student_id,
                                  studentName: issued.student_name,
                                  rollNumber: issued.roll_number,
                                  class: issued.class,
                                  bookTitle: issued.book?.title || 'Unknown Book',
                                  issueDate: issued.issue_date,
                                  dueDate: issued.due_date,
                                  returnDate: new Date().toISOString().split('T')[0],
                                });
                                setShowReturnModal(true);
                              }}
                            >
                              Select for Return
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-2 mt-6">
                      <button
                        onClick={() => setIssuedBooksPage(prev => Math.max(1, prev - 1))}
                        disabled={issuedBooksPage === 1}
                        className={`px-4 py-2 rounded-lg font-medium ${
                          issuedBooksPage === 1
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        ←
                      </button>
                      
                      <div className="flex gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                          <button
                            key={page}
                            onClick={() => setIssuedBooksPage(page)}
                            className={`px-3 py-2 rounded-lg font-medium ${
                              issuedBooksPage === page
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                          >
                            {page}
                          </button>
                        ))}
                      </div>
                      
                      <button
                        onClick={() => setIssuedBooksPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={issuedBooksPage === totalPages}
                        className={`px-4 py-2 rounded-lg font-medium ${
                          issuedBooksPage === totalPages
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        Next →
                      </button>
                    </div>
                  )}
                </>
              );
            })()}
          </div>

          {/* Return Modal/Drawer */}
          {showReturnModal && returnForm.bookTitle && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Modal Header */}
                <div className="sticky top-0 bg-blue-600 text-white p-4 rounded-t-lg flex justify-between items-center">
                  <h3 className="text-xl font-bold">📖 Return Book</h3>
                  <button 
                    onClick={() => setShowReturnModal(false)}
                    className="text-white hover:bg-blue-700 rounded-full w-8 h-8 flex items-center justify-center"
                  >
                    ✕
                  </button>
                </div>

                {/* Modal Body */}
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="bg-gray-50 p-3 rounded border">
                      <label className="block text-sm font-medium text-gray-600 mb-1">Book Title</label>
                      <p className="font-semibold">{returnForm.bookTitle}</p>
                    </div>
                    
                    <div className="bg-gray-50 p-3 rounded border">
                      <label className="block text-sm font-medium text-gray-600 mb-1">Student Name</label>
                      <p className="font-semibold">{returnForm.studentName}</p>
                    </div>
                    
                    <div className="bg-gray-50 p-3 rounded border">
                      <label className="block text-sm font-medium text-gray-600 mb-1">Roll Number</label>
                      <p className="font-semibold">{returnForm.rollNumber}</p>
                    </div>
                    
                    <div className="bg-gray-50 p-3 rounded border">
                      <label className="block text-sm font-medium text-gray-600 mb-1">Class</label>
                      <p className="font-semibold">{returnForm.class}</p>
                    </div>
                    
                    <div className="bg-gray-50 p-3 rounded border">
                      <label className="block text-sm font-medium text-gray-600 mb-1">Issue Date</label>
                      <p className="font-semibold">{returnForm.issueDate}</p>
                    </div>
                    
                    <div className="bg-gray-50 p-3 rounded border">
                      <label className="block text-sm font-medium text-gray-600 mb-1">Due Date</label>
                      <p className="font-semibold">{returnForm.dueDate}</p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block mb-2 font-medium">Return Date</label>
                    <input 
                      type="date"
                      className="w-full p-3 border rounded-lg" 
                      value={returnForm.returnDate}
                      onChange={(e) => setReturnForm({ ...returnForm, returnDate: e.target.value })}
                    />
                  </div>

                  {(() => {
                    const { dueDate, overdueDays, fine } = calculateFine(returnForm.issueDate, returnForm.returnDate);
                    
                    return overdueDays > 0 ? (
                      <div className="bg-red-100 border border-red-300 text-red-800 p-4 rounded-lg mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-2xl">⚠️</span>
                          <strong className="text-lg">Overdue Book</strong>
                        </div>
                        <p><strong>Calculated Due Date:</strong> {dueDate}</p>
                        <p><strong>Days Overdue:</strong> {overdueDays} days</p>
                        <p className="text-xl font-bold mt-2"><strong>Fine Amount:</strong> ₹{fine}</p>
                      </div>
                    ) : (
                      <div className="bg-green-100 border border-green-300 text-green-800 p-4 rounded-lg mb-4">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">✓</span>
                          <strong>No fine. Book returned on time.</strong>
                        </div>
                      </div>
                    );
                  })()}

                  <div className="flex gap-3">
                    <button 
                      onClick={() => setShowReturnModal(false)}
                      className="flex-1 bg-gray-500 text-white py-3 rounded-lg font-semibold hover:bg-gray-600 transition"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={() => {
                        returnBook();
                        setShowReturnModal(false);
                      }}
                      className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition"
                    >
                      ✓ Confirm Return
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Borrow History */}
      {activeTab === "history" && (
        <div>
          <h2 className="text-xl font-bold mb-4">Borrow History</h2>
          
          {borrowHistory.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-500 text-lg">No borrow history found</p>
              <p className="text-gray-400 text-sm mt-2">Book transactions will appear here</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border rounded-lg">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-2 border">Book Title</th>
                    <th className="p-2 border">Student ID</th>
                    <th className="p-2 border">Student Name</th>
                    <th className="p-2 border">Issue Date</th>
                    <th className="p-2 border">Due Date</th>
                    <th className="p-2 border">Return Date</th>
                    <th className="p-2 border">Fine</th>
                    <th className="p-2 border">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {borrowHistory.map((item) => (
                    <tr key={item.id}>
                      <td className="p-2 border">{item.book?.title || 'Unknown Book'}</td>
                      <td className="p-2 border">{item.student_id}</td>
                      <td className="p-2 border">{item.student_name}</td>
                      <td className="p-2 border">{item.issue_date}</td>
                      <td className="p-2 border">{item.due_date}</td>
                      <td className="p-2 border">{item.return_date || "Not Returned"}</td>
                      <td className="p-2 border">₹{item.fine_amount}</td>
                      <td className="p-2 border">
                        {item.status === "overdue" ? (
                          <span className="px-3 py-1 rounded-full text-sm bg-red-100 text-red-700 font-bold">Overdue</span>
                        ) : item.status === "issued" ? (
                          <span className="px-3 py-1 rounded-full text-sm bg-yellow-100 text-yellow-700">Issued</span>
                        ) : (
                          <span className="px-3 py-1 rounded-full text-sm bg-green-100 text-green-700">Returned</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Overdue List */}
      {activeTab === "overdue" && (
        <div>
          <h2 className="text-xl font-bold mb-4">Overdue Books</h2>
          
          {overdueBooks.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-500 text-lg">No overdue books at the moment</p>
              <p className="text-gray-400 text-sm mt-2">Great! All books are returned on time</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border rounded-lg">
                <thead className="bg-red-100">
                  <tr>
                    <th className="p-2 border">Book Title</th>
                    <th className="p-2 border">Student ID</th>
                    <th className="p-2 border">Student Name</th>
                    <th className="p-2 border">Issue Date</th>
                    <th className="p-2 border">Due Date</th>
                    <th className="p-2 border">Days Overdue</th>
                    <th className="p-2 border">Fine</th>
                  </tr>
                </thead>
                <tbody>
                  {overdueBooks.map((item) => (
                    <tr key={item.id}>
                      <td className="p-2 border">{item.title}</td>
                      <td className="p-2 border">{item.student_id}</td>
                      <td className="p-2 border">{item.student_name}</td>
                      <td className="p-2 border">{item.issue_date}</td>
                      <td className="p-2 border">{item.due_date}</td>
                      <td className="p-2 border text-red-600 font-bold">{item.days_overdue} days</td>
                      <td className="p-2 border text-red-600 font-bold">₹{item.current_fine}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
