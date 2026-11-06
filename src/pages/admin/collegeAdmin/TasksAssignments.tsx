import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  ClipboardList,
  Search,
  Users,
  CheckCircle2,
  Clock,
  Award,
  Calendar,
  Building2,
  BookOpen,
  GraduationCap,
  RefreshCw,
  AlertCircle,
  FileText,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  ExternalLink,
  Download,
  X,
  Sparkles,
  Link as LinkIcon
} from "lucide-react";
import { useUser } from "@/shared/model/authStore";
import { apiPost } from "@/shared/api/apiClient";
import { getDocumentUrl } from "@/shared/api";
import { ssoClient } from "@/shared/api/ssoClient";
import { getLogger } from "@/shared/config/logging";
import toast from 'react-hot-toast';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/shared/ui';
import {
  fetchCollegeAllAssignments,
  type CollegeAssignmentItem,
  type CollegeAssignmentsMetrics,
  type CollegeLearnerEvaluation
} from "@/features/college-admin";

const logger = getLogger("college-admin:TasksAssignments");

const TASK_STATUS_STYLES: Record<string, string> = {
  graded: "bg-emerald-50 text-emerald-700 border-emerald-200",
  submitted: "bg-blue-50 text-blue-700 border-blue-200",
  "in-progress": "bg-amber-50 text-amber-700 border-amber-200",
  todo: "bg-gray-50 text-gray-600 border-gray-200",
};

function formatDate(dateStr?: string | null) {
  if (!dateStr) return "—";
  const d = dateStr.includes("T") ? new Date(dateStr) : new Date(dateStr + "T00:00:00");
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

interface ReadOnlyLearnerListProps {
  learners: CollegeLearnerEvaluation[];
  totalPoints: number;
  educatorType: "internal" | "external";
  educatorRoleLabel: string;
  onOpenFile: (fileUrl: string) => void;
}

function ReadOnlyLearnerList({
  learners,
  totalPoints,
  educatorType,
  educatorRoleLabel,
  onOpenFile,
}: ReadOnlyLearnerListProps) {
  if (!learners || learners.length === 0) {
    return (
      <p className="text-xs text-gray-500 text-center py-4 bg-gray-50 rounded-lg">
        No learners assigned to this task yet.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {learners.map((learner) => {
        const isGraded =
          learner.status === "graded" ||
          (learner.grade_percentage !== null && learner.grade_percentage !== undefined);

        return (
          <div
            key={learner.id}
            className="p-3.5 rounded-xl border border-gray-200 bg-gray-50/70 space-y-2.5 transition hover:bg-white hover:border-gray-300"
          >
            {/* Header: Learner Name, Email, Status & Grade */}
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-xs text-gray-900">
                  {learner.learner_name}
                </p>
                <p className="text-[11px] text-gray-500">
                  {learner.learner_email || (learner.roll_number ? `Roll: ${learner.roll_number}` : "—")}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-0.5 text-[11px] font-semibold rounded-full border ${
                    TASK_STATUS_STYLES[learner.status] || TASK_STATUS_STYLES.todo
                  }`}
                >
                  {learner.status === "graded"
                    ? "Graded"
                    : learner.status === "submitted"
                    ? "Submitted (Pending Evaluation)"
                    : learner.status === "in-progress"
                    ? "In Progress"
                    : "Not Submitted"}
                </span>

                {isGraded && (
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {learner.grade_received !== null && learner.grade_received !== undefined
                      ? `${learner.grade_received} / ${totalPoints || 100} (${Math.round(learner.grade_percentage || 0)}%)`
                      : `${Math.round(learner.grade_percentage || 0)}%`}
                  </span>
                )}
              </div>
            </div>

            {/* Submitted attachments if any */}
            {learner.submission_files && learner.submission_files.length > 0 && (
              <div className="pt-1">
                <p className="text-[11px] font-medium text-gray-500 mb-1">
                  Submitted Attachments:
                </p>
                <div className="flex flex-wrap gap-2">
                  {learner.submission_files.map((file, idx) => {
                    const fileName = file.name || "Answer_Sheet";
                    return (
                      <button
                        key={idx}
                        onClick={() => file.url && onOpenFile(file.url)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition cursor-pointer"
                      >
                        <FileText className="h-3.5 w-3.5 text-blue-500" />
                        <span className="truncate max-w-[200px]">{fileName}</span>
                        <ExternalLink className="h-3 w-3 text-blue-400" />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Submitted Link / URL if any */}
            {learner.submission_url && (
              <div className="pt-1">
                <p className="text-[11px] font-medium text-gray-500 mb-1">
                  Submitted Link:
                </p>
                <div className="flex flex-wrap gap-2">
                  <a
                    href={learner.submission_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-purple-700 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition cursor-pointer"
                  >
                    <LinkIcon className="h-3.5 w-3.5 text-purple-600" />
                    <span className="truncate max-w-[280px]">{learner.submission_url}</span>
                    <ExternalLink className="h-3 w-3 text-purple-400" />
                  </a>
                </div>
              </div>
            )}

            {/* Trainer / Educator Feedback (Read-Only) */}
            {learner.instructor_feedback ? (
              <div className="p-2.5 rounded-lg bg-purple-50/80 border border-purple-100 text-xs">
                <div className="flex items-center gap-1.5 font-semibold text-purple-800 text-[11px] mb-1">
                  <MessageSquare className="h-3.5 w-3.5 text-purple-600" />
                  <span className="flex items-center gap-1">
                    {educatorType === "external" ? (
                      <>
                        <Sparkles className="h-3 w-3 text-purple-600 inline" />
                        <span>RareMinds Trainer Feedback:</span>
                      </>
                    ) : (
                      <>
                        <GraduationCap className="h-3 w-3 text-blue-600 inline" />
                        <span>Faculty Feedback:</span>
                      </>
                    )}
                  </span>
                  {learner.feedback_date && (
                    <span className="text-[10px] font-normal text-gray-500 ml-auto">
                      {formatDate(learner.feedback_date)}
                    </span>
                  )}
                </div>
                <p className="text-purple-900 text-xs italic">
                  &ldquo;{learner.instructor_feedback}&rdquo;
                </p>
              </div>
            ) : isGraded ? (
              <p className="text-[11px] text-gray-400 italic">No written feedback provided.</p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

export default function TasksAssignments() {
  const user = useUser();
  const [collegeId, setCollegeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  // Data
  const [assignments, setAssignments] = useState<CollegeAssignmentItem[]>([]);
  const [metrics, setMetrics] = useState<CollegeAssignmentsMetrics>({
    totalAssignments: 0,
    internalAssignmentsCount: 0,
    externalAssignmentsCount: 0,
    totalSubmissions: 0,
    totalGraded: 0,
    pendingReviews: 0,
  });

  // Filters
  const [educatorTypeFilter, setEducatorTypeFilter] = useState<"all" | "internal" | "external">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Track expanded tasks (accordion state)
  const [expandedTaskIds, setExpandedTaskIds] = useState<Record<string, boolean>>({});

  const toggleTaskExpansion = (taskId: string) => {
    setExpandedTaskIds((prev) => ({
      ...prev,
      [taskId]: !prev[taskId],
    }));
  };

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

  // 1. Resolve College ID
  const resolveCollegeId = useCallback(async () => {
    if (user?.user_metadata?.college_id) {
      setCollegeId(user.user_metadata.college_id);
      return user.user_metadata.college_id;
    }
    if (user?.user_metadata?.organization_id) {
      setCollegeId(user.user_metadata.organization_id);
      return user.user_metadata.organization_id;
    }

    try {
      const result = await apiPost<{ data?: { college_id?: string } }>('/college-admin/faculty', {
        action: 'resolve-user-college',
        user_id: user?.id,
        email: user?.email,
      });

      if (result.data?.college_id) {
        setCollegeId(result.data.college_id);
        return result.data.college_id;
      }
    } catch (err) {
      logger.error('Failed to resolve college ID', err as Error);
    }
    return null;
  }, [user?.id, user?.email, user?.user_metadata]);

  // 2. Fetch Assignments
  const loadAssignments = useCallback(async (cId?: string, isRefresh = false) => {
    const targetCollegeId = cId || collegeId;
    if (!targetCollegeId) return;

    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError("");

    try {
      const res = await fetchCollegeAllAssignments({
        college_id: targetCollegeId,
        educator_type: educatorTypeFilter === "all" ? undefined : educatorTypeFilter,
      });

      if (res.error) {
        setError(res.error);
      } else if (res.data) {
        const list = res.data.assignments || [];
        setAssignments(list);
        if (res.data.metrics) {
          setMetrics(res.data.metrics);
        }
        // Auto-expand the first task if available
        if (list.length > 0) {
          setExpandedTaskIds((prev) => ({
            ...prev,
            [list[0].assignment_id]: true,
          }));
        }
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load tasks");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [collegeId, educatorTypeFilter]);

  useEffect(() => {
    let alive = true;
    void (async () => {
      const cid = await resolveCollegeId();
      if (alive && cid) {
        void loadAssignments(cid);
      } else if (alive) {
        setLoading(false);
        setError("Could not resolve your college account.");
      }
    })();
    return () => {
      alive = false;
    };
  }, [resolveCollegeId]);

  // Re-fetch when educator filter changes
  useEffect(() => {
    if (collegeId) {
      void loadAssignments(collegeId);
    }
  }, [educatorTypeFilter, collegeId, loadAssignments]);

  // Handle authenticated file viewing
  const openSubmittedFile = async (fileUrl: string) => {
    try {
      const url = getDocumentUrl(fileUrl, 'inline');
      
      // Fetch with authentication using ssoClient
      const response = await ssoClient.fetch(url);
      
      if (!response.ok) {
        console.error('Failed to access file:', response.status);
        toast.error(`Failed to access file: ${response.status}`);
        return;
      }
      
      // Get the blob
      const blob = await response.blob();
      
      // Create object URL
      const blobUrl = URL.createObjectURL(blob);
      
      // Open in new tab
      window.open(blobUrl, '_blank');
      
      // Clean up blob URL after a delay
      setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
    } catch (e) {
      console.error('Error opening file:', e);
      toast.error('Failed to open file. Please try again.');
    }
  };

  // Derive department options
  const departmentOptions = useMemo(() => {
    const depts = new Set<string>();
    assignments.forEach((a) => {
      if (a.department_name) depts.add(a.department_name);
    });
    return Array.from(depts).sort();
  }, [assignments]);

  // Client-side filtering
  const filteredAssignments = useMemo(() => {
    return assignments.filter((item) => {
      // Educator filter
      if (educatorTypeFilter === "internal" && item.educator_type !== "internal") return false;
      if (educatorTypeFilter === "external" && item.educator_type !== "external") return false;

      // Department filter
      if (departmentFilter !== "all" && item.department_name !== departmentFilter) return false;

      // Status filter
      if (statusFilter !== "all" && item.status !== statusFilter) return false;

      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesTitle = item.title?.toLowerCase().includes(query);
        const matchesCourse =
          item.course_name?.toLowerCase().includes(query) ||
          item.course_code?.toLowerCase().includes(query);
        const matchesEducator =
          item.educator_name?.toLowerCase().includes(query) ||
          item.educator_email?.toLowerCase().includes(query);
        const matchesSection =
          item.section?.toLowerCase().includes(query) ||
          item.program_name?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesCourse && !matchesEducator && !matchesSection) return false;
      }

      return true;
    });
  }, [assignments, educatorTypeFilter, departmentFilter, statusFilter, searchTerm]);

  // Pagination calculations
  const totalItems = filteredAssignments.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedAssignments = filteredAssignments.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [educatorTypeFilter, searchTerm, departmentFilter, statusFilter]);

  // Scroll to top on page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Generate page numbers with ellipsis
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2.5">
            <ClipboardList className="h-7 w-7 text-blue-600" />
            Tasks & Assignments
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Monitor coursework, student submissions, grades, and written feedback across Internal Faculty & RareMinds External Trainers.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadAssignments(collegeId || undefined, true)}
          disabled={loading || refreshing}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin text-blue-600" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Metrics Cards - 5 Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex items-center gap-3">
          <div className="h-11 w-11 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0">
            <ClipboardList className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500">Total Tasks</p>
            <p className="text-xl font-bold text-gray-900 mt-0.5">{metrics.totalAssignments}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex items-center gap-3">
          <div className="h-11 w-11 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 flex-shrink-0">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500">Total Assigned</p>
            <p className="text-xl font-bold text-gray-900 mt-0.5">{metrics.totalAssigned || 0}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex items-center gap-3">
          <div className="h-11 w-11 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600 flex-shrink-0">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500">Submissions</p>
            <p className="text-xl font-bold text-gray-900 mt-0.5">{metrics.totalSubmissions}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex items-center gap-3">
          <div className="h-11 w-11 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 flex-shrink-0">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500">Graded & Evaluated</p>
            <p className="text-xl font-bold text-gray-900 mt-0.5">{metrics.totalGraded}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex items-center gap-3">
          <div className="h-11 w-11 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 flex-shrink-0">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500">Pending Review</p>
            <p className="text-xl font-bold text-gray-900 mt-0.5">{metrics.pendingReviews}</p>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Top Filter Tabs: All Tasks / Internal Faculty / RareMinds Trainers */}
        <div className="border-b border-gray-200 bg-gray-50/60 p-2 sm:p-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setEducatorTypeFilter("all")}
              className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all flex items-center gap-2 ${
                educatorTypeFilter === "all"
                  ? "bg-white text-blue-700 shadow-sm border border-gray-200"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              <ClipboardList className="h-4 w-4" />
              <span>All Tasks ({metrics.totalAssignments})</span>
            </button>

            <button
              type="button"
              onClick={() => setEducatorTypeFilter("internal")}
              className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all flex items-center gap-2 ${
                educatorTypeFilter === "internal"
                  ? "bg-white text-blue-700 shadow-sm border border-gray-200"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              <GraduationCap className="h-4 w-4 text-blue-600" />
              <span>Internal Faculty</span>
              <span className="text-xs px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-700 font-bold">
                {metrics.internalAssignmentsCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setEducatorTypeFilter("external")}
              className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all flex items-center gap-2 ${
                educatorTypeFilter === "external"
                  ? "bg-white text-purple-700 shadow-sm border border-gray-200"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              <Sparkles className="h-4 w-4 text-purple-600" />
              <span>RareMinds Trainers</span>
              <span className="text-xs px-1.5 py-0.2 rounded-full bg-purple-100 text-purple-700 font-bold">
                {metrics.externalAssignmentsCount}
              </span>
            </button>
          </div>
        </div>

        {/* Secondary Filter Bar */}
        <div className="p-4 border-b border-gray-200 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by task title, course, educator name..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Department Filter */}
            {departmentOptions.length > 0 && (
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Departments</option>
                {departmentOptions.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            )}

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="completed">Past Due / Completed</option>
            </select>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="m-4 p-3 rounded-lg bg-red-50 border border-red-200 flex items-center gap-2 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Tasks Grid / List */}
        <div className="p-4 sm:p-6">
          {loading ? (
            <div className="space-y-4 py-8">
              <div className="h-32 bg-gray-100 rounded-xl animate-pulse" />
              <div className="h-32 bg-gray-100 rounded-xl animate-pulse" />
              <div className="h-32 bg-gray-100 rounded-xl animate-pulse" />
            </div>
          ) : filteredAssignments.length === 0 ? (
            <div className="text-center py-12 px-4 space-y-3">
              <div className="h-12 w-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                <ClipboardList className="h-6 w-6" />
              </div>
              <h3 className="text-base font-semibold text-gray-900">No tasks found</h3>
              <p className="text-sm text-gray-500 max-w-sm mx-auto">
                {searchTerm || departmentFilter !== "all" || statusFilter !== "all"
                  ? "No tasks match your filter criteria. Try adjusting the search or filters."
                  : "No assignments have been created by internal faculty or RareMinds trainers yet."}
              </p>
            </div>
          ) : (
            <>
              {/* Showing X-Y of Z results */}
              <div className="mb-4 text-sm text-gray-600">
                Showing {startIndex + 1}-{Math.min(endIndex, totalItems)} of {totalItems} {totalItems === 1 ? 'task' : 'tasks'}
              </div>

              <div className="grid grid-cols-1 gap-5">
                {paginatedAssignments.map((task) => {
                const isExternal = task.educator_type === "external";
                const isExpanded = Boolean(expandedTaskIds[task.assignment_id]);
                const learners = task.learners || [];
                const stats = task.stats || {
                  totalAssigned: learners.length,
                  submittedCount: 0,
                  gradedCount: 0,
                  pendingCount: 0,
                };

                return (
                  <div
                    key={task.assignment_id}
                    className="border border-gray-200 rounded-xl p-5 hover:border-gray-300 hover:shadow-sm transition-all duration-200 bg-white space-y-4"
                  >
                    {/* Top Row: Title, Creator Badge, Type, Points */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-bold text-gray-900">
                            {task.title}
                          </h3>

                          {/* Creator Badge: Internal Faculty vs RareMinds Trainer */}
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              isExternal
                                ? "bg-purple-100 text-purple-700 border border-purple-200"
                                : "bg-blue-100 text-blue-700 border border-blue-200"
                            }`}
                          >
                            {isExternal ? (
                              <Sparkles className="h-3.5 w-3.5 text-purple-600" />
                            ) : (
                              <GraduationCap className="h-3.5 w-3.5 text-blue-600" />
                            )}
                            <span>{isExternal ? "RareMinds Trainer:" : "Faculty:"}</span>
                            <span className="font-bold">{task.educator_name}</span>
                          </span>

                          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-600 capitalize">
                            {task.assignment_type || "task"}
                          </span>

                          {task.total_points && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                              <Award className="h-3 w-3" />
                              {task.total_points} pts
                            </span>
                          )}
                        </div>

                        {task.course_name && (
                          <p className="text-xs font-medium text-blue-700">
                            Course: {task.course_name} {task.course_code ? `(${task.course_code})` : ""}
                          </p>
                        )}
                      </div>

                      {/* Status chip */}
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold self-start ${
                          task.status === "active"
                            ? "bg-green-100 text-green-700 border border-green-200"
                            : "bg-gray-100 text-gray-600 border border-gray-200"
                        }`}
                      >
                        {task.status === "active" ? "● Active" : "○ Completed"}
                      </span>
                    </div>

                    {/* Metadata tags: Department, Program, Section, Due Date */}
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      {task.department_name && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-50 text-slate-700 border border-slate-200">
                          <Building2 className="h-3.5 w-3.5 text-slate-500" />
                          {task.department_name}
                        </span>
                      )}

                      {task.program_name && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                          <BookOpen className="h-3.5 w-3.5 text-blue-500" />
                          {task.program_name}
                        </span>
                      )}

                      {task.section && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-green-50 text-green-700 border border-green-200 font-medium">
                          Section {task.section}{task.semester ? ` - Sem ${task.semester}` : ""}
                        </span>
                      )}

                      {task.due_date && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-red-50 text-red-700 border border-red-200">
                          <Calendar className="h-3.5 w-3.5 text-red-500" />
                          Due: {formatDate(task.due_date)}
                        </span>
                      )}
                    </div>

                    {/* Description preview if present */}
                    {task.description && (
                      <p className="text-xs text-gray-600 bg-gray-50/70 p-2.5 rounded-lg border border-gray-100">
                        {task.description}
                      </p>
                    )}

                    {/* Instruction Attachments (matching submission file chips) */}
                    {task.instruction_files && task.instruction_files.length > 0 && (
                      <div className="pt-1">
                        <p className="text-[11px] font-medium text-gray-500 mb-1">
                          Instruction Attachments:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {task.instruction_files.map((file, idx) => {
                            const fileName = file.name || `Instruction_File_${idx + 1}`;
                            return (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => file.url && openSubmittedFile(file.url)}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition cursor-pointer"
                              >
                                <FileText className="h-3.5 w-3.5 text-blue-500" />
                                <span className="truncate max-w-[220px]">{fileName}</span>
                                <ExternalLink className="h-3 w-3 text-blue-400" />
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Read-Only Submissions & Evaluations Section */}
                    <div className="pt-3 border-t border-gray-200">
                      <button
                        type="button"
                        onClick={() => toggleTaskExpansion(task.assignment_id)}
                        className="w-full flex items-center justify-between py-1.5 px-2 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
                      >
                        <span className="flex items-center gap-1.5">
                          <GraduationCap className="h-4 w-4 text-blue-600" />
                          <span>Learner Submissions & Evaluations ({learners.length})</span>
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-gray-400" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-gray-400" />
                        )}
                      </button>

                      {isExpanded && (
                        <div className="mt-3 pt-2">
                          <ReadOnlyLearnerList
                            learners={learners}
                            totalPoints={task.total_points || 100}
                            educatorType={task.educator_type}
                            educatorRoleLabel={task.educator_role_label}
                            onOpenFile={openSubmittedFile}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 border-t border-gray-200 pt-6">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                        className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>

                    {getPageNumbers().map((page, idx) => (
                      <PaginationItem key={idx}>
                        {page === '...' ? (
                          <PaginationEllipsis />
                        ) : (
                          <PaginationLink
                            onClick={() => handlePageChange(page as number)}
                            isActive={currentPage === page}
                            className="cursor-pointer"
                          >
                            {page}
                          </PaginationLink>
                        )}
                      </PaginationItem>
                    ))}

                    <PaginationItem>
                      <PaginationNext
                        onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
                        className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
          )}
        </div>
      </div>
    </div>
  );
}
