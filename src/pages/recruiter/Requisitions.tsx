import {
  ArrowsUpDownIcon,
  ArrowUpTrayIcon,
  BriefcaseIcon,
  CalendarIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ClockIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  EllipsisVerticalIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  PencilIcon,
  PlusIcon,
  RocketLaunchIcon,
  SparklesIcon,
  TrashIcon,
  UsersIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { BriefcaseIcon as BriefcaseSolidIcon } from '@heroicons/react/24/solid';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AdvancedRequisitionFilters } from '@/features/recruiter';
import { RequisitionImport } from '@/features/recruiter';
import { AddToShortlistModal } from '@/features/recruiter-pipeline';

import { apiPost, ApiError } from '@/shared/api/apiClient';
import toast from 'react-hot-toast';
import { RequisitionFilters } from '@/shared/types/recruiter';
import { getLogger } from '@/shared/config/logging';
import { EmptyStateWithQuote } from '@/components/EmptyStateWithQuote';
import { useEscapeToClose } from '@/shared/hooks/useEscapeToClose';

import { useUser } from '@/shared/model/authStore';
const logger = getLogger('Requisitions');

// Work-mode select values are lowercase ('on-site' | 'remote' | 'hybrid');
// DB rows may carry legacy capitalized values — normalize both directions.
const normalizeWorkMode = (m: unknown): 'on-site' | 'remote' | 'hybrid' => {
  const v = String(m ?? '').trim().toLowerCase();
  if (v === 'remote' || v === 'hybrid') return v;
  return 'on-site';
};

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

interface Opportunity {
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

interface Recruiter {
  id: string;
  name?: string;
  email: string;
}

interface ModalProps {
  onClose: () => void;
}

interface RequisitionModalProps extends ModalProps {
  requisition: Opportunity;
}

interface CreateRequisitionModalProps extends ModalProps {
  recruiters: Recruiter[];
  currentRecruiterId: string | null;
  // The raw form payload; the parent unwraps the API envelope and applies it.
  onSuccess: (formData: any) => Promise<void> | void;
}

interface EditRequisitionModalProps extends ModalProps {
  requisition: Opportunity;
  recruiters: Recruiter[];
  // The raw form payload; the parent unwraps the API envelope and applies it.
  onSuccess: (formData: any) => Promise<void> | void;
}

interface LearnerProfile {
  passport_id: string;
  name?: string;
  email?: string;
  phone_number?: string;
  alternate_number?: string;
  // The applied_jobs.learners.profile jsonb carries flexible DB columns the FE
  // renders directly (nm_id, registration_number, date_of_birth, age, course,
  // branch_field, skill) — index signature keeps the detail modal honest.
  [key: string]: unknown;
}

interface Application {
  id: string;
  application_status: string;
  applied_at: string;
  profile: LearnerProfile;
  learners?: {
    id: string;
    email?: string;
    profile?: LearnerProfile;
  };
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

// Render an unknown-shaped profile column as display text (LearnerProfile's
// index signature returns `unknown` for the flexible jsonb keys).
const asDetailText = (v: unknown): string => (v === null || v === undefined || v === '' ? 'N/A' : String(v));

const Requisitions = () => {
  const user = useUser();
  const [requisitions, setRequisitions] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
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
      setTotalCount(Number(payload?.total) || 0);
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
  }, [debouncedSearch, statusFilter, advancedFilters, sortField, sortDirection, currentPage, itemsPerPage]);

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
    payload.is_active = updates.status === 'open';

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

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this requisition?')) {
      try {
        await deleteRequisition(id);
        setRequisitions(prev => prev.filter(r => r.id !== id));
        // Keep the header counter in sync with the deleted row (single source
        // of truth is totalCount — the list refetch also reconciles it).
        setTotalCount(prev => Math.max(0, prev - 1));
        toast.success('Requisition deleted');
        refreshQuota();
      } catch (error) {
        logger.error('Error deleting requisition', toError(error));
        toast.error(error instanceof ApiError ? error.message : 'Error deleting requisition');
      }
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const updated = await updateRequisition(id, { status: newStatus });
      setRequisitions(prev => prev.map(r =>
        r.id === id ? { ...r, ...updated } : r
      ));
      toast.success(`Requisition marked as ${newStatus.replace('_', ' ')}`);
      refreshQuota();
    } catch (error) {
      logger.error('Error updating status', toError(error));
      toast.error(error instanceof ApiError ? error.message : 'Error updating status');
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Job Requisitions</h1>
            {/* Fix G: single totalCount source (was duplicated with requisitions.length) */}
            <p className="text-sm text-gray-500 mt-1">
              {totalCount} requisition{totalCount !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowImportModal(true)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <ArrowUpTrayIcon className="h-5 w-5 mr-2" />
              Import
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
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
        <div className="mt-4 flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
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
              onClick={() => setViewMode('grid')}
              className={`px-3 py-2 border rounded-md ${viewMode === 'grid'
                ? 'bg-primary-50 border-primary-300 text-primary-700'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
            >
              Grid
            </button>
            <button
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
                    onClick={() => setShowCreateModal(true)}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {requisitions.map((req) => (
              <RequisitionCard
                key={req.id}
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
                          title="View"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedRequisition(req);
                            setShowEditModal(true);
                          }}
                          className="text-primary-600 hover:text-primary-900"
                          title="Edit"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(req.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
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
      {showCreateModal && (
        <CreateRequisitionModal
          recruiters={recruiters}
          currentRecruiterId={currentRecruiterId}
          onClose={() => setShowCreateModal(false)}
          onSuccess={async (newReqData) => {
            try {
              // createRequisition already unwraps the envelope row.
              const newReq = await createRequisition(newReqData);
              setRequisitions(prev => [newReq, ...prev]);
              setTotalCount(prev => prev + 1);
              setShowCreateModal(false);
              toast.success('Requisition created');
              refreshQuota();
            } catch (error) {
              logger.error('Error creating requisition', toError(error));
              // Surface the backend message verbatim (e.g. 402
              // QUOTA_EXCEEDED plan-upgrade guidance).
              toast.error(error instanceof ApiError ? error.message : 'Error creating requisition');
            }
          }}
        />
      )}

      {showEditModal && selectedRequisition && (
        <EditRequisitionModal
          requisition={selectedRequisition}
          recruiters={recruiters}
          onClose={() => {
            setShowEditModal(false);
            setSelectedRequisition(null);
          }}
          onSuccess={async (updatedData) => {
            try {
              // updateRequisition already unwraps the envelope row: replace by id.
              const updated = await updateRequisition(selectedRequisition.id, updatedData);
              setRequisitions(prev => prev.map(r => r.id === updated.id ? updated : r));
              setShowEditModal(false);
              setSelectedRequisition(null);
              toast.success('Requisition updated');
              refreshQuota();
            } catch (error) {
              logger.error('Error updating requisition', toError(error));
              // Surface the backend message verbatim (e.g. 402
              // QUOTA_EXCEEDED plan-upgrade guidance).
              toast.error(error instanceof ApiError ? error.message : 'Error updating requisition');
            }
          }}
        />
      )}

      {showViewModal && selectedRequisition && (
        <ViewRequisitionModal
          requisition={selectedRequisition}
          onClose={() => {
            setShowViewModal(false);
            setSelectedRequisition(null);
          }}
        />
      )}

      {showApplicationsModal && selectedRequisition && (
        <ApplicationsModal
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

// Requisition Card Component
// Minimal typing for the props actually destructured below (fix M — was `any`).
interface RequisitionCardProps {
  requisition: Opportunity;
  onView: (r: Opportunity) => void;
  onEdit: (r: Opportunity) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, newStatus: string) => void | Promise<void>;
  onViewApplications: (r: Opportunity) => void;
  onBoost: (r: Opportunity) => void;
  onGenerateShortlist: (r: Opportunity) => void;
  getStatusBadge: (status: string) => string;
  getStatusIcon: (status: string) => React.ReactNode;
}

const RequisitionCard = ({
  requisition,
  onView,
  onEdit,
  onDelete,
  onStatusChange,
  onViewApplications,
  onBoost,
  onGenerateShortlist,
  getStatusBadge,
  getStatusIcon
}: RequisitionCardProps) => {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start space-x-3 flex-1">
            {/* ADD COMPANY LOGO */}
            {requisition.company_logo && (
              <img
                src={requisition.company_logo}
                alt={requisition.company_name}
                className="h-12 w-12 rounded-lg object-contain border border-gray-200"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            )}

            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {requisition.job_title}
              </h3>
              <p className="text-sm text-gray-600 font-medium mb-2 truncate">
                {requisition.company_name}
              </p>
              <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                <span className="inline-flex items-center">
                  <BriefcaseIcon className="h-4 w-4 mr-1" />
                  {requisition.department}
                </span>
                <span>•</span>
                <span className="inline-flex items-center">
                  <MapPinIcon className="h-4 w-4 mr-1" />
                  {requisition.location}
                </span>
                {/* ADD MODE BADGE */}
                {requisition.mode && (
                  <>
                    <span>•</span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {requisition.mode.charAt(0).toUpperCase() + requisition.mode.slice(1)}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 rounded-full hover:bg-gray-100"
            >
              <EllipsisVerticalIcon className="h-5 w-5 text-gray-400" />
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                <div className="py-1">
                  <button
                    onClick={() => { onView(requisition); setShowMenu(false); }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <EyeIcon className="h-4 w-4 inline mr-2" />
                    View Details
                  </button>
                  <button
                    onClick={() => { onEdit(requisition); setShowMenu(false); }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <PencilIcon className="h-4 w-4 inline mr-2" />
                    Edit
                  </button>
                  {/* Status transitions (fix D) — respect the ALLOWED set
                      [draft, open, closed, on_hold] and only offer the
                      legal forward moves; wired to the live handleStatusChange. */}
                  {requisition.status === 'draft' && onStatusChange && (
                    <button
                      onClick={() => { onStatusChange(requisition.id, 'open'); setShowMenu(false); }}
                      className="block w-full text-left px-4 py-2 text-sm text-green-700 hover:bg-green-50"
                    >
                      <CheckCircleIcon className="h-4 w-4 inline mr-2" />
                      Publish opening
                    </button>
                  )}
                  {requisition.status === 'open' && onStatusChange && (
                    <button
                      onClick={() => { onStatusChange(requisition.id, 'closed'); setShowMenu(false); }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <XCircleIcon className="h-4 w-4 inline mr-2" />
                      Close opening
                    </button>
                  )}
                  {requisition.status === 'closed' && onStatusChange && (
                    <button
                      onClick={() => { onStatusChange(requisition.id, 'open'); setShowMenu(false); }}
                      className="block w-full text-left px-4 py-2 text-sm text-green-700 hover:bg-green-50"
                    >
                      <CheckCircleIcon className="h-4 w-4 inline mr-2" />
                      Reopen opening
                    </button>
                  )}
                  {requisition.status === 'open' && onBoost && (
                    <button
                      onClick={() => { onBoost(requisition); setShowMenu(false); }}
                      className="block w-full text-left px-4 py-2 text-sm text-orange-600 hover:bg-orange-50"
                    >
                      <RocketLaunchIcon className="h-4 w-4 inline mr-2" />
                      Boost job (1 credit)
                    </button>
                  )}
                  {onGenerateShortlist && (
                    <button
                      onClick={() => { onGenerateShortlist(requisition); setShowMenu(false); }}
                      className="block w-full text-left px-4 py-2 text-sm text-indigo-600 hover:bg-indigo-50"
                    >
                      <SparklesIcon className="h-4 w-4 inline mr-2" />
                      Generate AI Shortlist
                    </button>
                  )}
                  <button
                    onClick={() => { onDelete(requisition.id); setShowMenu(false); }}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <TrashIcon className="h-4 w-4 inline mr-2" />
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Status Badge */}
        <div className="mb-4 flex items-center gap-2 flex-wrap">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusBadge(requisition.status)}`}>
            {getStatusIcon(requisition.status)}
            <span className="ml-1 capitalize">{requisition.status?.replace('_', ' ') || 'Unknown'}</span>
          </span>
          {/* Boost/featured placement windows (spec §6) */}
          {requisition.boosted_until && new Date(requisition.boosted_until) > new Date() && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700 border border-orange-200">
              <RocketLaunchIcon className="h-3 w-3 mr-1" />
              Boosted
            </span>
          )}
          {requisition.featured_until && new Date(requisition.featured_until) > new Date() && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 border border-amber-200">
              <SparklesIcon className="h-3 w-3 mr-1" />
              Featured
            </span>
          )}
        </div>

        {/* Details */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-gray-600">
            <ClockIcon className="h-4 w-4 mr-2" />
            <span>{requisition.employment_type} • {requisition.experience_level} Level</span>
          </div>
          {requisition.salary_range_min && (
            <div className="flex items-center text-sm text-gray-600">
              <CurrencyDollarIcon className="h-4 w-4 mr-2" />
              <span>₹{(requisition.salary_range_min / 100000).toFixed(1)}L - ₹{(requisition.salary_range_max! / 100000).toFixed(1)}L</span>
            </div>
          )}
          <div className="flex items-center text-sm text-gray-600">
            <CalendarIcon className="h-4 w-4 mr-2" />
            <span>Posted {new Date(requisition.posted_date).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Stats — Applications + Views (fix M: fake Messages stub removed) */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
          <button
            onClick={() => onViewApplications(requisition)}
            className="text-center hover:bg-gray-50 rounded p-2"
          >
            <div className="text-2xl font-semibold text-primary-600">{requisition.applications_count}</div>
            <div className="text-xs text-gray-600">Applications</div>
          </button>
          <div className="text-center p-2">
            <div className="text-2xl font-semibold text-gray-900">{requisition.views_count}</div>
            <div className="text-xs text-gray-600">Views</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Modal Components
const CreateRequisitionModal = ({ recruiters, currentRecruiterId, onClose, onSuccess }: CreateRequisitionModalProps) => {
  const [formData, setFormData] = useState({
    job_title: '',
    company_name: '',
    company_logo: '',
    department: '',
    location: '',
    mode: 'on-site',
    employment_type: 'Full-time',
    experience_level: 'Mid',
    experience_required: '',
    skills_required: '',
    deadline: '',
    benefits: '',
    salary_range_min: '',
    salary_range_max: '',
    description: '',
    requirements: '',
    responsibilities: '',
    status: 'draft',
    recruiter_id: currentRecruiterId || ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEscapeToClose({ enabled: true, onEscape: onClose });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return; // guard against double-submit / double-click
    setSubmitting(true);
    try {
      await onSuccess({
        ...formData,
        // Normalize to the select's option values (previously the state default
        // 'On-site' did not match the lowercase option values).
        mode: normalizeWorkMode(formData.mode),
        salary_range_min: formData.salary_range_min ? parseInt(formData.salary_range_min) : undefined,
        salary_range_max: formData.salary_range_max ? parseInt(formData.salary_range_max) : undefined,
        requirements: formData.requirements.split('\n').filter(r => r.trim()),
        responsibilities: formData.responsibilities.split('\n').filter(r => r.trim()),
      });
    } catch (error) {
      logger.error('Error in form submission', toError(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        ></div>

        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-semibold text-gray-900">Create Job Requisition</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <XCircleIcon className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.job_title}
                  onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="e.g., Senior Full Stack Developer"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="e.g., Engineering"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="e.g., Tech Corp Inc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Logo URL
                </label>
                <input
                  type="url"
                  value={formData.company_logo}
                  onChange={(e) => setFormData({ ...formData, company_logo: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="https://example.com/logo.png"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Work Mode <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.mode}
                  onChange={(e) => setFormData({ ...formData, mode: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="on-site">On-site</option>
                  <option value="remote">Remote</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="draft">Draft</option>
                  <option value="open">Open</option>
                  <option value="on_hold">On Hold</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Application Deadline
                </label>
                <input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="e.g., Bangalore, Remote"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Employment Type <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.employment_type}
                  onChange={(e) => setFormData({ ...formData, employment_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                  <option value="Internship">Internship</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Experience Level <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.experience_level}
                  onChange={(e) => setFormData({ ...formData, experience_level: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="Entry">Entry Level</option>
                  <option value="Mid">Mid Level</option>
                  <option value="Senior">Senior Level</option>
                  <option value="Lead">Lead/Principal</option>
                </select>
              </div>


              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Experience Required
                </label>
                <input
                  type="text"
                  value={formData.experience_required}
                  onChange={(e) => setFormData({ ...formData, experience_required: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="e.g., 3-5 years"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Recruiter <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.recruiter_id}
                  onChange={(e) => setFormData({ ...formData, recruiter_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Select a recruiter</option>
                  {recruiters.map((recruiter: any) => (
                    <option key={recruiter.id} value={recruiter.id}>
                      {recruiter.name} ({recruiter.email})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Salary Range Min (₹)
                </label>
                <input
                  type="number"
                  value={formData.salary_range_min}
                  onChange={(e) => setFormData({ ...formData, salary_range_min: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="e.g., 1500000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Salary Range Max (₹)
                </label>
                <input
                  type="number"
                  value={formData.salary_range_max}
                  onChange={(e) => setFormData({ ...formData, salary_range_max: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="e.g., 2500000"
                />
              </div>
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Skills Required <span className="text-xs text-gray-500">(comma-separated)</span>
              </label>
              <input
                type="text"
                value={formData.skills_required}
                onChange={(e) => setFormData({ ...formData, skills_required: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="e.g., React, Node.js, TypeScript, SQL"
              />
            </div>


            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Benefits <span className="text-xs text-gray-500">(one per line)</span>
              </label>
              <textarea
                rows={4}
                value={formData.benefits}
                onChange={(e) => setFormData({ ...formData, benefits: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Health insurance&#10;Remote work&#10;Learning budget"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Job Description <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Describe the role and responsibilities..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Requirements <span className="text-xs text-gray-500">(one per line)</span>
              </label>
              <textarea
                rows={4}
                value={formData.requirements}
                onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="5+ years experience&#10;React, Node.js expertise&#10;Team leadership"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Responsibilities <span className="text-xs text-gray-500">(one per line)</span>
              </label>
              <textarea
                rows={4}
                value={formData.responsibilities}
                onChange={(e) => setFormData({ ...formData, responsibilities: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Design and implement features&#10;Code reviews&#10;Mentor team members"
              />
            </div>

            <div className="flex items-center justify-end space-x-3 pt-6 border-t">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Creating...' : 'Create Requisition'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const EditRequisitionModal = ({ requisition, recruiters, onClose, onSuccess }: EditRequisitionModalProps) => {
  const [formData, setFormData] = useState({
    job_title: requisition.job_title,
    company_name: requisition.company_name,  // ADD THIS
    company_logo: requisition.company_logo,
    department: requisition.department,
    location: requisition.location,
    mode: requisition.mode || 'on-site',  // ADD THIS with default
    // Widen DB literal unions ('Full-time' | …) to plain strings so the
    // select-controlled state accepts user input without type friction.
    employment_type: String(requisition.employment_type ?? ''),
    experience_level: String(requisition.experience_level ?? ''),
    experience_required: requisition.experience_required || '',
    skills_required: Array.isArray(requisition.skills_required) ? requisition.skills_required.join(', ') : (typeof requisition.skills_required === 'string' ? requisition.skills_required : ''),
    deadline: requisition.deadline || '',
    benefits: Array.isArray(requisition.benefits) ? requisition.benefits.join('\n') : (typeof requisition.benefits === 'string' ? requisition.benefits : ''),
    salary_range_min: requisition.salary_range_min?.toString() || '',
    salary_range_max: requisition.salary_range_max?.toString() || '',
    description: requisition.description,
    requirements: Array.isArray(requisition.requirements) ? requisition.requirements.join('\n') : (typeof requisition.requirements === 'string' ? requisition.requirements : ''),
    responsibilities: Array.isArray(requisition.responsibilities) ? requisition.responsibilities.join('\n') : (typeof requisition.responsibilities === 'string' ? requisition.responsibilities : ''),
    status: String(requisition.status ?? 'draft'),
    recruiter_id: requisition.recruiter_id || ''
  });

  const [submitting, setSubmitting] = useState(false);

  useEscapeToClose({ enabled: true, onEscape: onClose });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return; // guard against double-submit / double-click
    setSubmitting(true);
    try {
      await onSuccess({
        ...formData,
        company_name: formData.company_name,
        company_logo: formData.company_logo || null,
        // Normalize to the select's option values.
        mode: normalizeWorkMode(formData.mode || 'on-site'),
        experience_required: formData.experience_required || null,
        skills_required: formData.skills_required
          ? formData.skills_required.split(',').map(s => s.trim()).filter(s => s)
          : [],
        deadline: formData.deadline ? new Date(formData.deadline).toISOString() : null,
        benefits: formData.benefits.split('\n').filter(b => b.trim()),
        salary_range_min: formData.salary_range_min ? parseInt(formData.salary_range_min) : undefined,
        salary_range_max: formData.salary_range_max ? parseInt(formData.salary_range_max) : undefined,
        requirements: formData.requirements.split('\n').filter(r => r.trim()),
        responsibilities: formData.responsibilities.split('\n').filter(r => r.trim()),
      });
    } catch (error) {
      logger.error('Error in form submission', toError(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        ></div>

        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-semibold text-gray-900">Edit Job Requisition</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <XCircleIcon className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.job_title}
                  onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="e.g., Senior Full Stack Developer"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="e.g., Engineering"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="e.g., Bangalore, Remote"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Employment Type <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.employment_type}
                  onChange={(e) => setFormData({ ...formData, employment_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                  <option value="Internship">Internship</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Experience Level <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.experience_level}
                  onChange={(e) => setFormData({ ...formData, experience_level: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="Entry">Entry Level</option>
                  <option value="Mid">Mid Level</option>
                  <option value="Senior">Senior Level</option>
                  <option value="Lead">Lead/Principal</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="draft">Draft</option>
                  <option value="open">Open</option>
                  <option value="on_hold">On Hold</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recruiter <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.recruiter_id}
                onChange={(e) => setFormData({ ...formData, recruiter_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Select a recruiter</option>
                {recruiters.map((recruiter: any) => (
                  <option key={recruiter.id} value={recruiter.id}>
                    {recruiter.name} ({recruiter.email})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Salary Range Min (₹)
                </label>
                <input
                  type="number"
                  value={formData.salary_range_min}
                  onChange={(e) => setFormData({ ...formData, salary_range_min: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="e.g., 1500000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Salary Range Max (₹)
                </label>
                <input
                  type="number"
                  value={formData.salary_range_max}
                  onChange={(e) => setFormData({ ...formData, salary_range_max: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="e.g., 2500000"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Job Description <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Describe the role and responsibilities..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Requirements <span className="text-xs text-gray-500">(one per line)</span>
              </label>
              <textarea
                rows={4}
                value={formData.requirements}
                onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="5+ years experience&#10;React, Node.js expertise&#10;Team leadership"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Responsibilities <span className="text-xs text-gray-500">(one per line)</span>
              </label>
              <textarea
                rows={4}
                value={formData.responsibilities}
                onChange={(e) => setFormData({ ...formData, responsibilities: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Design and implement features&#10;Code reviews&#10;Mentor team members"
              />
            </div>

            <div className="flex items-center justify-end space-x-3 pt-6 border-t">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Updating...' : 'Update Requisition'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const ViewRequisitionModal = ({ requisition, onClose }: RequisitionModalProps) => {
  useEscapeToClose({ enabled: true, onEscape: onClose });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20">
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75"
          onClick={onClose}
          aria-hidden="true"
        ></div>
        <div className="relative bg-white rounded-lg max-w-4xl w-full p-6">
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
            <XCircleIcon className="h-6 w-6" />
          </button>
          <h2 className="text-2xl font-bold mb-4">{requisition.job_title}</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-gray-700">{requisition.description}</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Requirements</h3>
              <ul className="list-disc list-inside space-y-1">
                {requisition.requirements?.map((req: string, idx: number) => (
                  <li key={idx} className="text-gray-700">{req}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Responsibilities</h3>
              <ul className="list-disc list-inside space-y-1">
                {requisition.responsibilities?.map((resp: string, idx: number) => (
                  <li key={idx} className="text-gray-700">{resp}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Nested candidate detail overlay for ApplicationsModal. Extracted into its
// own component so it gets its own keydown listener for Escape; the parent
// ApplicationsModal pauses its own Escape handler while this is open.
const LearnerDetailOverlay = ({
  learner,
  onClose,
  getStatusColor
}: {
  learner: Application;
  onClose: () => void;
  getStatusColor: (status: string) => string;
}) => {
  useEscapeToClose({ enabled: true, onEscape: onClose });
  const profile = learner.profile;

  return (
    <div
      className="fixed inset-0 z-[60] overflow-y-auto"
      onClick={onClose}
      aria-hidden="true"
    >
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20">
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75"></div>
        <div className="relative bg-white rounded-lg max-w-3xl w-full p-6" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            <XCircleIcon className="h-6 w-6" />
          </button>
          <h3 className="text-2xl font-bold mb-6">{profile.name || 'Candidate Details'}</h3>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">Passport ID</label>
                <p className="mt-1 text-gray-900">{asDetailText(profile.passport_id)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Registration Number</label>
                <p className="mt-1 text-gray-900">{asDetailText(profile.registration_number)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Date of Birth</label>
                <p className="mt-1 text-gray-900">{asDetailText(profile.date_of_birth)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Age</label>
                <p className="mt-1 text-gray-900">{asDetailText(profile.age)}</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500">Course</label>
              <p className="mt-1 text-gray-900">{asDetailText(profile.course)}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500">Branch/Field</label>
              <p className="mt-1 text-gray-900">{asDetailText(profile.branch_field)}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500">Skills</label>
              <p className="mt-1 text-gray-900">{asDetailText(profile.skill)}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500">Alternate Contact</label>
              <p className="mt-1 text-gray-900">{asDetailText(profile.alternate_number)}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500">Application Status</label>
              <span className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(learner.application_status)}`}>
                {learner.application_status?.replace('_', ' ').toUpperCase() || 'UNKNOWN'}
              </span>
            </div>

            <div className="pt-4 border-t flex space-x-3">
              <button
                onClick={() => window.open(`mailto:${profile.email}`, '_blank')}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
              >
                Send Email
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ApplicationsModal = ({ requisition, onClose }: RequisitionModalProps) => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLearner, setSelectedLearner] = useState<Application | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  // Escape closes this modal — but only when the nested learner-detail
  // overlay is not open (that overlay handles its own Escape).
  useEscapeToClose({ enabled: !selectedLearner, onEscape: onClose });

  useEffect(() => {
    loadApplications();
  }, [requisition.id]);

  const loadApplications = async () => {
    setLoading(true);
    try {
      const result: any = await apiPost('/recruiter/actions', {
        action: 'get-applications-by-opportunity',
        opportunityId: requisition.id
      });

      // apiPost returns the { success, data, error, meta } envelope; the
      // backend action returns the row array directly in result.data.
      const rows = result?.data;
      setApplications(Array.isArray(rows) ? rows : []);
    } catch (error) {
      logger.error('Error loading applications', toError(error));
      toast.error('Failed to load applications. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Wire the previously dead Reject button: backend endpoint is
  // POST /api/opportunities { action: 'update-application-status', id, status }.
  const handleRejectApplication = async (app: Application) => {
    if (rejectingId) return; // one in-flight rejection at a time
    setRejectingId(app.id);
    try {
      await apiPost('/opportunities', {
        action: 'update-application-status',
        id: app.id,
        status: 'rejected'
      });
      setApplications(prev => prev.map(a => (a.id === app.id ? { ...a, application_status: 'rejected' } : a)));
      toast.success('Application marked as rejected');
    } catch (error) {
      logger.error('Error rejecting application', toError(error));
      toast.error(error instanceof ApiError ? error.message : 'Failed to reject application');
    } finally {
      setRejectingId(null);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      applied: 'bg-blue-100 text-blue-800',
      viewed: 'bg-gray-100 text-gray-800',
      under_review: 'bg-yellow-100 text-yellow-800',
      interview_scheduled: 'bg-purple-100 text-purple-800',
      interviewed: 'bg-indigo-100 text-indigo-800',
      offer_received: 'bg-green-100 text-green-800',
      accepted: 'bg-green-200 text-green-900',
      rejected: 'bg-red-100 text-red-800',
      withdrawn: 'bg-gray-200 text-gray-600'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInHours < 24) {
      return 'Today';
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    } else {
      return formatDate(dateString);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20">
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75"
          onClick={onClose}
          aria-hidden="true"
        ></div>
        <div className="relative bg-white rounded-lg max-w-6xl w-full p-6 max-h-[90vh] overflow-y-auto">
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
            <XCircleIcon className="h-6 w-6" />
          </button>
          <h2 className="text-2xl font-bold mb-2">Applications for {requisition.job_title}</h2>
          <p className="text-gray-600 mb-6">{applications.length} applications received</p>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading applications...</p>
            </div>
          ) : applications.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <UsersIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No applications received yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Candidate
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Position
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Applied
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Experience
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {applications.map((app) => {
                    // Typed fallback avoids the `LearnerProfile | {}` union leak.
                    const profile = (app.learners?.profile || {}) as LearnerProfile;
                    const relativeTime = formatRelativeTime(app.applied_at);

                    return (
                      <tr key={app.id} className="hover:bg-gray-50 transition-colors">
                        {/* Candidate */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                              <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                                <span className="text-primary-600 font-semibold text-sm">
                                  {(profile.name || 'N/A').charAt(0).toUpperCase()}
                                </span>
                              </div>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {profile.name || 'Unknown Candidate'}
                              </div>
                              <div className="text-sm text-gray-500">
                                {profile.email || app.learners?.email || 'N/A'}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Position */}
                        <td className="px-4 py-4">
                          <div className="text-sm text-gray-900 font-medium">
                            {asDetailText(profile.branch_field || profile.course)}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(app.application_status)}`}>
                            <ClockIcon className="h-3 w-3 mr-1" />
                            {app.application_status?.replace('_', ' ') || 'Unknown'}
                          </span>
                        </td>

                        {/* Applied */}
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          {relativeTime}
                        </td>

                        {/* Experience */}
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          {asDetailText(profile.course)}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-4 whitespace-nowrap text-sm">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => setSelectedLearner({ ...app, profile })}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-md border border-blue-600 transition-colors"
                              title="View Details"
                            >
                              <EyeIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleRejectApplication(app)}
                              disabled={rejectingId !== null || app.application_status === 'rejected'}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-md border border-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title={app.application_status === 'rejected' ? 'Already rejected' : 'Reject'}
                            >
                              <XCircleIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Learner Detail Modal */}
          {selectedLearner && (
            <LearnerDetailOverlay
              learner={selectedLearner}
              onClose={() => setSelectedLearner(null)}
              getStatusColor={getStatusColor}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Requisitions;