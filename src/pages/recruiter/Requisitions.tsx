import {
  ArrowsUpDownIcon,
  ArrowUpTrayIcon,
  BriefcaseIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ClockIcon,
  DocumentTextIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  PencilIcon,
  PlusIcon,
  SparklesIcon,
  TrashIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { BriefcaseIcon as BriefcaseSolidIcon } from '@heroicons/react/24/solid';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AdvancedRequisitionFilters, RequisitionImport } from '@/features/recruiter';
import { AddToShortlistModal } from '@/features/recruiter-pipeline';

import { apiPost, ApiError } from '@/shared/api/apiClient';
import toast from 'react-hot-toast';
import { RequisitionFilters } from '@/shared/types/recruiter';
import { getLogger } from '@/shared/config/logging';
import { EmptyStateWithQuote } from '@/components/EmptyStateWithQuote';
import { useEscapeToClose } from '@/shared/hooks/useEscapeToClose';

import { ApplicationsDialog } from './components/ApplicationsDialog';
import { RequisitionCard } from './components/RequisitionCard';
import { RequisitionForm, RequisitionDetails, DeleteRequisitionDialog } from './components/RequisitionDialogs';
import { useUser } from '@/shared/model/authStore';
const logger = getLogger('Requisitions');

// Idempotency key for credit-consuming actions: ONE id per explicit user
// intent, reused across automatic retries of that same intent so retrying
// never double-charges credits. A new explicit click generates a new id.
const createRequestId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `req_${Date.now()}_${Math.random().toString(36).slice(2)}`;
};

// Wrap a credit-consuming post with an idempotent auto-retry: transient
// failures (5xx / network) are retried with exponential backoff reusing the
// SAME requestId; deterministic failures (402 quota, 4xx) abort immediately.
const withIdempotentRetry = async <T,>(
  op: (requestId: string) => Promise<T>,
  maxRetries = 2,
): Promise<T> => {
  const requestId = createRequestId();
  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await op(requestId);
    } catch (error) {
      lastError = error;
      if (error instanceof ApiError && error.status < 500) throw error;
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 400 * Math.pow(2, attempt)));
      }
    }
  }
  throw lastError;
};

// Normalize ANY supplied error into an Error instance for structured logging.
const toError = (error: unknown): Error => (error instanceof Error ? error : new Error(String(error)));

export interface Opportunity {
  id: string;
  job_title: string;
  title: string;
  company_name: string;
  company_logo?: string;
  department: string;
  location: string;
  mode?: 'Remote' | 'On-site' | 'Hybrid';
  employment_type: 'Full-time' | 'Part-time' | 'Contract' | 'Internship';
  experience_level: 'Entry' | 'Mid' | 'Senior' | 'Lead';
  salary_range_min?: number;
  experience_required?: string;
  skills_required?: string[];
  deadline?: string;
  benefits?: string[];
  salary_range_max?: number;
  status: 'draft' | 'open' | 'closed' | 'on_hold';
  posted_date: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
  applications_count: number;
  messages_count: number;
  views_count: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  is_active?: boolean;
  recruiter_id?: string;
  // Boost / featured placement windows (spec §6) — ISO timestamps set by
  // boost-opportunity; absent on plain rows.
  boosted_until?: string;
  featured_until?: string;
}

export interface Recruiter {
  id: string;
  name?: string;
  email: string;
}

// Quota widget payload: POST /api/recruiter/actions { action: 'get-quota-usage' }
// → envelope.data = { used_active_posts, limit_active_posts (number | null),
//   credits: { [featureKey]: { allocated, consumed, remaining } } }
interface QuotaUsageData {
  used_active_posts?: number;
  limit_active_posts?: number | null;
  credits?: Partial<
    Record<'contact_unlocks' | 'job_boost_credits' | 'ai_credits' | 'candidate_invites', {
      allocated: number;
      consumed: number;
      remaining: number;
    }>
  >;
}

const Requisitions = () => {
  const user = useUser();
  const [requisitions, setRequisitions] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [permissions, setPermissions] = useState({ create: false, edit: false, delete: false, manageCandidates: false });
  const [searchQuery, setSearchQuery] = useState('');
  // Debounced mirror of the search input — the API call reads this, not the
  // raw keystroke value (350ms debounce).
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showApplicationsModal, setShowApplicationsModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Opportunity | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const mutationLock = useRef(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  // Quota/credit visibility (contract: refresh after every successful mutation)
  const [quotaUsage, setQuotaUsage] = useState<QuotaUsageData | null>(null);
  // AI shortlist results (spec §6): opportunity + matched candidates
  const [shortlistModal, setShortlistModal] = useState<{ opportunity: Opportunity; candidates: any[] } | null>(null);
  const [shortlistCandidate, setShortlistCandidate] = useState<any>(null);
  const [selectedRequisition, setSelectedRequisition] = useState<Opportunity | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [recruiters, setRecruiters] = useState<Recruiter[]>([]);
  const [currentRecruiterId, setCurrentRecruiterId] = useState<string | null>(null);

  // Sorting State
  const [sortField, setSortField] = useState<string>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Advanced Filters State
  const [advancedFilters, setAdvancedFilters] = useState<RequisitionFilters>({
    dateRange: {},
    status: [],
    departments: [],
    workModes: [],
    locations: [],
    experienceRequired: [],
    titles: [],
    employmentTypes: [],
    experienceLevels: [],
    salaryRange: {},
    applicationCountRange: 'all'
  });
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(8);
  const [totalCount, setTotalCount] = useState(0);
  const [refreshVersion, setRefreshVersion] = useState(0);

  // Refs for fetch hygiene: a monotonically increasing sequence lets late
  // responses be detected and dropped so an older response can never clobber
  // the results of a newer filter state.
  const requestSeqRef = useRef(0);
  // Tracks the last filter key seen by the fetch effect so a filter change can
  // reset pagination inside the SAME effect (single source of state) instead
  // of a separate reset effect that used to double-fetch.
  const lastFilterKeyRef = useRef<string | null>(null);

  // Debounce the search input (350ms) before it reaches the fetch effect.
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Quota / credit visibility strip (contract fix #2): load once and refresh
  // after every successful mutation (create/update/delete/status/import).
  const refreshQuota = async () => {
    try {
      const result: any = await apiPost('/recruiter/actions', { action: 'get-quota-usage' });
      const data = result?.data;
      // Render defensively: only keep a well-shaped payload, otherwise hide.
      if (data && typeof data === 'object' && 'used_active_posts' in data) {
        setQuotaUsage(data);
      } else {
        setQuotaUsage(null);
      }
    } catch (error) {
      logger.error('Error loading quota usage', toError(error));
      setQuotaUsage(null); // hide the widget quietly on failure
    }
  };

  useEffect(() => {
    setPermissions({ create: false, edit: false, delete: false, manageCandidates: false });
    apiPost<{ data: { create: boolean; edit: boolean; delete: boolean; manageCandidates: boolean } }>('/recruiter/actions', { action: 'get-requisition-permissions' })
      .then(result => setPermissions({ create: result.data?.create === true, edit: result.data?.edit === true, delete: result.data?.delete === true, manageCandidates: result.data?.manageCandidates === true }))
      .catch(error => logger.error('Error loading requisition permissions', toError(error)));
    loadRecruiters();
    loadCurrentRecruiter();
    refreshQuota();
  }, [user]);

  const loadRecruiters = async () => {
    try {
      const result: any = await apiPost('/recruiter/actions', { action: 'list-recruiters' });
      const rows = result?.data;
      setRecruiters(Array.isArray(rows) ? rows : []);
    } catch (error) {
      logger.error('Error loading recruiters', toError(error));
    }
  };

  const loadCurrentRecruiter = async () => {
    if (!user?.email) return;

    try {
      const result = await apiPost<any>('/recruiter/actions', { action: 'get-current-recruiter', email: user.email });
      if (result?.data) {
        setCurrentRecruiterId(result.data.id);
      }
    } catch (error) {
      logger.error('Error loading current recruiter', toError(error));
    }
  };

  // The 'end' date must be sent as end-of-day so the final selected day is
  // not excluded by the backend's lte('posted_date', endDate) filter. Wall
  // clock (local) time is preserved on purpose — no UTC re-basing.
  const normalizeEndDate = (date: string) =>
    /^\d{4}-\d{2}-\d{2}$/.test(date) ? `${date}T23:59:59.999` : date;

  const loadRequisitions = async () => {
    const seq = ++requestSeqRef.current;
    setLoading(true);
    try {
      const advancedFiltersForQuery: RequisitionFilters = {
        ...advancedFilters,
        dateRange: advancedFilters.dateRange?.endDate
          ? { ...advancedFilters.dateRange, endDate: normalizeEndDate(advancedFilters.dateRange.endDate) }
          : advancedFilters.dateRange,
      };

      const result: any = await apiPost('/recruiter/actions', {
        action: 'list-opportunities',
        searchQuery: debouncedSearch,
        statusFilter,
        advancedFilters: advancedFiltersForQuery,
        sortField,
        sortDirection,
        currentPage,
        itemsPerPage,
      });

      // A newer request has been started meanwhile — drop this stale response.
      if (seq !== requestSeqRef.current) return;

      // apiPost returns the { success, data, error, meta } envelope: list
      // payloads live in result.data = { data: rows, total }.
      const payload = result?.data ?? {};
      const rows: Opportunity[] = Array.isArray(payload?.data) ? payload.data : [];

      logger.info('Fetched cards from DB', { count: rows.length, total: payload?.total });
      const total = Number(payload?.total) || 0;
      const lastPage = Math.max(1, Math.ceil(total / itemsPerPage));
      if (currentPage > lastPage) {
        setCurrentPage(lastPage);
        return;
      }
      setTotalCount(total);
      setLoadFailed(false);

      const transformedData: Opportunity[] = rows.map((opp: any) => ({
        ...opp,
        job_title: opp.title || opp.job_title || '',
        requirements: opp.requirements || [],
        responsibilities: opp.responsibilities || [],
        benefits: opp.benefits || [],
        applications_count: opp.applications_count || 0,
        messages_count: opp.messages_count || 0,
        views_count: opp.views_count || 0,
        employment_type: (opp.employment_type as any) || 'Full-time',
        experience_level: (opp.experience_level as any) || 'Mid',
        status: (opp.status as any) || 'draft'
      }));

      setRequisitions(transformedData);
    } catch (error) {
      if (seq !== requestSeqRef.current) return;
      setLoadFailed(true);
      logger.error('Error loading requisitions', toError(error));
      toast.error(error instanceof ApiError ? error.message : 'Failed to load requisitions');
    } finally {
      // Only the newest request may flip the loading flag off — a superseded
      // response must not resolve the newer request's spinner early.
      if (seq === requestSeqRef.current) {
        setLoading(false);
      }
    }
  };

  // Single fetch effect (fix F): debounce-aware search + filters + pagination.
  useEffect(() => {
    const filterKey = JSON.stringify([debouncedSearch, statusFilter, advancedFilters, sortField, sortDirection]);
    if (lastFilterKeyRef.current !== null && lastFilterKeyRef.current !== filterKey) {
      // Filters changed — reset to page 1 here (same effect, no double fetch).
      // The state change re-runs this effect, which then fetches once.
      lastFilterKeyRef.current = filterKey;
      if (currentPage !== 1) {
        setCurrentPage(1);
        return;
      }
    } else if (lastFilterKeyRef.current === null) {
      lastFilterKeyRef.current = filterKey;
    }
    loadRequisitions();
  }, [debouncedSearch, statusFilter, advancedFilters, sortField, sortDirection, currentPage, itemsPerPage, refreshVersion]);

  const createRequisition = async (requisitionData: any): Promise<Opportunity> => {
    const result: any = await apiPost('/recruiter/actions', {
      action: 'create-requisition',
      requisitionData: {
        title: requisitionData.job_title,
        job_title: requisitionData.job_title,
        company_name: requisitionData.company_name,
        company_logo: requisitionData.company_logo,
        mode: requisitionData.mode,
        department: requisitionData.department,
        location: requisitionData.location,
        employment_type: requisitionData.employment_type,
        experience_level: requisitionData.experience_level,
        experience_required: requisitionData.experience_required,
        skills_required: requisitionData.skills_required,
        deadline: requisitionData.deadline ? new Date(requisitionData.deadline).toISOString() : null,
        benefits: requisitionData.benefits,
        salary_range_min: requisitionData.salary_range_min,
        salary_range_max: requisitionData.salary_range_max,
        status: requisitionData.status,
        description: requisitionData.description,
        requirements: requisitionData.requirements,
        responsibilities: requisitionData.responsibilities,
        created_by: user?.id,
        recruiter_id: requisitionData.recruiter_id
      }
    });

    // apiPost returns the { success, data, error, meta } envelope; the created
    // row itself lives in result.data (server-forced applications_count = 0).
    const row = result?.data;
    if (!row) throw new Error('Failed to create requisition');
    return row;
  };

  const updateRequisition = async (id: string, updates: Record<string, any>): Promise<Opportunity> => {
    // Build the update payload from the keys the caller actually provided.
    // In particular `deadline` must only be present when the caller supplied
    // it — a status-only change (publish/close/reopen) must never send
    // `deadline: null`, which would wipe the existing deadline on the row.
    const payload: Record<string, any> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) payload[key] = value;
    }
    if (updates.job_title != null) payload.title = updates.job_title;
    if ('deadline' in updates && updates.deadline !== undefined) {
      payload.deadline = updates.deadline ? new Date(updates.deadline).toISOString() : null;
    }

    const result: any = await apiPost('/recruiter/actions', {
      action: 'update-requisition',
      id,
      updates: payload
    });

    // apiPost returns the { success, data, error, meta } envelope; the updated
    // row itself lives in result.data.
    const row = result?.data;
    if (!row) throw new Error('Failed to update requisition');
    return row;
  };

  const deleteRequisition = async (id: string) => {
    await apiPost('/recruiter/actions', {
      action: 'delete-requisition',
      id
    });
  };


  const handleResetFilters = () => {
    setAdvancedFilters({
      dateRange: {},
      status: [],
      departments: [],
      workModes: [],
      locations: [],
      titles: [],
      experienceRequired: [],
      employmentTypes: [],
      experienceLevels: [],
      salaryRange: {},
      applicationCountRange: 'all'
    });
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      open: 'bg-green-100 text-green-800 border-green-200',
      draft: 'bg-gray-100 text-gray-800 border-gray-200',
      closed: 'bg-red-100 text-red-800 border-red-200',
      on_hold: 'bg-yellow-100 text-yellow-800 border-yellow-200'
    };
    return styles[status as keyof typeof styles] || styles.draft;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <CheckCircleIcon className="h-4 w-4" />;
      case 'closed': return <XCircleIcon className="h-4 w-4" />;
      case 'on_hold': return <ClockIcon className="h-4 w-4" />;
      default: return <DocumentTextIcon className="h-4 w-4" />;
    }
  };

  const handleDelete = (id: string) => {
    const target = requisitions.find(r => r.id === id);
    if (!target || mutationLock.current) return;
    setDeleteError('');
    setDeleteTarget(target);
  };

  const confirmDelete = async () => {
    if (!deleteTarget || mutationLock.current) return;
    mutationLock.current = true;
    setDeleting(true);
    setDeleteError('');
    try {
      await deleteRequisition(deleteTarget.id);
      setDeleteTarget(null);
      toast.success('Requisition deleted');
      setRefreshVersion(version => version + 1);
      void refreshQuota();
    } catch (error) {
      logger.error('Error deleting requisition', toError(error));
      setDeleteError(error instanceof ApiError ? error.message : 'Unable to delete this requisition. Please try again.');
    } finally {
      mutationLock.current = false;
      setDeleting(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    if (mutationLock.current) return;
    mutationLock.current = true;
    setBusyId(id);
    try {
      await updateRequisition(id, { status: newStatus });
      toast.success(`Requisition marked as ${newStatus.replace('_', ' ')}`);
      setRefreshVersion(version => version + 1);
      void refreshQuota();
    } catch (error) {
      logger.error('Error updating status', toError(error));
      toast.error(error instanceof ApiError ? error.message : 'Error updating status');
    } finally {
      mutationLock.current = false;
      setBusyId(null);
    }
  };

  // ── Job boost & AI shortlist fulfilment (spec §6) ──
  const handleBoost = async (requisition: Opportunity) => {
    try {
      // Credit-consuming action: the SAME requestId is reused across automatic
      // retries so a flaky network can never double-charge a boost credit.
      const res: any = await withIdempotentRetry((requestId) => apiPost('/opportunities', {
        action: 'boost-opportunity',
        id: requisition.id,
        requestId,
      }));
      const until = res?.data?.opportunity?.boosted_until
        ? new Date(res.data.opportunity.boosted_until).toLocaleDateString()
        : '7 days';
      toast.success(`Job boosted until ${until} (${res?.data?.credits_remaining ?? '?'} boost credits left)`);
      refreshQuota();
      loadRequisitions();
    } catch (error: unknown) {
      if (error instanceof ApiError && (error.status === 402 || error.code === 'QUOTA_EXCEEDED' || error.code === 'INSUFFICIENT_CREDITS')) {
        logger.error('Error boosting job', error);
        toast.error(error.message || 'No job boost credits left. Upgrade your plan or buy a boost pack in Add-ons.');
      } else {
        logger.error('Error boosting job', toError(error));
        toast.error('Failed to boost this job. Try again.');
      }
    }
  };

  const handleGenerateShortlist = async (requisition: Opportunity) => {
    try {
      // Credit-consuming action: the SAME requestId is reused across automatic
      // retries so a flaky network can never double-charge an AI credit.
      const res: any = await withIdempotentRetry((requestId) => apiPost('/recruiter-copilot', {
        action: 'semantic-find-for-opportunity',
        opportunity_id: requisition.id,
        match_count: 20,
        min_similarity: 0.65,
        requestId,
      }));
      const candidates = (res?.data ?? []).map((c: any) => ({
        ...c,
        // AddToShortlistModal and the backend both key on a canonical candidate id;
        // pgvector RPCs may only return user_id — normalize here.
        id: c.id ?? c.learner_id ?? c.user_id,
      }));
      setShortlistModal({ opportunity: requisition, candidates });
      if (candidates.length > 0) {
        toast.success(`AI shortlist ready — ${candidates.length} matched candidates (1 AI credit consumed)`);
      } else {
        toast('No candidates matched above the similarity threshold — no credit charged');
      }
      refreshQuota();
    } catch (error: unknown) {
      if (error instanceof ApiError && (error.status === 402 || error.code === 'QUOTA_EXCEEDED' || error.code === 'INSUFFICIENT_CREDITS')) {
        logger.error('Error generating AI shortlist', error);
        toast.error(error.message || 'No AI shortlist credits left. Upgrade your plan or buy the AI shortlist pack in Add-ons.');
      } else {
        logger.error('Error generating AI shortlist', toError(error));
        toast.error('Failed to generate the AI shortlist. Try again.');
      }
    }
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New field, default to descending
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Fix G: the empty-state check must treat advancedFilters as filters too —
  // previously only statusFilter/searchQuery were considered, so a filtered
  // zero-row response could misrender "Create your first requisition".
  const hasActiveFilters = useMemo(() => {
    const f = advancedFilters;
    return Boolean(
      debouncedSearch ||
      statusFilter !== 'all' ||
      (f.status?.length ?? 0) > 0 ||
      (f.departments?.length ?? 0) > 0 ||
      (f.locations?.length ?? 0) > 0 ||
      (f.workModes?.length ?? 0) > 0 ||
      (f.experienceRequired?.length ?? 0) > 0 ||
      (f.titles?.length ?? 0) > 0 ||
      (f.employmentTypes?.length ?? 0) > 0 ||
      (f.experienceLevels?.length ?? 0) > 0 ||
      f.salaryRange?.min != null ||
      f.salaryRange?.max != null ||
      (Boolean(f.applicationCountRange) && f.applicationCountRange !== 'all') ||
      Boolean(f.dateRange?.startDate) ||
      Boolean(f.dateRange?.endDate)
    );
  }, [debouncedSearch, statusFilter, advancedFilters]);

  // Escape-to-close for the inline AI-shortlist modal (hook-based pattern).
  useEscapeToClose({
    enabled: shortlistModal != null,
    onEscape: () => setShortlistModal(null),
  });

  const getSortIcon = (field: string) => {
    if (sortField !== field) {
      return <ArrowsUpDownIcon className="h-4 w-4 text-gray-400" />;
    }
    return sortDirection === 'asc'
      ? <ChevronUpIcon className="h-4 w-4 text-primary-600" />
      : <ChevronDownIcon className="h-4 w-4 text-primary-600" />;
  };

  // Sort dropdown helpers (fix C): every dropdown option maps to a real
  // column; header-sorted fields not present in the dropdown (like 'status')
  // show the placeholder. Values use '<field>|<direction>'.
  const SORT_OPTION_VALUES = new Set([
    'created_at|desc', 'created_at|asc', 'posted_date|desc', 'posted_date|asc',
    'applications_count|desc', 'applications_count|asc',
    'job_title|asc', 'job_title|desc',
    'department|asc', 'department|desc',
    'location|asc', 'location|desc',
    'salary_range_min|desc', 'salary_range_min|asc',
  ]);
  const showSortPlaceholder = !SORT_OPTION_VALUES.has(`${sortField}|${sortDirection}`);

  const totalPages = Math.ceil(totalCount / itemsPerPage);
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalCount);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };
  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Job Requisitions</h1>
            {/* Fix G: single totalCount source (was duplicated with requisitions.length) */}
            <p className="text-sm text-gray-500 mt-1">
              {totalCount} requisition{totalCount !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowImportModal(true)} disabled={!permissions.create}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <ArrowUpTrayIcon className="h-5 w-5 mr-2" />
              Import
            </button>
            <button
              onClick={() => setShowCreateModal(true)} disabled={!permissions.create} title={!permissions.create ? "Creating requisitions requires permission from your organization" : undefined}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Create Requisition
            </button>
          </div>
        </div>

        {/* Quota / credit visibility strip (contract fix #2). Renders only when
            the get-quota-usage payload resolves; hidden defensively otherwise. */}
        {quotaUsage && quotaUsage.used_active_posts != null && (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-md px-3 py-1.5">
            <span className="font-medium text-gray-700">
              {quotaUsage.used_active_posts}{quotaUsage.limit_active_posts != null ? ` / ${quotaUsage.limit_active_posts}` : ''} active posts
            </span>
            <span aria-hidden="true">·</span>
            <span>
              Boost: {quotaUsage.credits?.job_boost_credits?.remaining ?? '—'}
            </span>
            <span aria-hidden="true">·</span>
            <span>
              AI: {quotaUsage.credits?.ai_credits?.remaining ?? '—'}
            </span>
            {quotaUsage.limit_active_posts != null &&
              Math.max(0, quotaUsage.limit_active_posts - quotaUsage.used_active_posts) <= 1 && (
              <Link
                to="/subscription/plans?type=recruiter"
                className="ml-1 font-medium text-primary-600 hover:text-primary-700 underline"
                title="Upgrade your plan to publish more job posts"
              >
                Upgrade
                {quotaUsage.limit_active_posts - quotaUsage.used_active_posts <= 0 ? ' (limit reached)' : ' (1 left)'}
              </Link>
            )}
          </div>
        )}

        {/* Search and Filters */}
        <div className="mt-4 flex flex-col flex-wrap sm:flex-row gap-3">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              aria-label="Search requisitions"
              placeholder="Search by job title, department, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Results Count & Sort Info */}
          {/* {requisitions.length > 0 && ( */}
          {totalCount > 0 && (
            <div className="hidden md:flex items-center px-3 py-2 bg-gray-100 rounded-md text-xs text-gray-600">
              {/* <span className="font-medium">{requisitions.length}</span>
              <span className="mx-1">results</span> */}
              <span className="font-medium">{totalCount}</span>
              <span className="mx-1">total results</span>
              {sortField && (
                <>
                  <span className="mx-1">•</span>
                  <span>sorted by</span>
                  <span className="ml-1 font-medium">
                    {sortField === 'job_title' ? 'Job Title' :
                      sortField === 'created_at' ? 'Created Date' :
                        sortField === 'posted_date' ? 'Posted Date' :
                          sortField === 'applications_count' ? 'Applications' :
                            sortField === 'department' ? 'Department' :
                              sortField === 'location' ? 'Location' :
                                sortField === 'salary_range_min' ? 'Salary' :
                                  sortField}
                  </span>
                  {sortDirection === 'asc' ? <ChevronUpIcon className="h-3 w-3 ml-1" /> : <ChevronDownIcon className="h-3 w-3 ml-1" />}
                </>
              )}
            </div>
          )}

          <select
            aria-label="Filter by status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Status</option>
            <option value="open">Open</option>
            <option value="draft">Draft</option>
            <option value="on_hold">On Hold</option>
            <option value="closed">Closed</option>
          </select>

          <AdvancedRequisitionFilters
            filters={advancedFilters}
            onFiltersChange={setAdvancedFilters}
            onReset={handleResetFilters}
            onApply={loadRequisitions}
            onHeaderStatusReset={() => setStatusFilter('all')}
          />

          {/* Sorting Dropdown */}
          <div className="relative">
            <select
              aria-label="Sort requisitions"
              value={SORT_OPTION_VALUES.has(`${sortField}|${sortDirection}`) ? `${sortField}|${sortDirection}` : ''}
              onChange={(e) => {
                // Composite "<field>|<direction>" values; pipe-safe separator
                // since field names (e.g. on_hold/status) never contain '|'.
                const [field, direction] = e.target.value.split('|');
                if (!field || !direction) return; // placeholder selection
                setSortField(field);
                setSortDirection(direction as 'asc' | 'desc');
              }}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none bg-white text-sm"
            >
              {/* Placeholder shown only when the current sort (e.g. a header
                  table sort on 'status') has no matching dropdown option. */}
              {showSortPlaceholder && (
                <option value="" disabled hidden>
                  Sorted by header…
                </option>
              )}
              <optgroup label="Date">
                <option value="created_at|desc">Newest First</option>
                <option value="created_at|asc">Oldest First</option>
                <option value="posted_date|desc">Recently Posted</option>
                <option value="posted_date|asc">Oldest Posted</option>
              </optgroup>
              <optgroup label="Applications">
                <option value="applications_count|desc">Most Applications</option>
                <option value="applications_count|asc">Least Applications</option>
              </optgroup>
              <optgroup label="Alphabetical">
                <option value="job_title|asc">Job Title (A-Z)</option>
                <option value="job_title|desc">Job Title (Z-A)</option>
                <option value="department|asc">Department (A-Z)</option>
                <option value="department|desc">Department (Z-A)</option>
                <option value="location|asc">Location (A-Z)</option>
                <option value="location|desc">Location (Z-A)</option>
              </optgroup>
              <optgroup label="Salary">
                <option value="salary_range_min|desc">Highest Salary</option>
                <option value="salary_range_min|asc">Lowest Salary</option>
              </optgroup>
            </select>
            <ArrowsUpDownIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
          </div>

          <div className="flex gap-2">
            <button
              aria-pressed={viewMode === 'grid'}
              onClick={() => setViewMode('grid')}
              className={`px-3 py-2 border rounded-md ${viewMode === 'grid'
                ? 'bg-primary-50 border-primary-300 text-primary-700'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
            >
              Grid
            </button>
            <button
              aria-pressed={viewMode === 'list'}
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 border rounded-md ${viewMode === 'list'
                ? 'bg-primary-50 border-primary-300 text-primary-700'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
            >
              List
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : loadFailed ? (
          // Fix F: a failed load must not masquerade as «no requisitions yet» —
          // show a visible inline error state with an explicit Retry action.
          <div className="text-center py-12">
            <XCircleIcon className="mx-auto h-12 w-12 text-red-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Something went wrong</h3>
            <p className="mt-1 text-sm text-gray-500">
              We couldn&apos;t load your requisitions right now.
            </p>
            <button
              onClick={loadRequisitions}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
            >
              Retry
            </button>
          </div>
        ) : requisitions.length === 0 ? (
          <div className="text-center py-12">
            {hasActiveFilters ? (
              <>
                <BriefcaseSolidIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No requisitions found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Try adjusting your search or filters
                </p>
              </>
            ) : (
              // «Create your first requisition» only for a clean zero-row,
              // filter-free response (fix F).
              <EmptyStateWithQuote
                page="requisitions"
                icon={BriefcaseSolidIcon}
                actionButton={
                  <button
                    onClick={() => setShowCreateModal(true)} disabled={!permissions.create} title={!permissions.create ? "Creating requisitions requires permission from your organization" : undefined}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
                  >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Create Your First Requisition
                  </button>
                }
              />
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 min-[1800px]:grid-cols-4 items-stretch gap-4">
            {requisitions.map((req) => (
              <RequisitionCard
                key={req.id}
                busy={busyId === req.id}
                permissions={permissions}
                requisition={req}
                onView={(r) => {
                  setSelectedRequisition(r);
                  setShowViewModal(true);
                }}
                onEdit={(r) => {
                  setSelectedRequisition(r);
                  setShowEditModal(true);
                }}
                onDelete={handleDelete}
                onStatusChange={handleStatusChange}
                onBoost={handleBoost}
                onGenerateShortlist={handleGenerateShortlist}
                onViewApplications={(r) => {
                  setSelectedRequisition(r);
                  setShowApplicationsModal(true);
                }}
                getStatusBadge={getStatusBadge}
                getStatusIcon={getStatusIcon}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('job_title')}
                  >
                    <div className="flex items-center gap-2">
                      Job Title
                      {getSortIcon('job_title')}
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('department')}
                  >
                    <div className="flex items-center gap-2">
                      Department
                      {getSortIcon('department')}
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('location')}
                  >
                    <div className="flex items-center gap-2">
                      Location
                      {getSortIcon('location')}
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center gap-2">
                      Status
                      {getSortIcon('status')}
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('applications_count')}
                  >
                    <div className="flex items-center gap-2">
                      Applications
                      {getSortIcon('applications_count')}
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('posted_date')}
                  >
                    <div className="flex items-center gap-2">
                      Posted
                      {getSortIcon('posted_date')}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {requisitions.map((req) => (
                  <tr key={req.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <BriefcaseIcon className="h-5 w-5 text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{req.job_title}</div>
                          <div className="text-xs text-gray-500">{req.employment_type}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {req.department}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <MapPinIcon className="h-4 w-4 text-gray-400 mr-1" />
                        {req.location}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusBadge(req.status)}`}>
                        {getStatusIcon(req.status)}
                        <span className="ml-1 capitalize">{req.status?.replace('_', ' ') || 'Unknown'}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => {
                          setSelectedRequisition(req);
                          setShowApplicationsModal(true);
                        }}
                        className="text-sm text-primary-600 hover:text-primary-900"
                      >
                        {req.applications_count} apps
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(req.posted_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedRequisition(req);
                            setShowViewModal(true);
                          }}
                          className="text-gray-600 hover:text-gray-900"
                          title="View" aria-label={`View ${req.job_title}`}
                        >
                          <EyeIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedRequisition(req);
                            setShowEditModal(true);
                          }}
                          className="text-primary-600 hover:text-primary-900"
                          title="Edit" aria-label={`Edit ${req.job_title}`} disabled={busyId === req.id || !permissions.edit}
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(req.id)}
                          className="text-red-600 hover:text-red-900"
                          title={permissions.delete ? "Delete" : "Deleting requisitions requires an organization administrator"} aria-label={`Delete ${req.job_title}`} disabled={busyId === req.id || !permissions.delete}
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
        )}
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 rounded-lg shadow-sm">
            {/* Mobile pagination */}
            <div className="flex flex-1 justify-between sm:hidden">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>

            {/* Desktop pagination */}
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{startItem}</span> to{' '}
                  <span className="font-medium">{endItem}</span> of{' '}
                  <span className="font-medium">{totalCount}</span> results
                </p>
              </div>
              <div>
                <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">

                  {/* Previous Button */}
                  <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center rounded-l-md px-3 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronUpIcon className="h-5 w-5 rotate-[-90deg] mr-1" aria-hidden="true" />
                    <span>Previous</span>
                  </button>

                  {/* Page Numbers */}
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number;

                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => goToPage(pageNum)}
                        className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${currentPage === pageNum
                          ? 'z-10 bg-primary-600 text-white'
                          : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50'
                          }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  {/* Next Button */}
                  <button
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center rounded-r-md px-3 py-2 text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span>Next</span>
                    <ChevronUpIcon className="h-5 w-5 rotate-90 ml-1" aria-hidden="true" />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {deleteTarget && <DeleteRequisitionDialog requisition={deleteTarget} busy={deleting} error={deleteError}
        onClose={() => { if (!mutationLock.current) setDeleteTarget(null); }} onConfirm={confirmDelete} />}

      {showCreateModal && (
        <RequisitionForm
          recruiters={recruiters}
          currentRecruiterId={currentRecruiterId}
          onClose={() => setShowCreateModal(false)}
          onSuccess={async (newReqData) => {
            try {
              // createRequisition already unwraps the envelope row.
              await createRequisition(newReqData);
              setShowCreateModal(false);
              toast.success('Requisition created');
              setRefreshVersion(version => version + 1);
              void refreshQuota();
            } catch (error) {
              logger.error('Error creating requisition', toError(error));
              // Surface the backend message verbatim (e.g. 402
              // QUOTA_EXCEEDED plan-upgrade guidance).
              throw error;
            }
          }}
        />
      )}

      {showEditModal && selectedRequisition && (
        <RequisitionForm
          requisition={selectedRequisition}
          recruiters={recruiters}
          onClose={() => {
            setShowEditModal(false);
            setSelectedRequisition(null);
          }}
          onSuccess={async (updatedData) => {
            try {
              // updateRequisition already unwraps the envelope row: replace by id.
              await updateRequisition(selectedRequisition.id, updatedData);
              setShowEditModal(false);
              setSelectedRequisition(null);
              toast.success('Requisition updated');
              setRefreshVersion(version => version + 1);
              void refreshQuota();
            } catch (error) {
              logger.error('Error updating requisition', toError(error));
              // Surface the backend message verbatim (e.g. 402
              // QUOTA_EXCEEDED plan-upgrade guidance).
              throw error;
            }
          }}
        />
      )}

      {showViewModal && selectedRequisition && (
        <RequisitionDetails
          requisition={selectedRequisition}
          recruiters={recruiters}
          canEdit={permissions.edit}
          canDelete={permissions.delete}
          onEdit={() => { setShowViewModal(false); setShowEditModal(true); }}
          onDelete={() => { setShowViewModal(false); handleDelete(selectedRequisition.id); }}
          onViewApplications={() => { setShowViewModal(false); setShowApplicationsModal(true); }}
          onClose={() => {
            setShowViewModal(false);
            setSelectedRequisition(null);
          }}
        />
      )}

      {showApplicationsModal && selectedRequisition && (
        <ApplicationsDialog
          canManage={permissions.manageCandidates}
          requisition={selectedRequisition}
          onClose={() => {
            setShowApplicationsModal(false);
            setSelectedRequisition(null);
          }}
        />
      )}

      {showImportModal && (
        <RequisitionImport
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
          onImportComplete={() => {
            loadRequisitions();
            refreshQuota();
          }}
        />
      )}

      {/* AI Shortlist results (spec §6 — 1 ai_credits per generation) */}
      {shortlistModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-xl max-h-[80vh] flex flex-col">
            <div className="px-5 py-4 border-b border-gray-200 flex items-start justify-between">
              <div>
                <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <SparklesIcon className="h-5 w-5 text-indigo-500" />
                  AI Shortlist — {shortlistModal.opportunity.job_title}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {shortlistModal.candidates.length} matched candidates · 1 AI credit consumed
                </p>
              </div>
              <button
                onClick={() => setShortlistModal(null)}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="overflow-y-auto divide-y divide-gray-100">
              {shortlistModal.candidates.length === 0 ? (
                <p className="px-5 py-8 text-sm text-gray-500 text-center">
                  No candidates matched this opening above the similarity threshold.
                </p>
              ) : (
                shortlistModal.candidates.map((c: any, idx: number) => {
                  const score = Math.round((c.similarity ?? c.similarity_score ?? 0) * 100);
                  return (
                    <div key={c.user_id || c.id || idx} className="px-5 py-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{c.name || c.learner_name || 'Candidate'}</p>
                        <p className="text-xs text-gray-500 truncate">
                          {[c.university, c.branch_field, c.city].filter(Boolean).join(' · ') || '—'}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            score >= 85 ? 'bg-emerald-100 text-emerald-700' : score >= 70 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {score}% match
                        </span>
                        <button
                          onClick={() => setShortlistCandidate(c)}
                          className="text-xs font-medium text-indigo-600 hover:text-indigo-800"
                        >
                          Add to shortlist
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <div className="px-5 py-3 border-t border-gray-200 text-right">
              <button
                onClick={() => setShortlistModal(null)}
                className="text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {shortlistCandidate && (
        <AddToShortlistModal
          isOpen={true}
          onClose={() => setShortlistCandidate(null)}
          candidate={shortlistCandidate}
        />
      )}
    </div>
  );
};

export default Requisitions;
