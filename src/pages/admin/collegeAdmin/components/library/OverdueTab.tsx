import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import { OverdueBook } from "../../../../../services/libraryService";

interface OverdueTabProps {
  overdueBooks: OverdueBook[];
}

export function OverdueTab({ overdueBooks }: OverdueTabProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter overdue books
  const filteredOverdue = overdueBooks.filter(item => {
    const matchesSearch = 
      item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.student_id.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  // Pagination
  const totalPages = Math.ceil(filteredOverdue.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedOverdue = filteredOverdue.slice(startIndex, endIndex);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Overdue Books</h2>
      </div>
      
      {/* Search */}
      <div className="bg-white p-4 rounded-lg border mb-6">
        <div className="max-w-2xl">
          <label className="block mb-2 font-medium text-sm">Search Overdue Books</label>
          <div className="relative">
            <input
              type="text"
              placeholder="Search by book title, student name, or ID..."
              className="w-full p-2 pl-10 border rounded-lg"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
            <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-4 text-sm text-gray-600">
        Showing {startIndex + 1}-{Math.min(endIndex, filteredOverdue.length)} of {filteredOverdue.length} overdue books
        {searchTerm && ` (search: "${searchTerm}")`}
      </div>
      
      {filteredOverdue.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500 text-lg">No overdue books at the moment</p>
          <p className="text-gray-400 text-sm mt-2">
            {searchTerm 
              ? "Try adjusting your search" 
              : "Great! All books are returned on time"}
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-red-50 border-b border-red-200">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Book Title</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Student Name</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Student ID</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Issue Date</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Due Date</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Days Overdue</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Fine</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedOverdue.map((item) => (
                  <tr key={item.id} className="hover:bg-red-50">
                    <td className="px-4 py-3 font-semibold text-gray-900">{item.title}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{item.student_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 font-mono">{item.student_id.slice(0, 12)}...</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{item.issue_date}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{item.due_date}</td>
                    <td className="px-4 py-3 text-sm text-red-600 font-bold">{item.days_overdue} days</td>
                    <td className="px-4 py-3 text-sm text-red-600 font-bold">₹{item.current_fine}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-6">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className={`px-4 py-2 rounded-lg font-medium ${
                  currentPage === 1
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                ← Previous
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
                      onClick={() => setCurrentPage(pageNum)}
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
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className={`px-4 py-2 rounded-lg font-medium ${
                  currentPage === totalPages
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
