import { BookOpenIcon, UsersIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { LibraryBook, LibraryBookIssue } from "../../../../../services/libraryService";
import { StudentSearch } from "./StudentSearch";

interface IssueBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  issueForm: {
    studentId: string;
    studentName: string;
    rollNumber: string;
    enrollmentNumber: string;
    admissionNumber: string;
    grade: string;
    section: string;
    courseName: string;
    semester: string;
    bookId: string;
    dueDate: string;
  };
  setIssueForm: (form: any) => void;
  books: LibraryBook[];
  issuedBooks: LibraryBookIssue[];
  loading: boolean;
  issueBook: () => Promise<void>;
  LIBRARY_RULES: {
    maxBooksPerStudent: number;
    defaultLoanPeriodDays: number;
    finePerDay: number;
  };
  studentSearch: string;
  setStudentSearch: (value: string) => void;
  studentSearchResults: any[];
  showStudentDropdown: boolean;
  selectedStudent: any;
  searchLoading: boolean;
  studentSearchRef: React.RefObject<HTMLDivElement>;
  selectStudent: (student: any) => Promise<void>;
  clearStudentSelection: () => void;
}

export function IssueBookModal({
  isOpen,
  onClose,
  issueForm,
  setIssueForm,
  books,
  issuedBooks,
  loading,
  issueBook,
  LIBRARY_RULES,
  studentSearch,
  setStudentSearch,
  studentSearchResults,
  showStudentDropdown,
  selectedStudent,
  searchLoading,
  studentSearchRef,
  selectStudent,
  clearStudentSelection,
}: IssueBookModalProps) {
  if (!isOpen) return null;

  const handleSubmit = async () => {
    await issueBook();
    onClose();
  };

  const handleClose = () => {
    clearStudentSelection();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-t-lg flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <BookOpenIcon className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold">Issue Book</h3>
          </div>
          <button 
            onClick={handleClose}
            className="text-white hover:bg-white/20 rounded-full w-8 h-8 flex items-center justify-center transition"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {/* Library Rules Info */}
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-6">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-blue-900">Library Rules</h4>
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

          {/* Student Search Section */}
          <div className="mb-6">
            {!selectedStudent ? (
              <StudentSearch
                studentSearch={studentSearch}
                setStudentSearch={setStudentSearch}
                studentSearchResults={studentSearchResults}
                showStudentDropdown={showStudentDropdown}
                searchLoading={searchLoading}
                studentSearchRef={studentSearchRef}
                selectStudent={selectStudent}
              />
            ) : (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="flex items-center gap-3 font-bold text-blue-900 mb-3">
                  <div className="w-10 h-10 rounded-full bg-white shadow flex items-center justify-center">
                    <UsersIcon className="w-6 h-6 text-blue-600" />
                  </div>
                  Selected Student
                </h3>
                <div className="p-4 bg-white border border-green-200 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-semibold text-gray-800 text-lg flex items-center gap-2">
                        <span className="text-green-600">✓</span>
                        {selectedStudent.name}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {selectedStudent.roll_number && `Roll: ${selectedStudent.roll_number}`}
                        {selectedStudent.enrollmentNumber && ` | Enrollment: ${selectedStudent.enrollmentNumber}`}
                        {selectedStudent.admission_number && ` | Admission: ${selectedStudent.admission_number}`}
                      </div>
                      <div className="text-sm text-gray-600">
                        {selectedStudent.grade && `Grade: ${selectedStudent.grade}`}
                        {selectedStudent.section && ` Section: ${selectedStudent.section}`}
                        {selectedStudent.course_name && ` | Course: ${selectedStudent.course_name}`}
                        {selectedStudent.semester && ` | Semester: ${selectedStudent.semester}`}
                      </div>
                      {selectedStudent.email && (
                        <div className="text-xs text-gray-500 mt-1">{selectedStudent.email}</div>
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
              </div>
            )}
          </div>

          {/* Student Details (Read-only) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block mb-2 font-medium text-gray-700">Student Name</label>
              <input 
                className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50" 
                value={issueForm.studentName}
                readOnly
                placeholder="Select student from search above"
              />
            </div>
            
            <div>
              <label className="block mb-2 font-medium text-gray-700">Grade</label>
              <input 
                className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50" 
                value={issueForm.grade}
                readOnly
                placeholder="Auto-filled from student data"
              />
            </div>
            
            <div>
              <label className="block mb-2 font-medium text-gray-700">Section</label>
              <input 
                className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50" 
                value={issueForm.section}
                readOnly
                placeholder="Auto-filled from student data"
              />
            </div>
            
            <div>
              <label className="block mb-2 font-medium text-gray-700">Course Name</label>
              <input 
                className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50" 
                value={issueForm.courseName}
                readOnly
                placeholder="Auto-filled from student data"
              />
            </div>
          </div>
          
          {/* Book Selection */}
          <div className="mb-6">
            <label className="block mb-2 font-medium text-gray-700">
              Select Book <span className="text-red-500">*</span>
            </label>
            <select 
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button 
              onClick={handleClose}
              className="flex-1 bg-gray-500 text-white py-3 rounded-lg font-semibold hover:bg-gray-600 transition"
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              onClick={handleSubmit}
              disabled={loading || !selectedStudent || !issueForm.bookId}
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Issuing...' : selectedStudent && issueForm.bookId ? `Issue Book to ${selectedStudent.name}` : 'Select Student and Book to Issue'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
