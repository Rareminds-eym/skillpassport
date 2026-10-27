import './Opportunities.css';
import { apiGet } from '@/shared/api';
import { OpportunityDialog } from '@/features/opportunities/ui/OpportunityDialog';
import { emptyOpportunityFilters, readOpportunitySearch } from '@/features/opportunities/lib/filters';
import { opportunityText, jobSalary } from '@/features/opportunities/lib/presentation';
import { getOpportunityTabs, resolveOpportunityTab } from '@/features/opportunities/lib/navigation';
import { ApplicationsPanel as MyApplicationsContent } from '@/features/opportunities';
import { applicationUpdated } from '@/features/opportunities';
import { useAuthStore } from '@/shared/model/authStore';
import { useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Factory,
  Grid3x3,
  List,
  MapPin,
  Search,
  X,
  XCircle
} from 'lucide-react';
import * as React from 'react';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { opportunitiesService } from '@/features/opportunities/api/opportunitiesService';
import { getMissingInstitutionFields } from '@/features/opportunities/lib/institutionDetails';
import { getExternalApplicationUrl, openExternalApplication } from '@/features/opportunities/lib/externalApplication';
import { AdvancedFilters, OpportunityCard, OpportunityListItem, OpportunityPreview, RecommendedJobs, IndustrialVisitPreview, IndustrialVisitRegistration } from '@/widgets/learner-dashboard';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem
} from '@/shared/ui';

import { useOpportunities, LearningMatches, useOpportunityPage } from '@/features/opportunities';
import { useLearnerDataByEmail } from '@/entities/learner';
import { getPageNumbers } from '@/shared/lib/pagination';
import { useProfileCompletion } from '@/features/learner-profile';
import { AppliedJobsService, SavedJobsService } from '@/features/opportunities';
import { factoryVisitsService } from '@/features/college-admin/api/factoryVisitsService';
import { isSchoolLearner, isCollegeLearner, isLearner } from '@/entities/learner/lib/learnerType';
import { getLogger } from '@/shared/config/logging';
import { useUser } from '@/shared/model/authStore';
import { useSubscriptionQuery } from '@/features/subscription/model/useSubscriptionQuery';
import { checkFeatureAccess } from '@/features/subscription/lib/featureGating';
import { PLAN_IDS } from '@/shared/config/subscriptionPlans';

const logger = getLogger('Opportunities');

// Import Applications component content
import { useMessageNotifications } from '@/features/messaging';
import { learnerPipelineService as LearnerPipelineService } from '@/features/learner-profile/api';

const MissingInstitutionFields = ({ fields }) => (
  <div className="bg-blue-50 rounded-lg p-4 mb-6">
    <p className="text-sm font-semibold text-gray-800 mb-2">Missing information:</p>
    <ul className="text-sm text-gray-700 space-y-1 list-disc pl-5">
      {fields.map((field) => <li key={field}>{field}</li>)}
    </ul>
  </div>
);

const formatLastUpdate = applicationUpdated;

const Opportunities = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const setSearchParamsRef = React.useRef(setSearchParams);
  setSearchParamsRef.current = setSearchParams;
  const searchState = React.useMemo(() => readOpportunitySearch(searchParams), [searchParams]);
  const updateSearch = (patch, { reset = false, replace = true } = {}) => setSearchParamsRef.current(previous => {
    const next = new URLSearchParams(previous);
    for (const [key,value] of Object.entries(patch)) {
      next.delete(key);
      if (Array.isArray(value)) value.forEach(item => next.append(key,item));
      else if (value !== null && value !== undefined && value !== '') next.set(key,String(value));
    }
    if (reset) { next.delete('page'); next.delete('job'); }
    return next;
  }, { replace });
  const queryClient = useQueryClient();
  const user = useUser();
  const userEmail = (useAuthStore.getState().user?.email || localStorage.getItem("userEmail")) || user?.email;
  const { learnerData } = useLearnerDataByEmail(userEmail);
  const learnerId = learnerData?.id; // Use learners.id (database ID)

  // Feature gating for job applications
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const { subscriptionData } = useSubscriptionQuery();
  const userPlan = subscriptionData?.plan || PLAN_IDS.FREEMIUM;

  // Check feature access for job applications
  const accessResult = checkFeatureAccess(userPlan, 'opportunities_access', [], {}, user?.id);
  const canAccessOpportunities = accessResult.hasAccess;

  // Check institution details completion
  const [showInstitutionModal, setShowInstitutionModal] = useState(false);
  const missingInstitutionFields = getMissingInstitutionFields(learnerData);
  const isInstitutionComplete = missingInstitutionFields.length === 0;

  // Show modal on mount if institution details are incomplete
  useEffect(() => {
    if (learnerData && !isInstitutionComplete) {
      setShowInstitutionModal(true);
    }
  }, [learnerId, isInstitutionComplete]);

  // Check profile completion status
  const { canApplyToJobs, needsProfileCompletion, missingFields, completionPercentage, error: profileCheckError, refreshProfileStatus, isLoading: profileCheckLoading } = useProfileCompletion(learnerId, !!learnerId);

  // Left sidebar tab state - Set default based on learner type
  const getDefaultTab = () => {
    if (!learnerData) return 'my-jobs'; // Temporary default while loading
    const gradeStr = String(learnerData.grade || '').toUpperCase().trim();

    // Check for college/university grades (UG, PG, etc.) - default to my-jobs
    if (gradeStr.includes('UG') || gradeStr.includes('PG') ||
      gradeStr.includes('YEAR') || gradeStr.includes('UNDERGRADUATE') ||
      gradeStr.includes('POSTGRADUATE') || gradeStr.includes('BACHELOR') ||
      gradeStr.includes('MASTER')) {
      return 'my-jobs';
    }

    // Check for Diploma explicitly - treat as high school
    if (gradeStr.includes('DIPLOMA')) {
      return 'industrial-visits';
    }

    // Extract numeric part from strings like "GRADE 10", "10", "10TH", etc.
    const match = gradeStr.match(/(\d+)/);

    if (match) {
      const gradeNum = parseInt(match[1], 10);

      // Middle school (6-8): Default to industrial visits
      if (gradeNum >= 6 && gradeNum <= 8) {
        return 'industrial-visits';
      }

      // High school (9-12): Default to industrial visits
      if (gradeNum >= 9 && gradeNum <= 12) {
        return 'industrial-visits';
      }
    }

    // College: Default to my-jobs
    return 'my-jobs';
  };

  // Memoize learner type to prevent unnecessary recalculations
  const learnerType = React.useMemo(() => {
    if (!learnerData) return { isSchoolLearner: false, isUniversityLearner: false, isMiddleSchool: false, isHighSchool: false, isLearner: false };

    const isSchool = isSchoolLearner(learnerData);
    const isUniversity = isCollegeLearner(learnerData);
    const isLearnerType = isLearner(learnerData);

    // Determine specific school level
    let isMiddleSchool = false;
    let isHighSchool = false;

    if (learnerData.grade) {
      const gradeStr = String(learnerData.grade).toUpperCase().trim();

      // Check for college/university grades (UG, PG, etc.)
      if (gradeStr.includes('UG') || gradeStr.includes('PG') ||
        gradeStr.includes('YEAR') || gradeStr.includes('UNDERGRADUATE') ||
        gradeStr.includes('POSTGRADUATE') || gradeStr.includes('BACHELOR') ||
        gradeStr.includes('MASTER')) {
        // These are college learners, not high school
        isMiddleSchool = false;
        isHighSchool = false;
      }
      // Check for Diploma explicitly - treat as high school
      else if (gradeStr.includes('DIPLOMA')) {
        isHighSchool = true;
      } else {
        // Extract numeric part from strings like "GRADE 10", "10", "10TH", etc.
        const match = gradeStr.match(/(\d+)/);

        if (match) {
          const gradeNum = parseInt(match[1], 10);
          isMiddleSchool = gradeNum >= 6 && gradeNum <= 8;
          isHighSchool = gradeNum >= 9 && gradeNum <= 12;
        }
      }
    }

    return {
      isSchoolLearner: isSchool,
      isUniversityLearner: isUniversity,
      isMiddleSchool,
      isHighSchool,
      isLearner: isLearnerType
    };
  }, [learnerData]);

  const availableTabs = getOpportunityTabs(learnerType);
  const activeTab = resolveOpportunityTab(searchState.tab, getDefaultTab(), availableTabs);
  const setActiveTab = tab => updateSearch({ tab, job: null }, { replace: false }); // 'my-jobs', 'my-applications', 'industrial-visits', or 'history'

  useEffect(() => {
    if (activeTab !== 'industrial-visits') return;
    const alreadyHidden = document.body.classList.contains('hide-zoho-widget');
    document.body.classList.add('hide-zoho-widget', 'visit-browsing-active');
    return () => {
      document.body.classList.remove('visit-browsing-active');
      if (!alreadyHidden) document.body.classList.remove('hide-zoho-widget');
    };
  }, [activeTab]);

  // Handle navigation state to set active tab
  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
    }
  }, [location.state]);

  const [searchTerm, setSearchTerm] = useState(searchState.query);
  const [debouncedSearch, setDebouncedSearch] = useState(searchState.query);
  const sortBy = searchState.sort;
  const setSortBy = sort => updateSearch({ sort }, { reset: true });
  const viewMode = searchState.view;
  const setViewMode = view => updateSearch({ view });
  useEffect(() => { setSearchTerm(searchState.query); setDebouncedSearch(searchState.query); }, [searchState.query]);
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(!!searchParams.get('job'));
  const selectOpportunity = job => { setSelectedOpportunity(job); setDetailsOpen(true); updateSearch({ job: job.id }, { replace: false }); };
  const changeDetailsOpen = open => { setDetailsOpen(open); if (!open) updateSearch({ job: null }); };


  useEffect(() => {
    const selectedId = location.state?.selectedOpportunityId || searchParams.get('job');
    if (!selectedId) return;
    let active = true;
    opportunitiesService.getOpportunityById(selectedId).then(job => {
      if (!active) return;
      if (job) { setSelectedOpportunity(job); setDetailsOpen(true); }
      else toast.error('This opportunity is no longer available');
      if (location.state?.selectedOpportunityId) navigate(`${location.pathname}${location.search}`, { replace: true, state: {} });
    }).catch(() => { if (active) toast.error('Unable to load opportunity details'); });
    return () => { active = false; };
  }, [location.state?.selectedOpportunityId, searchParams.get('job')]);
  const [appliedJobs, setAppliedJobs] = useState(new Set());
  const [savedJobs, setSavedJobs] = useState(new Set());
  const [isApplying, setIsApplying] = useState(false);
  const advancedFilters = searchState.filters;
  const setAdvancedFilters = filters => updateSearch(filters, { reset: true });
  const currentPage = searchState.page;
  const setCurrentPage = page => updateSearch({ page, job: null }, { replace: false });
  const opportunitiesPerPage = 6;

  // My Applications state
  const [recommendedJobIds, setRecommendedJobIds] = useState([]);
  const [applicationsRevision, setApplicationsRevision] = useState(0);
  const appPageValue = Number(searchParams.get('appPage') || 1);
  const appPage = Number.isSafeInteger(appPageValue) && appPageValue > 0 && appPageValue <= 10001 ? appPageValue : 1;
  const setAppPage = appPage => updateSearch({ appPage });
  const appItemsPerPage = 10;
  const searchQuery = (searchParams.get('appQ') || '').slice(0, 200);
  const setSearchQuery = appQ => updateSearch({ appQ: appQ.slice(0,200), appPage: null });
  const statusFilter = searchParams.get('appStatus') || 'all';
  const setStatusFilter = appStatus => updateSearch({ appStatus, appPage: null });

  const kindFilter = ['jobs','visits'].includes(searchParams.get('appKind')) ? searchParams.get('appKind') : 'all';
  const setKindFilter = appKind => updateSearch({appKind,appStatus:null,appPage:null});
  const resetApplicationFilters = () => updateSearch({appQ:null,appStatus:null,appKind:null,appPage:null});

  // Industrial Visits state
  const [visitFacets, setVisitFacets] = useState({ sectors: [], locations: [] });
  const [visitFacetsError, setVisitFacetsError] = useState('');
  const [visitFacetsLoading, setVisitFacetsLoading] = useState(false);
  const [visitFacetsRevision, setVisitFacetsRevision] = useState(0);
  const [visitsRevision, setVisitsRevision] = useState(0);
  const [selectedIndustrialVisit, setSelectedIndustrialVisit] = useState(null);
  const ivSearchTerm = (searchParams.get('visitQ') || '').slice(0, 200);
  const setIvSearchTerm = value => updateSearch({ 'visitQ': value, visitPage: null });
  const ivSectorFilter = searchParams.get('visitSector') || 'all';
  const setIvSectorFilter = value => updateSearch({ 'visitSector': value, visitPage: null });
  const ivLocationFilter = searchParams.get('visitLocation') || 'all';
  const setIvLocationFilter = value => updateSearch({ 'visitLocation': value, visitPage: null });
  const ivViewMode = searchParams.get('visitView') === 'list' ? 'list' : 'grid';
  const setIvViewMode = value => updateSearch({ 'visitView': value });
  const visitPageValue = Number(searchParams.get('visitPage') || 1);
  const ivCurrentPage = Number.isSafeInteger(visitPageValue) && visitPageValue > 0 && visitPageValue <= 10001 ? visitPageValue : 1;
  const setIvCurrentPage = value => updateSearch({ visitPage: typeof value === 'function' ? value(ivCurrentPage) : value });
  const ivItemsPerPage = 10;
  const [registeredVisits, setRegisteredVisits] = useState(new Set());
  const [isRegistering, setIsRegistering] = useState(false);
  const [visitRegistrationError, setVisitRegistrationError] = useState(null);
  const [visitDialogOpen,setVisitDialogOpen] = useState(false);
  const [hasVisitPreview, setHasVisitPreview] = useState(() => window.matchMedia('(min-width: 1024px)').matches);
  useEffect(() => {
    const query = window.matchMedia('(min-width: 1024px)');
    const update = () => {
      setHasVisitPreview(query.matches);
      if (query.matches) setVisitDialogOpen(false);
    };
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  const openVisit = visit => {
    setSelectedIndustrialVisit(visit);
    setVisitDialogOpen(!hasVisitPreview);
  };
  const visitsParams = new URLSearchParams({ limit: String(ivItemsPerPage), offset: String((ivCurrentPage-1)*ivItemsPerPage), search: ivSearchTerm });
  if (ivSectorFilter !== 'all') visitsParams.set('sector', ivSectorFilter);
  if (ivLocationFilter !== 'all') visitsParams.set('location', ivLocationFilter);
  const visitsFeed = useOpportunityPage(`/opportunities/visits?${visitsParams}`, 'visits', learnerId, activeTab === 'industrial-visits', visitsRevision);
  const industrialVisitsLoading = visitsFeed.loading;
  const industrialVisits = React.useMemo(() => visitsFeed.rows.map(visit => ({...visit,company_name:opportunityText(visit.company_name),description:opportunityText(visit.description),location:opportunityText(visit.location)})), [visitsFeed.rows]);
  const filteredVisits = industrialVisits;
  useEffect(() => {
    if (visitsFeed.loading || visitsFeed.error || activeTab !== 'industrial-visits') return;
    setSelectedIndustrialVisit(previous=>industrialVisits.find(visit=>visit.id===previous?.id)||industrialVisits[0]||null);
    setVisitDialogOpen(false);
    const pages=Math.max(1,Math.ceil(visitsFeed.total/ivItemsPerPage));
    if(ivCurrentPage>pages)setIvCurrentPage(pages);
  },[industrialVisits,visitsFeed.loading,visitsFeed.error,visitsFeed.total,ivCurrentPage,activeTab]);
  const applicationParams = new URLSearchParams({limit:String(appItemsPerPage),offset:String((appPage-1)*appItemsPerPage),search:activeTab === 'history' ? '' : searchQuery,status:activeTab === 'history' ? 'all' : statusFilter,kind:activeTab === 'history'?'visits':kindFilter});
  if (activeTab === 'history') applicationParams.set('kind','visits');
  const applicationFeed = useOpportunityPage(`/opportunities/applications?${applicationParams}`, 'applications', learnerId, activeTab === 'my-applications' || activeTab === 'history', applicationsRevision);
  const appTotalPages = Math.max(1, Math.ceil(applicationFeed.total/appItemsPerPage));
  const fetchApplicationsData = React.useCallback(() => setApplicationsRevision(revision=>revision+1), []);
  useEffect(() => {
    if ((activeTab === 'my-applications' || activeTab === 'history') && !applicationFeed.loading && !applicationFeed.error && appPage>appTotalPages) setAppPage(appTotalPages);
  },[applicationFeed.loading,applicationFeed.error,appPage,appTotalPages,activeTab]);

  // All search predicates are applied before server pagination.
  const serverFilters = React.useMemo(() => {
    const filters = {};

    // Employment type filter based on learner level
    // NOTE: Database stores employment_type with capital first letter (e.g., "Internship", "Full-time")
    if (learnerType.isMiddleSchool) {
      // Middle school: No regular opportunities, only industrial visits
      // Don't set employmentType filter - let it show no results naturally
      // or set to a non-existent type to explicitly exclude all
      filters.employmentType = ['__NONE__']; // Invalid type to exclude all opportunities
    } else if (learnerType.isHighSchool) {
      // High school (9-12): Only internships
      filters.employmentType = ['Internship'];
    } else if (learnerType.isLearner) {
      // Learners: Only full-time jobs and internships (no industrial visits)
      if (advancedFilters.employmentType.length > 0) {
        filters.employmentType = advancedFilters.employmentType;
      } else {
        filters.employmentType = ['Internship', 'Full-time'];
      }
    } else if (learnerType.isUniversityLearner) {
      // College: Both internships and full-time jobs
      if (advancedFilters.employmentType.length > 0) {
        filters.employmentType = advancedFilters.employmentType;
      }
      // If no advanced filter, don't set employmentType to show all (internships and full-time jobs)
      // But we need to exclude factory_visit which is already handled by the API
    } else if (advancedFilters.employmentType.length > 0) {
      filters.employmentType = advancedFilters.employmentType;
    }

    if (advancedFilters.experienceLevel.length > 0) {
      filters.experienceLevel = advancedFilters.experienceLevel;
    }
    if (advancedFilters.mode.length > 0) {
      filters.mode = advancedFilters.mode;
    }
    if (advancedFilters.department.length > 0) {
      filters.department = advancedFilters.department;
    }
    if (advancedFilters.salaryMin) {
      filters.salaryMin = advancedFilters.salaryMin;
    }
    if (advancedFilters.salaryMax) {
      filters.salaryMax = advancedFilters.salaryMax;
    }
    if (advancedFilters.postedWithin) {
      filters.postedWithin = advancedFilters.postedWithin;
    }

    if (advancedFilters.skills.length) filters.skills = advancedFilters.skills;
    return filters;
  }, [advancedFilters, learnerType.isMiddleSchool, learnerType.isHighSchool, learnerType.isUniversityLearner, learnerType.isLearner]);

  // Fetch opportunities with server-side pagination
  // IMPORTANT: Only fetch after learnerData is loaded to ensure correct filters
  const [isLoading, setIsLoading] = useState(true);

  // Determine if we should fetch opportunities based on learner type and active tab
  const shouldFetchOpportunities = React.useMemo(() => {
    return activeTab === 'my-jobs';
  }, [activeTab]);

  const {
    opportunities,
    loading: dataLoading,
    hasLoadedPage,
    error,
    totalCount,
    totalPages,
    refreshOpportunities
  } = useOpportunities({
    fetchOnMount: shouldFetchOpportunities && !!learnerData,
    activeOnly: true,
    searchTerm: debouncedSearch,
    page: currentPage,
    pageSize: opportunitiesPerPage,
    sortBy: sortBy,
    filters: serverFilters,
    serverSidePagination: true
  });

  const filteredAndSortedOpportunities = opportunities;
  // Keep typing responsive; the URL is the durable search/filter/page state.
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== debouncedSearch) {
        setDebouncedSearch(searchTerm);
        updateSearch({ q: searchTerm }, { reset: true });
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [searchTerm, debouncedSearch]);
  const resultKey = JSON.stringify([debouncedSearch, sortBy, advancedFilters, currentPage]);
  useEffect(() => {
    if (dataLoading || !hasLoadedPage || activeTab !== 'my-jobs') return;
    if (error) { setSelectedOpportunity(null); setDetailsOpen(false); return; }
    if (!searchParams.get('job')) {
      setSelectedOpportunity(previous => opportunities.find(job => job.id === previous?.id) || opportunities[0] || null);
      setDetailsOpen(false);
    }
    if (totalPages > 0 && currentPage > totalPages) setCurrentPage(totalPages);
  }, [opportunities, dataLoading, hasLoadedPage, resultKey, activeTab, error, searchParams.get('job')]);

  // Set loading to false when data is ready (removed artificial 5-second delay)
  useEffect(() => {
    // For middle school learners, wait for industrial visits to load
    if (learnerType.isMiddleSchool) {
      if (!industrialVisitsLoading) {
        setIsLoading(false);
      }
    }
    // For high school and college, wait for opportunities to load
    else if (learnerType.isHighSchool || learnerType.isUniversityLearner) {
      if (!dataLoading) {
        setIsLoading(false);
      }
    }
    // Fallback: if learnerData is loaded but no specific type detected
    else if (learnerData) {
      setIsLoading(false);
    }
  }, [dataLoading, industrialVisitsLoading, learnerType.isMiddleSchool, learnerType.isHighSchool, learnerType.isUniversityLearner, learnerData]);

  useMessageNotifications({
    userId: learnerId,
    userType: 'learner',
    enabled: !!learnerId
  });

  const membershipIds = React.useMemo(() => {
    const visibleIds = activeTab === 'industrial-visits'
      ? industrialVisits.map(visit => visit.id)
      : activeTab === 'my-jobs' ? [...opportunities.map(job => job.id), ...recommendedJobIds, selectedOpportunity?.id] : [];
    return [...new Set(visibleIds.filter(Boolean))].sort();
  }, [activeTab, opportunities, industrialVisits, recommendedJobIds, selectedOpportunity?.id]);
  const membershipKey = membershipIds.join(',');
  const membershipEpoch = React.useRef(0);
  const membershipMutations = React.useRef(0);
  const [membershipRevision, setMembershipRevision] = useState(0);
  const beginMembershipMutation = () => { membershipEpoch.current += 1; membershipMutations.current += 1; };
  const endMembershipMutation = () => {
    membershipMutations.current -= 1;
    membershipEpoch.current += 1;
    setMembershipRevision(revision=>revision+1);
  };
  useEffect(()=>{setAppliedJobs(new Set());setSavedJobs(new Set());setRegisteredVisits(new Set());},[learnerId]);
  useEffect(() => {
    if (!learnerId || !membershipKey || membershipMutations.current > 0) return;
    const epoch = membershipEpoch.current;
    const controller = new AbortController();let active=true;
    apiGet(`/opportunities/membership?ids=${encodeURIComponent(membershipKey)}`,{signal:controller.signal}).then(response=>{
      if(!active || epoch !== membershipEpoch.current)return;
      const data=response.data;
      if(!Array.isArray(data?.appliedIds)||!Array.isArray(data?.savedIds))return;
      const requested=new Set(membershipKey.split(','));
      setAppliedJobs(previous=>new Set([...previous].filter(id=>!requested.has(id)).concat(data.appliedIds)));
      setSavedJobs(previous=>new Set([...previous].filter(id=>!requested.has(id)).concat(data.savedIds)));
      setRegisteredVisits(previous=>new Set([...previous].filter(id=>!requested.has(id)).concat(data.appliedIds)));
    }).catch(error=>{if(active)logger.error('Unable to load job membership',error);});
    return ()=>{active=false;controller.abort();};
  },[learnerId,membershipKey,membershipRevision]);

  // Enrich only the backend application page for presentation.
  const applications = React.useMemo(() => {
      const applicationsData = applicationFeed.rows;
      const transformedApplications = applicationsData.map(app => ({
        id: app.id,
        learnerId: app.learner_id,
        jobTitle: opportunityText(app.opportunity?.job_title || app.opportunity?.title || 'N/A'),
        company: opportunityText(app.opportunity?.company_name || 'N/A'),
        location: app.opportunity?.location || 'N/A',
        salary: jobSalary(app.opportunity),
        appliedDate: app.applied_at || null,
        status: app.application_status,
        logo: app.opportunity?.company_logo,
        type: app.opportunity?.employment_type || 'N/A',
        level: app.opportunity?.experience_level || '',
        industry: app.opportunity?.sector || app.opportunity?.department || '',
        updatedAt: app.updated_at,
        lastUpdate: formatLastUpdate(app.updated_at || app.applied_at),
        opportunityId: app.opportunity_id,
        recruiterId: app.opportunity?.recruiter_id || app.pipeline_recruiter_id || app.pipeline_status?.assigned_to || null,
        pipelineStatus: app.pipeline_status,
        hasPipelineStatus: app.has_pipeline_status,
        pipelineStage: app.pipeline_stage,
        pipelineStageChangedAt: app.pipeline_stage_changed_at,
        rejectionReason: app.rejection_reason,
        nextAction: app.next_action,
        nextActionDate: app.next_action_date,
        interviews: app.interviews || []
      }));

      return transformedApplications;
  }, [applicationFeed.rows]);

  // Subscribe to real-time pipeline updates - reuse fetchApplicationsData
  useEffect(() => {
    if (!learnerId || activeTab !== 'my-applications') return;

    const channel = LearnerPipelineService.subscribeToPipelineUpdates(
      learnerId,
      () => fetchApplicationsData() // Reuse the memoized function
    );

    return () => {
      LearnerPipelineService.unsubscribeFromPipelineUpdates(channel);
    };
  }, [learnerId, activeTab, fetchApplicationsData]);

  // Facets are aggregated in SQL; neither filters nor registration badges require the full catalog.
  useEffect(() => {
    if (activeTab !== 'industrial-visits' || !learnerId) return;
    let active = true;
    const controller = new AbortController();
    setVisitFacetsLoading(true);
    setVisitFacetsError('');
    apiGet('/opportunities/visits?facets=true', {signal:controller.signal}).then(response=>{
      if (!active) return;
      if (!Array.isArray(response.data?.sectors) || !Array.isArray(response.data?.locations)) throw new Error('Invalid filter options response.');
      setVisitFacets(response.data);
    }).catch(()=>{
      if(active) setVisitFacetsError('Visit filter options could not be loaded. Retry to restore all choices.');
    }).finally(()=>{if(active) setVisitFacetsLoading(false);});
    return ()=>{active=false;controller.abort();};
  },[activeTab,learnerId,visitFacetsRevision]);

  // Pagination handlers with proper state management
  const handleIvPageChange = (pageNum) => {
    setIvCurrentPage(pageNum);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const handleIvPreviousPage = () => handleIvPageChange(Math.max(1, ivCurrentPage - 1));
  const handleIvNextPage = (totalPages) => handleIvPageChange(Math.min(totalPages, ivCurrentPage + 1));


  // Filter and sort opportunities for My Jobs tab with advanced filters
  // Search, skills, filters, sorting and page counts are evaluated by the backend.


  const handleToggleSave = async (opportunity) => {
    if (!learnerId) {
      toast.error('Please log in to save jobs');
      return;
    }

    beginMembershipMutation();
    try {
      const result = await SavedJobsService.toggleSaveJob(learnerId, opportunity.id);

      if (result.success) {
        if (result.isSaved) {
          setSavedJobs(prev => new Set([...prev, opportunity.id]));
          toast.success('Job saved successfully!');
        } else {
          setSavedJobs(prev => {
            const newSet = new Set(prev);
            newSet.delete(opportunity.id);
            return newSet;
          });
          toast.success('Job removed from saved');
        }
      } else {
        toast.error(result.message || 'Failed to toggle save status');
        logger.error('Toggle save failed:', result.error);
      }
    } catch (error) {
      logger.error('Error toggling save:', error);
      toast.error('An error occurred while saving the job');
    } finally {
      endMembershipMutation();
    }
  };

  const handleApply = async (opportunity) => {
    // Check feature access first
    if (!canAccessOpportunities) {
      console.log('[Feature Gating] Blocking job application - Freemium user');
      setShowUpgradePrompt(true);
      toast.error('Upgrade required to apply for jobs');
      return false;
    }

    if (!learnerId) {
      logger.error('Please log in to apply for jobs');
      toast.error('Please log in to apply for jobs');
      return false;
    }

    // Check if profile is complete before allowing application
    if (needsProfileCompletion) {
      toast.error('Please complete your profile before applying');
      // Navigate to settings page
      navigate('/learner/settings');
      return false;
    }

    if (appliedJobs.has(opportunity.id)) {
      toast('You have already applied to this job');
      return false;
    }

    setIsApplying(true);
    beginMembershipMutation();

    try {
      // Refresh authoritative action fields; ranker projections are not a job DTO.
      const currentOpportunity = await opportunitiesService.getOpportunityById(opportunity.id);
      if (!currentOpportunity) throw new Error('This opportunity is no longer available');
      // Keep Details/retry destination and confirmation wording aligned with the action.
      setSelectedOpportunity(previous => previous?.id === currentOpportunity.id ? currentOpportunity : previous);
      opportunity = currentOpportunity;
      // Handle external application link
      if (opportunity.application_link) {
        // Validate before recording anything; the Details retry uses the same guard.
        const destination = getExternalApplicationUrl(opportunity.application_link);
        // Save application to profile for tracking
        const result = await AppliedJobsService.applyToJob(learnerId, opportunity.id);

        if (result.success) {
          setAppliedJobs(prev => new Set([...prev, opportunity.id]));
          toast.success('Application recorded. Complete submission on the employer website.');
        } else {
          toast.error(result.message || 'Failed to record application');
        }

        if (!result.success) return false;
        // Opening the employer page is not evidence of employer submission.
        try {
          const opened = openExternalApplication(destination);
          // noopener can itself produce a null handle; it is not an opening failure.
          if (!opened) toast('If the employer page did not open, use the application link in Details.');
        } catch {
          toast.error(result.success
            ? 'Application recorded, but the employer page could not be opened. Use the application link in Details to retry.'
            : 'The employer page could not be opened. Use the application link in Details to retry.');
        }
        return result.success === true;
      }

      // Handle regular application
      const result = await AppliedJobsService.applyToJob(learnerId, opportunity.id);

      if (result.success) {
        setAppliedJobs(prev => new Set([...prev, opportunity.id]));
        toast.success('Application submitted successfully!');
      } else {
        toast.error(result.message || 'Failed to submit application');
        logger.error('Application failed:', result.message);
      }
      return result.success === true;
    } catch (error) {
      logger.error('Error applying to job:', error);
      toast.error('An error occurred while applying');
      return false;
    } finally {
      setIsApplying(false);
      endMembershipMutation();
    }
  };

  const handleRegisterForVisit = async (visit) => {
    if (isRegistering || registeredVisits.has(visit.id)) return;
    if (!learnerId) {
      toast.error('Please log in to register for visits');
      return;
    }

    setVisitRegistrationError(null);
    setIsRegistering(true);
    beginMembershipMutation();

    try {
      const result = await factoryVisitsService.registerForVisit(learnerId, visit.id);

      if (result.success) {
        toast.success(result.message);
        setRegisteredVisits(prev => new Set([...prev, visit.id]));
        // Refresh applications to show in history
        if (activeTab === 'history') {
          fetchApplicationsData();
        }
      } else {
        toast.error(result.message);
        setVisitRegistrationError({ id: visit.id, message: result.message || 'Registration could not be completed. Please retry.' });
      }
    } catch (error) {
      logger.error('Error registering for visit:', error);
      toast.error('An error occurred while registering');
      setVisitRegistrationError({ id: visit.id, message: 'Registration could not be completed. Please retry.' });
    } finally {
      setIsRegistering(false);
      endMembershipMutation();
    }
  };

  return (
    <div className="opportunities-page min-h-screen bg-gray-50">
      <OpportunityDialog variant="visit" open={visitDialogOpen} onOpenChange={setVisitDialogOpen} title={selectedIndustrialVisit?.company_name || 'Visit details'} description="Review the visit information and registration details."
        footer={selectedIndustrialVisit && <IndustrialVisitRegistration visit={selectedIndustrialVisit} onRegister={handleRegisterForVisit} isRegistered={registeredVisits.has(selectedIndustrialVisit.id)} isRegistering={isRegistering} error={visitRegistrationError?.id === selectedIndustrialVisit.id ? visitRegistrationError.message : ''} onCompleteProfile={visitRegistrationError?.id === selectedIndustrialVisit.id && /complete your profile/i.test(visitRegistrationError.message) ? () => navigate('/learner/settings') : undefined} />}>
        {selectedIndustrialVisit && <IndustrialVisitPreview inDialog visit={selectedIndustrialVisit} isRegistered={registeredVisits.has(selectedIndustrialVisit.id)} />}
      </OpportunityDialog>
      <OpportunityDialog variant="profile" open={showInstitutionModal && !isInstitutionComplete} onOpenChange={setShowInstitutionModal} title="Complete Your Institution Details" description="Complete the missing information in your profile settings." footer={<div className="flex justify-end gap-2"><button type="button" onClick={() => setShowInstitutionModal(false)} className="rounded-md border border-slate-300 px-4 py-2 text-sm">Later</button><button type="button" onClick={() => navigate('/learner/settings', { state: { activeTab: 'profile', activeSubTab: 'institution' } })} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white">Complete Now</button></div>}>
        <MissingInstitutionFields fields={missingInstitutionFields}/>
      </OpportunityDialog>
      <div className="max-w-[1600px] mx-auto px-3 sm:px-6 py-3 sm:py-8">
        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center min-h-[80vh]">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <div className="relative">
                <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-indigo-200 border-t-indigo-600"></div>
                <img
                  src="/assets/HomePage/RMLogo.webp"
                  alt="RareMinds Logo"
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 object-contain"
                />
              </div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-6"
              >
                <p className="text-xl font-semibold text-gray-800 mb-2">Loading Opportunities...</p>
                <p className="text-sm text-gray-500 flex items-center justify-center gap-2">
                  Powered by <span className="font-semibold text-indigo-600">RareMinds</span>
                </p>
              </motion.div>
            </motion.div>
          </div>
        )}

        {!isLoading && <header className="mb-5">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3"><div><h1 className="text-2xl font-semibold leading-8 text-slate-900">Opportunities</h1><p className="mt-1 text-base leading-6 text-slate-600">Explore jobs, learning matches, and your applications.</p></div></div>
          <nav aria-label="Opportunity sections" className="flex flex-wrap gap-1 border-b border-slate-200">
            {availableTabs.map(([value,label]) => <button type="button" key={value} onClick={() => setActiveTab(value)} aria-current={activeTab===value ? 'page' : undefined} className={`min-h-10 border-b-2 px-4 py-2 text-sm font-medium ${activeTab===value ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-600 hover:text-slate-900'}`}>{label}</button>)}
          </nav>
        </header>}

        {/* Main Content Area */}
        {!isLoading && (
          <div>
            {/* My Jobs Tab - Show for high school, college, and learners */}
            {activeTab === 'my-jobs' && (learnerType.isHighSchool || learnerType.isUniversityLearner || learnerType.isLearner) && (
              <MyJobsContent
                onRecommendationsChange={setRecommendedJobIds}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                debouncedSearch={debouncedSearch}
                setDebouncedSearch={setDebouncedSearch}
                sortBy={sortBy}
                setSortBy={setSortBy}
                viewMode={viewMode}
                setViewMode={setViewMode}
                opportunities={filteredAndSortedOpportunities}
                error={error}
                loading={dataLoading}
                onRetry={refreshOpportunities}
                missingFields={missingFields}
                completionPercentage={completionPercentage}
                profileCheckLoading={profileCheckLoading}
                profileCheckError={profileCheckError}
                onRetryProfile={refreshProfileStatus}
                detailsOpen={detailsOpen}
                onDetailsOpenChange={changeDetailsOpen}
                onSelect={selectOpportunity}
                selectedOpportunity={selectedOpportunity}
                setSelectedOpportunity={setSelectedOpportunity}
                appliedJobs={appliedJobs}
                savedJobs={savedJobs}
                handleToggleSave={handleToggleSave}
                handleApply={handleApply}
                isApplying={isApplying}
                advancedFilters={advancedFilters}
                setAdvancedFilters={setAdvancedFilters}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                opportunitiesPerPage={opportunitiesPerPage}
                totalCount={totalCount}
                totalPages={totalPages}
                isServerPaginated={true}
                canApplyToJobs={canApplyToJobs}
                needsProfileCompletion={needsProfileCompletion}
                navigate={navigate}
                learnerData={learnerData}
                showUpgradePrompt={showUpgradePrompt}
                setShowUpgradePrompt={setShowUpgradePrompt}
                canAccessOpportunities={canAccessOpportunities}
              />
            )}

            {/* My Applications Tab - Show for high school, college, and learners */}
            {activeTab === 'my-applications' && (learnerType.isHighSchool || learnerType.isUniversityLearner || learnerType.isLearner) && (
              <MyApplicationsContent
                applications={applications}
                kindFilter={kindFilter}
                setKindFilter={setKindFilter}
                onResetFilters={resetApplicationFilters}
                onBrowseJobs={()=>setActiveTab('my-jobs')}
                loading={applicationFeed.loading}
                error={applicationFeed.error}
                total={applicationFeed.total}
                page={appPage}
                totalPages={appTotalPages}
                onPageChange={setAppPage}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                learnerId={learnerId}
                navigate={navigate}
                queryClient={queryClient}
                setActiveTab={setActiveTab}
                opportunities={opportunities}
                setSelectedOpportunity={setSelectedOpportunity}
                onApplicationsUpdate={fetchApplicationsData}
                showUpgradePrompt={showUpgradePrompt}
                setShowUpgradePrompt={setShowUpgradePrompt}
              />
            )}

            {/* History Tab - Show for middle school only */}
            {activeTab === 'history' && learnerType.isMiddleSchool && (
              <div className="space-y-6">
                {/* Header */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                      <Clock className="w-6 h-6 text-indigo-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">My Industrial Visit History</h2>
                  </div>
                  <p className="text-gray-600 ml-14">Track your registered industrial visits</p>
                </div>

                {/* Registrations List */}
                {(() => {
                  // Filter applications to only show factory visits
                  if (applicationFeed.loading) return <p role="status">Loading your visit history…</p>;
                  if (applicationFeed.error) return <div role="alert"><p>{applicationFeed.error}</p><button type="button" onClick={fetchApplicationsData}>Retry visit history</button></div>;
                  const visitRegistrations = applications.filter(app =>
                    app.type === 'factory_visit'
                  );

                  if (visitRegistrations.length === 0) {
                    return (
                      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                        <Factory className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                        <h3 className="text-xl font-semibold text-gray-600 mb-2">No Visit History Yet</h3>
                        <p className="text-gray-500 text-sm mb-4">You haven't registered for any industrial visits yet</p>
                        <button
                          onClick={() => setActiveTab('industrial-visits')}
                          className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                          Explore Industrial Visits
                        </button>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-4">
                      {visitRegistrations.map((app) => {
                        const statusConfig = {
                          applied: { label: 'Registered', color: 'text-blue-700', bg: 'bg-blue-50', icon: Clock },
                          accepted: { label: 'Confirmed', color: 'text-green-700', bg: 'bg-green-50', icon: CheckCircle2 },
                          rejected: { label: 'Not Selected', color: 'text-gray-600', bg: 'bg-gray-50', icon: XCircle },
                        }[app.status] || { label: 'Registered', color: 'text-blue-700', bg: 'bg-blue-50', icon: Clock };

                        const StatusIcon = statusConfig.icon;

                        return (
                          <div
                            key={app.id}
                            className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all border border-gray-200 p-6"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-start gap-4">
                                  <div className="p-3 bg-indigo-50 rounded-lg">
                                    <Factory className="w-6 h-6 text-indigo-600" />
                                  </div>
                                  <div className="flex-1">
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                                      {app.company}
                                    </h3>
                                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
                                      <div className="flex items-center gap-1.5">
                                        <MapPin className="w-4 h-4" />
                                        <span>{opportunityText(app.location)}</span>
                                      </div>
                                      <div className="flex items-center gap-1.5">
                                        <Calendar className="w-4 h-4" />
                                        <span>Registered {new Date(app.appliedDate).toLocaleDateString()}</span>
                                      </div>
                                      <div className="flex items-center gap-1.5">
                                        <Clock className="w-4 h-4" />
                                        <span>Updated {app.lastUpdate}</span>
                                      </div>
                                    </div>
                                    {app.jobTitle && app.jobTitle !== 'N/A' && (
                                      <p className="text-sm text-gray-600 mb-2">{app.jobTitle}</p>
                                    )}
                                    {app.level && app.level !== 'N/A' && (
                                      <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-semibold">
                                        {app.level}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${statusConfig.bg} border border-gray-200`}>
                                <StatusIcon className={`w-4 h-4 ${statusConfig.color}`} />
                                <span className={`text-sm font-semibold ${statusConfig.color}`}>
                                  {statusConfig.label}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            )}

            {activeTab === 'history' && !applicationFeed.loading && !applicationFeed.error && appTotalPages>1 && <nav aria-label="Visit history pages" className="flex items-center justify-between gap-3 text-sm">
              <button type="button" disabled={appPage===1} onClick={()=>setAppPage(appPage-1)}>Previous</button><span>Page {appPage} of {appTotalPages}</span><button type="button" disabled={appPage===appTotalPages} onClick={()=>setAppPage(appPage+1)}>Next</button>
            </nav>}

            {/* Industrial Visits Tab - Show for all learners */}
            {activeTab === 'industrial-visits' && (() => {
              // Pagination logic
              const totalPages = Math.max(1,Math.ceil(visitsFeed.total / ivItemsPerPage));
              const startIndex = (ivCurrentPage - 1) * ivItemsPerPage;
              const endIndex = startIndex + ivItemsPerPage;
              const paginatedVisits = filteredVisits;

              return (
                <div className="opportunity-visits space-y-6" aria-labelledby="industrial-visits-heading">
                  <h2 id="industrial-visits-heading" className="sr-only">Industrial visits</h2>
                  {/* Search and Filters - Matching Opportunities Style */}
                  <div className="space-y-4">
                    {/* Search Bar and Controls */}
                    <div className="opportunity-controls flex flex-col lg:flex-row gap-4 items-stretch lg:items-center">
                      {/* Search Bar */}
                      <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                          type="search" maxLength={200}
                          aria-label="Search visits" placeholder="Search company, location, or industry..."
                          value={ivSearchTerm}
                          onChange={(e) => {
                            setIvSearchTerm(e.target.value);
                          }}
                          className="w-full h-12 pl-12 pr-12 bg-white border border-slate-200/60 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 shadow-sm"
                        />
                        {ivSearchTerm && (
                          <button
                            aria-label="Clear visit search" onClick={() => {
                              setIvSearchTerm('');
                              }}
                            className="absolute right-1 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 transition-colors"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        )}
                      </div>

                      {/* Control Buttons */}
                      <div className="flex flex-col sm:flex-row lg:flex-row items-stretch sm:items-center gap-3 lg:flex-shrink-0">
                        {/* Sector Filter */}
                        <select
                          aria-label="Visit industry" disabled={visitFacetsLoading}
              value={ivSectorFilter}
                          onChange={(e) => {
                            setIvSectorFilter(e.target.value);
                          }}
                          className="flex-1 sm:flex-none lg:w-auto px-4 h-12 bg-white border border-slate-200/60 rounded-2xl text-slate-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 shadow-sm min-w-0 sm:min-w-[160px]"
                        >
                          <option value="all">All Industries</option>
                          {ivSectorFilter !== 'all' && !visitFacets.sectors.includes(ivSectorFilter) && <option value={ivSectorFilter}>{ivSectorFilter}</option>}
                          {visitFacets.sectors.map(sector => (
                            <option key={sector} value={sector}>{sector}</option>
                          ))}
                        </select>

                        {/* Location Filter */}
                        <select
                          aria-label="Visit location" disabled={visitFacetsLoading}
              value={ivLocationFilter}
                          onChange={(e) => {
                            setIvLocationFilter(e.target.value);
                          }}
                          className="flex-1 sm:flex-none lg:w-auto px-4 h-12 bg-white border border-slate-200/60 rounded-2xl text-slate-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 shadow-sm min-w-0 sm:min-w-[160px]"
                        >
                          <option value="all">All Locations</option>
                          {ivLocationFilter !== 'all' && !visitFacets.locations.includes(ivLocationFilter) && <option value={ivLocationFilter}>{ivLocationFilter}</option>}
                          {visitFacets.locations.map(location => (
                            <option key={location} value={location}>{location}</option>
                          ))}
                        </select>

                        {/* View Mode Toggle */}
                        <div role="group" aria-label="Visit result layout" className="opportunity-view-toggle flex items-center bg-white border border-slate-200/60 rounded-2xl p-1 shadow-sm h-12">
                          <button
                            aria-label="Visit grid view" title="Grid view" aria-pressed={ivViewMode==='grid'} onClick={() => setIvViewMode('grid')}
                            className={`flex-1 sm:flex-none p-2.5 rounded-xl transition-all duration-200 ${ivViewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-slate-400 hover:text-slate-600'
                              }`}
                          >
                            <Grid3x3 className="w-4 h-4 mx-auto" />
                          </button>
                          <button
                            aria-label="Visit list view" title="List view" aria-pressed={ivViewMode==='list'} onClick={() => setIvViewMode('list')}
                            className={`flex-1 sm:flex-none p-2.5 rounded-xl transition-all duration-200 ${ivViewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-slate-400 hover:text-slate-600'
                              }`}
                          >
                            <List className="w-4 h-4 mx-auto" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Results Count and Clear Filters */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <p role="status" aria-live="polite" className="text-sm text-gray-600">
                        {industrialVisitsLoading ? 'Loading visits…' : visitsFeed.error ? 'Visits could not be loaded' : `Showing ${filteredVisits.length ? startIndex + 1 : 0}–${Math.min(endIndex, visitsFeed.total)} of ${visitsFeed.total} visits`}

                      </p>
                      {(ivSearchTerm || ivSectorFilter !== 'all' || ivLocationFilter !== 'all') && (
                        <button
                          onClick={() => {
                            updateSearch({ visitQ: null, visitSector: null, visitLocation: null, visitPage: null });
                          }}
                          className="min-h-9 rounded-md px-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-medium flex items-center gap-1 self-start sm:self-auto"
                        >
                          <X className="w-3 h-3 md:w-4 md:h-4" />
                          Clear filters
                        </button>
                      )}
                    </div>
                  </div>

                  {visitFacetsLoading && <p role="status" className="sr-only">Loading visit filter options…</p>}
                  {visitFacetsError && <div role="alert" className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                    <p>{visitFacetsError}</p>
                    <button type="button" disabled={visitFacetsLoading} onClick={()=>setVisitFacetsRevision(value=>value+1)} className="mt-2 min-h-9 rounded-md px-2 font-medium text-blue-700 hover:bg-amber-100">Retry filter options</button>
                  </div>}

                  <section aria-label="Visit results" aria-busy={industrialVisitsLoading}>
                  {/* Industrial Visits Grid with Preview Panel */}
                  {industrialVisitsLoading ? (
                    <div aria-hidden="true" className="flex justify-center items-center py-20">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                  ) : visitsFeed.error ? (
                    <div role="alert" className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                      <p>{visitsFeed.error}</p><button type="button" onClick={()=>setVisitsRevision(value=>value+1)} className="mt-2 text-blue-700">Retry visits</button>
                    </div>
                  ) : filteredVisits.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-2xl border border-gray-200">
                      <Factory className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                      <h3 className="text-xl font-semibold text-gray-600 mb-2">No industrial visits found</h3>
                      <p className="text-gray-500 text-sm">Try another company, industry, or location.</p>
                      {(ivSearchTerm || ivSectorFilter !== 'all' || ivLocationFilter !== 'all') && <button type="button" onClick={() => updateSearch({visitQ:null,visitSector:null,visitLocation:null,visitPage:null})} className="mt-4 min-h-10 rounded-md border border-slate-300 px-4 text-sm font-medium text-blue-700 hover:bg-blue-50">Reset search and filters</button>}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Left: Cards Grid (2 columns, 6 cards) - First in DOM and visually */}
                      <div className="col-span-1 lg:col-span-2">
                        {ivViewMode === 'grid' ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {paginatedVisits.map((visit) => (
                              <div
                                key={visit.id}
                                className={`opportunity-card bg-white border rounded-2xl p-5 hover:shadow-lg transition-all cursor-pointer ${selectedIndustrialVisit?.id === visit.id
                                  ? 'border-blue-500 shadow-md ring-2 ring-blue-200'
                                  : 'border-gray-200 hover:border-blue-300'
                                  }`}
                                role="button" tabIndex={0} aria-haspopup={hasVisitPreview ? undefined : 'dialog'} aria-controls={hasVisitPreview ? 'industrial-visit-preview' : undefined} aria-describedby={`visit-state-${visit.id}`} aria-current={selectedIndustrialVisit?.id === visit.id ? 'true' : undefined} aria-label={`View visit at ${visit.company_name}`} onKeyDown={event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();openVisit(visit);}}} onClick={() => openVisit(visit)}
                              >
                                <div className="flex items-start justify-between mb-3">
                                  <div className="p-2 bg-blue-50 rounded-lg">
                                    <Factory className="w-6 h-6 text-blue-600" />
                                  </div>
                                  <span id={`visit-state-${visit.id}`} className={`visit-card-badge text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium ${registeredVisits.has(visit.id) ? 'is-registered' : ''}`}>
                                    {registeredVisits.has(visit.id) ? 'Registered' : 'Visit'}
                                  </span>
                                </div>

                                <h3 className="font-semibold text-base text-gray-900 mb-2 line-clamp-2">
                                  {visit.company_name}
                                </h3>

                                <div className="space-y-2 text-sm text-gray-600 mb-4">
                                  <div className="flex items-center gap-2">
                                    <Building2 className="w-4 h-4 flex-shrink-0" />
                                    <span className="line-clamp-1">{visit.sector}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4 flex-shrink-0" />
                                    <span className="line-clamp-1">{visit.location}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {paginatedVisits.map((visit) => (
                              <div
                                key={visit.id}
                                className={`opportunity-card bg-white border rounded-2xl p-5 hover:shadow-md transition-all cursor-pointer ${selectedIndustrialVisit?.id === visit.id
                                  ? 'border-blue-500 shadow-md ring-2 ring-blue-200'
                                  : 'border-gray-200 hover:border-blue-300'
                                  }`}
                                role="button" tabIndex={0} aria-haspopup={hasVisitPreview ? undefined : 'dialog'} aria-controls={hasVisitPreview ? 'industrial-visit-preview' : undefined} aria-describedby={`visit-state-${visit.id}`} aria-current={selectedIndustrialVisit?.id === visit.id ? 'true' : undefined} aria-label={`View visit at ${visit.company_name}`} onKeyDown={event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();openVisit(visit);}}} onClick={() => openVisit(visit)}
                              >
                                <div className="flex items-start gap-4">
                                  <div className="p-3 bg-blue-50 rounded-lg flex-shrink-0">
                                    <Factory className="w-6 h-6 text-blue-600" />
                                  </div>

                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-4 mb-2">
                                      <h3 className="font-semibold text-base text-gray-900">
                                        {visit.company_name}
                                      </h3>
                                      <span id={`visit-state-${visit.id}`} className={`visit-card-badge text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium flex-shrink-0 ${registeredVisits.has(visit.id) ? 'is-registered' : ''}`}>
                                        {registeredVisits.has(visit.id) ? 'Registered' : 'Visit'}
                                      </span>
                                    </div>

                                    <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
                                      <div className="flex items-center gap-2">
                                        <Building2 className="w-4 h-4 flex-shrink-0" />
                                        <span>{visit.sector}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <MapPin className="w-4 h-4 flex-shrink-0" />
                                        <span>{visit.location}</span>
                                      </div>
                                    </div>

                                    {visit.description && (
                                      <p className="text-sm text-gray-600 line-clamp-2">
                                        {visit.description}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Right: Fixed Preview Panel - Last in DOM and visually */}
                      <div id="industrial-visit-preview" className="opportunity-visit-preview hidden lg:block lg:col-span-1 lg:sticky lg:top-20 lg:self-start">
                        {selectedIndustrialVisit ? (
                          <IndustrialVisitPreview
                            visit={selectedIndustrialVisit}
                            onRegister={handleRegisterForVisit}
                            registrationError={visitRegistrationError?.id === selectedIndustrialVisit.id ? visitRegistrationError.message : ''}
                            onCompleteProfile={visitRegistrationError?.id === selectedIndustrialVisit.id && /complete your profile/i.test(visitRegistrationError.message) ? () => navigate('/learner/settings') : undefined}
                            isRegistered={selectedIndustrialVisit && registeredVisits.has(selectedIndustrialVisit.id)}
                            isRegistering={isRegistering}
                          />
                        ) : (
                          <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center">
                            <Factory className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                            <p className="text-gray-600 font-medium">Select a visit to view details</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  </section>

                  {/* Pagination */}
                  {visitsFeed.total > ivItemsPerPage && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="bg-white rounded-xl md:rounded-2xl border border-gray-200 shadow-sm p-4 md:p-6">
                        <Pagination aria-label="Visit result pages">
                          <PaginationContent className="flex flex-wrap items-center justify-center gap-1 md:gap-2">
                            <PaginationItem>
                              <button
                                onClick={() => {
                                  if (ivCurrentPage > 1) {
                                    handleIvPreviousPage();
                                  }
                                }}
                                disabled={ivCurrentPage === 1}
                                aria-label="Previous page"
                                className={`text-xs md:text-sm px-2 md:px-3 py-1.5 md:py-2 h-8 md:h-9 rounded-md transition-colors ${
                                  ivCurrentPage === 1
                                    ? 'text-gray-300 cursor-not-allowed'
                                    : 'border border-gray-200 text-gray-700 hover:border-blue-300 hover:text-blue-600'
                                }`}
                              >
                                ← Previous
                              </button>
                            </PaginationItem>

                            {getPageNumbers(ivCurrentPage, totalPages).map((pageNum, index) => (
                              <PaginationItem key={pageNum === '...' ? `gap-${index}` : `page-${pageNum}`}>
                                {pageNum === '...' ? (
                                  <PaginationEllipsis className="text-xs md:text-sm" />
                                ) : (
                                  <button
                                    aria-label={`Page ${pageNum}`} onClick={() => handleIvPageChange(pageNum)}
                                    aria-current={ivCurrentPage === pageNum ? 'page' : undefined}
                                    className={`text-xs md:text-sm px-2 md:px-3 py-1.5 md:py-2 h-8 md:h-9 min-w-8 md:min-w-9 flex items-center justify-center rounded-md transition-colors ${
                                      ivCurrentPage === pageNum
                                        ? 'bg-blue-500 text-white font-medium'
                                        : 'border border-gray-200 text-gray-700 hover:border-blue-300 hover:text-blue-600'
                                    }`}
                                  >
                                    {pageNum}
                                  </button>
                                )}
                              </PaginationItem>
                            ))}

                            <PaginationItem>
                              <button
                                onClick={() => {
                                  if (ivCurrentPage < totalPages) {
                                    handleIvNextPage(totalPages);
                                  }
                                }}
                                disabled={ivCurrentPage === totalPages}
                                aria-label="Next page"
                                className={`text-xs md:text-sm px-2 md:px-3 py-1.5 md:py-2 h-8 md:h-9 rounded-md transition-colors ${
                                  ivCurrentPage === totalPages
                                    ? 'text-gray-300 cursor-not-allowed'
                                    : 'border border-gray-200 text-gray-700 hover:border-blue-300 hover:text-blue-600'
                                }`}
                              >
                                Next →
                              </button>
                            </PaginationItem>
                          </PaginationContent>
                        </Pagination>
                        <div className="text-center text-sm text-gray-600 mt-4">
                          Page {ivCurrentPage} of {totalPages} • {visitsFeed.total} total visits
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        <OpportunityDialog variant="access" open={showUpgradePrompt} onOpenChange={setShowUpgradePrompt} title="Application access" description="Your current plan does not include job applications." footer={<div className="flex justify-end gap-2"><button type="button" onClick={()=>setShowUpgradePrompt(false)} className="rounded-md border px-4 py-2 text-sm">Cancel</button><button type="button" onClick={()=>navigate('/subscription/plans?type=learner')} className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white">View Plans</button></div>}><p className="text-sm leading-6 text-slate-600">Compare the available plans to enable applications.</p></OpportunityDialog>

      </div>
    </div>
  );
};


// My Jobs Content Component
const MyJobsContent = ({ onRecommendationsChange, searchTerm, setSearchTerm, sortBy, setSortBy, viewMode, setViewMode, opportunities, error, loading, onRetry, selectedOpportunity, appliedJobs, savedJobs, handleToggleSave, handleApply, isApplying, advancedFilters, setAdvancedFilters, currentPage, setCurrentPage, totalCount, totalPages, needsProfileCompletion, navigate, learnerData, canAccessOpportunities, setShowUpgradePrompt, missingFields, completionPercentage, profileCheckLoading, profileCheckError, onRetryProfile, detailsOpen, onDetailsOpenChange, onSelect }) => {
  const activeFilters = Object.values(advancedFilters).some(value=>Array.isArray(value)?value.length:!!value);
  return <div className="grid min-w-0 grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px] 2xl:grid-cols-[minmax(0,1fr)_360px]"><div className="min-w-0">
    <LearningMatches onSelectJob={onSelect}/>
    <h2 className="mb-3 text-base font-semibold text-slate-900">All job openings</h2>
    <section aria-label="Search jobs" className="mb-4 space-y-3">
      <div className="opportunity-controls flex flex-wrap gap-2">
        <label className="relative min-w-0 flex-[1_1_280px]"><span className="sr-only">Search jobs by title, company, or location</span><Search size={17} className="pointer-events-none absolute left-3 top-3 text-slate-400"/><input type="search" value={searchTerm} onChange={event=>setSearchTerm(event.target.value)} placeholder="Search job title, company, or location..." className="h-10 w-full rounded-md border border-slate-300 bg-white pl-9 pr-3 text-sm placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"/></label>
        <AdvancedFilters onApplyFilters={setAdvancedFilters} initialFilters={advancedFilters}/>
        <label className="min-w-0"><span className="sr-only">Sort jobs</span><select value={sortBy} onChange={event=>setSortBy(event.target.value)} className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700"><option value="newest">Newest first</option><option value="oldest">Oldest first</option></select></label>
        <div aria-label="Result layout" role="group" className="flex h-10 rounded-md border border-slate-300 bg-white p-1">{[['grid',Grid3x3,'Grid view'],['list',List,'List view']].map(([value,Icon,label])=><button type="button" key={value} onClick={()=>setViewMode(value)} aria-label={label} title={label} aria-pressed={viewMode===value} className={`flex w-9 items-center justify-center rounded ${viewMode===value?'bg-blue-50 text-blue-700':'text-slate-500 hover:bg-slate-50'}`}><Icon size={16}/></button>)}</div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2"><p role="status" aria-live="polite" className="text-sm leading-5 text-slate-600">{loading ? 'Updating jobs…' : error ? 'Jobs could not be loaded' : `${totalCount} ${totalCount===1?'job':'jobs'}${totalCount>0?` · Page ${currentPage} of ${totalPages}`:''}`}</p>{activeFilters&&<button type="button" onClick={()=>setAdvancedFilters(emptyOpportunityFilters())} className="min-h-8 rounded px-2 text-sm font-medium text-blue-700 hover:bg-blue-50">Clear all filters</button>}</div>
    </section>
    {error ? <section role="alert" className="rounded-lg border border-red-200 bg-white p-6"><h2 className="text-base font-semibold text-slate-900">Unable to load jobs</h2><p className="mt-2 text-sm leading-5 text-slate-600">Your search and filters have been kept. Please try again.</p><button type="button" onClick={onRetry} className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-sm text-white">Retry jobs</button></section> : <>
      <div className="min-w-0">
        <div aria-busy={loading} className="min-w-0">
          {loading && !opportunities.length ? <div role="status" className="rounded-lg border bg-white p-6 text-sm text-slate-600">Loading jobs…</div> : opportunities.length ? <div className={viewMode==='grid'?'grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-3':'space-y-3'}>{opportunities.map(job=>{const Card=viewMode==='grid'?OpportunityCard:OpportunityListItem;return <Card key={job.id} opportunity={job} isSelected={selectedOpportunity?.id===job.id} isApplied={appliedJobs.has(job.id)} isSaved={savedJobs.has(job.id)} isApplying={isApplying} learnerData={learnerData} onClick={()=>onSelect(job)} onApply={()=>onSelect(job)} onToggleSave={handleToggleSave}/>;})}</div> : <section className="rounded-lg border border-slate-200 bg-white p-8 text-center"><h2 className="text-base font-semibold text-slate-900">No jobs match your search</h2><p className="mt-2 text-sm leading-5 text-slate-600">Try another keyword or remove a filter.</p><button type="button" onClick={()=>{setSearchTerm('');setAdvancedFilters(emptyOpportunityFilters());}} className="mt-4 rounded-md border border-slate-300 px-4 py-2 text-sm">Reset search and filters</button></section>}
          {totalPages>1&&<nav aria-label="Job result pages" className="mt-5 flex flex-wrap items-center justify-center gap-1">
            <button type="button" aria-label="Previous page" disabled={currentPage===1||loading} onClick={()=>setCurrentPage(currentPage-1)} className="min-h-9 rounded-md border bg-white px-3 text-sm disabled:opacity-40">Previous</button>
            {getPageNumbers(currentPage,totalPages).map((page,index)=>page==='...'?<span key={`gap-${index}`} className="px-2 text-slate-400">…</span>:<button type="button" key={page} aria-label={`Page ${page}`} aria-current={currentPage===page?'page':undefined} disabled={loading} onClick={()=>setCurrentPage(page)} className={`min-h-9 min-w-9 rounded-md border text-sm ${page===currentPage?'border-blue-600 bg-blue-600 text-white':'bg-white text-slate-600'}`}>{page}</button>)}
            <button type="button" aria-label="Next page" disabled={currentPage===totalPages||loading} onClick={()=>setCurrentPage(currentPage+1)} className="min-h-9 rounded-md border bg-white px-3 text-sm disabled:opacity-40">Next</button>
          </nav>}
        </div>

      </div>
    </>}
        <div className="contents">
          <OpportunityPreview showSummary={false} opportunity={selectedOpportunity} onApply={handleApply} onToggleSave={handleToggleSave} isApplied={appliedJobs.has(selectedOpportunity?.id)} isSaved={savedJobs.has(selectedOpportunity?.id)} isApplying={isApplying} needsProfileCompletion={needsProfileCompletion} missingFields={missingFields} completionPercentage={completionPercentage} profileCheckLoading={profileCheckLoading} profileCheckError={profileCheckError} onRetryProfile={onRetryProfile} navigate={navigate} learnerData={learnerData} canAccessOpportunities={canAccessOpportunities} onShowUpgradePrompt={()=>setShowUpgradePrompt(true)} detailsOpen={detailsOpen} onDetailsOpenChange={onDetailsOpenChange}/>
        </div>
  </div><aside aria-label="AI job matching" className="min-w-0 xl:sticky xl:top-24">
    <RecommendedJobs sidebar onResultsChange={onRecommendationsChange} learnerProfile={{...learnerData, profile:learnerData}} onSelectJob={onSelect} appliedJobs={appliedJobs} savedJobs={savedJobs} onToggleSave={handleToggleSave} onApply={onSelect}/>
  </aside></div>;
};

export default Opportunities;
