import React from 'react';
import { PlusIcon } from "@heroicons/react/24/outline";
import { LibraryBook } from '../../../../../services/libraryService';

interface DashboardTabProps {
  books: LibraryBook[];
  dashboardPage: number;
  setDashboardPage: (page: number) => void;
  dashboardBooksPerPage: number;
  onAddBookClick: () => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  books,
  dashboardPage,
  setDashboardPage,
  dashboardBooksPerPage,
  onAddBookClick,
}) => {
  const totalPages = Math.ceil(books.length / dashboardBooksPerPage);
  const startIndex = (dashboardPage - 1) * dashboardBooksPerPage;
  const endIndex = startIndex + dashboardBooksPerPage;
  const paginatedBooks = books.slice(startIndex, endIndex);

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-900">
          Books Inventory
        </h2>
        <button
          onClick={onAddBookClick}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-medium"
        >
          <PlusIcon className="h-5 w-5" />
          Add Book
        </button>
      </div>

      {/* Results Count */}
      <div className="mb-4">
        <p className="text-sm text-gray-600">
          Showing {startIndex + 1}-{Math.min(endIndex, books.length)} of {books.length} books
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Book ID</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Title</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Author</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">ISBN</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Total Copies</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Available</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {paginatedBooks.map((book) => (
              <tr key={book.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs text-gray-600">{book.id.slice(0, 8)}...</td>
                <td className="px-4 py-3 font-semibold text-gray-900">{book.title}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{book.author}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{book.isbn}</td>
                <td className="px-4 py-3 text-center text-sm text-gray-900">{book.total_copies}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`font-bold ${
                    book.available_copies > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {book.available_copies}
                  </span>
                </td>
                <td className="px-4 py-3">
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          <button
            onClick={() => setDashboardPage(Math.max(1, dashboardPage - 1))}
            disabled={dashboardPage === 1}
            className={`px-4 py-2 rounded-lg font-medium ${
              dashboardPage === 1
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            ← Previous
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
            onClick={() => setDashboardPage(Math.min(totalPages, dashboardPage + 1))}
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
    </div>
  );
};
