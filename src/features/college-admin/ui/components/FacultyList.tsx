import * as Dialog from "@radix-ui/react-dialog";
import React, { useState, useEffect, useRef } from "react";
import { Search, Eye, CheckCircle, Clock, XCircle, FileText } from "lucide-react";
import { apiPost } from '@/shared/api/apiClient';
import { getLogger } from '@/shared/config/logging';

import { FacultyDocumentViewerModal } from '@/features/college-admin';


const logger = getLogger('college-admin:FacultyList');
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
  credentials_email_status?: 'not_sent' | 'sending' | 'sent' | 'failed';
  credentials_email_attempted_at?: string;
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

const credentialEligible = (member: Faculty) => {
  const roles = [member.metadata?.role, ...(Array.isArray(member.metadata?.roles) ? member.metadata.roles : []), member.designation];
  return !roles.some(role => typeof role === 'string' && ['college_admin', 'college admin'].includes(role.toLowerCase()));
};

interface FacultyListProps {
  collegeId: string | null;
  revision?: number;
  onChanged?: () => void;
  onAdd?: () => void;
}

const FacultyList: React.FC<FacultyListProps> = ({ collegeId, revision, onChanged, onAdd }) => {
  const opener = useRef<HTMLButtonElement | null>(null);
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [filteredFaculty, setFilteredFaculty] = useState<Faculty[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [statusError, setStatusError] = useState("");
  const [clockNow, setClockNow] = useState(Date.now);
  const [localRetryAt, setLocalRetryAt] = useState<Record<string, number>>({});
  const [adminRetryAt, setAdminRetryAt] = useState(0);
  const [credentialsSending, setCredentialsSending] = useState(false);
  const [confirmCredentials, setConfirmCredentials] = useState(false);
  const [credentialsNotice, setCredentialsNotice] = useState("");
  const [credentialsError, setCredentialsError] = useState("");
  const [notice, setNotice] = useState("");
  const [selectedFaculty, setSelectedFaculty] = useState<Faculty | null>(null);

  useEffect(() => {
    const timer = window.setInterval(() => setClockNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const cooldown = (member: Faculty) => Math.max(0, Math.ceil((Math.max(adminRetryAt, localRetryAt[member.id] ?? 0, (Date.parse(member.credentials_email_attempted_at ?? '') || 0) + 60_000) - clockNow) / 1000));

  // Document viewer modal state
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [selectedFacultyForDocs, setSelectedFacultyForDocs] = useState<Faculty | null>(null);

  useEffect(() => {
    void loadFaculty();
  }, [collegeId, revision]);

  useEffect(() => {
    filterFaculty();
  }, [searchTerm, statusFilter, faculty]);

  const loadFaculty = async () => {
    if (!collegeId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const result = await apiPost<{ data: Faculty[] }>('/college-admin/faculty', {
        action: 'get-lecturers',
        college_id: collegeId,
      });

      if (!Array.isArray(result.data)) throw new Error("Invalid faculty response");
      setFaculty(result.data);
    } catch (error) {
      logger.error('Error in loadFaculty', error as Error);
      setError('Could not load faculty. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filterFaculty = () => {
    let filtered = faculty;

    const query = searchTerm.trim().toLowerCase();
    if (query) {
      filtered = filtered.filter(
        (f) =>
          `${f.first_name ?? ""} ${f.last_name ?? ""}`.toLowerCase().includes(query) ||
          f.last_name?.toLowerCase().includes(query) ||
          f.employeeId?.toLowerCase().includes(query) ||
          f.email?.toLowerCase().includes(query) ||
          f.department?.toLowerCase().includes(query)
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
    if (saving) return;
    setSaving(true);
    setStatusError("");
    try {
      await apiPost('/college-admin/faculty', {
        action: 'update-faculty-status',
        id: facultyId,
        account_status: newStatus,
      });
      await loadFaculty();
      onChanged?.();
      setNotice("Faculty status updated.");
      setSelectedFaculty(null);
    } catch (err) {
      logger.error('Error updating faculty status', err as Error);
      setStatusError('Could not update the status. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const resendCredentials = async () => {
    if (!selectedFaculty || credentialsSending || cooldown(selectedFaculty) > 0 || !credentialEligible(selectedFaculty)) return;
    setCredentialsSending(true);
    setLocalRetryAt(current => ({ ...current, [selectedFaculty.id]: Date.now() + 60_000 }));
    setCredentialsError('');
    setCredentialsNotice('');
    try {
      const result = await apiPost<{ data: { emailStatus: 'sent' | 'failed'; email: string; attemptedAt?: string; statusSaved?: boolean } }>('/college-admin/faculty-credentials', { facultyId: selectedFaculty.id });
      setSelectedFaculty(current => current ? { ...current, credentials_email_status: result.data.emailStatus, credentials_email_attempted_at: result.data.attemptedAt ?? new Date().toISOString() } : null);
      setConfirmCredentials(false);
      if (result.data.emailStatus === 'sent') setCredentialsNotice(`New credentials emailed to ${result.data.email}. The previous password no longer works.`);
      else setCredentialsError('The password was changed, but email delivery could not be confirmed. Wait one minute, then resend credentials.');
      if (result.data.statusSaved === false) setCredentialsNotice(current => `${current} Email status could not be saved; the displayed delivery result is current.`.trim());
      void loadFaculty();
    } catch (error) {
      const failure = error as { status?: number; code?: string };
      if (failure.status === 429) {
        setLocalRetryAt(current => ({ ...current, [selectedFaculty.id]: Date.now() + 60_000 }));
        if (failure.code === 'RESET_RATE_LIMITED') setAdminRetryAt(Date.now() + 300_000);
        setSelectedFaculty(current => current ? { ...current, credentials_email_attempted_at: new Date().toISOString() } : null);
      }
      setCredentialsError(error instanceof Error ? error.message : 'Could not send credentials. Please try again.');
    } finally { setCredentialsSending(false); }
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
    <div className="min-w-0 space-y-6 p-4 sm:p-6">
      {notice && <p role="status" className="rounded-lg bg-green-50 p-3 text-green-800">{notice}</p>}
      {/* Header Section */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Faculty</h2>
        <p className="text-gray-600 text-sm">View and manage all faculty in your college</p>
      </div>

      {/* Faculty List Section */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Faculty List</h2>
            <div className="flex min-w-0 flex-col gap-3 sm:flex-row">
              <div className="relative min-w-0">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  aria-label="Search faculty by name, email, ID or department"
                  placeholder="Name, email, ID or department"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-full sm:w-64"
                />
              </div>
              <select
                aria-label="Filter faculty by status"
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
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
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
        {error ? (<div role="alert" className="p-6 text-red-800">{error} <button type="button" onClick={() => void loadFaculty()} className="font-semibold underline">Try again</button></div>) : loading ? (
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
            <p className="font-semibold text-gray-900">{searchTerm.trim() || statusFilter !== 'all' ? 'No faculty match your filters' : 'No faculty yet'}</p>
            <p className="mt-2 text-sm text-gray-600">{searchTerm.trim() || statusFilter !== 'all' ? 'Try a different name or clear your filters.' : 'Add your first faculty member to get started.'}</p>
            {searchTerm.trim() || statusFilter !== 'all' ? <button type="button" className="mt-3 rounded-lg bg-indigo-600 px-4 py-2 text-white" onClick={() => {setSearchTerm(''); setStatusFilter('all');}}>Clear filters</button> : onAdd && <button type="button" className="mt-3 rounded-lg bg-indigo-600 px-4 py-2 text-white" onClick={onAdd}>Add faculty</button>}
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
                          onClick={event => { opener.current = event.currentTarget; setStatusError(""); setConfirmCredentials(false); setCredentialsNotice(""); setCredentialsError(""); setSelectedFaculty(member); }}
                          className="text-indigo-600 hover:text-indigo-900 flex items-center gap-1 px-2 py-1 rounded hover:bg-indigo-50 transition-colors"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </button>
                        {credentialEligible(member) && <button type="button" disabled={member.accountStatus !== 'active' || cooldown(member) > 0}
                          onClick={event => { opener.current = event.currentTarget; setStatusError(''); setCredentialsError(''); setCredentialsNotice(''); setConfirmCredentials(true); setSelectedFaculty(member); }}
                          className="rounded px-2 py-1 text-left text-indigo-700 hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-50"
                          aria-label={`Resend credentials to ${member.first_name ?? ''} ${member.last_name ?? ''}`}>
                          {cooldown(member) > 0 ? `Resend in ${cooldown(member)}s` : 'Resend credentials'}
                        </button>}
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
        <Dialog.Root open onOpenChange={open => { if (!open && !saving && !credentialsSending) setSelectedFaculty(null); }}>
          <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[100] bg-black/50" />
          <Dialog.Content onCloseAutoFocus={event => { event.preventDefault(); opener.current?.focus(); }} aria-modal="true" aria-describedby={undefined} className="fixed left-1/2 top-1/2 z-[101] max-h-[90dvh] w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl bg-white">
            <div className="sticky top-0 z-10 border-b border-gray-200 bg-white p-6">
              <div className="flex justify-between items-start">
                <div>
                  <Dialog.Title className="break-words text-xl font-bold text-gray-900">
                    {selectedFaculty.first_name || ''} {selectedFaculty.last_name || ''}
                  </Dialog.Title>
                  <p className="text-sm text-gray-600">
                    {selectedFaculty.employeeId || <span className="text-gray-400 italic">ID not assigned</span>}
                  </p>
                </div>
                <button
                  aria-label="Close faculty details"
                  disabled={saving || credentialsSending}
                  onClick={() => setSelectedFaculty(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="break-words p-4 sm:p-6 space-y-6">
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

              <section aria-label="Credential email" className="rounded-lg border border-indigo-100 bg-indigo-50 p-4">
                <h4 className="mb-2 font-semibold text-gray-900">Login credentials</h4>
                <p className="text-sm text-gray-700">{selectedFaculty.credentials_email_status === 'sent' ? 'The latest credential email was sent.' : selectedFaculty.credentials_email_status === 'failed' ? 'The last credential delivery attempt failed.' : selectedFaculty.credentials_email_status === 'sending' ? 'A recent credential email attempt is in progress. Refresh the list for its latest status.' : 'No credential email has been recorded.'}</p>
                {credentialsNotice && <p role="status" className="mt-3 text-sm text-green-800">{credentialsNotice}</p>}
                {credentialsError && <p role="alert" className="mt-3 text-sm text-red-800">{credentialsError}</p>}
                {!credentialEligible(selectedFaculty) ? <p className="mt-3 text-sm text-gray-600">Credential resets here are available for educators. College administrators can use Forgot password on the sign-in page.</p> : confirmCredentials ? <div className="mt-3 space-y-3">
                  <p className="text-sm text-gray-800">This replaces the educator’s password and signs them out of all sessions. New credentials will be sent to their account email. Continue?</p>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" disabled={credentialsSending || saving || cooldown(selectedFaculty) > 0} onClick={() => void resendCredentials()} className="rounded-lg bg-indigo-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">{credentialsSending ? 'Sending…' : 'Reset password and email credentials'}</button>
                    <button type="button" disabled={credentialsSending} onClick={() => setConfirmCredentials(false)} className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm">Cancel</button>
                  </div>
                </div> : <button type="button" disabled={selectedFaculty.accountStatus !== 'active' || saving || cooldown(selectedFaculty) > 0} onClick={() => setConfirmCredentials(true)} className="mt-3 rounded-lg bg-indigo-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">{cooldown(selectedFaculty) > 0 ? `Resend in ${cooldown(selectedFaculty)}s` : 'Resend credentials'}</button>}
                {credentialEligible(selectedFaculty) && cooldown(selectedFaculty) > 0 && <p className="mt-2 text-sm text-gray-600">You can resend credentials in {cooldown(selectedFaculty)} seconds.</p>}
              </section>

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
                {statusError && <p role="alert" className="mb-3 text-red-700">{statusError}</p>}
                {saving && <p role="status">Saving status…</p>}
                <div className="flex flex-wrap gap-2">
                  {["active", "deactivated", "pending", "suspended"].map((status) => (
                    <button
                      key={status}
                      disabled={saving || credentialsSending || selectedFaculty.accountStatus === status}
                      aria-pressed={selectedFaculty.accountStatus === status}
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
          </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
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
