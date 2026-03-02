import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import { LibraryBookIssue } from "../../../../../services/libraryService";

interface HistoryTabProps {
  borrowHistory: LibraryBookIssue[];
}

export function HistoryTab({ borrowHistory }: HistoryTabProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter history
  const filteredHistory = borrowHistory.filter(item => {
    const matchesSearch = 
      item.book?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.student_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.roll_number.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedHistory = filteredHistory.slice(startIndex, endIndex);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Borrow History</h2>
      </div>
      
      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg border mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <label className="block mb-2 font-medium text-sm">Search History</label>
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
          
          {/* Filter */}
          <div>
            <label className="block mb-2 font-medium text-sm">Filter by Status</label>
            <select
              className="w-full p-2 border rounded-lg"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="all">All Status</option>
              <option value="issued">Issued</option>
              <option value="returned">Returned</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-4 text-sm text-gray-600">
        Showing {startIndex + 1}-{Math.min(endIndex, filteredHistory.length)} of {filteredHistory.length} records
        {searchTerm && ` (search: "${searchTerm}")`}
        {statusFilter !== "all" && ` (filter: ${statusFilter})`}
      </div>
      
      {filteredHistory.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500 text-lg">No borrow history found</p>
          <p className="text-gray-400 text-sm mt-2">
            {searchTerm || statusFilter !== "all" 
              ? "Try adjusting your search or filters" 
              : "Book transactions will appear here"}
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Book Title</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Student Name</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Roll No</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Issue Date</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Due Date</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Return Date</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Fine</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedHistory.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-semibold text-gray-900">{item.book?.title || 'Unknown Book'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{item.student_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{item.roll_number}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{item.issue_date}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{item.due_date}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{item.return_date || "Not Returned"}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">₹{item.fine_amount}</td>
                    <td className="px-4 py-3">
                      {item.status === "overdue" ? (
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">Overdue</span>
                      ) : item.status === "issued" ? (
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">Issued</span>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">Returned</span>
                      )}
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
