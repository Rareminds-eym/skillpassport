import React, { useState, useEffect } from "react";
import { Search, Eye, CheckCircle, Clock, XCircle, FileText } from "lucide-react";
import { supabase } from "../../../../lib/supabaseClient";
import { useAuth } from "../../../../context/AuthContext";
import FacultyDocumentViewerModal from "../../../../components/admin/modals/FacultyDocumentViewerModal";

interface Faculty {
  id: string;
  userId?: string;
  collegeId: string;
  employeeId?: string;
  department?: string;
  specialization?: string;
  qualification?: string;
  experienceYears?: number;
  dateOfJoining?: string;
  accountStatus: string;
  createdAt: string;
  updatedAt: string;
  // New separate columns from migration
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  date_of_birth?: string;
  gender?: string;
  designation?: string;
  subject_expertise?: any[];
  temporary_password?: string;
  password_created_at?: string;
  created_by?: string;
  verification_status?: string;
  verified_by?: string;
  verified_at?: string;
  degree_certificate_url?: string;
  id_proof_url?: string;
  experience_letters_url?: any[];
  // Keep metadata for backward compatibility
  metadata?: {
    [key: string]: any;
  };
}

interface FacultyListProps {
  collegeId: string | null;
}

const FacultyList: React.FC<FacultyListProps> = ({ collegeId }) => {
  const { user } = useAuth();
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [filteredFaculty, setFilteredFaculty] = useState<Faculty[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [selectedFaculty, setSelectedFaculty] = useState<Faculty | null>(null);
  
  // Document viewer modal state
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [selectedFacultyForDocs, setSelectedFacultyForDocs] = useState<Faculty | null>(null);

  useEffect(() => {
    if (collegeId) {
      loadFaculty();
    }
  }, [collegeId]);

  useEffect(() => {
    filterFaculty();
  }, [searchTerm, statusFilter, faculty]);

  const loadFaculty = async () => {
    if (!collegeId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("college_lecturers")
        .select("*")
        .eq("collegeId", collegeId)
        .order("createdAt", { ascending: false });

      if (error) {
        console.error('Error loading faculty:', error);
      } else if (data) {
        setFaculty(data);
      }
    } catch (error) {
      console.error('Error in loadFaculty:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterFaculty = () => {
    let filtered = faculty;

    if (searchTerm) {
      filtered = filtered.filter(
        (f) =>
          f.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          f.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          f.employeeId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          f.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          f.department?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((f) => f.accountStatus === statusFilter);
    }

    setFilteredFaculty(filtered);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; icon: any; label: string }> = {
      active: { color: "bg-green-100 text-green-800", icon: CheckCircle, label: "Active" },
      deactivated: { color: "bg-gray-100 text-gray-800", icon: XCircle, label: "Deactivated" },
      pending: { color: "bg-yellow-100 text-yellow-800", icon: Clock, label: "Pending" },
      suspended: { color: "bg-red-100 text-red-800", icon: XCircle, label: "Suspended" },
    };

    const config = statusConfig[status] || statusConfig.active;
    const Icon = config.icon;

    return (
      <span
        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${config.color}`}
      >
        <Icon className="h-3 w-3" />
        {config.label}
      </span>
    );
  };

  const getVerificationBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; label: string }> = {
      verified: { color: "bg-green-100 text-green-800", label: "Verified" },
      pending: { color: "bg-yellow-100 text-yellow-800", label: "Pending" },
      rejected: { color: "bg-red-100 text-red-800", label: "Rejected" },
    };

    const config = statusConfig[status] || statusConfig.pending;

    return (
      <span
        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}
      >
        {config.label}
      </span>
    );
  };

  const updateFacultyStatus = async (facultyId: string, newStatus: string) => {
    const { error } = await supabase
      .from("college_lecturers")
      .update({ accountStatus: newStatus })
      .eq("id", facultyId);

    if (!error) {
      loadFaculty();
      setSelectedFaculty(null);
    } else {
      console.error('Error updating faculty status:', error);
    }
  };

  const handleViewDocuments = (faculty: Faculty) => {
    setSelectedFacultyForDocs(faculty);
    setShowDocumentModal(true);
  };

  const handleCloseDocumentModal = () => {
    setShowDocumentModal(false);
    setSelectedFacultyForDocs(null);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header Section */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Faculty</h1>
        <p className="text-gray-600 text-sm">View and manage all faculty in your college</p>
      </div>

      {/* Faculty List Section */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Faculty List</h2>
            <div className="flex gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search faculty..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-64"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="deactivated">Deactivated</option>
                <option value="pending">Pending</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-5 gap-4">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">All</p>
              <p className="text-2xl font-bold text-gray-900">{faculty.length}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Pending</p>
              <p className="text-2xl font-bold text-gray-900">
                {faculty.filter(f => f.accountStatus === 'pending').length}
              </p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Deactivated</p>
              <p className="text-2xl font-bold text-gray-900">
                {faculty.filter(f => f.accountStatus === 'deactivated').length}
              </p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Suspended</p>
              <p className="text-2xl font-bold text-gray-900">
                {faculty.filter(f => f.accountStatus === 'suspended').length}
              </p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Active</p>
              <p className="text-2xl font-bold text-gray-900">
                {faculty.filter(f => f.accountStatus === 'active').length}
              </p>
            </div>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p className="mt-2 text-gray-600 text-sm">Loading faculty...</p>
          </div>
        ) : !collegeId ? (
          <div className="text-center py-12">
            <p className="text-gray-900 font-semibold">No College Found</p>
            <p className="text-gray-600 text-sm mt-2">
              Your account is not linked to any college.
            </p>
          </div>
        ) : filteredFaculty.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-sm">No faculty found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Faculty ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subjects
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Verification
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredFaculty.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {member.employeeId || <span className="text-gray-400 italic">Not assigned</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {member.first_name || ''} {member.last_name || ''}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {member.email || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        member.designation === 'college_admin' ? 'bg-indigo-100 text-indigo-800' :
                        member.designation === 'dean' ? 'bg-purple-100 text-purple-800' :
                        member.designation === 'hod' ? 'bg-blue-100 text-blue-800' :
                        member.designation === 'professor' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {member.designation === 'college_admin' ? 'College Admin' :
                         member.designation === 'dean' ? 'Dean' :
                         member.designation === 'hod' ? 'HOD' :
                         member.designation === 'professor' ? 'Professor' :
                         member.designation === 'assistant_professor' ? 'Asst. Professor' :
                         member.designation || 'Lecturer'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <div className="flex flex-wrap gap-1">
                        {member.subject_expertise?.slice(0, 2).map((subject: any, idx: number) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded text-xs"
                          >
                            {typeof subject === 'string' ? subject : subject.name}
                          </span>
                        ))}
                        {member.subject_expertise && member.subject_expertise.length > 2 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                            +{member.subject_expertise.length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(member.accountStatus)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getVerificationBadge(member.verification_status || 'pending')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleViewDocuments(member)}
                          className="text-blue-600 hover:text-blue-900 flex items-center gap-1 px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                          title="View Documents"
                        >
                          <FileText className="h-4 w-4" />
                          Docs
                        </button>
                        <button 
                          onClick={() => setSelectedFaculty(member)}
                          className="text-indigo-600 hover:text-indigo-900 flex items-center gap-1 px-2 py-1 rounded hover:bg-indigo-50 transition-colors"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Faculty Detail Modal */}
      {selectedFaculty && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {selectedFaculty.first_name || ''} {selectedFaculty.last_name || ''}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {selectedFaculty.employeeId || <span className="text-gray-400 italic">ID not assigned</span>}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedFaculty(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Contact Info */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Contact Information</h4>
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="text-gray-600">Email:</span>{" "}
                    <span className="text-gray-900">{selectedFaculty.email || 'N/A'}</span>
                  </p>
                  <p>
                    <span className="text-gray-600">Phone:</span>{" "}
                    <span className="text-gray-900">{selectedFaculty.phone || "N/A"}</span>
                  </p>
                  <p>
                    <span className="text-gray-600">Department:</span>{" "}
                    <span className="text-gray-900">{selectedFaculty.department || "N/A"}</span>
                  </p>
                  <p>
                    <span className="text-gray-600">Specialization:</span>{" "}
                    <span className="text-gray-900">{selectedFaculty.specialization || "N/A"}</span>
                  </p>
                  <p>
                    <span className="text-gray-600">Qualification:</span>{" "}
                    <span className="text-gray-900">{selectedFaculty.qualification || "N/A"}</span>
                  </p>
                  <p>
                    <span className="text-gray-600">Experience:</span>{" "}
                    <span className="text-gray-900">{selectedFaculty.experienceYears || 0} years</span>
                  </p>
                  <p>
                    <span className="text-gray-600">Date of Joining:</span>{" "}
                    <span className="text-gray-900">{selectedFaculty.dateOfJoining ? new Date(selectedFaculty.dateOfJoining).toLocaleDateString() : "N/A"}</span>
                  </p>
                  <p>
                    <span className="text-gray-600">Verification Status:</span>{" "}
                    {getVerificationBadge(selectedFaculty.verification_status || 'pending')}
                  </p>
                  {selectedFaculty.verified_at && (
                    <p>
                      <span className="text-gray-600">Verified At:</span>{" "}
                      <span className="text-gray-900">{new Date(selectedFaculty.verified_at).toLocaleString()}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Login Credentials */}
              {selectedFaculty.temporary_password && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-semibold text-yellow-900 mb-3 flex items-center gap-2">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Login Credentials
                  </h4>
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="text-yellow-700 font-medium">Temporary Password:</span>{" "}
                      <code className="bg-yellow-100 px-2 py-1 rounded text-yellow-900 font-mono">
                        {selectedFaculty.temporary_password}
                      </code>
                    </p>
                    <p className="text-yellow-600 text-xs">
                      Created: {selectedFaculty.password_created_at ? new Date(selectedFaculty.password_created_at).toLocaleString() : 'N/A'}
                    </p>
                    <p className="text-yellow-600 text-xs mt-2">
                      ⚠️ Please share this password securely with the faculty member. They should change it after first login.
                    </p>
                  </div>
                </div>
              )}

              {/* Subject Expertise */}
              {selectedFaculty.subject_expertise && selectedFaculty.subject_expertise.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Subject Expertise</h4>
                  <div className="space-y-2">
                    {selectedFaculty.subject_expertise?.map((subject: any, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <span className="font-medium text-gray-900">
                          {typeof subject === 'string' ? subject : subject.name}
                        </span>
                        {typeof subject === 'object' && (
                          <div className="flex items-center gap-3 text-sm">
                            <span className="text-gray-600 capitalize">{subject.proficiency}</span>
                            <span className="text-gray-500">{subject.years_experience} years</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Status Update */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Update Status</h4>
                <div className="flex gap-2">
                  {["active", "deactivated", "pending", "suspended"].map((status) => (
                    <button
                      key={status}
                      onClick={() => updateFacultyStatus(selectedFaculty.id, status)}
                      className={`px-4 py-2 rounded-lg font-medium transition ${
                        selectedFaculty.accountStatus === status
                          ? "bg-indigo-600 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Faculty Document Viewer Modal */}
      <FacultyDocumentViewerModal
        isOpen={showDocumentModal}
        onClose={handleCloseDocumentModal}
        facultyData={selectedFacultyForDocs ? {
          name: `${selectedFacultyForDocs.first_name || ''} ${selectedFacultyForDocs.last_name || ''}`.trim(),
          email: selectedFacultyForDocs.email || '',
          employeeId: selectedFacultyForDocs.employeeId || selectedFacultyForDocs.id,
          metadata: {
            degree_certificate_url: selectedFacultyForDocs.degree_certificate_url,
            id_proof_url: selectedFacultyForDocs.id_proof_url,
            experience_letters_url: selectedFacultyForDocs.experience_letters_url
          }
        } : null}
      />
    </div>
  );
};

export default FacultyList;
