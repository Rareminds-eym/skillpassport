import React, { useState, useEffect } from "react";
import {
  PlusCircleIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  TrashIcon,
  KeyIcon,
  ArrowUpTrayIcon,
} from "@heroicons/react/24/outline";
import { useUsers } from "../../../hooks/college/useUsers";
import { departmentService } from "../../../services/college";
import { supabase } from "../../../lib/supabaseClient";
import UserFormModal from "./components/UserFormModal";
import { ConfirmModal } from "../../../components/shared/ConfirmModal";
import type { User } from "../../../types/college";

const UserManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"active" | "inactive" | "">("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [departments, setDepartments] = useState<Array<{ id: string; name: string }>>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    variant?: "danger" | "warning" | "info";
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const { users, loading, error, createUser, updateUser, deactivateUser, resetPassword } = useUsers({
    search: searchTerm,
    role: roleFilter,
    status: statusFilter || undefined,
  });

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, roleFilter, statusFilter]);

  // Calculate pagination
  const totalUsers = users.length;
  const totalPages = Math.ceil(totalUsers / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedUsers = users.slice(startIndex, endIndex);

  // Generate page numbers for pagination UI
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  useEffect(() => {
    // Fetch departments for the form
    const fetchDepartments = async () => {
      try {
        // Get college ID from current user
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        
        if (!currentUser?.email) {
          console.error('No user logged in');
          return;
        }

        // Try to get college ID from college_lecturers
        const { data: lecturerData } = await supabase
          .from('college_lecturers')
          .select('collegeId')
          .eq('email', currentUser.email)
          .maybeSingle();

        let collegeId = lecturerData?.collegeId;

        // If not found, try colleges table
        if (!collegeId) {
          const { data: collegeData } = await supabase
            .from('colleges')
            .select('id')
            .or(`email.eq.${currentUser.email},deanEmail.eq.${currentUser.email}`)
            .maybeSingle();
          
          collegeId = collegeData?.id;
        }

        // If still not found, get first college
        if (!collegeId) {
          const { data: firstCollege } = await supabase
            .from('colleges')
            .select('id')
            .limit(1)
            .maybeSingle();
          
          collegeId = firstCollege?.id;
        }

        if (!collegeId) {
          console.error('Could not determine college ID for departments');
          return;
        }

        // Fetch departments with the college ID
        const result = await departmentService.getDepartments(collegeId);
        if (result && Array.isArray(result)) {
          setDepartments(result.map(d => ({ id: d.id, name: d.name })));
        }
      } catch (error) {
        console.error('Error fetching departments:', error);
      }
    };
    fetchDepartments();
  }, []);

  const handleAddUser = () => {
    setSelectedUser(null);
    setIsModalOpen(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleSubmitUser = async (userData: Partial<User>) => {
    const result = await (selectedUser 
      ? updateUser(selectedUser.id, userData)
      : createUser(userData)
    );
    
    if (result.success) {
      if (!selectedUser && result.data?.metadata?.temporary_password) {
        setSuccessMessage(
          `User created successfully!\n\nEmail: ${result.data.email}\nTemporary Password: ${result.data.metadata.temporary_password}\n\nPlease save this password and share it with the user.`
        );
      } else {
        setSuccessMessage(selectedUser ? 'User updated successfully!' : 'User created successfully!');
      }
      setTimeout(() => setSuccessMessage(null), 10000);
    }
    
    return result;
  };

  const handleDeactivateUser = async (userId: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Deactivate User",
      message: "Are you sure you want to deactivate this user? They will no longer be able to access the system.",
      variant: "danger",
      onConfirm: async () => {
        const result = await deactivateUser(userId);
        if (result.success) {
          setSuccessMessage('User deactivated successfully');
          setTimeout(() => setSuccessMessage(null), 5000);
        } else {
          setSuccessMessage(`Error: ${result.error}`);
          setTimeout(() => setSuccessMessage(null), 5000);
        }
      },
    });
  };

  const handleResetPassword = async (userId: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Reset Password",
      message: "Generate a new temporary password for this user? The new password will be displayed after confirmation.",
      variant: "warning",
      onConfirm: async () => {
        const result = await resetPassword(userId);
        if (result.success) {
          setSuccessMessage('Password reset successfully! Check the console for the new temporary password.');
          setTimeout(() => setSuccessMessage(null), 5000);
        } else {
          setSuccessMessage(`Error: ${result.error}`);
          setTimeout(() => setSuccessMessage(null), 5000);
        }
      },
    });
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-6 border border-blue-100">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
          User & Profile Management
        </h1>
        <p className="text-gray-600 text-sm sm:text-base">
          Manage staff and student profiles with role permissions
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-800">Database Error</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
              {error.includes('406') || error.includes('relation') || error.includes('does not exist') ? (
                <div className="mt-3 text-sm text-red-700">
                  <p className="font-medium">It looks like the database tables haven't been created yet.</p>
                  <p className="mt-2">To fix this:</p>
                  <ol className="list-decimal list-inside mt-1 space-y-1">
                    <li>Go to your Supabase Dashboard → SQL Editor</li>
                    <li>Run the migration from: <code className="bg-red-100 px-1 rounded">database/migrations/college_dashboard_modules.sql</code></li>
                    <li>Refresh this page</li>
                  </ol>
                  <p className="mt-2">
                    See <code className="bg-red-100 px-1 rounded">QUICK_START_COLLEGE_DASHBOARD.md</code> for detailed instructions.
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-green-800">Success</h3>
              <pre className="mt-1 text-sm text-green-700 whitespace-pre-wrap font-mono">{successMessage}</pre>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Users ({totalUsers})
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Showing {startIndex + 1}-{Math.min(endIndex, totalUsers)} of {totalUsers}
            </p>
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
              <ArrowUpTrayIcon className="h-5 w-5" />
              Bulk Import
            </button>
            <button 
              onClick={handleAddUser}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <PlusCircleIcon className="h-5 w-5" />
              Add User
            </button>
          </div>
        </div>

        <div className="mb-4 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Roles</option>
            <option value="College Admin">College Admin</option>
            <option value="HoD">HoD</option>
            <option value="Faculty">Faculty</option>
            <option value="Lecturer">Lecturer</option>
            <option value="Exam Cell">Exam Cell</option>
            <option value="Finance Admin">Finance Admin</option>
            <option value="Placement Officer">Placement Officer</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="10">10 per page</option>
            <option value="25">25 per page</option>
            <option value="50">50 per page</option>
            <option value="100">100 per page</option>
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No users found</p>
            <button
              onClick={handleAddUser}
              className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
            >
              Add your first user
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                      Roles
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                      ID
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginatedUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {user.name || 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {user.email || 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        <div className="flex flex-wrap gap-1">
                          {(user.roles || []).map((role, idx) => (
                            <span
                              key={`${role}-${idx}`}
                              className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium"
                            >
                              {role}
                            </span>
                          ))}
                          {(!user.roles || user.roles.length === 0) && (
                            <span className="text-gray-400 italic text-xs">No roles</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {user.employee_id || user.student_id || '-'}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            user.status === "active"
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {user.status || 'active'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleEditUser(user)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded transition"
                            title="Edit user"
                          >
                            <PencilSquareIcon className="h-5 w-5" />
                          </button>
                          <button 
                            onClick={() => handleResetPassword(user.id)}
                            className="p-1 text-purple-600 hover:bg-purple-50 rounded transition"
                            title="Reset password"
                          >
                            <KeyIcon className="h-5 w-5" />
                          </button>
                          <button 
                            onClick={() => handleDeactivateUser(user.id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded transition"
                            title="Deactivate user"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>
                    Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                    <span className="font-medium">{Math.min(endIndex, totalUsers)}</span> of{' '}
                    <span className="font-medium">{totalUsers}</span> results
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    First
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    Previous
                  </button>

                  <div className="flex items-center gap-1">
                    {getPageNumbers().map((page, idx) => (
                      page === '...' ? (
                        <span key={`ellipsis-${idx}`} className="px-2 text-gray-400">...</span>
                      ) : (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page as number)}
                          className={`px-3 py-1.5 text-sm rounded-lg transition ${
                            currentPage === page
                              ? 'bg-blue-600 text-white font-medium'
                              : 'border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      )
                    ))}
                  </div>

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    Next
                  </button>
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    Last
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <UserFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmitUser}
        user={selectedUser}
        departments={departments}
      />

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        variant={confirmModal.variant}
      />
    </div>
  );
};

export default UserManagement;
