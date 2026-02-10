import { PlusIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import { validateISBN, formatISBN } from "../../../../../utils/isbnValidator";

interface AddBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  newBook: {
    title: string;
    author: string;
    isbn: string;
    total_copies: number;
    category: string;
    publisher: string;
    publication_year: number;
    description: string;
    location_shelf: string;
  };
  setNewBook: (book: any) => void;
  addBook: () => Promise<void>;
  loading: boolean;
}

export function AddBookModal({
  isOpen,
  onClose,
  newBook,
  setNewBook,
  addBook,
  loading,
}: AddBookModalProps) {
  const [isbnValidation, setIsbnValidation] = useState<{ valid: boolean; type: string | null; message: string } | null>(null);

  if (!isOpen) return null;

  const handleISBNChange = (value: string) => {
    setNewBook({ ...newBook, isbn: value });
    
    if (value.trim()) {
      const validation = validateISBN(value);
      setIsbnValidation(validation);
    } else {
      setIsbnValidation(null);
    }
  };

  const handleISBNBlur = () => {
    if (newBook.isbn && isbnValidation?.valid) {
      // Auto-format ISBN on blur if valid
      const formatted = formatISBN(newBook.isbn);
      setNewBook({ ...newBook, isbn: formatted });
    }
  };

  const handleSubmit = async () => {
    if (!isbnValidation?.valid && newBook.isbn) {
      return; // Don't submit if ISBN is invalid
    }
    await addBook();
    setIsbnValidation(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-t-lg flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <PlusIcon className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold">Add New Book</h3>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Title */}
            <div className="md:col-span-2">
              <label className="block mb-2 font-medium text-gray-700">
                Book Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter book title"
                value={newBook.title}
                onChange={(e) => setNewBook({ ...newBook, title: e.target.value })}
              />
            </div>

            {/* Author */}
            <div>
              <label className="block mb-2 font-medium text-gray-700">
                Author <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter author name"
                value={newBook.author}
                onChange={(e) => setNewBook({ ...newBook, author: e.target.value })}
              />
            </div>

            {/* ISBN */}
            <div>
              <label className="block mb-2 font-medium text-gray-700">
                ISBN <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:border-blue-500 ${
                  isbnValidation 
                    ? isbnValidation.valid 
                      ? 'border-green-500 focus:ring-green-500' 
                      : 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
                placeholder="Enter ISBN-10 or ISBN-13"
                value={newBook.isbn}
                onChange={(e) => handleISBNChange(e.target.value)}
                onBlur={handleISBNBlur}
              />
              {isbnValidation && (
                <div className={`mt-1 text-sm ${
                  isbnValidation.valid ? 'text-green-600' : 'text-red-600'
                }`}>
                  {isbnValidation.valid ? (
                    <span>{isbnValidation.message} ({isbnValidation.type})</span>
                  ) : (
                    <span>{isbnValidation.message}</span>
                  )}
                </div>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Accepts ISBN-10 (10 digits) or ISBN-13 (13 digits). Hyphens optional.
              </p>
            </div>

            {/* Total Copies */}
            <div>
              <label className="block mb-2 font-medium text-gray-700">
                Total Copies <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter number of copies"
                value={newBook.total_copies}
                onChange={(e) => setNewBook({ ...newBook, total_copies: Number(e.target.value) })}
              />
            </div>

            {/* Category */}
            <div>
              <label className="block mb-2 font-medium text-gray-700">Category</label>
              <input
                type="text"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Fiction, Science, History"
                value={newBook.category}
                onChange={(e) => setNewBook({ ...newBook, category: e.target.value })}
              />
            </div>

            {/* Publisher */}
            <div>
              <label className="block mb-2 font-medium text-gray-700">Publisher</label>
              <input
                type="text"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter publisher name"
                value={newBook.publisher}
                onChange={(e) => setNewBook({ ...newBook, publisher: e.target.value })}
              />
            </div>

            {/* Publication Year */}
            <div>
              <label className="block mb-2 font-medium text-gray-700">Publication Year</label>
              <input
                type="number"
                min="1900"
                max={new Date().getFullYear()}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter year"
                value={newBook.publication_year}
                onChange={(e) => setNewBook({ ...newBook, publication_year: Number(e.target.value) })}
              />
            </div>

            {/* Location/Shelf */}
            <div>
              <label className="block mb-2 font-medium text-gray-700">Location/Shelf</label>
              <input
                type="text"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., A-12, Shelf 3"
                value={newBook.location_shelf}
                onChange={(e) => setNewBook({ ...newBook, location_shelf: e.target.value })}
              />
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block mb-2 font-medium text-gray-700">Description</label>
              <textarea
                rows={3}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter book description (optional)"
                value={newBook.description}
                onChange={(e) => setNewBook({ ...newBook, description: e.target.value })}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-6">
            <button 
              onClick={onClose}
              className="flex-1 bg-gray-500 text-white py-3 rounded-lg font-semibold hover:bg-gray-600 transition"
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              onClick={handleSubmit}
              disabled={loading || !newBook.title || !newBook.author || !newBook.isbn || newBook.total_copies < 1}
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Adding...' : 'Add Book'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
