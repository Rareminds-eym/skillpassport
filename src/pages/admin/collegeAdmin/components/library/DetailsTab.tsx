import { MagnifyingGlassIcon, Squares2X2Icon, TableCellsIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import { LibraryBook } from "../../../../../services/libraryService";

interface DetailsTabProps {
  books: LibraryBook[];
  totalBooksCount: number;
  bookSearch: string;
  setBookSearch: (value: string) => void;
  bookFilter: string;
  setBookFilter: (value: string) => void;
  currentPage: number;
  setCurrentPage: (value: number) => void;
  booksPerPage: number;
  loadBooks: (filters?: { search?: string; status?: string; page?: number }) => Promise<void>;
  setActiveTab: (tab: string) => void;
  setIssueFormBookId: (bookId: string) => void;
  setReturnFormBookId: (bookId: string) => void;
  onIssueBookClick: (bookId: string) => void;
  onReturnBookClick: (bookId: string) => void;
}

export function DetailsTab({
  books,
  totalBooksCount,
  bookSearch,
  setBookSearch,
  bookFilter,
  setBookFilter,
  currentPage,
  setCurrentPage,
  booksPerPage,
  loadBooks,
  setActiveTab,
  setIssueFormBookId,
  setReturnFormBookId,
  onIssueBookClick,
  onReturnBookClick,
}: DetailsTabProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [sortBy, setSortBy] = useState('latest');
  
  const totalPages = Math.ceil(totalBooksCount / booksPerPage);
  const startIndex = (currentPage - 1) * booksPerPage + 1;
  const endIndex = Math.min(startIndex + books.length - 1, totalBooksCount);

  // Sort books based on selected option
  const sortedBooks = [...books].sort((a, b) => {
    switch (sortBy) {
      case 'title-asc':
        return a.title.localeCompare(b.title);
      case 'title-desc':
        return b.title.localeCompare(a.title);
      case 'author':
        return a.author.localeCompare(b.author);
      case 'latest':
      default:
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    }
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Book Details</h2>
      </div>
      
      {/* Search, Filter, and View Toggle - Single Line */}
      <div className="flex gap-3 mb-6">
        {/* Search */}
        <div className="flex-1">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by title, author, or ISBN..."
              className="w-full p-2 pl-10 border rounded-lg"
              value={bookSearch}
              onChange={(e) => {
                setBookSearch(e.target.value);
                setCurrentPage(1);
                setTimeout(() => {
                  loadBooks({ search: e.target.value, status: bookFilter, page: 1 });
                }, 300);
              }}
            />
            <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
        </div>
        
        {/* Filter Dropdown */}
        <div className="w-48">
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
            <option value="unavailable">Issued/Unavailable</option>
          </select>
        </div>
        
        {/* View Mode Toggle */}
        <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg transition ${
              viewMode === 'grid' 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-600 hover:bg-gray-200'
            }`}
            title="Grid View"
          >
            <Squares2X2Icon className="h-5 w-5" />
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`p-2 rounded-lg transition ${
              viewMode === 'table' 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-600 hover:bg-gray-200'
            }`}
            title="Table View"
          >
            <TableCellsIcon className="h-5 w-5" />
          </button>
        </div>
        
        {/* Sort Dropdown (optional, matching assessment page) */}
        <div className="w-40">
          <select 
            className="w-full p-2 border rounded-lg"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="latest">Sort: Latest</option>
            <option value="title-asc">Sort: Title A-Z</option>
            <option value="title-desc">Sort: Title Z-A</option>
            <option value="author">Sort: Author</option>
          </select>
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-4 text-sm text-gray-600">
        Showing {startIndex}-{endIndex} of {totalBooksCount} books
      </div>

      {/* Books Grid */}
      {sortedBooks.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500 text-lg">No books found</p>
          <p className="text-gray-400 text-sm mt-2">Try adjusting your search or filters, or add some books</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {sortedBooks.map((book) => (
            <div 
              key={book.id} 
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition"
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
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {book.available_copies > 0 ? 'Available' : 'All Issued'}
                </span>
              </div>

              {/* ISBN Badge */}
              {book.isbn && (
                <div className="mb-3">
                  <span className="inline-flex items-center gap-1 text-xs text-blue-700 bg-blue-100 px-2 py-1 rounded font-medium">
                    <span className="font-semibold">ISBN:</span> {book.isbn}
                  </span>
                </div>
              )}

              {/* Book Stats */}
              <div className="flex gap-2 mb-4">
                <div className="flex-1 bg-purple-50 border border-purple-200 rounded-lg p-2 text-center">
                  <div className="text-xs text-purple-700 font-medium mb-1">Total Copies</div>
                  <div className="text-lg font-bold text-purple-900">{book.total_copies}</div>
                </div>
                <div className="flex-1 bg-green-50 border border-green-200 rounded-lg p-2 text-center">
                  <div className="text-xs text-green-700 font-medium mb-1">Available</div>
                  <div className={`text-lg font-bold ${
                    book.available_copies > 0 ? 'text-green-700' : 'text-red-600'
                  }`}>
                    {book.available_copies}
                  </div>
                </div>
                {book.category && (
                  <div className="flex-1 bg-orange-50 border border-orange-200 rounded-lg p-2 text-center">
                    <div className="text-xs text-orange-700 font-medium mb-1">Category</div>
                    <div className="text-sm font-semibold text-orange-900 truncate">{book.category}</div>
                  </div>
                )}
              </div>

              {/* Book ID */}
              <div className="text-xs text-gray-500 mb-3">
                Book ID: {book.id.slice(0, 12)}...
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
                  onClick={() => onIssueBookClick(book.id)}
                >
                  Issue Book
                </button>
                <button 
                  className={`flex-1 py-2 rounded-lg font-medium transition ${
                    book.total_copies - book.available_copies > 0
                      ? 'bg-gray-600 text-white hover:bg-gray-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                  disabled={book.total_copies - book.available_copies === 0}
                  onClick={() => onReturnBookClick(book.id)}
                >
                  Return
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="overflow-x-auto mb-6">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Title</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Author</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">ISBN</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Category</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Total</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Available</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Status</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sortedBooks.map((book) => (
                <tr key={book.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-semibold text-gray-900">{book.title}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{book.author}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{book.isbn}</td>
                  <td className="px-4 py-3 text-center text-sm text-gray-600">{book.category || '-'}</td>
                  <td className="px-4 py-3 text-center text-sm text-gray-900">{book.total_copies}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`font-bold ${
                      book.available_copies > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {book.available_copies}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        book.available_copies > 0
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {book.available_copies > 0 ? "Available" : "All Issued"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 justify-center">
                      <button 
                        className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                          book.available_copies > 0
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                        disabled={book.available_copies === 0}
                        onClick={() => onIssueBookClick(book.id)}
                      >
                        Issue
                      </button>
                      <button 
                        className="px-3 py-1 bg-gray-600 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition"
                        onClick={() => {
                          setActiveTab("return");
                          setReturnFormBookId(book.id);
                        }}
                      >
                        Return
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
    </div>
  );
}
