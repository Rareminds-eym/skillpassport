import { BookOpenIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { LibraryBookIssue } from "../../../../../services/libraryService";

interface ReturnBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedBookId: string | null;
  issuedBooks: LibraryBookIssue[];
  returnForm: {
    bookId: string;
    studentId: string;
    studentName: string;
    rollNumber: string;
    class: string;
    bookTitle: string;
    issueDate: string;
    dueDate: string;
    returnDate: string;
  };
  setReturnForm: (form: any) => void;
  showReturnModal: boolean;
  setShowReturnModal: (value: boolean) => void;
  returnBook: () => Promise<void>;
  calculateFine: (issueDate: string, returnDate: string) => { dueDate: string; overdueDays: number; fine: number };
}

export function ReturnBookModal({
  isOpen,
  onClose,
  selectedBookId,
  issuedBooks,
  returnForm,
  setReturnForm,
  showReturnModal,
  setShowReturnModal,
  returnBook,
  calculateFine,
}: ReturnBookModalProps) {
  if (!isOpen) return null;

  // Filter issued books for the selected book
  const filteredIssuedBooks = selectedBookId 
    ? issuedBooks.filter(ib => ib.status === "issued" && ib.book_id === selectedBookId)
    : issuedBooks.filter(ib => ib.status === "issued");

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
          {/* Modal Header */}
          <div className="sticky top-0 bg-gradient-to-r from-gray-600 to-gray-700 text-white p-4 rounded-t-lg flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <BookOpenIcon className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold">Return Book</h3>
            </div>
            <button 
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-full w-8 h-8 flex items-center justify-center transition"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-6">
            <h4 className="font-bold mb-4 text-lg flex items-center gap-3">
              <div className="w-10 h-10 bg-white border border-gray-200 rounded-lg flex items-center justify-center">
                <BookOpenIcon className="h-5 w-5 text-blue-500" />
              </div>
              <span>Currently Issued Books</span>
            </h4>

            {filteredIssuedBooks.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <p className="text-gray-500 text-lg">No issued books found</p>
                <p className="text-gray-400 text-sm mt-2">
                  {selectedBookId ? "This book has no active issues" : "No books are currently issued"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredIssuedBooks.map((issued) => {
                  const today = new Date().toISOString().split('T')[0];
                  const { overdueDays, fine } = calculateFine(issued.issue_date, today);
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
          </div>
        </div>
      </div>

      {/* Return Confirmation Modal */}
      {showReturnModal && returnForm.bookTitle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-blue-600 text-white p-4 rounded-t-lg flex justify-between items-center">
              <h3 className="text-xl font-bold">📖 Confirm Return</h3>
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
                    onClose();
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
    </>
  );
}
